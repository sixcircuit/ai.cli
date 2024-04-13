const _ = {};

const util = require("util");
const crypto = require("crypto");
const { on } = require("events");

_.path = require("path");

_.nop = function(){};

_.quote = function(a){ return (`"` + a + `"`); }

_.is_def = function(a){ return(a !== undefined); };

_.stringify = function(obj, f = null, spaces = 3){ return JSON.stringify(obj, f, spaces); }

_.def = function(a, b){
   if(a !== undefined){ return(a); }
   return(b);
};

_.a_def = function(a){
   if(a !== undefined){ return(a); }
   _.fatal("value must be defined. was undefined.");
}

_.pbcopy = async function pbcopy(data){
   const { spawn } = require('child_process');
   return _.promise(function(resolve, reject){
      const proc = spawn('pbcopy');
      proc.on("error", function(e){ reject(e) });
      proc.on("exit", function(){ resolve() });
      proc.stdin.write(data);
      proc.stdin.end();
   });
};

// _.pbcopy = function pbcopy(data, cb){
//    var proc = require('child_process').spawn('pbcopy');
//    proc.on("error", function(e){ if(cb){ cb(e); } })
//    proc.on("exit", function(){ if(cb){ cb(null); } });
//    proc.stdin.write(data); proc.stdin.end();
// };

_.sid_128 = function(prefix){
   if(prefix){
      return prefix + crypto.randomBytes(16).toString('hex');
   }else{
      return crypto.randomBytes(16).toString('hex');
   }
};

_.max = Math.max;
_.min = Math.min;

_.first = function(a){ return(a[0]); }
_.last = function(a){ return(a[a.length-1]); }

_.timestamp = function(){ return Date.now(); };
_.null = function(){ return(null); }

_.timeout = function(ms){
   return _.promise(function(resolve){ setTimeout(resolve, ms); });
};

_.throw = function(code, ...str){
   throw _.error(code, ...str);
};

_.error = function(code, ...str){
   const err = new Error(str.join(""));
   err.code = code;
   return(err);
};

_.fatal = function(...str){ throw _.error("fatal", str.join("")); };

_.to_k = function(n){
   n = n-0;
   if(n >= 1024){
      n = n / 1024;
      return n.toFixed(1) + "k";
   }else{
      return n;
   }
}

_.to_kb = function(n){
   n = n-0;
   if(n >= 1024){
      n = n / 1024;
      return n.toFixed(1) + "kb";
   }else{
      return n + "b";
   }
}

_.color_256 = function(fg, str){
   return(["\x1B[38;5;", `${fg}m`, str, "\x1B[0m"].join(""));
}

_.stdout = function(...str){ process.stdout.write(str.join("") + "\n"); }
_.stdout.write = function(...str){ process.stdout.write(str.join("")); };

_.stderr = function(...str){ process.stderr.write(str.join("") + "\n"); }
_.stderr.write = function(...str){ process.stdout.write(str.join("")); };

_.format = {};
_.format.dollars = function(n, fixed){
   const cents = n * 100;
   if(cents >= 10){
      return("$" + n.toFixed(fixed || 2));
   }else{
      return(cents.toFixed(fixed || 3)  + "¢" );
   }
};

_.format.pretty_obj = function(obj){ return JSON.stringify(obj, null, 3); }

_.print = function(...str){
   str = str.map(function(v){
      if(typeof v === "object"){
         return util.inspect(v, { depth: Infinity, compact: true });
      }else{
         return(v);
      }
   });
   str.push("\n")
   process.stdout.write(str.join(""));
}

_.merge = function(...args){ return Object.assign.apply(Object, [{}].concat(args)); };
_.assign = function(...args){ return Object.assign.apply(Object, args); };

_.format.duration_ms = function(ms){
   if(ms < 1000){ return(ms + " ms"); }
   let sec = (ms / 1000);
   if(sec < 60){ return(sec.toFixed(3) + " seconds"); }
   let min = Math.floor(sec / 60);
   sec = (sec % 60);
   return(min + " minutes " + sec + " seconds");
};

