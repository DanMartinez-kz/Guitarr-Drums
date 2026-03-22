let activeChordNotes = [];
let activeAuxNotes = []; // arreglo para root/fifth
let fadeTimeouts = [];
let fadeTimeoutsAux = [];
let apagadoTimer = null;

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
  "HH": 42,
  "sS": 37,
  "S": 38,
  "HT": 50,
  "MT": 48,
  "LT": 41,
  "R": 51,
  "C": 49,
};

// Función auxiliar para calcular velocity según posición
function velocityByIndex(i, total) {
  const maxVel = 110;
  const minVel = 80;
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
    midiOutput.send([0xB0, 64, 0]);
    sustainTimeout = null;
  }
  // CC64 ON (pedal presionado)
  midiOutput.send([0xB0, 64, 127]);

  // Apagar automáticamente después de 3 segundos
  sustainTimeout = setTimeout(() => {
    midiOutput.send([0xB0, 64, 0]);
    sustainTimeout = null;
  }, 2600);
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
function strumDown(notes) {
    stopSustain();
    midiOutput.send([0xB0, 64, 127]);
    notes.forEach((note, i) => {
      velocity = velocityByIndex(i, notes.length); // tu función de velocity
      setTimeout(() => {
      midiOutput.send([0x90, note, velocity]);
    }, i * 10);
  });
}

// Rasgueo hacia arriba con sustain
function strumUp(notes) {
  stopSustain();
  midiOutput.send([0xB0, 64, 127]);
  [...notes].reverse().forEach((note, i) => {
    const velocity = velocityByIndex(i, notes.length);
    setTimeout(() => {
      midiOutput.send([0x90, note, velocity]);
    }, i * 8);
  });
}

function playRoot(notes) {
  const root = notes[0];
  midiOutput.send([0x98, root, 0x7f]); // canal 9
  activeAuxNotes.push(root);
}
function playFifth(notes) {
  const fifth = notes[0] - 17;
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
  startSustain();
 // stopFade();

  // Apagar notas inmediatamente
  stopActiveChord()
  
  // Aplicar fade solo al canal, no a las notas activas
  const interval = duration / steps;
  for (let i = 0; i <= steps; i++) {
    fadeTimeouts.push(setTimeout(() => {
      const value = Math.max(0, 127 - i * (127 / steps));
      midiOutput.send([0xB0, 11, value]); // expresión canal 1
    }, i * interval));
  }

  //fadeTimeouts.push(setTimeout(() => {
  //  midiOutput.send([0xB0, 11, 127]); // reset expresión
 // }, duration + 5000));
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
   // midiOutput.send([0xB8, 11, 127]); // reset expresión canal 9
  }, duration + 1100));
}

function playDrums(symbol){
  console.log(symbol);
        const note = drumMap[symbol];
      if (note) midiOutput.send([0x99, note, 0x7f]); // canal 10
}

