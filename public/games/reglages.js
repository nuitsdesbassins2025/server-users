import { set_pseudo, set_color, set_player_id, client_update_datas } from "/app.js";

export function initGame(socket, client_datas) {
  const form = document.getElementById("settingsForm");
  const pseudoInput = document.getElementById("pseudoInput");
  const colorInput = document.getElementById("colorInput");
  const trackingInput = document.getElementById("trackingInput");

  // préremplir avec les valeurs existantes
  pseudoInput.value = client_datas.pseudo ?? "";
  colorInput.value = client_datas.color ?? "#444444";
  trackingInput.value = client_datas.player_id ?? "";

  function handleSubmit(e) {
    e.preventDefault();
    const pseudo = pseudoInput.value.trim();
    const color = colorInput.value;
    const tracking = parseInt(trackingInput.value, 10);

    var datas = {};
    if (pseudo) datas.pseudo = pseudo;
    if (color) datas.color = color;
    if (!isNaN(tracking)) datas.player_id = String(tracking);
    console.log(String(tracking))

    // if (pseudo) set_pseudo(pseudo);
    // if (color) set_color(color);
    // if (!isNaN(tracking)) set_player_id(tracking);



    client_update_datas(datas);

    // alert("Réglages sauvegardés !");
  }

  form.addEventListener("submit", handleSubmit);

  return () => {
    form.removeEventListener("submit", handleSubmit);
  };
}

window.initGame = initGame;
