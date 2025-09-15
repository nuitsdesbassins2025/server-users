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
  tracking_code:"",
  tracking_status : "missing",  // missing, lost, error, valid
  ever_tracked: false
};

// let trackingStatus = "missing"; // missing, lost, error, valid
 let trackingCode = "";


// ─────────────────────────────────────────────────────────────
// 🗂️ INITIALISATION DU CLIENT
// ─────────────────────────────────────────────────────────────

function initialisationClient() {
// Envoi de la demande de données utilisateur au serveur
// ça permet de récupérer les données stockées pour l'utilisateur
// ou alors de créer un nouvel utilisateur si il n'existe pas


  socket.emit("client_request_datas", {client_id:client_id});


}

initialisationClient();

showNotification({
  title: "Pseudo manquant",
  message: "Enregistrez-vous pour débuter le jeu",
  actionText: "Aller aux réglages",
  actionCallback: () => loadGame("reglages")
  // pas de duration → reste affiché
});


// Mise à jour des données du client
// Si l'utilisateur a déjà des données stockées, on les récupère
// Appel les fonctions pour la mise à jour de l'interface si certaines données sont présentes
socket.on("web_client_updated", ( updated_datas ) => {

  updateTrackingUI();



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
        // trackingStatus = "valid"; // tu peux aussi attendre un retour serveur avant de valider
        // updateTrackingUI();

    }
    if (key === "tracking_status") {
        set_tracking_status(value);

    }

    if (key === "tracking_code") {
        client_datas.tracking_code = value;
        set_player_id(value);
        updateInputs();}

  }
      if (!client_datas.pseudo) {
      showNotification({
        title: "Pseudo manquant",
        message: "Enregistrez-vous pour débuter le jeu",
        actionText: "Aller aux réglages",
        actionCallback: () => loadGame("reglages")
        // pas de duration → reste affiché
      });

  }
  return;
});



function set_tracking_status(status) {
    console.log("Setting tracking status to", status);
    client_datas.tracking_status = status;
    if (status === "valid") {
        client_datas.ever_tracked = true;
    }
    updateTrackingUI();
  }

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
//   document.getElementById("banner").style.backgroundColor = color;
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


  // lance page d’accueil
  document.getElementById("main").innerHTML =
    "<div class='loading-msg'>Veuillez patienter, lancement du jeu…</div>";

  document.getElementById("main").innerHTML = "<h2>Accueil</h2><button id='btnClic'>Jeu clic</button> <button id='btnDraw'>Jeu dessin</button> <button id='btnMove'>debug Move</button>";
  document.getElementById("btnClic").addEventListener("click", () => loadGame("clic"));
  document.getElementById("btnDraw").addEventListener("click", () => loadGame("dessin"));
  document.getElementById("btnMove").addEventListener("click", () => loadGame("move"));

});


function updateMainHeight() {
  const notifBar = document.getElementById("notification-bar");
  const trackingBar = document.getElementById("tracking-bar");

  const notifHeight = notifBar.classList.contains("show") ? notifBar.offsetHeight : 0;
  const trackingHeight = trackingBar.classList.contains("show") ? trackingBar.offsetHeight : 0;

  // Définit les variables CSS sur :root (ou sur body)
  document.documentElement.style.setProperty("--notif-height", notifHeight + "px");
  document.documentElement.style.setProperty("--tracking-height", trackingHeight + "px");
  console.log("Updated main height:", notifHeight, trackingHeight);
}




document.getElementById("settingsBtn").addEventListener("click", () => {
  loadGame("reglages");
});
document.getElementById("adminBtn").addEventListener("click", () => {
  loadGame("admin");
});

// lance page d’accueil
document.getElementById("homeBtn").click();


document.getElementById("tracking-reset").addEventListener("click", () => {
  reset_tracking();
});

function reset_tracking() {
  console.log("Reset tracking");
  client_datas.tracking_code = "";
  client_datas.tracking_status = "missing";
  client_update_datas( { tracking_code : "", tracking_status: "missing" });
  trackingCode = "";

  updateTrackingUI();
}




export function showNotification({
  message,
  title = null,
  actionText = null,
  actionCallback = null,
  duration = null
}) {
  const bar = document.getElementById("notification-bar");

  let html = `<button class="notif-close">&times;</button>`;
  if (title) html += `<div class="notif-title">${title}</div>`;
  html += `<div class="notif-message">${message}</div>`;
  if (actionText && actionCallback) {
    html += `<div class="notif-actions"><button class="notif-btn">${actionText}</button></div>`;
  }

  bar.innerHTML = html;

  // mesure de la hauteur
  bar.classList.add("show"); // déclenche l'animation
  const height = bar.offsetHeight;

  // applique le nouveau top directement → transition
  document.querySelectorAll('.corner-btn').forEach(btn => {
    btn.style.top = (height + 10) + 'px';
  });

  // bouton fermer
  bar.querySelector(".notif-close").addEventListener("click", () => {
    hideNotification();
  });

  if (actionText && actionCallback) {
    bar.querySelector(".notif-btn").addEventListener("click", () => {
      actionCallback();
    });
  }

  if (duration !== null) {
    setTimeout(() => hideNotification(), duration);
  }

  updateMainHeight();
}

