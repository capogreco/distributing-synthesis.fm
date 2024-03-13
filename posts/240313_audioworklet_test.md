---
title: Testing audioWorklet
published_at: 2024-02-29
snippet: testing & documenting audioWorklet
disable_html_sanitization: true
---

<div id="initialiser"></div>

<script type="module">
   const init_div  = document.getElementById ("initialiser")
   init_div.width  = init_div.parentNode.scrollWidth
   init_div.style.height = `${ init_div.width * 9 / 16 }px`
   init_div.style.backgroundColor = `tomato`
   init_div.style.textAlign       = 'center'
   init_div.style.lineHeight      = init_div.style.height
   init_div.style.fontSize        = '36px'
   init_div.style.fontWeight      = 'bold'
   init_div.style.fontStyle       = 'italic'
   init_div.style.color           = 'white'
   init_div.innerText = `CLICK TO INITIALISE AUDIO`

   const audio_context = new AudioContext ()
   audio_context.suspend ()

   const graph = {}

   async function init_audio () {
      await audio_context.resume ()
      await audio_context.audioWorklet.addModule (`/test_worklet.js`)
      graph.sine = new AudioWorkletNode (audio_context, `test_sine`)
      const week = 7 * 24 * 60 * 60
      const time = graph.sine.parameters.get (`time`)
      const now = audio_context.currentTime
      time.setValueAtTime (0, now)
      time.linearRampToValueAtTime (week, now + week)
      graph.amp = new GainNode (audio_context, { gain: 0 })
      graph.sine.connect (graph.amp).connect (audio_context.destination)
      graph.amp.gain.setValueAtTime (graph.amp.gain.value, now)
      graph.amp.gain.linearRampToValueAtTime (0.2, now + 0.1)

      init_div.style.backgroundColor = `limegreen`
      init_div.innerText = `AUDIO IS ${ audio_context.state.toUpperCase () }`
   }

   init_div.onclick = () => {
      if (audio_context.state != `running`) {
         init_audio ()
         return
      }

      const now = audio_context.currentTime

      const handle_click = {
         limegreen: () => {
            graph.amp.gain.setValueAtTime (graph.amp.gain.value, now)
            graph.amp.gain.linearRampToValueAtTime (0, now + 0.1)
            init_div.style.backgroundColor = `tomato`
         },
         tomato: () => {
            graph.amp.gain.setValueAtTime (graph.amp.gain.value, now)
            graph.amp.gain.linearRampToValueAtTime (0.2, now + 0.1)
            init_div.style.backgroundColor = `limegreen`
         }
      }

      handle_click[init_div.style.backgroundColor] ()
   }

</script>

<br>

