
function deparameterise (index) {
   return this[(1 !== this.length) * index]
}

class TestSineProcessor extends AudioWorkletProcessor {
   constructor () {
      super ()
      this.alive = true
      this.time = 0
   }

   static get parameterDescriptors () {
      return [
          { name: 'time',          defaultValue: 0     },
          { name: 'freq',          defaultValue: 175   },
          { name: 'amp',           defaultValue: 1     },
      ]
  }

   process (_inputs, outputs, parameters) {
      const out = outputs[0][0]
      for (let frame = 0; frame < out.length; frame++) {
         const freq = deparameterise.call (parameters.freq, frame)
         const amp  = deparameterise.call (parameters.amp,  frame)
         const time = deparameterise.call (parameters.time, frame)
         out[frame] = Math.sin (2 * Math.PI * freq * time) * amp
      }

      return this.alive
   }
}

registerProcessor ('test_sine', TestSineProcessor)
