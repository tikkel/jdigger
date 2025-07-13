// SPDX-License-Identifier: GPL-3.0
// jdigger/gamepad.js - Gamepad Steuerung
// Copyright (C) 2022–2025  Marko Klingner

/* Gamepad State - Globale Variablen für Controller-Status */
var gamepad_connected = false, gamepad_type = 'none', gamepad_brand = 'keyboard', gamepad_dualrumble = false, gamepad_index = 0

/* Button States - Vorheriger und aktueller Zustand aller Tasten */
var prev_buttons = {left: false, right: false, up: false, down: false, A: false, B: false, X: false, Y: false, L1: false, R1: false}
var curr_buttons = {left: false, right: false, up: false, down: false, A: false, B: false, X: false, Y: false, L1: false, R1: false}

/* Controller-Typen - Verschiedene Gamepad-Konfigurationen mit Button-Mapping */
var CONTROLLER_TYPES = {
    xbox: {name: 'Xbox', patterns: ['xbox', '045e', 'microsoft'], buttons: {action: 1, back: 0, option1: 3, option2: 2, shoulder_l: 4, shoulder_r: 5}},
    sony: {name: 'PlayStation', patterns: ['054c', 'sony', 'playstation', 'dualshock', 'dualsense'], buttons: {action: 1, back: 0, option1: 2, option2: 3, shoulder_l: 4, shoulder_r: 5}},
    nintendo: {name: 'Nintendo', patterns: ['nintendo', 'switch', 'joy-con', '057e'], buttons: {action: 1, back: 0, option1: 3, option2: 2, shoulder_l: 4, shoulder_r: 5}},
    generic: {name: 'Generic', patterns: ['generic', 'unknown'], buttons: {action: 0, back: 1, option1: 3, option2: 2, shoulder_l: 4, shoulder_r: 5}}
}

var current_controller = CONTROLLER_TYPES.xbox

/* Richtungserkennung - Liest D-Pad und Analog-Sticks je nach Controller-Typ */
function gamepad_get_directions(gp) {
    var left = false, right = false, up = false, down = false
    
    // 8-Achsen Controller: 3 Analog-Stick-Paare prüfen
    gamepad_type === '8axes' && [0, 3, 6].forEach(i => (
        left = left || gp.axes[i] < -0.5,
        right = right || gp.axes[i] > 0.5,
        up = up || gp.axes[i + 1] < -0.5,
        down = down || gp.axes[i + 1] > 0.5
    ))
    
    // 4-Achsen Controller: D-Pad Buttons + 2 Analog-Sticks
    gamepad_type === '4axes' && (
        left = gp.buttons[14]?.pressed || gp.axes[0] < -0.5 || gp.axes[2] < -0.5,
        right = gp.buttons[15]?.pressed || gp.axes[0] > 0.5 || gp.axes[2] > 0.5,
        up = gp.buttons[12]?.pressed || gp.axes[1] < -0.5 || gp.axes[3] < -0.5,
        down = gp.buttons[13]?.pressed || gp.axes[1] > 0.5 || gp.axes[3] > 0.5
    )
    
    // 2-Achsen Controller: Nur 1 Analog-Stick
    gamepad_type === '2axes' && (
        left = gp.axes[0] < -0.5,
        right = gp.axes[0] > 0.5,
        up = gp.axes[1] < -0.5,
        down = gp.axes[1] > 0.5
    )
    
    return {left, right, up, down}
}

