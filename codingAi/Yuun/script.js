// Game constants
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const worldWidth = 2000;
const worldHeight = 1500;

// Game state
let money = 500;
let lastBuildingTime = 0;
let lastWorkerTime = 0;
const buildCooldown = 120; // frames
const workerCooldown = 120;

const units = [];
const workers = [];
const buildings = [];
const turrets = [];
const enemies = [];
const projectiles = [];

const base = { x: 100, y: 100 };
buildings.push({ x: base.x, y: base.y, buildCooldown: 0 });
workers.push({ x: base.x + 20, y: base.y + 20, selected: false, target: null, carrying: false, oreTarget: null, state: "idle", type: "worker" });

const ores = Array.from({ length: 5 }, () => ({ x: Math.random() * worldWidth, y: Math.random() * worldHeight, amount: 1000 }));

// Camera
let camX = 0, camY = 0;
const scrollSpeed = 10;

// Selection
let isSelecting = false;
let selectStart = { x: 0, y: 0 };
let selectEnd = { x: 0, y: 0 };

// Mouse
let mouseX = 0, mouseY = 0;
let showGhostBuilding = false;
let isPlacingBuilding = false;
canvas.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if (isSelecting) selectEnd = getMousePos(e);
});

canvas.addEventListener("mousedown", (e) => {
  if (e.button === 0) {
    if (isPlacingBuilding && money >= 100 && performance.now() - lastBuildingTime > buildCooldown * 16) {
      const mouse = getMousePos(e);
      buildings.push({ x: mouse.x, y: mouse.y, buildCooldown: 0 });
      money -= 100;
      lastBuildingTime = performance.now();
      isPlacingBuilding = false;
    } else {
      isSelecting = true;
      selectStart = getMousePos(e);
      selectEnd = selectStart;
    }
  }
});

canvas.addEventListener("mouseup", (e) => {
  if (e.button === 0 && isSelecting) {
    isSelecting = false;
    const minX = Math.min(selectStart.x, selectEnd.x);
    const minY = Math.min(selectStart.y, selectEnd.y);
    const maxX = Math.max(selectStart.x, selectEnd.x);
    const maxY = Math.max(selectStart.y, selectEnd.y);
    for (let unit of [...units, ...workers]) {
      unit.selected = unit.x >= minX && unit.x <= maxX && unit.y >= minY && unit.y <= maxY;
    }
  }
});

canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  const mouse = getMousePos(e);
  const selectedUnits = [...units, ...workers].filter(u => u.selected);
  const angleStep = (Math.PI * 2) / selectedUnits.length;
  selectedUnits.forEach((unit, i) => {
    const angle = angleStep * i;
    unit.target = {
      x: mouse.x + Math.cos(angle) * 20,
      y: mouse.y + Math.sin(angle) * 20
    };
    if (unit.type === "worker") {
      unit.state = "movingToOre";
    }
  });
});

window.addEventListener("keydown", (e) => {
  const mouse = getMousePos({ clientX: mouseX, clientY: mouseY });
  if (e.key === "b") {
    isPlacingBuilding = true;
  }
  if (e.key === "q" && money >= 50 && performance.now() - lastWorkerTime > workerCooldown * 16) {
    const closestBuilding = buildings.reduce((closest, b) => {
      const dist = distance({ x: mouse.x, y: mouse.y }, b);
      return !closest || dist < distance({ x: mouse.x, y: mouse.y }, closest) ? b : closest;
    }, null);
    if (closestBuilding) {
      workers.push({ x: closestBuilding.x, y: closestBuilding.y, selected: false, target: null, carrying: false, oreTarget: null, state: "idle", type: "worker" });
      money -= 50;
      lastWorkerTime = performance.now();
    }
  }
  if (e.key === "r" && money >= 100) {
    units.push({ x: mouse.x, y: mouse.y, selected: false, target: null, attackCooldown: 0, type: "rifleman" });
    money -= 100;
  }
  if (e.key === "e") {
    enemies.push({ x: camX + canvas.width - 100, y: camY + 100, hp: 100 });
  }
  if (e.key === "w") camY -= scrollSpeed;
  if (e.key === "s") camY += scrollSpeed;
  if (e.key === "a") camX -= scrollSpeed;
  if (e.key === "d") camX += scrollSpeed;
});

