// Variables para el sistema de personajes
let selectedCharacter = 'personaje1.2';
let highestScore = 0;

const characterUnlocks = {
    'personaje1.2': 0,
    'personaje2': 40,
    'personaje3': 60,
    'personaje4': 100
};

// Cargar puntuación máxima del localStorage y mostrar en el menú
function loadHighScore() {
    const savedScore = localStorage.getItem('highestScore');
    if (savedScore) {
        highestScore = parseInt(savedScore);
        document.getElementById('highScoreDisplay').textContent = "Mejor Puntaje: " + highestScore;
    }
    updateCharacterAvailability(); // Actualizar disponibilidad después de cargar la puntuación
}

// Llamada para cargar el puntaje al iniciar la página
window.onload = function() {
    loadHighScore();
};

// Actualizar disponibilidad de personajes
function updateCharacterAvailability() {
    // Recorrer cada personaje
    Object.entries(characterUnlocks).forEach(([character, unlockScore], index) => {
        const charCard = document.getElementById(`char${index + 1}`);
        const statusSpan = charCard.querySelector('span');
        
        if (highestScore >= unlockScore) {
            // Personaje desbloqueado
            charCard.classList.remove('locked');
            charCard.style.opacity = '1';
            statusSpan.textContent = 'Desbloqueado';
            statusSpan.style.color = '#4CAF50'; // Verde para desbloqueado
        } else {
            // Personaje bloqueado
            charCard.classList.add('locked');
            charCard.style.opacity = '0.5';
            statusSpan.textContent = `Bloqueado (${unlockScore} puntos)`;
            statusSpan.style.color = '#FF5252'; // Rojo para bloqueado
        }
    });
}

function displayUnlockedCharacters() {
    // Recorre cada personaje para verificar su estado de desbloqueo en localStorage
    for (let character in unlockThresholds) {
        const characterButton = document.getElementById(character);
        if (localStorage.getItem(character) === 'unlocked') {
            characterButton.classList.remove('locked'); // Muestra el personaje como desbloqueado
            characterButton.disabled = false;           // Habilita el botón
        } else {
            characterButton.classList.add('locked');    // Mantiene el personaje bloqueado
            characterButton.disabled = true;            // Deshabilita el botón
        }
    }
}

const unlockThresholds = {
    character1: 10,
    character2: 20,
    character3: 30
};

// Seleccionar personaje
function selectCharacter(character) {
    const charIndex = parseInt(character.slice(-1)) || 1;
    if (highestScore >= characterUnlocks[character]) {
        selectedCharacter = character;
        
        // Actualizar visual de selección
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.getElementById(`char${charIndex}`).classList.add('selected');
        
        // Actualizar imagen del jugador
        player.img.src = `${character}.png`;
    } else {
        alert(`Necesitas ${characterUnlocks[character]} puntos para desbloquear este personaje`);
    }
}

// Mostrar menú de selección de personajes
function showCharacterSelect() {
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('characterSelect').classList.remove('hidden');
}

// Función para confirmar la selección del personaje
function confirmSelection() {
    if (selectedCharacter && highestScore >= characterUnlocks[selectedCharacter]) {
        document.getElementById("characterSelect").classList.add("hidden");
        startGame();
    } else {
        alert('Por favor, selecciona un personaje desbloqueado');
    }
}

// Modificar la función goToMenu para manejar correctamente el regreso al menú
function goToMenu() {
    // Ocultar todas las pantallas primero
    document.getElementById("gameOver").classList.add("hidden");
    document.getElementById("characterSelect").classList.add("hidden");
    document.getElementById("gameContainer").classList.add("hidden");
    
    // Mostrar solo el menú principal
    document.getElementById("menu").classList.remove("hidden");
    
    // Reiniciar variables relevantes
    gameRunning = false;
    score = 0;
}

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();

// Variables del juego
let score = 0;
let lives = 3;
let isMovingRight = false;
let isMovingLeft = false;
let gameRunning = false;
let countdownValue = 3;
let touchStartX = 0;

