import { action_trigger, showNotification, updateTrackingUI, client_update_datas } from "/app.js";

export function initGame(socket, client_datas) {

  const gameSize = { width: 1280, height: 720 };
  const canvas = document.getElementById("drawing-canvas");
  const ctx = canvas.getContext("2d");

  // ────────────── REDIMENSIONNEMENT DU CANVAS ──────────────

function resizeCanvas() {
  const wrapper = document.getElementById('canvas-wrapper');
  const canvas = document.getElementById('drawing-canvas');

  
  // Espace dispo
  const w = wrapper.clientWidth;
  const h = wrapper.clientHeight;

  // ratio horizontal ou vertical selon l'espace
  let ratioW, ratioH;
  if (w >= h) {
    // paysage : 16/9
    ratioW = 16;
    ratioH = 9;
  } else {
    // portrait : 9/16
    ratioW = 9;
    ratioH = 16;
  }
  const ratio = ratioW / ratioH;


  const wrapperWidth = wrapper.clientWidth;
  const wrapperHeight = wrapper.clientHeight;

    console.log(wrapperHeight)
  // calcule la taille maximale en gardant le ratio
  let margin = 0.95 // marge 5%

  let width = wrapperWidth*margin;
  let height = width / ratio*margin;

  if (height > wrapperHeight) {
    height = wrapperHeight *margin;
    width = height * ratio*margin;
  }

  // taille affichée (CSS)
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';

  // taille interne (pour dessin)
  canvas.width = width;
  canvas.height = height;
}




  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // ────────────── OUTILS ET COULEURS ──────────────
  let currentTool = "pencil";




  // bouton couleur
  const colorBtn = document.getElementById("color-btn");
  const colorPopup = document.getElementById("color-popup");
  const toolBtn = document.getElementById("tool-btn");
  const toolPopup = document.getElementById("tool-popup");

  const shieldBtn = document.getElementById("shield-btn");
 
  shieldBtn.addEventListener("click", handleShield);

  function handleShield() {
    console.log("handleShield");

    if (client_datas.shield_ready) {
      console.log("shield triggered");
      trigger_shied()
      client_update_datas({ shield_ready: false });
    } else {

    }


    action_trigger("touch_screen", {});
  }

  function reinitialize_shield() {
    console.log("shied_ready event received");
    shieldBtn.disabled = false;
  }

  function trigger_shied() {
    let action_datas = {  };
    action_trigger("trigger_shield", action_datas);
    shieldBtn.disabled = true;
  }

    window.addEventListener('shield_ready', reinitialize_shield);



  // bouton outil
  toolBtn.addEventListener("click", () => {
    const open = toolPopup.classList.toggle("open");
    
    // accessibilité
    toolBtn.setAttribute("aria-expanded", open ? "true" : "false");
    
    // ferme le popup couleurs si besoin
    colorPopup.classList.remove("open");
    colorBtn.setAttribute("aria-expanded", "false");
  });

  colorBtn.addEventListener("click", () => {
    // bascule l'état "open"
    const open = colorPopup.classList.toggle("open");

    // accessibilité
    colorBtn.setAttribute("aria-expanded", open ? "true" : "false");

    // ferme le popup outils si besoin
    toolPopup.classList.remove("open");
    toolBtn.setAttribute("aria-expanded", "false");
  });

  // outils dans popup
  document.querySelectorAll("#tool-popup button").forEach(btn => {
    btn.addEventListener("click", () => {
      currentTool = btn.dataset.tool;
      toolBtn.textContent = btn.textContent.split(" ")[0];
      toolPopup.classList.remove("open");
      toolBtn.setAttribute("aria-expanded", "false");
    });
  });

const colors = [
  "#FFFFFF","#FF0000","#00FF00","#0000FF",
  "#FFFF00","#FF00FF","#00FFFF","#FF8000",
  "#8000FF","#0080FF","#FF0080","#008080"
];


// choisir une couleur aléatoire au chargement
const randomColor = colors[Math.floor(Math.random() * colors.length)];
let currentColor = randomColor; // couleur actuelle

// appliquer tout de suite la couleur au bouton principal
document.getElementById("color-btn").style.backgroundColor = randomColor;


// nettoie d'abord si nécessaire
colorPopup.innerHTML = "";

// crée boutons avec stagger (delay) pour l'animation
colors.forEach((color, idx) => {
  const cbtn = document.createElement("button");
  cbtn.className = "color-choice";
  cbtn.style.backgroundColor = color;
  cbtn.setAttribute("aria-label", `Couleur ${color}`);
  // si couleur claire, on met une petite bordure pour visibilité
  if (isLightColor(color)) cbtn.classList.add("light");

  // stagger: delay croissant pour chaque bouton
  // 40ms * index => subtil, pas trop long
  cbtn.style.transitionDelay = `${idx * 40}ms`;

  cbtn.addEventListener("click", () => set_color(color));

  colorPopup.appendChild(cbtn);
});


function set_color(color) {
  if (colors.includes(color)) {
    currentColor = color;
    document.getElementById("color-btn").style.backgroundColor = color;
    colorPopup.classList.remove("open");
    client_update_datas({ color: color });
    
  }
}

// détermine si une couleur hex est claire (pour bordure)

function isLightColor(hex) {
  // convertit #RRGGBB -> lumière relative
  const c = hex.replace('#','');
  const r = parseInt(c.substring(0,2),16);
  const g = parseInt(c.substring(2,4),16);
  const b = parseInt(c.substring(4,6),16);
  // luminance relative
  const luminance = 0.2126*r + 0.7152*g + 0.0722*b;
  return luminance > 200; // seuil à ajuster
}

  // ────────────── NOTIFICATION TRACKING SI PAS TRACKÉ ──────────────
  if (client_datas.ever_tracked === false) {
/*     showNotification({
      title: "Tracking manquant",
      message: "Vous devez avoir été identifié avant de dessiner",
      actionText: "Ouvrir le suivi",
      actionCallback: () => updateTrackingUI()
    }); */
  }

  // ────────────── DESSIN ──────────────
  let first = true;
  let previousPointx = null;
  let previousPointy = null;

  function drawPoint(xPx, yPx) {
    // trace sur le canvas client
    ctx.fillStyle = currentColor;
    ctx.fillRect(xPx, yPx, 2, 2);

    
    // normalisation
    const longSide = Math.max(canvas.width, canvas.height);
    const shortSide = Math.min(canvas.width, canvas.height);
    const xFromRight = canvas.width - xPx;
    const yFromTop = yPx;
    const yNorm = (xFromRight / shortSide) * 100;
    const xNorm = (yFromTop / longSide) * 100;

    // envoi au serveur
    let action_datas = {
      drawing_tool: currentTool,
      x: xNorm,
      y: yNorm,
      settings: {
        color: currentColor,
        brushSize: 5,
        tool: currentTool
      },
      first
    };

    action_trigger("dessin_touch", action_datas);

    if (!first) {
      drawTemporaryLine(previousPointx, previousPointy, xPx, yPx);

    }

    first = false;
    previousPointx = xPx;
    previousPointy = yPx;

  }

  // convertit les coordonnées touch/mouse en coordonnées internes du canvas
  function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const touches = e.touches || [e];
    const coords = [];
    for (let i = 0; i < touches.length; i++) {
      const x = (touches[i].clientX - rect.left) * scaleX;
      const y = (touches[i].clientY - rect.top) * scaleY;
      coords.push({ x, y });
    }
    return coords;
  }


  let lastCall = 0; // moment du dernier appel
  const fps = 50;
  const interval = 1000 / fps; // 20 fois/seconde = 50 ms

 function handleTouch(e) {
  const now = Date.now();
  if (now - lastCall < interval) return; // trop tôt, on ignore
  lastCall = now;

  e.preventDefault();
  const coords = getCanvasCoords(e);
  coords.forEach(({x, y}) => drawPoint(x, y));
}

