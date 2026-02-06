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
    const games = ['recall', 'vision', 'siuuu'];
    const names = { recall: 'Position Recall', vision: '3D Vision', siuuu: 'SIUUU!' };
    const icons = { recall: 'O', vision: '^', siuuu: 'CR7' };

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

// Striker/Midfielder starting positions (normalized 0-1)
const PLAYER_POSITIONS = [
    { x: 0.5, y: 0.7, name: 'Central striker' },
    { x: 0.3, y: 0.65, name: 'Left wing' },
    { x: 0.7, y: 0.65, name: 'Right wing' },
    { x: 0.5, y: 0.55, name: 'Attacking mid' },
    { x: 0.35, y: 0.5, name: 'Left mid' },
    { x: 0.65, y: 0.5, name: 'Right mid' },
    { x: 0.4, y: 0.75, name: 'Left edge of box' },
    { x: 0.6, y: 0.75, name: 'Right edge of box' },
];

function draw3DView() {
    const w = canvas.width;
    const h = canvas.height;
    const horizon = h * 0.35;

    // Sky
    ctx.fillStyle = '#6aaddb';
    ctx.fillRect(0, 0, w, horizon);

    // Grass
    ctx.fillStyle = '#2d8a4e';
    ctx.fillRect(0, horizon, w, h - horizon);

    // Simple perspective lines
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;

    // Sidelines converging to center
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w / 2, horizon);
    ctx.moveTo(w, h);
    ctx.lineTo(w / 2, horizon);
    ctx.stroke();

    // Horizontal depth lines
    for (let i = 1; i <= 5; i++) {
        const t = i / 6;
        const y = horizon + (h - horizon) * t;
        const spread = t;
        ctx.beginPath();
        ctx.moveTo(w / 2 - w * 0.5 * spread, y);
        ctx.lineTo(w / 2 + w * 0.5 * spread, y);
        ctx.stroke();
    }

    // Draw each player directly
    for (const p of actualPlayers) {
        draw3DPlayerDirect(p);
    }

    // Debug: show player count
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Players: ${actualPlayers.length}`, 10, h - 10);
}

function draw3DPlayerDirect(player) {
    const w = canvas.width;
    const h = canvas.height;
    const horizon = h * 0.35;

    // Calculate how far "forward" the player is from viewer
    // Viewer looks toward top of screen (lower Y values)
    const forwardDist = viewerPosition.y - player.y;
    const sideDist = player.x - viewerPosition.x;

    // Skip if behind viewer
    if (forwardDist < 10) return;

    // Convert to screen position
    // Far away (large forwardDist) = near horizon, small size
    // Close (small forwardDist) = near bottom, large size
    const maxDist = viewerPosition.y - 15; // Max possible forward distance
    const t = Math.min(forwardDist / maxDist, 1); // 0 = close, 1 = far

    // Screen Y: interpolate from bottom to horizon
    const screenY = horizon + (h - horizon - 20) * (1 - t);

    // Screen X: side position, compressed when far
    const compression = 0.3 + 0.7 * (1 - t);
    const screenX = w / 2 + sideDist * compression * 1.5;

    // Size: bigger when close
    const size = 15 + 35 * (1 - t);

    // Draw shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(screenX, screenY + 3, size * 0.6, size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw body (oval)
    ctx.fillStyle = player.team === 'A' ? '#e63946' : '#87CEEB';
    ctx.beginPath();
    ctx.ellipse(screenX, screenY - size * 0.5, size * 0.4, size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Border for Soleil
    if (player.team === 'B') {
        ctx.strokeStyle = '#1e3a5f';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Draw head
    ctx.fillStyle = '#f0c8b8';
    ctx.beginPath();
    ctx.arc(screenX, screenY - size * 1.1, size * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Number
    if (size > 20) {
        ctx.fillStyle = player.team === 'A' ? 'white' : '#1e3a5f';
        ctx.font = `bold ${Math.floor(size * 0.35)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.number.toString(), screenX, screenY - size * 0.5);
    }
}