/* Movement-Behandlung - Verwaltet Tastenstapel für Richtungsbewegungen */
function gamepad_handle_movement() {
    // Mapping von Gamepad-Buttons zu Tastatur-Äquivalenten
    [{curr: 'left', prev: 'left', key: 'ArrowLeft'}, {curr: 'right', prev: 'right', key: 'ArrowRight'}, 
     {curr: 'up', prev: 'up', key: 'ArrowUp'}, {curr: 'down', prev: 'down', key: 'ArrowDown'}].forEach(({curr, prev, key}) => {
        
        // Button gedrückt: Taste zu Stack hinzufügen
        curr_buttons[curr] && !prev_buttons[prev] && state === 'play' && (
            keys_stack.splice(keys_stack.indexOf(key), keys_stack.indexOf(key) !== -1 ? 1 : 0), // Doppelte entfernen
            keys_stack.push(key), // Neue Taste hinzufügen
            digger_idle = false,
            digger_go = direction_map[keys_stack[keys_stack.length - 1]], // Letzte Taste aktivieren
            digger_go_handled = false
        )
        
        // Button losgelassen: Taste aus Stack entfernen
        !curr_buttons[curr] && prev_buttons[prev] && (
            keys_stack.splice(keys_stack.indexOf(key), keys_stack.indexOf(key) !== -1 ? 1 : 0),
            keys_stack.length > 0 && ( // Vorherige Taste reaktivieren falls Stack nicht leer
                digger_idle = false,
                digger_go = direction_map[keys_stack[keys_stack.length - 1]],
                digger_go_handled = false
            )
        )
    })
}

/* Gamepad Connect - Initialisiert Controller beim Anschließen */
function gamepad_connect(e) {
    gamepad_connected = true
    gamepad_index = e.gamepad.index
    
    // Audio Context für Sounds aktivieren
    try { audio_context.resume() } catch (err) { init_audio() }
    
    // Controller-Typ anhand der ID erkennen
    current_controller = Object.values(CONTROLLER_TYPES).find(config => 
        config.patterns.some(pattern => e.gamepad.id.toLowerCase().includes(pattern))
    ) || CONTROLLER_TYPES.xbox
    
    gamepad_brand = current_controller.name.toLowerCase()
    
    // Gamepad-Typ nach Anzahl Achsen und Buttons bestimmen
    gamepad_type = e.gamepad.axes.length >= 8 ? '8axes' : 
                  e.gamepad.buttons.length >= 16 && e.gamepad.axes.length === 4 ? '4axes' :
                  e.gamepad.buttons.length >= 6 && e.gamepad.axes.length === 2 ? '2axes' : 'none'
    
    // Vibration testen falls verfügbar
    !gamepad_dualrumble && e.gamepad.vibrationActuator?.playEffect && (
        e.gamepad.vibrationActuator.playEffect("dual-rumble", {startDelay: 0, duration: 100, weakMagnitude: 1.0, strongMagnitude: 1.0})
            .then(() => (gamepad_dualrumble = true, console.log('Vibration wird unterstützt!')))
            .catch(error => (gamepad_dualrumble = false, console.log('Vibration nicht unterstützt:', error.message)))
    )
    
    // Button States zurücksetzen (außer Richtungstasten)
    Object.keys(curr_buttons).forEach(key => 
        !['left', 'right', 'up', 'down'].includes(key) && (prev_buttons[key] = curr_buttons[key] = true)
    )
    
    // Menu neu zeichnen falls im Menu-Modus
    state === 'menu' && menu_draw()
    
    console.log('Gamepad #%d verbunden:\n"%s"\nButtons: %d\nAchsen: %d\nTyp: %s\nMarke: %s\nDual-Rumble: %s', 
        e.gamepad.index, e.gamepad.id, e.gamepad.buttons.length, 
        e.gamepad.axes.length, gamepad_type, current_controller.name, gamepad_dualrumble)
}

/* Gamepad Disconnect - Räumt auf wenn Controller getrennt wird */
function gamepad_disconnect(e) {
    gamepad_connected = false
    gamepad_dualrumble = false
    gamepad_brand = 'keyboard'
    gamepad_index = 0
    
    // Menu neu zeichnen falls im Menu-Modus
    state === 'menu' && menu_draw()
    console.log('Gamepad #%d getrennt: "%s"', e.gamepad.index, e.gamepad.id)
}

