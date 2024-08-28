---
title: Glitch Loop Oscillator
published_at: 2024-08-11
snippet: ... with Audio Worklet.
disable_html_sanitization: true
allow_math: true
---

<canvas id="glitch_loop_oscillator"></canvas>

Audio from [here](https://youtu.be/VeiM3sm6blY?si=VgLal3JLali_A_0I&t=3651).

<script>
   const cnv = document.getElementById (`glitch_loop_oscillator`)
   cnv.width = cnv.parentNode.scrollWidth
   cnv.height = cnv.width * 9 / 16

   const ctx = cnv.getContext (`2d`)
   ctx.fillStyle = `black`
   ctx.fillRect (0, 0, cnv.width, cnv.height)

   const a = {
      ctx: new AudioContext (),
      phase: 0
   }

   a.ctx.suspend ()

   const point_phase = e => {
      const { target: { 
         offsetLeft, offsetTop, offsetWidth, offsetHeight 
      } } = e

      const abs = {
         x: e.clientX ? e.clientX : e.touches[0].clientX,
         y: e.clientY ? e.clientY : e.touches[0].clientY
      }

      const x = (abs.x - offsetLeft) / offsetWidth
      const y = (abs.y - offsetTop)  / offsetHeight

      return { x, y }
   }

   const midi_to_freq = n => 440 * Math.pow (2, (n - 69) / 12)

   const notes = {
      root: 76,
      chord: [ 0, 4, 7, 11 ],
      i: 3,
   }

   notes.next = () => {
      notes.i++
      notes.i %= notes.chord.length
      return midi_to_freq (notes.root + notes.chord[notes.i])
   }

   const init_audio = async () => {
      a.ctx.resume ()

      const asset = await fetch (`/240811/relation_defamiliarised_mono.mp3`)
      const array_buffer = await asset.arrayBuffer ()
      const audio_buffer = await a.ctx.decodeAudioData (array_buffer)
      const audio_data = audio_buffer.getChannelData(0)

      a.wave_form = []

      for (let x = 0; x < cnv.width; x++) {
         const norm_wave = audio_data[Math.floor (audio_data.length * x / cnv.width)]
         const y = (1 + norm_wave) * (cnv.height / 2)
         a.wave_form.push (y)
      }

      await a.ctx.audioWorklet.addModule (`worklets/glitch_loop_osc.js`)
      a.sample = new AudioWorkletNode (a.ctx, `glitch_loop_osc`, {
         processorOptions: {
            audio_data
         }
      })

      a.sample.port.onmessage = e => {
         a.phase = e.data
      }

      a.sample.connect (a.ctx.destination)

      a.freq  = await a.sample.parameters.get (`freq`)
      a.fulcrum = await a.sample.parameters.get (`fulcrum`)
      a.open = await a.sample.parameters.get (`open`)

      draw_frame ()
   }

   cnv.onpointerdown = e => {
      if (a.ctx.state != `running`) init_audio ()
      else {
         const t = a.ctx.currentTime

         a.freq.setValueAtTime (notes.next (), t)

         a.fulcrum.cancelScheduledValues (t)
         a.fulcrum.setValueAtTime (a.phase, t)
         a.fulcrum.linearRampToValueAtTime (point_phase (e).x, t + 2)

         a.open.cancelScheduledValues (t)
         a.open.setValueAtTime (0, t)
         a.open.linearRampToValueAtTime (1, t + 5)
         a.open.linearRampToValueAtTime (0, t + 10)
         a.open.linearRampToValueAtTime (1, t + 20)
      }
   }

   const draw_frame = milli_s => {
      requestAnimationFrame (draw_frame)
      // const t = milli_s * 0.001

      a.sample.port.postMessage (`get_phase`)
      
      ctx.clearRect (0, 0, cnv.width, cnv.height)

      ctx.beginPath ()
      a.wave_form.forEach ((y, x) => {
         ctx.moveTo (x, cnv.height / 2)
         ctx.lineTo (x, y)
      })

      ctx.strokeStyle = `black`
      ctx.stroke ()   

      ctx.beginPath ()
      const x = Math.floor (a.phase * cnv.width)
      ctx.moveTo (x, 0)
      ctx.lineTo (x, cnv.height)

      ctx.strokeStyle = `red`
      ctx.stroke ()
   }   
</script>

```js
// worklets/glitch_loop_osc.js

const deparameterise = (a, i) => a[(a.length != 1) * i]

class GLOProcessor extends AudioWorkletProcessor {
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
         { name: `freq`, defaultValue: 1320 },
         { name: `fulcrum`, defaultValue: 0 },
         { name: `open`, defaultValue: 1 },
      ]
   }

   process (_inputs, outputs, parameters) {
      const out = outputs[0][0]

      for (let frame = 0; frame < out.length; frame++) {
         const rate    = deparameterise (parameters.rate, frame)
         const freq    = deparameterise (parameters.freq, frame)
         const fulcrum = deparameterise (parameters.fulcrum, frame)
         const open    = deparameterise (parameters.open, frame) ** 12

         const period = sampleRate / freq // in frames
         const total_periods = this.audio_data.length / period
         const current_periods = Math.floor (open * (total_periods - 1)) + 1
         const current_frames = current_periods * period
         const fulc_frame = this.audio_data.length * fulcrum
         const start = fulc_frame - (current_frames * fulcrum)
         const end = fulc_frame + (current_frames * (1 - fulcrum))

         if (this.play_head < start) {
            this.play_head = Math.floor (start)
         }

         this.play_head += rate
         out[frame] = this.audio_data[Math.floor(this.play_head)]

         if (this.play_head >= end) {
            this.play_head = Math.floor (start)
         }
       }

      return this.alive
   }
}

registerProcessor (`glitch_loop_osc`, GLOProcessor)
```

```html
<script>
   const cnv = document.getElementById (`glitch_loop_oscillator`)
   cnv.width = cnv.parentNode.scrollWidth
   cnv.height = cnv.width * 9 / 16

   const ctx = cnv.getContext (`2d`)
   ctx.fillStyle = `black`
   ctx.fillRect (0, 0, cnv.width, cnv.height)

   const a = {
      ctx: new AudioContext (),
      phase: 0
   }

   a.ctx.suspend ()

   const point_phase = e => {
      const { target: { 
         offsetLeft, offsetTop, offsetWidth, offsetHeight 
      } } = e

      const abs = {
         x: e.clientX ? e.clientX : e.touches[0].clientX,
         y: e.clientY ? e.clientY : e.touches[0].clientY
      }

      const x = (abs.x - offsetLeft) / offsetWidth
      const y = (abs.y - offsetTop)  / offsetHeight

      return { x, y }
   }

   const midi_to_freq = n => 440 * Math.pow (2, (n - 69) / 12)

   const notes = {
      root: 76,
      chord: [ 0, 4, 7, 11 ],
      i: 3,
   }

   notes.next = () => {
      notes.i++
      notes.i %= notes.chord.length
      return midi_to_freq (notes.root + notes.chord[notes.i])
   }

   const init_audio = async () => {
      a.ctx.resume ()

      const asset = await fetch (`/240811/relation_defamiliarised_mono.mp3`)
      const array_buffer = await asset.arrayBuffer ()
      const audio_buffer = await a.ctx.decodeAudioData (array_buffer)
      const audio_data = audio_buffer.getChannelData(0)

      a.wave_form = []

      for (let x = 0; x < cnv.width; x++) {
         const norm_wave = audio_data[Math.floor (audio_data.length * x / cnv.width)]
         const y = (1 + norm_wave) * (cnv.height / 2)
         a.wave_form.push (y)
      }

      await a.ctx.audioWorklet.addModule (`worklets/glitch_loop_osc.js`)
      a.sample = new AudioWorkletNode (a.ctx, `glitch_loop_osc`, {
         processorOptions: {
            audio_data
         }
      })

      a.sample.port.onmessage = e => {
         a.phase = e.data
      }

      a.sample.connect (a.ctx.destination)

      a.freq  = await a.sample.parameters.get (`freq`)
      a.fulcrum = await a.sample.parameters.get (`fulcrum`)
      a.open = await a.sample.parameters.get (`open`)

      draw_frame ()
   }

   cnv.onpointerdown = e => {
      if (a.ctx.state != `running`) init_audio ()
      else {
         const t = a.ctx.currentTime

         a.freq.setValueAtTime (notes.next (), t)

         a.fulcrum.cancelScheduledValues (t)
         a.fulcrum.setValueAtTime (a.phase, t)
         a.fulcrum.linearRampToValueAtTime (point_phase (e).x, t + 2)

         a.open.cancelScheduledValues (t)
         a.open.setValueAtTime (0, t)
         a.open.linearRampToValueAtTime (1, t + 5)
         a.open.linearRampToValueAtTime (0, t + 10)
         a.open.linearRampToValueAtTime (1, t + 20)
      }
   }

   const draw_frame = milli_s => {
      requestAnimationFrame (draw_frame)
      // const t = milli_s * 0.001

      a.sample.port.postMessage (`get_phase`)
      
      ctx.clearRect (0, 0, cnv.width, cnv.height)

      ctx.beginPath ()
      a.wave_form.forEach ((y, x) => {
         ctx.moveTo (x, cnv.height / 2)
         ctx.lineTo (x, y)
      })

      ctx.strokeStyle = `black`
      ctx.stroke ()   

      ctx.beginPath ()
      const x = Math.floor (a.phase * cnv.width)
      ctx.moveTo (x, 0)
      ctx.lineTo (x, cnv.height)

      ctx.strokeStyle = `red`
      ctx.stroke ()
   }   
</script>
```