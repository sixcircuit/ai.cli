module.exports = function(lib){
   const helpers = lib.helpers();

   helpers.vim = function(prompt){
      return lib.system({
         messages: [
            { role: "system", content: "If I ask about vim always assume i mean neovim. If I'm asking for neovim answers, always produce code in lua. answer the following question about neovim: " },
            { role: "user", content: prompt }
         ],
      });
   };

   helpers.lua = function(prompt){
      return lib.system({ 
         short: true, 
         messages: [
            { role: "system", content: "If I ask about vim always assume i mean neovim. If I'm asking for neovim answers, always produce code in lua. answer the following question about neovim: " },
            { role: "user", content: "convert these vim statement to lua:"},
            { role: "user", content: prompt }
         ]
      });
   };
};
