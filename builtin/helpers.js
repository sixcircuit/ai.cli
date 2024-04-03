const _ = require("../lib/_.js");
const _convo = require("../lib/convo.js");

function helpers_class(){
   this._helpers = {
      none: function(prompt){ return _convo(); },
      json: function(prompt){ return _convo({ meta: { output: "json" } }); },
   };
}

helpers_class.prototype.get = function(key){ return this._helpers[key]; };
helpers_class.prototype.add = function(helpers){ this._helpers = _.merge(this._helpers, helpers); };
helpers_class.prototype.help = function(){ return JSON.stringify(Object.keys(this._helpers)); }

module.exports = function(opts){ return(new helpers_class(opts)); };

