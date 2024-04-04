const _ = require("../lib/_.js");

const assert = require("assert");

const wrap_data = [
   // TODO: get these first two tests passing. it's unclear what i want it to do in a 1 wrap situation.
   // {
   //    gutter: 0, wrap: 1, n_leading: 0,
   //    chunks: [ "Certainly", "!", " \"", "To", " be", ",", " or", " not", " to", " be", ",", " that", " is", " the", " question", ":", " Whether", " '", "t", "is", " nob", "ler", " in", ],
   //    expected:"Certainly!\"Tobe,ornottobe,thatisthequestion:Whether'tisnoblerin".split("").join("\n")
   // },
   // {
   //    gutter: 3, wrap: 4, n_leading: 0,
   //    chunks: [ "", "Certainly", "!", " \"", "To", " be", ",", " or", " not", " to", " be", ",", " that", " is", " the", " question", ":", " Whether", " '", "t", "is", " nob", "ler", " in", ],
   //    expected: " Certainly! \"To be, or not to be, that is the question: Whether 'tis nobler in".split("").join("\n   ")
   // },
   {
      gutter: 9, wrap: 80,
      label: "user: ",
      chunks: ["recite the\nfirst line from hamelet."],
      expected: "user:    recite the\n         first line from hamelet."
   },
   {
      gutter: 0, wrap: 3,
      chunks: ["aaabbbcccddd"],
      expected: "aaa\nbbb\nccc\nddd"
   },
   {
      gutter: 0, wrap: 3,
      chunks: ["aaa\nbbb\nccc\nddd"],
      expected: "aaa\nbbb\nccc\nddd"
   },
   {
      gutter: 3, wrap: 80,
      chunks: ["open buffers:\n\n```vim\n:bufdo <command>\n```\n\nReplace `<command>` with can use:\n\n```vim\n:bufdo %s/\s\+$//e | update\n```"],
      expected: [
        "   open buffers:",
        "",
        "   ```vim",
        "   :bufdo <command>",
        "   ```",
        "",
        "   Replace `<command>` with can use:",
        "",
        "   ```vim",
        "   :bufdo %s/s+$//e | update",
        "   ```"
      ].join("\n")
   },
   {
      gutter: 3, wrap: 80,
      chunks: ["You can use the following command in Neovim to run a command on all open buffers:\n\n```vim\n:bufdo <command>\n```\n\nReplace `<command>` with the command you want to run. For example, to delete all trailing whitespace in all open buffers, you can use:\n\n```vim\n:bufdo %s/\s\+$//e | update\n```"],
      expected: [
        "   You can use the following command in Neovim to run a command on all open",
        "   buffers:",
        "",
        "   ```vim",
        "   :bufdo <command>",
        "   ```",
        "",
        "   Replace `<command>` with the command you want to run. For example, to delete",
        "   all trailing whitespace in all open buffers, you can use:",
        "",
        "   ```vim",
        "   :bufdo %s/s+$//e | update",
        "   ```"
      ].join("\n")
   },
   {
      gutter: 8, wrap: 80,
      chunks: ["```\nfunction(){\n   if(x === true){\n      print('x is true');\n   }\n}\n```\nbbb\nccc\nddd"],
      expected: [
         "        ```",
         "        function(){",
         "           if(x === true){",
         "              print('x is true');",
         "           }",
         "        }",
         "        ```",
         "        bbb",
         "        ccc",
         "        ddd"
      ].join("\n")
   },
   {
      gutter: 8, wrap: 80,
      chunks: ["```\nfunction(){\n   if(x === true){\n      print('x is true');\n   }\n}\n```\nbbb\nccc\nddd"],
      expected: [
         "        ```",
         "        function(){",
         "           if(x === true){",
         "              print('x is true');",
         "           }",
         "        }",
         "        ```",
         "        bbb",
         "        ccc",
         "        ddd"
      ].join("\n")
   },
   {
      gutter: 8, wrap: 80,
      chunks: [ "", "Certainly", "!", " \"", "To", " be", ",", " or", " not", " to", " be", ",", " that", " is", " the", " question", ":", " Whether", " '", "t", "is", " nob", "ler", " in", " the", " mind", " to", " suffer", " The", " sl", "ings", " and", " arrows", " of", " outrageous", " fortune", ",", " Or", " to", " take", " arms", " against", " a", " sea", " of", " troubles", " And", " by", " opposing", " end", " them", ".", " To", " die", ":", " to", " sleep", ";", " No", " more", ";", " and", " by", " a", " sleep", " to", " say", " we", " end", " The", " heart", "-", "ache", " and", " the", " thousand", " natural", " shocks", " That", " flesh", " is", " heir", " to", ",", " '", "t", "is", " a", " consum", "m", "ation", " Dev", "out", "ly", " to", " be", " wish", "'d", ".", " To", " die", ",", " to", " sleep", ";", " To", " sleep", ":", " perch", "ance", " to", " dream", ":", " ay", ",", " there", "'s", " the", " rub", ";", " For", " in", " that", " sleep", " of", " death", " what", " dreams", " may", " come", " When", " we", " have", " shuffled", " off", " this", " mortal", " coil", ",", " Must", " give", " us", " pause", ":", " there", "'s", " the", " respect", " That", " makes", " calam", "ity", " of", " so", " long", " life", ".\"", "" ],
      expected: [
         "        Certainly! \"To be, or not to be, that is the question: Whether 'tis",
         "        nobler in the mind to suffer The slings and arrows of outrageous",
         "        fortune, Or to take arms against a sea of troubles And by opposing end",
         "        them. To die: to sleep; No more; and by a sleep to say we end The",
         "        heart-ache and the thousand natural shocks That flesh is heir to, 'tis a",
         "        consummation Devoutly to be wish'd. To die, to sleep; To sleep:",
         "        perchance to dream: ay, there's the rub; For in that sleep of death what",
         "        dreams may come When we have shuffled off this mortal coil, Must give us",
         "        pause: there's the respect That makes calamity of so long life.\""
      ].join("\n")
   },
   {
      gutter: 8, wrap: 80,
      chunks: [ "```", "Certainly", "!", " \"", "To", " be", ",", " or", " not", " to", " be", ",", " that", " is", " the", " question", ":", " Whether", " '", "t", "is", " nob", "ler", " in", " the", " mind", " to", " suffer", " The", " sl", "ings", " and", " arrows", " of", " outrageous", " fortune", ",", " Or", " to", " take", " arms", " against", " a", " sea", " of", " troubles", " And", " by", " opposing", " end", " them", ".", " To", " die", ":", " to", " sleep", ";", " No", " more", ";", " and", " by", " a", " sleep", " to", " say", " we", " end", " The", " heart", "-", "```", "ache", " and", " the", " thousand", " natural", " shocks", " That", " flesh", " is", " heir", " to", ",", " '", "t", "is", " a", " consum", "m", "ation", " Dev", "out", "ly", " to", " be", " wish", "'d", ".", " To", " die", ",", " to", " sleep", ";", " To", " sleep", ":", " perch", "ance", " to", " dream", ":", " ay", ",", " there", "'s", " the", " rub", ";", " For", " in", " that", " sleep", " of", " death", " what", " dreams", " may", " come", " When", " we", " have", " shuffled", " off", " this", " mortal", " coil", ",", " Must", " give", " us", " pause", ":", " there", "'s", " the", " respect", " That", " makes", " calam", "ity", " of", " so", " long", " life", ".\"", "" ],
      expected: [
         "        ```Certainly! \"To be, or not to be, that is the question: Whether 'tis nobler in the mind to suffer The slings and arrows of outrageous fortune, Or to take arms against a sea of troubles And by opposing end them. To die: to sleep; No more; and by a sleep to say we end The heart-```",
         "        ache and the thousand natural shocks That flesh is heir to, 'tis a",
         "        consummation Devoutly to be wish'd. To die, to sleep; To sleep:",
         "        perchance to dream: ay, there's the rub; For in that sleep of death what",
         "        dreams may come When we have shuffled off this mortal coil, Must give us",
         "        pause: there's the respect That makes calamity of so long life.\""
      ].join("\n")
   },
   {
      gutter: 9, wrap: 80,
      chunks: [ "", "To", " be", ",", " or", " not", " to", " be", ",", " that", " is", " the", " question", ":\n", "Whether", " '", "t", "is", " nob", "ler", " in", " the", " mind", " to", " suffer", "\n", "The", " sl", "ings", " and", " arrows", " of", " outrageous", " fortune", ",\n", "Or", " to", " take", " arms", " against", " a", " sea", " of", " troubles", "\n", "And", " by", " opposing", " end", " them", ".", " To", " die", ":", " to", " sleep", ";\n", "No", " more", ";", " and", " by", " a", " sleep", " to", " say", " we", " end", "\n", "The", " heart", "-", "ache", " and", " the", " thousand", " natural", " shocks", "\n", "That", " flesh", " is", " heir", " to", ",", " '", "t", "is", " a", " consum", "m", "ation", "\n", "Dev", "out", "ly", " to", " be", " wish", "'d", ".", " To", " die", ",", " to", " sleep", ";\n", "To", " sleep", ":", " perch", "ance", " to", " dream", ":", " ay", ",", " there", "'s", " the", " rub", ";\n", "For", " in", " that", " sleep", " of", " death", " what", " dreams", " may", " come", "\n", "When", " we", " have", " shuffled", " off", " this", " mortal", " coil", ",\n", "Must", " give", " us", " pause", ":", " there", "'s", " the", " respect", "\n", "That", " makes", " calam", "ity", " of", " so", " long", " life", ";\n", "For", " who", " would", " bear", " the", " wh", "ips", " and", " sc", "orns", " of", " time", ",\n", "The", " oppress", "or", "'s", " wrong", ",", " the", " proud", " man", "'s", " cont", "um", "ely", ",\n", "The", " p", "angs", " of", " desp", "ised", " love", ",", " the", " law", "'s", " delay", ",\n", "The", " insol", "ence", " of", " office", " and", " the", " sp", "urn", "s", "\n", "That", " patient", " merit", " of", " the", " unw", "orthy", " takes", ",\n", "When", " he", " himself", " might", " his", " quiet", "us", " make", "\n", "With", " a", " bare", " bod", "kin", "?", " who", " would", " f", "ard", "els", " bear", ",\n", "To", " grunt", " and", " sweat", " under", " a", " weary", " life", ",\n", "But", " that", " the", " dread", " of", " something", " after", " death", ",\n", "The", " undis", "cover", "'d", " country", " from", " whose", " b", "ourn", "\n", "No", " traveller", " returns", ",", " puzzles", " the", " will", "\n", "And", " makes", " us", " rather", " bear", " those", " ", "ills", " we", " have", "\n", "Than", " fly", " to", " others", " that", " we", " know", " not", " of", "?\n", "Thus", " conscience", " does", " make", " cow", "ards", " of", " us", " all", ";\n", "And", " thus", " the", " native", " hue", " of", " resolution", "\n", "Is", " sick", "li", "ed", " o", "'er", " with", " the", " pale", " cast", " of", " thought", ",\n", "And", " enterprises", " of", " great", " p", "ith", " and", " moment", "\n", "With", " this", " regard", " their", " currents", " turn", " aw", "ry", ",\n", "And", " lose", " the", " name", " of", " action", ".--", "Soft", " you", " now", "!\n", "The", " fair", " O", "ph", "elia", "!", " N", "ymph", ",", " in", " thy", " or", "isons", "\n", "Be", " all", " my", " sins", " remember", "'d", ".", "" ],
      expected: [
         "         To be, or not to be, that is the question:",
         "         Whether 'tis nobler in the mind to suffer",
         "         The slings and arrows of outrageous fortune,",
         "         Or to take arms against a sea of troubles",
         "         And by opposing end them. To die: to sleep;",
         "         No more; and by a sleep to say we end",
         "         The heart-ache and the thousand natural shocks",
         "         That flesh is heir to, 'tis a consummation",
         "         Devoutly to be wish'd. To die, to sleep;",
         "         To sleep: perchance to dream: ay, there's the rub;",
         "         For in that sleep of death what dreams may come",
         "         When we have shuffled off this mortal coil,",
         "         Must give us pause: there's the respect",
         "         That makes calamity of so long life;",
         "         For who would bear the whips and scorns of time,",
         "         The oppressor's wrong, the proud man's contumely,",
         "         The pangs of despised love, the law's delay,",
         "         The insolence of office and the spurns",
         "         That patient merit of the unworthy takes,",
         "         When he himself might his quietus make",
         "         With a bare bodkin? who would fardels bear,",
         "         To grunt and sweat under a weary life,",
         "         But that the dread of something after death,",
         "         The undiscover'd country from whose bourn",
         "         No traveller returns, puzzles the will",
         "         And makes us rather bear those ills we have",
         "         Than fly to others that we know not of?",
         "         Thus conscience does make cowards of us all;",
         "         And thus the native hue of resolution",
         "         Is sicklied o'er with the pale cast of thought,",
         "         And enterprises of great pith and moment",
         "         With this regard their currents turn awry,",
         "         And lose the name of action.--Soft you now!",
         "         The fair Ophelia! Nymph, in thy orisons",
         "         Be all my sins remember'd."
      ].join("\n")
   }
];