// Cargar imágenes
const lifeIcon = new Image();
lifeIcon.src = 'vida.gif';

const heartIcon = new Image();
heartIcon.src = 'corazon.png';

const platformImages = {
    normal: new Image(),
    moving: new Image(),
    breakable: new Image()
};

platformImages.normal.src = 'plataformas.png';
platformImages.moving.src = 'plataformas.png';
platformImages.breakable.src = 'plataformarota.png';

// Configuración del corazón
const heart = {
    x: 0,
    y: -50,
    width: 40,
    height: 40,
    active: false,
    cooldown: false,
    spawnInterval: 10000,
    lastSpawnTime: 0,
    speed: 2
};

// Variables para el control de movimiento
let accelerometer = {
    x: 0,
    y: 0,
    z: 0
};

// Solicitar permisos y configurar el sensor de movimiento
function setupDeviceMotion() {
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS 13+ requiere permiso explícito
        DeviceOrientationEvent.requestPermission()
            .then(response => {
                if (response === 'granted') {
                    window.addEventListener('deviceorientation', handleDeviceMotion);
                }
            })
            .catch(console.error);
    } else {
        // Dispositivos Android y otros
        window.addEventListener('deviceorientation', handleDeviceMotion);
    }
}

// Manejar el movimiento del dispositivo
function handleDeviceMotion(event) {
    // Obtener la inclinación lateral (gamma)
    accelerometer.x = event.gamma;
}

// Configuración del jugador
const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 60,
    width: 40,
    height: 40,
    dx: 6,
    dy: 0,
    gravity: 0.5,
    jumpPower: -17,
    maxFallSpeed: 12,
    tiltSpeed: 0.16, // Factor de velocidad para el movimiento basado en la inclinación
    img: new Image(),
    isJumping: false,
    isInvulnerable: false,
    invulnerabilityTime: 2000
};
player.img.src = 'personaje1.2.png';

// Configuración de enemigos
const enemy1 = {
    x: 0,
    y: -50,
    width: 40,
    height: 40,
    speed: 3,
    active: false,
    img: new Image()
};
enemy1.img.src = 'enemigo1.png';

const enemy2 = {
    x: 0,
    y: canvas.height / 2,
    width: 40,
    height: 40,
    speed: 3,
    direction: 1,
    active: true,
    img: new Image()
};
enemy2.img.src = 'enemigo2.png';

// Configuración de plataformas
const platformConfig = {
    width: 70,
    height: 28,
    baseCount: 10,
    spacing: canvas.height / 7,
    types: {
        normal: { probability: 0.7 },
        moving: { probability: 0.2 },
        breakable: { probability: 0.1 }
    }
};

let platforms = [];
let cameraY = 0;
let highestPlatform = 0;

// Funciones del juego
function createPlatform(y) {
    const minGap = 60; // Espacio mínimo horizontal entre plataformas
    const maxGap = 200; // Espacio máximo horizontal entre plataformas
    
    const rand = Math.random();
    let type = 'normal';
    
    if (rand < platformConfig.types.moving.probability) {
        type = 'moving';
    } else if (rand < platformConfig.types.moving.probability + platformConfig.types.breakable.probability) {
        type = 'breakable';
    }

    // Asegurar que las plataformas estén alcanzables
    let x = Math.random() * (canvas.width - platformConfig.width);
    
    // Verificar que no haya plataformas demasiado cercanas
    const nearPlatforms = platforms.filter(p => Math.abs(p.y - y) < platformConfig.spacing);
    let attempts = 0;
    while (attempts < 10 && nearPlatforms.some(p => Math.abs(p.x - x) < minGap)) {
        x = Math.random() * (canvas.width - platformConfig.width);
        attempts++;
    }

    platforms.push({
        x: x,
        y: y,
        width: platformConfig.width,
        height: platformConfig.height,
        type: type,
        dx: type === 'moving' ? (Math.random() < 0.5 ? 2 : -2) : 0,
        broken: false,
        rebounded: false
    });
}

