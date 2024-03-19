import b from "https://esm.sh/v135/marked-footnote@1.2.2/denonext/marked-footnote.mjs";

class CuteSineProcessor extends AudioWorkletProcessor {

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

            for (let i = 1; i <= 6; i++) {
                const full = bright * 6 > i - 1
                let b_amp = full ? 1 : bright * 6 - i + 1
                sig += Math.sin (this.phase * Math.PI * 2 * i) * (amp / i) * b_amp
            }

            this.phase += this.inc * freq
            this.phase %= 1
            out[frame] = sig
        }
 
       return this.alive
    }
 }
 
 registerProcessor ('cute_sine', CuteSineProcessor)
 
 function deparameterise (arr, ind) {
    return arr[(1 != arr.length) * ind]
 }
 