export function hideNotification() {
  const bar = document.getElementById("notification-bar");
  bar.classList.remove("show");

  // remet les boutons à la position d’origine → transition
  document.querySelectorAll('.corner-btn').forEach(btn => {
    btn.style.top = '10px';
  });
  updateMainHeight();
}

export function updateTrackingUI() {
  const dot = document.querySelector('.tracking-dot');
  const text = document.querySelector('.tracking-text');
  const resetBtn = document.getElementById("tracking-reset");

  const trackingTitle = document.getElementById("tracking-title");
  const trackingCodeDiv = document.getElementById("tracking-code");
  const trackingBar = document.getElementById("tracking-bar");

  switch(client_datas.tracking_status) {
    case "missing":
      trackingBar.classList.add("show");
      if (trackingTitle) trackingTitle.textContent = "Déplacez-vous sur la zone de jeu et entrez le code devant vous";
      dot.style.backgroundColor = "red";
      text.textContent = "Tracking manquant";
      toggleElement(resetBtn, false);           // bouton reset masqué
      toggleElement(trackingCodeDiv, true);     // code visible
      break;

    case "lost":
      trackingBar.classList.add("show");
      if (trackingTitle) trackingTitle.textContent = "Tracking perdu, rallentissez ou réinitialisez le suivit";
      dot.style.backgroundColor = "orange";
      text.textContent = "Tracking perdu";
      toggleElement(resetBtn, true);            // bouton reset visible
      toggleElement(trackingCodeDiv, false);    // code masqué
      break;

    case "error":
      trackingBar.classList.add("show");
      if (trackingTitle) trackingTitle.textContent = "Numéro invalide, réessayez";
      dot.style.backgroundColor = "red";
      text.textContent = "Erreur tracking";
      toggleElement(resetBtn, false);           // bouton reset masqué
      toggleElement(trackingCodeDiv, true);     // code visible
      break;

    case "valid":
      trackingBar.classList.remove("show");
      if (trackingTitle) trackingTitle.textContent = "Tracking actif";
      dot.style.backgroundColor = "green";
      text.textContent = "Tracking actif";
      toggleElement(resetBtn, true);            // bouton reset visible
      toggleElement(trackingCodeDiv, false);    // code masqué
      break;

    default:
      trackingBar.classList.add("show");
      if (trackingTitle) trackingTitle.textContent = "Déplacez-vous sur la zone de jeu et entrez le code devant vous";
      dot.style.backgroundColor = "red";
      text.textContent = "Tracking manquant";
      toggleElement(resetBtn, false);           // bouton reset masqué
      toggleElement(trackingCodeDiv, true);     // code visible
      
  }

  updateTrackingStatusPosition();
  updateMainHeight();
}


function updateTrackingStatusPosition() {
  const bar = document.getElementById("tracking-bar");
  const status = document.getElementById("tracking-status");
  const height = bar.classList.contains("show") ? bar.offsetHeight : 0;
  status.style.bottom = (10 + height) + "px";
}


document.getElementById("tracking-status").addEventListener("click", () => {
  const bar = document.getElementById("tracking-bar");
  bar.classList.toggle("show");
  updateTrackingStatusPosition();

});


const keypad = document.getElementById("tracking-keypad");
for (let i = 0; i < 10; i++) {
  const btn = document.createElement("button");
  btn.textContent = i;
  btn.addEventListener("click", () => {
    if (trackingCode.length < 4) {
      trackingCode += i;
      updateInputs();
      if (trackingCode.length === 4) {
        // envoyer event
        console.log("Envoi du code de tracking :", trackingCode);
        client_update_datas( { tracking_code : trackingCode });
        // replie le bandeau
        document.getElementById("tracking-bar").classList.remove("show");

        trackingCode = "";
        updateInputs();
      }
    }
  });
  keypad.appendChild(btn);
}

function updateInputs() {
  const inputs = document.querySelectorAll('#tracking-code input');
  inputs.forEach((input, index) => {
    input.value = trackingCode[index] || "";
  });
}


function toggleElement(el, show) {
  // tu peux passer directement l’élément ou son sélecteur CSS
  const elem = (typeof el === "string") ? document.querySelector(el) : el;
  if (!elem) return;

  if (show) {
    elem.classList.remove("hidden");
  } else {
    elem.classList.add("hidden");
  }
}


export function toggleCode(show) {
  const trackingCodeDiv = document.getElementById("tracking-code");
  toggleElement(trackingCodeDiv, show);
}