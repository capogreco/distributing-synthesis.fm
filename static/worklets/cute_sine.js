class CuteSineProcessor extends AudioWorkletProcessor {

    constructor ({ processorOptions: { sample_rate } }) {
       super ()
       this.alive = true
       this.phase = Math.random ()
       this.inc   = 1 / sample_rate
    }
 
    static get parameterDescriptors () {
       return [ 
          { name: 'freq', defaultValue: 220 },
          { name: 'amp',  defaultValue: 0 },
          { name: 'bright', defaultValue: 0 },
       ]
    }
 
    process (_inputs, outputs, parameters) {
       const out = outputs[0][0]


       for (let frame = 0; frame < out.length; frame++) {
            let sig = 0
            const freq = deparameterise (parameters.freq, frame)
            const amp  = deparameterise (parameters.amp,  frame)
            const bright = deparameterise (parameters.bright, frame)

            let bright_dec = (bright * 5) + 1

            for (let i = 1; i <= 6; i++) {
                const b_amp = Math.min (bright_dec, 1)
                sig += Math.sin (this.phase * Math.PI * 2 * i) * (amp / i) * b_amp

                bright_dec -= 1
                bright_dec = Math.max (bright_dec, 0)
            }

            this.phase += this.inc * freq
            this.phase %= 1
            out[frame] = sig
            // out[frame] = Math.sin (this.phase * Math.PI * 2) * amp
        }
 
       return this.alive
    }
 }
 
 registerProcessor ('cute_sine', CuteSineProcessor)
 
 function deparameterise (arr, ind) {
    return arr[(1 != arr.length) * ind]
 }
 