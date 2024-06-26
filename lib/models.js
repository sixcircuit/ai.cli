
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
      "gpt-3.5-turbo": "gpt-3.5-turbo-0125",
      "gpt-4": "gpt-4-0613",
      "gpt-4-turbo": "gpt-4-0125-preview",
      "gpt-3.5-turbo-0125": {
         version: "gpt-3.5-turbo-0125", max_input: 16_385, max_output: 4_096, training_data: "2021-09",
         price: { _1k_in: 0.0010, _1k_out: 0.0020 }
      },
      "gpt-4-0613": {
         version: "gpt-4-0613", max_input: 8_192, max_output: 8_192, training_data: "2021-09",
         price: { _1k_in: 0.03, _1k_out: 0.06 }
      },
      "gpt-4-0125-preview": {
         version: "gpt-4-0125-preview", max_input: 128_000, max_output: 4_096, training_data: "2023-04",
         price: { _1k_in: 0.01, _1k_out: 0.03 }
      },
      "gpt-4-vision-preview": {
         version: "gpt-4-vision-preview", max_input: 128_000, max_output: 4_096, training_data: "2023-04",
         has_vision: true,
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

      let model = _.resolve_alias(_list, key);

      if(!model){ return(null); }

      model = new model_class(model);

      _cache[key] = model;

      return(model);
   };

   models.base = function(){
      const out = {};
      _.each.s(_list, function(model, key){
         if(typeof model === "object"){
            out[key] = models.get(key);
         }
      });
      return(out);
   };

   models.list = function(){
      let list = {};
      // TODO: _.map.s

      _.each.s(_list, function(model, key){
         model = models.get(key);
         list[key] = model.version();
      });

      return(_.format.obj_table(list, { float: true, delim: " -> " }));
   };

   function model_class(opts){
      const self = this;

      this._key = opts.key || _.fatal("model needs key.");
      this._version = opts.version || _.fatal("model needs version.");
      this._max_input = opts.max_input || _.fatal("model needs max_input.");
      this._max_output = opts.max_output || _.fatal("model needs max_output.");
      this._training_data = opts.training_data || _.fatal("model needs training_data.");
      this._price = opts.price || _.fatal("model needs price.");
      this._quality_limit = opts.quality_limit || Math.floor(this.max_input() / 4);
      this._has_vision = opts.has_vision || false;

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

      this._price.input = function(count){ return((count / 1000) * this._1k_in); };
      this._price.output = function(count){ return((count / 1000) * this._1k_out); };
      this._price.max_input = function(){ return(this.input(self.max_input())); };
      this._price.max_output = function(){ return(this.output(self.max_output())); };
      this._price.max = function(){ return(this.max_input() + this.max_output()); };
   }

   model_class.prototype.key = function(){ return(this._key); };
   model_class.prototype.name = function(){ return(this._name); };
   model_class.prototype.label = function(){ return(this._name + ": "); };
   model_class.prototype.series = function(){ return(this._series); };
   model_class.prototype.version = function(){ return(this._version); };
   model_class.prototype.has_vision = function(){ return(this._has_vision); };
   model_class.prototype.max_input = function(){ return(this._max_input); };
   model_class.prototype.max_output = function(){ return(this._max_output); };
   model_class.prototype.quality_limit = function(){ return(this._quality_limit); };
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

   model_class.prototype.get_warnings =  function({ stats }){

      const warnings = [];

      const quality_limit = this.quality_limit();

      if(stats.input.token_length > quality_limit){
         warnings.push(`the model may lose track of facts in the middle of the context window. your number of input tokens: ${stats.input.token_length} is greater than the warning threshold for this model: ${quality_limit}. the total model context length is: ${model_total}. you used ${ _.format.percent(stats.input.token_length / model_total, 1) } of the total context. the warning threshold is ${ _.format.percent(quality_limit / model_total, 1) } of the total context.`);
      }

      return(warnings);
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

