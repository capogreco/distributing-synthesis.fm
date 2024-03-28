---
title: Can I do maths?
published_at: 2024-03-19
snippet: you be the judge
disable_html_sanitization: true
allow_math: true
---

As a digital music instrument design project that uses internet communication protocols to coalesce audience's devices' sound synthesis and loudspeaker capabilities, it garnered the name **DXΣ** -- an homage to the [Yamaha DX7](https://en.wikipedia.org/wiki/Yamaha_DX7), modified with a bit of an additional inflectlion to reflect the mathematical process of summation, in which the addition of a series of similar terms can be denoted by the Greek capital letter *sigma*, e.g.

$$ \sum_{n=1}^{6}2n=(2\times1)+(2\times2)+(2\times3)+...+(2\times6) $$

By specifying an index of summation (in this case, $n$), a lower bound ( $1$), an upper bound ( $6$), and a function to iterate ( $2n$), capital-sigma notation describes an algorithm by which a series of similar terms can be generated and summed together.

## Distributed Synthesis

This mathematical process is formally analagous to the control flow of *distributed synthesis*, a novel form of sound synthesis wherein a series of signals, as specified by a central iterative function, are synthesised by a number of peripheral audience devices, which emit the signals via their loudspeakers into the air of a shared physical space where they are summed together.

## Periodic Functions

If we can define a *periodic function* as being any function $f(x)$ for which the following holds true:

$$ f(x + T) = f(x) $$

... we might also understand the *period* of that function to be $T$.

## Harmonics

If we consider:

$$ y = A sin(ωx + φ) $$

... where $A$, $ω$, and $φ$ are the *amplitude*, *frequency*, and *phase* of a sinusoidal harmonic, we might understand the following:

$$ \sum_{ω=1}^{∞}\frac{1}{ω}sin(ωx+φ) $$

... to describe a sawtooth wave function, and:

$$ \sum_{ω=1}^{6}\frac{1}{ω}sin(ωx+φ) $$

... to describe the first six harmonics of just such a sawtooth.

## Audio Worklet

An implementation of such a wave function in [`AudioWorkletProcessor`](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/AudioWorkletProcessor), might look like this:

```js
process (_inputs, outputs, parameters) {

    const out = outputs[0][0]

    for (let frame = 0; frame < out.length; frame++) {

        let sig = 0

        const freq   = deparameterise (parameters.freq,   frame)
        const amp    = deparameterise (parameters.amp,    frame)
        const bright = deparameterise (parameters.bright, frame)

        let bright_dec = (bright * 5) + 1

        for (let i = 1; i <= 6; i++) {
            const b_amp = Math.min (bright_dec, 1)

            sig += Math.sin (this.phase * Math.PI * 2 * i) * (amp / i) * b_amp

            bright_dec -= 1
            bright_dec = Math.max (bright_dec, 0)
        }

        this.phase += this.inc * freq
        this.phase %= 1
        out[frame] = sig
    }

    return this.alive
}
```

Find an implementation of this code → [here](https://lcld.xyz/240326_infinite_appreciation)

Learn more about how [`AudioWorklet`](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet) works → [here](https://distributing-synthesis.fm/240318_audioworklet_basics)

