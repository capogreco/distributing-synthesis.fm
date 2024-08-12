const deparameterise = (a, i) => a[(a.length != 1) * i]

class SampleProcessor extends AudioWorkletProcessor {

   constructor ({ processorOptions: { audio_data } }) {
      super ()
      this.alive = true
      this.play_head = 0
      this.audio_data = audio_data

      this.port.onmessage = e => {
         if (e.data === `get_phase`) {
            this.port.postMessage (this.play_head / this.audio_data.length)
         }
      }
   }

   static get parameterDescriptors () {
      return [ 
         { name: `rate`, defaultValue: 1 },
         { name: `start`, defaultValue: 0 },
         { name: `end`, defaultValue: 1 },
         { name: `freq`, defaultValue: 220 },
      ]
   }

   process (_inputs, outputs, parameters) {
      const out = outputs[0][0]

      for (let frame = 0; frame < out.length; frame++) {
         const rate = deparameterise (parameters.rate, frame)
         const start = deparameterise (parameters.start, frame)
         const end = deparameterise (parameters.end, frame)
         const freq = deparameterise (parameters.freq, frame)
         const period = sampleRate / freq
         const diff = Math.abs (end - start) * this.audio_data.length
         const quant_diff = (Math.floor (diff / period) + 1) * period

         this.play_head += rate
         out[frame] = this.audio_data[Math.floor(this.play_head)]

         if (this.play_head >= this.audio_data.length * start + quant_diff) {
            this.play_head = Math.floor (start * this.audio_data.length)
         }
       }

      return this.alive
   }
}

registerProcessor (`sampler`, SampleProcessor)

