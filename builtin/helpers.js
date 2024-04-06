const _ = require("../lib/_.js");
const _convo = require("../lib/convo.js");

function helpers_class(){

   const helpers = {};

   helpers.none = function(){ return _convo(); };
   helpers.none.description = "just an empty prompt";

   helpers.json = function(){ return _convo({ meta: { output: "json" } }); };
   helpers.json.description = "an empty prompt but the output should be json.";

   this._helpers = helpers;
}

helpers_class.prototype.get = function(key){ return _.resolve_alias(this._helpers, key); };
helpers_class.prototype.add = function(helpers){ this._helpers = _.merge(this._helpers, helpers); };
helpers_class.prototype.help = function(){ return JSON.stringify(Object.keys(this._helpers)); }
helpers_class.prototype.list = function(){
   const self = this;
   const list = {};
   // TODO: _.map.s
   _.each.s(this._helpers, function(helper, key){
      list[key] = self.get(key).description;
   });
   return(_.format.obj_table(list, { float: true, delim: " -> ", justify: "left" }));
};

module.exports = function(opts){ return(new helpers_class(opts)); };

