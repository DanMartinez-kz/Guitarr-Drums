let activeChordNotes = [];
let activeAuxNotes = []; // arreglo para root/fifth
let fadeTimeouts = [];
let fadeTimeoutsAux = [];
let clickCount = 0;
let clickTimer = null;
let rasgueoTime = null;
let duration = null;

// Mapeo de acordes (ejemplo en C mayor)
const chordMap = {
  "I": "",
  "I7": "7",
  "II": "m",
  "III": "m",
  "IV": "",
  "V": "",
  "VI": "m",
};

// Mapeo de batería (canal 10)
const drumMap = {
  "K": 36,
  "H": 42,
  "sS": 37,
  "S": 38
};

// Función auxiliar para calcular velocity según posición
function velocityByIndex(i, total) {
  const maxVel = 105;
  const minVel = 60;
  // interpolación lineal: primera cuerda = maxVel, última = minVel
  return Math.round(maxVel - (i * (maxVel - minVel) / (total - 1)));
}


let sustainTimeout = null;

// Activar sustain
function startSustain() {
  if (!midiOutput) return;
  // Cancelar sustain previo
  if (sustainTimeout) {
    clearTimeout(sustainTimeout);
    sustainTimeout = null;
  }
  // CC64 ON (pedal presionado)
  midiOutput.send([0xB0, 64, 127]);

  // Apagar automáticamente después de 3 segundos
  sustainTimeout = setTimeout(() => {
    midiOutput.send([0xB0, 64, 0]);
    sustainTimeout = null;
  }, 3000);
}

// Apagar sustain inmediatamente (ej. al tocar otro acorde)
function stopSustain() {
  if (!midiOutput) return;
  if (sustainTimeout) {
    clearTimeout(sustainTimeout);
    sustainTimeout = null;
  }
  midiOutput.send([0xB0, 64, 0]);
}

// Rasgueo hacia abajo con sustain
function strumDown(notes, duration) {
  console.log("duracion:", duration);
  startSustain();
  notes.slice(1).forEach((note, i) => {
    const velocity = velocityByIndex(i, notes.length); // tu función de velocity
    setTimeout(() => {
      midiOutput.send([0x90, note, velocity]);
    }, i * duration);
  });
}

// Rasgueo hacia arriba con sustain
function strumUp(notes, duration) {
  startSustain();
  [...notes].reverse().slice(1).forEach((note, i) => {
    const velocity = velocityByIndex(i, notes.length);
    setTimeout(() => {
      midiOutput.send([0x90, note, velocity]);
    }, i * duration);
  });
}

function playRoot(notes) {
  const root = notes[0] - 24;
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
function fadeOutChord(notes, duration, steps) {
  if (!midiOutput) return;
  //stopFade();
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
  }, duration + 4000));
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
let triggered = false;
let chordLabel = null;
let notes = [];
// Eventos
document.querySelectorAll('.subpad').forEach(subpad => {
//  subpad.addEventListener('touchstart', e => {console.log(e)});
  subpad.addEventListener('pointerdown', e => {
    e.preventDefault();
    subpad.classList.add('active');
    let pressStart = Date.now()
    
    const parentPad = subpad.closest('.pad');
    chordLabel = parentPad.querySelector('.pad-label')?.textContent.trim();
    const drum = parentPad.dataset.drum;
    const symbol = subpad.textContent.trim();

    
    // Solo flechas apagan acordes previos e inician temporizador
    if (symbol === "↓" || symbol === "↑") {
      notes = chordToMidi(chordLabel);
      stopActiveChord();
      if (symbol === "↓") {midiOutput.send([0x90, notes[0], 120])};
      if (symbol === "↑") {midiOutput.send([0x90, [...notes].reverse()[0], 120])};
      intervalId = setInterval(() => {
        duration = Date.now() - pressStart;
        //console.log("Duración: " + duration + " ms");
        // activar rasgueo cuando llegue a Xms (o más)
        if (!triggered && duration >= 180) {
          if (symbol === "↓") { activeChordNotes = notes; strumDown(notes, duration); }
          if (symbol === "↑") { activeChordNotes = notes; strumUp(notes, duration); }
          triggered = true; // evitar múltiples disparos
          console.log(triggered);
        }
      }, 10); // refresca cada 10ms
    }
    
    // Solo B y b apagan notas previas
    if (symbol === "B" || symbol === "b") stopActiveAux();

    if (chordLabel && chordToMidi(chordLabel) && midiOutput) {
      notes = chordToMidi(chordLabel);
      //if (symbol === "↓") { activeChordNotes = notes; strumDown(notes, duration); }
     // if (symbol === "↑") { activeChordNotes = notes; strumUp(notes, duration); }
      if (symbol === "B") playRoot(notes);
      if (symbol === "b") playFifth(notes);
    }

    if (drum && midiOutput) {
      const note = drumMap[symbol];
      if (note) midiOutput.send([0x99, note, 0x7f]); // canal 10
    }
    
//para fullscreen
if (symbol === "b")  {
  clickCount++;

  if (clickTimer) clearTimeout(clickTimer);
  clickTimer = setTimeout(() => { clickCount = 0; }, 200); // ventana de 600ms

  if (clickCount === 2) {
    clickCount = 0;
    switch (subpad.id) {
      case "pad1-b":
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
      break;
      case "pad2-b":
  const select = document.getElementById("midiSelect");
  if (select.showPicker) {
    // Navegadores modernos (Chrome, Edge, algunos móviles)
    select.showPicker(); 
  } else {
    // Fallback: darle foco
    select.focus();
  }
  break;
    }
  }
}
});

  subpad.addEventListener('pointerup', e => {
    subpad.classList.remove('active');
    triggered = false;
    
    const symbol = subpad.textContent.trim();
    const parentPad = subpad.closest('.pad');
    const drum = parentPad.dataset.drum;

    // Flechas: fade out y reiniciar contador
    if ((symbol === "↓" || symbol === "↑")) {
      stopActiveChord();
      let dur = 40;
      clearInterval(intervalId);
      switch (true) {
        case (duration <= 80) : dur = 10;
        break;
      }
      console.log(duration);
      if (duration <= 180 && symbol === "↓") {activeChordNotes = notes; strumDown(notes, dur)};
      if (duration <= 180 && symbol === "↑") {activeChordNotes = notes; strumUp(notes, dur)};
      if (activeChordNotes.length > 0){ fadeOutChord(activeChordNotes, 10000, 10)} 
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