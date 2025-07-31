// dodgeball.js — côté client (navigateur)

let rnboContext = null;
let rnboDevice = null;
let ws = null;

// Mapping des événements pour la version web (sons locaux)
const webEventMap = {
    bouclier: 0,   // index du son à jouer
    rebond: 1      // index du son à jouer
};

async function initRNBO() {
    rnboContext = new (window.AudioContext || window.webkitAudioContext)();

    const response = await fetch("/export/dodgeball.json"); // ton fichier RNBO exporté
    const patchExport = await response.json();

    rnboDevice = await RNBO.createDevice({ context: rnboContext, patchExport });
    rnboDevice.node.connect(rnboContext.destination);

    console.log("✅ RNBO Web chargé");
}

// Déclenche un son via son index
function triggerWebSound(index = 0) {
    const triggerName = `trigger${(index % 8) + 1}`;
    const now = RNBO.TimeNow;
    rnboDevice.scheduleEvent(new RNBO.MessageEvent(now, triggerName, [1]));
    console.log(`🎧 Web sound triggered: ${triggerName}`);
}

// Gère les clics utilisateur pour les sons web
function setupClickHandler() {
    document.addEventListener("click", (e) => {
        const isShield = e.target.classList.contains("shield");
        const eventType = isShield ? "bouclier" : "rebond"; // à adapter selon ton HTML

        const index = webEventMap[eventType];
        triggerWebSound(index);
    });
}

// Connexion WebSocket pour recevoir des événements distants
function setupWebSocket() {
    ws = new WebSocket("ws://localhost:8080");

    ws.addEventListener("open", () => {
        console.log("🌐 WebSocket connecté");
    });

    ws.addEventListener("message", (event) => {
        try {
            const data = JSON.parse(event.data);
            const index = webEventMap[data.event];
            if (index !== undefined) {
                triggerWebSound(index);
            }
        } catch (err) {
            console.warn("⚠️ Erreur WebSocket:", err);
        }
    });

    ws.addEventListener("close", () => {
        console.log("🔌 WebSocket fermé");
    });
}

// Initialisation
window.addEventListener("DOMContentLoaded", async () => {
    await initRNBO();
    setupClickHandler();
    setupWebSocket();
});
