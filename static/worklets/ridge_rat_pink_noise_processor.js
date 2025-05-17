// ridge-rat-pink-noise-processor.js

const N_STAGES = 8;

// Probabilities for each stage (pP) from an 8-stage example by Larry Trammell
const pP_raw = [0.00198, 0.0108, 0.0314, 0.0766, 0.1679, 0.3243, 0.5821, 1.025];

// Amplitude scaling factors for each stage (pA) - often 1.0 for this variant
const pA = new Float32Array(N_STAGES).fill(1.0);

// Normalize pP_raw and calculate cumulative sum (pSUM_norm)
const totalProbSum = pP_raw.reduce((sum, val) => sum + val, 0);
const pP_norm = pP_raw.map((p) => p / totalProbSum);

const pSUM_norm = new Float32Array(N_STAGES);
let cumulativeSum = 0;
for (let i = 0; i < N_STAGES; i++) {
  cumulativeSum += pP_norm[i];
  pSUM_norm[i] = cumulativeSum;
}
// Ensure the last element is exactly 1.0 due to potential floating point inaccuracies
pSUM_norm[N_STAGES - 1] = 1.0;

class RidgeRatPinkNoiseProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    this.contrib = new Float32Array(N_STAGES); // Stores current contribution of each stage
    this.pinkSum = 0.0; // Holds the current sum of all contributions

    // Initialize contributions randomly to avoid silence at the beginning (optional)
    // This helps to kick-start the process with some non-zero values.
    for (let i = 0; i < N_STAGES; i++) {
      this.contrib[i] = (Math.random() * 2 - 1) * pA[i];
      this.pinkSum += this.contrib[i];
    }
  }

  static get parameterDescriptors() {
    return [
      {
        name: "amplitude",
        defaultValue: 0.1, // Pink noise sum can be large, so scale down
        minValue: 0,
        maxValue: 1,
        automationRate: "a-rate",
      },
    ];
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0]; // Assuming one output
    const outputChannel = output[0]; // Assuming mono output

    const amplitudeValues = parameters.amplitude;
    let currentAmplitude;

    for (let i = 0; i < outputChannel.length; i++) {
      // Get amplitude for the current sample (can be automated)
      currentAmplitude =
        amplitudeValues.length > 1 ? amplitudeValues[i] : amplitudeValues[0];

      // 1. Generate primary random number to select stage
      const ur1 = Math.random(); // 0.0 to <1.0

      // 2. Find which stage to update
      for (let stage = 0; stage < N_STAGES; stage++) {
        if (ur1 <= pSUM_norm[stage]) {
          // 3. Generate secondary random number for the new value
          const ur2 = Math.random(); // 0.0 to <1.0
          const newStageValue = (2 * ur2 - 1) * pA[stage];

          // 4. Update pinkSum incrementally
          this.pinkSum -= this.contrib[stage]; // Subtract old contribution
          this.contrib[stage] = newStageValue; // Store new contribution
          this.pinkSum += this.contrib[stage]; // Add new contribution

          break; // Only update one stage
        }
      }
      outputChannel[i] = this.pinkSum * currentAmplitude;
    }
    return true; // Keep processor alive
  }
}

registerProcessor("ridge-rat-pink-noise-generator", RidgeRatPinkNoiseProcessor);
