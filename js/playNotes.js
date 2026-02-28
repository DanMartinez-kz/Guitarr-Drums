  // Mapeo de acordes (ejemplo en C mayor)
const chordMap = {
  "I": [48, 52, 55, 60, 64, 67],   // C mayor abierto: C2, E2, G2, C3, E3, G3
  "II": [50, 53, 57, 62, 65, 69],  // D menor abierto
  "III": [52, 55, 59, 64, 67, 71], // E menor abierto
  "IV": [53, 57, 60, 65, 69, 72],  // F mayor
  "V": [55, 59, 62, 67, 71, 74],   // G mayor
  "VI": [57, 60, 64, 69, 72, 76],  // A menor
  "VII": [59, 62, 65, 71, 74, 77]  // B disminuido
};
  // Mapeo de batería (canal 10)
  const drumMap = {
    "K": 36,   // Kick
    "H": 42,   // Hi-hat cerrado
    "sS": 37,  // Side Stick
    "S": 38    // Snare acústica
  };

  // Funciones de rasgueo (Note ON solamente)
  function strumDown(notes) {
    notes.forEach((note, i) => {
      setTimeout(() => {
        console.log(note);
        midiOutput.send([0x90, note, 0x7f]); // Note ON canal 1
      }, i * 16);
    });
  }

  function strumUp(notes) {
    [...notes].reverse().forEach((note, i) => {
      setTimeout(() => {
        midiOutput.send([0x90, note, 0x7f]); // Note ON canal 1
      }, i * 16);
    });
  }

  function playRoot(notes) {
    const root = notes[0];
    midiOutput.send([0x90, root, 0x7f]);
  }

  function playFifth(notes) {
    const fifth = notes[2];
    midiOutput.send([0x90, fifth, 0x7f]);
  }

  // Multitouch en subpads
  document.querySelectorAll('.subpad').forEach(subpad => {
    subpad.addEventListener('pointerdown', e => {
      e.preventDefault();
      subpad.classList.add('active');

      const parentPad = subpad.closest('.pad');
      const chordLabel = parentPad.querySelector('.pad-label')?.textContent.trim();
      const drum = parentPad.dataset.drum;
      const symbol = subpad.textContent.trim();

      if (chordLabel && chordMap[chordLabel] && midiOutput) {
        const notes = chordMap[chordLabel];
        if (symbol === "↓") strumDown(notes);
        if (symbol === "↑") strumUp(notes);
        if (symbol === "B") playRoot(notes);
        if (symbol === "b") playFifth(notes);
      }

      if (drum && midiOutput) {
        const note = drumMap[symbol];
        if (note) {
          midiOutput.send([0x99, note, 0x7f]); // Note ON canal 10
        }
      }
    });

    subpad.addEventListener('pointerup', e => {
      subpad.classList.remove('active');

      const parentPad = subpad.closest('.pad');
      const chordLabel = parentPad.querySelector('.pad-label')?.textContent.trim();
      const drum = parentPad.dataset.drum;
      const symbol = subpad.textContent.trim();

      if (chordLabel && chordMap[chordLabel] && midiOutput) {
        const notes = chordMap[chordLabel];
        // Apagar todas las notas del acorde
        notes.forEach(note => {
          midiOutput.send([0x80, note, 0x40]); // Note OFF canal 1
        });
      }

      if (drum && midiOutput) {
        const note = drumMap[symbol];
        if (note) {
          midiOutput.send([0x89, note, 0x40]); // Note OFF canal 10
        }
      }
    });

    subpad.addEventListener('pointercancel', () => {
      subpad.classList.remove('active');
    });
  });