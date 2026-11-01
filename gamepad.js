// SPDX-License-Identifier: GPL-3.0
// jdigger/gamepad.js - Gamepad Steuerung
// Copyright (C) 2022–2026 Marko Klingner

const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');

// Gamepad State - Minimale Variablen
let gamepad_connected = false, gamepad_type = 0, gamepad_brand = 'keyboard', 
    gamepad_rumble = false, gamepad_idx = 0, gamepad_first_input_handled = false;

// === State-Handler (Modulebene: einmal erzeugt, nie wieder allokiert) ===
const gamepad_state_handlers = {
    'play': () => {
        gamepad_handle_movement();
        if (get_btn('B') && !get_prev_btn('B')) {
            if (digger_death) {
                if (score_leben < LEBENMIN) {
                    state = 'highscore';
                    highscore_draw();
                } else {
                    state = 'init';
                    init_room(score_raum);
                }
                storage_game_save();
            } else {
                digger_death = true;
            }
        }
        if (get_btn('A') && !get_prev_btn('A')) {
            idle_stop();
            resetGame();
            storage_game_save();
            state = 'menu';
            init_room(score_raum);
            menu_draw();
        }
    },
    'init': () => {
        if (get_btn('A') && !get_prev_btn('A')) {
            idle_stop();
            resetGame();
            storage_game_save();
            state = 'menu';
            init_room(score_raum);
            menu_draw();
        }
    },
    'menu': () => {
        if (get_btn('B') && !get_prev_btn('B')) {
            storage_game_restore();
            state = 'init';
            init_room(score_raum);
        } else if (get_btn('X') && !get_prev_btn('X')) {
            state = 'highscore';
            highscore_draw();
        } else if (get_btn('Y') && !get_prev_btn('Y')) {
            state = 'look';
            storage_game_restore();
            init_room(score_raum);
        }
    },
    'look': () => {
        if ((get_btn('Y') && !get_prev_btn('Y')) || (get_btn('R1') && !get_prev_btn('R1'))) {
            if (score_raum < room.length) {
                score_raum++;
                init_room(score_raum);
            }
        }
        if (get_btn('L1') && !get_prev_btn('L1')) {
            if (score_raum > 1) {
                score_raum--;
                init_room(score_raum);
            }
        }
        if (get_btn('A') && !get_prev_btn('A')) {
            state = 'menu';
            menu_draw();
        }
    },
    'highscore': () => {
        if (get_btn('A') && !get_prev_btn('A')) {
            state = 'menu';
            menu_draw();
        }
    }
};

// Button States - GC-optimiert mit TypedArrays
const btn_names = ['left', 'right', 'up', 'down', 'A', 'B', 'X', 'Y', 'L1', 'R1'];
const btn_count = btn_names.length;
const prev_btns_array = new Uint8Array(btn_count);
const curr_btns_array = new Uint8Array(btn_count);

// Lookup-Map für schnellen Zugriff
const btn_indices = {};
btn_names.forEach((name, i) => btn_indices[name] = i);

// Helper-Funktionen für Button-Zugriff
const get_btn = name => curr_btns_array[btn_indices[name]];
const get_prev_btn = name => prev_btns_array[btn_indices[name]];
const set_btn = (name, value) => curr_btns_array[btn_indices[name]] = value ? 1 : 0;

// Wiederverwendbares Objekt - Keine GC-Allokationen
const dirs_cache = {left: false, right: false, up: false, down: false};

// Controller-Typen - Optimiert mit TypedArrays
const CTRL_TYPES = [
    {name: 'Xbox', patterns: ['xbox', '045e', 'microsoft', '8bitdo'], 
     btns: new Uint8Array([0,1,2,3,4,5]), firefox_btns: new Uint8Array([0,1,3,2,4,5])},
    {name: 'PlayStation', patterns: ['054c','sony','playstation','dualshock','dualsense'],
     btns: new Uint8Array([1,0,3,2,4,5]), firefox_btns: new Uint8Array([1,0,3,2,4,5])},
    {name: 'Nintendo', patterns: ['nintendo','switch','057e'],
     btns: new Uint8Array([0,1,2,3,4,5]), firefox_btns: new Uint8Array([0,1,2,3,4,5])},
    {name: 'Generic', patterns: ['generic','unknown'],
     btns: new Uint8Array([1,0,2,3,4,5]), firefox_btns: new Uint8Array([1,0,2,3,4,5])}
];

