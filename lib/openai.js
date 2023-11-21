
const OpenAI = require('openai');

function openai(config){
   this._config = config;
   this._client = new OpenAI({
      apiKey: api?.key || _.fatal("missing open_ai api key.");
   });
}

openai.prototype.test = async function({ messages }){
   const response = await this._client.chat.completions.create({
      model: _model.name,
      messages: [{ role: 'user', content: prompt }],
   });

   console.dir(response);
};

openai.prototype.stream = async function({ messages, request, print }){

   const req = _.merge(request, {
      model: _model.name,
      messages,
      // response_format: { "type": "json_object" },
      stream: true,
   })

   const stream = await this._client.chat.completions.create(req);

   let content = "";

   for await (const part of stream) {
      const diff = part.choices[0]?.delta?.content || ''
      content += diff;
      if(print !== false){ out(diff); }
   }

   return({ content });
};
