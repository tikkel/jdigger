// SPDX-License-Identifier: GPL-3.0
// jdigger/touch.js - TouchSteuerung auf Smartphone/Tablet - GC-optimierte Version
// Copyright (C) 2019–2025  Marko Klingner

// Konstanten für bessere Performance
const TOUCH_THRESHOLD = 30;
const DIRECTION_MAP = Object.freeze({
    'links': 'ArrowLeft',
    'rechts': 'ArrowRight', 
    'hoch': 'ArrowUp',
    'runter': 'ArrowDown'
});
const DIGGER_DIRECTION_MAP = Object.freeze({
    'ArrowUp': 'UP',
    'ArrowDown': 'DOWN',
    'ArrowLeft': 'LEFT',
    'ArrowRight': 'RIGHT'
});

// Menu-Aktionen als statische Funktionen (GC-optimiert)
const menuPlay = () => (storage_game_restore(), state = 'init', init_room(score_raum));
const menuHighscore = () => (state = 'highscore', highscore_draw());
const menuLook = () => (state = 'look', storage_game_restore(), init_room(score_raum));

// Lookup-Tabelle für Menu-Koordinaten (ORIGINAL LOGIK mit Map)
const MENU_ACTIONS = new Map([
    ['9,20', menuPlay],    // Play
    ['19,20', menuHighscore], // Highscore  
    ['9,22', menuLook]     // Look
]);

// Wiederverwendbare Objekte zur GC-Vermeidung
const touchCache = {
    deltaX: 0,
    deltaY: 0,
    absDeltaX: 0,
    absDeltaY: 0,
    touchS: 0,
    touchZ: 0,
    key: '',
    keyIndex: -1
};

function touch_down(event) {
    // preventDefault() nur wenn nicht passiv registriert
    event.cancelable && event.preventDefault();
    touch_flag = true;
    const touches = event.touches.length;
    
    // 3-Finger-Geste: Zurück zum Menü
    const canGoToMenu = touches > 2 && (state === 'play' || state === 'init');
    canGoToMenu && (
        idle_stop(), resetGame(), storage_game_save(),
        state = 'menu', init_room(score_raum), menu_draw()
    );
    
    // 2-Finger-Geste: Level restart oder Menü
    const isTwoFinger = touches > 1 && !canGoToMenu;
    isTwoFinger && (
        state === 'play' ? digger_death = true :
        (state === 'look' || state === 'highscore') && (state = 'menu', menu_draw())
    );
    
    // 1-Finger-Geste: Continue oder Richtungsgeste
    const isOneFingerPlayDeath = touches === 1 && state === 'play' && digger_death;
    isOneFingerPlayDeath && (
        score_leben < LEBENMIN ? (
            document.body.removeEventListener('click', vkb_focus, false),
            document.body.addEventListener('click', vkb_focus, false),
            document.body.removeEventListener('input', vkb_input, false),
            document.body.addEventListener('input', vkb_input, false),
            state = 'highscore', highscore_draw()
        ) : (state = 'init', init_room(score_raum)),
        storage_game_save()
    );
    
    // Normale Touch-Behandlung
    const shouldStartTouch = !canGoToMenu && !isTwoFinger && !isOneFingerPlayDeath;
    shouldStartTouch && (mouse_is_down = joy_on = true, touch_xy(event));
}

