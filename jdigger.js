// jdigger/Digger.JS
// Copyright (C) 2019–2025  Marko Klingner
// GNU GPL v3 - https://www.gnu.org/licenses/gpl-3.0.html


//wenn möglich, schönen Pixelsalat zeichnen
function scalePixelated(ctx) {
    ctx.imageSmoothingEnabled = false; /* standard */
    //ctx.mozImageSmoothingEnabled = false; /* Firefox */
    ctx.oImageSmoothingEnabled = false; /* Opera */
    ctx.webkitImageSmoothingEnabled = false; /* Safari */
    ctx.msImageSmoothingEnabled = false; /* IE */
}


function scaleInit() {
    //Screen Groesse ermitteln (body_width, body_height)
    if (window.innerWidth) {
        body_width = window.innerWidth;
        body_height = window.innerHeight;
    } else {
        body_width = document.body.offsetHeight;
        body_height = document.body.offsetHeight;
    }
    console.log('screensize: ' + body_width + 'x' + body_height);

    //Sprite Groesse ermitteln (scale)
    var scale_width = (body_width / 20) << 0;
    var scale_height = (body_height / 15) << 0;
    if (scale_width > scale_height)
        scale = scale_width;
    else
        scale = scale_height;

    //div container fuer canvas #digger, Groesse bestimmen
    diggerdiv_width = body_width;
    diggerdiv_height = body_height - scale;

    //Viewport bestimmen, fuer soft_scroll() und draw_field()
    pre_icon_size = scale;
    pre_max_w_offset = -(pre_icon_size * 20 - diggerdiv_width);
    pre_max_h_offset = -(pre_icon_size * 14 - diggerdiv_height);

    //canvas field (#digger), Groesse bestimmen
    field_width = pre_icon_size * 20;
    field_height = pre_icon_size * 14;
}


function scaleBuffer() {
    // ? sprites_image und chars_image vorgeladen
    if (sprites_image.complete && chars_image.complete) {

        //Sprites Puffer-Canvas, 1x40 Sprites
        buffer_sprites_canvas.width = pre_icon_size;
        buffer_sprites_canvas.height = pre_icon_size * 40;
        //Pixelgrafik, no dithering
        scalePixelated(buffer_sprites_context);
        //Sprites skaliert in "buffer_sprites_canvas" schreiben/puffern
        buffer_sprites_context.drawImage(sprites_image, 0, 0, buffer_sprites_canvas.width, buffer_sprites_canvas.height);
        console.log('buffersize sprites: ' + buffer_sprites_canvas.width + 'x' + buffer_sprites_canvas.height);

        //Zeichen Puffer-Canvas
        buffer_chars_canvas.width = (body_width / 40) << 0;
        buffer_chars_canvas.height = pre_icon_size * 192;
        //Pixelgrafik, no dithering
        scalePixelated(buffer_chars_context);
        //Charset skaliert in "buffer_chars_canvas" schreiben/puffern
        buffer_chars_context.fillStyle = KCB_ROT;
        buffer_chars_context.fillRect(0, 0, buffer_chars_canvas.width, buffer_chars_canvas.height);
        buffer_chars_context.drawImage(chars_image, 0, 0, buffer_chars_canvas.width, buffer_chars_canvas.height);
        console.log('buffersize chars: ' + buffer_chars_canvas.width + 'x' + buffer_chars_canvas.height);

    } else
        setTimeout(scaleBuffer, 1000);
}


function scaleReload() {
    //Fullscreen wieder ermöglichen
    fullscreen_flag = false;

    // Scalierfaktor aktualisieren
    scaleInit();

    // Puffer refreshen (Sprites and Chars)
    scaleBuffer();

    // Menu refreshen
    document.getElementById('menudiv').style.width = (body_width) + 'px';
    document.getElementById('menudiv').style.height = (body_height) + 'px';
    document.getElementById('menuimg').width = body_width;
    document.getElementById('menuimg').height = body_height;
    scalePixelated(context_menuimg); //Pixelgrafik, no dithering
    if (state == 'menu')
        menu_draw();
    else if (state == 'highscore')
        highscore_draw();
    rd_in = false;
    rd_yn = false;

    // Scoreline refreshen
    document.getElementById('scorelinediv').style.width = (body_width) + 'px';
    document.getElementById('scorelinediv').style.height = (scale) + 'px';
    document.getElementById('scoreline').width = body_width;
    document.getElementById('scoreline').height = scale;
    scorelinePrewrite();

    // Spielfeld refreshen (idx[1-280]), alle Sprites neu zeichnen lassen (drawflag setzen)
    document.getElementById('diggerdiv').style.width = (body_width) + 'px';
    document.getElementById('diggerdiv').style.height = (body_height - scale) + 'px';
    document.getElementById('diggerdiv').style.top = (scale) + 'px';
    document.getElementById('digger').width = field_width;
    document.getElementById('digger').height = field_height;
    var i;
    for (var l = 1; l < 281; l++) {
        // icon auslesen und nachkommastelle abschneiden
        i = (idx[l] << 0);
        // nachkommastelle (drawflag, +0.1) erzeugen, wenn nicht bereits vorhanden (idx[l] == i)
        if (idx[l] == i)
            idx[l] += 0.1;
    }
}


function highscore_draw() {
    //Puffer mit Farbe löschen (copy)
    buffer_menu_context.globalCompositeOperation = "copy";
    buffer_menu_context.fillStyle = KCB_TUERKIS;
    buffer_menu_context.fillRect(0, 0, 320, 240);

    if (chars_image.complete) {
        //schneide KCF_WEISS aus KCB_TUERKIS aus
        //KCB_TUERKIS ist die Hintergrundfarbe und KCF_WEISS ist 100% transparent (destination-out)
        //im Zielcanvas ist KCF_WEISS dann die vorher gefüllte Farbe
        buffer_menu_context.globalCompositeOperation = "destination-out";

        //die Überschrift ...
        menuLine("HIGHSCORE :", 8, 4);
        menuLine("\217\217\217\217\217\217\217\217\217\217\217", 8, 5);

        //Higscore laden und eventl. aktualisieren
        storageHighscoreUpdate();

        //die Liste ... 20 Zeilen
        for (var i = 0; i < 20; i++) {
            //sprintf(entry, "%.6d  %s", highscore[i].score, highscore[i].name);
            //var entry = "123456  1234567890";
            menuLine(highscore[i], 10, 7 + i);
        }

        //kopiere die Grafik aus dem Puffer skaliert (body_width x body_height) in das sichtbare Menu-Canvas (canvas_menuimg)
        //Menu mit Farbe löschen (copy)
        context_menuimg.globalCompositeOperation = "copy";
        context_menuimg.fillStyle = KCF_GELB;
        context_menuimg.fillRect(0, 0, body_width, body_height);
        //Menu mit Puffer beschreiben (Weiß ist ausgeschnitten und transparent, KCF_GELB)
        context_menuimg.globalCompositeOperation = "source-over";
        context_menuimg.drawImage(buffer_menu_canvas, 0, 0, 320, 240, 0, 0, body_width, body_height);
        document.getElementById('menudiv').style.visibility = "visible";

        //eventl. neuen Alias abfragen
        if (state == 'input')
            setTimeout(highscoreInput, 50);
    } else
        setTimeout(menu_draw, 1000);
}


