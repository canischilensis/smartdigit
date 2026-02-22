document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("digitCanvas");
    const ctx = canvas.getContext("2d");
    const clearBtn = document.getElementById("clearBtn");
    const predictBtn = document.getElementById("predictBtn");
    const resultSpan = document.getElementById("result");

    // Configuración inicial del lienzo (Fondo blanco, trazo negro)
    // Esto imita papel normal, recuerda que en views.py hablamos de invertir los colores
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.lineWidth = 15; // Trazo grueso para sobrevivir al resize a 28x28
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";

    let isDrawing = false;

    // --- Eventos de Dibujo ---
    const startPosition = (e) => {
        isDrawing = true;
        draw(e);
    };

    const endPosition = () => {
        isDrawing = false;
        ctx.beginPath(); // Resetea el trazo
    };

    const draw = (e) => {
        if (!isDrawing) return;
        
        // Obtener coordenadas relativas al canvas
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
    canvas.addEventListener("mouseout", endPosition); // Cortar trazo si sale del lienzo

    // --- Lógica de la Interfaz ---
    clearBtn.addEventListener("click", () => {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        resultSpan.innerText = "-";
    });

    // --- Comunicación con la API (El puente Frontend-Backend) ---
    predictBtn.addEventListener("click", async () => {
        // 1. Extraer la imagen en Base64
        const dataURL = canvas.toDataURL("image/png");
        
        resultSpan.innerText = "Pensando...";

        try {
            // 2. Enviar petición HTTP POST al endpoint de Django DRF
            const response = await fetch('/api/v1/predict/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image: dataURL })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // 3. Procesar la respuesta
            const data = await response.json();
            
            if (data.status === 'success') {
                resultSpan.innerText = data.prediction;
            } else {
                resultSpan.innerText = "Error: " + data.error;
            }

        } catch (error) {
            console.error("Error en la petición:", error);
            resultSpan.innerText = "Error de conexión";
        }
    });
});