_.format.obj_table = function(obj, { float, delim, justify } = {}){
   delim = delim || ": "
   justify = justify || "right";

   if(justify === "left"){ justify = "End"; }
   else{ justify = "Start"; }

   let max_label = 0;
   let max_value = 0;

   _.each.s(obj, function(v, k){
      if(v === null){ return; }
      max_label = Math.max(k.length, max_label);
      max_value = Math.max((v+"").length, max_value);
   });

   if(!float){ max_label += delim.length; }

   const strs = [];

   _.each.s(obj, function(v, k){
      if(v === null){ strs.push(""); return; }

      if(float){
         strs.push(k.padEnd(max_label) + delim + (v + "")["pad" + justify](max_value));
      }else{
         strs.push((k + delim).padEnd(max_label) + (v + "")["pad" + justify](max_value));
      }
   });

   return(strs.join("\n"));
};

_.format.percent = function percent(ratio, precision){
   return (ratio * 100).toFixed(precision) + "%";
};

_.resolve_alias = function(obj, alias, limit = 10){
   let thing = alias;

   let loop = 0;
   do{
      if(loop++ > limit){ _.fatal(`alias "${ alias }" exceeded loop max: ${ limit }.`); }
      thing = obj[thing];
   }while(typeof thing === "string");

   return(thing);
};

_.keys = Object.keys;

_.each = {};
_.each.s = function(o, f){
   if(Array.isArray(o)){
      for(let i = 0; i < o.length; i++){
         f(o[i], i);
      }
   }else{
      const keys = _.keys(o);
      for(let i = 0; i < keys.length; i++){
         const key = keys[i];
         f(o[key], key);
      }
   }
};

_.run_cmd = async function(cmds, args, default_cmd){
   const cmd_name = args.shift() || default_cmd;;

   async function do_help(){
      if(!cmds.help){ return _.stderr("no command name provided. here's what's available: " + JSON.stringify(_.keys(cmds))); }
      else{ return await cmds.help(args); }
   }

   if(!cmd_name){ return await do_help(); }

   if(cmds[cmd_name]){ return await cmds[cmd_name](args); }
   else{
      _.stderr("error: no command with name: ", _.quote(cmd_name), ".");
      return await do_help();
   }
};

_.promise = function(f){ return(new Promise(f)); };

_.fzf = function({ list, delim, raw }){
   return _.promise(function(resolve, reject){
      delim = delim || " ";

      if(Array.isArray(list)){ list = list.join("\n"); }

      const { spawn } = require("child_process");
      const fzf = spawn("fzf", [], { stdio: ["pipe", "pipe", process.stderr] });

      let selection = "";

      fzf.stdout.on("data", function(data){ selection += data.toString(); });

      fzf.on("close", function(){
         if(raw){ return resolve(selection); }

         selection = selection.trim();
         if(selection){
            selection = selection.split(delim)[0].trim();
            return resolve(selection);
         }else{ return resolve(null); }
      });

      fzf.stdin.write(list);
      fzf.stdin.end();
   });
};

_.chain = {};
_.chain.a = async function(f, fns){
   let last = null;
   let chain = [];
   let broke = false;
   for(let i = 0; i < fns.length; i++){
      const args = fns[i]({ last, chain });
      if(args === null){ broke = true; break; }
      last = await f.apply(null, args);
      chain.push(last);
   }
   return({ last, chain, broke });
};

// TODO: port this back to dry-underscore
_.wait_keypress = async function(message){
   return(new Promise(function(resolve){
      const stdin = process.stdin;
      const was_raw = stdin.isRaw;

      if(message){ _.stdout.write(message); }

      stdin.once('data', function(key){
         stdin.setRawMode(was_raw);
         stdin.pause();
         resolve(key);
      });

      stdin.setEncoding('utf8');
      stdin.setRawMode(true);
      stdin.resume();
   }));
};

module.exports = _;
