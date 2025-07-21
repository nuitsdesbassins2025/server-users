const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const fs = require("fs");


const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

let godotClients = [];


let clients = {};

wss.on('connection', (ws) => {
  godotClients.push(ws);
  console.log('Godot client connected');

  ws.on('close', () => {
    godotClients = godotClients.filter(c => c !== ws);
  });
});



wss.on('connection', function connection(ws) {
  console.log('✅ Client WebSocket connecté');

  ws.on('close', function close() {
    console.log('❌ Client déconnecté');
  });
});


function broadcastToGodot(message) {
  const json = JSON.stringify(message);
  godotClients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(json);
    }
  });
}


// ✅ Correction ici : chemin absolu vers le dossier public
app.use(express.static(path.join(__dirname, '..', 'public')));

let clientsData = {};

let ping_count = 0;

io.on("connection", (socket) => {
  console.log("Nouveau client");

  socket.on("update_pseudo", ({ id, pseudo }) => {
    clients[id] = clients[id] || {};
    clients[id].pseudo = pseudo;
    socket.emit("pseudo_updated", { pseudo });
    console.log(`pseudo_updated ${id} : ${pseudo}`);

  });

  socket.on("update_color", ({ id, color }) => {
    clients[id] = clients[id] || {};
    clients[id].color = color;
    console.log(`Couleur reçue de ${id}`);
  });

  socket.on("action_triggered", ({ id }) => {
    console.log("Action demandée par", id);
    // TODO: action spécifique serveur
  });

  socket.on("selfie", ({ id, image }) => {
    console.log(`Image reçue de ${id}`);

    // Créer le dossier si nécessaire
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }

    // Extraire le base64
    const matches = image.match(/^data:image\/jpeg;base64,(.+)$/);
    if (!matches) {
      console.error("Image invalide");
      return;
    }

    const base64Data = matches[1];
    const buffer = Buffer.from(base64Data, "base64");

    // Créer un nom de fichier unique
    const filename = `${id}_${Date.now()}.jpg`;
    const filepath = path.join(uploadDir, filename);

    // Sauvegarde
    fs.writeFile(filepath, buffer, (err) => {
      if (err) {
        console.error("Erreur d'écriture image :", err);
      } else {
        console.log(`Image sauvegardée : ${filepath}`);
      }
    });
  });


  socket.on("continuous_data", (data) => {
    clients[data.id] = { ...clients[data.id], ...data };
    
    // broadcastToGodot({ id, data }); // envoie à Godot

    console.log(data); // debug
  });

  socket.on("get_user_data", ({ id }) => {
    const data = clients[id] || {};
    socket.emit("user_data", {
      pseudo: data.pseudo || null,
      color: data.color || null,
    });
  });

  socket.on('disconnect', () => {
        console.log('Disconnected:', socket.id);
        delete clientsData[socket.id];
    });

      // Exemple de message serveur vers client
  setInterval(() => {
    io.emit("emit_message", {
      target: "all",
      message:`Ping général nr ${ping_count}`,
      notification: true,
    });
    ping_count++;
  }, 50000);

});


app.get('/clients', (req, res) => {
    res.json(clientsData);
});

// Ecoute sur toutes les interfaces réseau :
// Windows : ipconfig => adresse IP locale IPV4
// Linux : ip a ou hostname -I => inet
server.listen(3001, "0.0.0.0", () => {
  console.log("Serveur accessible sur le réseau local");
});