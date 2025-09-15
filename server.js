// ─────────────────────────────────────────────────────────────
// 📦 IMPORTS DE MODULES
// ─────────────────────────────────────────────────────────────
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");

const ADMIN_ID = "id-admin1234"; // ID fixe pour l'admin

// ─────────────────────────────────────────────────────────────
// 🚀 INITIALISATION DES SERVEURS EXPRESS + HTTP + SOCKET.IO
// ─────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);
const io = new Server(server);


// ─────────────────────────────────────────────────────────────
// 🗂️ DONNÉES EN MÉMOIRE
// ─────────────────────────────────────────────────────────────
let clients = {};         // { id: { pseudo, color, ... } }
let clientsData = {};     // { socket.id: { id } }




app.use(express.static("public"));



io.on("connection", (socket) => {
  
  console.log("Client connecté");

  
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
    console.log(dataToSend);
    socket.emit("web_client_updated",dataToSend);
  });

  
// Écoute de la mise à jour des données d’un utilisateur
socket.on("client_update_datas", ({ datas, client_id }) => {

    // Validation basique
    if (!datas || typeof datas !== "object") {
        console.warn(`⚠️ Datas invalides pour ${client_id}`);
        return;
    }

    console.log(`🔄 Mise à jour des données pour ${client_id} :`, datas);
    // On délègue la mise à jour et la notification
    update_server_clients_list(client_id, datas);
});



// ---- Fonction centralisée ----
function update_server_clients_list(client_id, datas, notify_admin = true) {
  // Vérifier existence
  if (!clients[client_id]) {
    clients[client_id] = {};
  }

  let updated_datas = {};

  // Mettre à jour l'objet client
  for (const [key, value] of Object.entries(datas)) {
    clients[client_id][key] = value;
    updated_datas[key] = value;
    console.log(`${key} mis à jour pour ${client_id} : ${value}`);
  }

  // Diffuser la mise à jour aux sockets liés à ce client
  const targetSocketIds = getSocketIdsById(client_id);

  if (targetSocketIds.length > 0) {
    for (let i = 0; i < targetSocketIds.length; i++) {
      io.to(targetSocketIds[i]).emit("web_client_updated", updated_datas);
    }
  } else {
    console.error("❌ Pas de client connecté pour relayer l'info");
  }


  if (notify_admin) {
    // Notifier l'admin de la mise à jour
    let transfer_datas = { client_id, datas: updated_datas };
    send_event_to_local_admin("web_client_updated", transfer_datas);
  }
}




  socket.on("admin_game_settings", (event_datas) => {
    console.log("Admin game settings reçu :", event_datas);
    send_event_to_local_admin("admin_game_settings", event_datas);
  });


  function send_event_to_local_admin(event_name, event_datas) {
    const adminSocketId = getSocketIdsById(ADMIN_ID);
    if (adminSocketId.length > 0) {
      for (let i=0; i<adminSocketId.length; i++) {
        io.to(adminSocketId[i]).emit(event_name, event_datas);
      }
    } else {
      console.error("❌ Pas d'admin connecté pour relayer l'action");
    }
  }
  

  socket.on("godot_info_transfer", (datas) => {
    console.log("Godot info transfer reçu :", datas);
    if (datas.event_type === "set_tracking"){
      // On met à jour les datas du client sans relayer à l'admin (évite les boucles)
      update_server_clients_list(datas.client_id, datas.event_datas, false)
    }
  });



  function getSocketIdsById(targetId) {
      console.log("Recherche de l'ID de socket pour l'ID client :", targetId);

      targetSocketIds = [];

      for (const [socketId, clientData] of Object.entries(clientsData)) {
          if (clientData["client_id"] === targetId) {
              console.log("Socket trouvé :", socketId);
              targetSocketIds.push(socketId);
              //return socketId;
          }
      }
      //console.log("Aucun socket trouvé pour l'ID client :", targetId);
      //console.log("Contenu de clientsData :", clientsData);
      return targetSocketIds;
  }

  // ⚡ Action personnalisée
  socket.on("client_action_trigger", (event_datas) => {
    
    console.log("⚡ Action demandée par", event_datas.client_id, " - action :", event_datas.action, " datas:", event_datas.datas);
    send_event_to_local_admin("client_action_trigger", event_datas);

  });




  socket.on("action", (data) => {
    console.log("Action reçue:", data);
    // tu peux broadcast si besoin
    // io.emit("actionBroadcast", data);
  });
});



// ─────────────────────────────────────────────────────────────
// 🎯 LANCEMENT DU SERVEUR
// ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Serveur Express lancé sur le port ${PORT}`);
});


// server.listen(3000, () => console.log("Serveur sur http://localhost:3000"));
