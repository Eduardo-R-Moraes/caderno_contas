// Efeitos sonoros da partida

const sounds = {
  rightAnswer: new Audio('/sounds/rightAnswer.wav'),
  wrongAnswer: new Audio('/sounds/wrongAnswer.wav'),
};

export function play(name: keyof typeof sounds) {
  const sound = sounds[name];
  sound.currentTime = 0;
  sound.play().catch(() => {});
}
