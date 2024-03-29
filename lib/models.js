
const { isString } = require('util');
const _ = require('./_.js');

const tiktoken = require("tiktoken");

const models = {};

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
   v.name = k;
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

models.get = function(key){

   let model = key;
   let loop = 0;

   do{
      if(loop++ > 10){ _.fatal("infinite loop in model aliases."); }
      model = _list[model];
   }while(typeof model === "string");

   if(!model){ _.fatal(`can't find model named: ${key}.`); }

   model = _.merge(model);

   if(model.name.indexOf("gpt-3.5") === 0){
      model.short_name = "gpt-3.5";
      model.token_encoder = tiktoken.encoding_for_model("gpt-3.5-turbo");
   }else if(model.name.indexOf("gpt-4-turbo") === 0){
      model.short_name = "gpt-4-turbo";
      model.token_encoder = tiktoken.encoding_for_model("gpt-4-turbo");
   }else if(model.name.indexOf("gpt-4") === 0){
      model.short_name = "gpt-4";
      model.token_encoder = tiktoken.encoding_for_model("gpt-4");
   }else{ _.fatal(`only gpt-3 and gpt-4 is supported.`); }

   const text_decoder = new TextDecoder();

   model.to_tokens = function(str){ return this.token_encoder.encode(str); };
   model.from_tokens = function(tokens){ return text_decoder.decode(this.token_encoder.decode(tokens)); };
   model.count_tokens_from_messages = function(messages){
      return count_tokens_from_gpt_messages({ model: this, messages });
   };

   model.price.n_tokens_in = function(count){ return((count / 1000) * this._1k_in); }
   model.price.n_tokens_out = function(count){ return((count / 1000) * this._1k_out); }
   model.price.messages_in = function(messages){
      const count = model.count_tokens_from_messages(messages);
      return({ count, price: this.n_tokens_in(count) });
   };

   model.price.text_out = function(text){
      const count = model.to_tokens(text).length;
      return({ count, price: this.n_tokens_out(count) });
   };

   return(model);
}

function count_tokens_from_gpt_messages({ model, messages }){
   // only works for gpt-3 and gpt-4

   let num_tokens = 0;

   _.each.s(messages, function(message){
      num_tokens += 4; // every message follows <im_start>{role/name}\n{content}<im_end>\n
      num_tokens += model.to_tokens(message.content).length;
      if(message.name){
         num_tokens -= 1; // role is always required and always 1 token
      }
   });

   num_tokens += 2; // every reply is primed with <im_start>assistant

   return(num_tokens);
}

module.exports = models;
