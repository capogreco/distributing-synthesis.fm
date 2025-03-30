---
title: Web MIDI API
published_at: 2024-06-17
snippet: MIDI control via the browser.
disable_html_sanitization: true
---

This post will detail how to implement MIDI control in the browser via [Web MIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API).

**CAUTION:** The API we will be using is not universally implementated, and already I have had trouble making this work in Firefox.  **Check browser compatibility → [here](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API#browser_compatibility)**

<image src="/240617/mc-24.jpeg" style="width:100%">

*For the purposes of this blog post, I am using:*
- *[Brave](https://brave.com/), running in macOS Sonoma 14.5*
- *[nakedboards MC-24](https://nakedboards.org/mc-24) (pictured above)*

*Theoretically, any USB MIDI device supported by your operating system should work.*

## The Navigator Object

The [navigator object](https://developer.mozilla.org/en-US/docs/Web/API/Navigator) represents an [interface](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Client-side_web_APIs/Introduction) with which javascript can access various information and behaviours provided by the web browser.  It is through this object that we can use javascript to ask the browser for access to various aspects of the device's hardware, such as USB MIDI devices that might be connected, for example.

Technically, `navigator` is a property of the `window` object (so, `window.navigator`) but we can also just access it via the variable name `navigator`, which we get for free when our javascript is run in a browser.

## MIDI Permissions

We can use:

```js
navigator.permissions.query ({ 
      name: `midi`, 
      sysex: true 
})
```

... to check whether your browser has permission to access connected USB MIDI devices.

<div id="midi_query">click to query MIDI permissions</div>

<script type="module">
   const div = document.getElementById ('midi_query')
   div.width = div.parentNode.scrollWidth
   const height = `${ div.width * 9 / 32 }px`
   Object.assign (div.style, {
      height, lineHeight: height, backgroundColor: `darkmagenta`,
      fontWeight: `bold`, fontStyle: `italic`, textAlign: `center`,
      fontSize: `36px`, color: `white`
   })

   div.onpointerdown = async e => {
      const response = await navigator.permissions.query ({ 
         name: `midi`, 
         sysex: true 
      })

      const handler = {
         prompt: () => div.style.backgroundColor = `sienna`,
         granted: () => div.style.backgroundColor = `darkolivegreen`,
         denied: () => div.style.backgroundColor = `crimson`
      }

      handler[response.state] ()
      
      div.innerText = response.state
   }
</script>

```html
<div id="midi_query">click to query MIDI permissions</div>

<script type="module">
   const div = document.getElementById ('midi_query')
   div.width = div.parentNode.scrollWidth
   const height = `${ div.width * 9 / 32 }px`
   Object.assign (div.style, {
      height, lineHeight: height, backgroundColor: `darkmagenta`,
      fontWeight: `bold`, fontStyle: `italic`, textAlign: `center`,
      fontSize: `36px`, color: `white`
   })

   div.onpointerdown = async e => {
      const response = await navigator.permissions.query ({ 
         name: `midi`, 
         sysex: true 
      })

      const handler = {
         prompt:  () => div.style.backgroundColor = `sienna`,
         granted: () => div.style.backgroundColor = `darkolivegreen`,
         denied:  () => div.style.backgroundColor = `crimson`
      }

      handler[response.state] ()
      
      div.innerText = response.state
   }
</script>
```

While permission state of "prompt" means that if a MIDI Access Request is made in your javascript, a prompt to appear for users to confirm the Web MIDI API's permission status:


<div align="center"><img src="/240617/prompt.png" /></div>

... a permission status of "granted" will allow connected USB MIDI devices to appear on the MIDIAccess object returned by the access request, and a permission status of "denied" will not allow your javascript to communicate with connected USB MIDI devices.

## Requesting MIDI Access

We can request access to the Web MIDI API with:

```js
navigator.requestMIDIAccess ()
```

... which will return a [MIDIAccess object](https://developer.mozilla.org/en-US/docs/Web/API/MIDIAccess), which has `.inputs`, `.outputs`, and `sysexEnabled` properties.  

As we want to use a MIDI controller (as opposed to a MIDI instrument), we will be focussing on the [MIDIInputMap object](https://developer.mozilla.org/en-US/docs/Web/API/MIDIInputMap) accessible via the `.input` property.

Consider the following code (comments are provided inline):

<div id="midi_request">click to request MIDI access</div>

<script type="module">
   const div = document.getElementById (`midi_request`)
   div.width = div.parentNode.scrollWidth
   const height = `${ div.width * 9 / 32 }px`
   Object.assign (div.style, {
      height, lineHeight: height, backgroundColor: `darkmagenta`,
      fontWeight: `bold`, fontStyle: `italic`, textAlign: `center`,
      fontSize: `36px`, color: `white`
   })

   div.onpointerdown = async () => {

      // request MIDI access &
      // assign MIDIAcess object to 'midi'
      const midi = await navigator.requestMIDIAccess ()

      // initialise empty string
      let str = ``

      // iterate over the MIDIInputMap object to
      // go through the list of input devices
      midi.inputs.forEach (device => {

         // add each device's 
         // manufacture and name 
         // to the string
         str += `${ device.manufacturer } ${ device.name }\n`
      })

      // if the string is still empty
      // give it 'no inputs detected' message
      str = str == `` ? `no inputs detected` : str

      // print the string into the div
      div.innerText = str
   }
</script>

```html
<div id="midi_request">click to request MIDI access</div>

<script type="module">
   const div = document.getElementById (`midi_request`)
   div.width = div.parentNode.scrollWidth
   const height = `${ div.width * 9 / 32 }px`
   Object.assign (div.style, {
      height, lineHeight: height, backgroundColor: `darkmagenta`,
      fontWeight: `bold`, fontStyle: `italic`, textAlign: `center`,
      fontSize: `36px`, color: `white`
   })

   div.onpointerdown = async () => {

      // request MIDI access &
      // assign MIDIAcess object to 'midi'
      const midi = await navigator.requestMIDIAccess ()

      // initialise empty string
      let str = ``

      // iterate over the MIDIInputMap object to
      // go through the list of input devices
      midi.inputs.forEach (device => {

         // add each device's 
         // manufacture and name 
         // to the string
         str += `${ device.manufacturer } ${ device.name }\n`
      })

      // if the string is still empty
      // give it 'no inputs detected' message
      str = str == `` ? `no inputs detected` : str

      // print the string into the div
      div.innerText = str
   }
</script>
```
It is worth noting that the elements being passed to the `device` parameter, in the code above, are instances of [MIDIInput](https://developer.mozilla.org/en-US/docs/Web/API/MIDIInput).


## Plugging In, and Unplugging, MIDI Devices

It is also worth noting that we can handle changes on the hardware side of Web MIDI API by assigning a handler function to the `.onstatechange` property of the MIDIAccess object returned by `.requestMIDIAccess ()`.  For example:

```js
const midi = await navigator.requestMIDIAccess ()
midi.onstatechange = e => console.dir (e)
```

... will print a [MIDIConnectionEvent](https://developer.mozilla.org/en-US/docs/Web/API/MIDIConnectionEvent) to the console any time a USB MIDI device is plugged in, or unplugged.

Plugging in the MC-24 prints two such event objects to the console:

<div align="center"><img src="/240617/connection_events.png" /></div>

If we inspect the `.port` attribute of each object, we can see that the two objects are in fact not identical: one represents an input device, the other, an output device:

<div align="center"><img src="/240617/connection_event_ports.png" /></div>


With this knowledge, we can handle plugging in and unplugging behaviour explicitly.

For example, try connecting (or disconnecting), a USB MIDI device:

<div id="plug_midi"></div>

<script type="module">
   const div = document.getElementById (`plug_midi`)
   div.width = div.parentNode.scrollWidth
   const height = `${ div.width * 9 / 16 }px`
   Object.assign (div.style, {
      height, backgroundColor: `darkmagenta`,
      fontWeight: `bold`, fontStyle: `italic`,
      fontSize: `24px`, color: `white`
   })

   const midi = await navigator.requestMIDIAccess ()
   midi.onstatechange = e => {
      if (e.port instanceof MIDIInput) {
         div.innerText += `${ e.port.name } was ${ e.port.state }\n`
      }
   }
</script>

```html
<div id="plug_midi"></div>

<script type="module">
   const div = document.getElementById (`plug_midi`)
   div.width = div.parentNode.scrollWidth
   const height = `${ div.width * 9 / 16 }px`
   Object.assign (div.style, {
      height, backgroundColor: `darkmagenta`,
      fontWeight: `bold`, fontStyle: `italic`,
      fontSize: `24px`, color: `white`
   })

   const midi = await navigator.requestMIDIAccess ()
   midi.onstatechange = e => {
      if (e.port instanceof MIDIInput) {
         div.innerText += `${ e.port.name } was ${ e.port.state }\n`
      }
   }
</script>
```

## Receiving MIDI Messages

<div id="midi_messages">send a MIDI control message</div>

<script type="module">
   const div = document.getElementById (`midi_messages`)
   div.width = div.parentNode.scrollWidth
   const height = `${ div.width * 9 / 32 }px`
   Object.assign (div.style, {
      height, lineHeight: height, backgroundColor: `darkmagenta`,
      fontFamily:`monospace`, textAlign: `center`,
      fontSize: `36px`, color: `white`
   })

   // function for making strings the same number of characters
   const rectify = (s, w, c) => {
      if (s.length >= w) return s
      else return (Array (w).join (c) + s).slice (-w)
   }

   // define a handler for midi messages
   const midi_handler = e => {
      const control = rectify (e.data[1], 2, `0`)
      const value   = rectify (e.data[2], 3, `0`)
      div.innerText = `${ e.target.name }: control ${ control }, value ${ value }`
   }

   // assign the handler to already connected devices
   const midi = await navigator.requestMIDIAccess ()
   midi.inputs.forEach (device => {
      device.onmidimessage = midi_handler
   })

   // if a new device connects, assign the handler to it as well
   midi.onstatechange = e => {
      if (e.port instanceof MIDIInput && e.port.state === `connected`) {
         e.port.onmidimessage = midi_handler
      }
   }
</script>

```html
<div id="midi_messages">send a MIDI control message</div>

<script type="module">
   const div = document.getElementById (`midi_messages`)
   div.width = div.parentNode.scrollWidth
   const height = `${ div.width * 9 / 32 }px`
   Object.assign (div.style, {
      height, lineHeight: height, backgroundColor: `darkmagenta`,
      fontFamily:`monospace`, textAlign: `center`,
      fontSize: `36px`, color: `white`
   })

   // function for making strings the same number of characters
   const rectify = (s, w, c) => {
      if (s.length >= w) return s
      else return (Array (w).join (c) + s).slice (-w)
   }

   // define a handler for midi messages
   const midi_handler = e => {
      const control = rectify (e.data[1], 2, `0`)
      const value   = rectify (e.data[2], 3, `0`)
      div.innerText = `${ e.target.name }: control ${ control }, value ${ value }`
   }

   // assign the handler to already connected devices
   const midi = await navigator.requestMIDIAccess ()
   midi.inputs.forEach (device => {
      device.onmidimessage = midi_handler
   })

   // if a new device connects, assign the handler to it as well
   midi.onstatechange = e => {
      if (e.port instanceof MIDIInput && e.port.state === `connected`) {
         e.port.onmidimessage = midi_handler
      }
   }
</script>
```

It is worth noting that the [midimessage event](https://developer.mozilla.org/en-US/docs/Web/API/MIDIInput/midimessage_event) passed into `midi_handler` contains an array of length three on its `.data` property, the first of which representing "status", which in the case of MIDI control messages, will always be `176`.  

As the status information is not super important in this use case, we can ignore it, and instead use the second and third elements of the `.data` array, which represent "controller" and "value", respectively.

## Control Knob

<canvas id="knob"></canvas>

<script type="module">
   const cnv = document.getElementById (`knob`)
   const w = cnv.parentNode.scrollWidth
   cnv.width = w
   cnv.height = w

   const ctx = cnv.getContext (`2d`)

   const tau = Math.PI * 2

   // function takes a control number
   // and a value between 0-127
   // and draws a knob to the canvas
   const midi_knob = (c, v) => {
      const r = tau * 0.75 * v / 127
      const k = tau * -0.125

      const p1 = {
         x: (w * 0.5) + (w * 0.4 * Math.sin (k - r)),
         y: (w * 0.5) + (w * 0.4 * Math.cos (k - r))
      }

      const p2 = {
         x: (w * 0.5) + (w * 0.2 * Math.sin (k - r)),
         y: (w * 0.5) + (w * 0.2 * Math.cos (k - r))
      }

      ctx.fillStyle = `darkmagenta`
      ctx.fillRect (0, 0, w, w)

      ctx.strokeStyle = `white`
      ctx.lineWidth = w * 0.1

      ctx.beginPath ()
      ctx.arc (w * 0.5, w * 0.5, w * 0.3, r, tau * 0.75 + r, false)
      ctx.moveTo (p1.x, p1.y)
      ctx.lineTo (p2.x, p2.y)
      ctx.stroke ()

      ctx.fillStyle = `white`
      ctx.font = `bold ${ w * 0.2 }px sans-serif`

      ctx.textAlign = `center`
      ctx.fillText (v, w * 0.5, w * 0.57)

      ctx.font = `bold ${ w * 0.15 }px sans-serif`
      ctx.textAlign = `left`
      ctx.fillText (c, w * 0.03, w * 0.15)
   }

   // define a handler for midi messages
   const midi_handler = e => midi_knob (e.data[1], e.data[2])

   // assign the handler to already connected devices
   const midi = await navigator.requestMIDIAccess ()
   midi.inputs.forEach (device => {
      device.onmidimessage = midi_handler
   })

   // if a new device connects, assign the handler to it as well
   midi.onstatechange = e => {
      if (e.port instanceof MIDIInput && e.port.state === `connected`) {
         e.port.onmidimessage = midi_handler
      }
   }

   midi_knob (0, 0)
</script>

```html
<canvas id="knob"></canvas>

<script type="module">
   const cnv = document.getElementById (`knob`)
   const w = cnv.parentNode.scrollWidth
   cnv.width = w
   cnv.height = w

   const ctx = cnv.getContext (`2d`)

   const tau = Math.PI * 2

   // function takes a control number
   // and a value between 0-127
   // and draws a knob to the canvas
   const midi_knob = (c, v) => {
      const r = tau * 0.75 * v / 127
      const k = tau * -0.125

      const p1 = {
         x: (w * 0.5) + (w * 0.4 * Math.sin (k - r)),
         y: (w * 0.5) + (w * 0.4 * Math.cos (k - r))
      }

      const p2 = {
         x: (w * 0.5) + (w * 0.2 * Math.sin (k - r)),
         y: (w * 0.5) + (w * 0.2 * Math.cos (k - r))
      }

      ctx.fillStyle = `darkmagenta`
      ctx.fillRect (0, 0, w, w)

      ctx.strokeStyle = `white`
      ctx.lineWidth = w * 0.1

      ctx.beginPath ()
      ctx.arc (w * 0.5, w * 0.5, w * 0.3, r, tau * 0.75 + r, false)
      ctx.moveTo (p1.x, p1.y)
      ctx.lineTo (p2.x, p2.y)
      ctx.stroke ()

      ctx.fillStyle = `white`
      ctx.font = `bold ${ w * 0.2 }px sans-serif`

      ctx.textAlign = `center`
      ctx.fillText (v, w * 0.5, w * 0.57)

      ctx.font = `bold ${ w * 0.15 }px sans-serif`
      ctx.textAlign = `left`
      ctx.fillText (c, w * 0.03, w * 0.15)
   }

   // define a handler for midi messages
   const midi_handler = e => midi_knob (e.data[1], e.data[2])

   // assign the handler to already connected devices
   const midi = await navigator.requestMIDIAccess ()
   midi.inputs.forEach (device => {
      device.onmidimessage = midi_handler
   })

   // if a new device connects, assign the handler to it as well
   midi.onstatechange = e => {
      if (e.port instanceof MIDIInput && e.port.state === `connected`) {
         e.port.onmidimessage = midi_handler
      }
   }

   midi_knob (0, 0)
</script>
```