// SPDX-License-Identifier: GPL-3.0
// jdigger/keyboard.js - Tastatur Steuerung (optimiert)
// Copyright (C) 2025–2025  Marko Klingner

let keys_stack = []; // Stapel für gedrückte Cursor-Tasten (letzte = aktuelle Richtung)
let digger_go_handled = true; // Flag: wurde Digger-Bewegung bereits verarbeitet?

// Mapping für Cursor-Tasten → Richtung (für schnelle Lookups)
const direction_map = { 
    ArrowUp: 'UP', ArrowDown: 'DOWN', 
    ArrowLeft: 'LEFT', ArrowRight: 'RIGHT' 
};

// Hilfsfunktion: Taste aus Stack entfernen und erneut hinzufügen (= Priorität erhöhen)
const update_key_stack = key => (
    keys_stack.splice(keys_stack.indexOf(key), keys_stack.indexOf(key) + 1),
    keys_stack.push(key)
);

// Hilfsfunktion: Digger-Bewegung aus oberstem Stack-Element setzen
const set_digger_direction = () => (
    digger_idle = false,
    digger_go = direction_map[keys_stack[keys_stack.length - 1]],
    digger_go_handled = false
);

// Hilfsfunktion: Level wechseln (mit Bounds-Check)
const change_level = delta => {
    const new_level = score_raum + delta;
    return new_level >= 1 && new_level <= room.length ? (
        idle_stop(),
        score_raum = new_level,
        state = 'init',
        init_room(score_raum),
        storage_game_save()
    ) : null;
};

function key_down(event) {
    const key = event.key;
    
    // Nur für relevante Tasten preventDefault() aufrufen
    const relevant_keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 
                          'q', 'h', '9', 'd', 'Escape', 'Enter', ' ', 'p', 'Home', 'l', 'L'];
    
    if (!relevant_keys.includes(key)) {
        return; // Taste ignorieren, keine preventDefault()
    }
    
    // Cursor-Tasten haben höchste Priorität - nur im Spiel aktiv
    return direction_map[key] && state === 'play' ? (
        event.preventDefault(),
        !event.repeat ? ( // Tastatur-AutoRepeats ignorieren
            update_key_stack(key),
            set_digger_direction()
        ) : null
    ) : (
        // Alle anderen Tasten (Status-Kontrolle)
        event.preventDefault(),
        
        // Spiel beenden: 'q' im Spiel oder bei Initialisierung
        key === 'q' && (state === 'play' || state === 'init') ? (
            idle_stop(), resetGame(), storage_game_save(),
            state = 'menu', init_room(score_raum), menu_draw()
        ) :
        
        // Highscore anzeigen: 'h' nur im Menü
        key === 'h' && state === 'menu' ? (
            state = 'highscore', highscore_draw()
        ) :
        
        // Cheat-Code: '99d' aktiviert/deaktiviert Cheat-Modus
        key === '9' ? cheat_tmp += '9' :
        key === 'd' ? (
            cheat_tmp += 'd',
            cheat_tmp === '99d' ? (
                digger_cheat = !digger_cheat,
                console.log(`Cheat: ${digger_cheat}`),
                cheat_tmp = ''
            ) : null
        ) :
        
        // Escape: Zurück/Sterben je nach Zustand
        key === 'Escape' ? (
            state === 'play' ? digger_death = true :
            (state === 'highscore' || state === 'look') ? (
                state = 'menu', menu_draw()
            ) : null
        ) :
        
        // Enter/Space: Bestätigen/Weiter
        (key === 'Enter' || key === ' ') ? (
            state === 'play' && digger_death ? (
                score_leben < LEBENMIN ? (
                    state = 'highscore', highscore_draw()
                ) : (
                    state = 'init', init_room(score_raum)
                ),
                storage_game_save()
            ) :
            state === 'highscore' ? (
                state = 'menu', menu_draw()
            ) : null
        ) :
        
        // Spiel starten: 'p' im Menü
        key === 'p' && state === 'menu' ? (
            audio_context.resume().catch(() => init_audio()),
            storage_game_restore(),
            state = 'init', init_room(score_raum)
        ) :
        
        // Level springen: Home (nur mit Cheat)
        key === 'Home' && digger_cheat && (state === 'play' || state === 'init') ? 
            change_level(event.shiftKey ? -1 : 1) :
        
        // Level anschauen: 'l' oder 'L'
        (key === 'l' || key === 'L') ? (
            state === 'menu' ? (
                state = 'look', storage_game_restore(), init_room(score_raum)
            ) :
            state === 'look' ? (
                score_raum = Math.max(1, Math.min(room.length, 
                    score_raum + (event.shiftKey ? -1 : 1)
                )),
                init_room(score_raum)
            ) : null
        ) : null
    );
}

function key_up(event) {
    const key = event.key;
    
    // Nur Cursor-Tasten behandeln
    return direction_map[key] ? (
        event.preventDefault(),
        // Taste aus Stack entfernen
        keys_stack.splice(keys_stack.indexOf(key), keys_stack.indexOf(key) + 1),
        // Falls noch Tasten im Stack: vorherige Richtung reaktivieren
        keys_stack.length > 0 ? set_digger_direction() : null
        // WICHTIG: digger_go='NONE' wird in frame1() gesetzt, nicht hier!
    ) : null;
}