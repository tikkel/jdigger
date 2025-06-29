// jdigger/Digger.JS - Touch support on Smartphone/Tablet
// Copyright (C) 2019–2025  Marko Klingner
// GNU GPL v3 - https://www.gnu.org/licenses/gpl-3.0.html


function touchDown(e) {
    touch_flag = true;
    const touches = e.touches.length;

    // 3 Finger Tap (entspricht [Q], Abbruch und zurück zum Menü)
    if (touches > 2) {
        if (state == 'play' || state == 'init') {
            idle_stop();
            state = 'menu';
            // Spielstand resetten
            score_punkte = 0;
            score_leben = LEBENMAX;
            score_raum = 1;
            storageGameSave();
            init_room(score_raum);
            menuDraw();
        }
    }
    // 2 Finger Tap (entspricht [Esc], Abbruch und Level neu starten)
    else if (touches > 1) {
        if (state == 'play') digger_death = true;
        else if (state == 'highscore' || state == 'look') {
            state = 'menu';
            menuDraw();
        }
    }
    // 1 Finger Tap - im Spiel und tot
    else if (state == 'play' && digger_death) {
        if (score_leben < LEBENMIN) {
            // Virtuelle Tastatur einblenden
            const body = document.body;
            body.removeEventListener('click', vkb_focus, false);
            body.addEventListener('click', vkb_focus, false);
            body.removeEventListener('input', vkb_input, false);
            body.addEventListener('input', vkb_input, false);
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
    }
    // Im Spiel - Richtungsgesten
    else {
        mouseIsDown = joyOn = true;
        touchXY(e);
    }
}

function touchUp(e) {
    // Im Menu
    if (state == 'menu' && single_touch == 0) {
        // Resume or Init audioContext
        try { audioContext.resume(); } catch (e) { initAudio(); }
        
        // iOS, initiiere Sound von Benutzergeste aus
        playAudio('Leer');

        const touch = e.changedTouches[0];
        const touchS = touch.pageX / (body_width / 40) << 0;
        const touchZ = touch.pageY / (body_height / 30) << 0;

        // P: Play
        if (touchS >= 9 && touchS <= 15 && touchZ == 20) {
            storageGameRestore();
            state = 'init';
            init_room(score_raum);
        }
        // H: Highscore
        else if (touchS >= 19 && touchS <= 30 && touchZ == 20) {
            state = 'highscore';
            highscoreDraw();
        }
        // L: Look at the rooms
        else if (touchS >= 9 && touchS <= 30 && touchZ == 22) {
            state = 'look';
            init_room(score_raum);
        }
    }
    // Im Look
    else if (state == 'look') {
        if (score_raum < room.length) {
            score_raum++;
            init_room(score_raum);
        } else {
            // Letzten Raum erreicht
            state = 'menu';
            score_punkte = 0;
            score_leben = LEBENMAX;
            score_raum = 1;
            init_room(score_raum);
            menuDraw();
        }
    }
    // Im Highscore
    else if (state == 'highscore') {
        state = 'menu';
        menuDraw();
    }

    // Im Spiel
    mouseIsDown = false;
    direction = 'stop';
    setPos();
    single_touch = e.touches.length;
}

function touchXY(e) {
    e.preventDefault(); // iOS, scrollen verhindern
    touchX = e.targetTouches[0].pageX;
    touchY = e.targetTouches[0].pageY;
    if (joyOn) {
        joyX = touchX;
        joyY = touchY;
        joyOn = false;
    }
    setPos();
}

function setPos() {
    if (mouseIsDown) {
        const deltaX = joyX - touchX;
        const deltaY = joyY - touchY;
        
        // Richtung bestimmen basierend auf Bewegungsdelta
        if (deltaX < -30 && direction != 'rechts') {
            direction = 'rechts';
            joyX = touchX;
            joyY = touchY;
        } else if (deltaX > 30 && direction != 'links') {
            direction = 'links';
            joyX = touchX;
            joyY = touchY;
        } else if (deltaY < -30 && direction != 'runter') {
            direction = 'runter';
            joyX = touchX;
            joyY = touchY;
        } else if (deltaY > 30 && direction != 'hoch') {
            direction = 'hoch';
            joyX = touchX;
            joyY = touchY;
        }
    }
    
    // Keyboard-Events nur bei Richtungsänderung auslösen
    if (direction != ldirection) {
        const actions = {
            'links': kb_press_left,
            'rechts': kb_press_right,
            'hoch': kb_press_up,
            'runter': kb_press_down,
            'stop': kb_unpress
        };
        actions[direction]();
        ldirection = direction;
    }
}

function touchCancel(e) {
    // Touch wurde unterbrochen - State zurücksetzen
    mouseIsDown = false;
    direction = 'stop';
    joyOn = false;
    touch_flag = false;
    setPos();
    single_touch = 0;
}
