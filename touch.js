// SPDX-License-Identifier: GPL-3.0
// jdigger/touch.js - TouchSteuerung auf Smartphone/Tablet
// Copyright (C) 2019–2025  Marko Klingner

const TOUCH_THRESHOLD = 30;
const DIRECTION_MAP = {'links': 'ArrowLeft', 'rechts': 'ArrowRight', 'hoch': 'ArrowUp', 'runter': 'ArrowDown'};

function touch_down(event) {
    event.cancelable && event.preventDefault();
    
    // 3-Finger: Abbruch zum Menü [q]
    if (event.touches.length > 2 && (state === 'play' || state === 'init')) {
        idle_stop();
        resetGame();
        storage_game_save();
        state = 'menu';
        init_room(score_raum);
        menu_draw();
        return;
    }
    
    // 2-Finger: Level restart oder Zurück zum Menü [Esc]
    if (event.touches.length > 1) {
        if (state === 'play') {
            digger_death = true;
        } else if (state === 'look' || state === 'highscore') {
            state = 'menu';
            menu_draw();
        }
        return;
    }
    
    // 1-Finger: Continue nach Tod
    if (event.touches.length === 1 && state === 'play' && digger_death) {
        if (score_leben < LEBENMIN) {
            document.body.removeEventListener('click', vkb_focus, false);
            document.body.addEventListener('click', vkb_focus, false);
            document.body.removeEventListener('input', vkb_input, false);
            document.body.addEventListener('input', vkb_input, false);
            state = 'highscore';
            highscore_draw();
        } else {
            state = 'init';
            init_room(score_raum);
        }
        storage_game_save();
        return;
    }
    
    // Normale Touch-Steuerung initialisieren
    touch_is_active = touch_is_begin = true;
    touch_xy(event);
}

function touch_xy(event) {
    event.cancelable && event.preventDefault();
    
    // Touch-Position aktualisieren
    touch_current_x = event.targetTouches[0].pageX;
    touch_current_y = event.targetTouches[0].pageY;
    
    // Touch-Anfangsposition setzen
    if (touch_is_begin) {
        touch_begin_x = touch_current_x;
        touch_begin_y = touch_current_y;
        touch_is_begin = false;
    }
    
    set_pos();
}

function set_pos() {
    // Bewegungsberechnung nur bei aktivem Touch
    touch_is_active && (() => {
        const deltaX = touch_begin_x - touch_current_x;
        const deltaY = touch_begin_y - touch_current_y;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        
        // Dominante Achse bestimmen und Richtung ableiten
        const is_horizontal = absDeltaX > absDeltaY;
        const new_direction = is_horizontal ? 
            (deltaX < -TOUCH_THRESHOLD ? 'rechts' : deltaX > TOUCH_THRESHOLD ? 'links' : null) :
            (deltaY < -TOUCH_THRESHOLD ? 'runter' : deltaY > TOUCH_THRESHOLD ? 'hoch' : null);
        
        // Richtung ändern wenn Schwellwert überschritten
        new_direction && direction !== new_direction && (
            direction = new_direction, touch_begin_x = touch_current_x, touch_begin_y = touch_current_y);
    })();
    
    // Tastatur-Events simulieren, bei Richtungsänderung
    direction !== last_direction && (
        direction === 'stop' ? keys_stack.length = 0 : (() => {
            const key = DIRECTION_MAP[direction];
            const key_stack_index = keys_stack.indexOf(key);
            
            // Key aus Stack entfernen und hinzufügen (keine doppelten Gesten)
            key_stack_index !== -1 && keys_stack.splice(key_stack_index, 1);
            keys_stack.push(key);
            
            // Digger-Bewegung setzen (digger_go wird in game_loop() ausgewertet)
            state === 'play' && (digger_idle = false,
                digger_go = direction_map[key],
                digger_go_handled = false);
        })(),
        last_direction = direction
    );
}

function touch_up(event) {
    // Touch beenden, Bewegung stoppen
    touch_is_active = false;
    touch_is_begin = false;
    direction = 'stop';
    set_pos();
}

function touch_cancel() {
    // Touch abgebrochen, Bewegung stoppen
    touch_is_active = false;
    touch_is_begin = false;
    direction = 'stop';
    set_pos();
}