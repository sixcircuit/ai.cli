const _ = {};

const { resolve } = require("path");
const util = require("util");

_.nop = function(){};

_.quote = function(a){ return (`"` + a + `"`); }

_.is_def = function(a){ return(a !== undefined); };

_.def = function(a, b){
   if(a !== undefined){ return(a); }
   return(b);
};

_.a_def = function(a){
   if(a !== undefined){ return(a); }
   _.fatal("value must be defined. was undefined.");
}

_.pbcopy = function pbcopy(data, cb){
   var proc = require('child_process').spawn('pbcopy'); 
   proc.on("error", function(e){ cb(e); })
   proc.on("exit", function(){ cb(null); });
   proc.stdin.write(data); proc.stdin.end();
};

_.max = Math.max;
_.min = Math.min;

_.first = function(a){ return(a[0]); }
_.last = function(a){ return(a[a.length-1]); }

_.timestamp = function(){ return Date.now(); };

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
   return(["\033[38;5;", `${fg}m`, str, "\033[0m"].join(""));
}

_.out = function(...str){
   process.stdout.write(str.join(""));
}

_.line = function(...str){
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

_.merge = function(...args){
   return Object.assign.apply(Object, [{}].concat(args));
};

_.each = {};
_.each.s = function(o, f){
   if(Array.isArray(o)){
      for(let i = 0; i < o.length; i++){
         f(o[i], i);
      }
   }else{
      const keys = Object.keys(o);
      for(let i = 0; i < keys.length; i++){
         const key = keys[i];
         f(o[key], key);
      }
   }
};



module.exports = _;
