const notAm = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
const estructura = {
    mayor: ["m", "m", "", "m", "", ""],
    menor: ["", "m", "", "", "m", ""]
};
const intervalos = {
  mayor: [9, 4, 5, 2, 0, 7],
  menor: [3, 5, 10, 8, 0, 7]
};

const select = document.getElementById("tonoSelect");

  // Recorremos el array y creamos cada opción
  notAm.forEach(nota => {
    const option = document.createElement("option");
    option.value = nota;        // valor interno
    option.textContent = nota;  // texto visible
    select.appendChild(option);
  });

document.getElementById("tonoSelect").addEventListener("change", (e) => {
    const mm = document.querySelector('input[name="estr"]:checked').value;
    const raiz = e.target.value;
    const tono = notAm.indexOf(raiz);
    //console.log(estructura[mm]);
    const tonos = intervalos[mm].map(intervalo => notAm[(tono + intervalo) % 12]);
    console.log(tonos);
  const labels = document.querySelectorAll(".pad-label");

  // for clásico
  for (let i = 0; i < 6; i++) {
      const tonEs = tonos[i] + estructura[mm][i];
     // console.log(tonEs);
    labels[i].textContent = tonEs;
  }
});