if (navigator.requestMIDIAccess) {
  navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
}

let midiOutput;

function onMIDISuccess(midiAccess) {
  const select = document.getElementById("midiSelect");
  select.innerHTML = "";

  // Agregar cada dispositivo como opción
  midiAccess.outputs.forEach(output => {
    const option = document.createElement("option");
    option.value = output.id;
    option.textContent = `${output.name} (${output.manufacturer})`;
    select.appendChild(option);
  });

  // Seleccionar el primero por defecto
  const first = midiAccess.outputs.values().next().value;
  if (first) {
    midiOutput = first;
    console.log(`Conectado por defecto a: ${midiOutput.name}`);
  }

  // Cambiar dispositivo al seleccionar otro
  select.addEventListener("change", e => {
    const selectedId = e.target.value;
    midiOutput = midiAccess.outputs.get(selectedId);
    console.log(`Conectado a: ${midiOutput.name}`);
  });
}

function onMIDIFailure() {
  console.error("No se pudo acceder a MIDI");
}

