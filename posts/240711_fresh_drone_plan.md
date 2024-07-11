---
title: Fresh Drone 1 ~ Plan
published_at: 2024-07-11
snippet: ... inspired by the sonic practice of Anthony Artmann
disable_html_sanitization: true
allow_math: true
---

<iframe width="100%" height="300" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/149580066&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true"></iframe><div style="font-size: 10px; color: #cccccc;line-break: anywhere;word-break: normal;overflow: hidden;white-space: nowrap;text-overflow: ellipsis; font-family: Interstate,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Garuda,Verdana,Tahoma,sans-serif;font-weight: 100;"><a href="https://soundcloud.com/anthony-artmann" title="Anthony Artmann" target="_blank" style="color: #cccccc; text-decoration: none;">Anthony Artmann</a> · <a href="https://soundcloud.com/anthony-artmann/super-minimal-jazz" title="Super Minimal Jazz" target="_blank" style="color: #cccccc; text-decoration: none;">Super Minimal Jazz</a></div>

Local sonic artist, Anthony Artmann ([instagram](https://www.instagram.com/drone_sound_meditation/), [soundcloud](https://soundcloud.com/anthony-artmann)), facilitates regular participatory drone meditations at [Tempo Rubato](https://www.temporubato.com.au/) and elsewhere.  The [booking page](https://www.trybooking.com/events/landing/1229905) reads as follows:

> One note. Infinite Possibilities.
> 
>Bring an instrument or just your voice.
>
> We each pick a note and hold it / repeat for an hour. Together.
>
> You are welcome to take rests throughout. You can also just come and listen if you prefer. It is a very peaceful experience.
>
> All are welcome.
>
> Registration fee: $10

## Motive

Witnessing the slow tectonic shifts and subterranean flow - the gentle and terrifying mode of deep listening facilitated by Artmann et al. a few weeks ago, was a quiet revelation for me.  

Artmann's practice, clothed in parochial irreverance, opens a space in which the missing aesthetic register of the sacred can become indelibly reinstantiated.

I was inspired.  Which is another way of saying that I wanted to manufacture an excuse to be close enough to him to steal his secrets, so that I, like him, might also become a practitioner of the missing aesthetic register.

My plan: I decided to build a distributed synthesis instrument that would allow me to contribute to the drone next time it happens.

## Control

As discussed in my post on [Web MIDI API](https://distributing-synthesis.fm/240617_web_midi), my current MIDI controller of choice is the [nakedboards mc-24](https://nakedboards.org/mc-24), which affords me 24 knobs, each capable of providing an integer value between 0-127.

With this in mind, I devised a system of eight parameters categories, each with three parameters:

![parameter array sketch](/240711/parameter_array.jpg)

## Parameters

- **Root**
   - $note \in \N \cap [ 0, 127 ], midinote$
   - $finetune \in \mathbb{Q} \cap [ -1, 1 ], semitones$
   - $detune \in \mathbb{Q} \cap [ -1, 1 ], semitones$
- **Harmonic**
   - $numerator \in \N \cap [ 1, 12 ]$
   - $denominator \in \N \cap [ 1, 12 ]$
   - $unity \in \mathbb{Q} \cap [0, 1]$
- **Tremolo**
   - $depth / shape \in \mathbb{Q} \cap [ -1, 1 ]$
   - $speed \in \mathbb{Q} \cap [0.001, 16], Hz$
   - $diversity \in \mathbb{Q} \cap [0, 1]$
- **Vibrato**
   - Detune / Depth
   - Speed
   - Diversity
- **Timbre**
   - Numerator
   - Denominator
   - Unity
- **LFO**
   - Depth
   - Speed
   - Diversity
- **Reverb**
   - Length
   - Amount
   - Diversity
- **Global**
   - Volume
   - Lag TIme
   - Diversity

... plus an additional, ninth category:

- **Trill**
   - Interval
   - Speed
   - Diversity

... which I envisioned could be swapped with **Tremolo**, in and out of the third parameter category slot, to give two mutually exclusive modes: tremolo mode, and trill mode.

## Attending to the Spectre

... of massive polyphony, which hovers around and above each articulation of this project.

In each of the parameter categories, the third parameter is designated to control a stochastic algorithm responsible for producing **difference* between the $n$ synthesis clients across that parameter category.
