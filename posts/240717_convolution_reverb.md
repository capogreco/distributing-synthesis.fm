---
title: Convolution Reverb
published_at: 2024-07-17
snippet: ... with Web Audio API.
disable_html_sanitization: true
allow_math: true
---

<div id="reverb_example"></div>

<script type="module">
   const div = document.getElementById (`reverb_example`)
   div.width = div.parentNode.scrollWidth
   div.style.height = `${ div.width * 9 / 32 }px`
   div.style.background = `black`

   const midi_to_freq = n => 440 * Math.pow (2, (n - 69) / 12)

   const notes = {
      array: [ 0, 12, 24, 31, 36, 40, 43, 47, 48, 50, 52 ],
      root: 42,
      i: 0,
      next: () => {
         const n = notes.array[notes.i++] + notes.root
         notes.i %= notes.array.length
         return n
      },
      next_freq: () => midi_to_freq (notes.next ()),
   }

   const waves = {
      array: [ `sine`, `triangle`, `sawtooth`, `square` ],
      i: 0,
      next: () => {
         const w = waves.array[waves.i++]
         waves.i %= waves.array.length
         return w
      }
   }

   // audio graph
   const a = {
      is_initialised: false,
      is_playing: false,
   }

   const init = async () => {
      a.ctx = new AudioContext ()

      a.osc = a.ctx.createOscillator ()
      a.osc.frequency.value = notes.next_freq ()

      a.amp = a.ctx.createGain ()
      a.amp.gain.value = 0

      const impulse_response = await fetch (`reverb/R1NuclearReactorHall.m4a`)
      const array_buf = await impulse_response.arrayBuffer ()
      const audio_buf = await a.ctx.decodeAudioData (array_buf)

      a.rev = a.ctx.createConvolver ()
      a.rev.buffer = audio_buf

      a.osc.connect (a.amp)
         .connect (a.rev)
         .connect (a.ctx.destination)
         
      a.osc.start ()

      a.is_initialised = true
   }

   const set_amp = v => {
      const t = a.ctx.currentTime
      a.amp.gain.cancelScheduledValues (t)
      a.amp.gain.setValueAtTime (a.amp.gain.value, t)
      a.amp.gain.linearRampToValueAtTime (v, t + 0.02)
   }

   const play_note = () => {
      const t = a.ctx.currentTime
      const f = notes.next_freq ()

      a.osc.frequency.cancelScheduledValues (t)
      a.osc.frequency.setValueAtTime (a.osc.frequency.value, t)
      a.osc.frequency.exponentialRampToValueAtTime (f, t + 0.05)

      if (notes.i === 1) {
         a.osc.type = waves.next ()
      }

      if (a.is_playing) setTimeout (play_note, 200)
   }

   div.onpointerdown = async () => {
      if (!a.is_initialised) await init ()

      if (!a.is_playing) {
         a.is_playing = true
         div.style.background = `deeppink`

         set_amp (0.1)
         play_note ()
      }

      else {
         a.is_playing = false
         div.style.background = `black`

         set_amp (0)
      }
   }
</script>  

```html
<script type="module">
   const div = document.getElementById (`reverb_example`)
   div.width = div.parentNode.scrollWidth
   div.style.height = `${ div.width * 9 / 32 }px`
   div.style.background = `black`

   const midi_to_freq = n => 440 * Math.pow (2, (n - 69) / 12)

   const notes = {
      array: [ 0, 12, 24, 31, 36, 40, 43, 47, 48, 50, 52 ],
      root: 42,
      i: 0,
      next: () => {
         const n = notes.array[notes.i++] + notes.root
         notes.i %= notes.array.length
         return n
      },
      next_freq: () => midi_to_freq (notes.next ()),
   }

   const waves = {
      array: [ `sine`, `triangle`, `sawtooth`, `square` ],
      i: 0,
      next: () => {
         const w = waves.array[waves.i++]
         waves.i %= waves.array.length
         return w
      }
   }

   // audio graph
   const a = {
      is_initialised: false,
      is_playing: false,
   }

   const init = async () => {
      a.ctx = new AudioContext ()

      a.osc = a.ctx.createOscillator ()
      a.osc.frequency.value = notes.next_freq ()

      a.amp = a.ctx.createGain ()
      a.amp.gain.value = 0

      const impulse_response = await fetch (`reverb/R1NuclearReactorHall.m4a`)
      const array_buf = await impulse_response.arrayBuffer ()
      const audio_buf = await a.ctx.decodeAudioData (array_buf)

      a.rev = a.ctx.createConvolver ()
      a.rev.buffer = audio_buf

      a.osc.connect (a.amp)
         .connect (a.rev)
         .connect (a.ctx.destination)
         
      a.osc.start ()

      a.is_initialised = true
   }

   const set_amp = v => {
      const t = a.ctx.currentTime
      a.amp.gain.cancelScheduledValues (t)
      a.amp.gain.setValueAtTime (a.amp.gain.value, t)
      a.amp.gain.linearRampToValueAtTime (v, t + 0.02)
   }

   const play_note = () => {
      const t = a.ctx.currentTime
      const f = notes.next_freq ()

      a.osc.frequency.cancelScheduledValues (t)
      a.osc.frequency.setValueAtTime (a.osc.frequency.value, t)
      a.osc.frequency.exponentialRampToValueAtTime (f, t + 0.05)

      if (notes.i === 1) {
         a.osc.type = waves.next ()
      }

      if (a.is_playing) setTimeout (play_note, 200)
   }

   div.onpointerdown = async () => {
      if (!a.is_initialised) await init ()

      if (!a.is_playing) {
         a.is_playing = true
         div.style.background = `deeppink`

         set_amp (0.1)
         play_note ()
      }

      else {
         a.is_playing = false
         div.style.background = `black`

         set_amp (0)
      }
   }
</script>  
```