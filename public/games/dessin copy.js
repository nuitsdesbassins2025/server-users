import { action_trigger, showNotification, updateTrackingUI } from "/app.js";

export function initGame(socket, client_datas) {
  const canvas = document.getElementById("drawCanvas");
  const ctx = canvas.getContext("2d");
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;

  let settings = {
    color: '27F5D3', // Couleur par défaut
    brushSize: 5, // Taille du pinceau par défaut
    tool: 'brush' // Outil par défaut
  }

  if (client_datas.ever_tracked === false) {
      showNotification({
        title: "Tracking manquant",
        message: "Vous devez avoir été identifié avant de dessiner",
        actionText: "Ouvrir le suivi",
        actionCallback: () => updateTrackingUI()
          // pas de duration → reste affiché
      });
      

  }

  function resizeCanvas() {
    // récupère la taille visible du conteneur
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
  }

  // appel au départ + on écoute les resize
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  let first = true;

  function drawPoint(xPx, yPx) {
    ctx.fillStyle = "white";
    ctx.fillRect(xPx, yPx, 2, 2);

    
    const longSide = Math.max(canvas.width, canvas.height);
    const shortSide = Math.min(canvas.width, canvas.height);

    // origine haut droit
    const xFromRight = canvas.width - xPx;
    const yFromTop = yPx;

    const yNorm = (xFromRight / shortSide) * 100;
    const xNorm = (yFromTop / longSide) * 100;


    let action_datas = {
      drawing_tool: "point",
      x: xNorm,
      y: yNorm,
      settings,
      first
  };

    action_trigger("dessin_touch", action_datas );

    first = false;
  }

  function handleTouch(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touches = e.touches;
    for (let i = 0; i < touches.length; i++) {
      const x = touches[i].clientX - rect.left;
      const y = touches[i].clientY - rect.top;
      drawPoint(x, y);
    }
  }

  function set_first() {
    first = true;
  }


  canvas.addEventListener("touchmove", handleTouch);
  canvas.addEventListener("touchstart", set_first);

  return () => {
    canvas.removeEventListener("touchmove", handleTouch);
    canvas.removeEventListener("touchstart", set_first);
    window.removeEventListener("resize", resizeCanvas);

  };
}
window.initGame = initGame;
