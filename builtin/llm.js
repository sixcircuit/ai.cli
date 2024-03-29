
module.exports = function({ _, ai, config }){

   const llm = { name: "llm", config };

   // const _helpers = require("../lib/helpers.js")(config.helpers);

   llm.helpers = function(){
      // STUB
      return({
         add: function(){}
      });
   }

   const _context_warning_limit = -1;
   // const _context_warning_limit = 8192;

   function warn_about_context_window({ model, token_count }){
      if(model.context_window < _context_warning_limit){ return; }

      const model_total = model.context_window;

      const model_limit = (model_total / 4);

      if(token_count > model_limit){
         const warning = `warning: input token count (${token_count}) exceeds model warning limit (${model_limit}) of total model context length (${model_total}). the model may lose track of facts in the middle of the window.`;
         _.print("");
         _.print(_.color_256(_colors.warning, warning))
         _.print("");
      }
   }

   async function do_llm({ model, messages, request }){
      const start = Date.now();

      _.print("");

      const model_label = (model.short_name + ":");

      const n_gutter = _.max("system:".length, model_label.length) + 1;
      const n_wrap = 80;

      const chat = messages.map(function(v){
         const label = (v.role + ":");

         const wrapper = _.text_wrapper({
            n_wrap,
            n_gutter,
            // n_gutter: (label.length + 1),
            n_leading: label.length,
         });

         const content = wrapper.once({ chunk: v.content });

         return(_.color_256(_colors[v.role], label) + content);

      }).join("\n\n");

      const input_token_count = model.count_tokens_from_messages(messages);

      warn_about_context_window({ model, token_count: input_token_count });

      _.stdout.write(chat);

      _.print("");
      _.print("");

      _.stdout.write(_.color_256(_colors["model"],  model_label));

      const wrapper = _.text_wrapper({
         n_wrap,
         n_gutter,
         // n_gutter: (model_label.length + 1)
         n_leading: model_label.length,
      });

      const chunks = [];

      // TODO: refactor this into the model class itself.

      const openai = require("../lib/openai.js")(config.openai);

      const { content: output } = await openai.stream({ model, messages, request, out_f: function(chunk){
         chunks.push(chunk);
         // _.stdout.write(chunk + "|");
         _.stdout.write(wrapper.stream({ chunk }));
      }});

      _.stdout.write(wrapper.flush());

      const price_in = model.price.messages_in(messages);
      const price_out = model.price.text_out(output);

      _.print("");
      _.print("");

      const table = {
         "took": ((Date.now() - start) + "ms"),
         "tokens (input)": _.to_k(price_in.count),
         "tokens (output)": _.to_k(price_out.count),
         "price (input)": _.format.dollars(price_in.price),
         "price (output)": _.format.dollars(price_out.price),
         "price (total)": _.format.dollars(price_in.price + price_out.price),
         "model (version)": model.short_name,
      };

      let max_label = 0;
      let max_value = 0;

      _.each.s(table, function(v, k){
         max_label = Math.max(k.length, max_label);
         max_value = Math.max((v+"").length, max_value);
      });

      _.each.s(table, function(v, k){
         _.print(k.padEnd(max_label) + " : ", (v + "").padStart(max_value));
      });

      _.print("");

      // TODO: use dry.baseline _.os.copy once it's implemented;

      // llm_cli | tee >(pbcopy)

      _.pbcopy(output, function(err){
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

      if(!prompt){ prompt = await get_prompt(_helpers.to_editor_text(helper)); }

      let messages = null;
      let request = null;

      if(prompt){ ({ messages, request } = helper(prompt)); }

      return({ model, messages, request });
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

      const { model, messages, request } = await handle_options(args);

      if(!messages){ return _.stdout("empty prompt. canceling."); }

      // return debug({ model, messages });

      await do_llm({ model, messages, request });

      const console = ai.console();

      console.reset({ gutter: 8 });

      console.turn("user", "12: "); console.stream({ chunk: "hello\nhello\nhello", flush: true, new_line: true });

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
