
module.exports = function({ _, ai, config }){

   const console_class = require("../lib/console.js");

   const console = {
      name: "console",
      system: true,
      config,
      payload: new console_class({ gutter: config.gutter || 8, wrap: config.wrap || 80 }),
      description: function(args){ return("provides a wrapping console."); }
   };

   ai.register(console);
};
