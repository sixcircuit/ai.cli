
module.exports = function({ _, ai, config }){

   const models = { name: "models", config };

   const _cmds = {};

   _cmds.stats = function(args){

      _.stdout("");

      _.each.s(ai.models().base(), function(model){

         _.stdout(model.version());
         _.stdout("-".repeat(model.version().length));

         _.stdout("  prices: (max: ", _.format.dollars(model.price().max()), ")");
         _.stdout([
            "    in / out  (1k): " + _.format.dollars(model.price().input(1_000), 2) + " / " + _.format.dollars(model.price().output(1_000), 2),
            "    in / out (max): " + _.format.dollars(model.price().max_input(), 2) + " / " + _.format.dollars(model.price().max_output(), 2),
         ].join("\n"));

         _.stdout("  limits:");
         _.stdout([
            "    in   (quality): " + _.to_k(model.quality_limit()),
            "    in / out (max): " + _.to_k(model.max_input()) + " / " + _.to_k(model.max_output()),
         ].join("\n"));

         if(model.has_vision()){ _.stdout("  vision: " + model.has_vision()); }

         _.stdout("");
      });
   };

   models.run = async function(args){
      return await _.run_cmd(_cmds, args, "stats")
   };

   models.help = _cmds.help = function(){ _.print("usage: models [stats]"); };
   models.description = function(args){ return("allows management and info about the AI models available to you in this program."); };

   ai.register(models);
};
