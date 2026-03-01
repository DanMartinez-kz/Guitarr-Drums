let activeChordNotes = [];
let activeAuxNotes = []; // arreglo para root/fifth
let fadeTimeouts = [];
let fadeTimeoutsAux = [];

// Mapeo de acordes (ejemplo en C mayor)
const chordMap = {
  "I": [48, 52, 55, 60, 64, 67],
  "II": [50, 53, 57, 62, 65, 69],
  "III": [52, 55, 59, 64, 67, 71],
  "IV": [53, 57, 60, 65, 69, 72],
  "V": [55, 59, 62, 67, 71, 74],
  "VI": [57, 60, 64, 69, 72, 76],
  "VII": [59, 62, 65, 71, 74, 77]
};

// Mapeo de batería (canal 10)
const drumMap = {
  "K": 36,
  "H": 42,
  "sS": 37,
  "S": 38
};

// Funciones de rasgueo
function strumDown(notes, velocity = 100) {
  const baseDelay = 20;
  const strumDelay = Math.max(4, baseDelay * (127 / velocity));
  notes.forEach((note, i) => {
    setTimeout(() => {
      midiOutput.send([0x90, note, velocity]); // Note ON canal 1 con velocity
    }, i * strumDelay);
  });
}

function strumUp(notes, velocity = 100) {
  const baseDelay = 20;
  const strumDelay = Math.max(4, baseDelay * (127 / velocity));
  [...notes].reverse().forEach((note, i) => {
    setTimeout(() => {
      midiOutput.send([0x90, note, velocity]); // Note ON canal 1 con velocity
    }, i * strumDelay);
  });
}

// Root y Fifth
function playRoot(notes) {
  const root = notes[0] - 12;
  midiOutput.send([0x98, root, 0x7f]); // canal 9
  activeAuxNotes.push(root);
}

function playFifth(notes) {
  const fifth = notes[2] - 24;
  midiOutput.send([0x98, fifth, 0x7f]); // canal 9
  activeAuxNotes.push(fifth);
}

// Cancelar fade
function stopFade() {
  fadeTimeouts.forEach(id => clearTimeout(id));
  fadeTimeouts = [];
  if (midiOutput) midiOutput.send([0xB0, 11, 127]); // reset expresión canal 1
}

// Apagar acorde inmediatamente
function stopActiveChord() {
  if (midiOutput && activeChordNotes.length > 0) {
    activeChordNotes.forEach(note => {
      midiOutput.send([0x80, note, 0x40]); // canal 1
    });
    activeChordNotes = [];
  }
  stopFade();
}

// Fade out para acordes
function fadeOutChord(notes, duration = 2000, steps = 12) {
  if (!midiOutput) return;
  stopFade();
  const interval = duration / steps;

  for (let i = 0; i <= steps; i++) {
    fadeTimeouts.push(setTimeout(() => {
      const value = Math.max(0, 127 - i * (127 / steps));
      midiOutput.send([0xB0, 11, value]); // canal 1
    }, i * interval));
  }

  fadeTimeouts.push(setTimeout(() => {
    notes.forEach(note => midiOutput.send([0x80, note, 0x40]));
    activeChordNotes = [];
    midiOutput.send([0xB0, 11, 127]); // reset expresión
  }, duration + 50));
}

// Cancelar fade
function stopFadeAux() {
  fadeTimeoutsAux.forEach(id => clearTimeout(id));
  fadeTimeoutsAux = [];
  if (midiOutput) midiOutput.send([0xB8, 11, 127]); // reset expresión canal 9
}

// Apagar nota inmediatamente
function stopActiveAux() {
  if (midiOutput && activeAuxNotes.length > 0) {
    activeAuxNotes.forEach(note => {
      midiOutput.send([0x88, note, 0x40]); // canal 9
    });
    activeAuxNotes = [];
  }
  stopFadeAux();
}

// Fade out para root/fifth
function fadeOutAuxNotes(notes, duration = 2000, steps = 12) {
  if (!midiOutput) return;
  const interval = duration / steps;

  for (let i = 0; i <= steps; i++) {
    fadeTimeoutsAux.push(setTimeout(() => {
      const value = Math.max(0, 127 - i * (127 / steps));
      midiOutput.send([0xB8, 11, value]); // canal 9
    }, i * interval));
  }

  fadeTimeoutsAux.push(setTimeout(() => {
    notes.forEach(note => midiOutput.send([0x88, note, 0x40])); // canal 9
    activeAuxNotes = [];
    midiOutput.send([0xB8, 11, 127]); // reset expresión canal 9
  }, duration + 50));
}

// Eventos
document.querySelectorAll('.subpad').forEach(subpad => {
  subpad.addEventListener('pointerdown', e => {
    e.preventDefault();
    subpad.classList.add('active');
console.log(e.pressure);
    const velocity = Math.floor(e.pressure * 127) || 100; // valor MIDI 0–127
    
    const parentPad = subpad.closest('.pad');
    const chordLabel = parentPad.querySelector('.pad-label')?.textContent.trim();
    const drum = parentPad.dataset.drum;
    const symbol = subpad.textContent.trim();

    // Solo flechas apagan acordes previos
    if (symbol === "↓" || symbol === "↑") stopActiveChord();
    
    // Solo B y b apagan notas previas
    if (symbol === "B" || symbol === "b") stopActiveAux();

    if (chordLabel && chordMap[chordLabel] && midiOutput) {
      const notes = chordMap[chordLabel];
      if (symbol === "↓") { activeChordNotes = notes; strumDown(notes); }
      if (symbol === "↑") { activeChordNotes = notes; strumUp(notes); }
      if (symbol === "B") playRoot(notes);
      if (symbol === "b") playFifth(notes);
    }

    if (drum && midiOutput) {
      const note = drumMap[symbol];
      if (note) midiOutput.send([0x99, note, 0x7f]); // canal 10
    }
  });

  subpad.addEventListener('pointerup', e => {
    subpad.classList.remove('active');

    const symbol = subpad.textContent.trim();
    const parentPad = subpad.closest('.pad');
    const drum = parentPad.dataset.drum;

    // Flechas: fade out
    if ((symbol === "↓" || symbol === "↑") && activeChordNotes.length > 0) {
      fadeOutChord(activeChordNotes, 2000, 12);
    }

    // Root/Fifth: fade out
    if ((symbol === "B" || symbol === "b") && activeAuxNotes.length > 0) {
      fadeOutAuxNotes(activeAuxNotes, 2000, 12);
    }

    // Batería: apagado inmediato
    if (drum && midiOutput) {
      const note = drumMap[symbol];
      if (note) midiOutput.send([0x89, note, 0x40]); // canal 10
    }
  });

  subpad.addEventListener('pointercancel', () => {
    subpad.classList.remove('active');
  });
  
  subpad.addEventListener('contextmenu', e => e.preventDefault());
subpad.style.userSelect = "none";
  
  subpad.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
      subpad.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

});