let ctrl_idx = 0; // Index des aktuellen Controllers

// Gamepad Reset - Gemeinsame Funktion
function gamepad_reset() {
    gamepad_connected = gamepad_rumble = false;
    gamepad_brand = 'keyboard';
    prev_btns_array.fill(0);
    curr_btns_array.fill(0);
    keys_stack.length = 0;
    keys_set.clear();
    if (state === 'menu') menu_draw();
}



// Richtungserkennung - GC-optimiert mit Verbindungsprüfung
function gamepad_get_dirs(gp) {
    if (!gp || !gp.connected) return dirs_cache;
    
    const axes = gp.axes;
    dirs_cache.left = dirs_cache.right = dirs_cache.up = dirs_cache.down = false;
    
    if (gamepad_type === 0) { // 8-Achsen Controller
        for (let i = 0; i < Math.min(8, axes.length); i += 2) {
            if (axes[i] < -0.5) dirs_cache.left = true;
            if (axes[i] > 0.5) dirs_cache.right = true;
            if (axes[i+1] < -0.5) dirs_cache.up = true;
            if (axes[i+1] > 0.5) dirs_cache.down = true;
        }
    } else if (gamepad_type === 1) { // 4-Achsen + D-Pad Buttons
        const btns = gp.buttons;
        dirs_cache.left = (btns[14]?.pressed || false) || (axes[0] < -0.5) || (axes[2] < -0.5);
        dirs_cache.right = (btns[15]?.pressed || false) || (axes[0] > 0.5) || (axes[2] > 0.5);
        dirs_cache.up = (btns[12]?.pressed || false) || (axes[1] < -0.5) || (axes[3] < -0.5);
        dirs_cache.down = (btns[13]?.pressed || false) || (axes[1] > 0.5) || (axes[3] > 0.5);
    } else { // 2-Achsen Standard
        dirs_cache.left = axes[0] < -0.5;
        dirs_cache.right = axes[0] > 0.5;
        dirs_cache.up = axes[1] < -0.5;
        dirs_cache.down = axes[1] > 0.5;
    }
    return dirs_cache;
}

// Richtungs-Tasten - Modulebene (einmalig, keine Allokation pro Tick)
const GAMEPAD_DIR_NAMES = ['left', 'right', 'up', 'down'];
const GAMEPAD_DIR_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

// Movement-Behandlung - Optimiert ohne splice() und ohne pro-Tick-Allokation
function gamepad_handle_movement() {
    if (state !== 'play' || !gamepad_connected) return;

    for (let i = 0; i < 4; i++) {
        const pressed = get_btn(GAMEPAD_DIR_NAMES[i]);
        const was_pressed = get_prev_btn(GAMEPAD_DIR_NAMES[i]);

        if (pressed && !was_pressed) { // Button gedrückt
            remove_key(GAMEPAD_DIR_KEYS[i]);
            add_key(GAMEPAD_DIR_KEYS[i]);
            digger_idle = false;
            digger_go = direction_map[GAMEPAD_DIR_KEYS[i]];
            digger_go_handled = false;
        } else if (!pressed && was_pressed) { // Button losgelassen
            remove_key(GAMEPAD_DIR_KEYS[i]);
            if (keys_stack.length > 0) {
                digger_idle = false;
                digger_go = direction_map[keys_stack[keys_stack.length - 1]];
                digger_go_handled = false;
            }
        }
    }
}

