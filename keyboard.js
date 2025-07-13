// SPDX-License-Identifier: GPL-3.0
// jdigger/keyboard.js - Tastatur Steuerung (CPU & GC-optimiert)
// Copyright (C) 2025–2025  Marko Klingner

/* GC-Optimierte Datenstrukturen */
const keys_stack = []; // Stapel für gedrückte Cursor-Tasten (letzte = aktuelle Richtung)
const keys_set = new Set(); // Set für O(1) Lookup - verhindert Duplikate
let digger_go_handled = true; // Flag: wurde Digger-Bewegung bereits verarbeitet?

// Mapping für Cursor-Tasten → Richtung (für schnelle Lookups)
const direction_map = { 
    ArrowUp: 'UP', ArrowDown: 'DOWN', 
    ArrowLeft: 'LEFT', ArrowRight: 'RIGHT' 
};

// Relevante Tasten als Set für O(1) Lookup (GC-optimiert)
const relevant_keys = new Set([
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 
    'q', 'h', '9', 'd', 'Escape', 'Enter', ' ', 'p', 'Home', 'l', 'L'
]);


/* Hilfsfunktionen - Inline für bessere Performance */
const add_key = (key) => {
    if (!keys_set.has(key)) {
        keys_set.add(key);
        keys_stack.push(key);
    }
};

const remove_key = (key) => {
    if (keys_set.has(key)) {
        keys_set.delete(key);
        // Effizientes Entfernen ohne splice() - GC-optimiert
        const idx = keys_stack.indexOf(key);
        if (idx !== -1) {
            keys_stack[idx] = keys_stack[keys_stack.length - 1];
            keys_stack.pop();
        }
    }
};

const set_digger_direction = () => {
    digger_idle = false;
    digger_go = direction_map[keys_stack[keys_stack.length - 1]];
    digger_go_handled = false;
};

const change_level = (delta) => {
    const new_level = score_raum + delta;
    if (new_level >= 1 && new_level <= room.length) {
        idle_stop();
        score_raum = new_level;
        state = 'init';
        init_room(score_raum);
        storage_game_save();
        return true;
    }
    return false;
};

/* Optimierte Key-Handler - Lookup-Table für bessere Performance */
const key_handlers = {
    // Cursor-Tasten (nur im Spiel aktiv)
    cursor: (key, event) => {
        if (state !== 'play' || event.repeat) return false;
        
        remove_key(key); // Entfernen falls vorhanden
        add_key(key);    // Neu hinzufügen (= höchste Priorität)
        set_digger_direction();
        return true;
    },
    
    // Spiel beenden: 'q' im Spiel oder bei Initialisierung
    quit: () => {
        if (state === 'play' || state === 'init') {
            idle_stop();
            resetGame();
            storage_game_save();
            state = 'menu';
            init_room(score_raum);
            menu_draw();
            return true;
        }
        return false;
    },
    
    // Highscore anzeigen: 'h' nur im Menü
    highscore: () => {
        if (state === 'menu') {
            state = 'highscore';
            highscore_draw();
            return true;
        }
        return false;
    },
    
    // Cheat-Code Handling
    cheat_nine: () => {
        cheat_tmp += '9';
        return true;
    },
    
    cheat_d: () => {
        cheat_tmp += 'd';
        if (cheat_tmp === '99d') {
            digger_cheat = !digger_cheat;
            console.log(`Cheat: ${digger_cheat}`);
            cheat_tmp = '';
        }
        return true;
    },
    
    // Escape: Zurück/Sterben je nach Zustand
    escape: () => {
        if (state === 'play') {
            digger_death = true;
            return true;
        }
        if (state === 'highscore' || state === 'look') {
            state = 'menu';
            menu_draw();
            return true;
        }
        return false;
    },
    
    // Enter/Space: Bestätigen/Weiter
    confirm: () => {
        if (state === 'play' && digger_death) {
            if (score_leben < LEBENMIN) {
                state = 'highscore';
                highscore_draw();
            } else {
                state = 'init';
                init_room(score_raum);
            }
            storage_game_save();
            return true;
        }
        if (state === 'highscore') {
            state = 'menu';
            menu_draw();
            return true;
        }
        return false;
    },
    
    // Spiel starten: 'p' im Menü
    play: () => {
        if (state === 'menu') {
            (audio_context || (init_audio(), audio_context))?.resume()?.catch(init_audio);
            storage_game_restore();
            state = 'init';
            init_room(score_raum);
            return true;
        }
        return false;
    },
    
    // Level springen: Home (nur mit Cheat)
    home: (event) => {
        if (digger_cheat && (state === 'play' || state === 'init')) {
            return change_level(event.shiftKey ? -1 : 1);
        }
        return false;
    },
    
    // Level anschauen: 'l' oder 'L'
    look: (event) => {
        if (state === 'menu') {
            state = 'look';
            storage_game_restore();
            init_room(score_raum);
            return true;
        }
        if (state === 'look') {
            score_raum = Math.max(1, Math.min(room.length, 
                score_raum + (event.shiftKey ? -1 : 1)
            ));
            init_room(score_raum);
            return true;
        }
        return false;
    }
};

/* Hauptfunktion - Maximale Performance-Optimierung */
function key_down(event) {
    const key = event.key;
    
    // Früher Exit für irrelevante Tasten - O(1) Lookup
    if (!relevant_keys.has(key)) return;
    
    event.preventDefault();
    
    // Cursor-Tasten haben höchste Priorität
    if (direction_map[key]) {
        key_handlers.cursor(key, event);
        return;
    }
    
    // State-Handler - Optimiert mit direktem Lookup
    const handled = 
        key === 'q' ? key_handlers.quit() :
        key === 'h' ? key_handlers.highscore() :
        key === '9' ? key_handlers.cheat_nine() :
        key === 'd' ? key_handlers.cheat_d() :
        key === 'Escape' ? key_handlers.escape() :
        (key === 'Enter' || key === ' ') ? key_handlers.confirm() :
        key === 'p' ? key_handlers.play() :
        key === 'Home' ? key_handlers.home(event) :
        (key === 'l' || key === 'L') ? key_handlers.look(event) :
        false;
    
    // Cheat-Code Reset bei unbekannten Tasten
    if (!handled && cheat_tmp) {
        cheat_tmp = '';
    }
}

/* Key-Up Handler - GC-optimiert */
function key_up(event) {
    const key = event.key;
    
    // Nur Cursor-Tasten behandeln - O(1) Lookup
    if (!direction_map[key]) return;
    
    event.preventDefault();
    
    // Taste aus Stack entfernen
    remove_key(key);
    
    // Falls noch Tasten im Stack: vorherige Richtung reaktivieren
    if (keys_stack.length > 0) {
        set_digger_direction();
    }
    // WICHTIG: digger_go='NONE' wird in frame1() gesetzt, nicht hier!
}

/* Cleanup-Funktion für externe Nutzung */
function keyboard_reset() {
    keys_stack.length = 0;
    keys_set.clear();
    cheat_tmp = '';
    digger_go_handled = true;
}