function createPlatforms() {
    platforms = [];
    platforms.push({
        x: canvas.width / 2 - platformConfig.width,
        y: canvas.height - platformConfig.height - 10,
        width: platformConfig.width * 2,
        height: platformConfig.height,
        type: 'normal',
        broken: false,
        rebounded: false
    });
    for (let i = 1; i < platformConfig.baseCount; i++) {
        const y = canvas.height - (i * platformConfig.spacing);
        createPlatform(y);
    }
    highestPlatform = platforms[platforms.length - 1].y;
}

function updateHeart() {
    if (!heart.active && !heart.cooldown && lives < 3) {
        const currentTime = Date.now();
        if (currentTime - heart.lastSpawnTime >= heart.spawnInterval) {
            heart.active = true;
            heart.x = Math.random() * (canvas.width - heart.width);
            heart.y = -50;
        }
    }

    if (heart.active) {
        heart.y += heart.speed;

        // Verificar colisión con el jugador
        if (player.x < heart.x + heart.width &&
            player.x + player.width > heart.x &&
            player.y < heart.y + heart.height &&
            player.y + player.height > heart.y) {
            if (lives < 3) {
                lives++;
                heart.active = false;
                heart.cooldown = true;
                heart.lastSpawnTime = Date.now();
                setTimeout(() => {
                    heart.cooldown = false;
                }, heart.spawnInterval);
            }
        }

        if (heart.y > canvas.height) {
            heart.active = false;
            heart.lastSpawnTime = Date.now();
        }
    }
}

function updatePlatforms() {
    while (highestPlatform > cameraY - canvas.height) {
        createPlatform(highestPlatform - platformConfig.spacing);
        highestPlatform -= platformConfig.spacing;
    }
    
    platforms = platforms.filter(plat => {
        if (plat.type === 'moving') {
            plat.x += plat.dx;
            if (plat.x <= 0 || plat.x + plat.width >= canvas.width) {
                plat.dx *= -1;
            }
        }
        return plat.y > cameraY - canvas.height * 1.5;
    });
}

function updateEnemies() {
    // Enemigo 1
    if (!enemy1.active) {
        if (Math.random() < 0.02) {
            enemy1.active = true;
            enemy1.x = Math.random() * (canvas.width - enemy1.width);
            enemy1.y = -50;
        }
    } else {
        enemy1.y += enemy1.speed;
        if (enemy1.y > canvas.height) {
            enemy1.active = false;
            enemy1.y = -50;
        }
    }

    // Enemigo 2
    enemy2.x += enemy2.speed * enemy2.direction;
    if (enemy2.x > canvas.width - enemy2.width || enemy2.x < 0) {
        enemy2.direction *= -1;
    }
}

function movePlayer() {
    // Movimiento basado en la inclinación del dispositivo
    let tilt = accelerometer.x;
    
    // Limitar el rango de inclinación
    tilt = Math.max(-45, Math.min(45, tilt));
    
    // Convertir la inclinación en movimiento horizontal
    player.x += (tilt * player.tiltSpeed);
    
    // Envolver horizontalmente (aparecer en el lado opuesto)
    if (player.x > canvas.width) {
        player.x = 0;
    } else if (player.x + player.width < 0) {
        player.x = canvas.width;
    }
    
    // Aplicar gravedad
    player.dy += player.gravity;
    if (player.dy > player.maxFallSpeed) {
        player.dy = player.maxFallSpeed;
    }
    
    // Actualizar posición vertical
    player.y += player.dy;

    // Colisión con plataformas (solo cuando el jugador está cayendo)
    if (player.dy > 0) {
        platforms.forEach(plat => {
            if (!plat.broken && 
                player.y + player.height > plat.y && 
                player.y + player.height < plat.y + plat.height + player.dy &&
                player.x + player.width > plat.x && 
                player.x < plat.x + plat.width) {

                if (plat.type === 'breakable') {
                    if (plat.rebounded) {
                        plat.broken = true;
                    } else {
                        plat.rebounded = true;
                        player.dy = player.jumpPower;
                        player.isJumping = true;
                    }
                } else {
                    player.dy = player.jumpPower;
                    player.isJumping = true;
                    score++;
                }
            }
        });
    }

    // Ajuste de cámara basado en la posición del jugador
    if (player.y < canvas.height / 2) {
        const diff = canvas.height / 2 - player.y;
        cameraY -= diff;
        player.y = canvas.height / 2;
        
        platforms.forEach(plat => plat.y += diff);
        if (enemy1.active) enemy1.y += diff;
        enemy2.y += diff;
        if (heart.active) heart.y += diff;
    }

    // Game over si el jugador cae demasiado
    if (player.y > canvas.height + player.height) {
        endGame();
    }
}

