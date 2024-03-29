"use strict"

const { wrap } = require("module");
const _ = require("./_.js");

function wrap_buffer(opts){ this.reset(opts); }

wrap_buffer.prototype.reset = function(opts){
   opts = opts || {};

   this._wrap_width = (this._wrap_width || 80);
   if(opts.wrap !== undefined){ this._wrap_width = opts.wrap; }

   this._gutter_width = (this._gutter_width || 0);
   if(opts.gutter !== undefined){ this._gutter_width = opts.gutter; }

   this._word = "";
   this._line_len = 0;
   this._spaces = 0;
   this._seen_ticks = 0;
};

wrap_buffer.prototype.wrap = function(){ return(this._wrap_width); };
wrap_buffer.prototype.gutter = function(){ return(this._gutter_width); };

wrap_buffer.prototype.has_line = function(){ return(this._line_len > 0); };

wrap_buffer.prototype.ensure_new_line = function(){

   let out = "";

   if(this.has_line()){
      out = this.flush();
      if(_.last(out) !== "\n"){ out += "\n"; }
   }

   this._line_len = 0;
   this._spaces = 0;

   return(out);
};

wrap_buffer.prototype.start_line = function(gutter_offset){
   gutter_offset = gutter_offset || 0;
   if(gutter_offset > this._gutter_width){
      _.fatal(`gutter_offset (${gutter_offset}) can't be greater than gutter_width (${this._gutter_width})`);
   }
   const out = ' '.repeat(this._gutter_width - gutter_offset);
   // line_len tracks the real number characters, including leading characters.
   this._line_len = this._gutter_width;
   this._spaces = 0;
   return(out);
}

wrap_buffer.prototype.stream = function({ chunk, flush, new_line }){
   const self = this;

   if(!chunk){ chunk = ""; }

   if((self._wrap_width - self._gutter_width) <= 0){ _.fatal("(wrap width - gutter width) must be greater than 0"); }

   let out = "";

   function account_for(str){
      self._line_len += str.length;
      return(str);
   }

   function make_spaces(){
      return(" ".repeat(self._spaces));
   }

   function commit_word(){
      if(!self._word.length){ return; }

      const word = self._word;
      const space_word = (make_spaces() + word);

      self._word = "";
      self._spaces = 0;

      // only add leading space if you're not starting a new line

      if(self._line_len === 0){
         out += self.start_line();
         out += account_for(word);
         // _.stdout("a.out: ", out + "");
      }else if((self._line_len + space_word.length) > self._wrap_width){
         out += "\n";
         out += self.start_line();
         out += account_for(word);
         // _.stdout("b.out: ", out + "");
      }else{
         out += account_for(space_word);
         // _.stdout("c.out: ", out + "");
      }
   }

   function handle_newline(){
      commit_word();
      out += "\n";
      self._line_len = 0;
   }

   function handle_space(){
      commit_word();
      self._spaces++;
   }

   for(let i = 0; i < chunk.length; i++){
      const c = chunk[i];

      if(c === '`'){ self._seen_ticks++; }

      if(self._seen_ticks === 3){
         self._seen_ticks = 0;
         if(!self._in_code_block){
            commit_word();
            out += c;
            self._in_code_block = true;
            continue;
         }else{
            out += c;
            self._word = "";
            self._spaces = 0;
            self._in_code_block = false;
            continue;
         }
      };

      if(self._in_code_block){
         if(c === "\n"){
            out += "\n";
            out += self.start_line();
         }else{
            out += c;
            self._line_len++;
         }
         continue;
      }

      if(c === "\n"){ handle_newline(); }
      else if(c === " "){ handle_space(); }
      else{
         self._word += c;
         if((self._spaces + self._word.length) == self._wrap_width){ commit_word(); }
      }
   }

   if(flush){ commit_word(); }
   if(new_line){ out += self.ensure_new_line(); }

   return(out);
};

wrap_buffer.prototype.flush = function({ new_line } = {}){
   return this.stream({ flush: true, new_line });
};

wrap_buffer.prototype.once = function({ chunk, new_line }){
   this.reset();
   return(this.stream({ chunk }) + this.flush({ new_line }));
};

module.exports = function(opts){ return(new wrap_buffer(opts)); };
