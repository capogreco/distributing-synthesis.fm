---
title: White Noise
published_at: 2024-08-28
snippet: ... with Audio Worklet.
disable_html_sanitization: true
allow_math: true
---

<canvas id="white_noise_example"></canvas>

<script>
   const cnv = document.getElementById (`white_noise_example`)
   cnv.width = cnv.parentNode.scrollWidth
   cnv.height = cnv.width * 9 / 16

   const ctx = cnv.getContext (`2d`)
   ctx.fillStyle = `black`
   ctx.fillRect (0, 0, cnv.width, cnv.height)

   const a = { ctx: new AudioContext () }
   a.ctx.suspend ()

   let is_playing = false

   const init_audio = async () => {
      a.ctx.resume ()

      await a.ctx.audioWorklet.addModule (`worklets/white_noise.js`)
      a.noise = new AudioWorkletNode (a.ctx, `white_noise`)

      a.amp = a.ctx.createGain ()
      a.amp.gain.value = 0.2

      a.noise.connect (a.amp).connect (a.ctx.destination)

      a.analyser = a.ctx.createAnalyser ()
      a.noise.connect (a.analyser)

      a.spectrum = new Uint8Array (a.analyser.frequencyBinCount)
   }

   cnv.onpointerdown = async e => {
      if (a.ctx.state != `running`) {
         await init_audio ()
         is_playing = true
         draw_frame ()
         return
      }

      const t = a.ctx.currentTime
      a.amp.gain.cancelScheduledValues (t)
      a.amp.gain.setValueAtTime (a.amp.gain.value, t)

      if (is_playing) {
         is_playing = false
         a.amp.gain.linearRampToValueAtTime (0, t + 0.02)
      }

      else {
         is_playing = true

         draw_frame ()

         a.amp.gain.linearRampToValueAtTime (0.2, t + 0.02)
      }
   }

   const draw_frame = () => {
      if (!is_playing) {
         ctx.fillStyle = `black`
         ctx.fillRect (0, 0, cnv.width, cnv.height)
         return
      }

      ctx.fillStyle = `white`
      ctx.fillRect (0, 0, cnv.width, cnv.height)

      a.analyser.getByteFrequencyData (a.spectrum)

      ctx.strokeStyle = `black`
      ctx.lineWidth = 1

      ctx.beginPath ()
      for (let x = 0; x < cnv.width; x++) {
         const i = Math.floor ((x / cnv.width) * a.spectrum.length)
         const y = cnv.height * (1 - a.spectrum[i] / 255)
         if (x === 0) ctx.moveTo (x, y)
         else ctx.lineTo (x, y)
      }
      ctx.stroke ()

      requestAnimationFrame (draw_frame)
   }
</script>

```js
// worklets/white_noise.js

class WhiteNoiseProcessor extends AudioWorkletProcessor {

   constructor () {
      super ()
      this.alive = true
   }

   process (_inputs, outputs) {
      const out = outputs[0][0]

      for (let frame = 0; frame < out.length; frame++) {
         out[frame] = Math.random () * 2 - 1
      }

      return this.alive
   }
}

registerProcessor ('white_noise', WhiteNoiseProcessor)
```

```html
<canvas id="white_noise_example"></canvas>

<script>
   const cnv = document.getElementById (`white_noise_example`)
   cnv.width = cnv.parentNode.scrollWidth
   cnv.height = cnv.width * 9 / 16

   const ctx = cnv.getContext (`2d`)
   ctx.fillStyle = `black`
   ctx.fillRect (0, 0, cnv.width, cnv.height)

   const a = { ctx: new AudioContext () }
   a.ctx.suspend ()

   let is_playing = false

   const init_audio = async () => {
      a.ctx.resume ()

      await a.ctx.audioWorklet.addModule (`worklets/white_noise.js`)
      a.noise = new AudioWorkletNode (a.ctx, `white_noise`)

      a.amp = a.ctx.createGain ()
      a.amp.gain.value = 0.2

      a.noise.connect (a.amp).connect (a.ctx.destination)

      a.analyser = a.ctx.createAnalyser ()
      a.noise.connect (a.analyser)

      a.spectrum = new Uint8Array (a.analyser.frequencyBinCount)
   }

   cnv.onpointerdown = async e => {
      if (a.ctx.state != `running`) {
         await init_audio ()
         is_playing = true
         draw_frame ()
         return
      }

      const t = a.ctx.currentTime
      a.amp.gain.cancelScheduledValues (t)
      a.amp.gain.setValueAtTime (a.amp.gain.value, t)

      if (is_playing) {
         is_playing = false
         a.amp.gain.linearRampToValueAtTime (0, t + 0.02)
      }

      else {
         is_playing = true

         draw_frame ()

         a.amp.gain.linearRampToValueAtTime (0.2, t + 0.02)
      }
   }

   const draw_frame = () => {
      if (!is_playing) {
         ctx.fillStyle = `black`
         ctx.fillRect (0, 0, cnv.width, cnv.height)
         return
      }

      ctx.fillStyle = `white`
      ctx.fillRect (0, 0, cnv.width, cnv.height)

      a.analyser.getByteFrequencyData (a.spectrum)

      ctx.strokeStyle = `black`
      ctx.lineWidth = 1

      ctx.beginPath ()
      for (let x = 0; x < cnv.width; x++) {
         const i = Math.floor ((x / cnv.width) * a.spectrum.length)
         const y = cnv.height * (1 - a.spectrum[i] / 255)
         if (x === 0) ctx.moveTo (x, y)
         else ctx.lineTo (x, y)
      }
      ctx.stroke ()

      requestAnimationFrame (draw_frame)
   }
</script>
```