
const { wrap } = require("module");
const _ = require("./_.js");

const wrap_buffer = require("./wrap_buffer.js");

function console_class(opts){ this.reset(opts); }

console_class.prototype.reset = function(opts){
   opts = opts || {};

   this._buffer = wrap_buffer(opts);

   this._colors = _.merge({
      "system": 178,
      "user": 166,
      "model": 46,
      "warning": 196
   }, opts.colors);
};

console_class.prototype._out = function(color, ...str){
   str = str.join("");

   if(color === undefined || color === null){ return _.stdout.write(str); }

   const color_num = this._colors[color];

   if(color_num === undefined){ _.fatal("don't have a color named: ", _.quote(color)); }

   _.stdout.write(_.color_256(color_num, str));

   return(str);
};

console_class.prototype.turn = function(color, label){
   if(!label){ label = (color + ": "); }

   const nl_out = this._buffer.ensure_new_line();

   return(
      this._out(null, nl_out) +
      this._out(null, "\n") +
      this.label(color, label)
   );
};

console_class.prototype.label = function(color, ...str){
   str = str.join("");

   if(str.length > this._buffer.gutter()){
      _.fatal(`label "${str}" is wider than gutter width. label.len: ` + str.length + " gutter.len: " + this._buffer.gutter());
   }

   const nl_out = this._buffer.ensure_new_line();

   return(
      this._out(null, nl_out) +
      this._out(color, str) +
      this._out(null, this._buffer.start_line(str.length))
   );
};

console_class.prototype.stream = function({ color, chunk, flush }){
   return this._out(color, this._buffer.stream({ chunk, flush }));
};

console_class.prototype.flush = function({ color }){
   return this._out(color, this._buffer.stream({ flush: true }));
};

console_class.prototype.once = function({ color, chunk }){
   return this._out(color, this._buffer.once({ chunk }));
};

module.exports = function(opts){ return(new console_class(opts)); };
