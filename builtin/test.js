
module.exports = function({ _, ai, config }){

   const test = { name: "test", config };

   test.run = async function(args){
      _.print("no tests setup yet.");
   };

   test.help = function(args){
      _.print("usage: test <cmd>");
   };

   test.description = function(args){ return("provides testing functions."); };

   ai.register(test);
};
