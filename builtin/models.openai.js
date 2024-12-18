
module.exports = function({ _, ai, config }){

   ai.models().add([
      {
         type: "openai",
         version: "gpt-3.5-turbo-0125", max_input: 16_385, max_output: 4_096, training_data: "2021-09",
         price: { _1k_in: 0.0010, _1k_out: 0.0020 }
      },
      {
         type: "openai",
         version: "gpt-4-0613", max_input: 8_192, max_output: 8_192, training_data: "2021-09",
         price: { _1k_in: 0.03, _1k_out: 0.06 }
      },
      {
         type: "openai",
         version: "gpt-4-0125-preview", max_input: 128_000, max_output: 4_096, training_data: "2023-04",
         price: { _1k_in: 0.01, _1k_out: 0.03 }
      },
      {
         type: "openai",
         version: "gpt-4-vision-preview", max_input: 128_000, max_output: 4_096, training_data: "2023-04",
         has_vision: true,
         price: {
            _1k_in: 0.01, _1k_out: 0.03,
            image_in: function(w, h){
               const h_tiles = 1 + (Math.ceil((h - 512) / 512));
               const w_tiles = 1 + (Math.ceil((w - 512) / 512));
               const base_tokens = 85;
               const tile_tokens = 170 * (h_tiles * w_tiles)
               const total_tokens = (base_tokens + tile_tokens);
               const price = ((total_tokens / 1000) * this._1k_in);
               return(price);
            }
         }
      }
   ]);

};
