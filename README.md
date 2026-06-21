# Culebrita 🐍

Juego clásico de la culebrita (Snake) con **récords mundiales**, **confeti** y **modo claro/oscuro**.

## 🎮 Cómo jugar

| Tecla     | Acción          |
|-----------|-----------------|
| ← ↑ → ↓  | Mover la culebra |
| Espacio   | Pausar / Reanudar |

- Come la comida roja para crecer y sumar puntos
- Si chocas contra ti mismo, termina la partida
- La culebra **atraviesa las paredes** (wrap-around)

## ✨ Funcionalidades

- **🌙☀️ Modo claro/oscuro** — cambia con un clic, se guarda tu preferencia
- **🏆 Récords mundiales** — al terminar, si superas el récord global aparece confeti
- **👤 Registro de usuario** — ingresa tu nombre al iniciar
- **📋 Leaderboard** — top 10 con nombres, puntajes y fechas
- **🎊 Confeti** — celebración al batir el récord mundial
- **💾 Persistencia** — todo se guarda en localStorage (récords, usuario, tema, high score)

## 🚀 Cómo ejecutar

Abre `index.html` directamente en tu navegador o sirve el proyecto con un servidor local:

```bash
# Con Node.js
npx serve .

# Con Python
python -m http.server 8080
```

## 📁 Estructura

```
prueba-ai/
├── index.html      # Página principal
├── style.css       # Estilos con variables CSS (temas)
├── script.js       # Lógica del juego
└── README.md       # Este archivo
```

## 🛠️ Tecnologías

HTML5 Canvas, CSS3 (custom properties), JavaScript vanilla. Sin dependencias externas.
