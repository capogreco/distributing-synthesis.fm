class TestSineProcessor extends AudioWorkletProcessor {
   constructor ({ processorOptions: { sample_rate } }) {
      super ()
      this.alive = true
      this.time  = 0
      this.inc   = 1 / sample_rate
   }

   static get parameterDescriptors () {
      return [
         { name: 'freq', defaultValue: 220 },
         { name: 'amp',  defaultValue: 1   },
      ]
  }

   process (_inputs, outputs, parameters) {
      const out = outputs[0][0]
      for (let frame = 0; frame < out.length; frame++) {
         const freq = deparameterise.call (parameters.freq, frame)
         const amp  = deparameterise.call (parameters.amp,  frame)
         out[frame] = Math.sin (this.time * freq * Math.PI * 2) * amp
         this.time += this.inc
      }

      return this.alive
   }
}

registerProcessor ('test_sine', TestSineProcessor)

function deparameterise (index) {
   return this[(1 !== this.length) * index]
}