function highscoreInput() {
    if (!rd_in) { //braucht nur 1x gemalt werden
        //Loop Tastaturabfrage
        buffer_menu_context.globalCompositeOperation = "destination-out";
        menuLine("...well done, please enter your name :", 1, 2);

        //Zeile löschen
        //Cursor(\177) und Zeichen
        buffer_menu_context.globalCompositeOperation = "source-over";
        buffer_menu_context.fillStyle = KCB_TUERKIS;
        buffer_menu_context.fillRect(17 * 8, (7 + input_line) * 8, 15 * 8, 8);
        buffer_menu_context.globalCompositeOperation = "destination-out";
        menuLine(input_alias + "\177", 17, 7 + input_line);

        //kopiere die Grafik aus dem Puffer skaliert (body_width x body_height) in das sichtbare Menu-Canvas (canvas_menuimg)
        //Menu mit Farbe löschen (copy)
        context_menuimg.globalCompositeOperation = "copy";
        context_menuimg.fillStyle = KCF_GELB;
        context_menuimg.fillRect(0, 0, body_width, body_height);
        //Menu mit Puffer beschreiben (Weiß ist ausgeschnitten und transparent, KCF_GELB)
        context_menuimg.globalCompositeOperation = "source-over";
        context_menuimg.drawImage(buffer_menu_canvas, 0, 0, 320, 240, 0, 0, body_width, body_height);

        rd_in = true;
    }

    if (input != undefined) {
        if (input == 'Enter') { //Enter -> 'weiter zu YesNo'
            rd_in = false;
            input = undefined;
            handled = true;
            highscore[input_line] = highscore[input_line] + "  " + input_alias; //"99999  alias678901234"
            storageHighscoreSave();
            setTimeout(highscoreYesNo, 100);
            return;
        } else if (input == 'Backspace') {
            if (input_alias.length > 0) {
                input_alias = input_alias.substr(0, input_alias.length - 1);
                rd_in = false;
            }
            input = undefined;
            handled = true;
        } else { //if (input > 31 && input < 127) { //32-126
            input_alias = input_alias + input; //String.fromCharCode(input);
            rd_in = false;
            input = undefined;
            handled = true;
            // max. 14 Zeichen -> 'weiter zu YesNo'
            if (input_alias.length == 14) {
                highscore[input_line] = highscore[input_line] + "  " + input_alias; //"99999  alias678901234"
                storageHighscoreSave();
                setTimeout(highscoreYesNo, 100);
                return;
            }
        }
    }

    //keine Taste, weiter warten
    setTimeout(highscoreInput, 50);
}


function highscoreYesNo() {
    if (!rd_yn) { //braucht nur 1x gemalt werden
        //Loop Tastaturabfrage Y/N (89/78)
        buffer_menu_context.globalCompositeOperation = "destination-out";
        menuLine("NEW GAME ? (Y/N)", 12, 28);

        //Zeile löschen
        //Cursor(\177) und Zeichen
        buffer_menu_context.globalCompositeOperation = "source-over";
        buffer_menu_context.fillStyle = KCB_TUERKIS;
        buffer_menu_context.fillRect(17 * 8, (7 + input_line) * 8, 15 * 8, 8);
        buffer_menu_context.globalCompositeOperation = "destination-out";
        menuLine(input_alias, 17, 7 + input_line);

        //kopiere die Grafik aus dem Puffer skaliert (body_width x body_height) in das sichtbare Menu-Canvas (canvas_menuimg)
        //Menu mit Farbe löschen (copy)
        context_menuimg.globalCompositeOperation = "copy";
        context_menuimg.fillStyle = KCF_GELB;
        context_menuimg.fillRect(0, 0, body_width, body_height);
        //Menu mit Puffer beschreiben (Weiß ist ausgeschnitten und transparent, KCF_GELB)
        context_menuimg.globalCompositeOperation = "source-over";
        context_menuimg.drawImage(buffer_menu_canvas, 0, 0, 320, 240, 0, 0, body_width, body_height);

        rd_yn = true;
    }

    switch (input) {
        case 'y':
        case 'Y':
            input_alias = "";
            input_line = 0;
            input = undefined;
            rd_yn = false;
            //storage_game_restore(); //spielstand restaurieren
            state = 'init';
            init_room(score_raum);
            handled = true;
            //virtuelle Tastatur ausblenden
            document.body.removeEventListener('click', vkb_focus, false);
            document.body.removeEventListener('input', vkb_input, false);
            virt_kbd.blur();
            return;
        case 'n':
        case 'N':
            input_alias = "";
            input_line = 0;
            input = undefined;
            rd_yn = false;
            idle_stop();
            state = 'menu';
            menu_draw();
            handled = true;
            //virtuelle Tastatur ausblenden
            document.body.removeEventListener('click', vkb_focus, false);
            document.body.removeEventListener('input', vkb_input, false);
            virt_kbd.blur();
            return;
    }

    //keine Taste, weiter warten
    setTimeout(highscoreYesNo, 50);
}


//schreibe zeilenweise die MENU-Grafik (in orig. Größe 320x240) in den Canvas-Puffer (buffer_menu_canvas)
function menu_draw() {
    //Puffer mit Farbe löschen (copy)
    buffer_menu_context.globalCompositeOperation = "copy";
    buffer_menu_context.fillStyle = KCB_BLAU;
    buffer_menu_context.fillRect(0, 0, 320, 240);

    if (chars_image.complete) {
        //male KCF_WEISS auf die vorher KCB_BLAU gefüllte Fläche über
        //KCB_BLAU ist die Hintergrundfarbe und KCF_WEISS ist 100% deckend (source-over)
        //im Zielcanvas ist KCF_WEISS dann also normal KCF_WEISS
        buffer_menu_context.globalCompositeOperation = "source-over";

        //der Text ...
        menuLine("\234\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\236", 0, 0);
        menuLine("\237\240\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\242\237", 0, 1);
        menuLine("\237\243\234\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\236\251\237", 0, 2);
        for (var i = 3; i < 27; i++) {
            menuLine("\237\243\237", 0, i);
            menuLine("\237\251\237", 37, i);
        }
        menuLine("\200\201\202\203 \210 \211\212\213\214 \211\212\213\214 \200\201\215\215 \133\215\221\222", 7, 6);
        menuLine("\133 \206\207 \133 \133  \215 \133  \215 \133    \133 \223\224", 7, 7);
        menuLine("\133  \133 \133 \133 \244\216 \133 \244\216 \133\217\220  \133\225\226\227", 7, 8);
        menuLine("\133 \260\261 \133 \133 \316\133 \133 \316\133 \133    \133 \230\231", 7, 9);
        menuLine("\252\253\254\255 \262 \263\264\265\266 \263\264\265\266 \252\253\267\267 \133 \232\233", 7, 10);

        menuLine("WRITTEN BY  ALEXANDER LANG", 7, 13);
        /* menuLine("GRAPHIX BY  MARTIN    GUTH", 7, 15); */
        menuLine("GRAPHIX BY  STEFAN  DAHLKE", 7, 15);
        menuLine("HUMBOLDT-UNIVERSITY     \245\246", 7, 17);
        menuLine("         BERLIN         \247\250", 7, 18);
        if (gamepad_brand == 'sony') {
            // X:\330 O:\331 Q:\332 D:\333
            menuLine("\330: PLAY   \333: HIGHSCORE", 9, 20);
            menuLine("\332: A LOOK AT THE ROOMS", 9, 22);
        }
        else if (gamepad_brand == 'xbox') {
            // A:\334 B:\335 X:\336 Y:\337
            menuLine("\334: PLAY   \337: HIGHSCORE", 9, 20);
            menuLine("\336: A LOOK AT THE ROOMS", 9, 22);
        }
        else if (gamepad_brand == 'nintendo') {
            // A:\334 B:\335 X:\336 Y:\337
            menuLine("\334: PLAY   \337: HIGHSCORE", 9, 20);
            menuLine("\336: A LOOK AT THE ROOMS", 9, 22);
        }
        else { 
            menuLine("P: PLAY   H: HIGHSCORE", 9, 20);
            menuLine("L: A LOOK AT THE ROOMS", 9, 22);
        }
        menuLine("JSv " + DIGGER_VERSION, 5, 25);
        menuLine("\140 1988", 29, 25);
        menuLine("by TIKKEL", 5, 26);
        menuLine("BERLIN", 29, 26);

        menuLine("\237\243\306\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\310\251\237", 0, 27);
        menuLine("\237\312\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\314\237", 0, 28);
        menuLine("\306\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\310", 0, 29);

        //kopiere die Grafik aus dem Puffer skaliert (body_width x body_height) in das sichtbare Menu-Canvas (canvas_menuimg)
        context_menuimg.drawImage(buffer_menu_canvas, 0, 0, 320, 240, 0, 0, body_width, body_height);
        document.getElementById('menudiv').style.visibility = "visible";
    } else
        setTimeout(menu_draw, 1000);
}


