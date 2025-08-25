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

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/admin.html"));
});

app.get("/draw", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/dessin2.html"));
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
  socket.on("client_request_datas", ({ client_id }) => {
    console.log(`📥 Demande de données pour ${client_id} (socket ${socket.id})`);

    const data = clients[client_id] || {};

    clientsData[socket.id] = { client_id }; // Stocke l'association socket.id <-> id utilisateur
    let dataToSend = {} ;
    
    for (const [key, value] of Object.entries(data)) {
      dataToSend[key] = value;
      console.log(`✅ Donnée stockée pour ${client_id} : ${key} = ${value}`);
    }
    console.log("toto");
    console.log(clientsData);
    socket.emit("web_get_client_infos",dataToSend);
  });






  socket.on("client_update_datas", ({  datas, client_id }) => {
    
    // vérification de l'existence du client
    if (!clients[client_id]) {
      clients[client_id] = clients[client_id] || {};
    }

    if (!datas || typeof datas !== "object") {
      console.warn(`⚠️ Datas invalides pour ${client_id}`);
      return;
    }

    console.log(`🔄 Mise à jour des données pour ${client_id} :`, datas);

    // Mise à jour des données du client
    // clients[client_id] = clients[client_id] || {}; // Assure que l'objet client existe ou en initialise un vide
    
    let updated_datas = {};

    // Mise à jour des données du client
    for (const [key, value] of Object.entries(datas)) {
      clients[client_id][key] = value;
      updated_datas[key] = value;
      console.log(`${key} mis à jour pour ${client_id} : ${value}`);
    }

    socket.emit("web_client_updated", {client_id, updated_datas });

  })


function getSocketIdById(targetId) {
    console.log("Recherche de l'ID de socket pour l'ID client :", targetId);
    for (const [socketId, clientData] of Object.entries(clientsData)) {
        if (clientData["client_id"] === targetId) {
            console.log("Socket trouvé :", socketId);
            return socketId;
        }
    }
    console.log("Aucun socket trouvé pour l'ID client :", targetId);
    console.log("Contenu de clientsData :", clientsData);
    return null;
}

  // ⚡ Action personnalisée
  socket.on("client_action_trigger", ({ client_id , action, datas={}}) => {
    console.log("⚡ Action demandée par", client_id, " - action :", action, " datas:", datas);

    const adminSocketId = getSocketIdById("id-admin1234");


    if (action === "touch_screen") {
      console.log(`Le player ${client_id} a touché l'écran en (${datas.x}, ${datas.y})`);
      io.emit("clients_touch", { emiter:client_id, x: datas.x, y: datas.y, color_code: clients[client_id]?.color || "#ff4081" });
      
      message = `Le player a touché : ${JSON.stringify(datas)}`;
    }



    if (adminSocketId) {

      io.to(adminSocketId).emit("client_action_trigger", { client_id, action, datas });

      io.to(adminSocketId).emit("action_triggered_by", { client_id: client_id });
    } else {
      console.log("❌ Pas d'admin connecté pour relayer l'action");
      console.log(clientsData);
      socket.emit("emit_message", {
        target: "all",
        message: "pas d'admin connecté",
        notification: false,
      });
    };
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
      io.emit("vibration", 200);
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
        io.to(recipientSocketId).emit("vibration", 200);
      } else {
        console.log(`❌ Aucun client connecté avec l'id : ${target}`);
      }
    }
  });



  // 📡 Données continues
  socket.on("client_action", (data) => {

    message = `Le player a touché : ${JSON.stringify(data)}`;

    console.log(message);

  });




  // 📡 Données continues
  socket.on("ball_bounce", (data) => {

    message = `La balle a rebondi datas : ${JSON.stringify(data)}`;

    io.emit("emit_message", {
        target: "all",
        message,
        notification: false,
      });
      io.emit("vibration", 200); // Vibration de 200ms
  });






// ─────────────────────────────────────────────────────────────
// 🏆 ADMIN
// ─────────────────────────────────────────────────────────────

  function get_admin_id() {
      for (const socketId in clientsData) {
          if (clientsData[socketId].client_id === "id-admin1234") {
              return socketId;
          }
      }
      console.log(clientsData);
      return null;
  }


  // ⚡ Action personnalisée
  socket.on("admin_game_setting", ({ action, value }) => {
    console.log("⚡ Setting ", action," demandée pour", value);

    const adminSocketId = get_admin_id();
    console.log("Admin socket ID : %s", adminSocketId);

    if (adminSocketId) {
      io.to(adminSocketId).emit("admin_game_setting", { action, value });

    } else {
      console.log("❌ Pas d'admin connecté pour changer la scène");
    
    };
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