// Función de salto que permite el doble salto
function handleJump() {
    if (player.jumpCount < 2) { // Permitir un segundo salto
        player.dy = player.jumpPower;
        player.isJumping = true;
        player.jumpCount++;
    }
}

    // Verificar caída
    const isOnAnyPlatform = platforms.some(plat => 
        player.y + player.height > plat.y && 
        player.y + player.height < plat.y + plat.height + player.dy &&
        player.x + player.width > plat.x && 
        player.x < plat.x + plat.width);

    if (!isOnAnyPlatform && player.dy > 0 && player.y - player.height > canvas.height) {
        endGame();
    }

    if (initialJump && player.isJumping) {
        initialJump = false;
    }

function checkEnemyCollision() {
    if (player.isInvulnerable) return;

    // Colisión con enemigo1
    if (enemy1.active &&
        player.x < enemy1.x + enemy1.width &&
        player.x + player.width > enemy1.x &&
        player.y < enemy1.y + enemy1.height &&
        player.y + player.height > enemy1.y) {
        lives--;
        makePlayerInvulnerable();
        if (lives <= 0) endGame();
    }

    // Colisión con enemigo2
    if (player.x < enemy2.x + enemy2.width &&
        player.x + player.width > enemy2.x &&
        player.y < enemy2.y + enemy2.height &&
        player.y + player.height > enemy2.y) {
        lives--;
        makePlayerInvulnerable();
        if (lives <= 0) endGame();
    }
}

function makePlayerInvulnerable() {
    player.isInvulnerable = true;
    setTimeout(() => {
        player.isInvulnerable = false;
    }, player.invulnerabilityTime);
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar plataformas
    platforms.forEach(plat => {
        if (!plat.broken) {
            const platformImg = platformImages[plat.type];
            ctx.drawImage(platformImg, plat.x, plat.y, plat.width, plat.height);
        }
    });

    // Dibujar corazón
    if (heart.active) {
        ctx.drawImage(heartIcon, heart.x, heart.y, heart.width, heart.height);
    }

    // Dibujar jugador (con efecto de parpadeo si es invulnerable)
    if (!player.isInvulnerable || Math.floor(Date.now() / 100) % 2) {
        ctx.drawImage(player.img, player.x, player.y, player.width, player.height);
    }

    // Dibujar enemigos
    if (enemy1.active) {
        ctx.drawImage(enemy1.img, enemy1.x, enemy1.y, enemy1.width, enemy1.height);
    }
    if (enemy2.active) {
        ctx.drawImage(enemy2.img, enemy2.x, enemy2.y, enemy2.width, enemy2.height);
    }

    // Dibujar vidas
    for (let i = 0; i < lives; i++) {
        ctx.drawImage(lifeIcon, canvas.width - 50 - (i * 40), 20, 30, 30);
    }

    // Mostrar puntuación
    document.getElementById("score").textContent = "Puntuación: " + score;
}

function gameLoop() {
    if (!gameRunning) return;
    movePlayer();
    updatePlatforms();
    updateEnemies();
    updateHeart();
    checkEnemyCollision();
    drawGame();
    requestAnimationFrame(gameLoop);
}