// Gamepad Connect - Optimiert
function gamepad_connect(event) {
    const gp = event.gamepad;
    if (!gp) return;
    
    gamepad_first_input_handled = false; // 1. Tastendruck ignorieren
    gamepad_connected = true;
    gamepad_idx = gp.index;
    
    // Audio Context aktivieren
    audio_unlock();
    
    // Controller-Typ ermitteln
    const id = gp.id.toLowerCase();
    ctrl_idx = CTRL_TYPES.findIndex(c => c.patterns.some(p => id.includes(p)));
    if (ctrl_idx === -1) ctrl_idx = 0; // Default zu Xbox
    
    gamepad_brand = CTRL_TYPES[ctrl_idx].name.toLowerCase();
    
    // Gamepad-Typ bestimmen (0=8axes, 1=4axes, 2=2axes)
    gamepad_type = gp.axes.length >= 8 ? 0 : 
                   gp.buttons.length >= 16 && gp.axes.length === 4 ? 1 : 2;
    
    // Button States zurücksetzen
    prev_btns_array.fill(0);
    curr_btns_array.fill(0);
    keys_stack.length = 0;
    keys_set.clear();
    
    if (state === 'menu') menu_draw();
    console.log('Gamepad connected:', gamepad_brand, '\nType:', gp.id,
                '\nAxes:', gp.axes.length, 'Buttons:', gp.buttons.length);
}

// Gamepad Disconnect - Nur für Browser-Events
function gamepad_disconnect(event) {
    if (!event.gamepad || event.gamepad.index !== gamepad_idx) return;
    gamepad_reset();
    console.log('Gamepad disconnected via browser event');
}

// Hauptupdate - Maximale GC-Optimierung
function gamepad_update() {
    if (!gamepad_connected || state === 'input') return;
    
    const gp = navigator.getGamepads()[gamepad_idx];
    if (!gp) return;

    // Vibration-Faehigkeit nachfassen: Nach Reconnect kann der Actuator
    // erst verzoegert am Pad-Objekt auftauchen - deshalb bis zum ersten
    // Erfolg pruefen statt nur einmal beim ersten Tastendruck.
    if (!gamepad_rumble) {
        gamepad_rumble = typeof gp.vibrationActuator?.playEffect === 'function';
        if (gamepad_rumble) console.log(`Rumble: ${gamepad_rumble}`);
    }
    
    // Button States kopieren - Extrem schnell mit TypedArrays
    prev_btns_array.set(curr_btns_array);
    
    // Richtungen lesen - Verwendet cached Objekt
    const dirs = gamepad_get_dirs(gp);
    set_btn('left', dirs.left);
    set_btn('right', dirs.right);
    set_btn('up', dirs.up);
    set_btn('down', dirs.down);

    // Action-Buttons lesen - Optimiert mit direktem Array-Zugriff
    const ctrl_btns = isFirefox ? 
        (CTRL_TYPES[ctrl_idx].firefox_btns || CTRL_TYPES[ctrl_idx].btns) : 
        CTRL_TYPES[ctrl_idx].btns;

    const btns = gp.buttons;
    const read_btn = idx => {
        if (idx >= btns.length) return false;
        const btn = btns[idx];
        return btn ? (btn.pressed || btn.value > 0.5) : false;
    };
    
    set_btn('A', read_btn(ctrl_btns[0]));   // back
    set_btn('B', read_btn(ctrl_btns[1]));   // action  
    set_btn('X', read_btn(ctrl_btns[2]));   // option2
    set_btn('Y', read_btn(ctrl_btns[3]));   // option1
    set_btn('L1', read_btn(ctrl_btns[4]));  // shoulder_l
    set_btn('R1', read_btn(ctrl_btns[5]));  // shoulder_r

    // Ersten Tastendruck nach Verbindung ignorieren (Button-Zustand syncen)
    if (!gamepad_first_input_handled) {
        gamepad_first_input_handled = true;
        prev_btns_array.set(curr_btns_array);
        return;
    }
    
    // State-Handler ausführen (Tabelle auf Modulebene, keine Allokation)
    // State-Handler ausführen
    const handler = gamepad_state_handlers[state];
    if (handler) handler();
}
