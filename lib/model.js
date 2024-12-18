
const _ = require('./_.js');

const _convo = require('./convo.js');

const tiktoken = require("tiktoken");

const _text_decoder = new TextDecoder();

function model_class(opts){
   const self = this;

   _.print("opts: ", opts);

   this._key = opts.key || opts.version || _.fatal("model needs key.");
   this._type = opts.type || _.fatal("model needs type.");
   this._version = opts.version || _.fatal("model needs version.");

   this._max_input = opts.max_input || _.fatal("model needs max_input.");
   this._max_output = opts.max_output || _.fatal("model needs max_output.");
   this._training_data = opts.training_data || _.fatal("model needs training_data.");
   this._price = opts.price || _.fatal("model needs price.");
   this._quality_limit = opts.quality_limit || Math.floor(this.max_input() / 4);
   this._has_vision = opts.has_vision || false;
   this._api_url = opts.api_url || null;
   this._api_key = opts.api_key || null;
   this._is_json = opts.is_json || false;
   this._is_local = opts.is_local || false;

   if(this.type() === "openai" && !this.api_key()){ _.fatal("missing api key for openai model type."); }

   if(this._key.indexOf("gpt-3.5") === 0){
      this._series = "gpt-3.5";
      this._tokenizer = tiktoken.encoding_for_model("gpt-3.5-turbo");
   }else if(this._key.indexOf("gpt-4-turbo") === 0){
      this._series = "gpt-4-turbo";
      this._tokenizer = tiktoken.encoding_for_model("gpt-4-turbo");
   }else if(this._key.indexOf("gpt-4") === 0){
      this._series = "gpt-4";
      this._tokenizer = tiktoken.encoding_for_model("gpt-4");
   }else if(this._key.indexOf("llama-3") === 0){
      this._series = this._key.split("-").slice(0,3).join("-");
      _.warn(`only gpt-3 and gpt-4 is supported for tokenization. you'll get incorrect (zero) pricing.`);
      this._tokenizer = {
         encode: function(s){ return([]); },
         decode: function(s){ return(""); }
      };
   }else{
      _.warn(`only gpt-3 and gpt-4 is supported for tokenization. you'll get incorrect (zero) pricing.`);
   }

   this._price.input = function(count){ return((count / 1000) * this._1k_in); };
   this._price.output = function(count){ return((count / 1000) * this._1k_out); };
   this._price.max_input = function(){ return(this.input(self.max_input())); };
   this._price.max_output = function(){ return(this.output(self.max_output())); };
   this._price.max = function(){ return(this.max_input() + this.max_output()); };
}

model_class.prototype.key = function(){ return(this._key); };
model_class.prototype.type = function(){ return(this._type); };
model_class.prototype.series = function(){ return(this._series); };
model_class.prototype.version = function(){ return(this._version); };
model_class.prototype.is_json = function(){ return(this._is_json); };
model_class.prototype.is_local = function(){ return(this._is_local); };
model_class.prototype.has_vision = function(){ return(this._has_vision); };
model_class.prototype.max_input = function(){ return(this._max_input); };
model_class.prototype.max_output = function(){ return(this._max_output); };
model_class.prototype.quality_limit = function(){ return(this._quality_limit); };
model_class.prototype.training_data = function(){ return(this._training_data); };
model_class.prototype.price = function(){ return(this._price); };


//model_class.prototype.label = function(){ return(this._series + (this.is_json() ? "-json" : "") + ": "); };
model_class.prototype.label = function(){ return(this._series + ": "); };

model_class.prototype.tokenizer = function(){ return this._tokenizer; };

model_class.prototype.api_key = function(){ return(this._api_key); };
model_class.prototype.api_url = function(){ return(this._api_url); };
model_class.prototype.client = function(){ return require("./client.js")(this); };

model_class.prototype.str_to_tokens = function(str){ return this._tokenizer.encode(str); };
model_class.prototype.tokens_to_str = function(tokens){ return _text_decoder.decode(this._tokenizer.decode(tokens)); };
model_class.prototype.tokenize = function(convo){
   const self = this;

   const messages = [];

   const tokenized = {
      messages, token_length: 0,
      price_in: 0, price_out: 0
   };

   _.each.s(convo.messages(), function(message){
      const tokens = self.str_to_tokens(convo.message_to_text(message));
      const token_length = tokens.length + self.message_token_overhead();
      tokenized.token_length += token_length;
      messages.push(_.merge(message, {
         tokens, token_length,
         price_in: self.price().input(token_length),
         price_out: self.price().output(token_length),
      }))
   });

   tokenized.price_in = self.price().input(tokenized.token_length);
   tokenized.price_out = self.price().output(tokenized.token_length);

   return(tokenized);
};

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

   const response = await this.client().stream({ model: this, messages, request, on_data: function(chunk){
      on_data({ chunk });
   }});

   const output = _convo({ model: this.key(), timestamps: [_.timestamp()], messages: [{ role: "assistant", content: response.content }] });

   return({ output, response });
};

module.exports = function(opts){ return(new model_class(opts)); };

