let rnboDevice = null;
let audioContext = null;

async function loadRNBO() {
    if (typeof RNBO === "undefined") {
        console.error("❌ RNBO non disponible !");
        return;
    }
    console.log("🔄 Chargement de RNBO...");

    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    console.log("🎧 Contexte audio prêt :", audioContext.state);

    const response = await fetch("/export/NuitsBassins_dodgeweb.export.json");
    const patch = await response.json();

    console.log("📦 Patch RNBO chargé :", patch);

    rnboDevice = await RNBO.createDevice({ context: audioContext, patch });
    
    console.log("🔌 RNBO Device créé :", rnboDevice);
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
    try {
        console.log("Action déclenchée");
        if (!audioContext || audioContext.state === "suspended") {
            console.log("Reprise du contexte audio");
            await audioContext?.resume();
        }
        if (!rnboDevice) {
            console.log("Chargement de RNBO");
            await loadRNBO();
        }
        console.log("Déclenchement de l'événement bouclier");
        triggerEvent("bouclier", 0.5);
        console.log("🛡️ Bouclier local déclenché");
    } catch (error) {
        console.error("Une erreur est survenue :", error);
    }
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
