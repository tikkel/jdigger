// jdigger/Digger.JS - Gamepad support
// Copyright (C) 2022–2025  Marko Klingner
// GNU GPL v3 - https://www.gnu.org/licenses/gpl-3.0.html

// Gamepad State Variablen
var gamepadConnected = false;
var gamepadType = 'none';
var gamepadBrand = 'keyboard';
var gamepadDualrumble = false;
var gamepadIndex = 0;

// Button States
var prevButtons = {
    left: false, right: false, up: false, down: false,
    A: false, B: false, X: false, Y: false, L1: false, R1: false
};
var currButtons = {
    left: false, right: false, up: false, down: false,
    A: false, B: false, X: false, Y: false, L1: false, R1: false
};

// Controller-Typen mit Button-Mapping
var CONTROLLER_TYPES = {
    xbox: {
        name: 'Xbox',
        patterns: ['xbox', '045e', 'microsoft'],
        buttons: { action: 1, back: 0, option1: 3, option2: 2, shoulder_l: 4, shoulder_r: 5 }
    },
    sony: {
        name: 'PlayStation',
        patterns: ['054c', 'sony', 'playstation', 'dualshock', 'dualsense'],
        buttons: { action: 1, back: 0, option1: 2, option2: 3, shoulder_l: 4, shoulder_r: 5 }
    },
    nintendo: {
        name: 'Nintendo',
        patterns: ['nintendo', 'switch', 'joy-con', '057e'],
        buttons: { action: 1, back: 0, option1: 3, option2: 2, shoulder_l: 4, shoulder_r: 5 }
    },
    generic: {
        name: 'Generic',
        patterns: ['generic', 'unknown'],
        buttons: { action: 0, back: 1, option1: 3, option2: 2, shoulder_l: 4, shoulder_r: 5 }
    }
};

var currentController = CONTROLLER_TYPES.xbox;

// Richtungserkennung für verschiedene Gamepad-Typen
function gamepadGetDirections(gp) {
    var left = false, right = false, up = false, down = false;
    
    switch(gamepadType) {
        case '8axes':
            // Prüfe alle 3 möglichen Achsenpaare
            for(let i = 0; i < 6; i += 3) {
                left = left || gp.axes[i] < -0.5;
                right = right || gp.axes[i] > 0.5;
                up = up || gp.axes[i + 1] < -0.5;
                down = down || gp.axes[i + 1] > 0.5;
            }
            break;
            
        case '4axes':
            // D-Pad Buttons + Analoge Sticks
            left = gp.buttons[14]?.pressed || gp.axes[0] < -0.5 || gp.axes[2] < -0.5;
            right = gp.buttons[15]?.pressed || gp.axes[0] > 0.5 || gp.axes[2] > 0.5;
            up = gp.buttons[12]?.pressed || gp.axes[1] < -0.5 || gp.axes[3] < -0.5;
            down = gp.buttons[13]?.pressed || gp.axes[1] > 0.5 || gp.axes[3] > 0.5;
            break;
            
        case '2axes':
            left = gp.axes[0] < -0.5;
            right = gp.axes[0] > 0.5;
            up = gp.axes[1] < -0.5;
            down = gp.axes[1] > 0.5;
            break;
    }
    
    return { left, right, up, down };
}

// Button-Prüfung
function isButtonPressed(gamepad, buttonFunction) {
    const buttonIndex = currentController.buttons[buttonFunction];
    return gamepad.buttons[buttonIndex]?.pressed || gamepad.buttons[buttonIndex]?.value > 0.5;
}

// State-Verwaltung
function updateButtonStates() {
    Object.assign(prevButtons, currButtons);
}

function checkButtonPress(button) {
    return currButtons[button] && !prevButtons[button];
}

function checkButtonRelease(button) {
    return !currButtons[button] && prevButtons[button];
}

// Movement-Behandlung
function gamepadHandleMovement() {
    const movements = [
        { curr: 'left', prev: 'left', press: kb_press_left, release: kb_release_left },
        { curr: 'right', prev: 'right', press: kb_press_right, release: kb_release_right },
        { curr: 'up', prev: 'up', press: kb_press_up, release: kb_release_up },
        { curr: 'down', prev: 'down', press: kb_press_down, release: kb_release_down }
    ];
    
    movements.forEach(({ curr, prev, press, release }) => {
        if (currButtons[curr] && !prevButtons[prev]) press();
        else if (!currButtons[curr] && prevButtons[prev]) release();
    });
}

