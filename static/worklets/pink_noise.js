const bi_rand = () => Math.random () * 2 - 1

class CosineNoiseOperator {
   constructor (period, amp) {
      this.period = period
      this.amp    = amp
      this.frame  = 0
      this.start  = bi_rand ()
      this.end    = bi_rand ()
      this.mid    = (this.start + this.end) / 2
      this.range  = this.start - this.end
   }

   get () {
      if (this.frame === this.period) {
         this.frame = 0
         this.start = this.end
         this.end   = bi_rand ()
         this.mid   = (this.start + this.end) / 2
         this.range = this.start - this.end
      }

      const phase = this.frame / this.period
      const sig = Math.cos (phase * Math.PI) * this.range + this.mid

      this.frame++

      return sig * this.amp
   }
}

class PinkNoiseProcessor extends AudioWorkletProcessor {

   constructor () {
      super ()
      this.alive = true
      this.operators = Array (10).fill (0).map ((_, i) => {
         return new CosineNoiseOperator (2 ** i, 1 / (10 - i))
      })
   }

   process (_inputs, outputs) {
      const out = outputs[0][0]

      for (let frame = 0; frame < out.length; frame++) {
         let sig = 0
         
         this.operators.forEach (op => {
            sig += op.get ()
         })

         out[frame] = sig * 0.5
      }

      return this.alive
   }
}

registerProcessor ('pink_noise', PinkNoiseProcessor)
