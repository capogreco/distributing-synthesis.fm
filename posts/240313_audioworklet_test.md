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

<script type="module">

   const ui_div  = document.getElementById ("ui")
   ui_div.width  = ui_div.parentNode.scrollWidth
   ui_div.style.height = `${ ui_div.width * 9 / 16 }px`
   ui_div.style.backgroundColor = `tomato`
   ui_div.style.textAlign       = 'center'
   ui_div.style.lineHeight      = ui_div.style.height
   ui_div.style.fontSize        = '36px'
   ui_div.style.fontWeight      = 'bold'
   ui_div.style.fontStyle       = 'italic'
   ui_div.style.color           = 'white'
   ui_div.innerText = `CLICK TO INITIALISE AUDIO`

   const audio_context = new AudioContext ()
   audio_context.suspend ()

   const graph = {}

   async function init_audio () {
      await audio_context.resume ()
      await audio_context.audioWorklet.addModule (`/test_worklet.js`)
      graph.sine = new AudioWorkletNode (audio_context, `test_sine`, {
         processorOptions: {
            sample_rate: audio_context.sampleRate
         }
      })
      const week = 7 * 24 * 60 * 60
      const now = audio_context.currentTime
      graph.amp = new GainNode (audio_context, { gain: 0 })
      graph.sine.connect (graph.amp).connect (audio_context.destination)
      graph.freq = graph.sine.parameters.get (`freq`)
      graph.amp.gain.setValueAtTime (graph.amp.gain.value, now)
      graph.amp.gain.linearRampToValueAtTime (0.2, now + 0.1)

      ui_div.style.backgroundColor = `limegreen`
      ui_div.innerText = `AUDIO IS ${ audio_context.state.toUpperCase () }`
   }

   function point_phase (e) {
      const { target: { 
         offsetLeft, offsetTop, offsetWidth, offsetHeight 
      } } = e

      const x = (e.clientX - offsetLeft) / offsetWidth
      const y = (e.clientY - offsetTop)  / offsetHeight

      return { x, y }
   }

   ui_div.onpointerdown = async e => {

      if (audio_context.state != `running`) {
         await init_audio ()
      }

      ui_div.style.backgroundColor = `limegreen`

      const now = audio_context.currentTime

      graph.amp.gain.setValueAtTime (graph.amp.gain.value, now)
      graph.amp.gain.linearRampToValueAtTime (0.2, now + 0.1)

      const f = 220 * (2 ** point_phase (e).x)

      // console.log (f)
      graph.freq.setValueAtTime (graph.freq.value, now)
      graph.freq.exponentialRampToValueAtTime (f, now + 0.3)

   }

   ui_div.onpointerup = async e => {

      await graph.amp

      const now = audio_context.currentTime
      graph.amp.gain.setValueAtTime (graph.amp.gain.value, now)
      graph.amp.gain.linearRampToValueAtTime (0, now + 0.1)

      ui_div.style.backgroundColor = `tomato`

   }

</script>

<br>

