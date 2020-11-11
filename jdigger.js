//     jdigger/Digger.JS
//     Copyright (C) 2019  Marko Klingner
//
//     Dieses Programm ist freie Software. Sie können es unter den Bedingungen der GNU General Public License,
//     wie von der Free Software Foundation veröffentlicht, weitergeben und/oder modifizieren, entweder gemäß
//     Version 3 der Lizenz oder (nach Ihrer Option) jeder späteren Version.
//
//     Die Veröffentlichung dieses Programms erfolgt in der Hoffnung, daß es Ihnen von Nutzen sein wird, aber
//     OHNE IRGENDEINE GARANTIE, sogar ohne die implizite Garantie der MARKTREIFE oder der VERWENDBARKEIT FÜR
//     EINEN BESTIMMTEN ZWECK. Details finden Sie in der GNU General Public License.
//
//     Sie sollten ein Exemplar der GNU General Public License zusammen mit diesem Programm erhalten haben.
//     Falls nicht, siehe <http://www.gnu.org/licenses/>.


function init_events() {
    //Touch aktivieren (Handy, Tablet)
    document.body.addEventListener('touchstart', touchDown, false);
    document.body.addEventListener('touchmove', touchXY, true);
    document.body.addEventListener('touchend', touchUp, false);
    document.body.addEventListener('touchcancel', touchUp, false);

    //Maus und Tastatur aktivieren (PC, LG-SmartTV)
    document.body.addEventListener('click', mo_press, false);
    document.body.addEventListener('keydown', kb_press, false);
    document.body.addEventListener('keyup', kb_release, false);
    document.body.addEventListener('keypress', kb_input, false);

    //window.addEventListener('DOMContentLoaded', reset_scale, false);
    window.addEventListener("resize", reset_scale, false);
}

//Highscore laden und aktualisieren
function highscore_update() {
    //lade Array
    var h;
    try { //wird localStorage unterstützt?
        if (localStorage.getItem("highscore"))
            highscore = JSON.parse(localStorage.getItem("highscore"));
    } catch (e) { //ansonsten Cookies benutzen
        var name = "highscore=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                highscore = JSON.parse(c.substring(name.length, c.length));
            }
        }
    }

    //highscore[] vorbelegen
    if (highscore[0] == undefined) {
        console.log('highscore_update: generiere Default-Highscore');
        highscore[0] = "10000  --------------";
        highscore[1] = "09000  Digger";
        highscore[2] = "08000  (c) 1988 by";
        highscore[3] = "07000  Alexander Lang";
        highscore[4] = "06000  --------------";
        for (h = 5; h < 20; h++) {
            highscore[h] = "00000";
        }
    }

    //über alle 20 Einträge iterieren
    for (h = 0; h < 20; h++) {
        //aktueller score > als aktueller Highscore-Eintrag
        if (score_punkte > Number(highscore[h].substring(0, 5))) {

            //Zeile merken für drawInput()
            input_line = h;

            //Array bis zum aktuellen Eintrag nach unten verschieben
            for (var m = 19; m > h; m--)
                highscore[m] = highscore[m - 1];

            //Highscore-Eintrag mit neuen Score überschreiben
            //"score_punkte" auf 5 Stellen trimmen
            var sp = "" + score_punkte;
            while (sp.length < 5)
                sp = "0" + sp;
            highscore[h] = sp;

            state = 'input';
            break;
        }
    }
}

//Highscore sichern
function highscore_save() {
    //schreibe Array
    try { //wird localStorage unterstützt?
        localStorage.setItem("highscore", JSON.stringify(highscore));
    } catch (e) { //ansonsten Cookies benutzen
        var d = new Date();
        d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = "highscore=" + JSON.stringify(highscore) + "; " + expires;
    }
}

//Spielstand sichern
function game_save() {
    try { //wird localStorage unterstützt?
        localStorage.setItem("level", score_raum);
        localStorage.setItem("lives", score_leben);
        localStorage.setItem("score", score_punkte);
        console.log('game_save: nach localStorage: Raum:' + score_raum + ' Leben:' + score_leben + ' Punkte:' + score_punkte);
    } catch (e) { //ansonsten Cookies benutzen
        var d = new Date();
        d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = "level=" + score_raum + "; " + expires;
        document.cookie = "lives=" + score_leben + "; " + expires;
        document.cookie = "score=" + score_punkte + "; " + expires;
        console.log('game_save: nach Cookies: Raum:' + score_raum + ' Leben:' + score_leben + ' Punkte:' + score_punkte);
    }
}
//Spielstand restaurieren
function game_restore() {
    var ca;
    var i;
    var c;
    try { //wird localStorage unterstützt?
        if (localStorage.getItem("level"))
            score_raum = Number(localStorage.getItem("level"));
        if (localStorage.getItem("lives"))
            score_leben = Number(localStorage.getItem("lives"));
        if (localStorage.getItem("score"))
            score_punkte = Number(localStorage.getItem("score"));
        console.log('game_restore: von localStorage: Raum:' + score_raum + ' Leben:' + score_leben + ' Punkte:' + score_punkte);
    } catch (e) { //ansonsten Cookies benutzen
        var name = "level=";
        ca = document.cookie.split(';');
        for (i = 0; i < ca.length; i++) {
            c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0)
                score_raum = Number(c.substring(name.length, c.length));
        }

        name = "lives=";
        ca = document.cookie.split(';');
        for (i = 0; i < ca.length; i++) {
            c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                score_leben = Number(c.substring(name.length, c.length));
            }
        }

        name = "score=";
        ca = document.cookie.split(';');
        for (i = 0; i < ca.length; i++) {
            c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                score_punkte = Number(c.substring(name.length, c.length));
            }
        }

        console.log('game_restore: von Cookies: Raum:' + score_raum + ' Leben:' + score_leben + ' Punkte:' + score_punkte);
    }
}


var direction = 'stop';
var ldirection = 'stop';
var touch_flag = false;
var fullscreen_flag = false;
var single_touch = 0;
var mouseIsDown = false;
var joyOn = false;
var joyX = 0;
var joyY = 0;

//MAUS-Click
function mo_press(ev) {
    //Fullscreen
    if (!fullscreen_flag)
        fullscreen();

    if (!touch_flag) {

        //Mausposition
        var mausX = (ev.pageX / (body_width / 40)) << 0;
        var mausY = (ev.pageY / (body_height / 30)) << 0;

        //im Menu
        if (state == 'menu') {
            //Safari und Chrome. enable paused audioContext
            try {
                audioContext.resume();
            } catch (e) {}

            //P: Play
            if (mausX >= 9 && mausX <= 15 && mausY == 20) {
                game_restore(); //spielstand restaurieren
                state = 'init';
                init_room(score_raum);
            }
            //H: Highscore
            else if (mausX >= 19 && mausX <= 30 && mausY == 20) {
                state = 'highscore';
                drawHighscore();
            }
            //L: Look at the rooms
            else if (mausX >= 9 && mausX <= 30 && mausY == 22) {
                state = 'look';
                init_room(score_raum);
            }
        }

        //im Look
        else if ((state == 'look') && (score_raum < room.length)) {
            score_raum++;
            init_room(score_raum);
        }

        //im Look und letzten Raum erreicht
        else if ((state == 'look') && (score_raum >= room.length)) {
            state = 'menu';
            score_punkte = 0;
            score_leben = LEBENMAX;
            score_raum = 1;
            init_room(score_raum);
            drawMenu();
        }

        //im Spiel
        else if ((state == 'play') && digger_death) {

            if (score_leben < LEBENMIN) {
                state = 'highscore';
                drawHighscore();
                score_punkte = 0;
                score_leben = LEBENMAX;
                score_raum = 1;
            } else {
                state = 'init';
                init_room(score_raum);
            }
            game_save(); //spielstand sichern

        }

        //im Highscore
        else if (state == 'highscore') {
            state = 'menu';
            drawMenu();
        }
    } else
        touch_flag = false;
}

function touchDown(e) {
    touch_flag = true;

    //3 Finger Tap (entspricht [Q], Abbruch und zurück zum Menü)
    if (e.touches.length > 2) {
        //q Quit
        if ((state == 'play') || (state == 'init')) {
            idle_stop();
            state = 'menu';
            //spielstand resetten
            score_punkte = 0;
            score_leben = LEBENMAX;
            score_raum = 1;
            game_save(); //spielstand sichern
            init_room(score_raum);
            drawMenu();
        }
    }

    //2 Finger Tap (entspricht [Esc], Abbruch und Level neu starten)
    else if (e.touches.length > 1) {
        //ESC
        if (state == 'play')
            digger_death = true;
        else if (state == 'highscore' || state == 'look') {
            state = 'menu';
            drawMenu();
        }
    }

    //1 Finger Tap
    //im Spiel und tot
    else if ((state == 'play') && digger_death) {

        if (score_leben < LEBENMIN) {
            //virtuelle Tastatur einblenden
            document.body.removeEventListener('click', vkb_focus, false);
            document.body.addEventListener('click', vkb_focus, false);
            document.body.removeEventListener('input', vkb_input, false);
            document.body.addEventListener('input', vkb_input, false);
            state = 'highscore';
            drawHighscore();
            score_punkte = 0;
            score_leben = LEBENMAX;
            score_raum = 1;
        } else {
            state = 'init';
            init_room(score_raum);
        }
        game_save(); //spielstand sichern

    }

    //im Spiel
    else {
        //Richtungsgesten
        mouseIsDown = true;
        joyOn = true;
        touchXY(e);
    }
}

function touchUp(e) {
    //im Menu
    if (state == 'menu' && single_touch == 0) {
        //Safari und Chrome. enable paused audioContext
        try {
            audioContext.resume();
        } catch (e) {}

        //iOS, initiiere Sound von Benutzergeste aus
        playAudio('Leer');

        var touchS = e.changedTouches[0].pageX / (body_width / 40) << 0;
        var touchZ = e.changedTouches[0].pageY / (body_height / 30) << 0;

        //P: Play
        if (touchS >= 9 && touchS <= 15 && touchZ == 20) {
            game_restore(); //spielstand restaurieren
            state = 'init';
            init_room(score_raum);
        }
        //H: Highscore
        else if (touchS >= 19 && touchS <= 30 && touchZ == 20) {
            state = 'highscore';
            drawHighscore();
        }
        //L: Look at the rooms
        else if (touchS >= 9 && touchS <= 30 && touchZ == 22) {
            state = 'look';
            init_room(score_raum);
        }
    }

    //im Look
    else if ((state == 'look') && (score_raum < room.length)) {
        score_raum++;
        init_room(score_raum);
    }

    //im Look und letzten Raum erreicht
    else if ((state == 'look') && (score_raum >= room.length)) {
        state = 'menu';
        score_punkte = 0;
        score_leben = LEBENMAX;
        score_raum = 1;
        init_room(score_raum);
        drawMenu();
    }

    //im Highscore
    else if (state == 'highscore') {
        state = 'menu';
        drawMenu();
    }

    //im Spiel
    mouseIsDown = false;
    direction = 'stop';
    setPos();

    //letzte Fingeranzahl merken
    single_touch = e.touches.length;
}

