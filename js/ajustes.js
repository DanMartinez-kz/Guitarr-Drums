let clickCount = 0;
let clickTimer = null;

document.querySelectorAll('.corner.top-right').forEach(subpad => {
  subpad.addEventListener('pointerdown', e => {
    
  clickCount++;

  if (clickTimer) clearTimeout(clickTimer);
  clickTimer = setTimeout(() => { clickCount = 0; }, 200); // ventana de 600ms

  if (clickCount === 2) {
    clickCount = 0;
    switch (subpad.id) {
      case "crn1":
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
      break;
      case "crn2":
  const select = document.getElementById("midiSelect");
  if (select.showPicker) {
    // Navegadores modernos (Chrome, Edge, algunos móviles)
    select.showPicker(); 
  } else {
    // Fallback: darle foco
    select.focus();
  }
  break;
      case "crn5":
      const tonosDiv = document.getElementById("tonalidad");

          if (tonosDiv.style.display === "none") {
        tonosDiv.style.display = "block"; // mostrar
      } else {
        tonosDiv.style.display = "none"; // ocultar
      }
      break;
      case "crn6":
      const slidersDiv = document.getElementById("volumenes");

          if (slidersDiv.style.display === "none") {
        slidersDiv.style.display = "block"; // mostrar
      } else {
        slidersDiv.style.display = "none"; // ocultar
      }
    }
 // }
}

  });
});
    
