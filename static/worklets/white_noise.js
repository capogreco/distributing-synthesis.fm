class WhiteNoiseProcessor extends AudioWorkletProcessor {

   constructor () {
      super ()
      this.alive = true
   }

   process (_inputs, outputs) {
      const out = outputs[0][0]

      for (let frame = 0; frame < out.length; frame++) {
         out[frame] = Math.random () * 2 - 1
      }

      return this.alive
   }
}

registerProcessor ('white_noise', WhiteNoiseProcessor)