var touchX;
var touchY;

function touchXY(e) {
    e.preventDefault(); //iOS, scrollen verhindern
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
        if (((joyX - touchX) < -30) && (direction != 'rechts')) {
            direction = 'rechts';
            joyX = touchX;
            joyY = touchY;
        }
        if ((joyX - touchX) > 30 && (direction != 'links')) {
            direction = 'links';
            joyX = touchX;
            joyY = touchY;
        }
        if ((joyY - touchY) < -30 && (direction != 'runter')) {
            direction = 'runter';
            joyX = touchX;
            joyY = touchY;
        }
        if ((joyY - touchY) > 30 && (direction != 'hoch')) {
            direction = 'hoch';
            joyX = touchX;
            joyY = touchY;
        }
    }
    switch (direction) {
        case 'links':
            if (direction != ldirection)
                kb_press_left();
            ldirection = direction;
            break;
        case 'rechts':
            if (direction != ldirection)
                kb_press_right();
            ldirection = direction;
            break;
        case 'hoch':
            if (direction != ldirection)
                kb_press_up();
            ldirection = direction;
            break;
        case 'runter':
            if (direction != ldirection)
                kb_press_down();
            ldirection = direction;
            break;
        case 'stop':
            if (direction != ldirection)
                kb_unpress();
            ldirection = direction;
            break;
    }
}

//FULLSCREEN
function fullscreen() {
    if (navigator.vibrate)
        navigator.vibrate(1);
    var i = document.getElementById('body');
    // go full-screen
    if (i.requestFullscreen) {
        i.requestFullscreen();
        fullscreen_flag = true;
    } else if (i.webkitRequestFullscreen) {
        i.webkitRequestFullscreen();
        fullscreen_flag = true;
    } else if (i.mozRequestFullScreen) {
        i.mozRequestFullScreen();
        fullscreen_flag = true;
    } else if (i.msRequestFullscreen) {
        i.msRequestFullscreen();
        fullscreen_flag = true;
    }
}

//NOFULLSCREEN
function exit_fullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}

function idle_start() {
    //EXIT(41) finden und Digger dort setzen (auch mehrfach, siehe Raum29/Level30)
    for (var l = 1; l < 281; l++) {
        if (idx[l] == 41)
            idx[l] = 8.1;
    }
    ton_diamant = true;
    state = 'play';
}

function idle_stop() {
    window.clearTimeout(verz);
}

