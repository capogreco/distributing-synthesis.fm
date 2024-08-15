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

      // a.src = a.ctx.createBufferSource ()
      // a.src.buffer = audio_buffer
      // a.src.connect (a.ctx.destination)
      // a.src.loop = true
      // await a.src.start ()

      await a.ctx.audioWorklet.addModule (`worklets/sampler.js`)
      a.sample = new AudioWorkletNode (a.ctx, `sampler`, {
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