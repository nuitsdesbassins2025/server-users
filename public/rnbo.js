import { io } from "/socket.io/socket.io.esm.min.js";

let device, context;

async function initRNBO() {

    const patchExportURL = "export/NuitsBassins_dodgeweb.export.json";

    // Create Audio Context
    const WAContext = window.AudioContext || window.webkitAudioContext;
    context = new WAContext();

    // Create gain node and connect it to audio output
    const outputNode = context.createGain();
    outputNode.connect(context.destination);

    // Fetch the exported patcher
    let response, patcher;
    try {
        response = await fetch(patchExportURL);
        patcher = await response.json();

        if (!window.RNBO) {
            // Load RNBO script dynamically
            // Note that you can skip this by knowing the RNBO version of your patch
            // beforehand and just include it using a <script> tag
            await loadRNBOScript(patcher.desc.meta.rnboversion);
        }
    } catch (err) {
        const errorContext = {
            error: err,
        };
        if (response && (response.status >= 300 || response.status < 200)) {
            (errorContext.header = `Couldn't load patcher export bundle`),
                (errorContext.description =
                    `Check app.js to see what file it's trying to load. Currently it's` +
                    ` trying to load "${patchExportURL}". If that doesn't` +
                    ` match the name of the file you exported from RNBO, modify` +
                    ` patchExportURL in app.js.`);
        }
        if (typeof guardrails === "function") {
            guardrails(errorContext);
        } else {
            throw err;
        }
        return;
    }

    // Fetch the dependencies
    let dependencies = [];
    try {
        const dependenciesResponse = await fetch("export/dependencies.json");
        dependencies = await dependenciesResponse.json();

        // Prepend "export" to any file dependenciies
        dependencies = dependencies.map(d => d.file ? Object.assign({}, d, { file: "export/" + d.file }) : d);
    } catch (e) { }

    // Create the device
    let device;
    try {
        device = await RNBO.createDevice({ context, patcher });
    } catch (err) {
        if (typeof guardrails === "function") {
            guardrails({ error: err });
        } else {
            throw err;
        }
        return;
    }


    // Load the samples
    const results = await device.loadDataBufferDependencies(dependencies);
    results.forEach(result => {
        if (result.type === "success") {
            console.log(`Successfully loaded buffer with id ${result.id}`);
        } else {
            console.log(`Failed to load buffer with id ${result.id}, ${result.error}`);
        }
    });

    device.node.connect(outputNode);
    //    attachOutports(rnboDevice);

    // 4) (Optionnel) charger les buffers référencés
    try {
        const depsRes = await fetch("/export/dependencies.json");
        let deps = await depsRes.json();
        // préfixer les chemins si nécessaire
        deps = deps.map(d => d.file ? { ...d, file: "/export/" + d.file } : d);

        const results = await device.loadDataBufferDependencies(deps);
        results.forEach(r =>
            console.log((r.type === "success")
                ? `✅ Buffer chargé: ${r.id}`
                : `❌ Échec buffer: ${r.id} → ${r.error}`
            )
        );
    } catch (_) {
        // pas de dependencies.json, ce n’est pas bloquant
    }

    document.body.onclick = () => {
        if (context.state === "running") return;
        context.resume();
        console.log("Audio context resumed");
    };

    // Receive Outport Message for Inport Feedback
    device.messageEvent.subscribe((ev) => {
        console.log(`Receive message ${ev.tag}: ${ev.payload}`);
    });
}

function loadRNBOScript(version) {
    return new Promise((resolve, reject) => {
        if (/^\d+\.\d+\.\d+-dev$/.test(version)) {
            throw new Error("Version RNBO exportée en mode debug !");
        }

        const el = document.createElement("script");
        el.src = `https://c74-public.nyc3.digitaloceanspaces.com/rnbo/${encodeURIComponent(version)}/rnbo.min.js`;
        el.onload = resolve;
        el.onerror = err => reject(new Error("Erreur de chargement RNBO : " + version));
        document.body.append(el);
    });
}

// Au chargement
initRNBO();


// ---------------------
// Socket.io
// ---------------------

const socket = io("http://localhost:5000", { transports: ["websocket"] }); // 🔌

socket.on("connect", () => {
    console.log("✅ Connecté au serveur socket.io");
});

socket.on("web_client_updated", (updated_datas) => {
    if (!device) {
        console.warn("⚠️ Device RNBO pas encore prêt");
        return;
    }

    const now = device.context.currentTime; // 👈 audio clock RNBO
    for (const [key, value] of Object.entries(updated_datas)) {
        console.log(`${key} mis à jour : ${value}`);

        switch (key) {
            case "shield_ready":
                device.scheduleEvent(new RNBO.MessageEvent(now, "bouclier", [1]));
                break;

            case "player_bonus":
                device.scheduleEvent(new RNBO.MessageEvent(now, "bonus", [value]));
                break;

            case "player_ball":
                device.scheduleEvent(new RNBO.MessageEvent(now, "ball", [value]));
                break;

            default:
                // aucun traitement particulier
                break;
        }
    }
});