function test_console_wrapper(){

   const wrap_buffer = require("./wrap_buffer.js");

   _.each.s(wrap_data, function(data, i){

      let actual = "";

      const wrapper = wrap_buffer({
         wrap: _.a_def(data.wrap),
         gutter: _.a_def(data.gutter)
      });

      if(data.label){
         const nl_out = wrapper.ensure_new_line();

         actual += nl_out;
         actual += data.label;
         actual += wrapper.start_line(data.label.length);
      }

      _.each.s(data.chunks, function(chunk){
         const piece = wrapper.stream({ chunk });
         // _.stdout("piece: ", piece + "");
         actual += piece
      });

      actual += wrapper.flush();

      _.stdout(`--- START TEST ${i} ---`);
      _.stdout();
      _.stdout("expect: ");
      _.stdout.write(data.expected);
      _.stdout();

      _.stdout();
      _.stdout("actual: ");
      _.stdout.write(actual);
      _.stdout();

      // _.stdout();
      // _.stdout.write("expect: ");
      // _.stdout.write(data.expected.replace(/ /g, "X"));
      // _.stdout();

      // _.stdout();
      // _.stdout.write("actual: ");
      // _.stdout.write(actual.replace(/ /g, "X"));
      // _.stdout();

      _.stdout(`--- END  TEST ${i} ---`);

      // _.pbcopy(actual + "|\n\n|" + data.expected);
      // _.fatal("reeneable");
      assert.equal(actual, data.expected);

   });


   _.stdout("test_console_wrapper: passed");
}

;(function(){
   test_console_wrapper();
})();
