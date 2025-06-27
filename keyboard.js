// keyboard.js - Tastatursteuerung
// Copyright (C) 2023-2025 Marko Klingner
// GNU GPL v3 - https://www.gnu.org/licenses/gpl-3.0.html

const KEY_MAP = {
    81: 'quit', 72: 'highscore', 57: 'cheat9', 68: 'cheatd', 27: 'escape',
    13: 'action', 32: 'action', 80: 'play', 36: 'pos1', 76: 'look',
    38: 'up', 40: 'down', 37: 'left', 39: 'right'
};

const DIRECTIONS = ['up', 'down', 'left', 'right'];

function kb_press(e) {
    let handled = false;
    const action = KEY_MAP[e.keyCode || e.which];
    
    if (state === 'input') {
        if (e.key === 'Backspace') input = e.key;
        return;
    }

    switch (action) {
        case 'quit': // Q - Quit
            if (state === 'play' || state === 'init') {
                idle_stop();
                resetGame();
                state = 'menu';
                menuDraw();
            }
            handled = true;
            break;

        case 'highscore': // H - Highscore
            if (state === 'menu') {
                state = 'highscore';
                highscoreDraw();
            }
            handled = true;
            break;

        case 'cheat9': // 9 - Cheat Teil 1
            cheat_tmp = '9' + cheat_tmp;
            handled = true;
            break;

        case 'cheatd': // D - Cheat Teil 2
            cheat_tmp += 'd';
            if (cheat_tmp === '99d') {
                digger_cheat = !digger_cheat;
                cheat_tmp = '';
            }
            handled = true;
            break;

        case 'escape': // ESC
            if (state === 'play') digger_death = true;
            else if (state === 'highscore' || state === 'look') {
                state = 'menu';
                menuDraw();
            }
            handled = true;
            break;

        case 'action': // Enter/Space
            if (state === 'play' && digger_death) {
                if (score_leben < LEBENMIN) {
                    state = 'highscore';
                    highscoreDraw();
                    resetGame();
                } else {
                    state = 'init';
                    init_room(score_raum);
                }
                storageGameSave();
            } else if (state === 'highscore') {
                state = 'menu';
                menuDraw();
            }
            handled = true;
            break;

        case 'play': // P - Play
            if (state === 'menu') {
                try { audioContext.resume(); }
                catch (ex) { initAudio(); }
                storageGameRestore();
                state = 'init';
                init_room(score_raum);
            }
            handled = true;
            break;

        case 'pos1': // Pos1 - Level wechseln (Cheat)
            if (digger_cheat && (state === 'play' || state === 'init')) {
                changeLevel(e.shiftKey ? -1 : 1);
            }
            handled = true;
            break;

        case 'look': // L - Look Mode
            if (state === 'menu') {
                state = 'look';
                init_room(score_raum);
            } else if (state === 'look') {
                changeLevel(e.shiftKey ? -1 : 1);
            }
            handled = true;
            break;

        case 'up': case 'down': case 'left': case 'right': // Richtungstasten
            setDirection(action);
            handled = true;
            break;
    }

    if (handled) e.preventDefault();
}

function kb_release(e) {
    if (state === 'input') return;
    const action = KEY_MAP[e.keyCode || e.which];
    if (DIRECTIONS.includes(action)) releaseDirection(action);
}

// Hilfsfunktionen
function resetGame() {
    score_punkte = 0;
    score_leben = LEBENMAX;
    score_raum = 1;
    storageGameSave();
    init_room(score_raum);
}

function changeLevel(delta) {
    const newRoom = score_raum + delta;
    if (newRoom >= 1 && newRoom <= room.length) {
        idle_stop();
        score_raum = newRoom;
        state = 'init';
        init_room(score_raum);
        storageGameSave();
    }
}

function setDirection(dir) {
    const startVar = `digger_start_${dir}`;
    if (!window[startVar]) {
        window[`digger_${dir}`] = true;
        digger_go = dir.toUpperCase();
        digger_idle = false;
        window[startVar] = true;
    }
}

function releaseDirection(dir) {
    const startVar = `digger_start_${dir}`;
    if (window[startVar]) {
        setTimeout(() => releaseDirection(dir), 10);
    } else {
        window[`digger_${dir}`] = false;
        // Nächste aktive Richtung finden
        const activeDir = DIRECTIONS.find(d => window[`digger_${d}`]);
        digger_go = activeDir ? activeDir.toUpperCase() : 'NONE';
    }
}

function kb_unpress() {
    // Alle Richtungen stoppen (für Touch-Release)
    DIRECTIONS.forEach(releaseDirection);
}