let pressStart = null;
let intervalId = null;
let pressTime = null;
let chordAnt = null;
let chordAct =null;
// Eventos
document.querySelectorAll('.subpad').forEach(subpad => {
//  subpad.addEventListener('touchstart', e => {console.log(e)});
  subpad.addEventListener('pointerdown', e => {
    e.preventDefault();
    clearTimeout(apagadoTimer);
    subpad.classList.add('active');
    pressStart = performance.now();
    
    //const velocity = Math.floor(e.pressure * 127) || 100; // valor MIDI 0–127
    
    const parentPad = subpad.closest('.pad');
    const chordLabel = parentPad.querySelector('.pad-label')?.textContent.trim();
    const symbol = subpad.textContent.trim();
    const drum = parentPad.dataset.drum;
    
        // Solo flechas apagan acordes previos
    if (symbol === "↓" || symbol === "↑") {
      stopActiveChord();
      chordAct = chordLabel;
      const notes = chordToMidi(chordLabel);
      if (chordAct!=chordAnt){
        midiOutput.send([0x91, 36, 70]);
        midiOutput.send([0xB8, 11, 127]);
        midiOutput.send([0xB8, 123, 127]);
        chordAnt=chordAct;
      };
    };
        // Solo B y b apagan notas previas
    if (symbol === "B" || symbol === "b") stopActiveAux();

    if (chordLabel && chordToMidi(chordLabel) && midiOutput) {
      const notes = chordToMidi(chordLabel);
      if (symbol === "↓") { activeChordNotes = notes; strumDown(notes); }
      if (symbol === "↑") { activeChordNotes = notes; strumUp(notes); }
      if (symbol === "B") playRoot(notes);
      if (symbol === "b") playFifth(notes);
    }
    
    // Actualizamos el contador en tiempo real
    intervalId = setInterval(() => {
    }, 10); // refresco cada 50ms
    
});

  subpad.addEventListener('pointerup', e => {
    subpad.classList.remove('active');

    clearInterval(intervalId);
    intervalId = null;

    pressTime = performance.now() - pressStart;
    pressStart = null;
    
    const symbol = subpad.textContent.trim();
    const parentPad = subpad.closest('.pad');
    const chordLabel = parentPad.querySelector('.pad-label')?.textContent.trim();
    
    // Flechas: fade out
    if ((symbol === "↓" || symbol === "↑") && activeChordNotes.length > 0) {
    if (pressTime > 0) {
          fadeOutChord(activeChordNotes, 2500, 127);
    } else {
      console.log("jdj");
      apagadoTimer = setTimeout(() => {
     // stopActiveChord();
      midiOutput.send([0xB0, 11, 0]);
      //midiOutput.send([0x90, 36, 127]);
      }, 50);
    }
    };

    // Root/Fifth: fade out
    if ((symbol === "B" || symbol === "b") && activeAuxNotes.length > 0) {
      fadeOutAuxNotes(activeAuxNotes, 1000, 127);
    }
    
   // chordAnt = chordLabel;

 
  });


  
  subpad.addEventListener('pointercancel', () => {
    subpad.classList.remove('active');
  });
  
  subpad.addEventListener('contextmenu', e => e.preventDefault());
  subpad.style.userSelect = "none";
  
  subpad.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
  subpad.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
});

  // Añadimos el evento pointerdown a los semicírculos
const corners = document.querySelectorAll(".corner");
corners.forEach(corner =>{
  corner.style.userSelect = "none";
  corner.addEventListener('contextmenu', e => e.preventDefault());
  corner.addEventListener("pointerdown", (event) => {
    event.preventDefault();
  corner.classList.add('active');
    
   const symbol = corner.textContent.trim();const parentPad = corner.closest('.pad');
    const chordLabel = parentPad.querySelector('.pad-label')?.textContent.trim();

    stopActiveChord();
    const notes = chordToMidi(chordLabel);
    midiOutput.send([0xB0, 11, 0]);
    //midiOutput.send([0x91, 39, 80]);
  });
  corner.addEventListener("pointerup", e => {
    corner.classList.remove('active');
  })
  corner.addEventListener('pointercancel', () => {
    corner.classList.remove('active');
  });
});

// Al mover el dedo por la pantalla
let actE = null;
document.addEventListener("pointermove", e => {
  if (e.buttons > 0) { // dedo/mouse presionado
    const elem = document.elementFromPoint(e.clientX, e.clientY);
    if (elem && elem.classList.contains("D")) {
    //  activarPad(elem);
      if (elem!=actE){
        playDrums(elem.textContent);
        //console.log(elem.textContent);
        if(actE!=null) {actE.classList.remove('active')};
        elem.classList.add('active');
      }
      actE = elem;
    };
  }
});

document.addEventListener('pointerup', e => {
  const elem = document.elementFromPoint(e.clientX, e.clientY);
  if (elem && elem.classList.contains("D")) {
    elem.classList.remove('active');
    actE = null;
  }
})