const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('finalScore');

canvas.width = 800;
canvas.height = 600;

let score = 0;
let gameRunning = true;
const droneSpawnInterval = 2000; // Interval in milliseconds to spawn new drones
let usingZipline = false;

const character = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 30,
    height: 30,
    speed: 5,
    dx: 0,
    dy: 0,
    gravity: 0.5,
    jumpPower: -10,
    onGround: false
};

const ground = {
    x: 0,
    y: canvas.height - 20,
    width: canvas.width,
    height: 20
};

let buildings = [
    { x: 100, y: 400, width: 100, height: 200, color: '#a9a9a9' }, // Dark gray
    { x: 250, y: 350, width: 150, height: 250, color: '#808080' }, // Gray
    { x: 450, y: 300, width: 200, height: 300, color: '#d3d3d3' }  // Light gray
];

let drones = [
    { x: 200, y: 100, width: 30, height: 30, speed: 2, directionX: 1, directionY: 1 },
    { x: 400, y: 150, width: 30, height: 30, speed: 2, directionX: -1, directionY: -1 }
];

let ziplines = [];
let offsetX = 0;

function drawCharacter() {
    ctx.fillStyle = 'red';
    ctx.fillRect(character.x - offsetX, character.y, character.width, character.height);
}

function drawGround() {
    ctx.fillStyle = '#d3d3d3'; // Light gray color
    for (let i = -ground.width; i < canvas.width * 2; i += ground.width) {
        ctx.fillRect(ground.x + i - offsetX, ground.y, ground.width, ground.height);
    }
}

function drawBuildings() {
    buildings.forEach(building => {
        ctx.fillStyle = building.color;
        ctx.fillRect(building.x - offsetX, building.y, building.width, building.height);
    });
}

function drawDrones() {
    drones.forEach(drone => {
        ctx.fillStyle = 'blue';
        ctx.fillRect(drone.x - offsetX, drone.y, drone.width, drone.height);
        ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.beginPath();
        ctx.moveTo(drone.x - offsetX + drone.width / 2, drone.y + drone.height);
        ctx.lineTo(drone.x - offsetX + drone.width / 2 - 50, drone.y + drone.height + 100);
        ctx.lineTo(drone.x - offsetX + drone.width / 2 + 50, drone.y + drone.height + 100);
        ctx.closePath();
        ctx.fill();
    });
}

function drawZiplines() {
    ziplines.forEach(zipline => {
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(zipline.startX - offsetX, zipline.startY);
        ctx.lineTo(zipline.endX - offsetX, zipline.endY);
        ctx.stroke();
    });
}

