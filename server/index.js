// ─────────────────────────────────────────────────────────────
// 📦 IMPORTS DE MODULES
// ─────────────────────────────────────────────────────────────
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");


// ─────────────────────────────────────────────────────────────
// 🚀 INITIALISATION DES SERVEURS EXPRESS + HTTP + SOCKET.IO
// ─────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ─────────────────────────────────────────────────────────────
// 🌍 MIDDLEWARES EXPRESS
// ─────────────────────────────────────────────────────────────
// Servir les fichiers statiques depuis le dossier /public
app.use(express.static(path.join(__dirname, "../public")));

// Route de base : envoie client.html quand on accède à /
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/client.html"));
});

// Route de test : retourne les données des clients
app.get("/clients", (req, res) => {
  res.json(clients);
});

// Fallback 404 pour les routes non définies
app.use((req, res) => {
  res.status(404).send("Page non trouvée");
});

// ─────────────────────────────────────────────────────────────
// 💬 SOCKET.IO : COMMUNICATION EN TEMPS RÉEL AVEC LES CLIENTS
// ─────────────────────────────────────────────────────────────
let clients = {};
let clientsData = {};
let ping_count = 0;

io.on("connection", (socket) => {
  console.log("🟢 Nouveau client connecté via Socket.IO");

  // Pseudo mis à jour
  socket.on("update_pseudo", ({ id, pseudo }) => {
    clients[id] = clients[id] || {};
    clients[id].pseudo = pseudo;
    socket.emit("pseudo_updated", { pseudo });
    console.log(`✅ Pseudo mis à jour pour ${id} : ${pseudo}`);
  });

  // Couleur mise à jour
  socket.on("update_color", ({ id, color }) => {
    clients[id] = clients[id] || {};
    clients[id].color = color;
    console.log(`🎨 Couleur reçue de ${id}`);
  });

  // Déclenchement d’une action serveur (à personnaliser)
  socket.on("action_triggered", ({ id }) => {
    console.log("⚡ Action demandée par", id);
    // TODO : action serveur personnalisée
  });

  // Réception et sauvegarde d’une image (ex: selfie)
  socket.on("selfie", ({ id, image }) => {
    console.log(`🖼️ Image reçue de ${id}`);

    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }

    const matches = image.match(/^data:image\/jpeg;base64,(.+)$/);
    if (!matches) {
      console.error("❌ Image invalide");
      return;
    }

    const buffer = Buffer.from(matches[1], "base64");
    const filename = `${id}_${Date.now()}.jpg`;
    const filepath = path.join(uploadDir, filename);

    fs.writeFile(filepath, buffer, (err) => {
      if (err) {
        console.error("❌ Erreur d'écriture image :", err);
      } else {
        console.log(`✅ Image sauvegardée : ${filepath}`);
      }
    });
  });

  // Données continues (ex : position, état)
  socket.on("continuous_data", (data) => {
    clients[data.id] = { ...clients[data.id], ...data };
    // console.log("📡 Données reçues_continuous_data_ :", data);
  });

  // Envoi des données utilisateur à un client
  socket.on("get_user_data", ({ id }) => {
    const data = clients[id] || {};
    socket.emit("user_data", {
      pseudo: data.pseudo || null,
      color: data.color || null,
    });
  });

  // Déconnexion
  socket.on("disconnect", () => {
    console.log("🔴 Client Socket.IO déconnecté :", socket.id);
    delete clientsData[socket.id];
  });


  socket.on("send_message", ({ target, message, notification }) => {
    console.log("📡 Données reçues _send_message_ :", { target, message, notification });
    if (target === "all") {
      io.emit("emit_message", {
        target: "all",
        message,
        notification: notification || false,
      });
    } else {
      const recipientSocket = Object.keys(clientsData).find(
        (id) => clientsData[id].pseudo === target
      );
      if (recipientSocket) {
        io.to(recipientSocket).emit("emit_message", {
          target: recipientSocket,
          message,
          notification: notification || false,
        });
      }
    }
  });

  // Exemple de message émis périodiquement à tous les clients
  // setInterval(() => {
  //   io.emit("emit_message", {
  //     target: "all",
  //     message: `Ping général nr ${ping_count}`,
  //     notification: true,
  //   });
  //   ping_count++;
  // }, 50000);

});

// ─────────────────────────────────────────────────────────────
// 🎯 LANCEMENT DU SERVEUR
// ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Serveur Express lancé sur le port ${PORT}`);
});