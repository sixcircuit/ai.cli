
const fs = require("fs");
const util = require("util");

const _ = require("./_.js");

const console_class = require("./console.js");

const { wrap } = require("module");

const ai_class = function(opts){
   this._plugins = {};
   this._console = new console_class({ gutter: 8, wrap: 80 });
   this._config = opts;
   this._models = require("../lib/models.js")(opts);
   this._load_plugins(opts);
};

ai_class.prototype.plugins = function(key){
   if(_.is_def(key)){ return this._plugins[key] || _.throw("no_plugin", "no plugin for key: ", _.quote(key)); };
   return this._plugins;
}

ai_class.prototype.console = function(){ return this._console; };

ai_class.prototype.register = function(plugin){

   let name = plugin.name || _.fatal(`plugin missing "name" field:`);

   if(!plugin.run){ _.fatal(`plugin missing "run" function.`); }
   if(!plugin.help){ _.fatal(`plugin missing "help" function.`); }
   if(!plugin.description){ _.fatal(`plugin missing "description" function.`); }

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

   this._plugins[name] = plugin;
};

ai_class.prototype._load_plugins = function({ plugins }){
   const self = this;
   _.each.s(plugins, function(config){
      if(typeof config === "string"){ config = { path: config }; }
      config = _.merge({ prefix: "" }, config);
      const plugin = require(config.path);
      plugin({ _, ai: self, config });
   });
};

ai_class.prototype.models = function(){ return(this._models); };

ai_class.prototype.help = function([verbose] = []){

   _.print("usage: ai <plugin_name> <help | ...args>");
   _.print("models: ", _.format.pretty_obj(this.models().help().models));
   _.print("aliases: ", _.format.pretty_obj(this.models().help().aliases));
   _.print("plugins: ", _.format.pretty_obj(_.keys(this._plugins)));

   if(!verbose){ return; }

   // TODO _.map.s
   const map = {};
   _.each.s(this._plugins, function(plugin){ map[plugin.name] = plugin.path; });
   _.print("plugin map: ", _.format.pretty_obj(map));
};

// TODO: implement plugins_class and port it to _

ai_class.prototype.run = async function(args){
   let plugin_name = args.shift();

   if(!plugin_name || plugin_name === "fzf"){
      const list = [];
      // TODO: _.map.s
      _.each.s(this._plugins, function(plugin, key){ list.push(key + ": " + plugin.description()); });
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

   // let run_f = plugin.run.bind(plugin);
   // if(plugin.run.length === 2){ fun_f = util.promisify(run); }
   // const result = await run_f(args);

   return await plugin.run(args);
};

ai_class.prototype.open_editor = async function({ text, explain, raw }){
   text = text || "";

   function _open_editor(path){
      return new Promise((resolve, reject) => {
         const editor = process.env.EDITOR || 'vim';

         const args = [];

         if(editor === "vim" || editor === "nvim"){
            args.push("-c"); args.push("$"); args.push("+start");
         }

         args.push(path);

         const child = require('child_process').spawn(editor, args, { stdio: 'inherit' });

         child.on('exit', function(code){
            if(code){ reject(_.error("editor_exit", "editor exited with code: ", code)); }
            else{ resolve(); }
         });
         child.on('error', function(err){ reject(err); });
      });
   }

   const temp_path = "/tmp/ai_editor_" + _.sid_128();

   if(explain !== false){
      text = [
         `// lines starting with "//" are ignored and an empty message aborts the process.`,
         text,
         "", ""
      ].join("\n");
   }

   fs.writeFileSync(temp_path, text);

   try{
      await _open_editor(temp_path);
   }catch(e){
      if(e.code === "editor_exit"){ return(""); }
   }

   let saved_text = fs.readFileSync(temp_path, "utf-8");

   if(!raw){
      saved_text = saved_text.split("\n");
      saved_text = saved_text.filter(function(line){ return !line.startsWith('//'); });
      saved_text = saved_text.join("\n").trim();
   }

   fs.unlinkSync(temp_path);

   return(saved_text);
};


module.exports = function(opts){ return(new ai_class(opts)); };

