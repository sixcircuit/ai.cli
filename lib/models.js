
module.exports = function(opts){

   const _ = require('./_.js');

   const _convo = require('./convo.js');

   const openai = require("./openai.js")(opts.openai);

   const tiktoken = require("tiktoken");

   const models = {};

   const _text_decoder = new TextDecoder();

   const _list = {
      "3": "gpt-3.5-turbo",
      "4": "gpt-4",
      "4t": "gpt-4-turbo",
      "4tv": "gpt-4-vision-preview",
      "35t": "gpt-3.5-turbo",
      "gpt-4": "gpt-4-0613",
      "gpt-4-turbo": "gpt-4-1106-preview",
      "gpt-4-1106-preview": {
         version: "gpt-4-1106-preview", context_window: 128_000, training_data: "2023-04",
         price: { _1k_in: 0.01, _1k_out: 0.03 }
      },
      "gpt-4-vision-preview": {
         version: "gpt-4-vision-preview", context_window: 128_000, training_data: "2023-04",
         vision: true,
         price: {
            _1k_in: 0.01, _1k_out: 0.03,
            image_in: function(w, h){
               const h_tiles = 1 + (Math.ceil((h - 512) / 512));
               const w_tiles = 1 + (Math.ceil((w - 512) / 512));
               const base_tokens = 85;
               const tile_tokens = 170 * (h_tiles * w_tiles)
               const total_tokens = (base_tokens + tile_tokens);
               const price = ((total_tokens / 1000) * this._1k_in);
               return(price);
            }
         }
      },
      "gpt-4-0613": {
         version: "gpt-4-0613", context_window: 8_192, training_data: "2021-09",
         price: { _1k_in: 0.03, _1k_out: 0.06 }
      },
      "gpt-4-32k": "gpt-4-32k-0613",
      "gpt-4-32k-0613": {
         version: "gpt-4-32k-0613", context_window: 32_768, training_data: "2021-09",
         price: { _1k_in: 0.06, _1k_out: 0.12 }
      },
      "gpt-3.5-turbo": "gpt-3.5-turbo-1106",
      "gpt-3.5-turbo-16k": "gpt-3.5-turbo-1106",
      "gpt-3.5-turbo-1106": {
         version: "gpt-3.5-turbo-1106", context_window: 16_385, training_data: "2021-09",
         price: { _1k_in: 0.0010, _1k_out: 0.0020 }
      },
      "gpt-3.5-turbo-instruct": {
         version: "gpt-3.5-turbo-instruct", context_window: 4_096, training_data: "2021-09",
         price: { _1k_in: 0.0015, _1k_out: 0.0020 }
      },
   };

   _.each.s(_list, function(v, k){
      if(typeof v !== "object"){ return; }
      v.key = k;
   });


   models.help = function(){
      const help = { models: [], aliases: {} };
      _.each.s(_list, function(v, k){
         if(typeof v === "string"){
            help.aliases[k] = v;
         }else if(typeof v === "object"){
            help.models.push(k);
         }else{
            _.fatal("unknown model type: ", v);
         }
      });
      return(help);
   };

   const _cache = {};

   models.get = function(key){
      if(_cache[key]){ return _cache[key]; }

      let model = key;
      let loop = 0;

      do{
         if(loop++ > 10){ _.fatal("infinite loop in model aliases."); }
         model = _list[model];
      }while(typeof model === "string");

      if(!model){ _.fatal(`can't find model named: ${key}.`); }

      model = new model_class(model);

      _cache[key] = model;

      return(model);

   };

   function model_class(opts){
      this._key = opts.key || _.fatal("model needs key.");
      this._version = opts.version || _.fatal("model needs version.");
      this._context_window = opts.context_window || _.fatal("model needs context_window.");
      this._training_data = opts.training_data || _.fatal("model needs training_data.");
      this._price = opts.price || _.fatal("model needs price.");

      if(this._key.indexOf("gpt-3.5") === 0){
         this._series = "gpt-3.5";
         this._tokenizer = tiktoken.encoding_for_model("gpt-3.5-turbo");
      }else if(this._key.indexOf("gpt-4-turbo") === 0){
         this._series = "gpt-4-turbo";
         this._tokenizer = tiktoken.encoding_for_model("gpt-4-turbo");
      }else if(this._key.indexOf("gpt-4") === 0){
         this._series = "gpt-4";
         this._tokenizer = tiktoken.encoding_for_model("gpt-4");
      }else{ _.fatal(`only gpt-3 and gpt-4 is supported.`); }

      if(!this._name){ this._name = this._series; }

      this._price.tokens_in = function(count){ return((count / 1000) * this._1k_in); };
      this._price.tokens_out = function(count){ return((count / 1000) * this._1k_out); };
   }

   model_class.prototype.key = function(){ return(this._key); };
   model_class.prototype.name = function(){ return(this._name); };
   model_class.prototype.label = function(){ return(this._name + ": "); };
   model_class.prototype.series = function(){ return(this._series); };
   model_class.prototype.version = function(){ return(this._version); };
   model_class.prototype.context_window = function(){ return(this._context_window); };
   model_class.prototype.training_data = function(){ return(this._training_data); };
   model_class.prototype.price = function(){ return(this._price); };

   model_class.prototype.tokenizer = function(){ return this._tokenizer; };

   model_class.prototype.str_to_tokens = function(str){ return this._tokenizer.encode(str); };
   model_class.prototype.tokens_to_str = function(tokens){ return _text_decoder.decode(this._tokenizer.decode(tokens)); };

   // this is only an estimate. probably an upper estimate. it may be off by a few tokens depending on the model.
   // i can't guarantee i'll keep up with the changes all the time. so the guarantee is that it's close.
   // i don't expect them to change the format such that the token overhead is much higher than 4 tokens per message.
   // it might be over by a token or two when it counts output messages.
   // every message follows <im_start>{role || name}\n{content}<im_end>\n
   model_class.prototype.message_token_overhead = function(){ return(4); }

   model_class.prototype.warn_about_context_window =  function({ token_length }){
      const context_warning_limit = this.context_warning_limit || -1;
      if(this.context_window < context_warning_limit){ return; }

      const model_total = this.context_window;

      const model_limit = (model_total / 4);

      if(token_length > model_limit){
         const warning = `warning: input token count (${token_length}) exceeds model warning limit (${model_limit}) of total model context length (${model_total}). the model may lose track of facts in the middle of the window.`;
         _.print("");
         _.print(_.color_256(_colors.warning, warning))
         _.print("");
      }
   };

   model_class.prototype.stream = async function({ input, on_data }){
      const request = {};
      const messages = input.messages();

      if(input.meta().output === "json"){ request = { response_format: { "type": "json_object" } }; }

      const response = await openai.stream({ model: this, messages, request, on_data: function(chunk){
         on_data({ chunk });
      }});

      const output = _convo({ model: this, timestamps: [_.timestamp()], messages: [{ role: "assistant", content: response.content }] });

      return({ output, response });
   };

   return(models);
};

