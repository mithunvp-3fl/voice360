import { Audio } from 'expo-av';

/**
 * Rolling chunked audio recorder. Each chunk is a complete file (m4a/aac on iOS,
 * 3gp/aac on Android by default — Whisper accepts both).
 *
 * Per plan §10 stage 1: 5–10s chunks, 16kHz mono. We use the LOW_QUALITY preset
 * since Whisper downsamples internally and audit speech is voice-band only.
 */

export interface ChunkedRecorderOptions {
  /** ms per chunk before stopping/restarting and emitting. Default 7000. */
  chunkMs?: number;
  onChunk: (uri: string, durationMs: number) => void | Promise<void>;
  onError?: (err: Error) => void;
}

const DEFAULT_OPTS = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 64000,
  },
  ios: {
    extension: '.m4a',
    audioQuality: Audio.IOSAudioQuality.LOW,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 64000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 64000,
  },
} satisfies Audio.RecordingOptions;

export class ChunkedRecorder {
  private opts: Required<Pick<ChunkedRecorderOptions, 'chunkMs' | 'onChunk'>> & {
    onError?: ChunkedRecorderOptions['onError'];
  };
  private current: Audio.Recording | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running = false;

  constructor(options: ChunkedRecorderOptions) {
    this.opts = { chunkMs: 7000, ...options };
  }

  async start() {
    if (this.running) return;
    const perm = await Audio.requestPermissionsAsync();
    if (!perm.granted) throw new Error('microphone permission denied');

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    this.running = true;
    await this.startNewChunk();
  }

  async stop() {
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    if (this.current) {
      try {
        await this.current.stopAndUnloadAsync();
        const uri = this.current.getURI();
        if (uri) await this.opts.onChunk(uri, this.opts.chunkMs);
      } catch (e: any) {
        this.opts.onError?.(e instanceof Error ? e : new Error(String(e)));
      }
      this.current = null;
    }
  }

  private async startNewChunk() {
    if (!this.running) return;
    try {
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(DEFAULT_OPTS);
      await rec.startAsync();
      this.current = rec;
      this.timer = setTimeout(() => this.rotate(), this.opts.chunkMs);
    } catch (e: any) {
      this.running = false;
      this.opts.onError?.(e instanceof Error ? e : new Error(String(e)));
    }
  }

  private async rotate() {
    if (!this.current) return;
    const finishing = this.current;
    this.current = null;
    try {
      await finishing.stopAndUnloadAsync();
      const uri = finishing.getURI();
      if (uri) await this.opts.onChunk(uri, this.opts.chunkMs);
    } catch (e: any) {
      this.opts.onError?.(e instanceof Error ? e : new Error(String(e)));
    }
    if (this.running) await this.startNewChunk();
  }
}
