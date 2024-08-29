class PinkNoiseProcessor extends AudioWorkletProcessor {

   constructor () {
      super ()
      this.alive = true
      this.values = Array (10).fill (0)
      this.i = 0
   }

   process (_inputs, outputs) {
      const out = outputs[0][0]

      for (let frame = 0; frame < out.length; frame++) {
         let p = 0.5
         let m = 0.001953125
         let sig = 0

         this.values.forEach ((_, i, a) => {
            if (Math.random () < p) {
               a[i] = Math.random () * 2 - 1
            }

            sig += a[i] * m

            p *= 0.5
            m *= 2
         })

         out[frame] = sig - 0.9990234375
      }


      return this.alive
   }
}

registerProcessor ('pink_noise', PinkNoiseProcessor)
