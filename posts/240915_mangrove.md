---
title: Mangrove Oscillator
published_at: 2024-09-15
snippet: ... using Audio Worklet.
disable_html_sanitization: true
allow_math: true
---

Inspired by the [Mannequins Mangrove](https://www.whimsicalraps.com/products/mangrove).


<canvas id="mangrove_example"></canvas>

<iframe id="demo" src="https://www.youtube.com/embed/k4PVOwMX0Cg?si=lrT8luOpel7m2mIU" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

<script type="module">
   const vid  = document.getElementById (`demo`)
   vid.width  = vid.parentNode.scrollWidth
   vid.height = vid.width * 9 / 16

   const cnv  = document.getElementById ("mangrove_example")
   cnv.width  = cnv.parentNode.scrollWidth
   cnv.height = cnv.width * 9 / 16

   cnv.style.backgroundColor = `black`
   cnv.style.textAlign       = 'center'
   cnv.style.userSelect      = 'none'

   const ctx = cnv.getContext (`2d`)

   const a = { ctx: new AudioContext () }
   a.ctx.suspend ()

   let cool_down    = false
   let is_clicked   = false
   let is_animating = false
   let pointer_down = false

   const midi_to_freq = n => 440 * Math.pow (2, (n - 69) / 12)

   const init_audio = async () => {
      await a.ctx.resume ()

      await a.ctx.audioWorklet.addModule (`worklets/mangrove.js`)

      a.lfo = {
         osc: new OscillatorNode (a.ctx, {
            type: `sine`,
            frequency: 1 / 17.6
         }),
         amp: new GainNode (a.ctx, {
            gain: (midi_to_freq (62) - midi_to_freq (61)) / 2
         })
      }

      console.log (a)
     
      a.mangrove = new AudioWorkletNode (a.ctx, `mangrove`)
      // a.mangrove.connect (a.ctx.destination)

      a.duty_cycle = await a.mangrove.parameters.get (`duty_cycle`)
      a.freq       = await a.mangrove.parameters.get (`freq`)
      a.freq.value = midi_to_freq (61.5)

      // a.hpf = new BiquadFilterNode (a.ctx, { type: `highpass` })
      // a.hpf.type = `highpass`
      // a.hpf.frequency.value = 16
      
      console.log (a.lfo.osc)

      a.lfo.osc
         .connect (a.lfo.amp)
         .connect (a.freq)
      a.lfo.osc.start ()

      a.analyser         = a.ctx.createAnalyser ()
      a.analyser.fftSize = 2048
      a.mangrove
         // .connect (a.hpf)
         .connect (a.analyser)
         .connect (a.ctx.destination)

      a.data_array = new Uint8Array (a.analyser.frequencyBinCount)

      cnv.style.backgroundColor = `white`
   }

   const point_phase = e => {
      const abs = {
         x: e.clientX ? e.clientX : e.touches[0].clientX,
         y: e.clientY ? e.clientY : e.touches[0].clientY
      }

      const rect = e.target.getBoundingClientRect ()

      const x = (abs.x - rect.x) / e.target.width
      const y = (abs.y - rect.y) / e.target.height

      return { x, y }
   }

   const prepare_param = (p, now) => {
      p.setValueAtTime (p.value, now)
      p.cancelScheduledValues (now)
   }

   const prepare_params = (a, now) => {
      a.forEach (p => prepare_param (p, now))
   }

   const find_Uint8_zc = a => {
      for (let i = 0; i < a.length - 1; i++) {
         if (a[i] < 128 && a[i+1] >= 128) return i
      }

      return 0
   }

   const splice_array = (a, start, length) => {

      if (a.length < start + length) {
         // console.log (`array is too short`)
         return [0]
         // return Array (length).fill (0)
      }

      const r = []
      for (let i = start; i < start + length; i++) r.push (a[i])
      return r

   }


   const draw_frame = () => {
      if (is_animating) requestAnimationFrame (draw_frame)

      if (!is_animating) {
         ctx.fillStyle = `black`
         ctx.fillRect (0, 0, cnv.width, cnv.height)
         return
      }

      a.analyser.getByteTimeDomainData (a.data_array)

      const period = Math.floor (a.ctx.sampleRate * 3 / a.freq.value)
      const z_crossing = find_Uint8_zc (a.data_array)
      const wave_data = splice_array (a.data_array, z_crossing, period)

      ctx.clearRect (0, 0, cnv.width, cnv.height)

      ctx.fillStyle = `black`
      ctx.strokeStyle = `black`
      ctx.lineWidth = 6
      ctx.beginPath ()

      for (let x = 0; x < cnv.width; x++) {
         const p = x / cnv.width
         const i = Math.floor (wave_data.length * p)
         const h = cnv.height / 3
         const y = cnv.height - h - (wave_data[i] * h / 255)
         if (x == 0) ctx.moveTo (x, y)
         else ctx.lineTo (x, y)         
      }
      ctx.stroke ()
   }

   cnv.onpointerdown = async e => {
      is_clicked = true

      if (a.ctx.state != `running`) {
         await init_audio ()
      }

      cnv.style.backgroundColor = `white`

      const point = point_phase (e)

      const now = a.ctx.currentTime
      // prepare_params ([ a.freq, a.duty_cycle ], now)
      prepare_param (a.duty_cycle, now)
      
      // const f = 220 * (2 ** point.x)
      // console.log (`freq is: ${ a.freq.value }`)
      // if (a.freq.value === 0) {
      //    a.freq.linearRampToValueAtTime (16, now + 0.1)
      // }
      // a.freq.exponentialRampToValueAtTime (f, now + 0.3)
      
      a.duty_cycle.linearRampToValueAtTime (point.y, now + 0.1)

      pointer_down = true
      // is_animating = true

   }

   cnv.onpointermove = e => {
      if (!pointer_down || cool_down) return
      is_clicked = false      

      const point = point_phase (e)

      const now = a.ctx.currentTime
      // const f = 220 * (2 ** point.x)

      // prepare_params ([ a.freq, a.duty_cycle ], now)
      prepare_param (a.duty_cycle, now)
      // a.freq.exponentialRampToValueAtTime (f, now + 0.1)
      a.duty_cycle.linearRampToValueAtTime (point.y, now + 0.1)

      cool_down = true
      setTimeout (() => {
         cool_down = false
      }, 100)
   }

   cnv.onpointerup = e => {
      if (!a.mangrove) {
         console.log (`delaying`)
         setTimeout (cnv.onpointerup, 100, e)
         return
      }

      if (is_clicked) {
         console.log (is_animating)

         if (is_animating) {
            draw_frame ()
         }
         
         if (!is_animating) {
            const now = a.ctx.currentTime
            prepare_params ([ a.freq, a.duty_cycle ], now)
            a.freq.exponentialRampToValueAtTime (16, now + 0.3)
            a.freq.linearRampToValueAtTime (0, now + 0.4)
            a.duty_cycle.linearRampToValueAtTime (0, now + 0.3)

         }

         // cnv.style.backgroundColor = `black`
         is_animating = !is_animating
         console.log (is_animating)
         is_clicked = false
      }

      pointer_down = false
   }
</script>