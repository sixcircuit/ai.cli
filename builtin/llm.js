
module.exports = function({ _, ai, config }){

   const _convo = require("../lib/convo.js");
   const _helpers = require("./helpers.js")();

   const _console = ai.console();

   const llm = { name: "llm", config };

   llm.convo = function(opts){ return _convo(opts); };
   llm.helpers = function(){ return(_helpers); }

   async function stream_output({ colors, input, model }){
      colors = colors || { role: "assistant" };
      // colors = colors || { role: "assistant", message: "assistant" };

      _console.turn({ color: colors.role, label: model.label() });

      const result = await model.stream({ input, on_data: function({ chunk }){
         _console.stream({ color: colors.message, chunk });
      }});

      _console.flush({ color: colors.message, new_line: true });

      return(result);
   }

   function show_stats({ stats }){

      // const table = {
      //    // "model": stats.model.version + "\n",
      //    // "model (series)": stats.model.series,
      //    "tokens in": _.to_k(stats.input.token_length),
      //    "price in": _.format.dollars(stats.input.price) + "\n",
      //    "tokens out": _.to_k(stats.output.token_length),
      //    "price out": _.format.dollars(stats.output.price) + "\n",
      //    "price": _.format.dollars(stats.price) + "\n",
      //    "took": (stats.took + "ms"),
      // };

      // const chunk = _.format.obj_table(table);

      // _console.turn({ color: "stats", label: "model: " });
      // _console.flush({ chunk: stats.model.version, new_line: true });

      const token_table = _.format.obj_table({
         // "took": (stats.took + "ms"),
         // "model": stats.model.version,
         // "endl_0": null,
         "in": _.to_k(stats.input.token_length) + ` tok @ ${_.format.dollars(stats.input.price)}`,
         "out": _.to_k(stats.output.token_length) + ` tok @ ${_.format.dollars(stats.output.price)}`,
         "endl_1": null,
         "total": _.to_k(stats.token_length) + ` tok @ ${ _.format.dollars(stats.price) }`,
      });

      _console.label({ color: "stats", label: "took: " });
      _console.flush({ chunk: (stats.took + "ms") });

      _console.label({ color: "stats", label: "model: " });
      _console.flush({ chunk: stats.model.version });

      // _console.label({ color: "stats", label: "tokens: " });
      // _console.flush({ chunk: `${_.to_k(stats.input.token_length)} / ${_.to_k(stats.output.token_length)}` });

      // _console.label({ color: "stats", label: "price: " });
      // _console.flush({ chunk: `${_.format.dollars(stats.input.price)} / ${_.format.dollars(stats.output.price)}` });

      _console.label({ color: "stats", label: "in: " });
      _console.flush({ chunk: `${_.format.dollars(stats.input.price)} (${_.to_k(stats.input.token_length)} tokens)` });

      _console.label({ color: "stats", label: "out: " });
      _console.flush({ chunk: `${_.format.dollars(stats.output.price)} (${_.to_k(stats.output.token_length)} tokens)` });

      _console.label({ color: "stats", label: "total: " });
      _console.flush({ color: null, chunk: `${_.format.dollars(stats.price)} (${_.to_k(stats.token_length)} tokens)` });

      // _console.turn({ color: "stats", label: "stats: " });
      // _console.flush({ chunk: token_table, new_line: true });

      // const price_table = _.format.obj_table({
      //    "in": ,
      //    "out":
      //    "total":
      // });

      // _console.turn({ color: "stats", label: "price: " });
      // _console.flush({ chunk: price_table, new_line: true });

      // _console.turn({ role: "stats" });
      // _console.flush({ chunk, new_line: true });
   }

   function make_stats({ start, end, input, output, model }){

      const input_stats = input.tokenize();
      const output_stats = output.tokenize();

      function _stat(s, io){
         return({
            price: s["price_" + io],
            token_length: s.token_length
         });
      }

      const stats = {
         took: (end - start),
         input: _stat(input_stats, "in"),
         output: _stat(output_stats, "out"),
         price: (input_stats.price_in + output_stats.price_out),
         token_length: (input_stats.token_length + output_stats.token_length),
         model: { version: model.version(), series: model.series() }
      };

      return(stats);
   }

   function show_warnings({ stats, model }){
      const warnings = model.get_warnings({ stats });

      if(!warnings.length){ return; }

      _console.ensure_new_line();
      _console.new_line();

      const color = "warning";

      _.each.s(warnings, function(w){
         _console.turn({ color, label: "warn: " });
         _console.flush({ color, chunk: w, new_line: true });
      });
      _console.new_line();
   }

   function print_input({ input }){
      _.each.s(input.messages(), function(m){
         _console.turn({ role: m.role });
         // _console.flush({ color: m.role, chunk: m.content });
         _console.flush({ chunk: m.content });
      });
      _console.ensure_new_line();
   }

   async function copy_to_clipboard({ output }){
      // llm_cli | tee >(pbcopy)

      // TODO: use dry.baseline _.os.copy once it's implemented;
      try{
         await _.pbcopy(output.$format("text"));
         _console.turn({ role: "info" });
         _console.flush({ chunk: "(response was copied to the clipboard)", new_line: true });
      }catch(err){
         _console.turn({ role: "error" });
         _console.flush({ chunk: "(error copying to clipboard. you're probably on a platform without pbcopy. feel free to open a pull request to support your platform.)", new_line: true });
      }
   }

   function save_history({ input, output, stats, model }){

   }

   async function do_llm({ model, input, request }){
      const start = Date.now();

      _console.reset({ wrap: 80, labels: ["user: ", "system: ", model.label()], padding: 1, right: true });

      print_input({ input });

      _console.new_line();

      const { output } = await stream_output({ input, model });

      const end = Date.now();

      _console.new_line();

      const stats = make_stats({ start, end, input, output, model });

      show_stats({ stats });

      save_history({ input, output, stats, model });

      show_warnings({ model, stats });

      await copy_to_clipboard({ output });

      _console.ensure_new_line();
      _console.new_line();

      _console.flush();
   }

   async function handle_options(argv){

      let helper = _helpers.get("default");
      let model_name = argv.shift();
      let prompt = "";

      if(!model_name || model_name === "help" || model_name === "--help"){ return llm.help(); }

      if(model_name === "cont"){ _.fatal("cont not implemented"); }

      const model = ai.models().get(model_name);

      if(!model){
         _.print("unknown model type: ", model_name, " you must pick a model or alias in the list below.");
         return llm.help();
      }

      if(argv.length){
         const helper_name = argv.shift();
         helper = _helpers.get(helper_name);
         prompt = argv.join(" ").trim();
         if(!helper){
            _.print(`unknown helper "`, helper_name, `": need one in the list below.`);
            return llm.help();
         }else{
            _.print("helper: ", helper);
         }
      }

      if(!prompt){
         prompt = await ai.open_editor({ text: helper().$format("comments") });
      }

      let input = null;

      if(prompt){ input = helper().role("user", prompt); }
      else{ input = llm.convo(); }

      input.model(model);

      return({ model, input });
   }


   function round_trip_test({ model, text }){

      const tokens = model.to_tokens(text);
      const decode = model.from_tokens(tokens);

      _.print(`tokens.length : `, tokens.length);
      _.print(`tokens.encoded: "`, JSON.stringify(tokens), `"`);
      _.print(`tokens.decoded: "`, decode, `"`);
      _.print(`tokens.source : "`, text, `"`);
   }

   function debug({ model, messages }){

      _.print("model: ", model);
      _.print("messages: ", messages);

      const prompt = messages[messages.length-1].content;

      _.print("price.in: ", model.price.messages_in(messages));

      const str_out = "hello! how can I help you?"

      _.print(`text.out: "`, str_out, `"`);
      _.print("price.out: ", model.price.text_out(str_out));
   }


   llm.run = async function(args){

      // return round_trip_test({ model: ai.models().get("gpt-4"), text: "this is a test message." });

      const { model, input } = await handle_options(args);

      if(input.is_empty()){ return _.stdout("empty prompt. canceling."); }

      // return debug({ model, messages });

      await do_llm({ model, input });
   };

   llm.help = function(no_exit){

      _.print("usage: llm <model | alias | cont> [<helper_name> [prompt]]");
      _.print("helpers: ", _helpers.help());
      _.print("aliases: ", _.format.pretty_obj(ai.models().help().aliases));
      _.print("models: ", _.format.pretty_obj(ai.models().help().models));
      _.print("helpers: ", _helpers.help());

      if(no_exit){ return; }

      process.exit(1);
   };

   ai.register(llm);
};
