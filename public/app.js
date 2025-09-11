// import { not } from "three/webgpu";
import { io } from "/socket.io/socket.io.esm.min.js"; // si tu veux ESM, sinon const socket=io()
const socket = io();


let client_id = localStorage.getItem("userId") || generateId();
localStorage.setItem("userId", client_id);

function generateId() {
    return crypto.randomUUID();
}

// Données client
let client_datas = {
  pseudo: null,
  color: null,
  client_id,
  player_id: null,
  score: 0,
};

// ─────────────────────────────────────────────────────────────
// 🗂️ INITIALISATION DU CLIENT
// ─────────────────────────────────────────────────────────────

// Envoi de la demande de données utilisateur au serveur
// ça permet de récupérer les données stockées pour l'utilisateur
// ou alors de créer un nouvel utilisateur si il n'existe pas
socket.emit("client_request_datas", {client_id:client_id});


// Mise à jour des données du client
// Si l'utilisateur a déjà des données stockées, on les récupère
// Appel les fonctions pour la mise à jour de l'interface si certaines données sont présentes
socket.on("web_client_updated", ( updated_datas ) => {

    console.log("Données mises à jour reçues :", updated_datas);
  for (const [key, value] of Object.entries(updated_datas)) {
    client_datas[key] = value;
    console.log(`${key} mis à jour : ${value}`);

    if (key === "pseudo") {
        set_pseudo(value);
    //   document.getElementById("btnPseudo").textContent = value;
    }
    if (key === "color") {
        set_color(value);
    //   document.getElementById("colorPicker").value = value;
    }
    if (key === "player_id") {
        set_player_id(value);
    }
}
  return;
});




// ─────────────────────────────────────────────────────────────
// 🔧 GETTERS & SETTERS
// ─────────────────────────────────────────────────────────────


window.client_datas = client_datas; // accessible lecture seule dans les jeux si besoin

// --- setters
export function set_pseudo(pseudo) {
  client_datas.pseudo = pseudo;
}
export function set_player_id(id) {
  client_datas.player_id = id;
}
export function set_color(color) {
  client_datas.color = color;
  document.getElementById("banner").style.backgroundColor = color;
}
export function set_banner_text(text) {
  document.getElementById("banner-text").textContent = text;
}
export function set_score(score) {
  client_datas.score = score;
}

export function get_score() {
    return client_datas.score || 0;;
}

export function set_admin() {
    client_datas.is_admin = true;
    document.getElementById("adminBtn").style.display = "block";
}




// ─────────────────────────────────────────────────────────────
// 🎮 FONCTIONS POUR LES JEUX
// ─────────────────────────────────────────────────────────────

// Action trigger pour les jeux, emmet un événement au serveur
export function action_trigger(action_type, action_datas) {
  console.log("Action:", action_type, action_datas);
  socket.emit("client_action_trigger", {
    "client_id": client_datas.client_id,
    "player_id": client_datas.player_id,
    "client_datas": client_datas,
    "action": action_type,
    "datas": action_datas });

    console.log(client_datas.player_id)
}

// Permet aux jeux de mettre à jour les données du client
export function client_update_datas(datas) {
  console.log("Update_datas:", datas);
  socket.emit("client_update_datas",{
    "datas":datas,
    "client_id":client_datas.client_id,
    "client_datas":client_datas
});
}

// ─────────────────────────────────────────────────────────────
// 🎮 FONCTIONS POUR LES ADMINS
// ─────────────────────────────────────────────────────────────

// Permet aux jeux de mettre à jour les données du client
export function admin_emit_event(event_name, action="", datas={}, client_id=null, to_client_id=null) {

  if (client_id === null) {
    client_id = client_datas.client_id;
  }

  console.log("Admin event:",event_name, " - action : ", action," - datas :", datas);

  socket.emit(event_name,{
    "datas":datas,
    "action":action,
    "client_id":client_datas.client_id,
    "client_datas":client_datas
});
}

// ─────────────────────────────────────────────────────────────
// 🕹️ GESTION DES JEUX
// ─────────────────────────────────────────────────────────────

// Loader de jeux
let cleanupCurrentGame = null;


export async function loadGame(gameName) {
  // nettoyage
  if (cleanupCurrentGame) {
    cleanupCurrentGame();
    cleanupCurrentGame = null;
  }

  // charge HTML
  const html = await fetch(`/games/${gameName}.html`).then(r => r.text());
  document.getElementById("main").innerHTML = html;

  // charge JS
  const script = document.createElement("script");
  script.src = `/games/${gameName}.js?cacheBust=${Date.now()}`;
  script.type = "module";
  script.onload = () => {
    if (window.initGame) {
      cleanupCurrentGame = window.initGame(socket, client_datas);
    }
  };
  document.body.appendChild(script);
}



// ─────────────────────────────────────────────────────────────
// 🏠 GESTION DE L'INTERFACE
// ─────────────────────────────────────────────────────────────

// Boutons home & settings
document.getElementById("homeBtn").addEventListener("click", () => {
  document.getElementById("main").innerHTML = "<h2>Accueil</h2><button id='btnClic'>Jeu clic</button> <button id='btnDraw'>Jeu dessin</button> <button id='btnMove'>debug Move</button>";
  document.getElementById("btnClic").addEventListener("click", () => loadGame("clic"));
  document.getElementById("btnDraw").addEventListener("click", () => loadGame("dessin"));
  document.getElementById("btnMove").addEventListener("click", () => loadGame("move"));
});
document.getElementById("settingsBtn").addEventListener("click", () => {
  loadGame("reglages");
});
document.getElementById("adminBtn").addEventListener("click", () => {
  loadGame("admin");
});

// lance page d’accueil
document.getElementById("homeBtn").click();
