document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("digitCanvas");
  const ctx = canvas.getContext("2d");
  const clearBtn = document.getElementById("clearBtn");
  const predictBtn = document.getElementById("predictBtn");
  const resultSpan = document.getElementById("result");

  // Fondo blanco + trazo negro
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.lineWidth = 15;
  ctx.lineCap = "round";
  ctx.strokeStyle = "black";

  let isDrawing = false;

  const startPosition = (e) => {
    isDrawing = true;
    draw(e);
  };

  const endPosition = () => {
    isDrawing = false;
    ctx.beginPath();
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  canvas.addEventListener("mousedown", startPosition);
  canvas.addEventListener("mouseup", endPosition);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseout", endPosition);

  clearBtn.addEventListener("click", () => {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    resultSpan.innerText = "-";
  });

  predictBtn.addEventListener("click", async () => {
    resultSpan.innerText = "Pensando...";

    try {
      const dataURL = canvas.toDataURL("image/png");

      const r = await fetch("/api/v1/predict/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataURL }),
      });

      const data = await r.json().catch(() => ({}));

      if (!r.ok) {
        throw new Error(data.error || `HTTP ${r.status}`);
      }

      // Tu backend devuelve: { pred: <int>, probs: [..10..] }
      resultSpan.innerText = String(data.pred);

      // opcional: debug
      console.log("probs:", data.probs);
    } catch (err) {
      console.error("Error en predict:", err);
      resultSpan.innerText = `Error: ${err.message}`;
    }
  });
});