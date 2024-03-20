---
title: Beauty Song Contest
published_at: 2024-03-19
snippet: with audio worklet
disable_html_sanitization: true
---

A science family of Sianne Ngai's [three categories](https://www.jstor.org/stable/41058295).

<canvas id="cnv_of_cute"></canvas>

*^ click and drag for control*

```js
// cute_sine.js
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
            const freq   = deparameterise (parameters.freq,   frame)
            const amp    = deparameterise (parameters.amp,    frame)
            const bright = deparameterise (parameters.bright, frame)

            let sig = 0
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
        }
 
       return this.alive
    }
 }
 
 registerProcessor ('cute_sine', CuteSineProcessor)
 
 function deparameterise (arr, ind) {
    return arr[(1 != arr.length) * ind]
 }
 ```



<script type="module">
   import { reverbjs } from '/reverb/reverb.js'

   document.body.style.userSelect      = 'none'

   const cnv = document.getElementById ("cnv_of_cute")
   cnv.style.backgroundColor = "turquoise"

   const width = cnv.parentNode.scrollWidth
   const height = width * 9 / 16

   cnv.width  = width
   cnv.height = height

   const ctx = cnv.getContext ('2d')
   ctx.fillStyle = "hotpink";

   let radius = width / 4
   const mid = {
      x: cnv.width / 2,
      y: cnv.height / 2, 
   }

   let pointer_down = false
   let cool_down = false
   let frame_count = 0

   const audio_context = new AudioContext ()
   audio_context.suspend ()

   const graph = {}

   const mouse_pos = { x : 0, y : 0 }

   const total_points = 5

   function draw () {
      const circle_points = []
      ctx.fillStyle = pointer_down ? `white` : `hotpink`
      ctx.fillRect (0, 0, cnv.width, cnv.height)

      const phase_off = frame_count * -1 / (2 ** 12)

      if (pointer_down) {
         for (let i = 0; i < total_points; i++) {

            const phase = i / total_points
            const angle = (phase + phase_off) * Math.PI * 2

            const x = mid.x + (Math.sin (angle) * radius)
            const y = mid.y + (Math.cos (angle) * radius)

            circle_points.push ({ x, y })
         }

         circle_points.forEach ((p, i) => {
            ctx.beginPath()
            ctx.moveTo (mouse_pos.x, mouse_pos.y)
            ctx.lineTo (p.x, p.y)
            ctx.strokeStyle = `hotpink`
            ctx.lineWidth = 4

            ctx.stroke ()
         })
      }

      frame_count++

      requestAnimationFrame (draw)
   }

   draw ()

   async function init_audio () {
      await audio_context.resume ()
      await audio_context.audioWorklet.addModule (`worklets/cute_sine.js`)
      // await audio_context.audioWorklet.addModule (`worklets/sine_worklet.js`)

      reverbjs.extend (audio_context)

      graph.rev_vol = audio_context.createGain ()
      graph.rev_vol.gain.value = 0
      graph.rev_vol.connect (audio_context.destination)

      const reverb_url = "/reverb/R1NuclearReactorHall.m4a"
      graph.rev = audio_context.createReverbFromUrl (reverb_url, () => {
         graph.rev.connect (graph.rev_vol)
      })

graph.rev_gate = audio_context.createGain ()
      graph.rev_gate.gain.value = 0
      graph.rev_gate.connect (graph.rev)


      graph.sine = new AudioWorkletNode (audio_context, `cute_sine`, {
         processorOptions: {
            sample_rate: audio_context.sampleRate
         }
      })
      graph.sine.connect (audio_context.destination)
      graph.sine.connect (graph.rev_gate)

      graph.freq = await graph.sine.parameters.get (`freq`)
      graph.amp  = await graph.sine.parameters.get (`amp`)
      graph.bright = await graph.sine.parameters.get (`bright`)
   }


   function point_phase (e) {
      const { target: { 
         offsetLeft, offsetTop, offsetWidth, offsetHeight 
      } } = e

      const abs = {
         x: (e.clientX ? e.clientX : e.touches[0].clientX) - offsetLeft,
         y: (e.clientY ? e.clientY : e.touches[0].clientY) - offsetTop
      }

      const x = abs.x / offsetWidth
      const y = abs.y / offsetHeight

      // abs.x -= offsetWidth / 2
      // abs.y -= offsetHeight / 2

      return { x, y, abs }
      // return abs
   }

   function prepare_param (p, now) {
      p.cancelScheduledValues (now)
      p.setValueAtTime (p.value, now)
   }

   function prepare_params (a, now) {
      a.forEach (p => prepare_param (p, now))
   }

   cnv.onpointerdown = async e => {
      if (audio_context.state != `running`) {
         await init_audio ()
      }

      const now = audio_context.currentTime      
      const phase = point_phase (e)
      prepare_params ([ graph.amp, graph.bright ], now)

      graph.amp.linearRampToValueAtTime (0.2, now + 0.02)

      const inverted_y = 1 - phase.y
      graph.bright.linearRampToValueAtTime (inverted_y, now + 0.1)

      // const rev_amp = Math.max (inverted_y - 5)
      // graph.rev_gate.gain.linearRampToValueAtTime (rev_amp, now + 2)

      radius = (height / 2) * (1 - phase.y)

      Object.assign (mouse_pos, point_phase (e).abs)

      // const f = freq_array[Math.floor (phase.x * 12)]
      const f = 220 * (2 ** phase.x)
      set_frequency (e, f)

      pointer_down = true
   }

   const chord = [ 0, 2, 4, 7, 8, 10 ]
   const root = 58

   const freq_array = []
   for (let o = 0; o < 3; o++) {
      for (let n = 0; n < chord.length; n++) {
         const midi = (o * 12) + chord[n] + root
         freq_array.push (note_to_cps (midi))
      }
   }

   function note_to_cps (n) {
      return 440 * (2 ** ((n - 69) / 12))
   }

   cnv.onpointermove = e => {

      Object.assign (mouse_pos, point_phase (e).abs)

      if (audio_context.state != `running`) return

      const phase = point_phase (e)
      radius = (height / 2) * (1 - phase.y)

      const now = audio_context.currentTime

      // prepare_param (graph.bright, now)
      // graph.bright.linearRampToValueAtTime (1 - phase.y, now + 0.1)

      // move_frequency (e)

      const f = 220 * (2 ** phase.x)
      set_frequency (e, f)

   }

   function move_frequency (e) {
      const f = freq_array[Math.floor (point_phase (e).x * 12)]
      if (f != graph.freq_value) {
         set_frequency (e, f)
      }
   }

   function set_frequency (e, f) {
         if (!pointer_down || cool_down) return

         const phase = point_phase (e)

         const now = audio_context.currentTime
         prepare_param (graph.freq, now)
         prepare_param (graph.bright, now)

         graph.freq.exponentialRampToValueAtTime (f, now + 0.1)

         const inverted_y = 1 - phase.y
         graph.bright.linearRampToValueAtTime (inverted_y, now + 0.1)

         const rev_amp = inverted_y * 0.3
         // const rev_amp = Math.max (inverted_y * 3 - 2, 0) * 0.2
         graph.rev_gate.gain.linearRampToValueAtTime (rev_amp, now + 0.1)
         graph.rev_vol .gain.linearRampToValueAtTime (rev_amp, now + 0.1)

         graph.freq_value = f

         cool_down = true
         setTimeout (() => {
            cool_down = false
         }, 100)
   }

   cnv.onpointerup = e => {

      if (!graph.amp) {
         console.log (`delaying`)
         setTimeout (cnv.onpointerup, 100, e)
         return
      }

      const now = audio_context.currentTime
      prepare_params ([ graph.freq, graph.amp ], now)

      // graph.freq.exponentialRampToValueAtTime (16, now + 0.02)
      graph.amp.linearRampToValueAtTime (0, now + 0.02)

      // Object.assign (mouse_pos, point_phase (e))
      pointer_down = false
   }

</script>

