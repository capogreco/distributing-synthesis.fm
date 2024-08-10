class PWMProcessor extends AudioWorkletProcessor {

   constructor ({ processorOptions: { sample_rate } }) {
      super ()
      this.alive = true
      this.phase = Math.random ()
      this.inc   = 1 / sample_rate
   }

   static get parameterDescriptors () {
      return [ 
         { name: 'freq', defaultValue: 220 },
         { name: 'duty_cycle',  defaultValue: 0.5 },
      ]
   }

   process (_inputs, outputs, parameters) {
      const out = outputs[0][0]

      for (let frame = 0; frame < out.length; frame++) {
         let sig = 0
         const freq = deparameterise (parameters.freq, frame)
         const duty_cycle = deparameterise (parameters.duty_cycle, frame)

         sig = this.phase < duty_cycle ? 1 : -1

         this.phase += this.inc * freq
         this.phase %= 1
         out[frame] = sig
      }

      return this.alive
   }
}

registerProcessor ('pwm', PWMProcessor)

function deparameterise (arr, ind) {
   return arr[(1 != arr.length) * ind]
}
