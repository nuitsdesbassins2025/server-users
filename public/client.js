const socket = io();
let client_id = localStorage.getItem("userId") || generateId();
localStorage.setItem("userId", client_id);

// Stockage des données du client
// Ces données seront envoyées au serveur
// et mises à jour en fonction des interactions de l'utilisateur
// Elles sont initialisées avec des valeurs par défaut
// et seront mises à jour au fur et à mesure des interactions

let client_datas = {
  client_id,
  pseudo: null,
  color: null,
  registred_groups : []
};

let sendContinuously = {
  xy: false,
  gps: false,
  movement: false,
  sound: false,
};

// On initialise une cible cible pour les événements
// qui seront envoyés au serveur
// Cette cible sera modifiée pour chaque événement
// afin de ne pas avoir à la recréer à chaque fois
// Pour le moment c'est pas encore très utile
// mais ça permet de mieux structurer le code
// et de préparer l'envoi d'événements plus complexes
let base_target = {
  "emit_from":"client",
  "emit_id": client_id,
  "event_id": null,
  "target_sources": ["all"],
  "targets": [],
}



// Génération d'un ID unique pour l'événement (pour éviter les collisions, ne sert pas à grand chose ici)
let target = base_target;
target.event_id =generateId();

// Envoi de la demande de données utilisateur au serveur
// ça permet de récupérer les données stockées pour l'utilisateur
// ou alors de créer un nouvel utilisateur si il n'existe pas
socket.emit("client_request_datas", {client_id:client_id});



// Mise à jour des données du client
// Si l'utilisateur a déjà des données stockées, on les récupère
// Appel les fonctions pour la mise à jour de l'interface si certaines données sont présentes
socket.on("web_client_updated", ({ updated_datas }) => {

  for (const [key, value] of Object.entries(updated_datas)) {
    client_datas[key] = value;
    console.log(`${key} mis à jour : ${value}`);

    if (key === "pseudo") {
      document.getElementById("btnPseudo").textContent = value;
    }
    if (key === "color") {
      document.getElementById("colorPicker").value = value;
  }
}
  return;
});



// PSEUDO
// On demande la mise à jour du pseudo du client sur le serveur
document.getElementById("btnPseudo").addEventListener("click", () => {
  const pseudo = prompt("Entrez votre pseudo");
  if (pseudo) {
    update_client_datas("pseudo", pseudo);
  }
});




// COLOR
// On demande la mise à jour de la couleur du client sur le serveur
document.getElementById("colorPicker").addEventListener("input", (e) => {
  const color = e.target.value;
  client_datas.color = color;
  e.target.style.backgroundColor = color;

  update_client_datas("color", color);
});

function returnId() {
  return client_id;
}


// Mise à jour des données du client
// Cette fonction est appelée pour mettre à jour les données du client
function update_client_datas(data_key, data_value) {
  let to_update_datas = {
    client_id: client_id,
    [data_key]: data_value,
  };
  
  let tempTarget = base_target;
  tempTarget.event_id = generateId();

  socket.emit("client_update_datas", {target: tempTarget, datas : to_update_datas, client_id: client_id });
}




// ACTION
document.getElementById("btnAction").addEventListener("click", () => {

  // socket.emit("action_triggered", {client_id});
  // console.log("⚡ Action demandée");


  vibrate(100); // Vibration de 100ms

  trigger_action("press_button");
  
});



function trigger_action(action) {

  console.log(`⚡ Action ${action} déclenchée`);
  socket.emit("client_action_trigger", {client_id, action });
}



// MOUVEMENT
document.getElementById("btnMouvement").addEventListener("click", () => {
  const btn = document.getElementById("btnMouvement");
  if (!window.DeviceMotionEvent) {
    btn.textContent = "Mouvement non supporté";
    return alert("Mouvement non supporté");

  } else {
  sendContinuously.movement = true;
  btn.textContent = "Mouvement supporté";
    }
  

  window.addEventListener("devicemotion", (e) => {
    if (sendContinuously.movement) {
      client_datas.movement = {
        acc: e.acceleration,
        rot: e.rotationRate,
        
        
      };
      btn.textContent = `Mouvement : accX: ${e.acceleration.x.toFixed(2)}, accY: ${e.acceleration.y.toFixed(2)}, accZ: ${e.acceleration.z.toFixed(2)}`;
    }
  });
});