// H I G H S C O R E   I N P U T
var virt_kbd_last_length;
//Highscore-ALIAS-Eingabe (PC)
function kb_input(taste) {
    if (state == 'input')
        input = taste.key.replace(/[^a-zA-Z0-9!"#$%&()*+,./:;<=>?@\-\s]+/g, '');
}

//Highscore-ALIAS-Eingabe (Table, Handy, LG-SmartTV)
function vkb_input() {
    if (state == 'input' && (virt_kbd_last_length < virt_kbd.value.length)) {
        input = virt_kbd.value.charAt(virt_kbd.value.length - 1).replace(/[^a-zA-Z0-9!"#$%&()*+,./:;<=>?@\-\s]+/g, '');
        virt_kbd_last_length = virt_kbd.value.length;
    } else {
        input = 'Backspace';
        virt_kbd_last_length = virt_kbd.value.length;
    }
}

//virtuelle Tastatur einblenden (Tablet, Handy)
function vkb_focus() {
    exit_fullscreen();
    virt_kbd.focus();
    virt_kbd.value = "";
    virt_kbd_last_length = -1;
}

// K E Y   P R E S S
//https://keycode.info/
var handled = true;

function kb_press(taste) {
    //Safari und Chrome. enable paused audioContext
    try {
        audioContext.resume();
    } catch (e) {}

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
                    game_save(); //spielstand sichern
                    init_room(score_raum);
                    drawMenu();
                }
                handled = true;
                break;
                //h Highscore
            case 72:
                if (state == 'menu') {
                    state = 'highscore';
                    drawHighscore();
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
                //pos1
            case 36:
                if ((score_raum < room.length) && digger_cheat) {
                    idle_stop();
                    next_raum = true;
                }
                handled = true;
                break;
                //Escape
            case 27:
                if (state == 'play')
                    digger_death = true;
                else if (state == 'highscore' || state == 'look') {
                    state = 'menu';
                    drawMenu();
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
                        drawHighscore();
                        score_punkte = 0;
                        score_leben = LEBENMAX;
                        score_raum = 1;
                    } else {
                        state = 'init';
                        init_room(score_raum);
                    }
                    game_save(); //spielstand sichern

                } else if (state == 'highscore') {
                    state = 'menu';
                    drawMenu();
                }
                handled = true;
                break;
                //p Play
            case 80:
                if (state == 'menu') {
                    game_restore(); //spielstand restaurieren
                    state = 'init';
                    init_room(score_raum);
                }
                handled = true;
                break;
                //l Look
            case 76:
                if (state == 'menu') {
                    state = 'look';
                    init_room(score_raum);
                } else if ((score_raum < room.length) && (state == 'look')) {
                    score_raum++;
                    init_room(score_raum);
                } else if ((score_raum >= room.length) && (state == 'look')) {
                    state = 'menu';
                    score_punkte = 0;
                    score_leben = LEBENMAX;
                    score_raum = 1;
                    init_room(score_raum);
                    drawMenu();
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
            //    input = 8;
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

function init_room(level) {
    console.log('Level: ' + level);
    digger_idle = true;
    digger_half_step = false;
    digger_go = 'NONE';
    digger_is_dead = false;
    digger_left = false;
    digger_up = false;
    digger_right = false;
    digger_down = false;
    digger_death = false;
    score_ges = 0;
    score_zeit = 5000;
    var trans;
    var richtung;

    // Raum(level) initialisieren(idx[])
    // orig. NOTHING=0 STONE=1 GROUND=2 GHOST=0x3,0x7,0xB,0xF LDIGGER=4 DIAMOND=5 WALL=6 UVSTONE=9 DIGGER=10 EXIT=12 CHANGER=14 FSTODMD=15
    // meins NOTHING=1 STONE=7 GROUND=2 GHOST=43, 47, 51, 55  LDIGGER=  DIAMOND=3 WALL=4 UVSTONE=7 DIGGER=8  EXIT=6  CHANGER=5  FSTODMD=
    // 1=room 2= 3= 4= 5=
    // 6=diggerX 7=diggerY
    // 8=diamonds
    // 9=ghost1_dir, ghost2_dir 10= 11= 12= 13= 14= 15= 16= // byteweise auslesen (9-16), initial Richtung des Geistes
    // orig. 0x0=down, 0x1=up, 0x2=right, 0x3=left  ausgelesener Parameter: Geister-Richtung
    // meins  43=down,  45=up,  44=right,  46=left  180
    // meins  47=down,  49=up,  48=right,  50=left  90L
    // meins  51=down,  53=up,  52=right,  54=left  90R
    // trans       +0,     +2,        +1,       +3  Geisttyp und Richtung errechnen

    // meins  55=down,  57=up,  56=right,  58=left  90LR    zuletzt rechts abgebogen
    // meins  59=down,  61=up,  60=right,  62=left  90RL    zuletzt links abgebogen


    //zu sammelnde Diamanten (2 Byte auslesen, dezimal interpretiert)
    score_dia = ((room[level - 1][139 + 8]) >> 0x04) * 10 + ((room[level - 1][139 + 8]) & 0x0F);

    //Anzahl Geister
    var geist_nr = 0;
    var p = 'l'; //l, r

    var j = 1;
    for (var i = 0; i < 140; i++) {
        //bit 5-8
        trans = (room[level - 1][i]) >> 0x04;
        if (trans == 0) trans = 1.1;
        else if (trans == 1) trans = 7.1;
        else if (trans == 2) trans = 2.1;
        else if (trans == 3) trans = 43.1; // ghost_180
        else if (trans == 5) trans = 3.1;
        else if (trans == 6) trans = 4.1;
        else if (trans == 7) trans = 47.1; // ghost_90left
        else if (trans == 9) trans = 7.1;
        else if (trans == 10) trans = 41.1;
        else if (trans == 11) trans = 55.1; // ghost_90right
        else if (trans == 12) trans = 6.1;
        else if (trans == 14) trans = 5.1;
        else if (trans == 15) trans = 51.1; // ghost_90leftright
        // Geist-Richtung aus P9-P16 holen
        if ((trans >= 43) && (trans < 63)) {
            richtung = (p == 'l') ? (room[level - 1][0x94 + ((geist_nr / 2) << 0)]) >> 0x04 : (room[level - 1][0x94 + ((geist_nr / 2) << 0)]) & 0x0F;
            if (richtung == 1) trans = trans + 2;
            else if (richtung == 2) trans = trans + 1;
            else if (richtung == 3) trans = trans + 3;
            geist_nr++;
            if (p == 'l') p = 'r';
            else p = 'l';
        }
        idx[j] = trans;
        j++;

        //bit 1-4
        trans = (room[level - 1][i]) & 0x0F;
        if (trans == 0) trans = 1.1;
        else if (trans == 1) trans = 7.1;
        else if (trans == 2) trans = 2.1;
        else if (trans == 3) trans = 43.1; // ghost_180
        else if (trans == 5) trans = 3.1;
        else if (trans == 6) trans = 4.1;
        else if (trans == 7) trans = 47.1; // ghost_90left
        else if (trans == 9) trans = 7.1;
        else if (trans == 10) trans = 41.1;
        else if (trans == 11) trans = 55.1; // ghost_90right
        else if (trans == 12) trans = 6.1;
        else if (trans == 14) trans = 5.1;
        else if (trans == 15) trans = 51.1; // ghost_90leftright
        // Geist-Richtung aus P9-P16 holen
        if ((trans >= 43) && (trans < 63)) {
            richtung = (p == 'l') ? (room[level - 1][0x94 + ((geist_nr / 2) << 0)]) >> 0x04 : (room[level - 1][0x94 + ((geist_nr / 2) << 0)]) & 0x0F;
            if (richtung == 1) trans = trans + 2;
            else if (richtung == 2) trans = trans + 1;
            else if (richtung == 3) trans = trans + 3;
            geist_nr++;
            if (p == 'l') p = 'r';
            else p = 'l';
        }
        idx[j] = trans;
        j++;
    }
    console.log('gefundene Geister: ' + geist_nr);

    //Exitblinken zurücksetzen
    exit_blink = 41;

    //Digger initialisieren
    //Schrittanimation zurücksetzen
    digger_animation_left = false;
    digger_animation_right = false;
    digger_animation_up = false;
    digger_animation_down = false;
    digger_step_left = 13;
    digger_step_up = 9;
    digger_step_right = 19;
    digger_step_down = 11;
    //Diggerposition auslesen
    var d_x = ((room[level - 1][139 + 6]) >> 0x04) * 10 + ((room[level - 1][139 + 6]) & 0x0F);
    var d_y = (((room[level - 1][139 + 7]) >> 0x04) * 10 + ((room[level - 1][139 + 7]) & 0x0F) - 2);
    // bestimme den Index (d_idx) im Feld
    d_idx = (d_x + 1) + (d_y * 20);
    // bestimme die Malposition im Canvas
    digger_x = d_x * pre_icon_size;
    digger_y = d_y * pre_icon_size;

    //Statuszeile komplett berschreiben
    draw_header();

    //Menu-Bild unsichtbar
    document.getElementById('menudiv').style.visibility = "hidden";

    // Spiel verzögert starten (wenn Status init)
    if (state == 'init')
        verz = window.setTimeout(idle_start, 3000);
}

function draw_digger_death() {
    if (score_ges > 1) idx[d_idx - 21] = 3.1;
    else idx[d_idx - 21] = 0.1;
    if (score_ges > 0) idx[d_idx - 20] = 3.1;
    else idx[d_idx - 20] = 0.1;
    if (score_ges > 2) idx[d_idx - 19] = 3.1;
    else idx[d_idx - 19] = 0.1;
    if (score_ges > 3) idx[d_idx - 1] = 3.1;
    else idx[d_idx - 1] = 0.1;
    idx[d_idx] = 63.1;
    if (score_ges > 4) idx[d_idx + 1] = 3.1;
    else idx[d_idx + 1] = 0.1;
    if (score_ges > 6) idx[d_idx + 19] = 3.1;
    else idx[d_idx + 19] = 0.1;
    if (score_ges > 5) idx[d_idx + 20] = 3.1;
    else idx[d_idx + 20] = 0.1;
    if (score_ges > 7) idx[d_idx + 21] = 3.1;
    else idx[d_idx + 21] = 0.1;
    digger_is_dead = true;
    ton_diamant = true;
    //Diggeranimation zurücksetzen
    digger_animation_left = false;
    digger_animation_right = false;
    digger_animation_up = false;
    digger_animation_down = false;
    digger_step_left = 13;
    digger_step_up = 9;
    digger_step_right = 19;
    digger_step_down = 11;
}

//Softscroller
// via "CSS3 transition"
// Canvas-Verschiebung innerhalb des div-Containers (marginTop, marginLeft)
function soft_scroll() {
    var pre_abstand = pre_icon_size * 2;
    var duration = 90;

    //hin- und herscrollen bei der Raumvorschau "look"
    if (state == 'look') {
        duration = 15; //sehr langsames (15) Scrollen
        if (viewport_x == 0)
            digger_x = field_width;
        else
            digger_x = 0;
        if (viewport_y == 0)
            digger_y = field_height;
        else
            digger_y = 0;
    }

    //links, Randabstand < 2 Spritebreiten?
    if (((digger_x + viewport_x) < (pre_abstand)) && (actual_marginLeft <= viewport_x) && (viewport_x != 0)) {
        //scroll nach rechts, -x..0
        viewport_x = (diggerdiv_width / 2 - digger_x - pre_icon_size / 2) << 0;
        if (viewport_x > 0)
            viewport_x = 0;
        duration_x = Math.abs(viewport_x - actual_marginLeft) / duration / (pre_icon_size / 16);
        canvas_digger.style.transitionDuration = duration_y + "s" + ", " + duration_x + "s";
        canvas_digger.style.marginLeft = viewport_x + "px";
    }
    //rechts, Randabstand < 2 Spritebreiten?
    else if (((digger_x + pre_icon_size + viewport_x) > (diggerdiv_width - pre_abstand)) && (actual_marginLeft >= viewport_x) && (viewport_x != pre_max_w_offset)) {
        //scroll nach links, 0..+x
        viewport_x = (diggerdiv_width / 2 - digger_x - pre_icon_size / 2) << 0;
        if (viewport_x < pre_max_w_offset)
            viewport_x = pre_max_w_offset;
        if (viewport_x > 0)
            viewport_x = 0;
        duration_x = Math.abs(viewport_x - actual_marginLeft) / duration / (pre_icon_size / 16);
        canvas_digger.style.transitionDuration = duration_y + "s" + ", " + duration_x + "s";
        canvas_digger.style.marginLeft = viewport_x + "px";
    }

    //oben, Randabstand < 2 Spritehöhen
    if (((digger_y + viewport_y) < (pre_abstand)) && (actual_marginTop <= viewport_y) && (viewport_y != 0)) {
        //scroll nach unten, -y..0
        viewport_y = (diggerdiv_height / 2 - digger_y - pre_icon_size / 2) << 0;
        if (viewport_y > 0)
            viewport_y = 0;
        duration_y = Math.abs(viewport_y - actual_marginTop) / duration / (pre_icon_size / 16);
        canvas_digger.style.transitionDuration = duration_y + "s" + ", " + duration_x + "s";
        canvas_digger.style.marginTop = viewport_y + "px";
    }
    //unten, Randabstand < 2 Spritehöhen
    else if (((digger_y + pre_icon_size + viewport_y) > (diggerdiv_height - pre_abstand)) && (actual_marginTop >= viewport_y) && (viewport_y != pre_max_h_offset)) {
        //scroll nach oben, 0--+y
        viewport_y = (diggerdiv_height / 2 - digger_y - pre_icon_size / 2) << 0;
        if (viewport_y < pre_max_h_offset)
            viewport_y = pre_max_h_offset;
        if (viewport_y > 0)
            viewport_y = 0;
        duration_y = Math.abs(viewport_y - actual_marginTop) / duration / (pre_icon_size / 16);
        canvas_digger.style.transitionDuration = duration_y + "s" + ", " + duration_x + "s";
        canvas_digger.style.marginTop = viewport_y + "px";
    }

}

function draw_field() {
    actual_marginLeft = parseInt(window.getComputedStyle(canvas_digger).marginLeft, 10);
    actual_marginTop = parseInt(window.getComputedStyle(canvas_digger).marginTop, 10);
    var i, x, y, z, s;
    for (var l = 1; l < 281; l++) {
        // icon auslesen und nachkommastelle abschneiden
        i = idx[l] << 0;

        // ICON darstellen, wenn mit Nachkommastelle (>i), Diamant(3) oder Exit(41)
        if ((idx[l] > i) || (idx[l] == 3) || (idx[l] == 41)) {

            // Drawflag (Nachkommastelle != .0) löschen
            // Staub(0.1 - 0.6) und Geister(nn.2) sollen den Nachkommateil behalten.
            if (
                (i > 0) &&
                (idx[l] != 43.2) && (idx[l] != 44.2) && (idx[l] != 45.2) && (idx[l] != 46.2) &&
                (idx[l] != 47.2) && (idx[l] != 48.2) && (idx[l] != 49.2) && (idx[l] != 50.2) &&
                (idx[l] != 51.2) && (idx[l] != 52.2) && (idx[l] != 53.2) && (idx[l] != 54.2) &&
                (idx[l] != 55.2) && (idx[l] != 56.2) && (idx[l] != 57.2) && (idx[l] != 58.2) &&
                (idx[l] != 59.2) && (idx[l] != 60.2) && (idx[l] != 61.2) && (idx[l] != 62.2)
            )
                idx[l] = i;

            // bestimme die Malposition im Canvas
            z = ((l - 1) / 20) << 0;
            s = (l - 1) - (z * 20);
            y = z * pre_icon_size;
            x = s * pre_icon_size;

            // Diamant Blinksequenz setzen
            if (i == 3)
                i = (diamond_blink) + (z * 6) - (z * 6 / 10 << 0) * 10;
            if (i > 73)
                i -= 10;

            //Exit blinken lassen (41 exit <-> 42 wall)
            if (i == 41)
                i = exit_blink << 0;

            //Diggerposition im #diggerdiv bestimmen (8 bis 40 gleich Digger)
            if (i > 7 && i < 41) {
                digger_x = x;
                digger_y = y;
            }

            //Diamanten (64-73) nur zeichnen, wenn im sichtbaren Bereich
            if ((i < 64) || ((x + actual_marginLeft + pre_icon_size) >= 0) && ((x + actual_marginLeft) <= diggerdiv_width) && ((y + actual_marginTop + pre_icon_size) >= 0) && ((y + actual_marginTop) <= diggerdiv_height))
                // vorskaliertes Icon aus "buffer_canvas" ins sichtbare Canvas zeichnen
                context_digger.drawImage(buffer_canvas, 0, sprites[i] * pre_icon_size, pre_icon_size, pre_icon_size, x, y, pre_icon_size, pre_icon_size);
        }
    }
}

function update_header() {
    //refresh "übrige Leben" wenn getötet
    if (digger_death) {
        var sl = "" + score_leben;
        while (sl.length < 2)
            sl = "0" + sl;
        drawText(sl, 7, 0);
    }

    //refresh "Countdown"
    var sz = "" + score_zeit;
    while (sz.length < 4)
        sz = "0" + sz;
    //blinken, wenn weniger als 1000
    if ((score_zeit < 1000) && ((score_zeit % 4) <= 1) && (score_zeit != 0)) {
        sz = "    ";
    }
    drawText(sz, 15, 0);

    //refresh "gesammelte Diamanten"
    var sg = "" + score_ges;
    while (sg.length < 2)
        sg = "0" + sg;
    drawText(sg, 23, 0);

    //refresh "gesamte Punktanzahl"
    var sp = "" + score_punkte;
    while (sp.length < 5)
        sp = "0" + sp;
    drawText(sp, 33, 0);
}

//wenn möglich, schönen Pixelsalat zeichnen
function setpixelated(ctx) {
    ctx.imageSmoothingEnabled = false; /* standard */
    //ctx.mozImageSmoothingEnabled = false; /* Firefox */
    ctx.oImageSmoothingEnabled = false; /* Opera */
    ctx.webkitImageSmoothingEnabled = false; /* Safari */
    ctx.msImageSmoothingEnabled = false; /* IE */
}

var canvas_scoreline = document.getElementById('scoreline');
var canvas_digger = document.getElementById('digger');
var canvas_menuimg = document.getElementById('menuimg');

var context_scoreline = canvas_scoreline.getContext('2d', {
    alpha: false
});
var context_digger = canvas_digger.getContext('2d', {
    alpha: false
});
var context_menuimg = canvas_menuimg.getContext('2d', {
    alpha: false
});

setpixelated(context_scoreline);
setpixelated(context_digger);
setpixelated(context_menuimg);

// 0 Staub
// 1 Nothing
// 2 Ground
// 3 Diamant
// 4 Wall
// 5 Changer
// 6 Exit
// 7 Stein
// 8 Digger
// 43-46 Ghost 180
// 47-50 Ghost 90L
// 51-54 Ghost 90R
// 55-58 Ghost 90LR
// 59-62 Ghost 90RL
// 63 Kreuz
function draw_frame() {

    if (state == 'look' || state == 'init' || state == 'play') {

        //Spielfrequenz um die hälfte teilen
        if (takt_teiler == 1) {

            //FRAME 1/2
            if (!digger_half_step) {

                //DIGGER HALT
                if ((state == 'play') && !digger_death && !digger_idle && (digger_go == 'NONE')) {
                    // Animation zuruecksetzen
                    idx[d_idx] = 8.1;
                    digger_step_left = 13;
                    digger_step_up = 9;
                    digger_step_right = 19;
                    digger_step_down = 11;
                    digger_animation_left = false;
                    digger_animation_right = false;
                    digger_animation_up = false;
                    digger_animation_down = false;
                    digger_idle = true;
                }

                //DIGGER MOVE
                if ((state == 'play') && !digger_death && !digger_idle) {
                    if (stone_l && (digger_go != 'LEFT'))
                        stone_l = false;
                    if (stone_r && (digger_go != 'RIGHT'))
                        stone_r = false;

                    // ? LINKS
                    if (digger_go == 'LEFT') {
                        var pre_l = d_idx - 1;
                        var pre_ll = d_idx - 2;
                        // ? Diamant
                        if (idx[pre_l] == 3) {
                            score_ges++;
                            score_punkte += 3;
                            ton_diamant = true;
                        }
                        // ? Ausgang
                        else if (idx[pre_l] == 41) {
                            score_punkte += 100;
                            next_raum = true;
                        }
                        // ? Geist
                        else if ((idx[pre_l] >= 43) && (idx[pre_l] < 63))
                            digger_death = true;
                        // ? Stein
                        else if (idx[pre_l] == 7) {
                            // ? Platz zum wegschieben
                            if (idx[pre_ll] == 1) {
                                // ! 2 Takte lang druecken
                                if (stone_l) {
                                    idx[pre_ll] = 7.1;
                                    idx[pre_l] = 1.1;
                                    stone_l = false;
                                    brumm = true;
                                } else {
                                    stone_l = true;
                                }
                            }
                        }
                        // ? Sand, Diamant oder Leer
                        if (idx[pre_l] < 4) {
                            idx[d_idx] = 1.1;
                            d_idx--;
                            ton_schritt = true;
                        }
                        //Animation aktivieren, Start ab Vollbild
                        if (digger_step_left == 13) {
                            digger_animation_left = true;
                            digger_animation_right = false;
                            digger_animation_up = false;
                            digger_animation_down = false;
                            //digger_step_left = 13;
                            digger_step_up = 9;
                            digger_step_right = 19;
                            digger_step_down = 11;
                        }
                    }

                    // ? HOCH
                    else if (digger_go == 'UP') {
                        var pre_h = d_idx - 20;
                        // ? Diamant
                        if (idx[pre_h] == 3) {
                            score_ges++;
                            score_punkte += 3;
                            ton_diamant = true;
                        }
                        // ? Ausgang
                        else if (idx[pre_h] == 41) {
                            score_punkte += 100;
                            next_raum = true;
                        }
                        // ? Geist
                        else if ((idx[pre_h] >= 43) && (idx[pre_h] < 63))
                            digger_death = true;
                        // ? Sand, Diamant oder Leer
                        if (idx[pre_h] < 4) {
                            idx[d_idx] = 1.1;
                            d_idx -= 20;
                            ton_schritt = true;
                        }
                        //Animation aktivieren, beginnen ab Vollbild
                        if (digger_step_up == 9) {
                            digger_animation_left = false;
                            digger_animation_right = false;
                            digger_animation_up = true;
                            digger_animation_down = false;
                            digger_step_left = 13;
                            //digger_step_up = 9;
                            digger_step_right = 19;
                            digger_step_down = 11;
                        }
                    }

                    // ? RECHTS
                    else if (digger_go == 'RIGHT') {
                        var pre_r = d_idx + 1;
                        var pre_rr = d_idx + 2;
                        // ? Diamant
                        if (idx[pre_r] == 3) {
                            score_ges++;
                            score_punkte += 3;
                            ton_diamant = true;
                        }
                        // ? Ausgang
                        else if (idx[pre_r] == 41) {
                            score_punkte += 100;
                            next_raum = true;
                        }
                        // ? Geist
                        else if ((idx[pre_r] >= 43) && (idx[pre_r] < 63))
                            digger_death = true;
                        // ? Stein
                        else if (idx[pre_r] == 7) {
                            // ? Platz zum wegschieben
                            if (idx[pre_rr] == 1) {
                                // ! 2 Takte lang druecken
                                if (stone_r) {
                                    idx[pre_rr] = 7.1;
                                    idx[pre_r] = 1.1;
                                    stone_r = false;
                                    brumm = true;
                                } else {
                                    stone_r = true;
                                }
                            }
                        }
                        // ? Sand, Diamant oder Leer
                        if (idx[pre_r] < 4) {
                            idx[d_idx] = 1.1;
                            d_idx++;
                            ton_schritt = true;
                        }
                        //Animation aktivieren, Start ab Vollbild
                        if (digger_step_right == 19) {
                            digger_animation_left = false;
                            digger_animation_right = true;
                            digger_animation_up = false;
                            digger_animation_down = false;
                            digger_step_left = 13;
                            digger_step_up = 9;
                            //digger_step_right = 19;
                            digger_step_down = 11;
                        }
                    }

                    // ? RUNTER
                    else if (digger_go == 'DOWN') {
                        var pre_d = d_idx + 20;
                        // ? Diamant
                        if (idx[pre_d] == 3) {
                            score_ges++;
                            score_punkte += 3;
                            ton_diamant = true;
                        }
                        // ? Ausgang
                        else if (idx[pre_d] == 41) {
                            score_punkte += 100;
                            next_raum = true;
                        }
                        // ? Geist
                        else if ((idx[pre_d] >= 43) && (idx[pre_d] < 63))
                            digger_death = true;
                        // ? Sand, Diamant oder Leer
                        if (idx[pre_d] < 4) {
                            idx[d_idx] = 1.1;
                            d_idx += 20;
                            ton_schritt = true;
                        }
                        //Animation aktivieren, Start ab Vollbild
                        if (digger_step_down == 11) {
                            digger_animation_left = false;
                            digger_animation_right = false;
                            digger_animation_up = false;
                            digger_animation_down = true;
                            digger_step_left = 13;
                            digger_step_up = 9;
                            digger_step_right = 19;
                            //digger_step_down = 11;
                        }
                    }
                }


                //DIGGER ANIMIEREN
                //links (bei jedem Halbbild, also hier und in Frame2/2 nochmal)
                if (digger_animation_left) {
                    idx[d_idx] = digger_step_left + 0.1;
                    digger_step_left++;
                    if (digger_step_left > 18)
                        digger_step_left = 13;
                }
                //rechts (bei jedem Halbbild, also hier und in Frame2/2 nochmal)
                else if (digger_animation_right) {
                    idx[d_idx] = digger_step_right + 0.1;
                    digger_step_right++;
                    if (digger_step_right > 24)
                        digger_step_right = 19;
                }
                //hoch (nur bei jedem Vollbild, also nur hier in Frame1/2)
                if (digger_animation_up) {
                    idx[d_idx] = digger_step_up + 0.1;
                    digger_step_up++;
                    if (digger_step_up > 10)
                        digger_step_up = 9;
                }
                //runter (nur bei jedem Vollbild, also nur hier in Frame1/2)
                else if (digger_animation_down) {
                    idx[d_idx] = digger_step_down + 0.1;
                    digger_step_down++;
                    if (digger_step_down > 12)
                        digger_step_down = 11;
                }

                //SPIELFELD AKTIVITAETEN
                if (state == 'play') {

                    //DIGGER_IDLE
                    //- Digger langweilt sich
                    //- und blinzelt dann mit den Augen
                    //- oder stampft mit dem Fuß
                    if (digger_idle) {
                        zufall++;
                        if (zufall > 280)
                            zufall = 1;
                        // ZUFALL(Stein=blinzeln)
                        if ((!digger_in_idle) && (idx[zufall] == 7)) {
                            digger_idle_augen = 24;
                            digger_in_idle = true;
                            idle_augen = true;
                        }
                        // ZUFALL(Diamant=stampfen)
                        else if ((!digger_in_idle) && (idx[zufall] == 3)) {
                            digger_idle_eier = 32;
                            digger_in_idle = true;
                            idle_augen = false;
                        }
                        if (digger_in_idle) {
                            // Animationsfortschritt, blinzeln
                            if (idle_augen) {
                                digger_idle_augen++;
                                if (digger_idle_augen == 33)
                                    digger_in_idle = false;
                            }
                            // Animationsfortschritt, stampfen
                            else {
                                digger_idle_eier++;
                                if (digger_idle_eier == 41)
                                    digger_in_idle = false;
                            }
                        }
                    } else
                        digger_in_idle = false; // DIGGER nix in IDLE
                    if (digger_in_idle && idle_augen && !digger_death)
                        idx[d_idx] = digger_idle_augen + 0.1;
                    else if (digger_in_idle && !digger_death)
                        idx[d_idx] = digger_idle_eier + 0.1;

                    //GEISTER STONE DIAMOND EXIT STAUB (280xloop)
                    //- Geister bewegen
                    //- Steine und Diamanten fallen lassen
                    //- Ausgang anzeigen, wenn genügend Diamanten gesammelte
                    //- Staub langsam auflösen
                    var pre_m1;
                    var pre_m2;
                    var pre_m19;
                    var pre_m20;
                    var pre_m40;
                    var pre_m21;
                    var pre_p1;
                    var pre_p2;
                    var pre_p19;
                    var pre_p20;
                    var pre_p39;
                    var pre_p40;
                    var pre_p41;
                    var pre_p60;
                    var pre_p21;
                    var ti = 1;
                    var pre_tim20;
                    for (var l = 1; l < 281; l++) {
                        pre_m1 = l - 1;
                        pre_m2 = l - 2;
                        pre_m19 = l - 19;
                        pre_m20 = l - 20;
                        pre_m40 = l - 40;
                        pre_m21 = l - 21;
                        pre_p1 = l + 1;
                        pre_p2 = l + 2;
                        pre_p19 = l + 19;
                        pre_p20 = l + 20;
                        pre_p40 = l + 40;
                        pre_p21 = l + 21;

                        // GEISTER 180 (43-46)
                        if ((idx[l] >= 43) && (idx[l] < 47)) {
                            // Zum sterben markierte Geister(nn.2)?
                            if ((idx[l] == 43.2) || (idx[l] == 44.2) || (idx[l] == 45.2) || (idx[l] == 46.2)) {
                                // Wenn Digger in Explosionsnaehe, dann ihn auch killen!
                                if (((idx[pre_m21] >= 8) && (idx[pre_m21] < 41)) || ((idx[pre_m20] >= 8) && (idx[pre_m20] < 41)) || ((idx[pre_m19] >= 8) && (idx[pre_m19] < 41)) || ((idx[pre_m1] >= 8) && (idx[pre_m1] < 41)) || ((idx[pre_p1] >= 8) && (idx[pre_p1] < 41)) || ((idx[pre_p19] >= 8) && (idx[pre_p19] < 41)) || ((idx[pre_p20] >= 8) && (idx[pre_p20] < 41)) || ((idx[pre_p21] >= 8) && (idx[pre_p21] < 41)))
                                    digger_death = true;
                                // Geist zu Staub
                                idx[pre_m21] = 0.1;
                                idx[pre_m20] = 0.1;
                                idx[pre_m19] = 0.1;
                                idx[pre_m1] = 0.1;
                                idx[l] = 0.1;
                                idx[pre_p1] = 0.1;
                                idx[pre_p19] = 0.1;
                                idx[pre_p20] = 0.1;
                                idx[pre_p21] = 0.1;
                                ton_stein = true;
                            }
                            //GEISTER hin und her (43-46)
                            else {
                                ti = l;
                                switch (idx[l]) {
                                    //HOCH
                                    case 45:
                                        // wenn drüber NOTHING 1
                                        if ((idx[pre_m20] == 1) || (idx[pre_m20] == 1.1)) {
                                            ti = pre_m20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 45.1; // drüber setzen
                                            if ((idx[pre_m40] >= 8) && (idx[pre_m40] < 41))
                                                digger_death = true;
                                        }
                                        // wenn drüber DIGGER 8-40
                                        else if ((idx[pre_m20] >= 8) && (idx[pre_m20] < 41))
                                            digger_death = true;
                                        // wenn drunter NOTHING 1
                                        else if ((idx[pre_p20] == 1) || (idx[pre_p20] == 1.1)) {
                                            ti = pre_p20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 43.1; // drunter setzen
                                            if ((idx[pre_p40] >= 8) && (idx[pre_p40] < 41))
                                                digger_death = true;
                                        }
                                        // wenn drunter DIGGER 8-40
                                        else if ((idx[pre_p20] >= 8) && (idx[pre_p20] < 41))
                                            digger_death = true;
                                        break;
                                        //RUNTER
                                    case 43:
                                        // wenn drunter NOTHING 1
                                        if ((idx[pre_p20] == 1) || (idx[pre_p20] == 1.1)) {
                                            ti = pre_p20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 43.1; // drunter setzen
                                            if ((idx[pre_p40] >= 8) && (idx[pre_p40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p20] >= 8) && (idx[pre_p20] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_m20] == 1) || (idx[pre_m20] == 1.1)) { // wenn drüber frei
                                            ti = pre_m20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 45.1; // drüber setzen
                                            if ((idx[pre_m40] >= 8) && (idx[pre_m40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m20] >= 8) && (idx[pre_m20] < 41))
                                            digger_death = true;
                                        break;
                                        //RECHTS
                                    case 44:
                                        if ((idx[pre_p1] == 1) || (idx[pre_p1] == 1.1)) { // wenn rechts frei
                                            ti = pre_p1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 44.1; // rechts setzen
                                            if ((idx[pre_p2] >= 8) && (idx[pre_p2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p1] >= 8) && (idx[pre_p1] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_m1] == 1) || (idx[pre_m1] == 1.1)) { // wenn links frei
                                            ti = pre_m1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 46.1; // links setzen
                                            if ((idx[pre_m2] >= 8) && (idx[pre_m2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m1] >= 8) && (idx[pre_m1] < 41))
                                            digger_death = true;
                                        break;
                                        //LINKS
                                    case 46:
                                        if ((idx[pre_m1] == 1) || (idx[pre_m1] == 1.1)) { // wenn links frei
                                            ti = pre_m1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 46.1; // links setzen
                                            if ((idx[pre_m2] >= 8) && (idx[pre_m2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m1] >= 8) && (idx[pre_m1] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_p1] == 1) || (idx[pre_p1] == 1.1)) { // wenn rechts frei
                                            ti = pre_p1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 44.1; // rechts setzen
                                            if ((idx[pre_p2] >= 8) && (idx[pre_p2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p1] >= 8) && (idx[pre_p1] < 41))
                                            digger_death = true;
                                        break;
                                }
                            }
                            pre_tim20 = ti - 20;

                            //Geist toeten, wenn unter fallenden (.2) aber nicht bewegten (.1) Stein/Diamant
                            //- bewegter Stein/Diamant: 3.2/7.2
                            //- zu toetender Geist: n + 0.2
                            if ((idx[pre_tim20] == 3.2) || (idx[pre_tim20] == 7.2))
                                idx[ti] = ((idx[ti]) << 0) + 0.2;

                        }

                        // GEISTER 90L (47-50)
                        else if ((idx[l] >= 47) && (idx[l] < 51)) {
                            // Zum sterben markierte Geister(nn.2)?
                            if ((idx[l] == 47.2) || (idx[l] == 48.2) || (idx[l] == 49.2) || (idx[l] == 50.2)) {
                                // Wenn Digger in Explosionsnaehe, dann ihn auch killen!
                                if (((idx[pre_m21] >= 8) && (idx[pre_m21] < 41)) || ((idx[pre_m20] >= 8) && (idx[pre_m20] < 41)) || ((idx[pre_m19] >= 8) && (idx[pre_m19] < 41)) || ((idx[pre_m1] >= 8) && (idx[pre_m1] < 41)) || ((idx[pre_p1] >= 8) && (idx[pre_p1] < 41)) || ((idx[pre_p19] >= 8) && (idx[pre_p19] < 41)) || ((idx[pre_p20] >= 8) && (idx[pre_p20] < 41)) || ((idx[pre_p21] >= 8) && (idx[pre_p21] < 41)))
                                    digger_death = true;
                                // Geist zu Staub
                                idx[pre_m21] = 0.1;
                                idx[pre_m20] = 0.1;
                                idx[pre_m19] = 0.1;
                                idx[pre_m1] = 0.1;
                                idx[l] = 0.1;
                                idx[pre_p1] = 0.1;
                                idx[pre_p19] = 0.1;
                                idx[pre_p20] = 0.1;
                                idx[pre_p21] = 0.1;
                                ton_stein = true;
                            }
                            //Geister bewegen: 47=down,  49=up,  48=right,  50=left 90L
                            else {
                                ti = l;
                                switch (idx[l]) {
                                    //HOCH up left right down
                                    case 49:
                                        if ((idx[pre_m20] == 1) || (idx[pre_m20] == 1.1)) { // wenn drüber frei
                                            ti = pre_m20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 49.1; // drüber setzen
                                            if ((idx[pre_m40] >= 8) && (idx[pre_m40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m20] >= 8) && (idx[pre_m20] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_m1] == 1) || (idx[pre_m1] == 1.1)) { // wenn links frei
                                            ti = pre_m1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 50.1; // links setzen
                                            if ((idx[pre_m2] >= 8) && (idx[pre_m2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m1] >= 8) && (idx[pre_m1] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_p1] == 1) || (idx[pre_p1] == 1.1)) { // wenn rechts frei
                                            ti = pre_p1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 48.1; // rechts setzen
                                            if ((idx[pre_p2] >= 8) && (idx[pre_p2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p1] >= 8) && (idx[pre_p1] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_p20] == 1) || (idx[pre_p20] == 1.1)) { // wenn drunter frei
                                            ti = pre_p20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 47.1; // drunter setzen
                                            if ((idx[pre_p40] >= 8) && (idx[pre_p40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p20] >= 8) && (idx[pre_p20] < 41))
                                            digger_death = true;
                                        break;
                                        //RUNTER down right left up
                                    case 47:
                                        if ((idx[pre_p20] == 1) || (idx[pre_p20] == 1.1)) { // wenn drunter frei
                                            ti = pre_p20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 47.1; // drunter setzen
                                            if ((idx[pre_p40] >= 8) && (idx[pre_p40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p20] >= 8) && (idx[pre_p20] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_p1] == 1) || (idx[pre_p1] == 1.1)) { // wenn rechts frei
                                            ti = pre_p1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 48.1; // rechts setzen
                                            if ((idx[pre_p2] >= 8) && (idx[pre_p2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p1] >= 8) && (idx[pre_p1] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_m1] == 1) || (idx[pre_m1] == 1.1)) { // wenn links frei
                                            ti = pre_m1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 50.1; // links setzen
                                            if ((idx[pre_m2] >= 8) && (idx[pre_m2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m1] >= 8) && (idx[pre_m1] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_m20] == 1) || (idx[pre_m20] == 1.1)) { // wenn drüber frei
                                            ti = pre_m20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 49.1; // drüber setzen
                                            if ((idx[pre_m40] >= 8) && (idx[pre_m40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m20] >= 8) && (idx[pre_m20] < 41))
                                            digger_death = true;
                                        break;
                                        //RECHTS right up down left
                                    case 48:
                                        if ((idx[pre_p1] == 1) || (idx[pre_p1] == 1.1)) { // wenn rechts frei
                                            ti = pre_p1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 48.1; // rechts setzen
                                            if ((idx[pre_p2] >= 8) && (idx[pre_p2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p1] >= 8) && (idx[pre_p1] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_m20] == 1) || (idx[pre_m20] == 1.1)) { // wenn drüber frei
                                            ti = pre_m20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 49.1; // drüber setzen
                                            if ((idx[pre_m40] >= 8) && (idx[pre_m40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m20] >= 8) && (idx[pre_m20] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_p20] == 1) || (idx[pre_p20] == 1.1)) { // wenn drunter frei
                                            ti = pre_p20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 47.1; // drunter setzen
                                            if ((idx[pre_p40] >= 8) && (idx[pre_p40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p20] >= 8) && (idx[pre_p20] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_m1] == 1) || (idx[pre_m1] == 1.1)) { // wenn links frei
                                            ti = pre_m1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 50.1; // links setzen
                                            if ((idx[pre_m2] >= 8) && (idx[pre_m2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m1] >= 8) && (idx[pre_m1] < 41))
                                            digger_death = true;
                                        break;
                                        //LINKS left down up right
                                    case 50:
                                        if ((idx[pre_m1] == 1) || (idx[pre_m1] == 1.1)) { // wenn links frei
                                            ti = pre_m1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 50.1; // links setzen
                                            if ((idx[pre_m2] >= 8) && (idx[pre_m2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m1] >= 8) && (idx[pre_m1] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_p20] == 1) || (idx[pre_p20] == 1.1)) { // wenn drunter frei
                                            ti = pre_p20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 47.1; // drunter setzen
                                            if ((idx[pre_p40] >= 8) && (idx[pre_p40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p20] >= 8) && (idx[pre_p20] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_m20] == 1) || (idx[pre_m20] == 1.1)) { // wenn drüber frei
                                            ti = pre_m20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 49.1; // drüber setzen
                                            if ((idx[pre_m40] >= 8) && (idx[pre_m40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m20] >= 8) && (idx[pre_m20] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_p1] == 1) || (idx[pre_p1] == 1.1)) { // wenn rechts frei
                                            ti = pre_p1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 48.1; // rechts setzen
                                            if ((idx[pre_p2] >= 8) && (idx[pre_p2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p1] >= 8) && (idx[pre_p1] < 41))
                                            digger_death = true;
                                        break;
                                }
                            }
                            pre_tim20 = ti - 20;

                            //Geist toeten, wenn unter fallenden (.2) aber nicht bewegten (.1) Stein/Diamant
                            //- bewegter Stein/Diamant: 3.2/7.2
                            //- zu toetender Geist: n + 0.2
                            if ((idx[pre_tim20] == 3.2) || (idx[pre_tim20] == 7.2))
                                idx[ti] = ((idx[ti]) << 0) + 0.2;

                        }

                        // GEISTER 90R (51-54)
                        else if ((idx[l] >= 51) && (idx[l] < 55)) {
                            // Zum sterben markierte Geister(nn.2)?
                            if ((idx[l] == 51.2) || (idx[l] == 52.2) || (idx[l] == 53.2) || (idx[l] == 54.2)) {
                                // Wenn Digger in Explosionsnaehe, dann ihn auch killen!
                                if (((idx[pre_m21] >= 8) && (idx[pre_m21] < 41)) || ((idx[pre_m20] >= 8) && (idx[pre_m20] < 41)) || ((idx[pre_m19] >= 8) && (idx[pre_m19] < 41)) || ((idx[pre_m1] >= 8) && (idx[pre_m1] < 41)) || ((idx[pre_p1] >= 8) && (idx[pre_p1] < 41)) || ((idx[pre_p19] >= 8) && (idx[pre_p19] < 41)) || ((idx[pre_p20] >= 8) && (idx[pre_p20] < 41)) || ((idx[pre_p21] >= 8) && (idx[pre_p21] < 41)))
                                    digger_death = true;
                                // Geist zu Staub
                                idx[pre_m21] = 0.1;
                                idx[pre_m20] = 0.1;
                                idx[pre_m19] = 0.1;
                                idx[pre_m1] = 0.1;
                                idx[l] = 0.1;
                                idx[pre_p1] = 0.1;
                                idx[pre_p19] = 0.1;
                                idx[pre_p20] = 0.1;
                                idx[pre_p21] = 0.1;
                                ton_stein = true;
                            }
                            //Geister bewegen: 51=down,  53=up,  52=right,  54=left 90R
                            else {
                                ti = l;
                                switch (idx[l]) {
                                    //HOCH up right left down
                                    case 53:
                                        if ((idx[pre_m20] == 1) || (idx[pre_m20] == 1.1)) { // wenn drüber frei
                                            ti = pre_m20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 53.1; // drüber setzen
                                            if ((idx[pre_m40] >= 8) && (idx[pre_m40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m20] >= 8) && (idx[pre_m20] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_p1] == 1) || (idx[pre_p1] == 1.1)) { // wenn rechts frei
                                            ti = pre_p1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 52.1; // rechts setzen
                                            if ((idx[pre_p2] >= 8) && (idx[pre_p2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p1] >= 8) && (idx[pre_p1] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_m1] == 1) || (idx[pre_m1] == 1.1)) { // wenn links frei
                                            ti = pre_m1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 54.1; // links setzen
                                            if ((idx[pre_m2] >= 8) && (idx[pre_m2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m1] >= 8) && (idx[pre_m1] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_p20] == 1) || (idx[pre_p20] == 1.1)) { // wenn drunter frei
                                            ti = pre_p20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 51.1; // drunter setzen
                                            if ((idx[pre_p40] >= 8) && (idx[pre_p40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p20] >= 8) && (idx[pre_p20] < 41))
                                            digger_death = true;
                                        break;
                                        //RUNTER down left right up
                                    case 51:
                                        if ((idx[pre_p20] == 1) || (idx[pre_p20] == 1.1)) { // wenn drunter frei
                                            ti = pre_p20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 51.1; // drunter setzen
                                            if ((idx[pre_p40] >= 8) && (idx[pre_p40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p20] >= 8) && (idx[pre_p20] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_m1] == 1) || (idx[pre_m1] == 1.1)) { // wenn links frei
                                            ti = pre_m1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 54.1; // links setzen
                                            if ((idx[pre_m2] >= 8) && (idx[pre_m2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m1] >= 8) && (idx[pre_m1] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_p1] == 1) || (idx[pre_p1] == 1.1)) { // wenn rechts frei
                                            ti = pre_p1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 52.1; // rechts setzen
                                            if ((idx[pre_p2] >= 8) && (idx[pre_p2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p1] >= 8) && (idx[pre_p1] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_m20] == 1) || (idx[pre_m20] == 1.1)) { // wenn drüber frei
                                            ti = pre_m20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 53.1; // drüber setzen
                                            if ((idx[pre_m40] >= 8) && (idx[pre_m40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m20] >= 8) && (idx[pre_m20] < 41))
                                            digger_death = true;
                                        break;
                                        //RECHTS right down up left
                                    case 52:
                                        if ((idx[pre_p1] == 1) || (idx[pre_p1] == 1.1)) { // wenn rechts frei
                                            ti = pre_p1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 52.1; // rechts setzen
                                            if ((idx[pre_p2] >= 8) && (idx[pre_p2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p1] >= 8) && (idx[pre_p1] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_p20] == 1) || (idx[pre_p20] == 1.1)) { // wenn drunter frei
                                            ti = pre_p20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 51.1; // drunter setzen
                                            if ((idx[pre_p40] >= 8) && (idx[pre_p40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p20] >= 8) && (idx[pre_p20] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_m20] == 1) || (idx[pre_m20] == 1.1)) { // wenn drüber frei
                                            ti = pre_m20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 53.1; // drüber setzen
                                            if ((idx[pre_m40] >= 8) && (idx[pre_m40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m20] >= 8) && (idx[pre_m20] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_m1] == 1) || (idx[pre_m1] == 1.1)) { // wenn links frei
                                            ti = pre_m1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 54.1; // links setzen
                                            if ((idx[pre_m2] >= 8) && (idx[pre_m2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m1] >= 8) && (idx[pre_m1] < 41))
                                            digger_death = true;
                                        break;
                                        //LINKS left up down right
                                    case 54:
                                        if ((idx[pre_m1] == 1) || (idx[pre_m1] == 1.1)) { // wenn links frei
                                            ti = pre_m1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 54.1; // links setzen
                                            if ((idx[pre_m2] >= 8) && (idx[pre_m2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m1] >= 8) && (idx[pre_m1] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_m20] == 1) || (idx[pre_m20] == 1.1)) { // wenn drüber frei
                                            ti = pre_m20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 53.1; // drüber setzen
                                            if ((idx[pre_m40] >= 8) && (idx[pre_m40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m20] >= 8) && (idx[pre_m20] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_p20] == 1) || (idx[pre_p20] == 1.1)) { // wenn drunter frei
                                            ti = pre_p20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 51.1; // drunter setzen
                                            if ((idx[pre_p40] >= 8) && (idx[pre_p40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p20] >= 8) && (idx[pre_p20] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_p1] == 1) || (idx[pre_p1] == 1.1)) { // wenn rechts frei
                                            ti = pre_p1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 52.1; // rechts setzen
                                            if ((idx[pre_p2] >= 8) && (idx[pre_p2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p1] >= 8) && (idx[pre_p1] < 41))
                                            digger_death = true;
                                        break;
                                }
                            }
                            pre_tim20 = ti - 20;

                            //Geist toeten, wenn unter fallenden (.2) aber nicht bewegten (.1) Stein/Diamant
                            //- bewegter Stein/Diamant: 3.2/7.2
                            //- zu toetender Geist: n + 0.2
                            if ((idx[pre_tim20] == 3.2) || (idx[pre_tim20] == 7.2))
                                idx[ti] = ((idx[ti]) << 0) + 0.2;

                        }

                        // GEISTER 90LR (55-58)
                        else if ((idx[l] >= 55) && (idx[l] < 59)) {
                            // Zum sterben markierte Geister(nn.2)?
                            if ((idx[l] == 55.2) || (idx[l] == 56.2) || (idx[l] == 57.2) || (idx[l] == 58.2)) {
                                // Wenn Digger in Explosionsnaehe, dann ihn auch killen!
                                if (((idx[pre_m21] >= 8) && (idx[pre_m21] < 41)) || ((idx[pre_m20] >= 8) && (idx[pre_m20] < 41)) || ((idx[pre_m19] >= 8) && (idx[pre_m19] < 41)) || ((idx[pre_m1] >= 8) && (idx[pre_m1] < 41)) || ((idx[pre_p1] >= 8) && (idx[pre_p1] < 41)) || ((idx[pre_p19] >= 8) && (idx[pre_p19] < 41)) || ((idx[pre_p20] >= 8) && (idx[pre_p20] < 41)) || ((idx[pre_p21] >= 8) && (idx[pre_p21] < 41)))
                                    digger_death = true;
                                // Geist zu Staub
                                idx[pre_m21] = 0.1;
                                idx[pre_m20] = 0.1;
                                idx[pre_m19] = 0.1;
                                idx[pre_m1] = 0.1;
                                idx[l] = 0.1;
                                idx[pre_p1] = 0.1;
                                idx[pre_p19] = 0.1;
                                idx[pre_p20] = 0.1;
                                idx[pre_p21] = 0.1;
                                ton_stein = true;
                            }
                            //Geister bewegen: 55=down,  57=up,  56=right,  58=left 90LR
                            else {
                                ti = l;
                                switch (idx[l]) {
                                    //HOCH up left right down
                                    case 57:
                                        if ((idx[pre_m20] == 1) || (idx[pre_m20] == 1.1)) { // wenn drüber frei
                                            ti = pre_m20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 57.1; // drüber setzen
                                            if ((idx[pre_m40] >= 8) && (idx[pre_m40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m20] >= 8) && (idx[pre_m20] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_m1] == 1) || (idx[pre_m1] == 1.1)) { // wenn links frei
                                            ti = pre_m1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 62.1; // links setzen -> 90RL
                                            if ((idx[pre_m2] >= 8) && (idx[pre_m2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m1] >= 8) && (idx[pre_m1] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_p1] == 1) || (idx[pre_p1] == 1.1)) { // wenn rechts frei
                                            ti = pre_p1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 60.1; // rechts setzen -> 90RL
                                            if ((idx[pre_p2] >= 8) && (idx[pre_p2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p1] >= 8) && (idx[pre_p1] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_p20] == 1) || (idx[pre_p20] == 1.1)) { // wenn drunter frei
                                            ti = pre_p20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 55.1; // drunter setzen
                                            if ((idx[pre_p40] >= 8) && (idx[pre_p40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p20] >= 8) && (idx[pre_p20] < 41))
                                            digger_death = true;
                                        break;
                                        //RUNTER down right left up
                                    case 55:
                                        if ((idx[pre_p20] == 1) || (idx[pre_p20] == 1.1)) { // wenn drunter frei
                                            ti = pre_p20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 55.1; // drunter setzen
                                            if ((idx[pre_p40] >= 8) && (idx[pre_p40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p20] >= 8) && (idx[pre_p20] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_p1] == 1) || (idx[pre_p1] == 1.1)) { // wenn rechts frei
                                            ti = pre_p1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 60.1; // rechts setzen -> 90RL
                                            if ((idx[pre_p2] >= 8) && (idx[pre_p2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p1] >= 8) && (idx[pre_p1] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_m1] == 1) || (idx[pre_m1] == 1.1)) { // wenn links frei
                                            ti = pre_m1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 62.1; // links setzen -> 90RL
                                            if ((idx[pre_m2] >= 8) && (idx[pre_m2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m1] >= 8) && (idx[pre_m1] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_m20] == 1) || (idx[pre_m20] == 1.1)) { // wenn drüber frei
                                            ti = pre_m20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 57.1; // drüber setzen
                                            if ((idx[pre_m40] >= 8) && (idx[pre_m40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m20] >= 8) && (idx[pre_m20] < 41))
                                            digger_death = true;
                                        break;
                                        //RECHTS right up down left
                                    case 56:
                                        if ((idx[pre_p1] == 1) || (idx[pre_p1] == 1.1)) { // wenn rechts frei
                                            ti = pre_p1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 56.1; // rechts setzen
                                            if ((idx[pre_p2] >= 8) && (idx[pre_p2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p1] >= 8) && (idx[pre_p1] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_m20] == 1) || (idx[pre_m20] == 1.1)) { // wenn drüber frei
                                            ti = pre_m20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 61.1; // drüber setzen -> 90RL
                                            if ((idx[pre_m40] >= 8) && (idx[pre_m40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m20] >= 8) && (idx[pre_m20] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_p20] == 1) || (idx[pre_p20] == 1.1)) { // wenn drunter frei
                                            ti = pre_p20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 59.1; // drunter setzen -> 90RL
                                            if ((idx[pre_p40] >= 8) && (idx[pre_p40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p20] >= 8) && (idx[pre_p20] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_m1] == 1) || (idx[pre_m1] == 1.1)) { // wenn links frei
                                            ti = pre_m1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 58.1; // links setzen
                                            if ((idx[pre_m2] >= 8) && (idx[pre_m2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m1] >= 8) && (idx[pre_m1] < 41))
                                            digger_death = true;
                                        break;
                                        //LINKS left down up right
                                    case 58:
                                        if ((idx[pre_m1] == 1) || (idx[pre_m1] == 1.1)) { // wenn links frei
                                            ti = pre_m1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 58.1; // links setzen
                                            if ((idx[pre_m2] >= 8) && (idx[pre_m2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m1] >= 8) && (idx[pre_m1] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_p20] == 1) || (idx[pre_p20] == 1.1)) { // wenn drunter frei
                                            ti = pre_p20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 59.1; // drunter setzen 90RL
                                            if ((idx[pre_p40] >= 8) && (idx[pre_p40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p20] >= 8) && (idx[pre_p20] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_m20] == 1) || (idx[pre_m20] == 1.1)) { // wenn drüber frei
                                            ti = pre_m20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 61.1; // drüber setzen -> 90RL
                                            if ((idx[pre_m40] >= 8) && (idx[pre_m40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m20] >= 8) && (idx[pre_m20] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_p1] == 1) || (idx[pre_p1] == 1.1)) { // wenn rechts frei
                                            ti = pre_p1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 56.1; // rechts setzen
                                            if ((idx[pre_p2] >= 8) && (idx[pre_p2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p1] >= 8) && (idx[pre_p1] < 41))
                                            digger_death = true;
                                        break;
                                }
                            }
                            pre_tim20 = ti - 20;

                            //Geist toeten, wenn unter fallenden (.2) aber nicht bewegten (.1) Stein/Diamant
                            //- bewegter Stein/Diamant: 3.2/7.2
                            //- zu toetender Geist: n + 0.2
                            if ((idx[pre_tim20] == 3.2) || (idx[pre_tim20] == 7.2))
                                idx[ti] = ((idx[ti]) << 0) + 0.2;

                        }

                        // GEISTER 90RL (59-62)
                        else if ((idx[l] >= 59) && (idx[l] < 63)) {
                            // Zum sterben markierte Geister(nn.2)?
                            if ((idx[l] == 59.2) || (idx[l] == 60.2) || (idx[l] == 61.2) || (idx[l] == 62.2)) {
                                // Wenn Digger in Explosionsnaehe, dann ihn auch killen!
                                if (((idx[pre_m21] >= 8) && (idx[pre_m21] < 41)) || ((idx[pre_m20] >= 8) && (idx[pre_m20] < 41)) || ((idx[pre_m19] >= 8) && (idx[pre_m19] < 41)) || ((idx[pre_m1] >= 8) && (idx[pre_m1] < 41)) || ((idx[pre_p1] >= 8) && (idx[pre_p1] < 41)) || ((idx[pre_p19] >= 8) && (idx[pre_p19] < 41)) || ((idx[pre_p20] >= 8) && (idx[pre_p20] < 41)) || ((idx[pre_p21] >= 8) && (idx[pre_p21] < 41)))
                                    digger_death = true;
                                // Geist zu Staub
                                idx[pre_m21] = 0.1;
                                idx[pre_m20] = 0.1;
                                idx[pre_m19] = 0.1;
                                idx[pre_m1] = 0.1;
                                idx[l] = 0.1;
                                idx[pre_p1] = 0.1;
                                idx[pre_p19] = 0.1;
                                idx[pre_p20] = 0.1;
                                idx[pre_p21] = 0.1;
                                ton_stein = true;
                            }
                            //Geister bewegen: 59=down,  61=up,  60=right,  62=left 90RL
                            else {
                                ti = l;
                                switch (idx[l]) {
                                    //HOCH up right left down
                                    case 61:
                                        if ((idx[pre_m20] == 1) || (idx[pre_m20] == 1.1)) { // wenn drüber frei
                                            ti = pre_m20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 61.1; // drüber setzen
                                            if ((idx[pre_m40] >= 8) && (idx[pre_m40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m20] >= 8) && (idx[pre_m20] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_p1] == 1) || (idx[pre_p1] == 1.1)) { // wenn rechts frei
                                            ti = pre_p1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 56.1; // rechts setzen -> 90LR
                                            if ((idx[pre_p2] >= 8) && (idx[pre_p2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p1] >= 8) && (idx[pre_p1] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_m1] == 1) || (idx[pre_m1] == 1.1)) { // wenn links frei
                                            ti = pre_m1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 58.1; // links setzen -> 90LR
                                            if ((idx[pre_m2] >= 8) && (idx[pre_m2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m1] >= 8) && (idx[pre_m1] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_p20] == 1) || (idx[pre_p20] == 1.1)) { // wenn drunter frei
                                            ti = pre_p20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 59.1; // drunter setzen
                                            if ((idx[pre_p40] >= 8) && (idx[pre_p40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p20] >= 8) && (idx[pre_p20] < 41))
                                            digger_death = true;
                                        break;
                                        //RUNTER down left right up
                                    case 59:
                                        if ((idx[pre_p20] == 1) || (idx[pre_p20] == 1.1)) { // wenn drunter frei
                                            ti = pre_p20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 59.1; // drunter setzen
                                            if ((idx[pre_p40] >= 8) && (idx[pre_p40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p20] >= 8) && (idx[pre_p20] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_m1] == 1) || (idx[pre_m1] == 1.1)) { // wenn links frei
                                            ti = pre_m1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 58.1; // links setzen 90LR
                                            if ((idx[pre_m2] >= 8) && (idx[pre_m2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m1] >= 8) && (idx[pre_m1] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_p1] == 1) || (idx[pre_p1] == 1.1)) { // wenn rechts frei
                                            ti = pre_p1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 56.1; // rechts setzen -> 90LR
                                            if ((idx[pre_p2] >= 8) && (idx[pre_p2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p1] >= 8) && (idx[pre_p1] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_m20] == 1) || (idx[pre_m20] == 1.1)) { // wenn drüber frei
                                            ti = pre_m20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 61.1; // drüber setzen
                                            if ((idx[pre_m40] >= 8) && (idx[pre_m40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m20] >= 8) && (idx[pre_m20] < 41))
                                            digger_death = true;
                                        break;
                                        //RECHTS right down up left
                                    case 60:
                                        if ((idx[pre_p1] == 1) || (idx[pre_p1] == 1.1)) { // wenn rechts frei
                                            ti = pre_p1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 60.1; // rechts setzen
                                            if ((idx[pre_p2] >= 8) && (idx[pre_p2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p1] >= 8) && (idx[pre_p1] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_p20] == 1) || (idx[pre_p20] == 1.1)) { // wenn drunter frei
                                            ti = pre_p20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 55.1; // drunter setzen 90LR
                                            if ((idx[pre_p40] >= 8) && (idx[pre_p40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p20] >= 8) && (idx[pre_p20] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_m20] == 1) || (idx[pre_m20] == 1.1)) { // wenn drüber frei
                                            ti = pre_m20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 57.1; // drüber setzen 90LR
                                            if ((idx[pre_m40] >= 8) && (idx[pre_m40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m20] >= 8) && (idx[pre_m20] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_m1] == 1) || (idx[pre_m1] == 1.1)) { // wenn links frei
                                            ti = pre_m1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 62.1; // links setzen
                                            if ((idx[pre_m2] >= 8) && (idx[pre_m2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m1] >= 8) && (idx[pre_m1] < 41))
                                            digger_death = true;
                                        break;
                                        //LINKS left up down right
                                    case 62:
                                        if ((idx[pre_m1] == 1) || (idx[pre_m1] == 1.1)) { // wenn links frei
                                            ti = pre_m1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 62.1; // links setzen
                                            if ((idx[pre_m2] >= 8) && (idx[pre_m2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m1] >= 8) && (idx[pre_m1] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_m20] == 1) || (idx[pre_m20] == 1.1)) { // wenn drüber frei
                                            ti = pre_m20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 57.1; // drüber setzen 90LR
                                            if ((idx[pre_m40] >= 8) && (idx[pre_m40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_m20] >= 8) && (idx[pre_m20] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_p20] == 1) || (idx[pre_p20] == 1.1)) { // wenn drunter frei
                                            ti = pre_p20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 55.1; // drunter setzen 90LR
                                            if ((idx[pre_p40] >= 8) && (idx[pre_p40] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p20] >= 8) && (idx[pre_p20] < 41))
                                            digger_death = true;
                                        else if ((idx[pre_p1] == 1) || (idx[pre_p1] == 1.1)) { // wenn rechts frei
                                            ti = pre_p1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 60.1; // rechts setzen
                                            if ((idx[pre_p2] >= 8) && (idx[pre_p2] < 41))
                                                digger_death = true;
                                        } else if ((idx[pre_p1] >= 8) && (idx[pre_p1] < 41))
                                            digger_death = true;
                                        break;
                                }
                            }
                            pre_tim20 = ti - 20;

                            //Geist toeten, wenn unter fallenden (.2) aber nicht bewegten (.1) Stein/Diamant
                            //- bewegter Stein/Diamant: 3.2/7.2
                            //- zu toetender Geist: n + 0.2
                            if ((idx[pre_tim20] == 3.2) || (idx[pre_tim20] == 7.2))
                                idx[ti] = ((idx[ti]) << 0) + 0.2;

                        }

                        // Steine und Diamanten
                        else if ((idx[l] == 7) || (idx[l] == 3)) {
                            pre_p39 = l + 39;
                            pre_p40 = l + 40;
                            pre_p41 = l + 41;
                            pre_p60 = l + 60;
                            //Stein in Diamant umwandeln
                            if ((idx[l] == 7) && (idx[pre_p20] == 5) && (idx[pre_p40] == 1)) {
                                idx[pre_p40] = 3.2;
                                idx[l] = 1.1;
                                // trifft er auf einen Gegenstand?
                                if (idx[pre_p60] > 1) {
                                    // Ja: Sound abspielen!
                                    ton_stein = true;
                                    // Digger: KILLEN!
                                    if ((idx[pre_p60] >= 8) && (idx[pre_p60] < 41))
                                        digger_death = true;
                                    // Geist: KILLEN!
                                    else if ((idx[pre_p60] >= 43) && (idx[pre_p60] < 63))
                                        idx[pre_p60] = ((idx[pre_p60]) << 0) + 0.2;
                                }
                            }

                            //Stein oder Diamant fallen
                            else if ((idx[l] == 7) || (idx[l] == 3)) {
                                // ? Drunter: frei
                                if (idx[pre_p20] == 1) {
                                    idx[pre_p20] = idx[l] + 0.2;
                                    idx[l] = 1.1;
                                    // trifft er auf einen Gegenstand
                                    if (idx[pre_p40] >= 2) {
                                        //Ja: Sound abspielen
                                        ton_stein = true;
                                        // Digger KILLEN
                                        if ((idx[pre_p40] >= 8) && (idx[pre_p40] < 41))
                                            digger_death = true;
                                        // Geist KILLEN
                                        else if ((idx[pre_p40] >= 43) && (idx[pre_p40] < 63))
                                            idx[pre_p40] = ((idx[pre_p40]) << 0) + 0.2;
                                    }
                                }
                                // ? Drunter: Stein(7), Diamant(3) oder toter Digger(60)
                                else if ((idx[pre_p20] == 7) || (idx[pre_p20] == 3) || (idx[pre_p20] == 60)) {
                                    //links plumpsen!
                                    if (((idx[pre_m1] == 1) || (idx[pre_m1] == 7.2) || (idx[pre_m1] == 3.2)) && (idx[pre_p19] == 1)) {
                                        idx[pre_p19] = idx[l] + 0.2;
                                        idx[l] = 1 + (idx[l] / 10);
                                        // trifft er auf einen Gegenstand
                                        if (idx[pre_p39] >= 2) {
                                            //Ja: Sound abspielen
                                            ton_stein = true;
                                            // Digger KILLEN
                                            if ((idx[pre_p39] >= 8) && (idx[pre_p39] < 41))
                                                digger_death = true;
                                            // Geist KILLEN
                                            else if ((idx[pre_p39] >= 43) && (idx[pre_p39] < 63))
                                                idx[pre_p39] = ((idx[pre_p39]) << 0) + 0.2;
                                        }
                                    }
                                    //rechts plumpsen!
                                    else if (((idx[pre_p1] == 1) || (idx[pre_p1] == 7.2) || (idx[pre_p1] == 3.2)) && (idx[pre_p21] == 1)) {
                                        idx[pre_p21] = idx[l] + 0.2;
                                        idx[l] = 1 + (idx[l] / 10);
                                        // trifft er auf einen Gegenstand
                                        if (idx[pre_p41] >= 2) {
                                            //Ja: Sound abspielen
                                            ton_stein = true;
                                            // Digger KILLEN
                                            if ((idx[pre_p41] >= 8) && (idx[pre_p41] < 41))
                                                digger_death = true;
                                            // Geist KILLEN
                                            else if ((idx[pre_p41] >= 43) && (idx[pre_p41] < 63))
                                                idx[pre_p41] = ((idx[pre_p41]) << 0) + 0.2;
                                        }
                                    }
                                }
                            }
                        }

                        // mache den unsichtbaren/unbenutzbaren Ausgang (6) sichtbar (41), bei genuegent Diamanten
                        else if ((idx[l] == 6) && (score_ges >= score_dia)) {
                            idx[l] = 41.1;
                            exit_blink = 41; //Animationsanfang setzen
                        }

                        // Staub(0.1) nach 3 Loops in Leere(1.1) aufloesen
                        else if ((idx[l] >= 0.1) && (idx[l] <= 0.4)) {
                            idx[l] += 0.1;
                            if (idx[l] == 0.4)
                                idx[l] = 1.1;
                        }
                    }
                }

                //LEVEL WECHSELN
                if (next_raum) {
                    if (score_raum == room.length) {
                        score_raum--;
                        state = 'highscore';
                        drawHighscore();
                        score_raum = 1;
                        score_leben = LEBENMAX;
                        score_punkte = 0;
                    } else {
                        score_raum++;
                        state = 'init';
                        init_room(score_raum);
                    }
                    next_raum = false;
                    game_save();
                }

                //Statuszeile und
                //Softscroller aktualisieren
                update_header();
                soft_scroll();

                //Ton abspielen
                if (ton_diamant) {
                    playAudio('Diamond');
                } else if (ton_stein) {
                    playAudio('Stone');
                    brumm = true;
                } else if (ton_schritt) {
                    playAudio('Step');
                }
                ton_diamant = false;
                ton_schritt = false;
                ton_stein = false;

                //Vibration abspielen
                if (brumm) {
                    if (navigator.vibrate)
                        navigator.vibrate(48);
                    brumm = false;
                }

                //DIGGER TOETEN
                if (digger_death && !digger_is_dead) {
                    draw_digger_death();
                    digger_go = 'NONE';
                    score_leben--;
                    //spielstand sichern
                    game_save();
                }

                //Frame 1/2 --> Frame 2/2
                digger_half_step = true;
                digger_start_up = false;
                digger_start_down = false;
                digger_start_left = false;
                digger_start_right = false;

            //FRAME 2/2
            } else {

                //DIGGER ANIMIEREN
                //links (bei jedem Halbbild, also hier und in Frame1/2 auch)
                if (digger_animation_left) {
                    idx[d_idx] = digger_step_left + 0.1;
                    digger_step_left++;
                    if (digger_step_left > 18)
                        digger_step_left = 13;
                }
                //rechts (bei jedem Halbbild, also hier und in Frame1/2 auch)
                else if (digger_animation_right) {
                    idx[d_idx] = digger_step_right + 0.1;
                    digger_step_right++;
                    if (digger_step_right > 24)
                        digger_step_right = 19;
                }

                //Frame 2/2 --> 1/2
                digger_half_step = false;

            }

            //FRAME 1&2
            //Countdown
            if ((state == 'play') && !digger_death) {
                score_zeit--;
                if (score_zeit <= 0)
                    digger_death = true;
            }

        }

        //SPIELFELD REFRESHEN
        requestAnimationFrame(draw_field);

        //Diamant Farbscrollsequenz (64 bis (max_diamond_blink-1))
        diamond_blink++;
        if (diamond_blink > (64 + max_diamond_blink - 1))
            diamond_blink = 64;

        //Exit Blinksequenz (41 exit <--> 42 wall)
        exit_blink += 0.05;
        if (exit_blink > 43)
            exit_blink = 41;

    }

    //halbiert die Spielfrequenz
    if (takt_teiler == 1)
        takt_teiler = 2;
    else if (takt_teiler == 2)
        takt_teiler = 1;

    setTimeout(draw_frame, FPS);

}

// Los
initAudio();
reset_scale();
draw_frame(); //Gameloop
init_events();
