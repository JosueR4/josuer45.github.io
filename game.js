// Variables para el sistema de personajes
let selectedCharacter = 'personaje1.2';
let highestScore = 0;
const characterUnlocks = {
    'personaje1.2': 0,
    'personaje2': 40,
    'personaje3': 60,
    'personaje4': 100
};

// Cargar puntuación máxima del localStorage
function loadHighScore() {
    const savedScore = localStorage.getItem('highestScore');
    if (savedScore) {
        highestScore = parseInt(savedScore);
    }
    updateCharacterAvailability();
}

// Actualizar disponibilidad de personajes
function updateCharacterAvailability() {
    for (const [char, requiredScore] of Object.entries(characterUnlocks)) {
        const charElement = document.getElementById(`char${char.slice(-1)}`);
        if (charElement) { // Verificar que el elemento exista
            if (highestScore >= requiredScore) {
                charElement.classList.remove('locked');
                charElement.querySelector('.locked').textContent = 'Desbloqueado';
            } else {
                charElement.classList.add('locked');
                charElement.querySelector('.locked').textContent = `Bloqueado (${requiredScore} pts)`;
            }
        }
    }
}

// Seleccionar personaje
function selectCharacter(character) {
    if (highestScore >= characterUnlocks[character]) {
        selectedCharacter = character;
        // Actualizar visual de selección
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.getElementById(`char${character.slice(-1)}`).classList.add('selected');
        
        // Actualizar imagen del jugador
        player.img.src = `${character}.png`;
    }
}

// Mostrar menú de selección de personajes
function showCharacterSelect() {
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('characterSelect').classList.remove('hidden');
}

// Función para confirmar la selección del personaje
function confirmSelection() {
    if (highestScore >= characterUnlocks[selectedCharacter]) {
        // Ocultar la pantalla de selección de personaje
        document.getElementById("characterSelect").classList.add("hidden");
        // Iniciar el juego directamente
        startGame();
    } else {
        alert('Este personaje está bloqueado.');
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
let initialJump = true;
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

// Configuración del jugador
const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 60,
    width: 40,
    height: 40,
    dx: 6,
    dy: 0,
    gravity: 0.4,
    jumpPower: -15,
    maxFallSpeed: 12,
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
    spacing: canvas.height / 5,
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
    const rand = Math.random();
    let type = 'normal';
    
    if (rand < platformConfig.types.moving.probability) {
        type = 'moving';
    } else if (rand < platformConfig.types.moving.probability + platformConfig.types.breakable.probability) {
        type = 'breakable';
    }

    platforms.push({
        x: Math.random() * (canvas.width - platformConfig.width),
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
    if (isMovingRight) {
        player.x += player.dx;
        if (player.x > canvas.width) {
            player.x = 0;
        }
    }
    if (isMovingLeft) {
        player.x -= player.dx;
        if (player.x + player.width < 0) {
            player.x = canvas.width;
        }
    }
    player.y += player.dy;
    player.dy += player.gravity;
    if (player.dy > player.maxFallSpeed) {
        player.dy = player.maxFallSpeed;
    }

    // Colisión con plataformas
    platforms.forEach(plat => {
        if (!plat.broken && 
            player.y + player.height > plat.y && 
            player.y + player.height < plat.y + plat.height + player.dy &&
            player.x + player.width > plat.x && 
            player.x < plat.x + plat.width && 
            player.dy > 0) {

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
                if (!initialJump) score++;
            }
        }
    });

    // Ajuste de cámara
    if (player.y < canvas.height / 3) {
        const diff = canvas.height / 3 - player.y;
        cameraY -= diff;
        player.y = canvas.height / 3;
        platforms.forEach(plat => plat.y += diff);
        enemy2.y += diff;
        if (heart.active) {
            heart.y += diff;
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

    lives = 3;
    document.getElementById("menu").classList.add("hidden");
    document.getElementById("gameContainer").classList.remove("hidden");
    score = 0;
    player.x = canvas.width / 2 - 20;
    player.y = canvas.height - 60;
    player.dy = 0;
    player.isInvulnerable = false;
    initialJump = true;
    cameraY = 0;
    heart.active = false;
    heart.cooldown = false;
    heart.lastSpawnTime = Date.now();

    // Reiniciar enemigos
    enemy1.active = false;
    enemy1.y = -50;
    enemy2.x = 0;
    enemy2.y = canvas.height / 2;
    enemy2.direction = 1;

    createPlatforms();
    
    const countdown = document.getElementById("countdown");
    countdown.classList.remove("hidden");
    countdownValue = 3;
    countdown.textContent = countdownValue;

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
    document.getElementById("gameContainer").classList.add("hidden");
    document.getElementById("gameOver").classList.remove("hidden");
    document.getElementById("finalScore").textContent = score;
}

function retryGame() {
    document.getElementById("gameOver").classList.add("hidden");
    startGame();
}

// Manejo de controles de teclado
document.addEventListener("keydown", (e) => {
    if (e.code === "ArrowRight") isMovingRight = true;
    if (e.code === "ArrowLeft") isMovingLeft = true;
    if (e.code === "Space" && !gameRunning) startGame();
});

document.addEventListener("keyup", (e) => {
    if (e.code === "ArrowRight") isMovingRight = false;
    if (e.code === "ArrowLeft") isMovingLeft = false;
});

//Manejo de control táctil

let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener("touchmove", (e) => {
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const diffX = touchX - touchStartX;
    const diffY = touchY - touchStartY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 10) isMovingRight = true;
        else if (diffX < -10) isMovingLeft = true;
    }

    touchStartX = touchX;
    touchStartY = touchY;
});

canvas.addEventListener("touchend", () => {
    isMovingRight = false;
    isMovingLeft = false;
});

window.addEventListener('resize', resizeCanvas);

document.body.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });