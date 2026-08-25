(function () {
  "use strict";

  let earlyContext = null;

  function primeAudioFromGesture(primedContext) {
    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (!AudioEngine) return;
    earlyContext = primedContext || earlyContext || new AudioEngine();
    window.__zkEarlyAudioContext = earlyContext;
    window.__zkPendingAmbientSound = true;
    if (earlyContext.state === "suspended") void earlyContext.resume();
  }

  window.ZKAudio = {
    enableFromGesture: primeAudioFromGesture,
    disable: () => {
      window.__zkPendingAmbientSound = false;
      if (earlyContext?.state === "running") void earlyContext.suspend();
    },
    state: () => ({
      enabled: Boolean(window.__zkPendingAmbientSound && earlyContext?.state === "running"),
      context: earlyContext?.state || "uninitialized",
      voices: 0,
    }),
  };
})();