//eine Zeile in den Menu-Puffer
function menuLine(s, x, y) {
    var sx, sy, dx, dy;
    var pre_w = 8;
    var pre_h = 8;
    for (var i = 0; i < s.length; i++) {
        sx = 0;
        sy = (s.charCodeAt(i) - 32) * 8;
        dx = (x + i) * pre_w;
        dy = y * pre_h;
        //buffer_menu_context.globalCompositeOperation = "destination-out";
        buffer_menu_context.drawImage(chars_image, sx, sy, 8, 8, dx, dy, pre_w, pre_h);

    }
}


//Highscore laden und aktualisieren
function storageHighscoreUpdate() {
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
        console.log('storageHighscoreUpdate: generiere Default-Highscore');
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

            //Zeile merken für highscoreInput()
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
function storageHighscoreSave() {
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
function storage_game_save() {
    try { //wird localStorage unterstützt?
        localStorage.setItem("level", score_raum);
        localStorage.setItem("lives", score_leben);
        localStorage.setItem("score", score_punkte);
        console.log('storage_game_save: nach localStorage: Raum:' + score_raum + ' Leben:' + score_leben + ' Punkte:' + score_punkte);
    } catch (e) { //ansonsten Cookies benutzen
        var d = new Date();
        d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = "level=" + score_raum + "; " + expires;
        document.cookie = "lives=" + score_leben + "; " + expires;
        document.cookie = "score=" + score_punkte + "; " + expires;
        console.log('storage_game_save: nach Cookies: Raum:' + score_raum + ' Leben:' + score_leben + ' Punkte:' + score_punkte);
    }
}


//Spielstand restaurieren
function storage_game_restore() {
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
        console.log('storage_game_restore: von localStorage: Raum:' + score_raum + ' Leben:' + score_leben + ' Punkte:' + score_punkte);
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

        console.log('storage_game_restore: von Cookies: Raum:' + score_raum + ' Leben:' + score_leben + ' Punkte:' + score_punkte);
    }
}


//MOUSE_CLICK
function mo_press(ev) {
    //Fullscreen
    if (!fullscreen_flag) fullscreen();

    if (touch_flag) {
        touch_flag = false;
        return;
    }

    //Mausposition
    const mausX = (ev.pageX / (body_width / 40)) << 0;
    const mausY = (ev.pageY / (body_height / 30)) << 0;

    const resetGame = () => {
        score_punkte = 0;
        score_leben = LEBENMAX;
        score_raum = 1;
    };

    //State handlers
    const handlers = {
        menu: () => {
            //Resume or Init audioContext
            try { audioContext.resume(); } catch (e) { init_audio(); }

            //Menu actions
            if (mausY == 20 && mausX >= 9 && mausX <= 15) {         // P: Play
                storage_game_restore();
                state = 'init';
                init_room(score_raum);
            } else if (mausY == 20 && mausX >= 19 && mausX <= 30) { // H: Highscore
                state = 'highscore';
                highscore_draw();
            } else if (mausY == 22 && mausX >= 9 && mausX <= 30) {  // L: Look at rooms
                state = 'look';
                init_room(score_raum);
            }
        },

        look: () => {
            if (score_raum < room.length) {
                score_raum++;
                init_room(score_raum);
            } else {
                state = 'menu';
                resetGame();
                init_room(score_raum);
                menu_draw();
            }
        },

        play: () => {
            if (digger_death) {
                if (score_leben < LEBENMIN) {
                    state = 'highscore';
                    highscore_draw();
                    resetGame();
                } else {
                    state = 'init';
                    init_room(score_raum);
                }
                storage_game_save();
            }
        },

        highscore: () => {
            state = 'menu';
            menu_draw();
        }
    };

    handlers[state]?.();
}

//FULLSCREEN
function fullscreen() {
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
    sfx.step = true;
    state = 'play';
}

function idle_exit() {
    next_raum = true;
}

function idle_stop() {
    window.clearTimeout(verz);
}

// H I G H S C O R E   I N P U T
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



function init_room(level) {
    console.log('Level: ' + level);
    
    // Digger-Zustand initialisieren
    digger_idle = true; digger_half_step = false; digger_go = 'NONE';
    digger_is_dead = false; digger_left = false; digger_up = false;
    digger_right = false; digger_down = false; digger_death = false;
    
    // Spielstand initialisieren
    score_ges = 0; last_ges = -1; score_zeit = 5000;

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

    var room_data = room[level - 1];
    
    // Lookup-Table für Transformationen (viel schneller als if-else-Ketten)
    var trans_map = {0:1.1, 1:7.1, 2:2.1, 3:43.1, 5:3.1, 6:4.1, 7:47.1, 9:7.1, 10:41.1, 11:55.1, 12:6.1, 14:5.1, 15:51.1};
    var bcd = function(b) { return ((b >> 4) * 10) + (b & 15); };
    
    // Zu sammelnde Diamanten (2 Byte auslesen, dezimal interpretiert)
    score_dia = bcd(room_data[139 + 8]);
    
    // Anzahl Geister - Optimierte Version ohne neue Funktionen
    var geist_nr = 0;
    var p = 0; // 0 = left, 1 = right
    var j = 1;
    
    // Room-Data verarbeiten für bessere Performance
    for (var i = 0; i < 140; i++) {
        var byte_value = room_data[i]; // Byte nur einmal lesen
        var nibbles = [byte_value >> 4, byte_value & 15];
        
        for (var n = 0; n < 2; n++) {
            // Bit 5-8 bzw. 1-4 (obere/untere 4 Bits)
            var trans = trans_map[nibbles[n]] !== undefined ? trans_map[nibbles[n]] : nibbles[n];
            
            // Geist-Richtung verarbeiten
            if (trans >= 43 && trans < 63) {
                var ghost_data_idx = 0x94 + (geist_nr >> 1);
                var richtung = p ? (room_data[ghost_data_idx] & 0x0F) : (room_data[ghost_data_idx] >> 0x04);
                
                // Richtungsoffsets: 0=+0, 1=+2, 2=+1, 3=+3
                var offsets = [0, 2, 1, 3];
                trans += offsets[richtung] || 0;
                
                geist_nr++;
                p = 1 - p; // Toggle zwischen left/right
            }
            idx[j++] = trans;
        }
    }
    
    console.log('gefundene Geister: ' + geist_nr);

    // Exitblinken zurücksetzen
    exit_blink = 41;

    // Digger initialisieren
    // Schrittanimation zurücksetzen
    digger_animation_left = false; digger_animation_right = false;
    digger_animation_up = false; digger_animation_down = false;
    digger_step_left = 13; digger_step_up = 9;
    digger_step_right = 19; digger_step_down = 11;
    
    // Diggerposition auslesen
    var d_x = bcd(room_data[139 + 6]);
    var d_y = bcd(room_data[139 + 7]) - 2;
    
    // Bestimme den Index (d_idx) im Feld
    d_idx = (d_x + 1) + (d_y * 20);
    
    // Bestimme die Malposition im Canvas
    digger_x = d_x * pre_icon_size;
    digger_y = d_y * pre_icon_size;

    // Statuszeile komplett überschreiben
    scorelinePrewrite();

    // Menu-Bild unsichtbar
    document.getElementById('menudiv').style.visibility = "hidden";

    // Spiel verzögert starten (wenn Status init)
    if (state == 'init') {
        verz = setTimeout(idle_start, 3000);
    }
}

function draw_digger_death() {
    var positions = [-21, -20, -19, -1, 0, 1, 19, 20, 21];
    var diamondIndices = [0, 1, 2, 3, 4, 5, 6, 7];

    for (var i = 0; i < positions.length; i++) {
        idx[d_idx + positions[i]] = (diamondIndices.indexOf(i) !== -1 && score_ges > i) ? 3.1 : 0.1;
    }

    idx[d_idx] = 63.1;
    digger_is_dead = true;
    sfx.diamond = true;

    // Diggeranimation zurücksetzen
    digger_animation_left = false; digger_animation_right = false;
    digger_animation_up = false; digger_animation_down = false;
    digger_step_left = 13; digger_step_up = 9;
    digger_step_right = 19; digger_step_down = 11;
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
    if (((digger_x + viewport_x) < (pre_abstand)) && (actual_margin_left <= viewport_x) && (viewport_x != 0)) {
        //scroll nach rechts, -x..0
        viewport_x = (diggerdiv_width / 2 - digger_x - pre_icon_size / 2) << 0;
        if (viewport_x > 0)
            viewport_x = 0;
        duration_x = Math.abs(viewport_x - actual_margin_left) / duration / (pre_icon_size / 16);
        canvas_digger.style.transitionDuration = duration_y + "s" + ", " + duration_x + "s";
        canvas_digger.style.marginLeft = viewport_x + "px";
    }
    //rechts, Randabstand < 2 Spritebreiten?
    else if (((digger_x + pre_icon_size + viewport_x) > (diggerdiv_width - pre_abstand)) && (actual_margin_left >= viewport_x) && (viewport_x != pre_max_w_offset)) {
        //scroll nach links, 0..+x
        viewport_x = (diggerdiv_width / 2 - digger_x - pre_icon_size / 2) << 0;
        if (viewport_x < pre_max_w_offset)
            viewport_x = pre_max_w_offset;
        if (viewport_x > 0)
            viewport_x = 0;
        duration_x = Math.abs(viewport_x - actual_margin_left) / duration / (pre_icon_size / 16);
        canvas_digger.style.transitionDuration = duration_y + "s" + ", " + duration_x + "s";
        canvas_digger.style.marginLeft = viewport_x + "px";
    }

    //oben, Randabstand < 2 Spritehöhen
    if (((digger_y + viewport_y) < (pre_abstand)) && (actual_margin_top <= viewport_y) && (viewport_y != 0)) {
        //scroll nach unten, -y..0
        viewport_y = (diggerdiv_height / 2 - digger_y - pre_icon_size / 2) << 0;
        if (viewport_y > 0)
            viewport_y = 0;
        duration_y = Math.abs(viewport_y - actual_margin_top) / duration / (pre_icon_size / 16);
        canvas_digger.style.transitionDuration = duration_y + "s" + ", " + duration_x + "s";
        canvas_digger.style.marginTop = viewport_y + "px";
    }
    //unten, Randabstand < 2 Spritehöhen
    else if (((digger_y + pre_icon_size + viewport_y) > (diggerdiv_height - pre_abstand)) && (actual_margin_top >= viewport_y) && (viewport_y != pre_max_h_offset)) {
        //scroll nach oben, 0--+y
        viewport_y = (diggerdiv_height / 2 - digger_y - pre_icon_size / 2) << 0;
        if (viewport_y < pre_max_h_offset)
            viewport_y = pre_max_h_offset;
        if (viewport_y > 0)
            viewport_y = 0;
        duration_y = Math.abs(viewport_y - actual_margin_top) / duration / (pre_icon_size / 16);
        canvas_digger.style.transitionDuration = duration_y + "s" + ", " + duration_x + "s";
        canvas_digger.style.marginTop = viewport_y + "px";
    }

}

function draw_field() {
    // Style-Werte nur einmal pro Frame berechnen
    actual_margin_left = parseInt(window.getComputedStyle(canvas_digger).marginLeft, 10);
    actual_margin_top = parseInt(window.getComputedStyle(canvas_digger).marginTop, 10);
    
    // Geister-Set für O(1) Lookup statt wiederholten Vergleichen
    const ghostSet = new Set([43.2, 44.2, 45.2, 46.2, 47.2, 48.2, 49.2, 50.2, 
                              51.2, 52.2, 53.2, 54.2, 55.2, 56.2, 57.2, 58.2, 
                              59.2, 60.2, 61.2, 62.2]);
    
    // Viewport-Grenzen vorberechnen
    const viewLeft = -actual_margin_left;
    const viewRight = diggerdiv_width - actual_margin_left;
    const viewTop = -actual_margin_top;
    const viewBottom = diggerdiv_height - actual_margin_top;
    
    let i, x, y, z, s, idx_val;
    
    for (let l = 1; l < 281; l++) {
        idx_val = idx[l];
        i = idx_val << 0;
        
        // Früher Exit wenn nichts zu zeichnen ist
        if (!(idx_val > i || idx_val === 3 || idx_val === 41)) continue;
        
        // Drawflag löschen (außer bei Staub und Geistern)
        if (i > 0 && !ghostSet.has(idx_val)) {
            idx[l] = i;
        }
        
        // Position berechnen (Bit-Shift für Division)
        z = (l - 1) / 20 << 0;
        s = (l - 1) - (z * 20);
        y = z * pre_icon_size;
        x = s * pre_icon_size;
        
        // Diamant Blinksequenz
        if (i === 3) {
            i = diamond_blink + (z * 6) - ((z * 6 / 10) << 0) * 10;
            if (i > 73) i -= 10;
        }
        
        // Exit blinken
        if (i === 41) {
            i = exit_blink << 0;
        }
        
        // Diggerposition setzen
        if (i > 7 && i < 41) {
            digger_x = x;
            digger_y = y;
        }
        
        // Optimiertes Clipping: nur zeichnen wenn sichtbar oder kein Diamant
        if (i < 64 || (x + pre_icon_size >= viewLeft && x <= viewRight && 
                       y + pre_icon_size >= viewTop && y <= viewBottom)) {
            context_digger.drawImage(buffer_sprites_canvas, 0, sprites[i] * pre_icon_size, 
                                   pre_icon_size, pre_icon_size, x, y, pre_icon_size, pre_icon_size);
        }
    }
}


// SCORELINE
// schreibe Zeichenweise in das Scoreline-Canvas (Leben, Counter, Diamanten ...)
function scorelineChar(s, x, y) {
    for (let i = 0; i < s.length; i++) {
        const sx = 0;
        const sy = (s.charCodeAt(i) - 32) * pre_icon_size;
        const dx = (x + i) * buffer_chars_canvas.width;
        const dy = y * pre_icon_size;

        // vorskalierte Zeichen aus "buffer_chars_canvas" ins sichtbare "canvas_scoreline" zeichnen
        context_scoreline.drawImage(
            buffer_chars_canvas,
            sx, sy,
            buffer_chars_canvas.width, pre_icon_size,
            dx, dy,
            buffer_chars_canvas.width, pre_icon_size
        );
    }
}


// belege die ganze Scoreline vor
function scorelinePrewrite() {
    const PADDING = 2;
    const SCORE_LENGTH = 5;
    const LIFE_LENGTH = 2;
    const DIAMOND_LENGTH = 2;

    // Header darstellen
    let sr = score_raum.toString().padStart(LIFE_LENGTH, '0');
    let sl = score_leben.toString().padStart(LIFE_LENGTH, '0');
    let sd = score_dia.toString().padStart(DIAMOND_LENGTH, '0');

    // \324\325 --> Herz
    // \326\327 --> Diamant
    scorelineChar("  " + sr + "   " + sl + "\324\325    5000" + "      \326\327" + sd + "              ", 0, 0);
    
    // gesammelte Diamanten und Punkte-Refresh aktivieren, weil last_ != score_
    last_ges = score_ges - 1;
    last_punkte = score_punkte - 1;
}


function scorelineUpdate() {
    const LIFE_LENGTH = 2;
    const TIME_LENGTH = 4;
    const DIAMOND_LENGTH = 2;
    const SCORE_LENGTH = 5;

    // refresh "übrige Leben" wenn getötet
    if (digger_death) {
        let sl = score_leben.toString().padStart(LIFE_LENGTH, '0');
        scorelineChar(sl, 7, 0);
    }

    // refresh "Countdown"
    let sz = score_zeit.toString().padStart(TIME_LENGTH, '0');
    // blinken, wenn weniger als 1000
    if (score_zeit < 1000 && (score_zeit % 4) <= 1 && score_zeit !== 0) {
        sz = "    ";
    }
    scorelineChar(sz, 15, 0);

    // refresh "gesammelte Diamanten"
    if (score_ges !== last_ges) {
        let sg = score_ges.toString().padStart(DIAMOND_LENGTH, '0');
        scorelineChar(sg, 23, 0);
        last_ges = score_ges;
    }

    // refresh "gesamte Punktanzahl"
    if (autoscore > 0) {
        score_punkte += 5;
        autoscore -= 5;
        sfx.stone = true;
    }
    if (score_punkte !== last_punkte) {
        let sp = score_punkte.toString().padStart(SCORE_LENGTH, '0');
        scorelineChar(sp, 33, 0);
        last_punkte = score_punkte;
    }
}


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

//FRAME 1/2
function draw_frame1() {

    // DIGGER_HALT
    if (state === 'play' && !digger_death && !digger_idle && digger_go === 'NONE') {
        // Animation zurücksetzen
        idx[d_idx] = 8.1;
        digger_step_left = 13;
        digger_step_up = 9;
        digger_step_right = 19;
        digger_step_down = 11;
        digger_animation_left = digger_animation_right = digger_animation_up = digger_animation_down = false;
        digger_idle = true;
    }

    // DIGGER_MOVE
    if (state === 'play' && !digger_death && !digger_idle) {
        if (stone_l && digger_go !== 'LEFT') stone_l = false;
        if (stone_r && digger_go !== 'RIGHT') stone_r = false;
        var directions = {
            'LEFT': { offset: -1, stone_offset: -2, stone_flag: 'stone_l', 
                    step_var: 'digger_step_left', step_init: 13, anim_flag: 'digger_animation_left' },
            'UP': { offset: -20, stone_offset: null, stone_flag: null,
                step_var: 'digger_step_up', step_init: 9, anim_flag: 'digger_animation_up' },
            'RIGHT': { offset: 1, stone_offset: 2, stone_flag: 'stone_r',
                    step_var: 'digger_step_right', step_init: 19, anim_flag: 'digger_animation_right' },
            'DOWN': { offset: 20, stone_offset: null, stone_flag: null,
                    step_var: 'digger_step_down', step_init: 11, anim_flag: 'digger_animation_down' }
        };
        var dir = directions[digger_go];
        if (dir) {
            var target_idx = d_idx + dir.offset;
            var target_val = idx[target_idx];
            // Diamant sammeln
            if (target_val === 3) {
                score_ges++;
                score_punkte += 3;
                sfx.diamond = true;
            }
            // Ausgang erreicht
            else if (target_val === 41) {
                autoscore = 100;
                state = 'init';
                verz = window.setTimeout(idle_exit, 3000);
            }
            // Geist berührt
            else if (target_val >= 43 && target_val < 63) {
                digger_death = true;
            }
            // Stein schieben (nur links/rechts)
            if (target_val === 7 && dir.stone_offset) {
                if (idx[d_idx + dir.stone_offset] === 1) {
                    var stone_flag = window[dir.stone_flag];
                    if (stone_flag) {
                        idx[d_idx + dir.stone_offset] = 7.1;
                        idx[target_idx] = 1.1;
                        window[dir.stone_flag] = false;
                        brumm = true;
                    } else {
                        window[dir.stone_flag] = true;
                    }
                }
            }
            // Bewegung ausführen (wenn Ziel Sand, Diamant, Leer, Ausgang oder geschobener Stein)
            if (target_val < 4 || target_val === 41 || 
                (target_val === 7 && dir.stone_offset && idx[target_idx] === 1.1)) {
                idx[d_idx] = 1.1;
                d_idx += dir.offset;
                sfx.step = true;
            }
            // Animation aktivieren (beim ersten Schritt)
            if (window[dir.step_var] === dir.step_init) {
                digger_animation_left = digger_animation_right = digger_animation_up = digger_animation_down = false;
                window[dir.anim_flag] = true;
                digger_step_left = 13;
                digger_step_up = 9;
                digger_step_right = 19;
                digger_step_down = 11;
            }
        }
    }

    // DIGGER_ANIMIEREN
    // Links/Rechts (bei jedem Halbbild)
    if (digger_animation_left) {
        idx[d_idx] = digger_step_left + 0.1;
        digger_step_left = digger_step_left === 18 ? 13 : digger_step_left + 1;
    } else if (digger_animation_right) {
        idx[d_idx] = digger_step_right + 0.1;
        digger_step_right = digger_step_right === 24 ? 19 : digger_step_right + 1;
    }
    // Hoch/Runter (nur bei jedem Vollbild)
    if (digger_animation_up) {
        idx[d_idx] = digger_step_up + 0.1;
        digger_step_up = digger_step_up === 10 ? 9 : digger_step_up + 1;
    } else if (digger_animation_down) {
        idx[d_idx] = digger_step_down + 0.1;
        digger_step_down = digger_step_down === 12 ? 11 : digger_step_down + 1;
    }

    //SPIELFELD AKTIVITAETEN
    if (state == 'play') {

        // DIGGER_IDLE
        // Digger langweilt sich und blinzelt oder stampft
        if (digger_idle) {
            zufall = (zufall % 280) + 1;
            // Neue Animation starten
            if (!digger_in_idle) {
                var zufallsWert = idx[zufall];
                if (zufallsWert === 7) {        // Stein -> Digger blinzeln
                    digger_idle_augen = 24;
                    digger_in_idle = true;
                    idle_augen = true;
                } else if (zufallsWert === 3) { // Diamant -> Digger stampfen
                    digger_idle_stampfen = 32;
                    digger_in_idle = true;
                    idle_augen = false;
                }
            }
            // Animation fortsetzen
            if (digger_in_idle) {
                if (idle_augen) {   // Digger blinzeln
                    if (++digger_idle_augen === 33) {
                        digger_in_idle = false;
                    }
                }
                else {              // Digger stampfen
                    if (++digger_idle_stampfen === 41) {
                        digger_in_idle = false;
                    }
                }
            }
        } else {
            digger_in_idle = false;             // Animation abbrechen  
        }
        if (digger_in_idle && !digger_death) {  // Animation setzen
            idx[d_idx] = (idle_augen ? digger_idle_augen : digger_idle_stampfen) + 0.1;  //
        }

        //GEISTER STONE DIAMOND EXIT STAUB (280xloop)
        //- Geister bewegen
        //- Steine und Diamanten fallen lassen
        //- Ausgang anzeigen, wenn genügend Diamanten gesammelte
        //- Staub langsam auflösen
        var ti = 1;
        for (var l = 1; l < 281; l++) {

            // GEISTER 180 (43-46)
            if (idx[l] >= 43 && idx[l] < 47) {
                // Zum sterben markierte Geister(nn.2)?
                if (idx[l] == 43.2 || idx[l] == 44.2 || idx[l] == 45.2 || idx[l] == 46.2) {
                    // Wenn Digger in Explosionsnaehe, dann ihn auch killen!
                    if ([l-21,l-20,l-19,l-1,l+1,l+19,l+20,l+21].some(i => idx[i] >= 8 && idx[i] < 41))
                        digger_death = true;
                    // Geist zu Staub
                    [l-21,l-20,l-19,l-1,l,l+1,l+19,l+20,l+21].forEach(i => idx[i] = 0.1);
                    sfx.stone = true;
                }
                //GEISTER hin und her (43-46)
                else {
                    ti = l;
                    let dirs = [
                        [45, -20, 20, 45.1, 43.1, -40, 40], // HOCH
                        [43, 20, -20, 43.1, 45.1, 40, -40], // RUNTER
                        [44, 1, -1, 44.1, 46.1, 2, -2],     // RECHTS
                        [46, -1, 1, 46.1, 44.1, -2, 2]      // LINKS
                    ];
                    
                    for (let [ghost, dir1, dir2, set1, set2, check1, check2] of dirs) {
                        if (idx[l] == ghost) {
                            // Erste Richtung prüfen
                            if (idx[l + dir1] == 1 || idx[l + dir1] == 1.1) {
                                ti = l + dir1;
                                idx[l] = 1.1;
                                idx[ti] = set1;
                                if (idx[l + check1] >= 8 && idx[l + check1] < 41) digger_death = true;
                            } else if (idx[l + dir1] >= 8 && idx[l + dir1] < 41) {
                                digger_death = true;
                            } 
                            // Zweite Richtung prüfen
                            else if (idx[l + dir2] == 1 || idx[l + dir2] == 1.1) {
                                ti = l + dir2;
                                idx[l] = 1.1;
                                idx[ti] = set2;
                                if (idx[l + check2] >= 8 && idx[l + check2] < 41) digger_death = true;
                            } else if (idx[l + dir2] >= 8 && idx[l + dir2] < 41) {
                                digger_death = true;
                            }
                            break;
                        }
                    }
                }

                //Geist toeten, wenn unter fallenden (.2) aber nicht bewegten (.1) Stein/Diamant
                //- bewegter Stein/Diamant: 3.2/7.2
                //- zu toetender Geist: n + 0.2
                if (idx[ti - 20] == 3.2 || idx[ti - 20] == 7.2)
                    idx[ti] = (idx[ti] << 0) + 0.2;
            }

            // GEISTER 90L (47-50)
            else if (idx[l] >= 47 && idx[l] < 51) {
                // Zum sterben markierte Geister(nn.2)?
                if (idx[l] == 47.2 || idx[l] == 48.2 || idx[l] == 49.2 || idx[l] == 50.2) {
                    // Wenn Digger in Explosionsnaehe, dann ihn auch killen!
                    if ([l-21,l-20,l-19,l-1,l+1,l+19,l+20,l+21].some(i => idx[i] >= 8 && idx[i] < 41))
                        digger_death = true;
                    // Geist zu Staub
                    [l-21,l-20,l-19,l-1,l,l+1,l+19,l+20,l+21].forEach(i => idx[i] = 0.1);
                    sfx.stone = true;
                }
                //Geister bewegen: 47=down, 49=up, 48=right, 50=left 90L
                else {
                    ti = l;
                    let dirs = [
                        [49, [-20,49.1,-40], [-1,50.1,-2], [1,48.1,2], [20,47.1,40]], // HOCH up left right down
                        [47, [20,47.1,40], [1,48.1,2], [-1,50.1,-2], [-20,49.1,-40]], // RUNTER down right left up
                        [48, [1,48.1,2], [-20,49.1,-40], [20,47.1,40], [-1,50.1,-2]], // RECHTS right up down left
                        [50, [-1,50.1,-2], [20,47.1,40], [-20,49.1,-40], [1,48.1,2]]  // LINKS left down up right
                    ];
                    
                    for (let [ghost, ...checks] of dirs) {
                        if (idx[l] == ghost) {
                            for (let [dir, set, check] of checks) {
                                if (idx[l + dir] == 1 || idx[l + dir] == 1.1) {
                                    ti = l + dir;
                                    idx[l] = 1.1;
                                    idx[ti] = set;
                                    if (idx[l + check] >= 8 && idx[l + check] < 41) digger_death = true;
                                    break;
                                } else if (idx[l + dir] >= 8 && idx[l + dir] < 41) {
                                    digger_death = true;
                                }
                            }
                            break;
                        }
                    }
                }

                //Geist toeten, wenn unter fallenden (.2) aber nicht bewegten (.1) Stein/Diamant
                //- bewegter Stein/Diamant: 3.2/7.2
                //- zu toetender Geist: n + 0.2
                if (idx[ti - 20] == 3.2 || idx[ti - 20] == 7.2)
                    idx[ti] = (idx[ti] << 0) + 0.2;
            }

            // GEISTER 90R (51-54)
            else if (idx[l] >= 51 && idx[l] < 55) {
                // Zum sterben markierte Geister(nn.2)?
                if (idx[l] == 51.2 || idx[l] == 52.2 || idx[l] == 53.2 || idx[l] == 54.2) {
                    // Wenn Digger in Explosionsnaehe, dann ihn auch killen!
                    if ([l-21,l-20,l-19,l-1,l+1,l+19,l+20,l+21].some(i => idx[i] >= 8 && idx[i] < 41))
                        digger_death = true;
                    // Geist zu Staub
                    [l-21,l-20,l-19,l-1,l,l+1,l+19,l+20,l+21].forEach(i => idx[i] = 0.1);
                    sfx.stone = true;
                }
                //Geister bewegen: 51=down, 53=up, 52=right, 54=left 90R
                else {
                    ti = l;
                    let dirs = [
                        [53, [-20,53.1,-40], [1,52.1,2], [-1,54.1,-2], [20,51.1,40]], // HOCH up right left down
                        [51, [20,51.1,40], [-1,54.1,-2], [1,52.1,2], [-20,53.1,-40]], // RUNTER down left right up
                        [52, [1,52.1,2], [20,51.1,40], [-20,53.1,-40], [-1,54.1,-2]], // RECHTS right down up left
                        [54, [-1,54.1,-2], [-20,53.1,-40], [20,51.1,40], [1,52.1,2]]  // LINKS left up down right
                    ];
                    
                    for (let [ghost, ...checks] of dirs) {
                        if (idx[l] == ghost) {
                            for (let [dir, set, check] of checks) {
                                if (idx[l + dir] == 1 || idx[l + dir] == 1.1) {
                                    ti = l + dir;
                                    idx[l] = 1.1;
                                    idx[ti] = set;
                                    if (idx[l + check] >= 8 && idx[l + check] < 41) digger_death = true;
                                    break;
                                } else if (idx[l + dir] >= 8 && idx[l + dir] < 41) {
                                    digger_death = true;
                                }
                            }
                            break;
                        }
                    }
                }

                //Geist toeten, wenn unter fallenden (.2) aber nicht bewegten (.1) Stein/Diamant
                //- bewegter Stein/Diamant: 3.2/7.2
                //- zu toetender Geist: n + 0.2
                if (idx[ti - 20] == 3.2 || idx[ti - 20] == 7.2)
                    idx[ti] = (idx[ti] << 0) + 0.2;
            }

            // GEISTER 90LR (55-58) - Optimized
            else if (idx[l] >= 55 && idx[l] < 59) {
                // Zum sterben markierte Geister(nn.2)?
                if (idx[l] == 55.2 || idx[l] == 56.2 || idx[l] == 57.2 || idx[l] == 58.2) {
                    // Wenn Digger in Explosionsnaehe, dann ihn auch killen!
                    if ([l-21,l-20,l-19,l-1,l+1,l+19,l+20,l+21].some(i => idx[i] >= 8 && idx[i] < 41))
                        digger_death = true;
                    // Geist zu Staub
                    [l-21,l-20,l-19,l-1,l,l+1,l+19,l+20,l+21].forEach(i => idx[i] = 0.1);
                    sfx.stone = true;
                }
                //Geister bewegen: 55=down, 57=up, 56=right, 58=left 90LR
                else {
                    ti = l;
                    let dirs = [
                        [57, [-20,57.1,-40], [-1,62.1,-2], [1,60.1,2], [20,55.1,40]], // HOCH up left right down
                        [55, [20,55.1,40], [1,60.1,2], [-1,62.1,-2], [-20,57.1,-40]], // RUNTER down right left up
                        [56, [1,56.1,2], [-20,61.1,-40], [20,59.1,40], [-1,58.1,-2]], // RECHTS right up down left
                        [58, [-1,58.1,-2], [20,59.1,40], [-20,61.1,-40], [1,56.1,2]]  // LINKS left down up right
                    ];
                    
                    for (let [ghost, ...checks] of dirs) {
                        if (idx[l] == ghost) {
                            for (let [dir, set, check] of checks) {
                                if (idx[l + dir] == 1 || idx[l + dir] == 1.1) {
                                    ti = l + dir;
                                    idx[l] = 1.1;
                                    idx[ti] = set;
                                    if (idx[l + check] >= 8 && idx[l + check] < 41) digger_death = true;
                                    break;
                                } else if (idx[l + dir] >= 8 && idx[l + dir] < 41) {
                                    digger_death = true;
                                }
                            }
                            break;
                        }
                    }
                }

                //Geist toeten, wenn unter fallenden (.2) aber nicht bewegten (.1) Stein/Diamant
                //- bewegter Stein/Diamant: 3.2/7.2
                //- zu toetender Geist: n + 0.2
                if (idx[ti - 20] == 3.2 || idx[ti - 20] == 7.2)
                    idx[ti] = (idx[ti] << 0) + 0.2;
            }

            // GEISTER 90RL (59-62) - Optimized
            else if (idx[l] >= 59 && idx[l] < 63) {
                // Zum sterben markierte Geister(nn.2)?
                if (idx[l] == 59.2 || idx[l] == 60.2 || idx[l] == 61.2 || idx[l] == 62.2) {
                    // Wenn Digger in Explosionsnaehe, dann ihn auch killen!
                    if ([l-21,l-20,l-19,l-1,l+1,l+19,l+20,l+21].some(i => idx[i] >= 8 && idx[i] < 41))
                        digger_death = true;
                    // Geist zu Staub
                    [l-21,l-20,l-19,l-1,l,l+1,l+19,l+20,l+21].forEach(i => idx[i] = 0.1);
                    sfx.stone = true;
                }
                //Geister bewegen: 59=down, 61=up, 60=right, 62=left 90RL
                else {
                    ti = l;
                    let dirs = [
                        [61, [-20,61.1,-40], [1,56.1,2], [-1,58.1,-2], [20,59.1,40]], // HOCH up right left down
                        [59, [20,59.1,40], [-1,58.1,-2], [1,56.1,2], [-20,61.1,-40]], // RUNTER down left right up
                        [60, [1,60.1,2], [20,55.1,40], [-20,57.1,-40], [-1,62.1,-2]], // RECHTS right down up left
                        [62, [-1,62.1,-2], [-20,57.1,-40], [20,55.1,40], [1,60.1,2]]  // LINKS left up down right
                    ];
                    
                    for (let [ghost, ...checks] of dirs) {
                        if (idx[l] == ghost) {
                            for (let [dir, set, check] of checks) {
                                if (idx[l + dir] == 1 || idx[l + dir] == 1.1) {
                                    ti = l + dir;
                                    idx[l] = 1.1;
                                    idx[ti] = set;
                                    if (idx[l + check] >= 8 && idx[l + check] < 41) digger_death = true;
                                    break;
                                } else if (idx[l + dir] >= 8 && idx[l + dir] < 41) {
                                    digger_death = true;
                                }
                            }
                            break;
                        }
                    }
                }

                //Geist toeten, wenn unter fallenden (.2) aber nicht bewegten (.1) Stein/Diamant
                //- bewegter Stein/Diamant: 3.2/7.2
                //- zu toetender Geist: n + 0.2
                if (idx[ti - 20] == 3.2 || idx[ti - 20] == 7.2)
                    idx[ti] = (idx[ti] << 0) + 0.2;
            }

            // Steine und Diamanten
            else if (idx[l] === 7 || idx[l] === 3) {
                // Stein in Diamant umwandeln
                if (idx[l] === 7 && idx[l + 20] === 5 && idx[l + 40] === 1) {
                    idx[l + 40] = 3.2;
                    idx[l] = 1.1;
                    if (idx[l + 60] > 1) {
                        sfx.stone = true;
                        if (idx[l + 60] >= 8 && idx[l + 60] < 41) {
                            digger_death = true;
                        } else if (idx[l + 60] >= 43 && idx[l + 60] < 63) {
                            idx[l + 60] = (idx[l + 60] << 0) + 0.2;
                        }
                    }
                }
                // Fallen lassen
                else if (idx[l + 20] === 1) {
                    idx[l + 20] = idx[l] + 0.2;
                    idx[l] = 1.1;
                    if (idx[l + 40] >= 2) {
                        sfx.stone = true;
                        if (idx[l + 40] >= 8 && idx[l + 40] < 41) {
                            digger_death = true;
                        } else if (idx[l + 40] >= 43 && idx[l + 40] < 63) {
                            idx[l + 40] = (idx[l + 40] << 0) + 0.2;
                        }
                    }
                }
                // Rollen
                else if (idx[l + 20] === 7 || idx[l + 20] === 3 || idx[l + 20] === 63) {
                    // Prüfe links (-1) dann rechts (+1)
                    for (var d = -1; d <= 1; d += 2) {
                        if ((idx[l + d] === 1 || idx[l + d] === 7.2 || idx[l + d] === 3.2) 
                            && idx[l + 20 + d] === 1) {
                            idx[l + 20 + d] = idx[l] + 0.2;
                            idx[l] = 1.1;
                            if (idx[l + 40 + d] >= 2) {
                                sfx.stone = true;
                                if (idx[l + 40 + d] >= 8 && idx[l + 40 + d] < 41) {
                                    digger_death = true;
                                } else if (idx[l + 40 + d] >= 43 && idx[l + 40 + d] < 63) {
                                    idx[l + 40 + d] = (idx[l + 40 + d] << 0) + 0.2;
                                }
                            }
                            break;
                        }
                    }
                }
            }

            // mache den unsichtbaren/unbenutzbaren Ausgang (6) sichtbar (41), bei genuegent Diamanten
            else if (idx[l] === 6 && score_ges >= score_dia) {
                idx[l] = 41.1;
                exit_blink = 41; // Animationsanfang setzen
            }

            // Staub(0.1) nach 3 Loops in Leere(1.1) aufloesen
            else if (idx[l] >= 0.1 && idx[l] <= 0.4) {
                idx[l] += 0.1;
                if (idx[l] === 0.4) {
                    idx[l] = 1.1;
                }
            }

        }
    }

    //LEVEL WECHSELN
    if (next_raum) {
        if (score_raum == room.length) {
            state = 'highscore';
            highscore_draw();
            score_raum = 1;
            score_leben = LEBENMAX;
            score_punkte = 0;
        } else {
            score_raum++;
            state = 'init';
            init_room(score_raum);
        }
        next_raum = false;
        storage_game_save();
    }

    //Statuszeile und
    //Softscroller aktualisieren
    scorelineUpdate();
    soft_scroll();

    //Ton abspielen
    if (sfx.diamond) {
        play_audio('Diamond');
    } else if (sfx.stone) {
        play_audio('Stone');
        brumm = true;
    } else if (sfx.step) {
        play_audio('Step');
    }
    sfx.diamond = false;
    sfx.step = false;
    sfx.stone = false;

    //Vibration (Gamepad/Handy/Tablet)
    if (brumm) {
        //Gamepad
        if (gamepad_dualrumble)
            navigator.getGamepads()[0].vibrationActuator.playEffect("dual-rumble", {startDelay:0,duration:48,weakMagnitude:1.0,strongMagnitude:0.0})
        else
            if (navigator.vibrate)
                navigator.vibrate([50, 20, 50, 20, 50, 20, 30, 20, 20]); //navigator.vibrate(48);
        brumm = false;
    }

    //DIGGER TOETEN
    if (digger_death && !digger_is_dead) {
        draw_digger_death();
        digger_go = 'NONE';
        score_leben--;
        //spielstand sichern
        storage_game_save();
    }

    //Frame 1/2 --> Frame 2/2
    digger_half_step = true;
    digger_start_up = false;
    digger_start_down = false;
    digger_start_left = false;
    digger_start_right = false;

}

//FRAME 2/2
function draw_frame2() {

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

function game_loop() {

    //Gamepad#0 abfragen
    gamepad_update();

    if (state == 'look' || state == 'init' || state == 'play') {

        //FRAME
        //Spielfrequenz um die hälfte teilen
        if (takt_teiler == 1) {

            if (!digger_half_step) {
                draw_frame1()
            } else {
                draw_frame2()
            }

            //FRAME 1und2
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

    setTimeout(game_loop, FPS);

}


function init_events() {

    //Touch aktivieren (Handy, Tablet)
    document.body.addEventListener('touchstart', touch_down, false);
    document.body.addEventListener('touchend', touch_up, false);
    document.body.addEventListener('touchcancel', touch_up, false);
    document.body.addEventListener('touchmove', touch_xy, true);
    
    // Verhindert Zoomen durch Doppeltipp
    document.body.style.touchAction = 'manipulation';

    //Maus und Tastatur aktivieren (PC, LG-SmartTV)
    document.body.addEventListener('click', mo_press, false);
    document.body.addEventListener('keydown', kb_press, false);
    document.body.addEventListener('keyup', kb_release, false);
    document.body.addEventListener('keypress', kb_input, false);

    //Bildschirm und Buffer neu skalieren
    window.addEventListener('resize', scaleReload, false);

    //Gamepad verbunden|abgesteckt
    if (navigator.getGamepads) {
        window.addEventListener('gamepadconnected', gamepad_connect, false);
        window.addEventListener('gamepaddisconnected', gamepad_disconnect, false);
    }
    
}


//Bildschirm und Buffer neu skalieren
scaleReload();

//Gameloop
game_loop();
init_events();
