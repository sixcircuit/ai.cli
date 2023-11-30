
const console_class = require("./console.js");

const ai_class = function(opts){ 
   this._plugins = {};
   this._console = new console_class({ n_gutter: 8 });
};

ai_class.prototype.plugins = function(key){
   if(_.is_def(key)){ return this._plugins[key] || _.fatal("no plugin for key: " + _.quote(key)); };
   return this._plugins;
}

ai_class.prototype.console = function(){

};

module.exports = function(opts){ return(new ai_class(opts)); };

