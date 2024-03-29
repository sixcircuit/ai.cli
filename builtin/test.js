
module.exports = function({ _, ai, config }){

   const test = { name: "test", config };

   test.run = async function(args){
      _.print("no tests setup yet.");
   };

   test.help = function(args){
      _.print("usage: test <cmd>");
   };

   ai.register(test);
};