function startGame() {
    if (!areImagesLoaded()) {
        setTimeout(startGame, 100);
        return;
    }

    // Configurar el sensor de movimiento
    setupDeviceMotion();

    // Reiniciar variables del juego
    lives = 3;
    score = 0;
    player.x = canvas.width / 2 - 20;
    player.y = canvas.height - 60;
    player.dy = player.jumpPower;
    player.isInvulnerable = false;
    cameraY = 0;
    accelerometer = { x: 0, y: 0, z: 0 };

    // Reiniciar elementos del juego
    heart.active = false;
    heart.cooldown = false;
    heart.lastSpawnTime = Date.now();
    enemy1.active = false;
    enemy1.y = -50;
    enemy2.x = 0;
    enemy2.y = canvas.height / 2;
    enemy2.direction = 1;

    platforms = [];
    createPlatforms();
    
    // Configurar la interfaz
    document.getElementById("menu").classList.add("hidden");
    document.getElementById("gameContainer").classList.remove("hidden");
    
    const countdown = document.getElementById("countdown");
    countdown.classList.remove("hidden");
    countdownValue = 3;
    countdown.textContent = countdownValue;

    // Iniciar el juego después de la cuenta regresiva
    const countdownInterval = setInterval(() => {
        countdownValue--;
        countdown.textContent = countdownValue;
        if (countdownValue === 0) {
            clearInterval(countdownInterval);
            countdown.classList.add("hidden");
            gameRunning = true;
            gameLoop();
        }
    }, 1000);
}

function areImagesLoaded() {
    return platformImages.normal.complete && 
           platformImages.moving.complete && 
           platformImages.breakable.complete && 
           player.img.complete &&
           enemy1.img.complete &&
           enemy2.img.complete &&
           lifeIcon.complete &&
           heartIcon.complete;
}

function endGame() {
    gameRunning = false;
    document.getElementById('gameContainer').classList.add('hidden');
    document.getElementById('gameOver').classList.remove('hidden');
    document.getElementById('finalScore').textContent = score;

    // Actualizar y guardar la puntuación más alta
    if (score > highestScore) {
        highestScore = score;
        localStorage.setItem('highestScore', highestScore.toString());
        loadHighScore(); // Recargar la puntuación y actualizar personajes
    }
}

function retryGame() {
    document.getElementById("gameOver").classList.add("hidden");
    startGame();
}

// Manejo de controles de teclado
document.addEventListener("keydown", (e) => {
    if (e.code === "ArrowRight") isMovingRight = true;
    if (e.code === "ArrowLeft") isMovingLeft = true;
    if (e.code === "Space" && gameRunning) handleJump();
});

document.addEventListener("keyup", (e) => {
    if (e.code === "ArrowRight") isMovingRight = false;
    if (e.code === "ArrowLeft") isMovingLeft = false;
});

function showOrientationMessage() {
    const message = document.createElement('div');
    message.style.position = 'fixed';
    message.style.top = '50%';
    message.style.left = '50%';
    message.style.transform = 'translate(-50%, -50%)';
    message.style.background = 'rgba(0, 0, 0, 0.8)';
    message.style.color = 'white';
    message.style.padding = '20px';
    message.style.borderRadius = '10px';
    message.style.textAlign = 'center';
    message.style.zIndex = '1000';
    message.innerHTML = 'Por favor, inclina tu dispositivo para mover el personaje.<br>Toca la pantalla para comenzar.';
    
    document.body.appendChild(message);
    
    // Remover el mensaje cuando el usuario toque la pantalla
    document.addEventListener('touchstart', function removeMessage() {
        message.remove();
        document.removeEventListener('touchstart', removeMessage);
    });
}

// Modificar los event listeners existentes
document.addEventListener('DOMContentLoaded', () => {
    // Remover los event listeners táctiles anteriores
    canvas.removeEventListener("touchstart", null);
    canvas.removeEventListener("touchmove", null);
    canvas.removeEventListener("touchend", null);
    
    // Mostrar mensaje de orientación al iniciar
    showOrientationMessage();
});

// Prevenir el scroll en dispositivos móviles
document.body.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });
