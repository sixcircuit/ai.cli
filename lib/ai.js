
const fs = require("fs");

const _ = require("./_.js");

const src_root = function(...path){ return _.path.resolve(__dirname + "/../" + path.join("/")); };

const ai_class = function(opts){
   opts = opts || {};

   this._config = opts;
   this._plugins = {};
   this._config_root = opts.config_root || _.fatal("missing config root.");

   const root = function(path){ return src_root("./builtin/", path); };
   //const root = function(path){ return("../builtin/", path); };

   const plugins = [
      root("console.js"),
      root("editor.js"),
      root("models.js"),
      root("models.openai.js"),
      root("llm.js"),
      root("test.js")
   ].concat(opts.plugins || []);

   this._load_plugins(plugins, opts);
};

ai_class.prototype.plugins = function(key){
   if(_.is_def(key)){ return this._plugins[key] || _.throw("no_plugin", "no plugin for key: ", _.quote(key)); };
   return this._plugins;
};

ai_class.prototype.config_root = function(...path){ return _.path.join(this._config_root, ...path); };

ai_class.prototype.register = function(plugin){

   let name = plugin.name || _.fatal(`plugin missing "name" field:`);

   if(!plugin.system){
      if(!plugin.run){ _.fatal(`plugin missing "run" function.`); }
      if(!plugin.help){ _.fatal(`plugin missing "help" function.`); }
      if(!plugin.description){ _.fatal(`plugin missing "description" function.`); }
   }

   if(!plugin.config){ _.fatal(`plugin missing "config" field. you must pass the config forward.`); }
   if(!plugin.config.path){ _.fatal(`plugin missing "config.path" field.`); }
   if(plugin.config.prefix === undefined){ _.fatal(`plugin missing "config.prefix" field. it can be blank, it just can't be undefined.`); }

   const prefix = plugin.config.prefix || "";

   if(!prefix.match(/^[A-Za-z0-9._]*$/)){ _.fatal(`plugin prefix name must only contain lowercase letters, numbers, "." and "_". got: ` + _.quote(prefix)); }
   if(!name.match(/^[A-Za-z0-9._]*$/)){ _.fatal(`plugin name must only contain lowercase letters, numbers, "." and "_". got: ` + _.quote(name)); }

   name = prefix + name;

   if(this._plugins[name]){
      _.fatal(`a plugin named "${name}" already exists. this is probably a conflict between two plugins. use a prefix in your plugin section in your config file like so: { prefix: "foo.", path: "path to plugin file" }`);
   }

   if(this[name]){
      _.fatal(`a function named "${name}" already exists on object "ai". you can't use this as a plugin name. you need to rename your plugin.`);
   }

   this._plugins[name] = plugin;
   this[name] = function(){ return(plugin.payload || plugin); };
};

ai_class.prototype._load_plugins = function(paths, user_config){
   const self = this;
   _.each.s(paths, function(config){
      if(typeof config === "string"){ config = { path: config }; }
      config = _.merge({ prefix: "" }, config);
      const plugin = require(config.path);
      plugin({ _, ai: self, config, user_config });
   });
};

ai_class.prototype.help = function([verbose] = []){

   _.print("usage: ai <plugin_name> <help | ...args>");
   _.print("models: ", _.format.pretty_obj(this.models().help().models));
   _.print("aliases: ", _.format.pretty_obj(this.models().help().aliases));

   // TODO _.fmap.s
   const map = {};
   _.each.s(this._plugins, function(plugin, name){
      if(!verbose && plugin.system){ return; }
      map[name] = plugin.config.path;
   });

   _.print("plugins: ", _.format.pretty_obj(_.keys(map)));

   if(!verbose){ return; }

   _.print("plugin map: ", _.format.pretty_obj(map));
};

// TODO: implement plugins_class and port it to _

ai_class.prototype.run = async function(args){
   let plugin_name = args.shift();

   if(!plugin_name || plugin_name === "fzf"){
      const list = [];
      // TODO: _.fmap.s
      _.each.s(this._plugins, function(plugin, key){
         if(plugin.system){ return; }
         list.push(key + ": " + plugin.description());
      });
      plugin_name = await _.fzf({ delim: ": ", list });
   }

   if(!plugin_name || plugin_name === "help"){
      return this.help(args);
   }

   const plugin = this._plugins[plugin_name];

   if(!plugin){
      _.print("no plugin with name: ", _.quote(plugin_name), ". see the list of available plugins below.");
      return this.help();
   }

   return await plugin.run(args);
};

module.exports = function(opts){ return(new ai_class(opts)); };

