
const _ = require("./_.js");
const console_class = require("./console.js");
const util = require('util');

const _models = require("../lib/models.js");

const ai_class = function(opts){ 
   this._plugins = {};
   this._console = new console_class({ n_gutter: 8 });
   this._config = opts;
   this._models = _models;

   this._load_plugins(opts);
};

ai_class.prototype.plugins = function(key){
   if(_.is_def(key)){ return this._plugins[key] || _.throw("no_plugin", "no plugin for key: ", _.quote(key)); };
   return this._plugins;
}

ai_class.prototype.console = function(){ return this._console; };

ai_class.prototype.register = function(plugin){
   const key = plugin.key || _.fatal("plugin missing field:", _.quote("key"));
   const cmd = plugin.run || _.fatal("plugin missing field:", _.quote("run"));
   this._plugins[key] = plugin;
};

ai_class.prototype.open_editor = async function({ text, explain, raw }){ 
   text = text || "";

   function open_editor(path){
      return new Promise((resolve, reject) => {
         const editor = process.env.EDITOR || 'vim';

         const args = [];

         if(editor === "vim" || editor === "nvim"){
            args.push("-c"); args.push("$"); args.push("+start");
         }

         args.push(path);

         const child = spawn(editor, args, { stdio: 'inherit' });

         child.on('exit', function(code){ 
            if(code){ reject(_.error("editor_exit", "editor exited with code: ", code)); }
            else{ resolve(); }
         });
         child.on('error', function(err){ reject(err); });
      });
   }

   const temp_path = "/tmp/llm_prompt_" + _.timestamp();

   if(explain !== false){
      text = [
         `// please enter your prompt below. lines starting with "//" are ignored and an empty message aborts the process.`,
         text,
         "", ""
      ].join("\n");
   }

   fs.writeFileSync(temp_path, text);

   try{
      await open_editor(temp_path);
   }catch(e){
      if(e.code === "editor_exit"){ return(""); }
   }

   let saved_text = fs.readFileSync(temp_path, "utf-8");

   if(!raw){
      saved_text = saved_text.split("\n");
      saved_text.filter(function(line){ return !line.startsWith('//'); });
      saved_text = saved_text.join("\n").trim();
   }

   fs.unlinkSync(temp_path);

   return(saved_text);
};

ai_class.prototype._load_plugins = function({ plugins }){ 
   _.each.s(plugins, function(plugin_path){
      const plugin = require(plugin_path);
      plugin({ ai: this });
   });
};

ai_class.prototype.models = function(){ return(this._models); };

ai_class.prototype.help = function(no_exit){

   _.line("usage: ai <model | alias> <plugin_name> ...args");
   _.line("models: ", pretty_obj(this.models().help().models));
   _.line("aliases: ", pretty_obj(this.models().help().aliases));

   if(no_exit){ return; }

   process.exit(1); 
};

ai_class.prototype.run = async function(args){
   const plugin_name = args.shift();
   const plugin = this._plugins[plugin_name];

   if(!plugin){
      _.line("no plugin with name: ", _.quote(plugin_name), ". see the list of available plugins below.");
      return this.help();
   }

   let run_f = plugin.run.bind(plugin);

   if(plugin.run.length === 2){ fun_f = util.promisify(run); }

   const result = await run_f(args);

   return(result);
};


module.exports = function(opts){ return(new ai_class(opts)); };

