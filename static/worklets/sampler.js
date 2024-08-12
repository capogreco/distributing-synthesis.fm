class SampleProcessor extends AudioWorkletProcessor {

   constructor ({ processorOptions: { audio_data } }) {
      super ()
      this.alive = true
      this.play_head = 0
      this.audio_data = audio_data

      this.port.onmessage = e => {
         if (e.data === 'get_phase') {
            this.port.postMessage (this.play_head / this.audio_data.length)
         }
      }
   }

   static get parameterDescriptors () {
      return [ 
         { name: 'rate', defaultValue: 1 },
      ]
   }

   process (_inputs, outputs, parameters) {
      const out = outputs[0][0]

      for (let frame = 0; frame < out.length; frame++) {
         const rate = deparameterise (parameters.rate, frame)

         this.play_head += rate
         this.play_head %= this.audio_data.length

         out[frame] = this.audio_data[Math.floor(this.play_head)]
       }

      return this.alive
   }
}

registerProcessor ('sampler', SampleProcessor)

function deparameterise (arr, ind) {
   return arr[(1 != arr.length) * ind]
}
