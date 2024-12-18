
const _ = require("./_.js");

const openai_client = require('openai');

function client(model){
   this._model = model;

   this._client = new openai_client({
      apiKey: model.api_key(),
      baseURL: model.api_url() || null
   });
}

client.prototype.test = async function({ model, messages }){
   const response = await this._client.chat.completions.create({
      model: model.name,
      messages: [{ role: 'user', content: prompt }],
   });

   console.dir(response);
};

client.prototype.stream = async function({ model, messages, request, on_data }){

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

module.exports = function(model){ return(new client(model)); };
