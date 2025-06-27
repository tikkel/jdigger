// jdigger/Digger.JS - Keyboard support
// Copyright (C) 2022–2025  Marko Klingner
// GNU GPL v3 - https://www.gnu.org/licenses/gpl-3.0.html


// Keyboard State Variablen
var keyboardEnabled = true;
var keyboardType = 'standard';

// Key States - kombiniert in Arrays für einfachere Verwaltung
var prevKeys = {
    left: false, right: false, up: false, down: false,
    A: false, B: false, X: false, Y: false, L1: false, R1: false
};
var currKeys = {
    left: false, right: false, up: false, down: false,
    A: false, B: false, X: false, Y: false, L1: false, R1: false
};

// Key-Mapping für Arrow Keys Layout
var KEY_MAPPING = {
    left: ['ArrowLeft'],
    right: ['ArrowRight'],
    up: ['ArrowUp'],
    down: ['ArrowDown'],
    A: ['Escape'],
    B: ['Space', 'Enter'],
    X: ['x', 'X'],
    Y: ['y', 'Y'],
    L1: ['Shift', 'ShiftLeft', 'ShiftRight'],
    R1: ['Control', 'ControlLeft', 'ControlRight']
};

// Aktuell gedrückte Tasten verfolgen
var pressedKeys = new Set();

// Optimierte Key-Prüfung
function isKeyMapped(key, action) {
    return KEY_MAPPING[action] && KEY_MAPPING[action].includes(key);
}

// State-Verwaltung
function updateKeyStates() {
    // Previous State kopieren
    Object.assign(prevKeys, currKeys);
}

function checkKeyPress(key) {
    return currKeys[key] && !prevKeys[key];
}

function checkKeyRelease(key) {
    return !currKeys[key] && prevKeys[key];
}

// Kompakte Movement-Behandlung
function keyboardHandleMovement() {
    const movements = [
        { curr: 'left', prev: 'left', press: kb_press_left, release: kb_release_left },
        { curr: 'right', prev: 'right', press: kb_press_right, release: kb_release_right },
        { curr: 'up', prev: 'up', press: kb_press_up, release: kb_release_up },
        { curr: 'down', prev: 'down', press: kb_press_down, release: kb_release_down }
    ];
    
    movements.forEach(({ curr, prev, press, release }) => {
        if (currKeys[curr] && !prevKeys[prev]) press();
        else if (!currKeys[curr] && prevKeys[prev]) release();
    });
}

// Vereinfachte Action-Handler mit weniger Code-Duplikation
var ACTION_HANDLERS = {
    play: function() {
        keyboardHandleMovement();
        
        if (checkKeyPress('B')) {
            if (digger_death) {
                if (score_leben < LEBENMIN) {
                    state = 'highscore';
                    highscoreDraw();
                    score_punkte = 0;
                    score_leben = LEBENMAX;
                    score_raum = 1;
                } else {
                    state = 'init';
                    init_room(score_raum);
                }
                storageGameSave();
            } else {
                digger_death = true;
            }
        }
        
        if (checkKeyPress('A')) {
            keyboardBackToMenu();
        }
    },
    
    init: function() {
        if (checkKeyPress('A')) {
            keyboardBackToMenu();
        }
    },
    
    menu: function() {
        if (checkKeyPress('B')) {
            storageGameRestore();
            state = 'init';
            init_room(score_raum);
        }
        if (checkKeyPress('X')) {
            state = 'highscore';
            highscoreDraw();
        }
        if (checkKeyPress('Y')) {
            state = 'look';
            init_room(score_raum);
        }
    },
    
    look: function() {
        if ((checkKeyPress('Y') || checkKeyPress('R1')) && score_raum < room.length) {
            score_raum++;
            init_room(score_raum);
        }
        if (checkKeyPress('L1') && score_raum > 1) {
            score_raum--;
            init_room(score_raum);
        }
        if (checkKeyPress('A')) {
            state = 'menu';
            menuDraw();
        }
    },
    
    highscore: function() {
        if (checkKeyPress('A')) {
            state = 'menu';
            menuDraw();
        }
    }
};

