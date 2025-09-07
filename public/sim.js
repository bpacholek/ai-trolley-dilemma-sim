
const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');
const socket = io();

let switchTrack = false;
let trolleyX = 100;
let trolleyY = 180;
let trolleySpeed = 2;
let atSwitch = false;
let hit = false;
let hitType = null; // 'main' or 'side'
let hitAnimFrame = 0;
let crashParticles = [];
let shakeOffset = { x: 0, y: 0 };
let flashFrame = 0;
let waitingForDecision = false;
let decisionReceived = false;
let mainTrackPeople = 5;
let sideTrackPeople = 1;
let simulationRunning = false;
let animationId = null;

function drawBackground() {
  // Sky
  ctx.fillStyle = '#87ceeb';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Clouds
  drawCloud(150, 60);
  drawCloud(500, 40);
  drawCloud(350, 100);
  // Grass
  ctx.fillStyle = '#4ec516';
  ctx.fillRect(0, 340, canvas.width, 60);
  // Bushes
  drawBush(200, 350);
  drawBush(600, 360);
}

function drawCloud(x, y) {
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x, y, 24, 0, Math.PI * 2);
  ctx.arc(x + 20, y + 8, 18, 0, Math.PI * 2);
  ctx.arc(x - 18, y + 8, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawBush(x, y) {
  ctx.save();
  ctx.fillStyle = '#228B22';
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.arc(x + 16, y + 6, 14, 0, Math.PI * 2);
  ctx.arc(x - 14, y + 6, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTracks() {
  ctx.save();
  // Rails
  ctx.strokeStyle = '#bfa76f';
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(100, 200);
  ctx.lineTo(700, 200);
  ctx.stroke();
  ctx.strokeStyle = '#bfa76f';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(400, 200);
  ctx.lineTo(700, 320);
  ctx.stroke();
  // Metal rails
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(100, 190);
  ctx.lineTo(700, 190);
  ctx.moveTo(100, 210);
  ctx.lineTo(700, 210);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(400, 190);
  ctx.lineTo(700, 310);
  ctx.moveTo(400, 210);
  ctx.lineTo(700, 330);
  ctx.stroke();
  // Sleepers
  for (let i = 100; i < 700; i += 32) {
    ctx.strokeStyle = '#7c5a1a';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(i, 185);
    ctx.lineTo(i, 215);
    ctx.stroke();
  }
  for (let i = 400; i < 700; i += 32) {
    let y1 = 200 + ((i - 400) / 300) * 120 - 15;
    let y2 = 200 + ((i - 400) / 300) * 120 + 15;
    ctx.beginPath();
    ctx.moveTo(i, y1);
    ctx.lineTo(i, y2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTrolley(x, y, squish = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, squish);

  // Add thinking indicator when waiting for AI decision
  if (waitingForDecision && !decisionReceived) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(-50, -50, 100, 25);
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('AI Thinking...', 0, -35);

    // Animated dots
    let dots = '';
    for (let i = 0; i < (Math.floor(Date.now() / 300) % 4); i++) {
      dots += '.';
    }
    ctx.fillText(dots, 0, -20);
  }

  // Body (Mario-style)
  ctx.fillStyle = '#e33';
  ctx.beginPath();
  ctx.roundRect(-38, -22, 76, 44, 14);
  ctx.fill();
  // Roof
  ctx.fillStyle = '#f7d560';
  ctx.beginPath();
  ctx.ellipse(0, -22, 38, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Windows
  ctx.fillStyle = '#aee7fa';
  ctx.beginPath();
  ctx.roundRect(-22, -10, 16, 18, 5);
  ctx.roundRect(6, -10, 16, 18, 5);
  ctx.fill();
  // Wheels
  ctx.fillStyle = '#444';
  ctx.beginPath();
  ctx.arc(-22, 26, 10, 0, Math.PI * 2);
  ctx.arc(22, 26, 10, 0, Math.PI * 2);
  ctx.fill();
  // Bumpers
  ctx.fillStyle = '#888';
  ctx.fillRect(-38, 10, 8, 12);
  ctx.fillRect(30, 10, 8, 12);
  ctx.restore();
}

function drawPeople(splat = false, splatType = null) {
  // Main track people (Mario-style)
  for (let i = 0; i < mainTrackPeople; i++) {
    let isSplat = splat && splatType === 'main';
    drawMarioPerson(650, 170 + i * 12, isSplat, 1.0);
  }
  // Side track people
  for (let i = 0; i < sideTrackPeople; i++) {
    let isSplat = splat && splatType === 'side';
    drawMarioPerson(650, 290 + i * 12, isSplat, 1.0);
  }
}

function drawMarioPerson(x, y, splat = false, scale = 1.0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (splat) {
    // Enhanced splat effect with particles
    ctx.fillStyle = '#f00';
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 8; i++) {
      ctx.save();
      ctx.rotate((Math.PI * 2 * i) / 8);
      ctx.fillRect(0, 0, 18, 3);
      ctx.restore();
    }
    // Add some smaller debris
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate((Math.PI * 2 * i) / 6);
      ctx.fillStyle = '#a00';
      ctx.beginPath();
      ctx.arc(25, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else {
    // Shoes
    ctx.fillStyle = '#6b3e26';
    ctx.fillRect(-8, 32, 8, 6);
    ctx.fillRect(0, 32, 8, 6);
    // Legs
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(-8, 18, 8, 16);
    ctx.fillRect(0, 18, 8, 16);
    // Body
    ctx.fillStyle = '#e33';
    ctx.fillRect(-12, 2, 24, 20);
    // Arms
    ctx.fillStyle = '#ffe0b2';
    ctx.fillRect(-16, 6, 6, 16);
    ctx.fillRect(10, 6, 6, 16);
    // Head
    ctx.fillStyle = '#ffe0b2';
    ctx.beginPath();
    ctx.arc(0, -8, 12, 0, Math.PI * 2);
    ctx.fill();
    // Hat
    ctx.fillStyle = '#c00';
    ctx.beginPath();
    ctx.ellipse(0, -16, 13, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-13, -16, 26, 6);
    // Eyes
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(-4, -10, 2, 0, Math.PI * 2);
    ctx.arc(4, -10, 2, 0, Math.PI * 2);
    ctx.fill();
    // Mustache
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -4, 6, Math.PI * 0.1, Math.PI * 0.9);
    ctx.stroke();
  }
  ctx.restore();
}

function createCrashParticles(x, y) {
  for (let i = 0; i < 20; i++) {
    crashParticles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10 - 2,
      size: Math.random() * 6 + 2,
      color: Math.random() < 0.5 ? '#f00' : '#ff0',
      life: 60,
      maxLife: 60
    });
  }
}

function updateCrashParticles() {
  for (let i = crashParticles.length - 1; i >= 0; i--) {
    let p = crashParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.2; // gravity
    p.life--;
    p.vx *= 0.98; // air resistance
    if (p.life <= 0) {
      crashParticles.splice(i, 1);
    }
  }
}

function drawCrashParticles() {
  crashParticles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function updateTrolley() {
  if (hit || !simulationRunning) return;

  // At switch, request decision and pause
  if (!atSwitch && trolleyX + trolleySpeed >= 400 && trolleyX < 400) {
    atSwitch = true;
    waitingForDecision = true;
    decisionReceived = false;
    socket.emit('requestSwitch');
    console.log('Trolley reached switch, waiting for AI decision...');
  }

  // Don't move past switch until decision is received
  if (waitingForDecision && !decisionReceived) {
    // Stop the trolley at the switch
    if (trolleyX < 400) {
      trolleyX += trolleySpeed;
    }
    return;
  }

  // Continue movement after decision
  if (!switchTrack) {
    if (trolleyX < 700) {
      trolleyX += trolleySpeed;
      if (trolleyX >= 640 && trolleyX < 700 && !hit) {
        // Hit main track people
        hit = true;
        hitType = 'main';
        createCrashParticles(trolleyX, trolleyY);
        socket.emit('hit', { track: 'main' });
      }
    }
  } else {
    if (trolleyX < 400) {
      trolleyX += trolleySpeed;
    } else if (trolleyX < 700) {
      trolleyX += trolleySpeed;
      trolleyY += (320 - 200) / (700 - 400) * trolleySpeed;
      if (trolleyX >= 640 && trolleyX < 700 && !hit) {
        // Hit side track person
        hit = true;
        hitType = 'side';
        createCrashParticles(trolleyX, trolleyY);
        socket.emit('hit', { track: 'side' });
      }
    }
  }
}

function draw() {
  ctx.save();

  // Screen shake effect during crash
  if (hit && hitAnimFrame < 30) {
    shakeOffset.x = (Math.random() - 0.5) * (30 - hitAnimFrame) * 0.5;
    shakeOffset.y = (Math.random() - 0.5) * (30 - hitAnimFrame) * 0.5;
    ctx.translate(shakeOffset.x, shakeOffset.y);

    // Flash effect
    if (hitAnimFrame < 10) {
      flashFrame++;
      if (flashFrame % 4 < 2) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(-shakeOffset.x, -shakeOffset.y, canvas.width, canvas.height);
      }
    }
  }

  ctx.clearRect(-50, -50, canvas.width + 100, canvas.height + 100);
  drawBackground();
  drawTracks();
  drawPeople(hit && hitAnimFrame < 30, hitType);

  if (hit && hitAnimFrame < 30) {
    // Animate trolley squish and slow down
    let squish = 1 - 0.02 * hitAnimFrame;
    drawTrolley(trolleyX, trolleyY, squish);
    hitAnimFrame++;
  } else {
    drawTrolley(trolleyX, trolleyY);
  }

  // Draw crash particles
  drawCrashParticles();
  updateCrashParticles();

  ctx.restore();
}

function animate() {
  updateTrolley();
  draw();
  if (simulationRunning) {
    animationId = requestAnimationFrame(animate);
  }
}

function startSimulation() {
  if (!simulationRunning) {
    simulationRunning = true;
    document.getElementById('startBtn').disabled = true;
    document.getElementById('resetBtn').disabled = false;
    document.getElementById('aiResponse').textContent = 'Simulation started. Waiting for AI decision...';
    document.getElementById('polishTranslation').textContent = 'Waiting for translation...';
    animate();
  }
}

function resetSimulation() {
  simulationRunning = false;
  if (animationId) {
    cancelAnimationFrame(animationId);
  }

  // Reset all variables to initial state
  trolleyX = 100;
  trolleyY = 180;
  atSwitch = false;
  hit = false;
  hitType = null;
  hitAnimFrame = 0;
  crashParticles = [];
  shakeOffset = { x: 0, y: 0 };
  flashFrame = 0;
  waitingForDecision = false;
  decisionReceived = false;
  switchTrack = false;

    // Reset UI
  document.getElementById('startBtn').disabled = false;
  document.getElementById('resetBtn').disabled = true;
  document.getElementById('track').textContent = 'Main';
  document.getElementById('aiResponse').textContent = 'Waiting for simulation to start...';
  document.getElementById('polishTranslation').textContent = 'Waiting for translation...';

  // Draw initial state
  draw();
}

socket.on('switch', (data) => {
  // Handle both old format (boolean) and new format (object)
  if (typeof data === 'boolean') {
    switchTrack = data;
  } else {
    switchTrack = data.decision;
    // Update AI response display
    if (data.fullResponse) {
      document.getElementById('aiResponse').textContent = `[${data.model}]\n\n${data.fullResponse}`;
    }
  }

  decisionReceived = true;
  waitingForDecision = false;
  console.log('AI decision received:', switchTrack ? 'Switch to side track' : 'Stay on main track');
  document.getElementById('track').textContent = switchTrack ? 'Side' : 'Main';
});

// Listen for Polish translation
socket.on('translation', (data) => {
  if (data.polish) {
    document.getElementById('polishTranslation').textContent = data.polish;
    console.log('Polish translation received');
  }
});

// Load configuration and display AI model and prompt
fetch('/config')
  .then(response => response.json())
  .then(config => {
    document.getElementById('model').textContent = config.aiModel.toUpperCase();
    document.getElementById('prompt').textContent = config.prompt;
    document.getElementById('promptField').value = config.prompt;
    document.getElementById('people').textContent = `${config.mainTrackPeople} on main track, ${config.sideTrackPeople} on side track`;
    mainTrackPeople = config.mainTrackPeople;
    sideTrackPeople = config.sideTrackPeople;

    // Set the dropdown to the current model
    document.getElementById('aiModelSelect').value = config.aiModel.toLowerCase();

    // Set the people count fields
    document.getElementById('mainTrackPeople').value = mainTrackPeople;
    document.getElementById('sideTrackPeople').value = sideTrackPeople;

    console.log(`Loaded config: ${mainTrackPeople} people on main track, ${sideTrackPeople} on side track`);
  })
  .catch(error => {
    console.error('Error loading config:', error);
    document.getElementById('model').textContent = 'Unknown';
    document.getElementById('prompt').textContent = 'Failed to load prompt';
    document.getElementById('people').textContent = 'Failed to load';
  });function changeAIModel() {
  const selectedModel = document.getElementById('aiModelSelect').value;

  fetch('/set-model', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model: selectedModel })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      document.getElementById('model').textContent = selectedModel.toUpperCase();
      console.log(`AI model changed to: ${selectedModel}`);
    } else {
      console.error('Failed to change AI model:', data.error);
    }
  })
  .catch(error => {
    console.error('Error changing AI model:', error);
  });
}

