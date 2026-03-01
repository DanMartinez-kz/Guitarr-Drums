const natAm = ["A", "B", "C", "D", "E", "F", "G"];
const afiEst = [40, 45, 50, 55, 59, 64];

const pisadasMap = {
  // Mayores abiertos
  "C": ["X", 3, 2, 0, 1, 0],   // C mayor
  "D": ["X", "X", 0, 2, 3, 2], // D mayor
  "E": [0, 2, 2, 1, 0, 0],     // E mayor
  "F": [1, 3, 3, 2, 1, 1],     // F mayor (cejilla)
  "G": [3, 2, 0, 0, 0, 3],     // G mayor
  "A": ["X", 0, 2, 2, 2, 0],   // A mayor
  "B": ["X", 2, 4, 4, 4, 2],   // B mayor (cejilla)

  // Menores abiertos
  "Cm": ["X", 3, 1, 0, 1, 3],  // C menor
  "Dm": ["X", "X", 0, 2, 3, 1],// D menor
  "Em": [0, 2, 2, 0, 0, 0],    // E menor
  "Fm": [1, 3, 3, 1, 1, 1],    // F menor (cejilla)
  "Gm": [3, 5, 5, 3, 3, 3],    // G menor (cejilla)
  "Am": ["X", 0, 2, 2, 1, 0],  // A menor
  "Bm": ["X", 2, 4, 4, 3, 2],  // B menor (cejilla)

  // Sostenidos mayores (♯)
  "C#": ["X", 4, 6, 6, 6, 4],  // C# mayor (cejilla)
  "D#": ["X", 6, 8, 8, 8, 6],  // D# mayor (cejilla)
  "F#": [2, 4, 4, 3, 2, 2],    // F# mayor
  "G#": [4, 6, 6, 5, 4, 4],    // G# mayor
  "A#": ["X", 1, 3, 3, 3, 1],  // A# mayor (cejilla)

  // Sostenidos menores (♯m)
  "C#m": ["X", 4, 6, 6, 5, 4], // C# menor
  "D#m": ["X", 6, 8, 8, 7, 6], // D# menor
  "F#m": [2, 4, 4, 2, 2, 2],   // F# menor
  "G#m": [4, 6, 6, 4, 4, 4],   // G# menor
  "A#m": ["X", 1, 3, 3, 2, 1], // A# menor

  // Séptimas dominantes (7)
  "C7": ["X", 3, 2, 3, 1, 0],  // C7
  "D7": ["X", "X", 0, 2, 1, 2],// D7
  "E7": [0, 2, 0, 1, 0, 0],    // E7
  "F7": [1, 3, 1, 2, 1, 1],    // F7
  "G7": [3, 2, 0, 0, 0, 1],    // G7
  "A7": ["X", 0, 2, 0, 2, 0],  // A7
  "B7": ["X", 2, 1, 2, 0, 2],  // B7

  // Séptimas menores (m7)
  "Cm7": ["X", 3, 1, 3, 1, 3], // C menor 7
  "Dm7": ["X", "X", 0, 2, 1, 1],// D menor 7
  "Em7": [0, 2, 0, 0, 0, 0],   // E menor 7
  "Fm7": [1, 3, 1, 1, 1, 1],   // F menor 7
  "Gm7": [3, 5, 3, 3, 3, 3],   // G menor 7
  "Am7": ["X", 0, 2, 0, 1, 0], // A menor 7
  "Bm7": ["X", 2, 0, 2, 0, 2]  // B menor 7
};

function chordToMidi(chordName) {
if (chordName !== "Drum") { 
  const shape = pisadasMap[chordName]; // ej. "C" → ["X",3,2,0,1,0]
  const notes = [];

  shape.forEach((fret, stringIndex) => {
    if (fret !== "X") {
      const baseMidi = afiEst[stringIndex]; // nota al aire de esa cuerda
      notes.push(baseMidi + fret);          // sumamos el traste
    }
  });

  return notes;
}
}