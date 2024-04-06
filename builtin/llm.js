
module.exports = function({ _, ai, config }){

   const _convo = require("../lib/convo.js");
   const _helpers = require("./helpers.js")();

   const _console = ai.console();

   const llm = { name: "llm", config };

   llm.description = function(args){ return("provides a variety of text-to-text llm chatbot functionality."); };

   llm.convo = function(opts){ return _convo(opts); };
   llm.helpers = function(){ return(_helpers); }

   llm.run = async function(args){

      // return round_trip_test({ model: ai.models().get("gpt-4"), text: "this is a test message." });

      const { model, input, cancel } = await handle_options(args);

      if(cancel){ return; }

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

      _console.label({ color: "stats", label: "took: " });
      _console.flush({ chunk: (stats.took + "ms") });

      _console.label({ color: "stats", label: "model: " });
      _console.flush({ chunk: stats.model.version });

      _console.label({ color: "stats", label: "in: " });
      _console.flush({ chunk: `${_.format.dollars(stats.input.price)} (${_.to_k(stats.input.token_length)} tokens)` });

      _console.label({ color: "stats", label: "out: " });
      _console.flush({ chunk: `${_.format.dollars(stats.output.price)} (${_.to_k(stats.output.token_length)} tokens)` });

      _console.label({ color: "stats", label: "total: " });
      _console.flush({ color: null, chunk: `${_.format.dollars(stats.price)} (${_.to_k(stats.token_length)} tokens)` });
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

   async function get_model(model_name){

      model_name = model_name || await _.fzf({ list: ai.models().list() });

      if(!model_name){ return _.null( _.stderr("model selection canceled. not lemming.") ); }

      _.stderr("model name: ", _.quote(model_name));

      const model = ai.models().get(model_name);

      if(!model){
         _.stderr("unknown model type: ", model_name, " you must pick a model in the list below.");
         return _.null( llm.help() );
      }

      return(model);
   }

   async function get_helper(helper_name){

      helper_name = helper_name || await _.fzf({ list: llm.helpers().list() });

      if(!helper_name){ return _.null( _.stderr("helper selection canceled. not lemming.") ); }

      const helper = llm.helpers().get(helper_name);

      if(!helper){
         _.stderr("unknown helper type: ", helper_name, " you must pick a helper in the list below.");
         return _.null( llm.help() );
      }

      return(helper);
   }

   async function handle_options(argv){

      const cmd = argv.shift();

      if(cmd === "help"){ return llm.help(); }
      if(cmd === "continue"){ _.fatal("continue not implemented"); }

      const model = await get_model(cmd);

      if(!model){ return({ cancel: true }); }

      const helper = await get_helper(argv.shift());
      if(!helper){ return({ cancel: true }); }

      let prompt;

      if(argv.length){ prompt = argv.join(" ").trim(); }

      if(!prompt){ prompt = await ai.open_editor({ text: helper().$format("comments") }); }

      if(!prompt){
         _.stdout("empty prompt. not lemming.");
         return({ cancel: true });
      }

      const input = helper().role("user", prompt);

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



   ai.register(llm);
};