function set_first() {
    first = true;
  }

  
function touchEnd(e) {
  e.preventDefault();
  first = true;
  previousPointx = null;
  previousPointy = null;
  action_trigger("touch_end", {});
}

  canvas.addEventListener("touchmove", handleTouch);
  canvas.addEventListener("touchstart", set_first);
  canvas.addEventListener("touchend", touchEnd);

  // petit marqueur temporaire
  function drawTemporaryMark(x, y) {
    const radius = 4;
    ctx.fillStyle = currentColor;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    setTimeout(() => {
      ctx.clearRect(x - radius, y - radius, radius * 2, radius * 2);
    }, 2000);
  }

  // petit trait temporaire
function drawTemporaryLine(x1, y1, x2, y2) {
  const lineWidth = 3; // largeur du trait
  ctx.strokeStyle = currentColor;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  // tracer la ligne
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // zone à effacer ensuite (boîte englobante + marge)
  const minX = Math.min(x1, x2) - lineWidth;
  const minY = Math.min(y1, y2) - lineWidth;
  const maxX = Math.max(x1, x2) + lineWidth;
  const maxY = Math.max(y1, y2) + lineWidth;

  // efface après 2 secondes
  setTimeout(() => {
    ctx.clearRect(minX, minY, maxX - minX, maxY - minY);
  }, 2000);
}



  // ────────────── CLEANUP LORS DU UNLOAD DU JEU ──────────────
  return () => {
    canvas.removeEventListener("touchmove", handleTouch);
    canvas.removeEventListener("touchstart", set_first);
    window.removeEventListener("resize", resizeCanvas);
  };
}
window.initGame = initGame;
