// SPDX-License-Identifier: GPL-3.0
// jdigger/touch.js - TouchSteuerung auf Smartphone/Tablet - GC-optimierte Version
// Copyright (C) 2019–2025  Marko Klingner

// Konstanten für bessere Performance
const TOUCH_THRESHOLD = 30;
const DIRECTION_MAP = {
    'links': 'ArrowLeft',
    'rechts': 'ArrowRight', 
    'hoch': 'ArrowUp',
    'runter': 'ArrowDown'
};

// Wiederverwendbare Objekte zur GC-Vermeidung
const touchCache = {
    deltaX: 0,
    deltaY: 0,
    absDeltaX: 0,
    absDeltaY: 0,
    key: '',
    keyIndex: -1
};

function touch_down(event) {
    // Verhindere das Standard-Touch-Verhalten, wenn möglich
    event.cancelable && event.preventDefault();

    // 3-Finger-Geste: Zurück zum Menü
    if (event.touches.length > 2 && (state === 'play' || state === 'init')) {
        idle_stop();
        resetGame();
        storage_game_save();
        state = 'menu';
        init_room(score_raum);
        menu_draw();
        return;
    }
    
    // 2-Finger-Geste: Level restart oder Menü
    if (event.touches.length > 1) {
        if (state === 'play') {
            digger_death = true;
        } else if (state === 'look' || state === 'highscore') {
            state = 'menu';
            menu_draw();
        }
        return;
    }
    
    // 1-Finger-Geste: Continue oder Richtungsgeste
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
    
    // Normale Touch-Behandlung (nur wenn keine der obigen Bedingungen zutraf)
    mouse_is_down = joy_on = true;
    touch_xy(event);
}

function touch_xy(event) {
    // Verhindere das Standard-Touch-Verhalten, wenn möglich
    event.cancelable && event.preventDefault();

    // Direkte Zuweisung ohne Zwischenvariablen
    touch_x = event.targetTouches[0].pageX;
    touch_y = event.targetTouches[0].pageY;

    if (joy_on) {
        joy_x = touch_x;
        joy_y = touch_y;
        joy_on = false;
    }
    
    set_pos();
}

// Vorsichtige GC-Optimierung - minimale Änderungen zur ursprünglichen Version
function set_pos() {
    mouse_is_down && (() => {
        // Lokale Variablen statt Cache-Objekt (weniger GC-Druck)
        const deltaX = joy_x - touch_x;
        const deltaY = joy_y - touch_y;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        
        // Bestimme dominante Achse und Richtung (identisch zum Original)
        const is_horizontal = absDeltaX > absDeltaY;
        const new_direction = is_horizontal ? 
            (deltaX < -TOUCH_THRESHOLD ? 'rechts' : deltaX > TOUCH_THRESHOLD ? 'links' : null) :
            (deltaY < -TOUCH_THRESHOLD ? 'runter' : deltaY > TOUCH_THRESHOLD ? 'hoch' : null);
        
        // Richtung setzen wenn Schwellwert überschritten und Richtung neu (identisch)
        const shouldChangeDirection = new_direction && direction !== new_direction;
        shouldChangeDirection && (
            direction = new_direction,
            joy_x = touch_x,
            joy_y = touch_y
        );
    })();
    
    // Touch-Events bei Richtungsänderung (identisch zum Original)
    const directionChanged = direction !== last_direction;
    directionChanged && (
        direction === 'stop' ? keys_stack.length = 0 : (() => {
            // Minimale Optimierung: eine Variable für Map-Lookup
            const key = DIRECTION_MAP[direction];
            const keyIndex = keys_stack.indexOf(key);
            
            // Optimierte Stack-Manipulation (identisch)
            keyIndex !== -1 && keys_stack.splice(keyIndex, 1);
            keys_stack.push(key);
            
            // Digger-Richtung setzen (identisch)
            const isPlayState = state === 'play';
            isPlayState && (
                digger_idle = false,
                digger_go = direction_map[key],
                digger_go_handled = false
            );
        })(),
        last_direction = direction
    );
}

function touch_up(event) {
    mouse_is_down = false;
    direction = 'stop';
    joy_on = false;
    set_pos();
}

function touch_cancel() {
    mouse_is_down = false;
    direction = 'stop';
    joy_on = false;
    set_pos();
}