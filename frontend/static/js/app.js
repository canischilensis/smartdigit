document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("digitCanvas");
  const ctx = canvas.getContext("2d");
  const clearBtn = document.getElementById("clearBtn");
  const predictBtn = document.getElementById("predictBtn");

  const resultSpan = document.getElementById("result");
  const resultPctSpan = document.getElementById("resultPct");
  const probsContainer = document.getElementById("probsContainer");

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 15;
  ctx.lineCap = "round";
  ctx.strokeStyle = "black";

  let isDrawing = false;
  let hasDrawn = false; // 1️⃣ NUEVA VARIABLE: Rastrea si el canvas está en blanco

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
    
    hasDrawn = true; // 2️⃣ EL USUARIO DIBUJÓ: Cambiamos el estado a true

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

  const setStatus = (text) => {
    if (resultSpan) resultSpan.innerText = text;
    if (resultPctSpan) resultPctSpan.innerText = "";
  };

  const clearProbsUI = () => {
    if (probsContainer) probsContainer.innerHTML = "";
  };

  const renderProbs = (probs, predIdx) => {
    if (!probsContainer) return;
    probsContainer.innerHTML = "";

    const safe = Array.isArray(probs) ? probs.map((v) => Number(v) || 0) : [];
    const total = safe.reduce((a, b) => a + b, 0);
    const norm = total > 0 ? safe.map((v) => v / total) : safe;

    norm.forEach((p, i) => {
      const pct = Math.max(0, Math.min(1, p)) * 100;
      const row = document.createElement("div");
      row.className = `prob-row ${i === predIdx ? "is-top" : ""}`;

      const label = document.createElement("div");
      label.className = "prob-label";
      label.innerText = String(i);

      const barWrap = document.createElement("div");
      barWrap.className = "prob-bar-wrap";

      const bar = document.createElement("div");
      bar.className = "prob-bar";
      bar.style.width = "0%"; 

      barWrap.appendChild(bar);

      const value = document.createElement("div");
      value.className = "prob-value";
      value.innerText = `${pct.toFixed(1)}%`;

      row.appendChild(label);
      row.appendChild(barWrap);
      row.appendChild(value);

      probsContainer.appendChild(row);

      setTimeout(() => {
        bar.style.width = `${pct.toFixed(1)}%`;
      }, 50 + (i * 30)); 
    });
  };

  clearBtn.addEventListener("click", () => {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setStatus("-");
    clearProbsUI();
    
    hasDrawn = false; // 3️⃣ REINICIO: Al limpiar, vuelve a estar en blanco
  });

  predictBtn.addEventListener("click", async () => {
    // 4️⃣ VALIDACIÓN: Si no ha dibujado, detenemos la ejecución y avisamos
    if (!hasDrawn) {
      setStatus("Dibuja un número primero");
      clearProbsUI();
      return; 
    }

    setStatus("Pensando...");
    clearProbsUI();

    try {
      const dataURL = canvas.toDataURL("image/png");

      const r = await fetch("/api/v1/predict/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataURL }),
      });

      const data = await r.json().catch(() => ({}));

      if (!r.ok) {
        const msg = data?.error ? String(data.error) : `Error HTTP ${r.status}`;
        throw new Error(msg);
      }

      const pred = Number(data.pred);
      const probs = data.probs;

      if (!Number.isInteger(pred) || pred < 0 || pred > 9) {
        throw new Error("Respuesta inválida: 'pred' no es un entero 0-9.");
      }
      if (!Array.isArray(probs) || probs.length !== 10) {
        throw new Error("Respuesta inválida: 'probs' debe ser un arreglo de 10 valores.");
      }

      const pTop = (Number(probs[pred]) || 0) * 100;

      if (resultSpan) resultSpan.innerText = String(pred);
      if (resultPctSpan) resultPctSpan.innerText = `(${pTop.toFixed(1)}%)`;

      renderProbs(probs, pred);

    } catch (err) {
      console.error("Error en inferencia:", err);
      setStatus("Error");
      if (resultPctSpan) resultPctSpan.innerText = `(${err.message})`;
      clearProbsUI();
    }
  });
});