
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
          { name: 'time', defaultValue: 0   },
          { name: 'freq', defaultValue: 220 },
          { name: 'amp',  defaultValue: 1   },
      ]
  }

   process (_inputs, outputs, parameters) {
      const out = outputs[0][0]
      for (let frame = 0; frame < out.length; frame++) {
         const time = deparameterise.call (parameters.time, frame)
         const freq = deparameterise.call (parameters.freq, frame)
         const amp  = deparameterise.call (parameters.amp,  frame)
         out[frame] = Math.sin (time * freq * Math.PI * 2) * amp
      }

      return this.alive
   }
}

registerProcessor ('test_sine', TestSineProcessor)
