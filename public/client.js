const socket = io();
let id = localStorage.getItem("userId") || generateId();
localStorage.setItem("userId", id);

let userData = {
  id,
  pseudo: null,
  color: null,
  x: 0,
  y: 0,
  movement: null,
  gps: null,
  sound: 0,
};

let sendContinuously = {
  xy: false,
  gps: false,
  movement: false,
  sound: false,
};

//appel si il n'y a pas de données utilisateur
socket.emit("get_user_data", { id });


// PSEUDO
// On met à jour le pseudo du client sur le serveur
document.getElementById("btnPseudo").addEventListener("click", () => {
  const pseudo = prompt("Entrez votre pseudo");
  if (pseudo) {
    socket.emit("update_pseudo", { id, pseudo });
  }
});
socket.on("pseudo_updated", ({ pseudo }) => {
  userData.pseudo = pseudo;
  document.getElementById("btnPseudo").textContent = pseudo;
});



// COLOR
document.getElementById("colorPicker").addEventListener("input", (e) => {
  const color = e.target.value;
  userData.color = color;
  e.target.style.backgroundColor = color;
  socket.emit("update_color", { id, color });
});

// ACTION
document.getElementById("btnAction").addEventListener("click", () => {
  vibrate(100); // Vibration de 100ms
  socket.emit("action_triggered", { id });
  console.log("⚡ Action demandée");
  
});

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
      userData.movement = {
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
      userData.gps = {
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
  btn.textContent = sendContinuously.xy ? `x : ${userData.x.toFixed(2)} | y : ${userData.y.toFixed(2)}` : "Démarrer XY";

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
  socket.emit("selfie", { id, image: imageData });
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
    userData.sound = level;

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
    userData.notificationsAllowed = true;
  }
});


socket.on("user_data", ({ pseudo, color }) => {
  if (pseudo) {
    userData.pseudo = pseudo;
    document.getElementById("btnPseudo").textContent = pseudo;
  }
  if (color) {
    userData.color = color;
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
  if ([id, "all"].includes(target)) {
    const msgElem = document.createElement("div");
    msgElem.className = "message";
    msgElem.textContent = message;
    document.getElementById("messages").appendChild(msgElem);

    if (notification && userData.notificationsAllowed) {
      new Notification("Message reçu", { body: message });
    }
  }
});

// ENVOI CONTINU
setInterval(() => {
  if (sendContinuously.xy) {
    userData.x = (userData.x + Math.random() * 5) % 100;
    userData.y = (userData.y + Math.random() * 5) % 100;const
    btn = document.getElementById("btnXY");
    
    btn.textContent =  `x : ${userData.x.toFixed(2)} | y : ${userData.y.toFixed(2)}`
  }
  socket.emit("continuous_data", userData);
}, 500);


function generateId() {
  return "id-" + Math.random().toString(36).substr(2, 9);
}
