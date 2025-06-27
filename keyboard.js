// K E Y   P R E S S
//https://keycode.info/
function kb_press(taste) {

    handled = false;
    if (state != 'input') {

        switch (taste.keyCode || taste.which) {
            //q Quit
            case 81:
                if ((state == 'play') || (state == 'init')) {
                    idle_stop();
                    state = 'menu';
                    //spielstand resetten
                    score_punkte = 0;
                    score_leben = LEBENMAX;
                    score_raum = 1;
                    storageGameSave(); //spielstand sichern
                    init_room(score_raum);
                    menuDraw();
                }
                handled = true;
                break;
            //h Highscore
            case 72:
                if (state == 'menu') {
                    state = 'highscore';
                    highscoreDraw();
                }
                handled = true;
                break;
            //9
            case 57:
                cheat_tmp = '9' + cheat_tmp;
                handled = true;
                break;
            //d
            case 68:
                cheat_tmp = cheat_tmp + 'd';
                if (cheat_tmp == '99d') {
                    if (!digger_cheat) digger_cheat = true;
                    else digger_cheat = false;
                }
                cheat_tmp = '';
                handled = true;
                break;
            //Escape
            case 27:
                if (state == 'play')
                    digger_death = true;
                else if (state == 'highscore' || state == 'look') {
                    state = 'menu';
                    menuDraw();
                }
                handled = true;
                break;
            //Enter
            case 13:
            //Space
            case 32:
                if ((state == 'play') && digger_death) {

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
                    storageGameSave(); //spielstand sichern

                } else if (state == 'highscore') {
                    state = 'menu';
                    menuDraw();
                }
                handled = true;
                break;
            //p Play
            case 80:
                if (state == 'menu') {
                    //Resume or Init audioContext
                    try {
                        audioContext.resume();
                    } catch (e) {
                        initAudio();
                    }
                    storageGameRestore(); //spielstand restaurieren
                    state = 'init';
                    init_room(score_raum);
                }
                handled = true;
                break;
            //pos1 (+shiftKey)
            case 36:
                if (digger_cheat && ((state == 'play') || (state == 'init'))) {
                    if (!taste.shiftKey && (score_raum < room.length)) {
                        idle_stop();
                        score_raum++;
                        state = 'init';
                        init_room(score_raum);
                        storageGameSave();
                    }
                    else if (taste.shiftKey && (score_raum > 1)) {
                        idle_stop();
                        score_raum--;
                        state = 'init';
                        init_room(score_raum);
                        storageGameSave();
                    }
                }
                handled = true;
                break;
            //l Look
            case 76:
                if (state == 'menu') {
                    state = 'look';
                    init_room(score_raum);
                } else if (state == 'look') {
                    if (!taste.shiftKey && (score_raum < room.length)) {
                        score_raum++;
                        init_room(score_raum);
                    }
                    else if (taste.shiftKey && (score_raum > 1)) {
                        score_raum--;
                        init_room(score_raum);
                    }
                }
                handled = true;
                break;

            //oben
            case 38:
                kb_press_up();
                handled = true;
                break;
            //unten
            case 40:
                kb_press_down();
                handled = true;
                break;
            //links
            case 37:
                kb_press_left();
                handled = true;
                break;
            //rechts
            case 39:
                kb_press_right();
                handled = true;
                break;

        }

    } else {
        if (taste.key == 'Backspace')
            //input = 8;
            input = taste.key;
    }

    // Eventweiterleitung ab hier verhindern
    if (handled)
        taste.preventDefault();
}

function kb_press_up() {
    if (!digger_start_up) {
        digger_up = true;
        digger_go = 'UP';
        digger_idle = false;
        digger_start_up = true;
    }
}

function kb_press_down() {
    if (!digger_start_down) {
        digger_down = true;
        digger_go = 'DOWN';
        digger_idle = false;
        digger_start_down = true;
    }
}

function kb_press_left() {
    if (!digger_start_left) {
        digger_left = true;
        digger_go = 'LEFT';
        digger_idle = false;
        digger_start_left = true;
    }
}

function kb_press_right() {
    if (!digger_start_right) {
        digger_right = true;
        digger_go = 'RIGHT';
        digger_idle = false;
        digger_start_right = true;
    }
}

//KEYRELEASE (nur für die Richtungssteuerung (37,38,39,40))
function kb_release(taste) {

    if (state != 'input') {

        switch (taste.keyCode || taste.which) {

            //oben
            case 38:
                kb_release_up();
                handled = true;
                break;
            //unten
            case 40:
                kb_release_down();
                handled = true;
                break;
            //links
            case 37:
                kb_release_left();
                handled = true;
                break;
            //rechts
            case 39:
                kb_release_right();
                handled = true;
                break;

        }
    }

}

function kb_release_up() {
    // warte eine Bewegung bis zum 1. Step (!digger_half_step) ab
    if (digger_start_up)
        window.setTimeout(kb_release_up, 10);
    else {
        digger_up = false;
        if (digger_down)
            digger_go = 'DOWN';
        else if (digger_left)
            digger_go = 'LEFT';
        else if (digger_right)
            digger_go = 'RIGHT';
        else
            digger_go = 'NONE';
    }
}

function kb_release_down() {
    // warte eine Bewegung bis zum 1. Step (!digger_half_step) ab
    if (digger_start_down)
        window.setTimeout(kb_release_down, 10);
    else {
        digger_down = false;
        if (digger_up)
            digger_go = 'UP';
        else if (digger_left)
            digger_go = 'LEFT';
        else if (digger_right)
            digger_go = 'RIGHT';
        else
            digger_go = 'NONE';
    }
}

function kb_release_left() {
    // warte eine Bewegung bis zum 1. Step (!digger_half_step) ab
    if (digger_start_left)
        window.setTimeout(kb_release_left, 10);
    else {
        digger_left = false;
        if (digger_up)
            digger_go = 'UP';
        else if (digger_down)
            digger_go = 'DOWN';
        else if (digger_right)
            digger_go = 'RIGHT';
        else
            digger_go = 'NONE';
    }
}

function kb_release_right() {
    // warte eine Bewegung bis zum 1. Step (!digger_half_step) ab
    if (digger_start_right)
        window.setTimeout(kb_release_right, 10);
    else {
        digger_right = false;
        if (digger_up)
            digger_go = 'UP';
        else if (digger_down)
            digger_go = 'DOWN';
        else if (digger_left)
            digger_go = 'LEFT';
        else
            digger_go = 'NONE';
    }
}

function kb_unpress() {
    // alles stop, bei touchrelease
    kb_release_up();
    kb_release_down();
    kb_release_left();
    kb_release_right();
}