function touch_up(event) {
    // Menu-Navigation (ORIGINAL LOGIK komplett beibehalten)
    const isMenuSingleTouch = state === 'menu' && single_touch === 0;
    isMenuSingleTouch && (
        (audio_context || (init_audio(), audio_context)) && audio_context.resume().catch(() => init_audio()),
        play_audio('Leer'),
        (() => {
            // ORIGINAL Koordinaten-Berechnung mit body_width/body_height
            touchCache.touchS = (event.changedTouches[0].pageX / (body_width / 40)) << 0;
            touchCache.touchZ = (event.changedTouches[0].pageY / (body_height / 30)) << 0;
            
            // ORIGINAL Menu-Koordinaten-Prüfung mit Map und Fallback
            touchCache.key = `${touchCache.touchS},${touchCache.touchZ}`;
            const action = MENU_ACTIONS.get(touchCache.key) || 
                          (touchCache.touchS >= 9 && touchCache.touchS <= 15 && touchCache.touchZ === 20 && MENU_ACTIONS.get('9,20')) ||
                          (touchCache.touchS >= 19 && touchCache.touchS <= 30 && touchCache.touchZ === 20 && MENU_ACTIONS.get('19,20')) ||
                          (touchCache.touchS >= 9 && touchCache.touchS <= 30 && touchCache.touchZ === 22 && MENU_ACTIONS.get('9,22'));
            
            action && action();
        })()
    );
    
    // Look-Modus Navigation
    const isLookMode = state === 'look' && !isMenuSingleTouch;
    isLookMode && (
        score_raum < room.length ? (score_raum++, init_room(score_raum)) :
        (state = 'menu', init_room(score_raum), menu_draw())
    );
    
    // Highscore Navigation
    const isHighscoreMode = state === 'highscore' && !isMenuSingleTouch && !isLookMode;
    isHighscoreMode && (state = 'menu', menu_draw());
    
    // Cleanup
    mouse_is_down = false;
    direction = 'stop';
    set_pos();
    single_touch = event.touches.length;
}

function touch_xy(event) {
    // preventDefault() nur wenn nicht passiv registriert
    event.cancelable && event.preventDefault();
    touch_x = event.targetTouches[0].pageX;
    touch_y = event.targetTouches[0].pageY;
    joy_on && (joy_x = touch_x, joy_y = touch_y, joy_on = false);
    set_pos();
}

function set_pos() {
    mouse_is_down && (() => {
        // Deltas in Cache berechnen (GC-optimiert)
        touchCache.deltaX = joy_x - touch_x;
        touchCache.deltaY = joy_y - touch_y;
        touchCache.absDeltaX = Math.abs(touchCache.deltaX);
        touchCache.absDeltaY = Math.abs(touchCache.deltaY);
        
        // Bestimme dominante Achse und Richtung
        const is_horizontal = touchCache.absDeltaX > touchCache.absDeltaY;
        const new_direction = is_horizontal ? 
            (touchCache.deltaX < -TOUCH_THRESHOLD ? 'rechts' : touchCache.deltaX > TOUCH_THRESHOLD ? 'links' : null) :
            (touchCache.deltaY < -TOUCH_THRESHOLD ? 'runter' : touchCache.deltaY > TOUCH_THRESHOLD ? 'hoch' : null);
        
        // Richtung setzen wenn Schwellwert überschritten und Richtung neu
        const shouldChangeDirection = new_direction && direction !== new_direction;
        shouldChangeDirection && (
            direction = new_direction,
            joy_x = touch_x,
            joy_y = touch_y
        );
    })();
    
    // Touch-Events bei Richtungsänderung
    const directionChanged = direction !== last_direction;
    directionChanged && (
        direction === 'stop' ? keys_stack.length = 0 : (() => {
            touchCache.key = DIRECTION_MAP[direction];
            touchCache.keyIndex = keys_stack.indexOf(touchCache.key);
            
            // Optimierte Stack-Manipulation
            touchCache.keyIndex !== -1 && keys_stack.splice(touchCache.keyIndex, 1);
            keys_stack.push(touchCache.key);
            
            // Digger-Richtung setzen
            const isPlayState = state === 'play';
            isPlayState && (
                digger_idle = false,
                digger_go = DIGGER_DIRECTION_MAP[touchCache.key],
                digger_go_handled = false
            );
        })(),
        last_direction = direction
    );
}

function touch_cancel() {
    mouse_is_down = false;
    direction = 'stop';
    joy_on = false;
    touch_flag = false;
    set_pos();
    single_touch = 0;
}