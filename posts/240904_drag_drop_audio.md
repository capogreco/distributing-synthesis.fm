---
title: Drag and Drop Audio Files
published_at: 2024-09-04
snippet: ... into the browser.
disable_html_sanitization: true
allow_math: true
---


<canvas id="drag_drop_example"></canvas>

<script>
   const a = { ctx: new AudioContext () }

   const sounds = Array (3).fill (0).map (() => new Audio ())

   const cnv = document.getElementById (`drag_drop_example`)
   cnv.width = cnv.parentNode.scrollWidth
   cnv.height = Math.ceil (cnv.width * 9 / 16)

   const ctx = cnv.getContext (`2d`)
   ctx.fillStyle = `black`
   ctx.fillRect (0, 0, cnv.width, cnv.height)

   ctx.fillStyle = `white`
   ctx.font = `48px sans-serif`
   ctx.fillText (`click!`, cnv.width / 2, cnv.height / 2)

   const indicate = i => {
      ctx.fillStyle = sounds[i].paused ? `orange` : `green`      
      ctx.fillRect (cnv.width * i / 3, 0, cnv.width / 3, cnv.height)
   }

   const toggle_sound = i => {
      if (sounds[i].paused) sounds[i].play ()
      else sounds[i].pause ()
      indicate (i)
   }

   const click_handler = e => {
      const i = Math.floor ((e.clientX - cnv.offsetLeft) * 3 / cnv.width)
      if (sounds[i].readyState === 4) toggle_sound (i)
   }

   cnv.onpointerdown = e => {
      if (a.ctx.state != `running`) {
         a.ctx.resume ()

         ctx.fillStyle = `black`
         ctx.fillRect (0, 0, cnv.width, cnv.height)

         ctx.strokeStyle = `white`
         ctx.lineWidth = 6
         ctx.lineCap = `square`

         ctx.moveTo (cnv.width / 3, 0)
         ctx.lineTo (cnv.width / 3, cnv.height)
         ctx.moveTo (cnv.width * 2 / 3, 0)
         ctx.lineTo (cnv.width * 2/ 3, cnv.height)

         ctx.stroke ()
      }
      else click_handler (e)
   }



   cnv.ondragover = e => e.preventDefault ()

   cnv.ondrop = async e => {
      e.preventDefault ()

      // if (a.ctx.state != `running`) {
      //    await a.ctx.resume ()
      // }

      const i = Math.floor ((e.clientX - cnv.offsetLeft) * 3 / cnv.width)

      if (!e.dataTransfer.items) return

      [ ...e.dataTransfer.items ].forEach (async item => {

         const file = await item.getAsFile ()
         console.log (file.name)

         const url  = await URL.createObjectURL (file)

         sounds[i].src = await url

         indicate (i)

         // for glitch loop oscillator:
         // const array_buffer = await file.arrayBuffer ()
         // const audio_data = await a.ctx.decodeAudioData (array_buffer)
         // const channel_data = audio_data.getChannelData (0)
      })
   }

</script>