function updatePrompt() {
  const newPrompt = document.getElementById('promptField').value;
  // Update the display immediately
  document.getElementById('prompt').textContent = newPrompt;

  // Send to server to update the configuration
  fetch('/set-prompt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt: newPrompt })
  })
  .then(response => response.json())
  .then(result => {
    console.log('Prompt updated:', result.message);
  })
  .catch(error => {
    console.error('Error updating prompt:', error);
  });
}

function updatePeopleCount() {
  const newMainTrackPeople = parseInt(document.getElementById('mainTrackPeople').value);
  const newSideTrackPeople = parseInt(document.getElementById('sideTrackPeople').value);

  // Update the variables and display
  mainTrackPeople = newMainTrackPeople;
  sideTrackPeople = newSideTrackPeople;

  document.getElementById('people').textContent = `${mainTrackPeople} on main track, ${sideTrackPeople} on side track`;

  // Redraw the canvas if simulation is not running
  if (!simulationRunning) {
    draw();
  }

  console.log(`People count updated: ${mainTrackPeople} on main track, ${sideTrackPeople} on side track`);
}

// Set up button event listeners
document.getElementById('startBtn').addEventListener('click', startSimulation);
document.getElementById('resetBtn').addEventListener('click', resetSimulation);
document.getElementById('aiModelSelect').addEventListener('change', changeAIModel);
document.getElementById('promptField').addEventListener('input', updatePrompt);
document.getElementById('mainTrackPeople').addEventListener('input', updatePeopleCount);
document.getElementById('sideTrackPeople').addEventListener('input', updatePeopleCount);

// Draw initial state without starting animation
draw();