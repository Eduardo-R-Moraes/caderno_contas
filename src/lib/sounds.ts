// ============================================================
// Efeitos sonoros da partida
// ============================================================
import { load, save } from './storage';

const sounds = {
  rightAnswer: new Audio('/sounds/rightAnswer.wav'),
  wrongAnswer: new Audio('/sounds/wrongAnswer.wav'),
};

let muted = load('cc.muted', false);

export function isMuted() { return muted; }

export function setMuted(value: boolean) {
  muted = value;
  save('cc.muted', value);
}

export function play(name: keyof typeof sounds) {
  if (muted) return;
  const sound = sounds[name];
  sound.currentTime = 0;
  sound.play().catch(() => {});
}