// LOCALISATION
document.getElementById("btnLocalisation").addEventListener("click", () => {
  const btnLocalisation = document.getElementById("btnLocalisation");

  if (!navigator.geolocation)     { 
    alert("GPS non supporté");
    btnLocalisation.textContent = "GPS non supporté";
    } else{
    btnLocalisation.textContent = "GPS supporté";
    }

  navigator.geolocation.watchPosition((position) => {
    if (sendContinuously.gps) {
      client_datas.gps = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      };
      btnLocalisation.textContent = `GPS : lat: ${position.coords.latitude.toFixed(4)}, lon: ${position.coords.longitude.toFixed(4)}`;
    }
  });
  sendContinuously.gps = true;
});



// XY
document.getElementById("btnXY").addEventListener("click", () => {
  
  sendContinuously.xy = !sendContinuously.xy;
  const btn = document.getElementById("btnXY");
  btn.textContent = sendContinuously.xy ? `x : ${client_datas.x.toFixed(2)} | y : ${client_datas.y.toFixed(2)}` : "Démarrer XY";

});

// SELFIE
document.getElementById("btnSelfie").addEventListener("click", async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  const video = document.createElement("video");
  video.srcObject = stream;
  await video.play();

  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 240;
  canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
  stream.getTracks().forEach(track => track.stop());

  const imageData = canvas.toDataURL("image/jpeg", 0.5);
  socket.emit("selfie", {client_id, image: imageData });
});

document.getElementById("btnMicro").addEventListener("click", async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const context = new AudioContext();
  const analyser = context.createAnalyser();
  const micSource = context.createMediaStreamSource(stream);
  micSource.connect(analyser);

  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  sendContinuously.sound = true;

  function getSoundLevel() {
    if (!sendContinuously.sound) return;
    analyser.getByteFrequencyData(dataArray);
    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const level = Math.min(100, Math.round(avg / 2.5));
    client_datas.sound = level;

    // Mise à jour visuelle du bouton
    const btn = document.getElementById("btnMicro");
    btn.style.background = `linear-gradient(to right, #4caf50 ${level}%, #ccc ${level}%)`;
    btn.textContent = `Micro actif (${level})`;

    requestAnimationFrame(getSoundLevel);
  }

  getSoundLevel();
});

// NOTIFICATIONS
document.getElementById("btnNotification").addEventListener("click", async () => {
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    client_datas.notificationsAllowed = true;
  }
});


socket.on("web_get_client_infos", ({ pseudo, color }) => {

  console.log("Données utilisateur reçues :", { pseudo, color });
  if (pseudo) {
    client_datas.pseudo = pseudo;
    document.getElementById("btnPseudo").textContent = pseudo;
  }
  if (color) {
    client_datas.color = color;
    document.getElementById("colorPicker").value = color;
    document.getElementById("colorPicker").style.backgroundColor = color;
  }
});

socket.on("vibration", (duration) => {
  vibrate(duration);
  console.log(`🔔 Vibration de ${duration} ms`);
});

function vibrate(duration) {
    if ("vibrate" in navigator) {
        console.log("🔔 Vibration activée pour", duration, "ms");
        navigator.vibrate(duration);
    } else {
        console.log("❌ L'API Vibration n'est pas supportée.");
    }
}

document.getElementById("btn-vibrate").addEventListener("click", () => {
    vibrate(200);
});

// MESSAGES
socket.on("emit_message", ({ target, message, notification }) => {


  const msgElem = document.createElement("div");
  msgElem.className = "message";
  msgElem.textContent = message;
  document.getElementById("messages").appendChild(msgElem);

  if (notification && client_datas.notificationsAllowed) {
    new Notification("Message reçu", { body: message });
  }
  
});

// ENVOI CONTINU
setInterval(() => {
  if (sendContinuously.xy) {
    client_datas.x = (client_datas.x + Math.random() * 5) % 100;
    client_datas.y = (client_datas.y + Math.random() * 5) % 100;const
    btn = document.getElementById("btnXY");
    
    btn.textContent =  `x : ${client_datas.x.toFixed(2)} | y : ${client_datas.y.toFixed(2)}`
  }
  socket.emit("continuous_data", client_datas);
}, 500);


function generateId() {
  return "client-" + Math.random().toString(36).substr(2, 9);
}
