---
title: Web MIDI API
published_at: 2024-06-17
snippet: MIDI control via the browser.
disable_html_sanitization: true
---

This post will detail how to implement MIDI control in the browser via [Web MIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API).

**CAUTION:** The API we will be using does not enjoy universal implementation, and already I have had trouble making this work in Firefox.  **Check browser compatibility → [here](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API#browser_compatibility)**

<image src="/240617/mc-24.jpeg" style="width:100%">

*For the purposes of this blog post, I am using:*
- *[Brave](https://brave.com/), running in macOS Sonoma 14.5*
- *[nakedboards MC-24](https://nakedboards.org/mc-24) (pictured above)*

*... although theoretically any USB MIDI device supported by your operating system should work.*

## MIDI Permission

<div id="midi_query">click to query MIDI permission</div>

<script type="module">
   const div = document.getElementById ('midi_query')
   div.width = div.parentNode.scrollWidth
   div.style.height = `${ div.width * 9 / 32 }px`
   div.style.backgroundColor = `darkmagenta`
   div.style.textAlign  = 'center'
   div.style.lineHeight = div.style.height
   div.style.fontSize   = '36px'
   div.style.fontWeight = 'bold'
   div.style.fontStyle  = 'italic'
   div.style.color      = 'white'

   div.onpointerdown = async e => {
      const response = await navigator.permissions.query ({ 
         name: `midi`, 
         sysex: true 
      })

      console.dir (response)

      div.innerText = `midi permission: ${ response.state }`
      
      if (response.state == `granted`) {
         div.style.backgroundColor = `darkolivegreen`
      }
   }
</script>

```html
<div id="midi_query">click to query MIDI permission</div>

<script type="module">
   const div = document.getElementById ('midi_query')
   div.width = div.parentNode.scrollWidth
   div.style.height = `${ div.width * 9 / 32 }px`
   div.style.backgroundColor = `darkmagenta`
   div.style.textAlign  = 'center'
   div.style.lineHeight = div.style.height
   div.style.fontSize   = '36px'
   div.style.fontWeight = 'bold'
   div.style.fontStyle  = 'italic'
   div.style.color      = 'white'

   div.onpointerdown = async e => {
      const response = await navigator.permissions.query ({ 
         name: `midi`, 
         sysex: true 
      })

      console.dir (response)

      div.innerText = `midi permission: ${ response.state }`
      
      if (response.state == `granted`) {
         div.style.backgroundColor = `darkolivegreen`
      }
   }
</script>
```


<!-- <script type="module">
   const midi_handler = e => {
      let str = `MIDI message received at timestamp ${ e.timeStamp }[${ e.data.length } bytes]: `
      for (const char of e.data) {
         str += `0x${ char.toString (16) } `
      }
      console.log (str)
   }

   const log_midi = m => {
      m.inputs.forEach (entry => {
         entry.onmidimessage = midi_handler
      })
   }

   navigator.requestMIDIAccess ().then (midi => {
      log_midi (midi)
   })
</script> -->
