import { client_update_datas, set_admin } from "/app.js";

export function initGame(socket, client_datas) {
  const form = document.getElementById("settingsForm");
  const pseudoInput = document.getElementById("pseudoInput");
  const colorInput = document.getElementById("colorInput");
  const trackingInput = document.getElementById("trackingInput");

  // préremplir avec les valeurs existantes
  pseudoInput.value = client_datas.pseudo ?? "";
  colorInput.value = client_datas.color ?? "#444444";
  trackingInput.value = client_datas.player_id ?? "";

  if (pseudoInput.value === "admin") {
    set_admin();
  }


  function handleSubmit(e) {
    e.preventDefault();
    const pseudo = pseudoInput.value.trim();
    const color = colorInput.value;
    const tracking = parseInt(trackingInput.value, 10);

    if (pseudo === "admin") {
      set_admin();
    }

    var datas = {};
    if (pseudo) datas.pseudo = pseudo;
    if (color) datas.color = color;
    if (!isNaN(tracking)) datas.player_id = String(tracking);
    console.log(String(tracking))


    client_update_datas(datas);

    // alert("Réglages sauvegardés !");
  }

  form.addEventListener("submit", handleSubmit);

  return () => {
    form.removeEventListener("submit", handleSubmit);
  };
}

window.initGame = initGame;
