class MangroveProcessor extends AudioWorkletProcessor {

   constructor () {
      super ()
      this.alive = true
      this.phase = Math.random ()
      this.real_phase = this.phase
      this.inc   = 1 / sampleRate
   }

   static get parameterDescriptors () {
      return [ 
         { name: 'freq', defaultValue: 428 * Math.pow (2, 1 / 12)  },
         { name: 'duty_cycle',  defaultValue: 0.5 },
      ]
   }

   process (_inputs, outputs, parameters) {
      const out = outputs[0][0]

      for (let frame = 0; frame < out.length; frame++) {
         let sig = 0
         const freq     = deparameterise (parameters.freq, frame)
         let duty_cycle = deparameterise (parameters.duty_cycle, frame)

         duty_cycle = Math.max (0, Math.min (1, duty_cycle))
         const apex = (Math.pow (4, duty_cycle * 2) - 1) / 4

         sig = this.phase < apex
            ? this.phase / apex
            : 1 - ((this.phase - apex) / apex)

         sig *= 2
         sig -= 1

         let reset_phase = false
         if (sig <= -1) {
            sig = -1
            reset_phase = true
         }

         this.phase      += this.inc * freq
         this.real_phase += this.inc * freq

         if (this.real_phase >= 1) {
            this.real_phase = 0
            if (reset_phase) {
               this.phase = 0
            }
         }

         out[frame] = sig
      }

      return this.alive
   }
}

registerProcessor (`mangrove`, MangroveProcessor)

const deparameterise = (arr, ind) => {
   return arr[(1 != arr.length) * ind]
}
