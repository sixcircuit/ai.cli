const { warn } = require("console");
const _ = require("../lib/_.js");
const _models = require("../lib/models.js");

function convo_class(hash){ this.$in(hash); }

convo_class.prototype.$in = function(hash){
   if(typeof hash === "string"){ hash = JSON.parse(hash); }

   hash = hash || {};

   this._model = hash.model || null;
   this._timestamps = hash.timestamps || [];
   this._meta = hash.meta || {};
   this._messages = hash.messages || [];
   this._set_model(hash.model);
};

convo_class.prototype.timestamps = function(){ return(this._timestamps); }

convo_class.prototype._set_model = function(m){
   if(typeof m === "string"){ this._model = _models.get(m); }
   else{ this._model = m; }
};

convo_class.prototype.model = function(m){
   if(m){ this._set_model(m); }
   return(this._model);
};

convo_class.prototype.meta = function(obj){
   if(obj !== undefined){
      this._meta = _.merge(this._meta, obj);
   }
   return(this._meta);
};

convo_class.prototype.$out = function(){
   return({
      timestamps: this._timestamps,
      model: (this._model && this._model.key) || null,
      meta: this._meta,
      messages: this._messages
   });
};

convo_class.prototype.$json = function(){ return(_.stringify(this.$out())); };

convo_class.prototype.messages = function(){ return(this._messages); };

convo_class.prototype.tokenize = function(){
   const model = this._model || _.fatal("model is not defined for this conversation.");

   const messages = [];

   const tokenized = {
      messages, token_length: 0,
      price_in: 0, price_out: 0
   };

   _.each.s(this._messages, function(message){
      const tokens = model.str_to_tokens(convo_class.message_to_text(message));
      const token_length = tokens.length + model.message_token_overhead();
      tokenized.token_length += token_length;
      messages.push(_.merge(message, {
         tokens, token_length,
         price_in: model.price().input(token_length),
         price_out: model.price().output(token_length),
      }))
   });

   tokenized.price_in = model.price().input(tokenized.token_length);
   tokenized.price_out = model.price().output(tokenized.token_length);

   return(tokenized);
};


convo_class.prototype.$format = function(type){
   if(type === "text"){ return this._format_to_text(); }
   else if(type === "comments"){ return this._format_to_comments(); }
};

convo_class.prototype._format_to_comments = function(){

   const messages = [];

   if(_.keys(this.meta()).length){ messages.push("// meta: ", JSON.stringify(this.meta())); }

   _.each.s(this._format_to_text(true), function(m){
      messages.push("// " + m);
   });

   return(messages.join("\n"));
};

convo_class.prototype.is_empty = function(){ return(this._messages.length === 0); };

convo_class.prototype._format_to_text = function(as_array){
   const messages = this._messages.map(function(m){
      if(m.name){
         return(m.name + ": " + m.content);
      }else{
         return(m.role + ": " + m.content);
      }
   });
   if(as_array){ return(messages); }
   else{ return(messages.join("\n")); }
};

convo_class.prototype.role = function(role, messages){
   const self = this;

   if(!messages){ messages = [""]; }

   if(!Array.isArray(messages)){ messages = [messages]; }

   messages = messages.map(function(m){
      return({ role, content: convo_class.message_to_text(m) });
   });

   self._messages = self._messages.concat(messages);

   return(self);
};

convo_class.prototype.add = function(messages){
   const self = this;

   if(!Array.isArray(messages)){ messages = [messages]; }

   messages.map(function(m){
      if(m && m.content && m.role){
         self._messages.push(m);
      }else{
         _.fatal(`every message must have a "role" and a "content" property. we got: `, _.format.pretty_obj(m));
      }
   });

   return(self);
};

convo_class.message_to_text = function(message){
   if(typeof message === "string"){ return(message); }
   else if(typeof message === "object" && message.content){ return(message.content); }
   else{ _.fatal(`message must be text or an object with a "content" property. we got: `, _.format.pretty_obj(message)); }
};

module.exports = _.assign(function(hash){ return(new convo_class(hash)); }, convo_class);

