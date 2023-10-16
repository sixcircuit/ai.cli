# llm_cli

this is a simple terminal program to connect to the openai api and get (gpt-3.5 gpt-4 gpt-x) responses.
it contains a framework for creating simple prompt helpers.
it streams the responses.
it copies the response to the system clipboard (on macos)

i may update it in the future. it does what I need it to do right now. 

it has one dependency: the openai api.

the model is hard coded as "gpt-4" but you can easily change that in the code. 

# to install

1. clone this repo
2. run npm install
3. copy ./config.example.js to ./config.js
4. add your openai api key to config.js
5. run ./bin/llm_cli <prompt> or ./bin/llm_cli --<helper_name> <prompt>

note: if you get errors about access or rate limits, make sure you have API billing enabled. 
it's separate from the chat account billing. it should live here: https://platform.openai.com/account/billing/overview
