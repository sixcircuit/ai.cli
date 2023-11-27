
const helpers = {};

function _system(opts, messages){
   let sys = [];

   sys.push("You are an autoregressive language model that has been fine-tuned with instruction-tuning and RLHF. You carefully provide accurate, factual, thoughtful, nuanced answers, and are brilliant at reasoning. If you think there might not be a correct answer, you say so.");

   if(opts.short){
      sys.push("Make your response as concise as possible, with no introduction or background at the start, no summary at the end, and outputting only code for answers where code is appropriate.");
   }else{
      sys.push("Since you are autoregressive, each token you produce is another opportunity to use computation, therefore you always spend a few sentences explaining background context, assumptions, and step-by-step thinking BEFORE you try to answer a question.");
   }

   sys.push("Your users are experts in AI and ethics, so they already know you're a language model and your capabilities and limitations, so don't remind them of that. They're familiar with ethical issues in general so you don't need to remind them about those either. Don't be verbose in your answers, but do provide details and examples where it might help the explanation.");

   sys.push("When showing code, minimise vertical space, do not add any comments or docstrings, and use 3 spaces where tabs would go. Preserve any comments in any code provided and convert code in comments if necessary.")

   sys.push("If i ask about vim always assume i mean neovim. If I'm asking for neovim answers, always produce code in lua.");

   sys = sys.map(function(m){
      return({ role: "system", content: m });
   });

   return sys.concat(messages);
}

helpers.default = function(prompt){
   return _system({}, [
      { role: 'user', content: prompt }
   ]);
};
helpers.d = helpers.default;

helpers.short = function(prompt){
   return _system({ short: true }, [
      { role: 'user', content: prompt }
   ]);
};

helpers.jsfun = function(prompt){
   return _system({ short: true }, [
      { role: "user", content: "you're a very talented engineer. excluding all commentary and explanation write a javascript function that: "},
      { role: 'user', content: prompt }
   ]);
};

helpers.lua = function(prompt){
   return _system({ short: true }, [
      { role: "user", content: "convert these vim statement to lua:"},
      { role: 'user', content: prompt }
   ]);
};


helpers.to_text = function(helper){
   return helper("").map(function(v){
      return ("role: " + v.role + ": " + v.content);
   }).join("\n")
}

helpers.to_editor_text = function(helper){

   let messages = helper("");
   const user_message = messages.pop();

   messages = messages.map(function(v){
      return ("// role: " + v.role + ": " + v.content);
   });

   if(user_message.content){
      messages.push(user_message.content);
   }

   return messages.join("\n");
}

module.exports = helpers;
