const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);


const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

let godotClients = [];

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

io.on('connection', (socket) => {
    console.log('New connection:', socket.id);

    socket.on('register', (type) => {
        socket.clientType = type;
        console.log(`Socket ${socket.id} registered as ${type}`);
    });

    socket.on('client_update', (data) => {

        const id = socket.id;
        
        broadcastToGodot({ id, data }); // envoie à Godot

        
        
        clientsData[socket.id] = { ...data, timestamp: Date.now() };

        io.sockets.sockets.forEach((s) => {
            if (s !== socket && s.clientType === 'server_local') {
                if (data.x == undefined && data.y == undefined) {
                    console.log('client_action', socket.id, 'action1 detected');
                    console.log(data);
                }

                s.emit('client_data', { id: socket.id, data });
                

            }
        });
    });

    socket.on('disconnect', () => {
        console.log('Disconnected:', socket.id);
        delete clientsData[socket.id];
    });
});

app.get('/clients', (req, res) => {
    res.json(clientsData);
});

server.listen(3001, () => {
    console.log('Server running at http://localhost:3001');
});
