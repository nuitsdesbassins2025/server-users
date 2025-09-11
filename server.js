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

  

  // Mettre à jour les données d’un utilisateur
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
    
    socket.emit("web_client_updated", updated_datas);

    send_event_to_local_admin("web_client_updated", updated_datas);
  
  })


  function send_event_to_local_admin(event_name, data) {

    const adminSocketId = getSocketIdsById(ADMIN_ID);

    if (adminSocketId.length > 0) {
      for (let i=0; i<adminSocketId.length; i++) {
          // console.log("Envoi de l'action à l'admin socket ID : %s", adminSocketId[i]);
          io.to(adminSocketId[i]).emit(event_name, data);
      }
    } else {
      console.error("❌ Pas d'admin connecté pour relayer l'action");
    }

  }
  
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
  socket.on("client_action_trigger", ({ client_id , player_id, client_datas, action, datas={}}) => {
    console.log("⚡ Action demandée par", client_id, " - action :", action, " datas:", datas);

    const adminSocketId = getSocketIdsById(ADMIN_ID);


    // if (action === "touch_screen") {
    //   console.log(`Le player ${client_id} a touché l'écran en (${datas.x}, ${datas.y})`);
    //   io.emit("clients_touch", { emiter:client_id, client_datas, x: datas.x, y: datas.y, color_code: clients[client_id]?.color || "#ff4081" });
      
    //   message = `Le player a touché : ${JSON.stringify(datas)}`;
    // }

    if (adminSocketId.length > 0) {

      for (let i=0; i<adminSocketId.length; i++) {
          console.log("Envoi de l'action à l'admin socket ID : %s", adminSocketId[i]);
          io.to(adminSocketId[i]).emit("client_action_trigger", { client_id, client_datas, action, datas });
          // io.to(adminSocketId[i]).emit("action_triggered_by", { client_id: client_id });
      }

     // io.to(adminSocketId).emit("client_action_trigger", { client_id, action, datas });
      //io.to(adminSocketId).emit("action_triggered_by", { client_id: client_id });
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
