import { set_score, get_score, action_trigger, client_update_datas } from "/app.js";

export function initGame(socket, client_datas) {
  let score = get_score() || 0;
  const textEl = document.getElementById("clic-text");
  console.log("client_datas at initGame:", client_datas);

  if (client_datas.tracking_status != "valid") {
    textEl.textContent = "Enregistre toi pour activer le bouclier";

  } else {
    if (client_datas.shield_ready) {
      textEl.textContent = "Bouclier actif ! Touche l'écran pour l'activer";
    } else {
      textEl.textContent = "Bouclier en recharge..." ;
    }

  }


  function handleTap() {
  console.log("handleTap");
    score++;
    textEl.textContent = score;
    set_score(score);

    if (client_datas.shield_ready) {
      console.log("shield triggered");
      trigger_shied()
      textEl.textContent = "Bouclier en recharge...";
      client_update_datas({ shield_ready: false });
    } else {
      textEl.textContent = "Bouclier pas prêt..." ;
    }


    let action_datas = { score: score };
    action_trigger("touch_screen", action_datas);
    client_update_datas({ score: score });
  }

  function reinitialize_shield() {
    console.log("shied_ready event received");
    textEl.textContent = "Bouclier actif ! Touche l'écran pour l'activer";
  }

  function trigger_shied() {
    let action_datas = { score: score };
    action_trigger("trigger_shield", action_datas);
    client_update_datas({ score: score });
  }

  document.addEventListener("click", handleTap);

  window.addEventListener('shield_ready', reinitialize_shield);


  return () => {
    document.removeEventListener("click", handleTap);
  };
}
window.initGame = initGame;
