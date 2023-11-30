# ai client

#### this is a simple terminal program to connect to the openai api and get (gpt-3.5 gpt-4 gpt-x) responses.

- it contains a framework for creating simple prompt helpers.
- it streams the responses (in a nice format).
- it copies the response to the system clipboard (on macos)
- it also prints some stats about how much the request cost, how many tokens it was, and how long it took.

### but i'm lying. but i'm lying. it's something way more powerful. 
#### it's a terminal program that abstracts a bunch of ai models and supports a plugin framework.
#### it just ships with an LLM plugin by default.
#### it's great for rapid prototyping AI ideas.

i may update it in the future. it does what I need it to do right now. 

it has two dependencies: the openai api and tiktoken.

### to install

1. clone this repo
2. run `npm install`
3. copy ./config.example.js to ./config.js
4. add your openai api key to config.js 
5. optionally configure a helper file. copy helper.example.js somewhere and update the helper path in config.js
5. run `./bin/llm gpt-3.5-turbo none "recite to be or not to be from hamlet."`


### usage:
- `llm <model | alias | "cont"> [<helper_name> [prompt]]`

you can run the command without a helper name and a prompt.
if you run the command without a prompt it will open your editor. 
if you include a helper but no prompt you'll see the helper prompts (commented out) in the editor too
it works kinda like `git commit` if you don't provide a message
it's much easier to edit a big prompt in the editor especially if you're include code.

run `llm help` to see the various models, aliases and helpers supported.

note: if you get errors about access or rate limits, make sure you have API billing enabled. it's separate from the chat account billing. it should live here: https://platform.openai.com/account/billing/overview

### examples:
- `llm 4 d say hello`
- `llm gpt-3.5-turbo none "recite to be or not to be from hamlet."`
- `etc...`

### todo
1. store history and allow continuation of previous prompts
2. support other llms with llama.cpp

### license

Feel free to use and hack on this program. You can't use the lib/_.js code in any other project -- it's a fragment of some proprietary code I license to people.

