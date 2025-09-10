import { set_score, get_score, action_trigger, client_update_datas } from "/app.js";

export function initGame(socket, client_datas) {
  let score = get_score() || 0;
  const textEl = document.getElementById("clic-text");

  function handleTap() {
    score++;
    textEl.textContent = score;
    set_score(score);
    let action_datas = { score: score };
    action_trigger("touch_screen", action_datas);
    client_update_datas({ score: score });
  }

  document.addEventListener("click", handleTap);

  return () => {
    document.removeEventListener("click", handleTap);
  };
}
window.initGame = initGame;
