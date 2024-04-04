const _ = {};

const util = require("util");
const crypto = require("crypto");

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
   return new Promise(function(resolve, reject){
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

_.timeout = function(ms){
   return new Promise(function(resolve) {
      setTimeout(resolve, ms);
   });
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
_.format.dollars = function(n){
   const cents = n * 100;
   if(cents > 100){
      return("$" + n.toFixed(2));
   }else{
      return("¢" + cents.toFixed(3));
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

_.format.obj_table = function(obj){

   let max_label = 0;
   let max_value = 0;

   _.each.s(obj, function(v, k){
      if(v === null){ return; }
      max_label = Math.max(k.length, max_label);
      max_value = Math.max((v+"").length, max_value);
   });

   const strs = [];

   _.each.s(obj, function(v, k){
      if(v === null){ strs.push(""); return; }
      strs.push(k.padEnd(max_label) + " : " + (v + "").padStart(max_value));
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



module.exports = _;
