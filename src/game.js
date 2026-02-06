// Soccer Vision Trainer - Game Logic
// Personalized for Kurt, Soleil FC Tokyo
// Created by Coach Pappa

const canvas = document.getElementById('field');
const ctx = canvas.getContext('2d');

// Player info
const PLAYER = {
    name: 'Kurt',
    team: 'Soleil',
    age: 11
};

// Game state
let currentGame = null;
let score = 0;
let level = 1;
let round = 0;
let maxRounds = 8;
let actualPlayers = [];      // Where players actually are
let placedPlayers = [];      // Where user placed them
let gamePhase = 'viewing';   // 'viewing', 'placing', 'results'
let gameActive = false;
let viewerPosition = { x: 0, y: 0 }; // For 3D view
let viewerAngle = 0; // Direction viewer is facing (radians, 0 = up/north)

// Field dimensions (in meters, scaled to canvas)
const FIELD = {
    width: 68,   // meters
    height: 52   // meters (half field roughly)
};

// Colors - Soleil: light blue with dark blue details
const COLORS = {
    field: '#2d8a4e',
    fieldDark: '#267040',
    lines: 'rgba(255,255,255,0.8)',
    teamA: '#e63946',      // Red (opponents)
    teamB: '#87CEEB',      // Soleil light blue (your team)
    teamBDark: '#1e3a5f',  // Soleil dark blue details
    teamALight: '#ff6b6b',
    teamBLight: '#b8e0f0',
    ghost: 'rgba(255,255,255,0.4)',
    correct: '#4CAF50',
    wrong: '#f44336',
    sky: '#87CEEB',
    grass: '#2d8a4e'
};

// ============ COACH PAPPA ============

const COACH_MESSAGES = [
    "Great players see the whole field before they get the ball. Train your eyes, Kurt!",
    "The best playmakers know where everyone is without looking. Let's sharpen that vision!",
    "Xavi, Iniesta, Modric - they all trained their spatial awareness. Your turn!",
    "Quick thinking starts with quick seeing. Train your brain to map the pitch!",
    "A Soleil player always knows where the pass is before receiving the ball!"
];

