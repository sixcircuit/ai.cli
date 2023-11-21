
const { isString } = require('util');
const _ = require('./_.js');

const tiktoken = require("tiktoken");

const models = {};

const _list = {
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
   "gpt-4": "gpt-4-0613",
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

_.each.s(_list, function(m){
   if(typeof m !== "object"){ return; }

   m.price.tokens_in = function(count){ return((count / 1000) * this._1k_in); }
   m.price.tokens_out = function(count){ return((count / 1000) * this._1k_out); }
   m.price.in = function(messages){
      const count = count_tokens_from_gpt_input(messages);
      return this.tokens_in(count);
   };

   m.price.out = function(text){
      const count = m.to_tokens(text);
      return this.tokens_out(count);
   };

   m.price.total = function(messages_in, text_out){
      return this.in(messages_in) + this.out(text_out);
   };

});


models.get = function(key){

   let model = key;
   let loop = 0;

   do{ 
      if(loop++ > 10){ _.fatal("infinite loop in model aliases."); } 
      model = _list[model];
   }while(typeof model === "string");

   if(!model){ _.fatal(`can't find model named: ${key}.`); }

   model = _.merge({}, model);

   if(key.indexOf("gpt-3.5") === 0){ model.major = "3.5"; }
   else if(key.indexOf("gpt-4") === 0){ model.major = "4"; }
   else{ _.fatal(`only gpt-3 and gpt-4 is supported.`); }

   model.name = key;

   const text_decoder = new TextDecoder();

   model.token_encoder = tiktoken.encoding_for_model(model.name);

   model.to_tokens = function(str){ return this.token_encoder.encode(str); };
   model.from_tokens = function(tokens){ return text_decoder.decode(this.token_encoder.decode(tokens)); };
   model.count_tokens_from_messages = count_tokens_from_gpt_messages;

}

function count_tokens_from_gpt_messages(messages){
   // only works for gpt-3 and gpt-4

   let num_tokens = 0;

   _.each.s(message, function(m){
      num_tokens += 4; // every message follows <im_start>{role/name}\n{content}<im_end>\n
      num_tokens += encoding.encode(message.content).length;
      if(message.name){
         num_tokens -= 1; // role is always required and always 1 token
      }
   });

   num_tokens += 2; // every reply is primed with <im_start>assistant

   return(num_tokens);
}

module.exports = models;
