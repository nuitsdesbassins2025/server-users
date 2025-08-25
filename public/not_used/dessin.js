const socket = io();
let client_id = localStorage.getItem("userId") || generateId();
localStorage.setItem("userId", client_id);

function generateId() {
  return "client-" + Math.random().toString(36).substr(2, 9);
}

// Élément d'instruction
const instruction = document.querySelector('.instruction');

// Écouter les événements de toucher/souris
document.body.addEventListener('touchstart', handleInteraction);
document.body.addEventListener('mousedown', handleInteraction);

// Fonction pour gérer les interactions
function handleInteraction(e) {
    // Masquer l'instruction après la première interaction
    instruction.style.opacity = '0';
    
    // Obtenir les coordonnées
    let x, y;
    if (e.type === 'touchstart') {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
    } else {
        x = e.clientX;
        y = e.clientY;
    }
    
    // Créer un effet visuel sous le doigt/souris
    createTouchEffect(x, y);
    
    // Calculer les coordonnées normalisées (0-100)
    const normalizedX = (x / window.innerWidth) * 100;
    const normalizedY = (y / window.innerHeight) * 100;
    
    // Déterminer l'orientation pour le côté long
    const isLandscape = window.innerWidth > window.innerHeight;
    const finalX = isLandscape ? normalizedX : normalizedY;
    const finalY = isLandscape ? normalizedY : normalizedX;
    
    // Émettre le signal (simulé ici, à remplacer par l'appel Node.js réel)
    emitTouchSignal(finalX, finalY);
}

// Créer un effet visuel à la position du toucher
function createTouchEffect(x, y) {
    const effect = document.createElement('div');
    effect.className = 'touch-effect';
    effect.style.left = `${x}px`;
    effect.style.top = `${y}px`;
    document.body.appendChild(effect);
    
    // Supprimer l'effet après l'animation
    setTimeout(() => {
        effect.remove();
    }, 600);
}

// Fonction pour émettre le signal (à adapter avec votre implémentation Node.js)
function emitTouchSignal(x, y) {
    // Simulation d'envoi au serveur Node.js
    console.log(`Émission du signal: client_action(client_id:${getClientId()}, action:"touch_screen", datas:{x:${x}, y:${y}})`);
    
    // Ici, vous devriez implémenter la communication réelle avec Node.js
    // Par exemple, avec Socket.io:
    // socket.emit('client_action', {
    //   client_id: getClientId(),
    //   action: "touch_screen",
    //   datas: {x: x, y: y}
    // });
}

// Fonction pour obtenir l'ID client (à adapter selon vos besoins)
function getClientId() {
    // Essayez de récupérer un ID existant depuis le stockage local
    let clientId = localStorage.getItem('client_id');
    
    // Si aucun ID n'existe, en générer un nouveau
    if (!clientId) {
        clientId = 'client_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('client_id', clientId);
    }
    
    return clientId;
}

// Fonction pour traiter les données reçues du serveur
function processClientsTouch(data) {
    // data devrait être un tableau d'objets: [{x, y, color_code}]
    data.forEach(touch => {
        createClientCircle(touch.x, touch.y, touch.color_code);
    });
}

// Fonction pour traiter la détection de joueurs
function processPlayersDetected(data) {
    // data devrait être un tableau d'objets: [{x, y}]
    data.forEach(player => {
        createPlayerCircle(player.x, player.y);
    });
}

// Créer un cercle pour les clients_touch
function createClientCircle(x, y, colorCode) {
    const circle = document.createElement('div');
    circle.className = 'circle client-circle';
    circle.style.backgroundColor = colorCode || '#ff4081';
    
    // Positionner le cercle en pourcentage
    const isLandscape = window.innerWidth > window.innerHeight;
    circle.style.left = isLandscape ? `${x}%` : `${y}%`;
    circle.style.top = isLandscape ? `${y}%` : `${x}%`;
    
    document.body.appendChild(circle);
    
    // Supprimer le cercle après un certain temps
    setTimeout(() => {
        circle.remove();
    }, 3000);
}

// Créer un cercle pour les players_detected
function createPlayerCircle(x, y) {
    const circle = document.createElement('div');
    circle.className = 'circle player-circle';
    
    // Positionner le cercle en pourcentage
    const isLandscape = window.innerWidth > window.innerHeight;
    circle.style.left = isLandscape ? `${x}%` : `${y}%`;
    circle.style.top = isLandscape ? `${y}%` : `${x}%`;
    
    document.body.appendChild(circle);
    
    // Supprimer le cercle après un certain temps
    setTimeout(() => {
        circle.remove();
    }, 3000);
}

// Simulation de réception d'événements (à remplacer par vos écouteurs réels)
// Pour l'exemple, nous allons simuler la réception d'événements après 5 secondes
setTimeout(() => {
    // Simuler la réception de clients_touch
    const mockClientsData = [
        {x: 30, y: 40, color_code: '#ff4081'},
        {x: 70, y: 60, color_code: '#3f51b5'}
    ];
    processClientsTouch(mockClientsData);
    
    // Simuler la réception de players_detected
    const mockPlayersData = [
        {x: 20, y: 30},
        {x: 80, y: 70}
    ];
    processPlayersDetected(mockPlayersData);
}, 5000);

// Ici, vous devriez implémenter la réception réelle des événements du serveur
// Par exemple, avec Socket.io:
// socket.on('clients_touch', processClientsTouch);
// socket.on('players_detected', processPlayersDetected);

// Gérer le redimensionnement de la fenêtre
window.addEventListener('resize', () => {
    // Réajuster la position des cercles si nécessaire
});