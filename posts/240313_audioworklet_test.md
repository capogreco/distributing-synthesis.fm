---
title: Testing Audio Worklet
published_at: 2024-02-29
snippet: testing & documenting audioWorklet
disable_html_sanitization: true
---

For much of the 2010s, doing more sophisticated forms of synthesis than simple subtractive and rudimentary FM in the browser required [Script Processor Node](https://developer.mozilla.org/en-US/docs/Web/API/ScriptProcessorNode), which never really seemed to reach full maturity across the board, and in any case, became obsolete with the introduction of [Audio Worklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet) in 2017.  

Currently, Audio Worklet is [almost globally implemented](https://caniuse.com/mdn-api_audioworklet), and currently stands as the best method for browser implementions of phase modulation, or other more esoteric forms of synthesis requiring access to individual samples.

There are a handful of resources about Audio Worklet, including:
- the World Wide Web Consortium (W3C) [specification](https://webaudio.github.io/web-audio-api/#AudioWorklet)
- Hongchan Choi's original 2017 blog post, [Enter Audio Worklet](https://developer.chrome.com/blog/audio-worklet)
- Google Chrome Lab's [resource page](https://googlechromelabs.github.io/web-audio-samples/audio-worklet/)

This post will detail how to implement a simple sine wave synthesiser using Audio Worklet Node.

<div id="ui"></div>

*^ click and drag*

[Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) uses an audio graph paradigm not dissimilar to that used in modular synthesis, wherein nodes, like modules, each with their own inputs and outputs, are routed together to yield a specific audio output at the speakers given particular control inputs at the user interface.  Audio Worklet is an extension of this paradigm, in that it allows you to create custom nodes that can be routed to other nodes in a Web Audio API audio graph.





<script type="module">

   const ui_div  = document.getElementById ("ui")
   ui_div.width  = ui_div.parentNode.scrollWidth
   ui_div.style.height = `${ ui_div.width * 9 / 32 }px`
   ui_div.style.backgroundColor = `tomato`
   ui_div.style.textAlign       = 'center'
   ui_div.style.lineHeight      = ui_div.style.height
   ui_div.style.fontSize        = '36px'
   ui_div.style.fontWeight      = 'bold'
   ui_div.style.fontStyle       = 'italic'
   ui_div.style.color           = 'white'
   ui_div.style.userSelect      = 'none'
   ui_div.innerText = `CLICK TO INITIALISE AUDIO`

   const audio_context = new AudioContext ()
   audio_context.suspend ()

   const graph = {}
   let pointer_down = false
   let cool_down = false

   async function init_audio () {
      await audio_context.resume ()
      await audio_context.audioWorklet.addModule (`/test_worklet.js`)
      graph.sine = await new AudioWorkletNode (audio_context, `test_sine`, {
         processorOptions: {
            sample_rate: audio_context.sampleRate
         }
      })
      graph.sine.connect (audio_context.destination)
      graph.freq = await graph.sine.parameters.get (`freq`)
      graph.amp  = await graph.sine.parameters.get (`amp`)

      ui_div.style.backgroundColor = `limegreen`
      ui_div.innerText = `AUDIO CONTEXT IS ${ audio_context.state.toUpperCase () }`
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

   ui_div.onpointerdown = async e => {
      if (audio_context.state != `running`) {
         await init_audio ()
      }

      ui_div.style.backgroundColor = `limegreen`

      const now = audio_context.currentTime

      graph.amp.setValueAtTime (graph.amp.value, now)
      graph.amp.linearRampToValueAtTime (0.2, now + 0.1)

      const f = 220 * (2 ** point_phase (e).x)

      graph.freq.cancelScheduledValues (now)
      graph.freq.setValueAtTime (graph.freq.value, now)
      graph.freq.exponentialRampToValueAtTime (f, now + 0.3)

      pointer_down = true
   }

   ui_div.onpointermove = e => {

      if (!pointer_down || cool_down) return

      const now = audio_context.currentTime
      const f = 220 * (2 ** point_phase (e).x)

      graph.freq.cancelScheduledValues (now)
      graph.freq.setValueAtTime (graph.freq.value, now)
      graph.freq.exponentialRampToValueAtTime (f, now + 0.1)

      cool_down = true
      setTimeout (() => {
         cool_down = false
      }, 100)
   }

   ui_div.onpointerup = e => {

      if (!graph.amp) {
         console.log (`delaying`)
         setTimeout (ui_div.onpointerup, 100, e)
         return
      }

      const now = audio_context.currentTime

      graph.amp.setValueAtTime (graph.amp.value, now)
      graph.amp.linearRampToValueAtTime (0, now + 0.3)

      graph.freq.cancelScheduledValues (now)
      graph.freq.setValueAtTime (graph.freq.value, now)
      graph.freq.exponentialRampToValueAtTime (16, now + 0.3)

      ui_div.style.backgroundColor = `tomato`

      pointer_down = false
   }

</script>

<br>

