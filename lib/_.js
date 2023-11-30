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

_.text_wrapper = function(opts){ return(new text_wrapper_class(opts)); };

function text_wrapper_class(opts){ this.reset(opts); }

text_wrapper_class.prototype.reset = function(opts){
   opts = opts || {};
   this.n_wrap = opts.n_wrap || this.n_wrap || 80;
   this.n_gutter = opts.n_gutter || this.n_gutter || 0;
   this.n_leading = opts.n_leading || this.n_leading || 0;
   this._word = "";
   this._line_len = 0;
   this._first_line = true;
   this._spaces = 0;
};

text_wrapper_class.prototype.stream = function({ chunk, flush }){
   const self = this;

   const { n_gutter, n_wrap, n_leading } = self;

   const wrap_width = (n_wrap - n_gutter);

   if(wrap_width < 0){ _.fatal("(wrap width - gutter width) must be greater than 0"); }

   let out = "";

   function reset_line_with_gutter(offset){
      offset = offset || 0;
      out += ' '.repeat(n_gutter - offset);
      // line_len shouldn't be offset. 
      // it should track the real number of leading characters, so we pad it with that number of chars.
      self._line_len = n_gutter;
      self._spaces = 0;
   }

   function write(str){
      out += str;
      self._line_len += str.length;
   }

   function handle_word(){
      const word = self._word;
      if(self._first_line){ 
         self._first_line = false;
         reset_line_with_gutter(n_leading);
      }else if(self._line_len === 0 && n_gutter){
         reset_line_with_gutter();
      }else if((self._line_len + word.length) > n_wrap){
         out += "\n";
         reset_line_with_gutter();
      }

      if(self._spaces){
         // don't add leading space after a wrap.
         out += " ".repeat(self._spaces);
         self._line_len += self._spaces;
      }

      write(word);
      self._word = "";
      self._spaces = 0;
   }

   function handle_newline(){
      if(self._word){ handle_word(); }
      out += "\n";
      self._line_len = 0;
   }

   // TODO: detect "```" and turn off leading space check
   function handle_space(){
      if(self._word){ handle_word(); }
      self._spaces++;
   }

   if(flush){ handle_word(); return(out); }

   for(let i = 0; i < chunk.length; i++){
      const c = chunk[i];
      // _.line(`c: '`, c, `'`);
      // if(c === "\n"){ handle_space(); }
      if(c === "\n"){ handle_newline(); }
      else if(c === " "){ handle_space(); }
      else{ 
         self._word += c;
         if(self._word.length == wrap_width){
            const temp = self._word;
            self._word = "";
            handle_newline();
            self._word = temp;
            handle_word();
         }
      }
   }

   return(out);
};

text_wrapper_class.prototype.flush = function(){
   return this.stream({ flush: true });
};

text_wrapper_class.prototype.once = function({ chunk }){
   this.reset();
   return(this.stream({ chunk }) + this.flush());
};



module.exports = _;
