// on importe admin_emit_event depuis app.js
import { admin_emit_event } from "/app.js";

export function initGame(socket, client_datas) {
  const form = document.getElementById("adminForm");
  const eventNameSelect = document.getElementById("eventNameSelect");
  const eventNameCustom = document.getElementById("eventNameCustom");
  const actionSelect = document.getElementById("actionSelect");
  const actionCustom = document.getElementById("actionCustom");
  const addDataRowBtn = document.getElementById("addDataRow");
  const datasContainer = document.getElementById("datasContainer");
  const clientIdInput = document.getElementById("clientIdInput");
  const toClientIdInput = document.getElementById("toClientIdInput");
  const presetBtn = document.getElementById("presetBtn");

  
  const slider = document.getElementById("playerSize");
  const sizeValue = document.getElementById("sizeValue");
  const presetBtn2 = document.getElementById("presetBtn2");

  // toggle custom fields
  eventNameSelect.addEventListener("change", () => {
    eventNameCustom.style.display = eventNameSelect.value === "custom" ? "inline-block" : "none";
  });
  actionSelect.addEventListener("change", () => {
    actionCustom.style.display = actionSelect.value === "custom" ? "inline-block" : "none";
  });

  addDataRowBtn.addEventListener("click", () => {
    const row = document.createElement("div");
    row.className = "data-row";
    row.style = "display:flex;gap:5px;margin-bottom:5px;";
    row.innerHTML = `
      <input type="text" class="data-key" placeholder="clé">
      <input type="text" class="data-value" placeholder="valeur">
      <select class="data-type">
        <option value="undefined">undefined</option>
        <option value="int">int</option>
        <option value="float">float</option>
        <option value="str">str</option>
      </select>`;
    datasContainer.appendChild(row);
  });

  function collectDatas() {
    const rows = datasContainer.querySelectorAll(".data-row");
    const obj = {};
    rows.forEach(r => {
      const key = r.querySelector(".data-key").value.trim();
      let val = r.querySelector(".data-value").value.trim();
      const type = r.querySelector(".data-type").value;
      if (!key) return;
      if (type === "int") val = parseInt(val, 10);
      else if (type === "float") val = parseFloat(val);
      else if (type === "undefined") val = undefined;
      // otherwise string
      obj[key] = val;
    });
    return obj;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const eventName = eventNameSelect.value === "custom" ? eventNameCustom.value : eventNameSelect.value;
    const action = actionSelect.value === "custom" ? actionCustom.value : actionSelect.value;
    const datas = collectDatas();
    const client_id = clientIdInput.value || null;
    const to_client_id = toClientIdInput.value || null;

    admin_emit_event(eventName, action, datas, client_id, to_client_id);
    //  alert("Evènement envoyé !");
  });

  
  // fonction qui s’exécute quand on clique sur le bouton
  function sendSize() {
    const val = parseInt(slider.value, 10);
    const datas = { scale: val };
    admin_emit_event("admin_game_settings", "set_player_scale", datas);
    // alert("Vitesse envoyée : " + val);
  }

  presetBtn2.addEventListener("click", sendSize);


  presetBtn.addEventListener("click", () => {
    const datas = collectDatas();
    admin_emit_event("admin_game_settings", "grid_toogle");
    alert("grid toogle !");
  });

  return () => {
    form.removeEventListener("submit", () => {});
    presetBtn.removeEventListener("click", () => {});
  };
}

window.initGame = initGame;