/* Hauptupdate - Wird jeden Frame aufgerufen, liest Controller-Input und verarbeitet Game-States */
function gamepad_update() {
    // Früher Ausstieg: Nur wenn Controller verbunden und nicht im Input-Modus
    const gp = gamepad_connected && state !== 'input' && navigator.getGamepads()[gamepad_index]
    
    gp && gp.connected && (
        // Previous state sichern
        Object.assign(prev_buttons, curr_buttons),
        // Neue Richtungen einlesen
        Object.assign(curr_buttons, gamepad_get_directions(gp)),
        
        // Action-Buttons einlesen (mit Analog-Trigger Support)
        curr_buttons.A = gp.buttons[current_controller.buttons.back]?.pressed || gp.buttons[current_controller.buttons.back]?.value > 0.5,
        curr_buttons.B = gp.buttons[current_controller.buttons.action]?.pressed || gp.buttons[current_controller.buttons.action]?.value > 0.5,
        curr_buttons.X = gp.buttons[current_controller.buttons.option2]?.pressed || gp.buttons[current_controller.buttons.option2]?.value > 0.5,
        curr_buttons.Y = gp.buttons[current_controller.buttons.option1]?.pressed || gp.buttons[current_controller.buttons.option1]?.value > 0.5,
        curr_buttons.L1 = gp.buttons[current_controller.buttons.shoulder_l]?.pressed || gp.buttons[current_controller.buttons.shoulder_l]?.value > 0.5,
        curr_buttons.R1 = gp.buttons[current_controller.buttons.shoulder_r]?.pressed || gp.buttons[current_controller.buttons.shoulder_r]?.value > 0.5,
        
        /* State Handlers - Verschiedene Game-Modi */
        
        // PLAY-Modus: Spiel läuft
        state === 'play' && (
            gamepad_handle_movement(), // Bewegung verarbeiten
            // B-Button: Escape/Weiter nach Tod
            curr_buttons.B && !prev_buttons.B && (
                digger_death ? (
                    score_leben < LEBENMIN ? (state = 'highscore', highscore_draw()) : (state = 'init', init_room(score_raum)),
                    storage_game_save()
                ) : (digger_death = true) // Sofortiger Tod
            ),
            // A-Button: Zurück zum Menu
            curr_buttons.A && !prev_buttons.A && (
                idle_stop(), resetGame(), storage_game_save(), state = 'menu', init_room(score_raum), menu_draw()
            )
        ),
        
        // INIT-Modus: Level wird geladen
        state === 'init' && curr_buttons.A && !prev_buttons.A && (
            idle_stop(), resetGame(), storage_game_save(), state = 'menu', init_room(score_raum), menu_draw()
        ),
        
        // MENU-Modus: Hauptmenu
        state === 'menu' && (
            curr_buttons.B && !prev_buttons.B && (storage_game_restore(), state = 'init', init_room(score_raum)), // Spiel starten
            curr_buttons.X && !prev_buttons.X && (state = 'highscore', highscore_draw()), // Highscore anzeigen
            curr_buttons.Y && !prev_buttons.Y && (state = 'look', storage_game_restore(), init_room(score_raum)) // Look-Modus
        ),
        
        // LOOK-Modus: Level durchblättern
        state === 'look' && (
            // Y oder R1: Nächstes Level
            (curr_buttons.Y && !prev_buttons.Y || curr_buttons.R1 && !prev_buttons.R1) && score_raum < room.length && (score_raum++, init_room(score_raum)),
            // L1: Vorheriges Level
            curr_buttons.L1 && !prev_buttons.L1 && score_raum > 1 && (score_raum--, init_room(score_raum)),
            // A: Zurück zum Menu
            curr_buttons.A && !prev_buttons.A && (state = 'menu', menu_draw())
        ),
        
        // HIGHSCORE-Modus: Highscore-Liste
        state === 'highscore' && curr_buttons.A && !prev_buttons.A && (state = 'menu', menu_draw())
    )
}