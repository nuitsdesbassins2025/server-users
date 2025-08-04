let rnboDevice = null;
let audioContext = null;

async function loadRNBO() {
    if (typeof RNBO === "undefined") {
        console.error("❌ RNBO non disponible !");
        return;
    }

    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const response = await fetch("/export/NuitsBassins_dodgeweb.export.json");
    const patch = await response.json();

    rnboDevice = await RNBO.createDevice({ context: audioContext, patch });
    rnboDevice.node.connect(audioContext.destination);

    console.log("🎛️ RNBO prêt !");
}

function clamp(val, min, max) {
    return Math.max(min, Math.min(val, max));
}

function triggerEvent(type, x) {
    if (!rnboDevice) {
        console.warn("RNBO non initialisé");
        return;
    }

    if (!["mur", "joueur", "bouclier"].includes(type)) {
        console.warn("Type non reconnu :", type);
        return;
    }

    const now = RNBO.TimeNow;
    const pan = clamp(x, 0, 1) * 2 - 1;

    rnboDevice.scheduleEvent(new RNBO.MessageEvent(now, `pan_${type}`, [pan]));
    rnboDevice.scheduleEvent(new RNBO.MessageEvent(now, type, [1]));
}

document.getElementById("btnAction").addEventListener("click", async () => {
    if (!audioContext || audioContext.state === "suspended") {
        await audioContext?.resume();
    }

    if (!rnboDevice) {
        await loadRNBO();
    }

    triggerEvent("bouclier", 0.5);
    console.log("🛡️ Bouclier local déclenché");
});

/*
// Socket.IO désactivé pour l’instant
const socket = io("http://localhost:5000");

socket.on("connect", () => {
    console.log("🧠 Socket connecté");
});

["mur", "joueur", "bouclier"].forEach(type => {
    socket.on(type, data => {
        const x = parseFloat(data?.x ?? 0.5);
        triggerEvent(type, x);
    });
});
*/