// Action-Handler für verschiedene Game-States
var ACTION_HANDLERS = {
    play: function() {
        gamepadHandleMovement();
        
        if (checkButtonPress('B')) {
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
        
        if (checkButtonPress('A')) {
            gamepadBackToMenu();
        }
    },
    
    init: function() {
        if (checkButtonPress('A')) {
            gamepadBackToMenu();
        }
    },
    
    menu: function() {
        if (checkButtonPress('B')) {
            storageGameRestore();
            state = 'init';
            init_room(score_raum);
        }
        if (checkButtonPress('X')) {
            state = 'highscore';
            highscoreDraw();
        }
        if (checkButtonPress('Y')) {
            state = 'look';
            init_room(score_raum);
        }
    },
    
    look: function() {
        if ((checkButtonPress('Y') || checkButtonPress('R1')) && score_raum < room.length) {
            score_raum++;
            init_room(score_raum);
        }
        if (checkButtonPress('L1') && score_raum > 1) {
            score_raum--;
            init_room(score_raum);
        }
        if (checkButtonPress('A')) {
            state = 'menu';
            menuDraw();
        }
    },
    
    highscore: function() {
        if (checkButtonPress('A')) {
            state = 'menu';
            menuDraw();
        }
    }
};

// Hilfsfunktion für Menu-Rückkehr
function gamepadBackToMenu() {
    idle_stop();
    state = 'menu';
    score_punkte = 0;
    score_leben = LEBENMAX;
    score_raum = 1;
    storageGameSave();
    init_room(score_raum);
    menuDraw();
}

// Controller-Erkennung
function detectControllerType(gamepad) {
    const id = gamepad.id.toLowerCase();
    
    // Durchsuche alle Controller-Typen nach Mustern
    for (const [type, config] of Object.entries(CONTROLLER_TYPES)) {
        if (config.patterns.some(pattern => id.includes(pattern))) {
            return config;
        }
    }
    
    return CONTROLLER_TYPES.xbox; // Fallback
}

// Gamepad-Typ-Detection
function detectGamepadType(gamepad) {
    const axesCount = gamepad.axes.length;
    const buttonCount = gamepad.buttons.length;
    
    if (axesCount >= 8) return '8axes';
    if (buttonCount >= 16 && axesCount === 4) return '4axes';
    if (buttonCount >= 6 && axesCount === 2) return '2axes';
    return 'none';
}

// Gamepad Connect Handler
function gamepadConnect(e) {
    gamepadConnected = true;
    gamepadIndex = e.gamepad.index;
    
    // Audio Context aktivieren
    try {
        audioContext.resume();
    } catch (e) {
        initAudio();
    }
    
    // Controller-Typ erkennen
    currentController = detectControllerType(e.gamepad);
    gamepadBrand = currentController.name.toLowerCase();
    gamepadType = detectGamepadType(e.gamepad);
    
    // Vibration testen
    if (!gamepadDualrumble) {
        try {
            if (e.gamepad.vibrationActuator && 
                typeof e.gamepad.vibrationActuator.playEffect === 'function') {
                e.gamepad.vibrationActuator.playEffect("dual-rumble", {
                    startDelay: 0, duration: 100, 
                    weakMagnitude: 1.0, strongMagnitude: 1.0
                });
                gamepadDualrumble = true;
            } else {
                gamepadDualrumble = false;
            }
        } catch (error) {
            gamepadDualrumble = false;
            console.log('Vibration nicht unterstützt:', error.message);
        }
    }
    
    // Button States zurücksetzen (erste Eingabe abfangen)
    Object.keys(currButtons).forEach(key => {
        if (key !== 'left' && key !== 'right' && key !== 'up' && key !== 'down') {
            prevButtons[key] = currButtons[key] = true;
        }
    });
    
    if (state === 'menu') menuDraw();
    
    console.log('Gamepad #%d verbunden: "%s" | Buttons: %d, Achsen: %d, Typ: %s, Marke: %s', 
        e.gamepad.index, e.gamepad.id, e.gamepad.buttons.length, 
        e.gamepad.axes.length, gamepadType, currentController.name);
}

// Gamepad Disconnect Handler
function gamepadDisconnect(e) {
    gamepadConnected = false;
    gamepadDualrumble = false;
    gamepadBrand = 'keyboard';
    gamepadIndex = 0;
    
    if (state === 'menu') menuDraw();
    console.log('Gamepad #%d getrennt: "%s"', e.gamepad.index, e.gamepad.id);
}

// Hauptupdate-Funktion
function gamepadUpdate() {
    if (!gamepadConnected || state === 'input') return;
    
    const gp = navigator.getGamepads()[gamepadIndex];
    if (!gp || !gp.connected) return;
    
    updateButtonStates(); // Previous state sichern
    
    // Richtungen lesen
    const directions = gamepadGetDirections(gp);
    Object.assign(currButtons, directions);
    
    // Action-Buttons lesen
    currButtons.A = isButtonPressed(gp, 'back');
    currButtons.B = isButtonPressed(gp, 'action');
    currButtons.X = isButtonPressed(gp, 'option2');
    currButtons.Y = isButtonPressed(gp, 'option1');
    currButtons.L1 = isButtonPressed(gp, 'shoulder_l');
    currButtons.R1 = isButtonPressed(gp, 'shoulder_r');
    
    // State-Handler aufrufen
    if (ACTION_HANDLERS[state]) {
        ACTION_HANDLERS[state]();
    }
}