// Hilfsfunktion für Menu-Rückkehr
function keyboardBackToMenu() {
    idle_stop();
    state = 'menu';
    score_punkte = 0;
    score_leben = LEBENMAX;
    score_raum = 1;
    storageGameSave();
    init_room(score_raum);
    menuDraw();
}

// Key Down Handler
function keyboardKeyDown(e) {
    if (!keyboardEnabled || state === 'input') return;
    
    const key = e.code || e.key;
    
    // Verhindere Standardverhalten für Spieltasten
    if (Object.values(KEY_MAPPING).flat().includes(key)) {
        e.preventDefault();
    }
    
    // Key zu gedrückten Tasten hinzufügen
    pressedKeys.add(key);
    
    // Audio Context Resume (falls nötig)
    try {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    } catch (error) {
        try {
            initAudio();
        } catch (e) {
            // Audio-Init fehlgeschlagen, ignorieren
        }
    }
}

// Key Up Handler
function keyboardKeyUp(e) {
    if (!keyboardEnabled) return;
    
    const key = e.code || e.key;
    
    // Key aus gedrückten Tasten entfernen
    pressedKeys.delete(key);
}

// Optimierte Key-State-Update-Funktion
function updateKeyboardStates() {
    // Previous state sichern
    updateKeyStates();
    
    // Aktuelle Zustände basierend auf gedrückten Tasten setzen
    Object.keys(currKeys).forEach(action => {
        currKeys[action] = KEY_MAPPING[action] && 
                          KEY_MAPPING[action].some(key => pressedKeys.has(key));
    });
}

// Hauptupdate-Funktion
function keyboardUpdate() {
    if (!keyboardEnabled || state === 'input') return;
    
    // Key-States aktualisieren
    updateKeyboardStates();
    
    // State-Handler aufrufen
    if (ACTION_HANDLERS[state]) {
        ACTION_HANDLERS[state]();
    }
}

// Keyboard aktivieren/deaktivieren
function keyboardEnable() {
    keyboardEnabled = true;
    if (state === 'menu') menuDraw();
    console.log('Keyboard aktiviert');
}

function keyboardDisable() {
    keyboardEnabled = false;
    pressedKeys.clear();
    Object.keys(currKeys).forEach(key => {
        currKeys[key] = false;
        prevKeys[key] = false;
    });
    console.log('Keyboard deaktiviert');
}

// Focus-Event Handler für bessere Kontrolle
function keyboardFocusIn() {
    keyboardEnable();
}

function keyboardFocusOut() {
    // Keys als nicht gedrückt markieren bei Fokus-Verlust
    pressedKeys.clear();
    Object.keys(currKeys).forEach(key => {
        currKeys[key] = false;
    });
}

// Initialisierung
function initKeyboard() {
    keyboardEnabled = true;
    keyboardType = 'standard';
    
    // States zurücksetzen
    Object.keys(currKeys).forEach(key => {
        currKeys[key] = false;
        prevKeys[key] = false;
    });
    pressedKeys.clear();
    
    console.log('Keyboard initialisiert');
}

// // Event Listeners
// document.addEventListener('keydown', keyboardKeyDown);
// document.addEventListener('keyup', keyboardKeyUp);
// window.addEventListener('focus', keyboardFocusIn);
// window.addEventListener('blur', keyboardFocusOut);

// // Verhindere Kontextmenü bei bestimmten Tasten
// document.addEventListener('contextmenu', function(e) {
//     if (keyboardEnabled && Object.values(KEY_MAPPING).flat().includes(e.key)) {
//         e.preventDefault();
//     }
// });

// // Initialisierung beim Laden
// initKeyboard();