function draw3DFieldLines() {
    // Field lines are now drawn in draw3DView
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
    ctx.ellipse(x, y + size * 0.1, size * 0.6, size * 0.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fill();

    // Simple player figure
    const bodyH = size * 1.8;

    // Legs
    ctx.fillStyle = '#222';
    ctx.fillRect(x - size * 0.25, y - bodyH * 0.3, size * 0.2, bodyH * 0.3);
    ctx.fillRect(x + size * 0.05, y - bodyH * 0.3, size * 0.2, bodyH * 0.3);

    // Body/Jersey
    ctx.fillStyle = player.team === 'A' ? COLORS.teamA : COLORS.teamB;
    ctx.beginPath();
    ctx.ellipse(x, y - bodyH * 0.5, size * 0.4, bodyH * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Jersey border for Soleil
    if (player.team === 'B') {
        ctx.strokeStyle = COLORS.teamBDark;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Head
    ctx.beginPath();
    ctx.arc(x, y - bodyH * 0.78, size * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = '#e8c4b0';
    ctx.fill();

    // Hair
    ctx.beginPath();
    ctx.arc(x, y - bodyH * 0.82, size * 0.22, Math.PI, 0, false);
    ctx.fillStyle = player.team === 'A' ? '#2a1a0a' : '#4a3a2a';
    ctx.fill();

    // Number on jersey
    if (player.number && size > 15) {
        ctx.fillStyle = player.team === 'A' ? 'white' : COLORS.teamBDark;
        ctx.font = `bold ${Math.max(9, size * 0.4)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.number.toString(), x, y - bodyH * 0.5);
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

    // Available space in front of viewer
    const minY = fieldTop + 30;
    const maxY = viewerPosition.y - 40;
    const yRange = maxY - minY;

    // If not enough room, adjust viewer position
    if (yRange < 50) {
        viewerPosition.y = fieldBottom - 50;
    }

    for (let i = 0; i < numPerTeam * 2; i++) {
        const team = i < numPerTeam ? 'A' : 'B';
        const number = i < numPerTeam ? i + 1 : i - numPerTeam + 1;

        // Distribute players across the visible area
        const row = Math.floor(i / 3);
        const col = i % 3;

        // Y position: spread from near to far
        const yT = 0.2 + (row * 0.3) + Math.random() * 0.2;
        const y = minY + (viewerPosition.y - 50 - minY) * yT;

        // X position: spread across width
        const xSpread = fieldWidth * 0.7;
        const x = viewerPosition.x + (col - 1) * (xSpread / 2) + (Math.random() - 0.5) * 40;

        // Clamp to field bounds
        const clampedX = Math.max(fieldLeft + 30, Math.min(fieldRight - 30, x));
        const clampedY = Math.max(minY, Math.min(viewerPosition.y - 40, y));

        actualPlayers.push({ x: clampedX, y: clampedY, team, number });
    }

    placedPlayers = [];
    gamePhase = 'viewing';

    // Debug: log player positions
    console.log('Viewer at:', viewerPosition);
    console.log('Players:', actualPlayers.map(p => ({ x: p.x, y: p.y, team: p.team })));

    // Draw 3D view
    draw3DView();

    // Position label
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, w, 30);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`YOUR VIEW: ${pos.name} | Viewer: (${Math.round(viewerPosition.x)}, ${Math.round(viewerPosition.y)})`, w / 2, 20);

    const numRed = actualPlayers.filter(p => p.team === 'A').length;
    const numBlue = actualPlayers.filter(p => p.team === 'B').length;
    showMessage(`Find ${numRed} RED + ${numBlue} BLUE players`);
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

// ============ SIUUU CELEBRATION GAME ============

let siuuuState = {
    phase: 'ready',     // ready, jumping, spinning, landing, siuuu, done, fail
    timing: 0,
    playerY: 0,
    playerRotation: 0,
    targetTime: 0,
    scores: { jump: 0, spin: 0, land: 0, siuuu: 0 },
    animationId: null
};

// Audio context for SIUUU sound
let audioCtx = null;

function playSiuuuSound() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Create a "SIUUU" sound effect
    const duration = 1.2;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    // Start high, sweep down then up - like "SIUUUUU!"
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(400, audioCtx.currentTime + 0.2);
    osc.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.8);
    osc.frequency.linearRampToValueAtTime(600, audioCtx.currentTime + duration);

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.3);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playFailSound() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
}

function setupSiuuuGame() {
    siuuuState = {
        phase: 'ready',
        timing: 0,
        playerY: 0,
        playerRotation: 0,
        targetTime: 0,
        scores: { jump: 0, spin: 0, land: 0, siuuu: 0 },
        animationId: null,
        hitTimes: []
    };

    gamePhase = 'playing';
    drawSiuuuScene();

    showMessage('Press SPACEBAR when the bar hits the green zone!');

    // Add keyboard listener
    document.addEventListener('keydown', handleSiuuuKey);
    canvas.onclick = handleSiuuuTap;

    // Start the sequence after a delay
    setTimeout(() => {
        if (!gameActive) return;
        startSiuuuSequence();
    }, 2000);
}

function handleSiuuuKey(e) {
    if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleSiuuuTap();
    }
}

function startSiuuuSequence() {
    siuuuState.phase = 'jumping';
    siuuuState.timing = 0;
    siuuuState.targetTime = 30;
    showMessage('SPACE to JUMP!');
    animateSiuuu();
}

function handleSiuuuTap() {
    if (!gameActive || siuuuState.phase === 'ready' || siuuuState.phase === 'done' || siuuuState.phase === 'fail') return;

    const timing = siuuuState.timing;
    const target = siuuuState.targetTime;
    const accuracy = Math.max(0, 1 - Math.abs(timing - target) / 20);

    if (siuuuState.phase === 'jumping') {
        siuuuState.scores.jump = Math.floor(accuracy * 100);
        if (accuracy > 0.3) {
            siuuuState.phase = 'spinning';
            siuuuState.timing = 0;
            siuuuState.targetTime = 40;
            showMessage('SPACE to SPIN!');
        } else {
            failSiuuu('jump');
        }
    } else if (siuuuState.phase === 'spinning') {
        siuuuState.scores.spin = Math.floor(accuracy * 100);
        if (accuracy > 0.3) {
            siuuuState.phase = 'landing';
            siuuuState.timing = 0;
            siuuuState.targetTime = 35;
            showMessage('SPACE to LAND!');
        } else {
            failSiuuu('spin');
        }
    } else if (siuuuState.phase === 'landing') {
        siuuuState.scores.land = Math.floor(accuracy * 100);
        if (accuracy > 0.3) {
            siuuuState.phase = 'siuuu';
            siuuuState.timing = 0;
            siuuuState.targetTime = 25;
            showMessage('SPACE for SIUUUUU!');
        } else {
            failSiuuu('land');
        }
    } else if (siuuuState.phase === 'siuuu') {
        siuuuState.scores.siuuu = Math.floor(accuracy * 100);
        if (accuracy > 0.2) {
            successSiuuu();
        } else {
            failSiuuu('siuuu');
        }
    }
}

function failSiuuu(phase) {
    siuuuState.phase = 'fail';
    siuuuState.failType = phase;
    playFailSound();
    showMessage(getFailMessage(phase));

    setTimeout(() => {
        finishSiuuuRound();
    }, 2000);
}

function getFailMessage(phase) {
    const messages = {
        jump: ['Oof! Tripped on the grass!', 'Jumped too early!', 'Legs got tangled!'],
        spin: ['Dizzy disaster!', 'Spin malfunction!', 'Lost balance mid-air!'],
        land: ['Faceplant!', 'Wobbly landing!', 'Knees gave out!'],
        siuuu: ['Voice crack!', 'Forgot the words!', 'Too quiet!']
    };
    const opts = messages[phase];
    return opts[Math.floor(Math.random() * opts.length)];
}

function successSiuuu() {
    siuuuState.phase = 'done';
    playSiuuuSound();
    showMessage('SIUUUUUU! Perfect!');

    setTimeout(() => {
        finishSiuuuRound();
    }, 2000);
}

function finishSiuuuRound() {
    canvas.onclick = null;
    document.removeEventListener('keydown', handleSiuuuKey);

    if (siuuuState.animationId) {
        cancelAnimationFrame(siuuuState.animationId);
    }

    const totalScore = siuuuState.scores.jump + siuuuState.scores.spin +
                       siuuuState.scores.land + siuuuState.scores.siuuu;
    score += totalScore;
    updateScore();

    showMessage(`Round score: +${totalScore}`);
    setTimeout(nextRound, 1500);
}

function animateSiuuu() {
    if (!gameActive) return;

    siuuuState.timing++;
    drawSiuuuScene();

    // Auto-fail if timing runs out
    if (siuuuState.timing > siuuuState.targetTime + 30) {
        if (siuuuState.phase !== 'done' && siuuuState.phase !== 'fail') {
            failSiuuu(siuuuState.phase);
            return;
        }
    }

    if (siuuuState.phase !== 'done' && siuuuState.phase !== 'fail') {
        siuuuState.animationId = requestAnimationFrame(animateSiuuu);
    } else {
        // Continue animation for result display
        drawSiuuuScene();
    }
}

function drawSiuuuScene() {
    const w = canvas.width;
    const h = canvas.height;

    // Stadium background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#1a1a2e');
    bgGrad.addColorStop(0.4, '#16213e');
    bgGrad.addColorStop(1, '#1a5c2e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Crowd (simple dots)
    ctx.fillStyle = 'rgba(255,200,150,0.3)';
    for (let i = 0; i < 100; i++) {
        const x = (i * 37) % w;
        const y = 20 + (i * 13) % (h * 0.3);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // Field
    ctx.fillStyle = '#2d8a4e';
    ctx.fillRect(0, h * 0.65, w, h * 0.35);

    // Draw Ronaldo
    drawRonaldo(w / 2, h * 0.65);

    // Timing indicator
    drawTimingBar();
}

function drawRonaldo(x, groundY) {
    const state = siuuuState;
    let y = groundY;
    let rotation = 0;
    let armAngle = 0;
    let scale = 1;

    // Calculate position based on phase
    if (state.phase === 'jumping' || state.phase === 'spinning' || state.phase === 'landing') {
        // Jump arc
        const jumpProgress = Math.min(1, state.timing / 60);
        const jumpHeight = Math.sin(jumpProgress * Math.PI) * 120;
        y = groundY - jumpHeight;

        if (state.phase === 'spinning') {
            rotation = (state.timing / 40) * Math.PI * 2;
        }
    } else if (state.phase === 'siuuu' || state.phase === 'done') {
        // Landed, arms out
        armAngle = Math.PI * 0.4;
        y = groundY;
    } else if (state.phase === 'fail') {
        // Funny fail pose
        if (state.failType === 'jump') {
            y = groundY + 10;
            rotation = Math.PI * 0.1;
        } else if (state.failType === 'spin') {
            rotation = Math.PI * 0.5 + Math.sin(state.timing * 0.3) * 0.3;
            y = groundY - 20;
        } else if (state.failType === 'land') {
            y = groundY + 5;
            rotation = Math.PI * 0.15;
            scale = 0.9;
        } else {
            armAngle = Math.PI * 0.2;
        }
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);

    const bodyH = 80;
    const bodyW = 30;

    // Shadow
    ctx.beginPath();
    ctx.ellipse(0, groundY - y + 5, 25, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();

    // Legs
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-12, 0, 10, 35);
    ctx.fillRect(2, 0, 10, 35);

    // Shorts
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-15, -5, 30, 15);

    // Torso (CR7 jersey - white with red accents for Portugal feel)
    ctx.fillStyle = '#c8102e';  // Portugal red
    ctx.beginPath();
    ctx.ellipse(0, -30, 18, 25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Number 7
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('7', 0, -30);

    // Arms
    ctx.strokeStyle = '#f0c8b8';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';

    // Left arm
    ctx.save();
    ctx.translate(-18, -35);
    ctx.rotate(-Math.PI * 0.3 - armAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 30);
    ctx.stroke();
    ctx.restore();

    // Right arm
    ctx.save();
    ctx.translate(18, -35);
    ctx.rotate(Math.PI * 0.3 + armAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 30);
    ctx.stroke();
    ctx.restore();

    // Head
    ctx.beginPath();
    ctx.arc(0, -60, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#f0c8b8';
    ctx.fill();

    // Hair (short, dark)
    ctx.fillStyle = '#2a1a0a';
    ctx.beginPath();
    ctx.arc(0, -65, 13, Math.PI, 0, false);
    ctx.fill();

    // Face expression
    if (state.phase === 'done' || state.phase === 'siuuu') {
        // Happy/shouting
        ctx.fillStyle = '#2a1a0a';
        ctx.beginPath();
        ctx.arc(-5, -62, 2, 0, Math.PI * 2);
        ctx.arc(5, -62, 2, 0, Math.PI * 2);
        ctx.fill();
        // Open mouth (shouting SIUUU)
        ctx.beginPath();
        ctx.arc(0, -55, 6, 0, Math.PI);
        ctx.fillStyle = '#8b0000';
        ctx.fill();
    } else if (state.phase === 'fail') {
        // Dizzy/sad
        ctx.fillStyle = '#2a1a0a';
        ctx.font = '12px Arial';
        ctx.fillText('X X', 0, -62);
        ctx.beginPath();
        ctx.arc(0, -54, 4, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.strokeStyle = '#2a1a0a';
        ctx.lineWidth = 2;
        ctx.stroke();
    } else {
        // Focused
        ctx.fillStyle = '#2a1a0a';
        ctx.beginPath();
        ctx.arc(-5, -62, 2, 0, Math.PI * 2);
        ctx.arc(5, -62, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();

    // SIUUU text effect when celebrating
    if (state.phase === 'done') {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SIUUUUU!', x, y - 130);
    }
}

function drawTimingBar() {
    const w = canvas.width;
    const h = canvas.height;
    const state = siuuuState;

    if (state.phase === 'done' || state.phase === 'fail' || state.phase === 'ready') return;

    const barW = w * 0.8;
    const barH = 25;
    const barX = (w - barW) / 2;
    const barY = h - 70;

    // Bar background
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barW, barH);

    // Target zone (green area) - make it more visible
    const targetX = barX + (state.targetTime / 70) * barW;
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(targetX - 20, barY, 40, barH);

    // Moving indicator (white bar)
    const indicatorX = barX + (state.timing / 70) * barW;
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(indicatorX - 4, barY - 8, 8, barH + 16);

    // Phase label with instruction
    const labels = {
        jumping: '>>> PRESS SPACE to JUMP! <<<',
        spinning: '>>> PRESS SPACE to SPIN! <<<',
        landing: '>>> PRESS SPACE to LAND! <<<',
        siuuu: '>>> PRESS SPACE for SIUUUUU! <<<'
    };
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(labels[state.phase] || '', w / 2, barY - 15);

    // Hint text
    ctx.font = '12px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('Hit SPACE when yellow bar reaches green zone', w / 2, barY + barH + 18);
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
        case 'siuuu':
            setupSiuuuGame();
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
    const games = ['recall', 'vision', 'siuuu'];
    const names = { recall: 'Position Recall', vision: '3D Vision', siuuu: 'SIUUU!' };

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
