let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioContext) audioContext = new Ctor();
  return audioContext;
}

function beep(frequency: number, durationMs: number, delayMs = 0) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.15;

  const startAt = ctx.currentTime + delayMs / 1000;
  oscillator.start(startAt);
  oscillator.stop(startAt + durationMs / 1000);
}

export function playScanSuccess() {
  beep(1046, 90);
}

export function playScanError() {
  beep(220, 140);
  beep(180, 140, 160);
}