function drawCoachPappa() {
    const coachCanvas = document.getElementById('coach-avatar');
    if (!coachCanvas) return;

    const c = coachCanvas.getContext('2d');
    const w = coachCanvas.width;
    const h = coachCanvas.height;

    c.clearRect(0, 0, w, h);

    // Body/Blazer (navy blue)
    c.fillStyle = '#1e3a5f';
    c.beginPath();
    c.moveTo(w * 0.2, h);
    c.lineTo(w * 0.3, h * 0.55);
    c.lineTo(w * 0.5, h * 0.5);
    c.lineTo(w * 0.7, h * 0.55);
    c.lineTo(w * 0.8, h);
    c.closePath();
    c.fill();

    // Shirt collar (light blue - like in photo)
    c.fillStyle = '#e8f4f8';
    c.beginPath();
    c.moveTo(w * 0.38, h * 0.55);
    c.lineTo(w * 0.45, h * 0.65);
    c.lineTo(w * 0.5, h * 0.52);
    c.lineTo(w * 0.55, h * 0.65);
    c.lineTo(w * 0.62, h * 0.55);
    c.lineTo(w * 0.5, h * 0.48);
    c.closePath();
    c.fill();

    // Neck
    c.fillStyle = '#f5d0c5';
    c.fillRect(w * 0.43, h * 0.42, w * 0.14, h * 0.12);

    // Head
    c.beginPath();
    c.ellipse(w * 0.5, h * 0.32, w * 0.22, h * 0.22, 0, 0, Math.PI * 2);
    c.fillStyle = '#f5d0c5';
    c.fill();

    // Hair (short, light brown/blonde)
    c.fillStyle = '#b5915e';
    c.beginPath();
    c.ellipse(w * 0.5, h * 0.18, w * 0.2, h * 0.1, 0, 0, Math.PI, true);
    c.fill();

    // Side hair
    c.fillRect(w * 0.28, h * 0.2, w * 0.06, h * 0.12);
    c.fillRect(w * 0.66, h * 0.2, w * 0.06, h * 0.12);

    // Eyes
    c.fillStyle = '#4a6fa5';
    c.beginPath();
    c.arc(w * 0.4, h * 0.32, 4, 0, Math.PI * 2);
    c.arc(w * 0.6, h * 0.32, 4, 0, Math.PI * 2);
    c.fill();

    // Friendly smile
    c.strokeStyle = '#c4897a';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(w * 0.5, h * 0.38, w * 0.1, 0.1 * Math.PI, 0.9 * Math.PI);
    c.stroke();

    // Eyebrows
    c.strokeStyle = '#8b7355';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(w * 0.33, h * 0.26);
    c.lineTo(w * 0.45, h * 0.25);
    c.moveTo(w * 0.55, h * 0.25);
    c.lineTo(w * 0.67, h * 0.26);
    c.stroke();

    // Coach badge
    c.fillStyle = '#ffd700';
    c.beginPath();
    c.arc(w * 0.25, h * 0.65, 8, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#1e3a5f';
    c.font = 'bold 8px Arial';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('CP', w * 0.25, h * 0.65);
}

function showWelcome() {
    const message = COACH_MESSAGES[Math.floor(Math.random() * COACH_MESSAGES.length)];
    document.getElementById('welcome-message').innerHTML = `
        <p style="margin-bottom: 12px;"><strong>Coach Pappa here!</strong></p>
        <p>${message}</p>
    `;
    drawCoachPappa();
    updateWelcomeScores();
}

function updateWelcomeScores() {
    const games = ['recall', 'vision'];
    const names = { recall: 'Position Recall', vision: '3D Vision' };
    const icons = { recall: 'O', vision: '^' };

    let html = '';
    let hasScores = false;

    for (const g of games) {
        const s = parseInt(localStorage.getItem('highscore_' + g)) || 0;
        if (s > 0) hasScores = true;
        html += `
            <div class="score-item">
                <span class="game-name">${icons[g]} ${names[g]}</span>
                <span class="score-value">${s > 0 ? s : '-'}</span>
            </div>
        `;
    }

    document.getElementById('welcome-scores-list').innerHTML = html;

    // Hide scores section if no scores yet
    const scoresSection = document.getElementById('welcome-scores');
    if (!hasScores) {
        scoresSection.style.display = 'none';
    } else {
        scoresSection.style.display = 'block';
    }
}

function showMenu() {
    showScreen('menu-screen');
    updateHighScores();
}

// Initialize canvas
function initCanvas() {
    const container = document.getElementById('field-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientWidth * 0.75;
}

// ============ 2D FIELD RENDERING ============

function drawField2D() {
    const w = canvas.width;
    const h = canvas.height;
    const margin = 15;

    // Field background with subtle stripes
    ctx.fillStyle = COLORS.field;
    ctx.fillRect(0, 0, w, h);

    // Grass stripes
    ctx.fillStyle = COLORS.fieldDark;
    const stripeWidth = (w - margin * 2) / 10;
    for (let i = 0; i < 10; i += 2) {
        ctx.fillRect(margin + i * stripeWidth, margin, stripeWidth, h - margin * 2);
    }

    ctx.strokeStyle = COLORS.lines;
    ctx.lineWidth = 2;

    // Field boundary
    ctx.strokeRect(margin, margin, w - margin * 2, h - margin * 2);

    // Center line
    ctx.beginPath();
    ctx.moveTo(w / 2, margin);
    ctx.lineTo(w / 2, h - margin);
    ctx.stroke();

    // Center circle
    const centerRadius = Math.min(w, h) * 0.12;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, centerRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Center spot
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 3, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.lines;
    ctx.fill();

    // Penalty areas
    const penaltyW = (w - margin * 2) * 0.16;
    const penaltyH = h * 0.45;
    const penaltyY = (h - penaltyH) / 2;

    // Left penalty area
    ctx.strokeRect(margin, penaltyY, penaltyW, penaltyH);

    // Right penalty area
    ctx.strokeRect(w - margin - penaltyW, penaltyY, penaltyW, penaltyH);

    // Goal areas (6-yard box)
    const goalW = penaltyW * 0.4;
    const goalH = penaltyH * 0.5;
    const goalY = (h - goalH) / 2;

    ctx.strokeRect(margin, goalY, goalW, goalH);
    ctx.strokeRect(w - margin - goalW, goalY, goalW, goalH);
}

function drawPlayer2D(x, y, team, alpha = 1, number = null) {
    const radius = Math.min(canvas.width, canvas.height) * 0.04;

    ctx.globalAlpha = alpha;

    // Shadow
    ctx.beginPath();
    ctx.ellipse(x + 2, y + radius * 0.3, radius * 0.8, radius * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();

    // Player body
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = team === 'A' ? COLORS.teamA : COLORS.teamB;
    ctx.fill();

    // Border - Soleil has dark blue details
    ctx.strokeStyle = team === 'A' ? 'white' : COLORS.teamBDark;
    ctx.lineWidth = team === 'A' ? 2 : 3;
    ctx.stroke();

    // Number
    if (number !== null) {
        ctx.fillStyle = team === 'A' ? 'white' : COLORS.teamBDark;
        ctx.font = `bold ${radius}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(number.toString(), x, y);
    }

    ctx.globalAlpha = 1;
}

function drawGhostPlayer(x, y, team) {
    const radius = Math.min(canvas.width, canvas.height) * 0.04;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = team === 'A' ? COLORS.teamALight : COLORS.teamBLight;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Plus sign to indicate "tap to place"
    ctx.fillStyle = COLORS.ghost;
    ctx.font = `bold ${radius * 1.2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', x, y);
}

// ============ 3D FIRST-PERSON RENDERING ============

// Striker/Midfielder starting positions
// x, y are normalized 0-1 on field, lookY is where they look (0=top of field, 1=bottom)
const PLAYER_POSITIONS = [
    { x: 0.5, y: 0.65, lookY: 0.1, name: 'Central striker' },
    { x: 0.3, y: 0.6, lookY: 0.15, name: 'Left wing' },
    { x: 0.7, y: 0.6, lookY: 0.15, name: 'Right wing' },
    { x: 0.5, y: 0.5, lookY: 0.1, name: 'Attacking mid' },
    { x: 0.35, y: 0.45, lookY: 0.1, name: 'Left mid' },
    { x: 0.65, y: 0.45, lookY: 0.1, name: 'Right mid' },
    { x: 0.4, y: 0.7, lookY: 0.2, name: 'Left edge of box' },
    { x: 0.6, y: 0.7, lookY: 0.2, name: 'Right edge of box' },
    { x: 0.5, y: 0.35, lookY: 0.05, name: 'Center circle' },
];

function draw3DView() {
    const w = canvas.width;
    const h = canvas.height;
    const horizon = h * 0.35;

    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizon);
    skyGrad.addColorStop(0, '#4a90d9');
    skyGrad.addColorStop(1, '#87CEEB');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, horizon);

    // Grass
    const grassGrad = ctx.createLinearGradient(0, horizon, 0, h);
    grassGrad.addColorStop(0, '#1a5c2e');
    grassGrad.addColorStop(0.4, '#2d8a4e');
    grassGrad.addColorStop(1, '#3da55d');
    ctx.fillStyle = grassGrad;
    ctx.fillRect(0, horizon, w, h - horizon);

    // Draw field lines
    draw3DFieldLines();

    // Draw players (sorted far to near)
    const playersWithDepth = actualPlayers.map(p => {
        const screen = worldTo3DScreen(p.x, p.y);
        return { ...p, screen };
    }).filter(p => p.screen.valid).sort((a, b) => b.screen.depth - a.screen.depth);

    for (const player of playersWithDepth) {
        draw3DPlayer(player);
    }
}

function worldTo3DScreen(worldX, worldY) {
    const w = canvas.width;
    const h = canvas.height;
    const horizon = h * 0.35;

    // Vector from viewer to point
    const dx = worldX - viewerPosition.x;
    const dy = worldY - viewerPosition.y;

    // Distance forward (toward where viewer is looking = negative Y direction in canvas)
    // viewerAngle represents the Y coordinate the viewer is looking at
    // "Forward" means toward lower Y values (toward goal at top)
    const forward = viewerPosition.y - worldY;  // Positive = in front of viewer
    const right = worldX - viewerPosition.x;     // Positive = to the right

    if (forward < 10) {
        return { x: 0, y: 0, valid: false, size: 0, depth: forward };
    }

    // Perspective projection
    const focalLength = 250;
    const screenX = w / 2 + (right / forward) * focalLength;
    const screenY = horizon + (40 / forward) * focalLength;  // 40 = eye height feel

    // Size based on distance
    const size = Math.max(8, 200 / forward);

    return { x: screenX, y: screenY, valid: true, size, depth: forward };
}

function draw3DFieldLines() {
    const w = canvas.width;
    const h = canvas.height;
    const margin = 15;

    const fieldLeft = margin;
    const fieldRight = w - margin;
    const fieldTop = margin;
    const fieldBottom = h - margin;
    const fieldWidth = fieldRight - fieldLeft;
    const fieldHeight = fieldBottom - fieldTop;
    const centerX = w / 2;
    const centerY = h / 2;

    const penaltyW = fieldWidth * 0.16;
    const penaltyH = fieldHeight * 0.45;
    const penaltyTop = (h - penaltyH) / 2;
    const penaltyBottom = penaltyTop + penaltyH;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    function draw3DLine(x1, y1, x2, y2) {
        const p1 = worldTo3DScreen(x1, y1);
        const p2 = worldTo3DScreen(x2, y2);

        if (!p1.valid || !p2.valid) return;

        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = Math.max(1.5, 5 - Math.min(p1.depth, p2.depth) / 50);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }

    function draw3DCircle(cx, cy, radius) {
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        let started = false;

        for (let a = 0; a <= Math.PI * 2 + 0.1; a += Math.PI / 20) {
            const px = cx + Math.cos(a) * radius;
            const py = cy + Math.sin(a) * radius;
            const p = worldTo3DScreen(px, py);

            if (p.valid) {
                ctx.lineWidth = Math.max(1.5, 5 - p.depth / 50);
                if (!started) {
                    ctx.moveTo(p.x, p.y);
                    started = true;
                } else {
                    ctx.lineTo(p.x, p.y);
                }
            }
        }
        ctx.stroke();
    }

    // Field boundary
    draw3DLine(fieldLeft, fieldTop, fieldRight, fieldTop);
    draw3DLine(fieldRight, fieldTop, fieldRight, fieldBottom);
    draw3DLine(fieldRight, fieldBottom, fieldLeft, fieldBottom);
    draw3DLine(fieldLeft, fieldBottom, fieldLeft, fieldTop);

    // Center line (horizontal)
    draw3DLine(fieldLeft, centerY, fieldRight, centerY);

    // Center circle
    const centerRadius = Math.min(fieldWidth, fieldHeight) * 0.12;
    draw3DCircle(centerX, centerY, centerRadius);

    // Left penalty area (goal at top-left)
    draw3DLine(fieldLeft, penaltyTop, fieldLeft + penaltyW, penaltyTop);
    draw3DLine(fieldLeft + penaltyW, penaltyTop, fieldLeft + penaltyW, penaltyBottom);
    draw3DLine(fieldLeft + penaltyW, penaltyBottom, fieldLeft, penaltyBottom);

    // Right penalty area
    draw3DLine(fieldRight, penaltyTop, fieldRight - penaltyW, penaltyTop);
    draw3DLine(fieldRight - penaltyW, penaltyTop, fieldRight - penaltyW, penaltyBottom);
    draw3DLine(fieldRight - penaltyW, penaltyBottom, fieldRight, penaltyBottom);

    // Extra depth lines
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    for (let y = fieldTop + fieldHeight * 0.25; y < fieldBottom; y += fieldHeight * 0.25) {
        draw3DLine(fieldLeft, y, fieldRight, y);
    }
}

function worldTo3DScreen(worldX, worldY) {
    // Convert world coordinates to 3D screen position
    // worldX, worldY are in canvas 2D coordinates
    // viewerPosition is where the "camera" is

    const w = canvas.width;
    const h = canvas.height;
    const horizon = h * 0.4;

    // Calculate relative position to viewer
    const dx = worldX - viewerPosition.x;
    const dy = viewerPosition.y - worldY; // Invert Y (up is positive in world)

    // Distance from viewer
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDist = 30;
    const maxDist = canvas.height;

    // Normalize distance for depth calculation
    const depthFactor = Math.max(0.1, Math.min(1, (distance - minDist) / maxDist));

    // Screen Y position (closer = lower on screen)
    const screenY = horizon + (h - horizon) * (1 - depthFactor ** 0.7);

    // Screen X position based on angle
    const angle = Math.atan2(dx, dy);
    const screenX = w / 2 + Math.sin(angle) * w * 0.8 * (1 - depthFactor * 0.5);

    // Size based on distance
    const size = Math.min(canvas.width, canvas.height) * 0.15 * (1 - depthFactor * 0.7);

    return { x: screenX, y: screenY, size, distance, depthFactor };
}

function draw3DPlayer(player) {
    const screen = player.screen;
    if (!screen || !screen.valid) return;

    const x = screen.x;
    const y = screen.y;
    const size = screen.size;

    // Shadow
    ctx.beginPath();
    ctx.ellipse(x, y + 2, size * 0.5, size * 0.15, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();

    const bodyHeight = size * 2;
    const bodyWidth = size * 0.7;

    // Legs
    ctx.fillStyle = player.team === 'A' ? '#2a2a2a' : COLORS.teamBDark;
    ctx.fillRect(x - bodyWidth * 0.3, y - bodyHeight * 0.35, bodyWidth * 0.25, bodyHeight * 0.35);
    ctx.fillRect(x + bodyWidth * 0.05, y - bodyHeight * 0.35, bodyWidth * 0.25, bodyHeight * 0.35);

    // Torso (jersey)
    ctx.fillStyle = player.team === 'A' ? COLORS.teamA : COLORS.teamB;
    ctx.beginPath();
    ctx.ellipse(x, y - bodyHeight * 0.55, bodyWidth * 0.45, bodyHeight * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Soleil collar detail
    if (player.team === 'B') {
        ctx.fillStyle = COLORS.teamBDark;
        ctx.beginPath();
        ctx.ellipse(x, y - bodyHeight * 0.7, bodyWidth * 0.2, bodyHeight * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Head
    const headRadius = size * 0.3;
    ctx.beginPath();
    ctx.arc(x, y - bodyHeight * 0.82, headRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#f0c8b8';
    ctx.fill();

    // Hair
    ctx.fillStyle = player.team === 'A' ? '#3a2a1a' : '#5a4a3a';
    ctx.beginPath();
    ctx.arc(x, y - bodyHeight * 0.85, headRadius * 0.85, Math.PI, 0, false);
    ctx.fill();

    // Jersey number
    if (player.number && size > 12) {
        ctx.fillStyle = player.team === 'A' ? 'white' : COLORS.teamBDark;
        ctx.font = `bold ${Math.max(10, size * 0.45)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.number.toString(), x, y - bodyHeight * 0.55);
    }
}

// ============ GAME LOGIC ============

function generatePlayers(numTeamA, numTeamB) {
    const players = [];
    const margin = 40;
    const minDist = 50;

    function addPlayer(team, number) {
        let attempts = 0;
        let x, y, valid;

        do {
            valid = true;
            x = margin + Math.random() * (canvas.width - margin * 2);
            y = margin + Math.random() * (canvas.height - margin * 2);

            // Check distance from other players
            for (const p of players) {
                const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
                if (dist < minDist) valid = false;
            }

            // For 3D mode, avoid placing too close to viewer
            if (currentGame === 'vision') {
                const distFromViewer = Math.sqrt((x - viewerPosition.x) ** 2 + (y - viewerPosition.y) ** 2);
                if (distFromViewer < 60) valid = false;
            }

            attempts++;
        } while (!valid && attempts < 100);

        players.push({ x, y, team, number, placed: false });
    }

    // Add players
    for (let i = 0; i < numTeamA; i++) {
        addPlayer('A', i + 1);
    }
    for (let i = 0; i < numTeamB; i++) {
        addPlayer('B', i + 1);
    }

    return players;
}

// ============ RECALL MODE ============

function setupRecallGame() {
    // Number of players based on level
    const numPerTeam = 2 + Math.floor(level / 2);
    actualPlayers = generatePlayers(numPerTeam, numPerTeam);
    placedPlayers = [];

    gamePhase = 'viewing';

    // Show players
    drawField2D();
    actualPlayers.forEach(p => drawPlayer2D(p.x, p.y, p.team, 1, p.number));

    // Draw legend
    drawTeamLegend();

    const numRed = actualPlayers.filter(p => p.team === 'A').length;
    const numBlue = actualPlayers.filter(p => p.team === 'B').length;
    showMessage(`Study: ${numRed} RED opponents, ${numBlue} BLUE (Soleil)`);
    updatePlacementCount();

    // Viewing time decreases with level
    const viewTime = Math.max(4000 - level * 400, 1500);

    setTimeout(() => {
        if (!gameActive || gamePhase !== 'viewing') return;
        startRecallPlacement();
    }, viewTime);
}

function drawTeamLegend() {
    const w = canvas.width;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, w, 26);

    // Red team
    ctx.beginPath();
    ctx.arc(w * 0.25, 13, 8, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.teamA;
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = '11px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Opponents', w * 0.25 + 14, 17);

    // Blue team (Soleil)
    ctx.beginPath();
    ctx.arc(w * 0.65, 13, 8, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.teamB;
    ctx.fill();
    ctx.strokeStyle = COLORS.teamBDark;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'white';
    ctx.fillText('Soleil', w * 0.65 + 14, 17);
}

function startRecallPlacement() {
    gamePhase = 'placing';
    placedPlayers = [];

    drawField2D();
    drawTeamLegend();

    const totalA = actualPlayers.filter(p => p.team === 'A').length;
    showMessage(`First: place RED #1 (${totalA} opponents total)`);
    updatePlacementCount();

    canvas.onclick = handleRecallPlacement;
}

function handleRecallPlacement(e) {
    if (!gameActive || gamePhase !== 'placing') return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    // Determine which team to place next
    const placedA = placedPlayers.filter(p => p.team === 'A').length;
    const placedB = placedPlayers.filter(p => p.team === 'B').length;
    const totalA = actualPlayers.filter(p => p.team === 'A').length;
    const totalB = actualPlayers.filter(p => p.team === 'B').length;

    let team, number;
    if (placedA < totalA) {
        team = 'A';
        number = placedA + 1;
    } else if (placedB < totalB) {
        team = 'B';
        number = placedB + 1;
    } else {
        return; // All placed
    }

    placedPlayers.push({ x, y, team, number });

    // Redraw
    drawField2D();
    drawTeamLegend();
    placedPlayers.forEach(p => drawPlayer2D(p.x, p.y, p.team, 1, p.number));

    // Show what's next
    const remaining = actualPlayers.length - placedPlayers.length;
    updatePlacementCount();

    if (remaining > 0) {
        if (placedPlayers.length < totalA) {
            // Still placing red team
            showMessage(`Place RED #${placedA + 2} (${totalA - placedA - 1} red left)`);
        } else {
            // Now placing blue team
            const blueLeft = totalB - placedB - 1;
            if (placedB === 0) {
                showMessage(`Now BLUE (Soleil): place #1 (${totalB} total)`);
            } else {
                showMessage(`Place BLUE #${placedB + 2} (${blueLeft} blue left)`);
            }
        }
    } else {
        // All placed - show results
        canvas.onclick = null;
        showRecallResults();
    }
}

function showRecallResults() {
    gamePhase = 'results';

    drawField2D();
    drawTeamLegend();

    let totalScore = 0;
    const maxDistForPoint = 80;

    // Match placed players to actual players by team and number
    for (const actual of actualPlayers) {
        const placed = placedPlayers.find(p => p.team === actual.team && p.number === actual.number);

        if (placed) {
            const dist = Math.sqrt((actual.x - placed.x) ** 2 + (actual.y - placed.y) ** 2);
            const accuracy = Math.max(0, 1 - dist / maxDistForPoint);
            const points = Math.floor(accuracy * 100);
            totalScore += points;

            // Draw line from placed to actual
            ctx.beginPath();
            ctx.moveTo(placed.x, placed.y);
            ctx.lineTo(actual.x, actual.y);
            ctx.strokeStyle = accuracy > 0.5 ? COLORS.correct : COLORS.wrong;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw placed position (ghost)
            drawPlayer2D(placed.x, placed.y, placed.team, 0.4, placed.number);
        }

        // Draw actual position
        drawPlayer2D(actual.x, actual.y, actual.team, 1, actual.number);
    }

    score += totalScore;
    updateScore();

    const avgAccuracy = Math.floor(totalScore / actualPlayers.length);
    showMessage(`Accuracy: ${avgAccuracy}% average. +${totalScore} points`);

    setTimeout(nextRound, 2500);
}

// ============ VISION MODE (3D to 2D) ============

function setupVisionGame() {
    const w = canvas.width;
    const h = canvas.height;
    const margin = 15;
    const fieldLeft = margin;
    const fieldRight = w - margin;
    const fieldTop = margin;
    const fieldBottom = h - margin;
    const fieldWidth = fieldRight - fieldLeft;
    const fieldHeight = fieldBottom - fieldTop;

    // Pick a random striker/midfielder position
    const pos = PLAYER_POSITIONS[Math.floor(Math.random() * PLAYER_POSITIONS.length)];

    // Convert normalized position to canvas coordinates
    viewerPosition = {
        x: fieldLeft + pos.x * fieldWidth,
        y: fieldTop + pos.y * fieldHeight
    };

    // Generate players IN FRONT of viewer (toward goal = lower Y values)
    const numPerTeam = 2 + Math.floor(level / 2);
    actualPlayers = [];
    const minDist = 40;

    for (let i = 0; i < numPerTeam * 2; i++) {
        let attempts = 0;
        let x, y, valid;
        const team = i < numPerTeam ? 'A' : 'B';
        const number = i < numPerTeam ? i + 1 : i - numPerTeam + 1;

        do {
            valid = true;

            // Place players between viewer and the goal (top of field)
            // Forward distance (toward goal)
            const forwardDist = 40 + Math.random() * 150;
            // Side spread
            const sideSpread = (Math.random() - 0.5) * 200;

            x = viewerPosition.x + sideSpread;
            y = viewerPosition.y - forwardDist;  // Negative Y = toward goal

            // Keep within field
            if (x < fieldLeft + 25 || x > fieldRight - 25 ||
                y < fieldTop + 25 || y > viewerPosition.y - 30) {
                valid = false;
            }

            // Check distance from other players
            for (const p of actualPlayers) {
                const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
                if (dist < minDist) valid = false;
            }

            attempts++;
        } while (!valid && attempts < 80);

        if (valid) {
            actualPlayers.push({ x, y, team, number });
        }
    }

    placedPlayers = [];
    gamePhase = 'viewing';

    // Draw 3D view
    draw3DView();

    // Position label
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, w, 28);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`YOUR VIEW: ${pos.name}`, w / 2, 18);

    const numRed = actualPlayers.filter(p => p.team === 'A').length;
    const numBlue = actualPlayers.filter(p => p.team === 'B').length;
    showMessage(`Study: ${numRed} RED, ${numBlue} BLUE (Soleil)`);
    updatePlacementCount();

    const viewTime = Math.max(5000 - level * 400, 2500);

    setTimeout(() => {
        if (!gameActive || gamePhase !== 'viewing') return;
        startVisionPlacement();
    }, viewTime);
}

function startVisionPlacement() {
    gamePhase = 'placing';
    placedPlayers = [];

    drawField2D();
    drawTeamLegend();
    drawViewerMarker();

    const totalA = actualPlayers.filter(p => p.team === 'A').length;
    showMessage(`First: place RED #1 (${totalA} opponents total)`);
    updatePlacementCount();

    canvas.onclick = handleVisionPlacement;
}

function drawViewerMarker() {
    // Draw viewer position marker (triangle pointing in view direction)
    ctx.save();
    ctx.translate(viewerPosition.x, viewerPosition.y);
    ctx.rotate(viewerAngle + Math.PI/2);

    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(-8, 10);
    ctx.lineTo(8, 10);
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    // Draw FOV cone
    ctx.beginPath();
    ctx.moveTo(viewerPosition.x, viewerPosition.y);
    const fovAngle = Math.PI * 0.4;
    const fovDist = 150;
    ctx.lineTo(
        viewerPosition.x + Math.cos(viewerAngle + Math.PI/2 - fovAngle/2) * fovDist,
        viewerPosition.y + Math.sin(viewerAngle + Math.PI/2 - fovAngle/2) * fovDist
    );
    ctx.moveTo(viewerPosition.x, viewerPosition.y);
    ctx.lineTo(
        viewerPosition.x + Math.cos(viewerAngle + Math.PI/2 + fovAngle/2) * fovDist,
        viewerPosition.y + Math.sin(viewerAngle + Math.PI/2 + fovAngle/2) * fovDist
    );
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
}

function handleVisionPlacement(e) {
    if (!gameActive || gamePhase !== 'placing') return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    // Determine which team to place next
    const placedA = placedPlayers.filter(p => p.team === 'A').length;
    const placedB = placedPlayers.filter(p => p.team === 'B').length;
    const totalA = actualPlayers.filter(p => p.team === 'A').length;
    const totalB = actualPlayers.filter(p => p.team === 'B').length;

    let team, number;
    if (placedA < totalA) {
        team = 'A';
        number = placedA + 1;
    } else if (placedB < totalB) {
        team = 'B';
        number = placedB + 1;
    } else {
        return;
    }

    placedPlayers.push({ x, y, team, number });

    // Redraw field
    drawField2D();
    drawTeamLegend();
    drawViewerMarker();

    // Draw placed players
    placedPlayers.forEach(p => drawPlayer2D(p.x, p.y, p.team, 1, p.number));

    const remaining = actualPlayers.length - placedPlayers.length;
    updatePlacementCount();

    if (remaining > 0) {
        if (placedPlayers.length < totalA) {
            showMessage(`Place RED #${placedA + 2} (${totalA - placedA - 1} red left)`);
        } else {
            const blueLeft = totalB - placedB - 1;
            if (placedB === 0) {
                showMessage(`Now BLUE (Soleil): place #1 (${totalB} total)`);
            } else {
                showMessage(`Place BLUE #${placedB + 2} (${blueLeft} blue left)`);
            }
        }
    } else {
        canvas.onclick = null;
        showVisionResults();
    }
}

function showVisionResults() {
    gamePhase = 'results';

    drawField2D();
    drawTeamLegend();
    drawViewerMarker();

    let totalScore = 0;
    const maxDistForPoint = 100; // More lenient for 3D translation

    for (const actual of actualPlayers) {
        const placed = placedPlayers.find(p => p.team === actual.team && p.number === actual.number);

        if (placed) {
            const dist = Math.sqrt((actual.x - placed.x) ** 2 + (actual.y - placed.y) ** 2);
            const accuracy = Math.max(0, 1 - dist / maxDistForPoint);
            const points = Math.floor(accuracy * 120); // More points for harder mode
            totalScore += points;

            // Draw connection line
            ctx.beginPath();
            ctx.moveTo(placed.x, placed.y);
            ctx.lineTo(actual.x, actual.y);
            ctx.strokeStyle = accuracy > 0.4 ? COLORS.correct : COLORS.wrong;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw placed position (ghost)
            drawPlayer2D(placed.x, placed.y, placed.team, 0.4, placed.number);
        }

        // Draw actual position
        drawPlayer2D(actual.x, actual.y, actual.team, 1, actual.number);
    }

    score += totalScore;
    updateScore();

    const avgAccuracy = Math.floor(totalScore / actualPlayers.length);
    showMessage(`Accuracy: ${avgAccuracy}% average. +${totalScore} points`);

    setTimeout(nextRound, 2500);
}

// ============ GAME FLOW ============

function startGame(type) {
    currentGame = type;
    score = 0;
    level = 1;
    round = 0;
    gameActive = true;

    showScreen('game-screen');
    initCanvas();
    updateScore();
    nextRound();
}

function nextRound() {
    round++;

    if (round > maxRounds) {
        endGame();
        return;
    }

    // Level up every 2 rounds
    level = Math.floor((round - 1) / 2) + 1;
    updateScore();

    switch (currentGame) {
        case 'recall':
            setupRecallGame();
            break;
        case 'vision':
            setupVisionGame();
            break;
    }
}

function endGame() {
    gameActive = false;

    const key = 'highscore_' + currentGame;
    const current = parseInt(localStorage.getItem(key)) || 0;
    const isNewRecord = score > current;

    if (isNewRecord) {
        localStorage.setItem(key, score);
    }

    document.getElementById('result-title').textContent = isNewRecord ? 'New Record!' : 'Game Complete!';
    document.getElementById('result-stats').innerHTML = `
        <div>Final Score: <strong>${score}</strong></div>
        <div>Rounds Completed: ${round - 1}</div>
        <div>Max Level: ${level}</div>
        ${isNewRecord ? '<div style="color:#4CAF50">Personal Best!</div>' : `<div>Best: ${current}</div>`}
    `;

    showScreen('result-screen');
}

function restartGame() {
    startGame(currentGame);
}

function goToMenu() {
    gameActive = false;
    canvas.onclick = null;
    gamePhase = 'viewing';
    showScreen('menu-screen');
    updateHighScores();
}

// ============ UI HELPERS ============

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function showMessage(msg) {
    document.getElementById('game-message').textContent = msg;
}

function updateScore() {
    document.getElementById('score').textContent = 'Score: ' + score;
    document.getElementById('level').textContent = 'Level ' + level;
}

function updatePlacementCount() {
    const timerEl = document.getElementById('timer');
    if (gamePhase === 'placing') {
        const placed = placedPlayers.length;
        const total = actualPlayers.length;
        timerEl.textContent = `${placed}/${total}`;
    } else if (gamePhase === 'viewing') {
        timerEl.textContent = 'Watch!';
    } else {
        timerEl.textContent = '';
    }
}

function updateHighScores() {
    const games = ['recall', 'vision'];
    const names = { recall: 'Position Recall', vision: '3D Vision' };

    let html = '';
    for (const g of games) {
        const s = localStorage.getItem('highscore_' + g) || 0;
        html += `<div>${names[g]}: ${s}</div>`;
    }
    document.getElementById('scores-list').innerHTML = html;
}

// ============ INITIALIZE ============

window.addEventListener('resize', () => {
    if (document.getElementById('game-screen').classList.contains('active')) {
        initCanvas();
    }
});

// Show welcome screen on load
showWelcome();
