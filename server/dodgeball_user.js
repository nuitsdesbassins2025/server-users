import { io } from "https://cdn.socket.io/4.7.4/socket.io.esm.min.js";
import { createDevice, MessageEvent, TimeNow } from "./lib/rnbo.min.js";

let rnboDevice = null;
let audioContext = null;

async function initRNBO() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const response = await fetch("/export_dodgeballweb/NuitsBassins_dodgeweb.export.json");
    const patchExport = await response.json();

    rnboDevice = await createDevice({ context: audioContext, patchExport });
    rnboDevice.node.connect(audioContext.destination);

    console.log("✅ RNBO prêt (web)");
}

function clamp(val, min, max) {
    return Math.max(min, Math.min(val, max));
}

document.getElementById("btnAction").addEventListener("click", () => {
    const x = 0.5; // ou un autre x ∈ [0, 1], ou random
    triggerEvent("bouclier", x);
    console.log("🛡️ Bouclier déclenché localement");
});

function triggerEvent(type, x) {
    if (!["mur", "joueur", "bouclier"].includes(type)) {
        console.warn("⚠️ Événement inconnu :", type);
        return;
    }

    const now = TimeNow;
    const pan = (clamp(x, 0, 1) * 2) - 1;

    rnboDevice.scheduleEvent(new MessageEvent(now, `pan_${type}`, [pan]));
    rnboDevice.scheduleEvent(new MessageEvent(now, type, [1]));
}

// Connexion Socket.IO
const socket = io("http://localhost:5000"); // ou URL distante si nécessaire

socket.on("connect", () => {
    console.log("🔌 Connecté au serveur Python (web)");
});

["mur", "joueur", "bouclier"].forEach(type => {
    socket.on(type, (data) => {
        const x = parseFloat(data?.x ?? 0.5);
        triggerEvent(type, x);
    });
});

initRNBO();
