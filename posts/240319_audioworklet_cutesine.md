---
title: Cute Sine
published_at: 2024-03-19
snippet: with audio worklet
disable_html_sanitization: true
---

Homage to the cutest of Sianne Ngai's [three categories](https://www.jstor.org/stable/41058295).

<canvas id="cnv_of_cute"></canvas>

<script type="module">
   const cnv = document.getElementById ("cnv_of_cute")
   cnv.style.backgroundColor = "turquoise"

   const width = cnv.parentNode.scrollWidth

   cnv.width  = width
   cnv.height = width * 9 / 16

   const ctx = cnv.getContext ('2d')
   ctx.fillStyle = "hotpink";

   const radius = width / 4
   const mid = {
      x: cnv.width / 2,
      y: cnv.height / 2, 
   }

   let pointer_down = false
   let cool_down = false
   let frame_count = 0

   const mouse_pos = { x : 0, y : 0 }

   const total_points = 12

   function draw () {
      const circle_points = []
      ctx.fillStyle = `turquoise`
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

         // ctx.moveTo (circle_points[0].x, circle_points[0].y)
         circle_points.forEach ((p, i) => {
            // const ind = (i + 1) % circle_points.length
            ctx.beginPath()
            ctx.moveTo (mouse_pos.x, mouse_pos.y)
            ctx.lineTo (p.x, p.y)
            ctx.strokeStyle = `hotpink`
            ctx.lineWidth = 6

            ctx.stroke ()
            // ctx.quadraticCurveTo (mouse_pos.x, mouse_pos.y, circle_points[ind].x, circle_points[ind].y);
         })
         // ctx.closePath ()

         // ctx.fillStyle = "hotpink";
         // ctx.fill ()


      }

      frame_count++

      requestAnimationFrame (draw)
   }

   draw ()

   function point_phase (e) {
      const { target: { 
         offsetLeft, offsetTop, offsetWidth, offsetHeight 
      } } = e

      const abs = {
         x: e.clientX ? e.clientX : e.touches[0].clientX,
         y: e.clientY ? e.clientY : e.touches[0].clientY
      }

      const x = abs.x - offsetLeft
      const y = abs.y - offsetTop

      return { x, y }
      // return abs
   }


   cnv.onpointerdown = async e => {
      // if (audio_context.state != `running`) {
      //    await init_audio ()
      // }

      // const now = audio_context.currentTime
      // prepare_params ([ graph.freq, graph.amp ], now)
      
      // const f = 220 * (2 ** point_phase (e).x)
      // graph.freq.exponentialRampToValueAtTime (f, now + 0.3)
      
      // graph.amp.linearRampToValueAtTime (0.2, now + 0.1)

      Object.assign (mouse_pos, point_phase (e))

      pointer_down = true
   }

   cnv.onpointermove = e => {

      // if (!pointer_down || cool_down) return

      // const now = audio_context.currentTime
      // const f = 220 * (2 ** point_phase (e).x)

      // prepare_param (graph.freq, now)
      // graph.freq.exponentialRampToValueAtTime (f, now + 0.1)

      // cool_down = true
      // setTimeout (() => {
      //    cool_down = false
      // }, 100)

      Object.assign (mouse_pos, point_phase (e))
   }

   cnv.onpointerup = e => {

      // if (!graph.amp) {
      //    console.log (`delaying`)
      //    setTimeout (div.onpointerup, 100, e)
      //    return
      // }

      // const now = audio_context.currentTime
      // prepare_params ([ graph.freq, graph.amp ], now)
      // graph.freq.exponentialRampToValueAtTime (16, now + 0.3)
      // graph.amp.linearRampToValueAtTime (0, now + 0.3)

      Object.assign (mouse_pos, point_phase (e))
      pointer_down = false
   }

</script>

