let rnboDevice = null;
let audioContext = null;

// Initialisation RNBO, appelée à la demande (après interaction)
async function initRNBO() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const response = await fetch("/export/NuitsBassins_dodgeweb.export.json");
    const patchExport = await response.json();

    rnboDevice = await RNBO.createDevice({ context: audioContext, patch: patchExport });
    rnboDevice.node.connect(audioContext.destination);

    console.log("✅ RNBO prêt (web)");
}

function clamp(val, min, max) {
    return Math.max(min, Math.min(val, max));
}

// Fonction pour envoyer un événement sonore à RNBO
function triggerEvent(type, x) {
    if (!rnboDevice) {
        console.warn("⚠️ RNBO non initialisé");
        return;
    }
    if (!["mur", "joueur", "bouclier", "bouclier"].includes(type)) {
        console.warn("⚠️ Événement inconnu :", type);
        return;
    }

    const now = RNBO.TimeNow;
    const pan = (clamp(x, 0, 1) * 2) - 1;

    rnboDevice.scheduleEvent(new RNBO.MessageEvent(now, `pan_${type}`, [pan]));
    rnboDevice.scheduleEvent(new RNBO.MessageEvent(now, type, [1]));
}

document.getElementById("btnAction").addEventListener("click", async () => {
    if (!audioContext || audioContext.state === "suspended") {
        await audioContext?.resume();
    }
    if (!rnboDevice) {
        await initRNBO();
    }
    const x = 0.5; // position par défaut (ou random)
    triggerEvent("bouclier", x);
    console.log("🛡️ Bouclier déclenché localement");
});

/*
// Connexion Socket.IO - désactivée pour l'instant
const socket = io("http://localhost:5000");

socket.on("connect", () => {
    console.log("🔌 Connecté au serveur Python (web)");
});

["mur", "joueur", "bouclier"].forEach(type => {
    socket.on(type, (data) => {
        const x = parseFloat(data?.x ?? 0.5);
        triggerEvent(type, x);
    });
});
*/

// N'initialise plus RNBO automatiquement au chargement pour éviter le blocage audio
// initRNBO();
