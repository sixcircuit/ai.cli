
const _ = require("./_.js");

const OpenAI = require('openai');

function openai(config){
   this._config = config;
   this._client = new OpenAI({
      apiKey: config.api?.key || _.fatal("missing open_ai api key.")
   });
}

openai.prototype.test = async function({ model, messages }){
   const response = await this._client.chat.completions.create({
      model: model.name,
      messages: [{ role: 'user', content: prompt }],
   });

   console.dir(response);
};

openai.prototype.stream = async function({ model, messages, request, on_data }){

   const req = _.merge(request, {
      model: model.version(),
      messages,
      stream: true,
   })

   const stream = await this._client.chat.completions.create(req);

   let content = "";

   for await (const part of stream){
      const diff = part.choices[0]?.delta?.content || ''
      content += diff;
      if(on_data){ on_data(diff); }
   }

   return({ content });
};

module.exports = function(config){ return(new openai(config)); };
