// keyboard.js - Tastatursteuerung
// Copyright (C) 2023-2025 Marko Klingner
// GNU GPL v3 - https://www.gnu.org/licenses/gpl-3.0.html

// Hauptfunktion für Keyboard-Press-Events
function kb_press(taste) {
    handled = false;
    
    // Input-Modus: Nur Backspace verarbeiten
    if (state === 'input') {
        if (taste.key === 'Backspace') input = taste.key;
        return;
    }

    const keyCode = taste.keyCode || taste.which;
    
    // Lookup-Table für alle Keyboard-Aktionen
    const actions = {
        81: () => { // Q - Quit
            if (state === 'play' || state === 'init') {
                idle_stop();
                state = 'menu';
                score_punkte = 0;
                score_leben = LEBENMAX;
                score_raum = 1;
                storageGameSave();
                init_room(score_raum);
                menuDraw();
            }
        },
        
        72: () => { // H - Highscore
            if (state === 'menu') {
                state = 'highscore';
                highscoreDraw();
            }
        },
        
        57: () => cheat_tmp = '9' + cheat_tmp, // 9 - Cheat
        
        68: () => { // D - Cheat
            cheat_tmp = cheat_tmp + 'd';
            if (cheat_tmp === '99d') digger_cheat = !digger_cheat;
            cheat_tmp = '';
        },
        
        27: () => { // Escape
            if (state === 'play') {
                digger_death = true;
            } else if (state === 'highscore' || state === 'look') {
                state = 'menu';
                menuDraw();
            }
        },
        
        13: () => { // Enter
            if (state === 'play' && digger_death) {
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
            } else if (state === 'highscore') {
                state = 'menu';
                menuDraw();
            }
        },
        
        32: () => { // Space
            if (state === 'play' && digger_death) {
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
            } else if (state === 'highscore') {
                state = 'menu';
                menuDraw();
            }
        },
        
        80: () => { // P - Play
            if (state === 'menu') {
                try { 
                    audioContext.resume(); 
                } catch (e) { 
                    initAudio(); 
                }
                storageGameRestore();
                state = 'init';
                init_room(score_raum);
            }
        },
        
        36: () => { // Pos1 - Cheat Navigation
            if (digger_cheat && (state === 'play' || state === 'init')) {
                const direction = !taste.shiftKey ? 1 : -1;
                const newRoom = score_raum + direction;
                if (newRoom >= 1 && newRoom <= room.length) {
                    idle_stop();
                    score_raum = newRoom;
                    state = 'init';
                    init_room(score_raum);
                    storageGameSave();
                }
            }
        },
        
        76: () => { // L - Look
            if (state === 'menu') {
                state = 'look';
                init_room(score_raum);
            } else if (state === 'look') {
                const direction = !taste.shiftKey ? 1 : -1;
                const newRoom = score_raum + direction;
                if (newRoom >= 1 && newRoom <= room.length) {
                    score_raum = newRoom;
                    init_room(score_raum);
                }
            }
        },
        
        // Bewegungssteuerung
        38: kb_press_up,    // Pfeil hoch
        40: kb_press_down,  // Pfeil runter
        37: kb_press_left,  // Pfeil links
        39: kb_press_right  // Pfeil rechts
    };
    
    if (actions[keyCode]) {
        actions[keyCode]();
        handled = true;
    }
    
    if (handled) taste.preventDefault();
}

// Behandelt das Drücken der UP-Taste
function kb_press_up() {
    if (digger_start_up) return; // Verhindere doppelte Aktivierung
    
    digger_up = true;
    digger_go = 'UP';
    digger_idle = false;
    digger_start_up = true;
}

// Behandelt das Drücken der DOWN-Taste
function kb_press_down() {
    if (digger_start_down) return; // Verhindere doppelte Aktivierung
    
    digger_down = true;
    digger_go = 'DOWN';
    digger_idle = false;
    digger_start_down = true;
}

// Behandelt das Drücken der LEFT-Taste
function kb_press_left() {
    if (digger_start_left) return; // Verhindere doppelte Aktivierung
    
    digger_left = true;
    digger_go = 'LEFT';
    digger_idle = false;
    digger_start_left = true;
}

// Behandelt das Drücken der RIGHT-Taste
function kb_press_right() {
    if (digger_start_right) return; // Verhindere doppelte Aktivierung
    
    digger_right = true;
    digger_go = 'RIGHT';
    digger_idle = false;
    digger_start_right = true;
}

// Behandelt Keyboard-Release-Events für Richtungssteuerung
// @param {KeyboardEvent} taste - Das Keyboard-Event
function kb_release(taste) {
    // Ignoriere Input wenn im Eingabe-Modus
    if (state === 'input') return;
    
    const keyCode = taste.keyCode || taste.which;
    
    // Mapping von Keycodes zu Release-Funktionen
    const keyActions = {
        38: kb_release_up,    // Pfeil hoch
        40: kb_release_down,  // Pfeil runter
        37: kb_release_left,  // Pfeil links
        39: kb_release_right  // Pfeil rechts
    };
    
    const action = keyActions[keyCode];
    if (action) {
        action();
        handled = true;
    }
}

// Behandelt das Loslassen der UP-Taste
// Priorität: DOWN > LEFT > RIGHT
function kb_release_up() {
    // Warte bis Start-Animation abgeschlossen ist
    if (digger_start_up) {
        window.setTimeout(kb_release_up, 10);
        return;
    }
    
    digger_up = false;
    
    // Nächste Bewegungsrichtung bestimmen
    digger_go = digger_down ? 'DOWN' : 
                digger_left ? 'LEFT' : 
                digger_right ? 'RIGHT' : 
                'NONE';
}

// Behandelt das Loslassen der DOWN-Taste
// Priorität: UP > LEFT > RIGHT
function kb_release_down() {
    // Warte bis Start-Animation abgeschlossen ist
    if (digger_start_down) {
        window.setTimeout(kb_release_down, 10);
        return;
    }
    
    digger_down = false;
    
    // Nächste Bewegungsrichtung bestimmen
    digger_go = digger_up ? 'UP' : 
                digger_left ? 'LEFT' : 
                digger_right ? 'RIGHT' : 
                'NONE';
}

// Behandelt das Loslassen der LEFT-Taste
// Priorität: UP > DOWN > RIGHT
function kb_release_left() {
    // Warte bis Start-Animation abgeschlossen ist
    if (digger_start_left) {
        window.setTimeout(kb_release_left, 10);
        return;
    }
    
    digger_left = false;
    
    // Nächste Bewegungsrichtung bestimmen
    digger_go = digger_up ? 'UP' : 
                digger_down ? 'DOWN' : 
                digger_right ? 'RIGHT' : 
                'NONE';
}

// Behandelt das Loslassen der RIGHT-Taste
// Priorität: UP > DOWN > LEFT
function kb_release_right() {
    // Warte bis Start-Animation abgeschlossen ist
    if (digger_start_right) {
        window.setTimeout(kb_release_right, 10);
        return;
    }
    
    digger_right = false;
    
    // Nächste Bewegungsrichtung bestimmen
    digger_go = digger_up ? 'UP' : 
                digger_down ? 'DOWN' : 
                digger_left ? 'LEFT' : 
                'NONE';
}

// Stoppt alle Bewegungen (für Touch-Release)
function kb_unpress() {
    kb_release_up();
    kb_release_down();
    kb_release_left();
    kb_release_right();
}