function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function newPos() {
    if (!usingZipline) {
        character.dy += character.gravity;
        character.x += character.dx;
        character.y += character.dy;
    }

    // Prevent character from going out of bounds
    if (character.x < 0) character.x = 0;

    // Check for collision with ground
    if (character.y + character.height > ground.y) {
        alert('You fell! Restarting...');
        resetGame();
    }

    // Check for collision with buildings
    let onBuilding = false;
    buildings.forEach(building => {
        if (character.x < building.x + building.width &&
            character.x + character.width > building.x &&
            character.y < building.y + building.height &&
            character.y + character.height > building.y) {
            character.y = building.y - character.height;
            character.dy = 0;
            character.onGround = true;
            onBuilding = true;
        }
    });

    // Check if character falls between buildings
    if (!onBuilding && character.y + character.height > ground.y) {
        alert('You fell! Restarting...');
        resetGame();
    }

    // Scroll the screen
    if (character.x > canvas.width / 2) {
        offsetX = character.x - canvas.width / 2;
    }

    // Spawn new buildings
    if (buildings[buildings.length - 1].x - offsetX < canvas.width) {
        const lastBuilding = buildings[buildings.length - 1];
        const newBuilding = {
            x: lastBuilding.x + lastBuilding.width + Math.random() * 100 + 50,
            y: canvas.height - (Math.random() * 200 + 100),
            width: Math.random() * 100 + 50,
            height: canvas.height - (Math.random() * 200 + 100),
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`
        };
        buildings.push(newBuilding);
        score++;
        scoreElement.textContent = `Score: ${score}`;

        // Spawn a drone for every three buildings
        if (buildings.length % 3 === 0 && drones.length < 2) {
            const newDrone = {
                x: Math.random() * (canvas.width - 30) + offsetX,
                y: Math.random() * (canvas.height - 30),
                width: 30,
                height: 30,
                speed: 2,
                directionX: Math.random() < 0.5 ? 1 : -1,
                directionY: Math.random() < 0.5 ? 1 : -1
            };
            drones.push(newDrone);
        }

        // // Spawn a zipline for every 7 buildings after score 10
        // if (score > 10 && buildings.length % 7 === 0) {
        //     const startBuilding = buildings[buildings.length - 7];
        //     const endBuilding = buildings[buildings.length - 1];
        //     const zipline = {
        //         startX: startBuilding.x + startBuilding.width / 2,
        //         startY: startBuilding.y,
        //         endX: endBuilding.x + endBuilding.width / 2,
        //         endY: endBuilding.y
        //     };
        //     ziplines.push(zipline);

        //     // Remove buildings between the start and end of the zipline
        //     // buildings = buildings.filter(building => building.x < zipline.startX || building.x > zipline.endX);
        // }
    }

    // Move drones
    drones.forEach(drone => {
        drone.x += drone.speed * drone.directionX;
        drone.y += drone.speed * drone.directionY;

        // Keep drones within the canvas boundaries
        if (drone.x < offsetX) {
            drone.x = offsetX;
            drone.directionX *= -1;
        }
        if (drone.x + drone.width > canvas.width + offsetX) {
            drone.x = canvas.width + offsetX - drone.width;
            drone.directionX *= -1;
        }
        if (drone.y < 0) {
            drone.y = 0;
            drone.directionY *= -1;
        }
        if (drone.y + drone.height > canvas.height) {
            drone.y = canvas.height - drone.height;
            drone.directionY *= -1;
        }

        // Check if drone spots the character
        if (character.x < drone.x + drone.width &&
            character.x + character.width > drone.x &&
            character.y < drone.y + drone.height + 100 &&
            character.y + character.height > drone.y) {
            alert('You were spotted by a drone! Restarting...');
            resetGame();
        }
    });

    // Check if character is using a zipline
    if (usingZipline) {
        const zipline = ziplines.find(z => z.startX <= character.x && z.endX >= character.x);
        if (zipline) {
            character.x += 5; // Adjust speed as needed
            character.y = zipline.startY + (zipline.endY - zipline.startY) * ((character.x - zipline.startX) / (zipline.endX - zipline.startX));
            if (character.x >= zipline.endX) {
                usingZipline = false;
                character.onGround = true;
            }
        }
    }
}

function spawnDrone() {
    if (drones.length < 2) {
        const newDrone = {
            x: Math.random() * (canvas.width - 30) + offsetX,
            y: Math.random() * (canvas.height - 30),
            width: 30,
            height: 30,
            speed: 2,
            directionX: Math.random() < 0.5 ? 1 : -1,
            directionY: Math.random() < 0.5 ? 1 : -1
        };
        drones.push(newDrone);
    }
}

function resetGame() {
    character.x = buildings[0].x + buildings[0].width / 2 - character.width / 2;
    character.y = buildings[0].y - character.height;
    character.dx = 0;
    character.dy = 0;
    offsetX = 0;
    score = 0;
    gameRunning = true;
    usingZipline = false;
    scoreElement.textContent = `Score: ${score}`;
    finalScoreElement.classList.add('hidden');
    buildings = [
        { x: 100, y: 400, width: 100, height: 200, color: '#a9a9a9' }, // Dark gray
        { x: 250, y: 350, width: 150, height: 250, color: '#808080' }, // Gray
        { x: 450, y: 300, width: 200, height: 300, color: '#d3d3d3' }  // Light gray
    ];
    drones = [
        { x: 200, y: 100, width: 30, height: 30, speed: 2, directionX: 1, directionY: 1 },
        { x: 400, y: 150, width: 30, height: 30, speed: 2, directionX: -1, directionY: -1 }
    ];
    ziplines = [];
    clearInterval(droneSpawnIntervalId);
    droneSpawnIntervalId = setInterval(spawnDrone, droneSpawnInterval);
}

function update() {
    if (gameRunning) {
        clear();
        drawGround();
        drawBuildings();
        drawDrones();
        drawZiplines();
        drawCharacter();
        newPos();
    }
    requestAnimationFrame(update);
}

function moveRight() {
    character.dx = character.speed;
}

function moveLeft() {
    character.dx = -character.speed;
}

function jump() {
    if (character.onGround) {
        character.dy = character.jumpPower;
        character.onGround = false;
    }
}

function useZipline() {
    if (!usingZipline) {
        const zipline = ziplines.find(z => z.startX <= character.x && z.endX >= character.x);
        if (zipline) {
            usingZipline = true;
            character.onGround = false;
            character.dx = 0;
            character.dy = 0;
        }
    }
}

function keyDown(e) {
    if (e.key === 'ArrowRight' || e.key === 'Right') {
        moveRight();
    } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
        moveLeft();
    } else if (e.key === 'ArrowUp' || e.key === 'Up') {
        jump();
    } else if (e.key === 'Shift') {
        useZipline();
    }
}

function keyUp(e) {
    if (
        e.key === 'ArrowRight' ||
        e.key === 'Right' ||
        e.key === 'ArrowLeft' ||
        e.key === 'Left'
    ) {
        character.dx = 0;
    }
}

document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

let droneSpawnIntervalId = setInterval(spawnDrone, droneSpawnInterval);

resetGame();
update();