const _ = {};

const { resolve } = require("path");
const util = require("util");

_.nop = function(){};

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
   this._current_line = "";
   this._first_line = true;
};

text_wrapper_class.prototype.stream = function({ chunk }){
   const self = this;

   const { n_gutter, n_wrap, n_leading } = self;

   const wrap_width = n_wrap - n_gutter;

   if(wrap_width < 0){ _.fatal("(wrap width - gutter width) must be greater than 0"); }

   function handle_word(word){

      let out = "";

      while(word.length > wrap_width){ 
         _.line(`word.length: "`, word.length, `"`);
         _.line(`wrap_width: "`, wrap_width, `"`);
         _.line(`word: "`, word, `"`);
         const subword = word.substr(0, wrap_width);
         _.line(`subword: "`, subword, `"`);
         out += _handle_word(subword);
         _.line(`out: "`, out, `"`);
         word = word.slice(wrap_width);
         _.line(`word: "`, word, `"`);
      }

      out += _handle_word(word);

      return(out);
   }

   function _handle_word(word){

      function start_new_line(offset){
         offset = offset || 0;
         out += ' '.repeat(n_gutter - offset);
         // current line shouldn't be offset. it should track the real number of leading characters, so we pad it with that number of chars.
         self._current_line += ' '.repeat(n_gutter);
      }

      let out = "";

      // Add leading spaces for new lines
      if(self._first_line){
         self._first_line = false;
         start_new_line(n_leading);
      }else if(self._current_line.length === 0){
         start_new_line();
      }

      _.line("_current_line.length: ", self._current_line.length);
      _.line("_current_line.length + word.length: ", self._current_line.length + word.length);
      _.line("n_wrap: ", n_wrap);
      _.line("wrap_width: ", wrap_width);
      // Check if the word fits in the current line
      if(self._current_line.length + word.length > n_wrap){
         _.line("start new line.");
         out += "\n";
         self._current_line = '';
         start_new_line();
      }

      if(self._current_line.length > n_gutter){
         out += " "
         self._current_line += " ";
      }

      out += word;
      self._current_line += word;

      return(out);
   }

   const words = chunk.split(" ");

   let out = "";

   _.each.s(words, function(word){
      _.line(`word: "`, word, `"` )
      out += handle_word(word);
      _.line(`out: "`, out, `"` )
   });

   return(out);
};

text_wrapper_class.prototype.once = function({ chunk }){
   this.reset();
   return this.stream({ chunk });
};



module.exports = _;
