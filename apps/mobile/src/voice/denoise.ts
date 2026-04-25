/**
 * Noise reduction step (plan §10 stage 2).
 *
 * Status: passthrough. Whisper still works without it; field-test data from
 * week 6 will tell us how much accuracy we lose in machinery noise and
 * whether RNNoise is worth the integration cost.
 *
 * Path forward when needed:
 *   1. Build RNNoise as a static lib for Android (CMake) and iOS (xcodeproj).
 *      The C source lives at https://gitlab.xiph.org/xiph/rnnoise — ~5kloc.
 *   2. Write a small Expo Modules wrapper exposing one method:
 *        denoiseFile(inputUri: string, outputUri: string): Promise<void>
 *      Read the m4a/aac chunk, decode to 48kHz mono PCM, run RNNoise's
 *      `rnnoise_process_frame` over 10ms windows, encode back, write to outputUri.
 *   3. Replace this passthrough with the wrapper call.
 *
 * Skipping for the POC because (a) requires native module work that's not
 * incremental, (b) field test results may show on-device Whisper handles
 * factory noise well enough, (c) cloud Whisper toggle is a cheaper escape
 * hatch for the noisy minority of audits.
 */
export async function denoise(uri: string): Promise<string> {
  return uri;
}
