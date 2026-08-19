export type SoundEffect =
  | 'ballStart'
  | 'lock'
  | 'growthFinish'
  | 'hitBam'
  | 'coinPickup'
  | 'coinLand'
  | 'progressStar'
  | 'pop'
  | 'shield'
  | 'boss'
  | 'bossWarning'
  | 'booster'
  | 'purchase'
  | 'packTap'
  | 'packReveal'
  | 'win'
  | 'defeatImpact'
  | 'fail';

interface ToneCommand {
  kind: 'tone';
  frequency: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
  delay?: number;
  toFrequency?: number;
}

interface NoiseCommand {
  kind: 'noise';
  duration: number;
  volume?: number;
  delay?: number;
  filterFrequency?: number;
  filterType?: BiquadFilterType;
  q?: number;
}

type AudioCommand = ToneCommand | NoiseCommand;

const t = (
  frequency: number,
  duration: number,
  options: Omit<ToneCommand, 'kind' | 'frequency' | 'duration'> = {},
): ToneCommand => ({ kind: 'tone', frequency, duration, ...options });
const n = (
  duration: number,
  options: Omit<NoiseCommand, 'kind' | 'duration'> = {},
): NoiseCommand => ({ kind: 'noise', duration, ...options });

const RECIPES: Record<SoundEffect, AudioCommand[]> = {
  ballStart: [t(145, .13, { type: 'sine', volume: .14, toFrequency: 235 }), t(290, .10, { type: 'triangle', volume: .055, delay: .025, toFrequency: 380 }), n(.055, { volume: .035, filterFrequency: 420, filterType: 'lowpass' })],
  lock: [t(460, .095, { type: 'triangle', volume: .06, toFrequency: 330 }), t(680, .07, { type: 'sine', volume: .035, delay: .025 })],
  growthFinish: [t(205, .16, { type: 'sine', volume: .12, toFrequency: 92 }), t(315, .13, { type: 'triangle', volume: .065, toFrequency: 145 }), n(.065, { volume: .055, delay: .035, filterFrequency: 1050, filterType: 'bandpass', q: .7 }), t(610, .07, { type: 'sine', volume: .045, delay: .055, toFrequency: 470 })],
  hitBam: [t(108, .20, { type: 'sine', volume: .16, toFrequency: 52 }), t(215, .12, { type: 'square', volume: .055, toFrequency: 82 }), n(.16, { volume: .15, filterFrequency: 720, filterType: 'lowpass', q: .55 }), n(.055, { volume: .07, filterFrequency: 2100, filterType: 'bandpass', q: 1.1 })],
  coinPickup: [t(760, .10, { type: 'sine', volume: .09, toFrequency: 1120 }), t(1210, .07, { type: 'triangle', volume: .045, delay: .035 })],
  coinLand: [t(1080, .08, { type: 'sine', volume: .08, toFrequency: 1580 }), t(1580, .10, { type: 'sine', volume: .055, delay: .045, toFrequency: 1900 })],
  progressStar: [t(660, .12, { type: 'triangle', volume: .075, toFrequency: 820 }), t(990, .16, { type: 'sine', volume: .07, delay: .045, toFrequency: 1180 }), t(1320, .22, { type: 'sine', volume: .055, delay: .10, toFrequency: 1580 }), n(.09, { volume: .025, delay: .08, filterFrequency: 3900, filterType: 'highpass', q: .35 })],
  pop: [t(240, .12, { type: 'sine', volume: .08, toFrequency: 120 }), n(.09, { volume: .065, filterFrequency: 1200, filterType: 'bandpass' })],
  shield: [t(520, .15, { type: 'sine', volume: .09, toFrequency: 760 }), t(780, .20, { type: 'sine', volume: .075, delay: .03, toFrequency: 980 }), t(1180, .14, { type: 'triangle', volume: .045, delay: .07 })],
  boss: [t(95, .34, { type: 'sawtooth', volume: .10, toFrequency: 54 }), t(190, .22, { type: 'square', volume: .035, delay: .02, toFrequency: 125 }), n(.14, { volume: .05, filterFrequency: 280, filterType: 'lowpass' })],
  bossWarning: [t(86, .48, { type: 'sawtooth', volume: .11, toFrequency: 54 }), t(172, .18, { type: 'square', volume: .045, delay: .16, toFrequency: 120 }), t(105, .46, { type: 'sine', volume: .10, delay: .36, toFrequency: 62 }), n(.18, { volume: .045, delay: .06, filterFrequency: 420, filterType: 'lowpass' })],
  booster: [t(390, .10, { type: 'triangle', volume: .075, toFrequency: 620 }), t(700, .13, { type: 'sine', volume: .055, delay: .055, toFrequency: 880 })],
  purchase: [t(520, .10, { type: 'triangle', volume: .09 }), t(660, .12, { type: 'triangle', volume: .075, delay: .06 }), t(880, .20, { type: 'sine', volume: .09, delay: .12, toFrequency: 1040 }), n(.08, { volume: .035, delay: .02, filterFrequency: 1800 })],
  packTap: [t(105, .19, { type: 'sine', volume: .13, toFrequency: 155 }), n(.07, { volume: .06, filterFrequency: 430, filterType: 'lowpass' }), t(190, .09, { type: 'square', volume: .045, delay: .12 }), t(225, .09, { type: 'square', volume: .045, delay: .25 }), t(265, .09, { type: 'square', volume: .045, delay: .38 }), t(315, .09, { type: 'square', volume: .05, delay: .51 }), t(145, .72, { type: 'triangle', volume: .055, delay: .04, toFrequency: 780 })],
  packReveal: [n(.42, { volume: .11, filterFrequency: 1500, filterType: 'bandpass' }), t(130, .28, { type: 'sine', volume: .13, toFrequency: 260 }), t(523, .38, { type: 'sine', volume: .075, delay: .03 }), t(659, .38, { type: 'sine', volume: .075, delay: .03 }), t(784, .42, { type: 'sine', volume: .075, delay: .03 }), t(1047, .13, { type: 'triangle', volume: .07, delay: .22 }), t(1319, .13, { type: 'triangle', volume: .065, delay: .34 }), t(1568, .17, { type: 'sine', volume: .055, delay: .46 })],
  win: [t(262, .46, { type: 'sine', volume: .075, delay: .07 }), t(523, .18, { type: 'triangle', volume: .085, delay: .10 }), t(659, .18, { type: 'triangle', volume: .085, delay: .20 }), t(784, .20, { type: 'triangle', volume: .09, delay: .30 }), t(1047, .34, { type: 'sine', volume: .11, delay: .41 }), t(1319, .20, { type: 'sine', volume: .065, delay: .53 }), t(1568, .24, { type: 'sine', volume: .05, delay: .64 }), n(.18, { volume: .032, delay: .42, filterFrequency: 4200, filterType: 'highpass', q: .4 })],
  defeatImpact: [n(.42, { volume: .10, filterFrequency: 310, filterType: 'lowpass', q: 1.8 }), n(.16, { volume: .055, delay: .06, filterFrequency: 1250, filterType: 'bandpass', q: 5 }), t(155, .34, { type: 'sawtooth', volume: .075, toFrequency: 58 }), t(82, .62, { type: 'square', volume: .085, delay: .05, toFrequency: 43 })],
  fail: [n(.16, { volume: .065, filterFrequency: 520, filterType: 'lowpass' }), t(330, .48, { type: 'triangle', volume: .115, toFrequency: 205 }), t(220, .54, { type: 'sine', volume: .13, delay: .03, toFrequency: 138 }), t(196, .92, { type: 'sine', volume: .145, delay: .42, toFrequency: 72 }), t(294, .86, { type: 'triangle', volume: .07, delay: .45, toFrequency: 108 }), t(98, 1.05, { type: 'sine', volume: .10, delay: .48, toFrequency: 48 }), n(.28, { volume: .04, delay: .46, filterFrequency: 260, filterType: 'lowpass' })],
};