function getMousePos(e) {
  return {
    x: e.clientX + camX,
    y: e.clientY + camY
  };
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function update() {
  camX = Math.max(0, Math.min(worldWidth - canvas.width, camX));
  camY = Math.max(0, Math.min(worldHeight - canvas.height, camY));

  for (let worker of workers) {
    if (worker.state === "movingToOre") {
      if (!worker.oreTarget || worker.oreTarget.amount <= 0) {
        worker.oreTarget = ores.find(o => o.amount > 0);
      }
      if (worker.oreTarget) {
        const d = distance(worker, worker.oreTarget);
        if (d > 5) {
          const dx = worker.oreTarget.x - worker.x;
          const dy = worker.oreTarget.y - worker.y;
          const len = Math.hypot(dx, dy);
          worker.x += (dx / len) * 1.5;
          worker.y += (dy / len) * 1.5;
        } else {
          worker.state = "returning";
          worker.carrying = true;
          worker.oreTarget.amount -= 1;
        }
      }
    } else if (worker.state === "returning") {
      const d = distance(worker, base);
      if (d > 5) {
        const dx = base.x - worker.x;
        const dy = base.y - worker.y;
        const len = Math.hypot(dx, dy);
        worker.x += (dx / len) * 1.5;
        worker.y += (dy / len) * 1.5;
      } else {
        worker.state = "movingToOre";
        worker.carrying = false;
        money += 25;
      }
    } else if (worker.target) {
      const d = distance(worker, worker.target);
      if (d > 2) {
        const dx = worker.target.x - worker.x;
        const dy = worker.target.y - worker.y;
        const len = Math.hypot(dx, dy);
        worker.x += (dx / len) * 1.5;
        worker.y += (dy / len) * 1.5;
      }
    }
  }

  for (let unit of units) {
    if (unit.target) {
      const d = distance(unit, unit.target);
      if (d > 2) {
        const dx = unit.target.x - unit.x;
        const dy = unit.target.y - unit.y;
        const len = Math.hypot(dx, dy);
        unit.x += (dx / len) * 2;
        unit.y += (dy / len) * 2;
      }
    }
    unit.attackCooldown--;
    const enemy = enemies.find(e => distance(e, unit) < 150);
    if (enemy && unit.attackCooldown <= 0) {
      projectiles.push({ x: unit.x, y: unit.y, target: enemy });
      unit.attackCooldown = 60;
    }
  }

  for (let p of projectiles) {
    const dx = p.target.x - p.x;
    const dy = p.target.y - p.y;
    const len = Math.hypot(dx, dy);
    p.x += (dx / len) * 5;
    p.y += (dy / len) * 5;
    if (distance(p, p.target) < 5) {
      p.target.hp -= 25;
      p.hit = true;
    }
  }
  for (let i = projectiles.length - 1; i >= 0; i--) {
    if (projectiles[i].hit) projectiles.splice(i, 1);
  }

  for (let enemy of enemies) {
    const d = distance(enemy, base);
    if (d > 5) {
      const dx = base.x - enemy.x;
      const dy = base.y - enemy.y;
      const len = Math.hypot(dx, dy);
      enemy.x += (dx / len) * 0.5;
      enemy.y += (dy / len) * 0.5;
    }
  }
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].hp <= 0) enemies.splice(i, 1);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#111";
  ctx.fillRect(-camX, -camY, worldWidth, worldHeight);

  for (let ore of ores) {
    if (ore.amount > 0) {
      ctx.fillStyle = "gray";
      ctx.beginPath();
      ctx.arc(ore.x - camX, ore.y - camY, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (isPlacingBuilding && money >= 100) {
    ctx.fillStyle = "rgba(255,165,0,0.4)";
    const ghostX = mouseX;
    const ghostY = mouseY;
    ctx.fillRect(ghostX - 20, ghostY - 20, 40, 40);
  }

  for (let b of buildings) {
    ctx.fillStyle = "orange";
    ctx.fillRect(b.x - camX - 20, b.y - camY - 20, 40, 40);
  }

  for (let w of workers) {
    ctx.fillStyle = w.selected ? "cyan" : "white";
    ctx.beginPath();
    ctx.arc(w.x - camX, w.y - camY, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let u of units) {
    ctx.fillStyle = u.selected ? "lime" : "green";
    ctx.beginPath();
    ctx.arc(u.x - camX, u.y - camY, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let e of enemies) {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(e.x - camX, e.y - camY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "black";
    ctx.fillRect(e.x - 15 - camX, e.y - 20 - camY, 30, 5);
    ctx.fillStyle = "lime";
    ctx.fillRect(e.x - 15 - camX, e.y - 20 - camY, 30 * (e.hp / 100), 5);
  }

  for (let p of projectiles) {
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(p.x - camX, p.y - camY, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  if (isSelecting) {
    const x = Math.min(selectStart.x, selectEnd.x) - camX;
    const y = Math.min(selectStart.y, selectEnd.y) - camY;
    const w = Math.abs(selectEnd.x - selectStart.x);
    const h = Math.abs(selectEnd.y - selectStart.y);
    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = "rgba(0,255,255,0.2)";
    ctx.fillRect(x, y, w, h);
  }

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, 160, 30);
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText("Money: " + money, 10, 20);
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
