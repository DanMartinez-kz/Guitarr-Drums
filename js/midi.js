  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
  }

  let midiOutput;

  function onMIDISuccess(midiAccess) {
    const outputs = midiAccess.outputs.values();
    midiOutput = outputs.next().value;
  }

  function onMIDIFailure() {
    console.error("No se pudo acceder a MIDI");
  }