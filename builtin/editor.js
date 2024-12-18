
const fs = require('fs');

module.exports = function({ _, ai, config }){

   const editor = {};

   const plugin = {
      name: "editor",
      system: true,
      config,
      payload: editor,
      description: function(args){ return("provides an editor interface."); }
   };

   editor.open = async function({ text, explain, raw }){
      text = text || "";

      function _open_editor(path){
         return new Promise((resolve, reject) => {
            const editor = process.env.EDITOR || 'vim';

            const args = [];

            if(editor === "vim" || editor === "nvim"){
               // nvim -c "set wrap" -c "normal G" -c "startinsert"
               args.push("-c"); args.push("set wrap");
               args.push("-c"); args.push("set linebreak");
               args.push("-c"); args.push("normal G");
               args.push("-c"); args.push("startinsert");
            }

            args.push(path);

            const child = require('child_process').spawn(editor, args, { stdio: 'inherit' });

            child.on('exit', function(code){
               if(code){ reject(_.error("editor_exit", "editor exited with code: ", code)); }
               else{ resolve(); }
            });
            child.on('error', function(err){ reject(err); });
         });
      }

      const temp_path = "/tmp/ai_editor_" + _.sid_128();

      if(explain !== false){
         text = [
            `// lines starting with "//" are ignored and an empty message aborts the process.`,
            text,
            "", ""
         ].join("\n");
      }

      fs.writeFileSync(temp_path, text);

      try{
         await _open_editor(temp_path);
      }catch(e){
         if(e.code === "editor_exit"){ return(""); }
      }

      let saved_text = fs.readFileSync(temp_path, "utf-8");

      if(!raw){
         saved_text = saved_text.split("\n");
         saved_text = saved_text.filter(function(line){ return !line.startsWith('//'); });
         saved_text = saved_text.join("\n").trim();
      }

      fs.unlinkSync(temp_path);

      return(saved_text);
   };

   ai.register(plugin);
};
