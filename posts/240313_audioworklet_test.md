---
title: Testing Audio Worklet
published_at: 2024-02-29
snippet: testing & documenting audioWorklet
disable_html_sanitization: true
---

For much of the 2010s, doing more sophisticated forms of synthesis than simple subtractive and rudimentary FM in the browser required [Script Processor Node](https://developer.mozilla.org/en-US/docs/Web/API/ScriptProcessorNode), which never really seemed to reach full maturity across the board, and in any case, became obsolete with the introduction of [Audio Worklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet) in 2017.  

Currently, **Audio Worklet** is [almost globally implemented](https://caniuse.com/mdn-api_audioworklet), and currently stands as the best method for browser implementions of phase modulation, or any other more esoteric form of synthesis requiring access to individual samples.

There are a handful of resources about **Audio Worklet**, including:
- the World Wide Web Consortium (W3C) [specification](https://webaudio.github.io/web-audio-api/#AudioWorklet)
- Hongchan Choi's original 2017 blog post, [Enter Audio Worklet](https://developer.chrome.com/blog/audio-worklet)
- Google Chrome Lab's [resource page](https://googlechromelabs.github.io/web-audio-samples/audio-worklet/)

This post will detail how to implement this simple sine wave synthesiser using **Audio Worklet**:

<div id="worklet_example"></div>

*^ click and drag for control*

## Web Audio API

The [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) uses an audio graph paradigm (not dissimilar to that used in modular synthesis) wherein nodes (like modules) each with their own inputs and outputs, are routed together to create a synthesis system that yields some specified audio output at the speakers given some specified control input at the user interface (or generative algorithm).

**Audio Worklet** extends this paradigm by providing a way to instantiate custom nodes, which can then be routed with other nodes in the Web Audio API audio graph.

## Audio Context

```js
const audio_context = new AudioContext ()
```

The Web Audio API revolves around a central object, the [AudioContext](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext) (see also: [BaseAudioContext](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext)), which is responsible for: 
- exposing the device's hardware output bus: [`audio_context.destination`](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/destination)
- providing a clock for scheduling events: [`audio_context.currentTime`](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/currentTime)
- providing us with the sample rate, as: [`audio_context.sampleRate`](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/sampleRate)
- holding its current status, at: [`audio_context.state`](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state)

So as to make for a more comfortable browsing experience, upon loading in a newly opened webpage, an Audio Context is restricted from making sound in any browser before some form of user gesture.

For this reason, it is good practice to either wait for a user gesture to instantiate a new Audio Context, or to suspend it explicitly immediately after instatiation:

```js
const audio_context = new AudioContext ()
audio_context.suspend ()
```
... and then, resume it on some sort of user gesture, for example:

```js
document.body.onpointerdown = () => audio_context.resume ()
```

For most use cases, it makes sense to have `audio_context.resume ()` inside some sort of audio initialisation function, which can also be responsible for building a persistant node graph.

## Instantiating Nodes

Nodes can be instantiated in [two ways](https://developer.mozilla.org/en-US/docs/Web/API/AudioNode#creating_an_audionode), via an Audio Context instance method:

```js
const osc = audio_context.createOscillator ()
const amp = audio_context.createGain ()
```

... or via their class constructor, for example:

```js
const osc = new OscillatorNode (audio_context)
const amp = new GainNode (audio_context)
```

## AudioParam

Some attributes can be set directly, for example:

```js 
osc.type = `sawtooth`
```

However, since many parameters require the ability to be modulated smoothly over time, these modulable parameters exist as object instances of [`AudioParam`](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam), and live their life as attribute appendages of their host node.  For example: 

```js
osc.frequency
```

... or:

```js
amp.gain
```

While it is technically possible to set the value of an AudioParam via its `.value` attribute, like this: 
```js
osc.frequency.value = 220
```

... this method runs into problems because it uses javascripts inbuilt scheduling paradigm, rather than Web Audio API's purpose built scheduling paradigm, and as such can give glitchy, unexpected results when overused.  I have found that this method is not so good for anything other than initialising values at instantiation.

There are a handful of instance methods which are better suited to handle situations where you may want to change the value of an AudioParam:

```js
const now = audio_context.currentTime
osc.frequencey.setValueAtTime (220, now)
osc.frequency.exponentialRampToValueAtTime (440, now + 1)

```


In practice, browser implementation of real-time scheduling of AudioParams are a bit [janky](https://www.merriam-webster.com/dictionary/janky), and so some extra care is required to avoid discontinuities in parameter values and scheduling.  To avoid glitches, I've found it to be expedient to not only cancel an AudioParam's scheduled values, but to also set its value explicitly to be what it already is, before scheduling new values, like this:

```js
const now = audio_context.currentTime

osc.frequency.cancelScheduledValues (now)
osc.frequency.setValueAtTime (osc.frequency.value, now)
osc.frequency.exponentialRampToValueAtTime (440, now + 1)

amp.gain.cancelScheduledValues (now)
amp.gain.setValueAtTime (amp.gain.value, now)
amp.gain.linearRampToValueAtTime (0.8, now + 1)
```

It is worth noting that in Web Audio API, the units for time is *seconds*, rather than milliseconds.

It is also worth noting that the `.exponentialRampToValueAtTime` method can not deal with zero values, so for GainNodes such as we have assigned to `amp` above, where we want the value to go to zero, we need to use `.linearRampToValueAtTime`.  I may make another post about how to get exponential gain envelopes 

As it is likely we will use this pattern several places in our code, I recommend abstracting it into some convenience functions:

```js
function prepare_param (p, now) {
   p.cancelScheduledValues (now)
   p.setValueAtTime (p.value, now)
}

// accepts an array of AudioParams
function prepare_params (a, now) {
   a.forEach (p => prepare_param (p, now))
}
```

... which lets us dry up our code somewhat:

```js
const now = audio_context.currentTime
prepare_params ([ osc.frequency, amp.gain ], now)
osc.frequency.exponentialRampToValueAtTime (440, now + 1)
amp.gain.linearRampToValueAtTime (0.8, now + 1)
```

## AudioWorkletProcessor

The digital signal processing is done in an seperate `.js` file containing a class definition that inherits from [AudioWorkletProcessor](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor).  

The basic shape of that file is as follows:

```js
// worklet.js

class ExampleProcessor extends AudioWorkletProcessor {

   constructor () {
      super ()
   }

   static get parameterDescriptors () {
      return [ 
         { name: 'example_param', defaultValue: 0 },
      ]
   }

   process (_inputs, outputs, parameters) {
      const out = outputs[0][0]
      for (let frame = 0; frame < out.length; frame++) {
         out[frame] = // DSP goes here
      }

      return this.alive
   }
}

registerProcessor ('example_worklet', ExampleProcessor)

```

Note the `registerProcessor ()` which registers the processor under the name given to it as its first argument.

We can then add that file as an audioWorklet module like this:

```js
await audio_context.audioWorklet.addModule (`worklet.js`)
```

... and then instantiate a node by using the name we registered it with:

```js
const worklet_node = await new AudioWorkletNode (audio_context, `example_worklet`)
```

## Setting the Sample Rate

## Deparameterisation

## Example Sine Synth

<script type="module">
   const div  = document.getElementById ("worklet_example")
   div.width  = div.parentNode.scrollWidth
   div.style.height = `${ div.width * 9 / 32 }px`
   div.style.backgroundColor = `tomato`
   div.style.textAlign       = 'center'
   div.style.lineHeight      = div.style.height
   div.style.fontSize        = `${ div.width / 20 }px`
   div.style.fontWeight      = 'bold'
   div.style.fontStyle       = 'italic'
   div.style.color           = 'white'
   div.style.userSelect      = 'none'
   div.innerText = `CLICK TO INITIALISE AUDIO`

   const audio_context = new AudioContext ()
   audio_context.suspend ()

   const graph = {}
   let pointer_down = false
   let cool_down = false

   async function init_audio () {
      await audio_context.resume ()
      await audio_context.audioWorklet.addModule (`test_worklet.js`)
      graph.sine = await new AudioWorkletNode (audio_context, `worklet_sine`, {
         processorOptions: {
            sample_rate: audio_context.sampleRate
         }
      })
      graph.sine.connect (audio_context.destination)
      graph.freq = await graph.sine.parameters.get (`freq`)
      graph.amp  = await graph.sine.parameters.get (`amp`)

      div.style.backgroundColor = `limegreen`
      div.innerText = `AUDIO CONTEXT IS ${ audio_context.state.toUpperCase () }`
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

   div.onpointerdown = async e => {
      if (audio_context.state != `running`) {
         await init_audio ()
      }

      div.style.backgroundColor = `limegreen`

      const now = audio_context.currentTime
      prepare_params ([ graph.freq, graph.amp ], now)
      
      const f = 220 * (2 ** point_phase (e).x)
      graph.freq.exponentialRampToValueAtTime (f, now + 0.3)
      
      graph.amp.linearRampToValueAtTime (0.2, now + 0.1)

      pointer_down = true
   }

   div.onpointermove = e => {

      if (!pointer_down || cool_down) return

      const now = audio_context.currentTime
      const f = 220 * (2 ** point_phase (e).x)

      prepare_param (graph.freq, now)
      graph.freq.exponentialRampToValueAtTime (f, now + 0.1)

      cool_down = true
      setTimeout (() => {
         cool_down = false
      }, 100)
   }

   div.onpointerup = e => {

      if (!graph.amp) {
         console.log (`delaying`)
         setTimeout (div.onpointerup, 100, e)
         return
      }

      const now = audio_context.currentTime
      prepare_params ([ graph.freq, graph.amp ], now)
      graph.freq.exponentialRampToValueAtTime (16, now + 0.3)
      graph.amp.linearRampToValueAtTime (0, now + 0.3)

      div.style.backgroundColor = `tomato`

      pointer_down = false
   }

</script>

<br>

