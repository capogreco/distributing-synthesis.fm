---
title: Fresh Drone
published_at: 2024-07-11
snippet: ... inspired by the sonic practice of Anthony Artmann
disable_html_sanitization: true
allow_math: true
---

<iframe width="100%" height="300" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/149580066&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true"></iframe><div style="font-size: 10px; color: #cccccc;line-break: anywhere;word-break: normal;overflow: hidden;white-space: nowrap;text-overflow: ellipsis; font-family: Interstate,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Garuda,Verdana,Tahoma,sans-serif;font-weight: 100;"><a href="https://soundcloud.com/anthony-artmann" title="Anthony Artmann" target="_blank" style="color: #cccccc; text-decoration: none;">Anthony Artmann</a> · <a href="https://soundcloud.com/anthony-artmann/super-minimal-jazz" title="Super Minimal Jazz" target="_blank" style="color: #cccccc; text-decoration: none;">Super Minimal Jazz</a></div>

Local sonic artist, Anthony Artmann ([instagram](https://www.instagram.com/drone_sound_meditation/), [soundcloud](https://soundcloud.com/anthony-artmann)), hosts regular participatory drone meditations at [Tempo Rubato](https://www.temporubato.com.au/) and elsewhere.  The [booking page](https://www.trybooking.com/events/landing/1229905) reads as follows:

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

Witnessing the slow tectonic shifts and subterranean flow - a deep listening sensibility facilitated by Artmann et al. a few weeks ago, was a quiet and beautiful revelation for me.  

Artmann's practice opens a space in which the missing aesthetic register (the aesthetic register of the *sacred*), is strongly reinstantiated.

I was inspired and cobbled together a plan to build a distributed synthesis instrument to participate with at the next drone meditation.

## Control

As discussed in my post on [Web MIDI API](https://distributing-synthesis.fm/240617_web_midi), my current MIDI controller of choice is the [nakedboards mc-24](https://nakedboards.org/mc-24), which affords me 24 knobs, each capable of providing an integer value between 0-127.

With this in mind, I devised a system of eight parameters categories, each with three parameters:

![parameter array sketch](/240711/parameter_array.jpg)

## Parameters

- **Root**
   - $note \in \N \cap [ 0, 127 ], midinote$
   - $finetune \in \mathbb{Q} \cap [ -1, 1 ], semitones$
   - $detune \in \mathbb{Q} \cap [ 0, 1 ], semitones$
- **Harmonic**
   - $numerator \in \N \cap [ 1, 12 ]$
   - $denominator \in \N \cap [ 1, 12 ]$
   - $unity \in \mathbb{Q} \cap [0, 1]$
- **Tremolo**
   - $depth / shape \in \mathbb{Q} \cap [ -1, 1 ]$
   - $speed \in \mathbb{Q} \cap [0.001, 16], Hz$
   - $diversity \in \mathbb{Q} \cap [0, 1]$
- **Vibrato**
   - $detune / depth \in \mathbb{Q} \cap [ -1, 1 ]$
   - $speed \in \mathbb{Q} \cap [0.001, 16], Hz$
   - $diversity \in \mathbb{Q} \cap [0, 1]$
- **Timbre**
   - $numerator \in \N \cap [ 1, 12 ]$
   - $denominator \in \N \cap [ 1, 12 ]$
   - $unity \in \mathbb{Q} \cap [0, 1]$
- **LFO**
   - $depth / shape \in \mathbb{Q} \cap [ -1, 1 ]$
   - $speed \in \mathbb{Q} \cap [0.001, 16], Hz$
   - $diversity \in \mathbb{Q} \cap [0, 1]$
- **Reverb**
   - $length \in \mathbb{Q} \cap [0, 1000], seconds$
   - $amount \in \mathbb{Q} \cap [0, 1]$
   - $diversity \in \mathbb{Q} \cap [0, 1]$
- **Global**
   - $volume \in \mathbb{Q} \cap [0, 1]$
   - $lag time \in \mathbb{Q} \cap [0, 1000], seconds$
   - $diversity \in \mathbb{Q} \cap [0, 1]$

... plus an additional, ninth category:

- **Trill**
   - $interval \in \mathbb{Q} \cap [0, 1]$
   - $speed \in \mathbb{Q} \cap [0.001, 16], Hz$
   - $diversity \in \mathbb{Q} \cap [0, 1]$

... which I envisioned could be swapped with **Tremolo**, in and out of the third parameter category slot, to give two mutually exclusive modes: tremolo mode, and trill mode.

## Polyphony

In each of the parameter categories, the third parameter is designated to control a stochastic algorithm responsible for producing *difference* within that parameter category, across $n$ synthesis clients.

- ***detune***, which offsets the root frequency of each synthesis client by a random amount within the specified range, the maximum being $\pm 1 semitone$
- ***diversity***, which applies randomness to the parameter immediately above it in each case
- ***unity***, which works to reduce the randomness of the two parameters immediately above it in each case

## Roll Out

<div align="center"><img src="/240711/mvp.png" /></div>

*Image from Henrik Kniberg's blog post, [Making sense of MVP](https://blog.crisp.se/2016/01/25/henrikkniberg/making-sense-of-mvp)*.

Taking my [Fresh mc-24 template](https://github.com/capogreco/fresh_mc-24_template) as a starting point, the plan is to build in the operational capacities for each of the parameter categories in five stages:

| Stage I | Stage II | Stage III | Stage IV | Stage V |
| :------ | :------- | :-------- | :------- | :------ |
| Root    | Harmonic | Tremolo   | Timbre   | Trill   |
| Global  | Reverb   | Vibrato   | LFO      |         |


# ~ ~ ~ UPDATE ~ ~ ~

## Prototype:

You can find a live version of the synth client [here](drone.assembly.fm)

... and a live version of the control client [here](drone.assembly.fm/ctrl)

## Improvisation:

<iframe id="privation_1" src="https://www.youtube.com/embed/5hZ7cJiFj-E?si=ZbQbK493f_Tfe9vm" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

<script>
   const frame = document.getElementById (`privation_1`)
   frame.width = frame.parentNode.scrollWidth
   frame.height = frame.width * 2304 / 2048 
</script>