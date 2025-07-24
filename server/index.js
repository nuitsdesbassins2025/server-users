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
app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/client.html"));
});

app.get("/clients", (req, res) => {
  res.json(clients);
});

app.use((req, res) => {
  res.status(404).send("Page non trouvée");
});

// ─────────────────────────────────────────────────────────────
// 🗂️ DONNÉES EN MÉMOIRE
// ─────────────────────────────────────────────────────────────
let clients = {};         // { id: { pseudo, color, ... } }
let clientsData = {};     // { socket.id: { id } }

// ─────────────────────────────────────────────────────────────
// 💬 SOCKET.IO : COMMUNICATION EN TEMPS RÉEL
// ─────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log("🟢 Nouveau client connecté :", socket.id);


  // 📤 Récupérer les données d’un utilisateur
  // Fonction appelée par le client à l'initialisation
  socket.on("get_user_data", ({ id }) => {
    const data = clients[id] || {};

    clientsData[socket.id] = { id }; // Stocke l'association socket.id <-> id utilisateur

    socket.emit("user_data", {
      pseudo: data.pseudo || null,
      color: data.color || null,
    });
  });

  // 🎯 Mise à jour du pseudo
  socket.on("update_pseudo", ({ id, pseudo }) => {
    clients[id] = clients[id] || {};
    clients[id].pseudo = pseudo;

    socket.emit("pseudo_updated", { pseudo });
    console.log(`✅ Pseudo mis à jour pour ${id} : ${pseudo}`);
  });

  // 🎨 Mise à jour de la couleur
  socket.on("update_color", ({ id, color }) => {
    clients[id] = clients[id] || {};
    clients[id].color = color;

    console.log(`🎨 Couleur mise à jour pour ${id} : ${color}`);
  });

  // ⚡ Action personnalisée
  socket.on("action_triggered", ({ id }) => {
    console.log("⚡ Action demandée par", id);
    // Action serveur ici
  });

  // 🖼️ Réception d’une image (base64)
  socket.on("selfie", ({ id, image }) => {
    console.log(`🖼️ Image reçue de ${id}`);
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

    const matches = image.match(/^data:image\/jpeg;base64,(.+)$/);
    if (!matches) return console.error("❌ Image invalide");

    const buffer = Buffer.from(matches[1], "base64");
    const filename = `${id}_${Date.now()}.jpg`;
    const filepath = path.join(uploadDir, filename);

    fs.writeFile(filepath, buffer, (err) => {
      if (err) console.error("❌ Erreur d'écriture image :", err);
      else console.log(`✅ Image sauvegardée : ${filepath}`);
    });
  });

  // 📡 Données continues
  socket.on("continuous_data", (data) => {
    clients[data.id] = { ...clients[data.id], ...data };
  });



  // ✉️ Envoi de message
  socket.on("send_message", ({ target, message, notification }) => {
    console.log("📡 Message reçu :", { target, message, notification });

    if (target === "all") {
      io.emit("emit_message", {
        target: "all",
        message,
        notification: notification || false,
      });
    } else {
      // Recherche du socket.id associé à l’id ciblé
      const recipientSocketId = Object.keys(clientsData).find((sid) => {
        return clientsData[sid].id === target;
      });

      if (recipientSocketId) {
        io.to(recipientSocketId).emit("emit_message", {
          target,
          message,
          notification: notification || false,
        });
      } else {
        console.log(`❌ Aucun client connecté avec l'id : ${target}`);
      }
    }
  });

  
  // ❌ Déconnexion
  socket.on("disconnect", () => {
    const client = clientsData[socket.id];
    if (client) {
      console.log(`🔴 Déconnexion de ${client.id} (socket ${socket.id})`);
    } else {
      console.log(`🔴 Déconnexion anonyme (socket ${socket.id})`);
    }
    delete clientsData[socket.id];
  });
});

// ─────────────────────────────────────────────────────────────
// 🎯 LANCEMENT DU SERVEUR
// ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Serveur Express lancé sur le port ${PORT}`);
});
