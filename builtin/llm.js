
module.exports = function({ _, ai, config }){

   const _convo = require("../lib/convo.js");
   const _helpers = require("./helpers.js")();

   const _console = ai.console();

   const llm = { name: "llm", config };

   llm.convo = function(opts){ return _convo(opts); };
   llm.helpers = function(){ return(_helpers); }

   async function do_llm({ model, input, request }){
      const start = Date.now();

      _.print("");

      const model_label = (model.name() + ": ");
      const gutter = _.max("system: ".length, model_label.length);

      _.print("gutter: ", gutter);

      _console.reset({ wrap: 80, gutter });

      const input_stats = input.tokenize();

      model.warn_about_context_window({ token_length: input_stats.token_length });

      _.each.s(input.messages(), function(m){
         _console.turn({ role: m.role });
         // _console.once({ color: m.role, chunk: m.content });
         // _console.flush({ color: m.role, chunk: m.content });
         _console.flush({ chunk: m.content });
      });

      _.stdout("");

      _console.turn({ color: "assistant", label: model_label });

      const { output, response } = await model.stream({ input, on_data: function({ chunk }){
         // _console.stream({ color: "assistant", chunk });
         _console.stream({ chunk });
      }});

      _console.flush({ new_line: true });

      const output_stats = output.tokenize();

      _.stdout("");

      const table = {
         "took": ((Date.now() - start) + "ms"),
         "tokens (input)": _.to_k(input_stats.token_length),
         "tokens (output)": _.to_k(output_stats.token_length),
         "price (input)": _.format.dollars(input_stats.price_in),
         "price (output)": _.format.dollars(output_stats.price_out),
         "price (total)": _.format.dollars(input_stats.price_in + output_stats.price_out),
         "model (series)": model.series(),
      };

      _.stdout(_.format.obj_table(table));

      _.print("");

      // TODO: use dry.baseline _.os.copy once it's implemented;

      // llm_cli | tee >(pbcopy)

      console.dir(response);

      _.pbcopy(output.$format("text"), function(err){
         if(err){ _.print("(error copying to clipboard. you're probably on a platform without pbcopy. feel free to open a pull request to support your platform.)"); }
         else{ _.print("(response was copied to the cliboard)"); }
      });
   }

   async function handle_options(argv){

      let helper = _helpers.get("default");
      let model_name = argv.shift();
      let prompt = "";

      if(!model_name || model_name === "help" || model_name === "--help"){ return help(); }

      if(model_name === "cont"){ _.fatal("cont not implemented"); }

      const model = ai.models().get(model_name);

      if(!model){
         _.print("unknown model type: ", model_name, " you must pick a model or alias in the list below.");
         return help();
      }

      if(argv.length){
         const helper_name = argv.shift();
         helper = _helpers.get(helper_name);
         prompt = argv.join(" ").trim();
         if(!helper){
            _.print(`unknown helper "`, helper_name, `": need one in the list below.`);
            return help();
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
      _.print("aliases: ", _.format.pretty_obj(ai.models.help().aliases));
      _.print("models: ", _.format.pretty_obj(ai.models.help().models));
      _.print("helpers: ", _helpers.help());

      if(no_exit){ return; }

      process.exit(1);
   };

   ai.register(llm);
};
