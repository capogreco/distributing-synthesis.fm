---
title: Mangrove Oscillator
published_at: 2024-09-15
snippet: ... using Audio Worklet.
disable_html_sanitization: true
allow_math: true
---

Inspired by one of my favourite oscillators, the [Mannequins Mangrove](https://www.whimsicalraps.com/products/mangrove).


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

   let pointer_down = false
   let cool_down = false

   const init_audio = async () => {
      await a.ctx.resume ()
      await a.ctx.audioWorklet.addModule (`worklets/mangrove.js`)
      
      a.mangrove = new AudioWorkletNode (a.ctx, `mangrove`)
      a.mangrove.connect (a.ctx.destination)

      a.freq       = await a.mangrove.parameters.get (`freq`)
      a.duty_cycle = await a.mangrove.parameters.get (`duty_cycle`)

      a.analyser         = a.ctx.createAnalyser ()
      a.analyser.fftSize = 2048
      a.mangrove.connect (a.analyser)

      a.data_array = new Uint8Array (a.analyser.frequencyBinCount)

      cnv.style.backgroundColor = `white`
   }

   function point_phase (e) {
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

   function prepare_param (p, now) {
      p.cancelScheduledValues (now)
      p.setValueAtTime (p.value, now)
   }

   function prepare_params (a, now) {
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
         console.log (`array is too short`)
         return Array (length).fill (0)
      }

      const r = []
      for (let i = start; i < start + length; i++) r.push (a[i])
      return r

   }

   let is_animating = false
   // let offset = 0

   const draw_frame = () => {
      if (!is_animating) return

      requestAnimationFrame (draw_frame)

      a.analyser.getByteTimeDomainData (a.data_array)

      const period = Math.floor (a.ctx.sampleRate / a.freq.value)
      // offset += a.data_array.length % period
      // offset %= a.data_array.length - period
      const z_crossing = find_Uint8_zc (a.data_array)
      const wave_data = splice_array (a.data_array, z_crossing, period)
      // console.log (offset, wave_data)

      ctx.clearRect (0, 0, cnv.width, cnv.height)

      ctx.fillStyle = `black`
      ctx.strokeStyle = `black`
      ctx.lineWidth = 6
      ctx.beginPath ()

      for (let x = 0; x < cnv.width; x++) {
         const p = x / cnv.width
         // const i = Math.floor (a.data_array.length * p)
         const i = Math.floor (wave_data.length * p)
         const h = cnv.height / 3
         const y = cnv.height - h - (wave_data[i] * h / 255)
         if (x == 0) ctx.moveTo (x, y)
         else ctx.lineTo (x, y)         
      }
      ctx.stroke ()
   }

   cnv.onpointerdown = async e => {
      if (a.ctx.state != `running`) {
         await init_audio ()
      }

      cnv.style.backgroundColor = `white`

      const now = a.ctx.currentTime
      prepare_params ([ a.freq, a.duty_cycle ], now)
      
      const f = 220 * (2 ** point_phase (e).x)
      a.freq.exponentialRampToValueAtTime (f, now + 0.3)
      
      a.duty_cycle.linearRampToValueAtTime (0.2, now + 0.1)

      pointer_down = true
      is_animating = true

      draw_frame ()
   }

   cnv.onpointermove = e => {

      if (!pointer_down || cool_down) return

      const now = a.ctx.currentTime
      const f = 220 * (2 ** point_phase (e).x)

      prepare_params ([ a.freq, a.duty_cycle ], now)
      a.freq.exponentialRampToValueAtTime (f, now + 0.1)
      a.duty_cycle.linearRampToValueAtTime (point_phase (e).y, now + 0.1)

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

      const now = a.ctx.currentTime
      prepare_params ([ a.freq, a.duty_cycle ], now)
      a.freq.exponentialRampToValueAtTime (16, now + 0.3)
      a.freq.linearRampToValueAtTime (0, now + 0.6)
      a.duty_cycle.linearRampToValueAtTime (0, now + 0.3)

      cnv.style.backgroundColor = `black`

      pointer_down = false
      is_animating = false
   }

</script>