interface AudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export interface GrowthSoundFrame {
  radius: number;
  minimumRadius: number;
  limit: number;
  growing: boolean;
}

export interface ProceduralAudio {
  isEnabled(): boolean;
  setEnabled(enabled: boolean): void;
  unlock(): AudioContext | null;
  play(effect: SoundEffect): void;
  startGrowth(): void;
  updateGrowth(frame: GrowthSoundFrame): void;
  stopGrowth(fast?: boolean): void;
}

export function createProceduralAudio(initiallyEnabled: boolean): ProceduralAudio {
  let enabled = Boolean(initiallyEnabled);
  let context: AudioContext | null = null;
  let masterGain: GainNode | null = null;
  let growOscillator: OscillatorNode | null = null;
  let growSecondOscillator: OscillatorNode | null = null;
  let growGain: GainNode | null = null;
  let growFilter: BiquadFilterNode | null = null;

  function unlock(): AudioContext | null {
    if (!enabled) return null;
    const AudioContextClass = window.AudioContext || (window as AudioWindow).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!context) {
      context = new AudioContextClass();
      masterGain = context.createGain();
      masterGain.gain.value = .24;
      masterGain.connect(context.destination);
    }
    if (context.state === 'suspended') void context.resume();
    return context;
  }

  function playTone(command: ToneCommand): void {
    const audioContext = unlock();
    if (!audioContext || !masterGain) return;
    const start = audioContext.currentTime + (command.delay ?? 0);
    const end = start + command.duration;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = command.type ?? 'sine';
    oscillator.frequency.setValueAtTime(Math.max(20, command.frequency), start);
    if (command.toFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, command.toFrequency), end);
    }
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002, command.volume ?? .13), start + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, end);
    oscillator.connect(gain).connect(masterGain);
    oscillator.start(start);
    oscillator.stop(end + .03);
  }

  function playNoise(command: NoiseCommand): void {
    const audioContext = unlock();
    if (!audioContext || !masterGain) return;
    const start = audioContext.currentTime + (command.delay ?? 0);
    const length = Math.max(1, Math.floor(audioContext.sampleRate * command.duration));
    const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) {
      samples[index] = (Math.random() * 2 - 1) * (1 - index / length);
    }
    const source = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();
    source.buffer = buffer;
    filter.type = command.filterType ?? 'bandpass';
    filter.frequency.value = command.filterFrequency ?? 1200;
    filter.Q.value = command.q ?? .8;
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002, command.volume ?? .08), start + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, start + command.duration);
    source.connect(filter).connect(gain).connect(masterGain);
    source.start(start);
    source.stop(start + command.duration + .02);
  }

  function play(effect: SoundEffect): void {
    if (!enabled) return;
    for (const command of RECIPES[effect]) {
      if (command.kind === 'tone') playTone(command);
      else playNoise(command);
    }
  }

  function stopGrowth(fast = false): void {
    if (!context) {
      growOscillator = growSecondOscillator = growGain = growFilter = null;
      return;
    }
    const now = context.currentTime;
    if (growGain) {
      try {
        growGain.gain.cancelScheduledValues(now);
        growGain.gain.setTargetAtTime(.0001, now, fast ? .015 : .045);
      } catch { /* The node may already be detached. */ }
    }
    const first = growOscillator;
    const second = growSecondOscillator;
    setTimeout(() => {
      try { first?.stop(); } catch { /* already stopped */ }
      try { second?.stop(); } catch { /* already stopped */ }
    }, fast ? 55 : 130);
    growOscillator = growSecondOscillator = growGain = growFilter = null;
  }

  function startGrowth(): void {
    const audioContext = unlock();
    if (!enabled || !audioContext || !masterGain) return;
    stopGrowth(true);
    growOscillator = audioContext.createOscillator();
    growSecondOscillator = audioContext.createOscillator();
    growFilter = audioContext.createBiquadFilter();
    growGain = audioContext.createGain();
    growOscillator.type = 'sine';
    growSecondOscillator.type = 'triangle';
    growOscillator.frequency.value = 76;
    growSecondOscillator.frequency.value = 113;
    growOscillator.detune.value = -7;
    growSecondOscillator.detune.value = 5;
    growFilter.type = 'lowpass';
    growFilter.frequency.value = 330;
    growFilter.Q.value = .72;
    growGain.gain.value = .0001;
    growOscillator.connect(growFilter);
    growSecondOscillator.connect(growFilter);
    growFilter.connect(growGain).connect(masterGain);
    const now = audioContext.currentTime;
    growGain.gain.setValueAtTime(.0001, now);
    growGain.gain.exponentialRampToValueAtTime(.050, now + .14);
    growOscillator.start(now);
    growSecondOscillator.start(now);
  }

  function updateGrowth(frame: GrowthSoundFrame): void {
    if (!enabled || !growOscillator || !growSecondOscillator || !growGain || !growFilter || !context) return;
    const span = Math.max(1, frame.limit - frame.minimumRadius);
    const progress = Math.max(0, Math.min(1, (frame.radius - frame.minimumRadius) / span));
    const baseFrequency = 76 + progress * 142;
    const now = context.currentTime;
    try {
      growOscillator.frequency.setTargetAtTime(baseFrequency, now, .075);
      growSecondOscillator.frequency.setTargetAtTime(baseFrequency * (1.47 + progress * .035), now, .085);
      growFilter.frequency.setTargetAtTime(330 + progress * 980, now, .09);
      growGain.gain.setTargetAtTime(frame.growing ? .050 + progress * .050 : .0045, now, frame.growing ? .07 : .025);
    } catch { /* The voice was stopped between animation frames. */ }
  }

  function setEnabled(nextEnabled: boolean): void {
    enabled = Boolean(nextEnabled);
    if (enabled) {
      unlock();
      playTone(t(660, .07, { volume: .04 }));
    } else {
      stopGrowth(true);
    }
  }

  return {
    isEnabled: () => enabled,
    setEnabled,
    unlock,
    play,
    startGrowth,
    updateGrowth,
    stopGrowth,
  };
}
