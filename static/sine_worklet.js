class SineProcessor extends AudioWorkletProcessor {

   constructor ({ processorOptions: { sample_rate } }) {
      super ()
      this.alive = true
      this.phase = Math.random ()
      this.inc   = 1 / sample_rate
   }

   static get parameterDescriptors () {
      return [ 
         { name: 'freq', defaultValue: 16 },
         { name: 'amp',  defaultValue: 0 },
      ]
   }

   process (_inputs, outputs, parameters) {
      const out = outputs[0][0]
      for (let frame = 0; frame < out.length; frame++) {
         // const freq = deparameterise.call (parameters.freq, frame)
         // const amp  = deparameterise.call (parameters.amp,  frame)
         const freq = deparameterise (parameters.freq, frame)
         const amp  = deparameterise (parameters.amp,  frame)
         out[frame] = Math.sin (this.phase * Math.PI * 2) * amp
         this.phase += this.inc * freq
         this.phase %= 1
      }

      return this.alive
   }
}

registerProcessor ('worklet_sine', SineProcessor)


function deparameterise (arr, ind) {
   return arr[(1 !== arr.length) * ind]
}
