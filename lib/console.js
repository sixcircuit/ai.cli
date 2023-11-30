
function console_class(opts){ this.reset(opts); }

console_class.prototype.reset = function(opts){
   opts = opts || {};
   this.n_wrap = opts.n_wrap || this.n_wrap || 80;
   this.n_gutter = opts.n_gutter || this.n_gutter || 0;
   this.n_leading = opts.n_leading || this.n_leading || 0;
   this._word = "";
   this._line_len = 0;
   this._first_line = true;
   this._spaces = 0;
   this._colors = _.merge({
      "system": 178,
      "user": 166,
      "model": 46,
      "warning": 196
   }, opts.colors);

};

console_class.prototype.out = function(color, ...str){ 
   str = str.join("");

   if(color === undefined || color === null){ return _.out(str); }

   const color = this._colors[color];

   if(color === undefined){ _.fatal("don't have a color named: ", _.quote(color)); }

   _.out(_.color_256(color, str));
};

console_class.prototype.label = function(color, ...str){ 
   str = str.join("");
   if(this._line_len){ _.out(this.flush()); _.out("\n\n"); }
   this.out(color, str);
};

console_class.prototype.stream = function({ chunk, flush }){
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

   if(flush){ handle_word(); }

   return(out);
};

console_class.prototype.flush = function(){
   return this.stream({ flush: true });
};

console_class.prototype.once = function({ chunk }){
   this.reset();
   return(this.stream({ chunk }) + this.flush());
};

module.exports = function(opts){ return(new console_class(opts)); };
