
module.exports = function({ _, ai, config, user_config }){

   const model_class = require("../lib/model.js");

   const plugin = {
      name: "models",
      config
   };

   const models = {};

   const _base = {};
   const _alias = {};

   models.add = function(m){
      if(_.is_ary(m)){ return _.each.s(m, models.add); }

      let user_opts;
      if(m.type){ user_opts = user_config?.models?.[m.type]; }

      const model = new model_class(_.merge(user_opts, m));

      if(_base[model.key()]){ _.fatal(`model with key: "${model.key()}" already exists.`); }

      _base[model.key()] = model;
      _alias[model.key()] = model.key();

      return(model);
   };

   models.alias = function(hash){
      if(hash === undefined){ return _.merge(_alias); }
      _.each.s(hash, function(to, from){
         if(_base[from]){ _.fatal(`can't redefine base model key with an alias. that's madness. tried with: "${from}".`); }
         if(_alias[from]){ _.warn(`redefining alias: "${from}". old("${_alias[from]}") -> new("${to}").`); }
         _alias[from] = to;
      });
   };

   models.help = function(){ return { models: _.keys(_base), aliases: _.merge(_alias) }; };

   const _cache = {};

   models.get = function(key){
      if(_cache[key]){ return _cache[key]; }

      key = _.resolve_alias(_alias, key);
      const model = _base[key];

      if(!model){ return(null); }

      _cache[key] = model;

      return(model);
   };

   models.base = function(){ return _.merge(_base); };

   models.list = function(){
      let list = {};
      // TODO: _.map.s

      _.each.s(_alias, function(key){
         model = models.get(key);
         list[key] = model.version();
      });

      return(_.format.obj_table(list, { float: true, delim: " -> " }));
   };


   plugin.payload = models;


   const _cmds = {};

   _cmds.stats = function(args){

      _.stdout("");

      _.each.s(models.base(), function(model){

         _.stdout(model.version());
         _.stdout("-".repeat(model.version().length));

         _.stdout("  prices: (max: ", _.format.dollars(model.price().max()), ")");
         _.stdout([
            "    in / out  (1k): " + _.format.dollars(model.price().input(1_000), 2) + " / " + _.format.dollars(model.price().output(1_000), 2),
            "    in / out (max): " + _.format.dollars(model.price().max_input(), 2) + " / " + _.format.dollars(model.price().max_output(), 2),
         ].join("\n"));

         _.stdout("  limits:");
         _.stdout([
            "    in   (quality): " + _.to_k(model.quality_limit()),
            "    in / out (max): " + _.to_k(model.max_input()) + " / " + _.to_k(model.max_output()),
         ].join("\n"));

         if(model.has_vision()){ _.stdout("  vision: " + model.has_vision()); }

         _.stdout("");
      });
   };

   plugin.run = async function(args){
      return await _.run_cmd(_cmds, args, "stats")
   };

   plugin.help = _cmds.help = function(){ _.print("usage: models [stats]"); };
   plugin.description = function(args){ return("allows management and info about the AI models available to you in this program."); };


   ai.register(plugin);
};
