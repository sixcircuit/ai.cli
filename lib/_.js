const _ = {};

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
   this.n_wrap = opts.n_wrap || 80;
   this.n_gutter = opts.n_gutter || 0;
   this.n_leading = opts.n_leading || 0;
   this._current_line = "";
   this._first_line = true;
};

text_wrapper_class.prototype.stream = function({ chunk }){
   const { n_gutter, n_wrap, n_leading } = this;

   const wrap_width = n_wrap - n_gutter;
   const words = chunk.split(/\s+/);

   let out = "";

   for(let i = 0; i < words.length; i++){
      const word = words[i];
         
      // Add leading spaces for new lines
      if (this._first_line || this._current_line.length === 0) {
         this._current_line += ' '.repeat(n_gutter - n_leading);
         out += ' '.repeat(n_gutter - n_leading);
         this._first_line = false;
      }

      // Check if the word fits in the current line
      if (this._current_line.length + word.length + 1 > wrap_width) {
         out += "\n";
         out += ' '.repeat(n_gutter);
         this._current_line = '';
      }

      // Add a space before the word if it's not the first word in the line
      if (this._current_line.length > n_leading) {
         this._current_line += ' ';
         out += " "
      }

      // Add the word to the current line
      this._current_line += word;
      out += word;
   }

   return(out);
};

text_wrapper_class.prototype.once = function({ text }){
   const { n_gutter, n_wrap, n_leading } = this;

   const wrap_width = n_wrap - n_gutter;
   const words = text.split(/\s+/);

   let first_line = true;

   let current_line = "";

   let out = "";

   function complete_line(){
      if(first_line){ 
         first_line = false;
         current_line = current_line.padStart(current_line.length + (n_gutter - n_leading)) + "\n"
      }else{
          current_line = current_line.padStart(current_line.length + n_gutter) + "\n"
      }
      out += current_line;
   }

   words.forEach(word => {
      // Check if adding the next word exceeds the wrap width
      if((current_line + word).length > wrap_width){
         complete_line();
         current_line = word;
      }else{
         // Add word to the current line, separated by a space if it's not the first word
         current_line += (current_line.length === 0 ? '' : ' ') + word;
      }
   });

   // Print the last line if it's not empty
   if(current_line.length > 0){ complete_line(); }

   return(out);
};



module.exports = _;
