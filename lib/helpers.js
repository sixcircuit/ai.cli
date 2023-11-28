const _ = require("../lib/_.js");

const lib = {};
const _helpers = {};

lib.system = function({ short, messages, request }){
   let sys = [];

   sys.push("You are an autoregressive language model that has been fine-tuned with instruction-tuning and RLHF. You carefully provide accurate, factual, thoughtful, nuanced answers, and are brilliant at reasoning. If you think there might not be a correct answer, you say so.");

   if(short){
      sys.push("Make your response as concise as possible, with no introduction or background at the start, no summary at the end, and outputting only code for answers where code is appropriate.");
   }else{
      sys.push("Since you are autoregressive, each token you produce is another opportunity to use computation, therefore you always spend a few sentences explaining background context, assumptions, and step-by-step thinking BEFORE you try to answer a question.");
   }

   sys.push("Your users are experts in AI and ethics, so they already know you're a language model and your capabilities and limitations, so don't remind them of that. They're familiar with ethical issues in general so you don't need to remind them about those either. Don't be verbose in your answers, but do provide details and examples where it might help the explanation.");

   sys.push("When showing code, minimise vertical space, do not add any comments or docstrings, and use 3 spaces where tabs would go. Preserve any comments in any code provided and convert code in comments if necessary.")

   sys = sys.map(function(m){
      return({ role: "system", content: m });
   });

   return({
      request,
      messages: sys.concat(messages)
   });
};

lib.get = function(key){ return _helpers[key]; };
lib.add = function(key, f){ _helpers[key] = f; };
lib.helpers = function(key, f){ return(_helpers); };

lib.help = function(){ return JSON.stringify(Object.keys(_helpers)); }

lib.to_text = function(helper){
   return helper("").map(function(v){
      return ("role: " + v.role + ": " + v.content);
   }).join("\n")
}

lib.to_editor_text = function(helper){

   let { messages } = helper("");
   const user_message = messages.pop();

   messages = messages.map(function(v){
      return ("// role: " + v.role + ": " + v.content);
   });

   if(user_message.content){
      messages.push(user_message.content);
   }

   return messages.join("\n");
}

_helpers.json = function(prompt){
   return({
      messages: [
         { role: "user", content: prompt }
      ],
      request: { response_format: { "type": "json_object" } },
   });
};

_helpers.none = function(prompt){
   return({
      messages: [
         { role: "user", content: prompt }
      ]
   });
};

_helpers.n = _helpers.none;

_helpers.default = function(prompt){
   return lib.system({ 
      messages: [
         { role: "user", content: prompt }
      ]
   });
};
_helpers.d = _helpers.default;

_helpers.short = function(prompt){
   return lib.system({ 
      short: true,
      messages: [
         { role: "user", content: prompt }
      ]
   });
};

_helpers.jsfun = function(prompt){
   return lib.system({ short: true }, [
      { role: "user", content: "you're a very talented engineer. excluding all commentary and explanation write a javascript function that: "},
      { role: 'user', content: prompt }
   ]);
};

module.exports = function(path){
   const user_helpers = _.merge({}, lib);
   if(path){ require(path)(lib); }
   return(lib);
};
