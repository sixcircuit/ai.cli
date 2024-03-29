
const llm = { name: "llm" };

llm.helpers = function(){
   // STUB
   return({
      add: function(){}
   });
}

llm.run = async function(){

}

llm.help = function(no_exit){

   _.line("usage: llm <model | alias | cont> [<helper_name> [prompt]]");
   _.line("helpers: ", _helpers.help());
   _.line("aliases: ", pretty_obj(ai.models.help().aliases));
   _.line("models: ", pretty_obj(ai.models.help().models));
   _.line("helpers: ", _helpers.help());

   if(no_exit){ return; }

   process.exit(1);
};




module.exports = function({ ai }){
   ai.register(llm);
};
