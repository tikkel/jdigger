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
    // ? spritesImage und charsImage vorgeladen
    if (spritesImage.complete && charsImage.complete) {
        //Sprites Puffer-Canvas, 1x40 Sprites
        buffer_spritesCanvas.width = pre_icon_size;
        buffer_spritesCanvas.height = pre_icon_size * 40;
        //Pixelgrafik, no dithering
        scalePixelated(buffer_spritesContext);
        //Sprites skaliert in "buffer_spritesCanvas" schreiben/puffern
        buffer_spritesContext.drawImage(spritesImage, 0, 0, buffer_spritesCanvas.width, buffer_spritesCanvas.height);
        console.log('buffersize sprites: ' + buffer_spritesCanvas.width + 'x' + buffer_spritesCanvas.height);

        //Zeichen Puffer-Canvas
        buffer_charsCanvas.width = (body_width / 40) << 0;
        buffer_charsCanvas.height = pre_icon_size * 184;
        //Pixelgrafik, no dithering
        scalePixelated(buffer_charsContext);
        //Charset skaliert in "buffer_charsCanvas" schreiben/puffern
        buffer_charsContext.fillStyle = KCB_ROT;
        buffer_charsContext.fillRect(0, 0, buffer_charsCanvas.width, buffer_charsCanvas.height);
        buffer_charsContext.drawImage(charsImage, 0, 0, buffer_charsCanvas.width, buffer_charsCanvas.height);
        console.log('buffersize chars: ' + buffer_charsCanvas.width + 'x' + buffer_charsCanvas.height);
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
        menuDraw();
    else if (state == 'highscore')
        highscoreDraw();
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


function highscoreDraw() {
    //Puffer mit Farbe löschen (copy)
    buffer_menuContext.globalCompositeOperation = "copy";
    buffer_menuContext.fillStyle = KCB_TUERKIS;
    buffer_menuContext.fillRect(0, 0, 320, 240);

    if (charsImage.complete) {
        //schneide KCF_WEISS aus KCB_TUERKIS aus
        //KCB_TUERKIS ist die Hintergrundfarbe und KCF_WEISS ist 100% transparent (destination-out)
        //im Zielcanvas ist KCF_WEISS dann die vorher gefüllte Farbe
        buffer_menuContext.globalCompositeOperation = "destination-out";

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
        context_menuimg.drawImage(buffer_menuCanvas, 0, 0, 320, 240, 0, 0, body_width, body_height);
        document.getElementById('menudiv').style.visibility = "visible";

        //eventl. neuen Alias abfragen
        if (state == 'input')
            setTimeout(highscoreInput, 50);
    } else
        setTimeout(menuDraw, 1000);
}


function highscoreInput() {
    if (!rd_in) { //braucht nur 1x gemalt werden
        //Loop Tastaturabfrage
        buffer_menuContext.globalCompositeOperation = "destination-out";
        menuLine("...well done, please enter your name :", 1, 2);

        //Zeile löschen
        //Cursor(\177) und Zeichen
        buffer_menuContext.globalCompositeOperation = "source-over";
        buffer_menuContext.fillStyle = KCB_TUERKIS;
        buffer_menuContext.fillRect(17 * 8, (7 + input_line) * 8, 15 * 8, 8);
        buffer_menuContext.globalCompositeOperation = "destination-out";
        menuLine(input_alias + "\177", 17, 7 + input_line);

        //kopiere die Grafik aus dem Puffer skaliert (body_width x body_height) in das sichtbare Menu-Canvas (canvas_menuimg)
        //Menu mit Farbe löschen (copy)
        context_menuimg.globalCompositeOperation = "copy";
        context_menuimg.fillStyle = KCF_GELB;
        context_menuimg.fillRect(0, 0, body_width, body_height);
        //Menu mit Puffer beschreiben (Weiß ist ausgeschnitten und transparent, KCF_GELB)
        context_menuimg.globalCompositeOperation = "source-over";
        context_menuimg.drawImage(buffer_menuCanvas, 0, 0, 320, 240, 0, 0, body_width, body_height);

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
        buffer_menuContext.globalCompositeOperation = "destination-out";
        menuLine("NEW GAME ? (Y/N)", 12, 28);

        //Zeile löschen
        //Cursor(\177) und Zeichen
        buffer_menuContext.globalCompositeOperation = "source-over";
        buffer_menuContext.fillStyle = KCB_TUERKIS;
        buffer_menuContext.fillRect(17 * 8, (7 + input_line) * 8, 15 * 8, 8);
        buffer_menuContext.globalCompositeOperation = "destination-out";
        menuLine(input_alias, 17, 7 + input_line);

        //kopiere die Grafik aus dem Puffer skaliert (body_width x body_height) in das sichtbare Menu-Canvas (canvas_menuimg)
        //Menu mit Farbe löschen (copy)
        context_menuimg.globalCompositeOperation = "copy";
        context_menuimg.fillStyle = KCF_GELB;
        context_menuimg.fillRect(0, 0, body_width, body_height);
        //Menu mit Puffer beschreiben (Weiß ist ausgeschnitten und transparent, KCF_GELB)
        context_menuimg.globalCompositeOperation = "source-over";
        context_menuimg.drawImage(buffer_menuCanvas, 0, 0, 320, 240, 0, 0, body_width, body_height);

        rd_yn = true;
    }

    switch (input) {
        case 'y':
        case 'Y':
            input_alias = "";
            input_line = 0;
            input = undefined;
            rd_yn = false;
            //storageGameRestore(); //spielstand restaurieren
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
            menuDraw();
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


//schreibe zeilenweise die MENU-Grafik (in orig. Größe 320x240) in den Canvas-Puffer (buffer_menuCanvas)
function menuDraw() {
    //Puffer mit Farbe löschen (copy)
    buffer_menuContext.globalCompositeOperation = "copy";
    buffer_menuContext.fillStyle = KCB_BLAU;
    buffer_menuContext.fillRect(0, 0, 320, 240);

    if (charsImage.complete) {
        //male KCF_WEISS auf die vorher KCB_BLAU gefüllte Fläche über
        //KCB_BLAU ist die Hintergrundfarbe und KCF_WEISS ist 100% deckend (source-over)
        //im Zielcanvas ist KCF_WEISS dann also normal KCF_WEISS
        buffer_menuContext.globalCompositeOperation = "source-over";

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
        menuLine("P: PLAY   H: HIGHSCORE", 9, 20);
        menuLine("L: A LOOK AT THE ROOMS", 9, 22);
        menuLine("JSv " + digger_version, 5, 25);
        menuLine("\140 1988", 29, 25);
        menuLine("by TIKKEL", 5, 26);
        menuLine("BERLIN", 29, 26);

        menuLine("\237\243\306\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\310\251\237", 0, 27);
        menuLine("\237\312\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\314\237", 0, 28);
        menuLine("\306\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\310", 0, 29);

        //kopiere die Grafik aus dem Puffer skaliert (body_width x body_height) in das sichtbare Menu-Canvas (canvas_menuimg)
        context_menuimg.drawImage(buffer_menuCanvas, 0, 0, 320, 240, 0, 0, body_width, body_height);
        document.getElementById('menudiv').style.visibility = "visible";
    } else
        setTimeout(menuDraw, 1000);
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
        //buffer_menuContext.globalCompositeOperation = "destination-out";
        buffer_menuContext.drawImage(charsImage, sx, sy, 8, 8, dx, dy, pre_w, pre_h);

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
function storageGameSave() {
    try { //wird localStorage unterstützt?
        localStorage.setItem("level", score_raum);
        localStorage.setItem("lives", score_leben);
        localStorage.setItem("score", score_punkte);
        console.log('storageGameSave: nach localStorage: Raum:' + score_raum + ' Leben:' + score_leben + ' Punkte:' + score_punkte);
    } catch (e) { //ansonsten Cookies benutzen
        var d = new Date();
        d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = "level=" + score_raum + "; " + expires;
        document.cookie = "lives=" + score_leben + "; " + expires;
        document.cookie = "score=" + score_punkte + "; " + expires;
        console.log('storageGameSave: nach Cookies: Raum:' + score_raum + ' Leben:' + score_leben + ' Punkte:' + score_punkte);
    }
}


//Spielstand restaurieren
function storageGameRestore() {
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
        console.log('storageGameRestore: von localStorage: Raum:' + score_raum + ' Leben:' + score_leben + ' Punkte:' + score_punkte);
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

        console.log('storageGameRestore: von Cookies: Raum:' + score_raum + ' Leben:' + score_leben + ' Punkte:' + score_punkte);
    }
}


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
            //Resume or Init audioContext
            try {
                audioContext.resume();
            } catch (e) {
                initAudio();
            }

            //P: Play
            if (mausX >= 9 && mausX <= 15 && mausY == 20) {
                storageGameRestore(); //spielstand restaurieren
                state = 'init';
                init_room(score_raum);
            }
            //H: Highscore
            else if (mausX >= 19 && mausX <= 30 && mausY == 20) {
                state = 'highscore';
                highscoreDraw();
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
            menuDraw();
        }

        //im Spiel
        else if ((state == 'play') && digger_death) {

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

        }

        //im Highscore
        else if (state == 'highscore') {
            state = 'menu';
            menuDraw();
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
            storageGameSave(); //spielstand sichern
            init_room(score_raum);
            menuDraw();
        }
    }

    //2 Finger Tap (entspricht [Esc], Abbruch und Level neu starten)
    else if (e.touches.length > 1) {
        //ESC
        if (state == 'play')
            digger_death = true;
        else if (state == 'highscore' || state == 'look') {
            state = 'menu';
            menuDraw();
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
            highscoreDraw();
            score_punkte = 0;
            score_leben = LEBENMAX;
            score_raum = 1;
        } else {
            state = 'init';
            init_room(score_raum);
        }
        storageGameSave(); //spielstand sichern

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
        //Resume or Init audioContext
        try {
            audioContext.resume();
        } catch (e) {
            initAudio();
        }

        //iOS, initiiere Sound von Benutzergeste aus
        playAudio('Leer');

        var touchS = e.changedTouches[0].pageX / (body_width / 40) << 0;
        var touchZ = e.changedTouches[0].pageY / (body_height / 30) << 0;

        //P: Play
        if (touchS >= 9 && touchS <= 15 && touchZ == 20) {
            storageGameRestore(); //spielstand restaurieren
            state = 'init';
            init_room(score_raum);
        }
        //H: Highscore
        else if (touchS >= 19 && touchS <= 30 && touchZ == 20) {
            state = 'highscore';
            highscoreDraw();
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
        menuDraw();
    }

    //im Highscore
    else if (state == 'highscore') {
        state = 'menu';
        menuDraw();
    }

    //im Spiel
    mouseIsDown = false;
    direction = 'stop';
    setPos();

    //letzte Fingeranzahl merken
    single_touch = e.touches.length;
}

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
    SFX.STEP = true;
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

// K E Y   P R E S S
//https://keycode.info/
function kb_press(taste) {
    //Resume or Init audioContext
    try {
        audioContext.resume();
    } catch (e) {
        initAudio();
    }

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
    last_ges = -1;
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

    //Statuszeile komplett überschreiben
    scorelinePrewrite();

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
    SFX.DIAMOND = true;
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
        // Icon auslesen und Nachkommastelle abschneiden
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

            // Exit blinken lassen (41 exit <-> 42 wall)
            if (i == 41)
                i = exit_blink << 0;

            // Diggerposition im #diggerdiv bestimmen (8 bis 40 gleich Digger)
            if (i > 7 && i < 41) {
                digger_x = x;
                digger_y = y;
            }

            // Clipping and Drawing
            if (
                // kein Diamant? --> dann zeichnen
                (i < 64) ||  // ODER
                // Diamant im sichtbaren Bereich? --> zeichnen
                (
                    ((x + actual_marginLeft + pre_icon_size) >= 0) &&
                    ((x + actual_marginLeft) <= diggerdiv_width) &&
                    ((y + actual_marginTop + pre_icon_size) >= 0) &&
                    ((y + actual_marginTop) <= diggerdiv_height)
                )
            )
                // vorskaliertes Sprite aus "buffer_spritesCanvas" in sichtbaren Canvas zeichnen
                context_digger.drawImage(buffer_spritesCanvas, 0, sprites[i] * pre_icon_size, pre_icon_size, pre_icon_size, x, y, pre_icon_size, pre_icon_size);
        }
    }
}


// SCORELINE
// schreibe Zeichenweise in das Scoreline-Canvas (Leben, Counter, Diamanten ...)
function scorelineChar(s, x, y) {
    var sx, sy, dx, dy;
    for (var i = 0; i < s.length; i++) {
        sx = 0;
        sy = (s.charCodeAt(i) - 32) * pre_icon_size;
        dx = (x + i) * buffer_charsCanvas.width;
        dy = y * pre_icon_size;
        //vorskalierte Zeichen aus "buffer_charsCanvas" ins sichtbare "canvas_scoreline" zeichnen
        context_scoreline.drawImage(buffer_charsCanvas, sx, sy, buffer_charsCanvas.width, pre_icon_size, dx, dy, buffer_charsCanvas.width, pre_icon_size);
    }
}


// belege die ganze Scoreline vor
function scorelinePrewrite() {
    // Header darstellen
    var sr = "" + score_raum;
    var sl = "" + score_leben;
    var sd = "" + score_dia;
    while (sr.length < 2)
        sr = "0" + sr;
    while (sl.length < 2)
        sl = "0" + sl;
    while (sd.length < 2)
        sd = "0" + sd;
    // \324\325 --> Herz
    // \326\327 --> Diamant
    scorelineChar("  " + sr + "   " + sl + "\324\325    5000" + "      \326\327" + sd + "              ", 0, 0);
    //gesammelte Diamanten und Punkte-Refresh aktivieren,weil last_ != score_
    last_ges = score_ges - 1;
    last_punkte = score_punkte - 1;
}


function scorelineUpdate() {
    //refresh "übrige Leben" wenn getötet
    if (digger_death) {
        var sl = "" + score_leben;
        while (sl.length < 2)
            sl = "0" + sl;
        scorelineChar(sl, 7, 0);
    }

    //refresh "Countdown"
    var sz = "" + score_zeit;
    while (sz.length < 4)
        sz = "0" + sz;
    //blinken, wenn weniger als 1000
    if ((score_zeit < 1000) && ((score_zeit % 4) <= 1) && (score_zeit != 0)) {
        sz = "    ";
    }
    scorelineChar(sz, 15, 0);

    //refresh "gesammelte Diamanten"
    if (score_ges != last_ges) {
        var sg = "" + score_ges;
        while (sg.length < 2)
            sg = "0" + sg;
        scorelineChar(sg, 23, 0);
        last_ges = score_ges;
    }

    //refresh "gesamte Punktanzahl"
    if (autoscore > 0) {
        score_punkte += 5;
        autoscore -= 5;
        SFX.STONE = true;
    }
    if (score_punkte != last_punkte) {
        var sp = "" + score_punkte;
        while (sp.length < 5)
            sp = "0" + sp;
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
                        // ? Diamant
                        if (idx[d_idx - 1] == 3) {
                            score_ges++;
                            score_punkte += 3;
                            SFX.DIAMOND = true;
                        }
                        // ? Ausgang
                        else if (idx[d_idx - 1] == 41) {
                            autoscore = 100;
                            state = 'init';
                            verz = window.setTimeout(idle_exit, 3000);
                        }
                        // ? Geist
                        else if ((idx[d_idx - 1] >= 43) && (idx[d_idx - 1] < 63))
                            digger_death = true;
                        // ? Stein
                        else if (idx[d_idx - 1] == 7) {
                            // ? Platz zum wegschieben
                            if (idx[d_idx - 2] == 1) {
                                // ! 2 Takte lang druecken
                                if (stone_l) {
                                    idx[d_idx - 2] = 7.1;
                                    idx[d_idx - 1] = 1.1;
                                    stone_l = false;
                                    brumm = true;
                                } else {
                                    stone_l = true;
                                }
                            }
                        }
                        // ? Sand, Diamant oder Leer
                        if ((idx[d_idx - 1] < 4) || (idx[d_idx - 1] == 41)) {
                            idx[d_idx] = 1.1;
                            d_idx--;
                            SFX.STEP = true;
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
                        // ? Diamant
                        if (idx[d_idx - 20] == 3) {
                            score_ges++;
                            score_punkte += 3;
                            SFX.DIAMOND = true;
                        }
                        // ? Ausgang
                        else if (idx[d_idx - 20] == 41) {
                            autoscore = 100;
                            state = 'init';
                            verz = window.setTimeout(idle_exit, 3000);
                        }
                        // ? Geist
                        else if ((idx[d_idx - 20] >= 43) && (idx[d_idx - 20] < 63))
                            digger_death = true;
                        // ? Sand, Diamant oder Leer
                        if ((idx[d_idx - 20] < 4) || (idx[d_idx - 20] == 41)) {
                            idx[d_idx] = 1.1;
                            d_idx -= 20;
                            SFX.STEP = true;
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
                        // ? Diamant
                        if (idx[d_idx + 1] == 3) {
                            score_ges++;
                            score_punkte += 3;
                            SFX.DIAMOND = true;
                        }
                        // ? Ausgang
                        else if (idx[d_idx + 1] == 41) {
                            autoscore = 100;
                            state = 'init';
                            verz = window.setTimeout(idle_exit, 3000);
                        }
                        // ? Geist
                        else if ((idx[d_idx + 1] >= 43) && (idx[d_idx + 1] < 63))
                            digger_death = true;
                        // ? Stein
                        else if (idx[d_idx + 1] == 7) {
                            // ? Platz zum wegschieben
                            if (idx[d_idx + 2] == 1) {
                                // ! 2 Takte lang druecken
                                if (stone_r) {
                                    idx[d_idx + 2] = 7.1;
                                    idx[d_idx + 1] = 1.1;
                                    stone_r = false;
                                    brumm = true;
                                } else {
                                    stone_r = true;
                                }
                            }
                        }
                        // ? Sand, Diamant oder Leer
                        if ((idx[d_idx + 1] < 4) || (idx[d_idx + 1] == 41)) {
                            idx[d_idx] = 1.1;
                            d_idx++;
                            SFX.STEP = true;
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
                        // ? Diamant
                        if (idx[d_idx + 20] == 3) {
                            score_ges++;
                            score_punkte += 3;
                            SFX.DIAMOND = true;
                        }
                        // ? Ausgang
                        else if (idx[d_idx + 20] == 41) {
                            autoscore = 100;
                            state = 'init';
                            verz = window.setTimeout(idle_exit, 3000);
                        }
                        // ? Geist
                        else if ((idx[d_idx + 20] >= 43) && (idx[d_idx + 20] < 63))
                            digger_death = true;
                        // ? Sand, Diamant oder Leer
                        if ((idx[d_idx + 20] < 4) || (idx[d_idx + 20] == 41)) {
                            idx[d_idx] = 1.1;
                            d_idx += 20;
                            SFX.STEP = true;
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
                    var ti = 1;
                    for (var l = 1; l < 281; l++) {
                        // GEISTER 180 (43-46)
                        if ((idx[l] >= 43) && (idx[l] < 47)) {
                            // Zum sterben markierte Geister(nn.2)?
                            if ((idx[l] == 43.2) || (idx[l] == 44.2) || (idx[l] == 45.2) || (idx[l] == 46.2)) {
                                // Wenn Digger in Explosionsnaehe, dann ihn auch killen!
                                if (((idx[l - 21] >= 8) && (idx[l - 21] < 41)) || ((idx[l - 20] >= 8) && (idx[l - 20] < 41)) || ((idx[l - 19] >= 8) && (idx[l - 19] < 41)) || ((idx[l - 1] >= 8) && (idx[l - 1] < 41)) || ((idx[l + 1] >= 8) && (idx[l + 1] < 41)) || ((idx[l + 19] >= 8) && (idx[l + 19] < 41)) || ((idx[l + 20] >= 8) && (idx[l + 20] < 41)) || ((idx[l + 21] >= 8) && (idx[l + 21] < 41)))
                                    digger_death = true;
                                // Geist zu Staub
                                idx[l - 21] = 0.1;
                                idx[l - 20] = 0.1;
                                idx[l - 19] = 0.1;
                                idx[l - 1] = 0.1;
                                idx[l] = 0.1;
                                idx[l + 1] = 0.1;
                                idx[l + 19] = 0.1;
                                idx[l + 20] = 0.1;
                                idx[l + 21] = 0.1;
                                SFX.STONE = true;
                            }
                            //GEISTER hin und her (43-46)
                            else {
                                ti = l;
                                switch (idx[l]) {
                                    //HOCH
                                    case 45:
                                        // wenn drüber NOTHING 1
                                        if ((idx[l - 20] == 1) || (idx[l - 20] == 1.1)) {
                                            ti = l - 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 45.1; // drüber setzen
                                            if ((idx[l - 40] >= 8) && (idx[l - 40] < 41))
                                                digger_death = true;
                                        }
                                        // wenn drüber DIGGER 8-40
                                        else if ((idx[l - 20] >= 8) && (idx[l - 20] < 41))
                                            digger_death = true;
                                        // wenn drunter NOTHING 1
                                        else if ((idx[l + 20] == 1) || (idx[l + 20] == 1.1)) {
                                            ti = l + 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 43.1; // drunter setzen
                                            if ((idx[l + 40] >= 8) && (idx[l + 40] < 41))
                                                digger_death = true;
                                        }
                                        // wenn drunter DIGGER 8-40
                                        else if ((idx[l + 20] >= 8) && (idx[l + 20] < 41))
                                            digger_death = true;
                                        break;
                                    //RUNTER
                                    case 43:
                                        // wenn drunter NOTHING 1
                                        if ((idx[l + 20] == 1) || (idx[l + 20] == 1.1)) {
                                            ti = l + 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 43.1; // drunter setzen
                                            if ((idx[l + 40] >= 8) && (idx[l + 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 20] >= 8) && (idx[l + 20] < 41))
                                            digger_death = true;
                                        else if ((idx[l - 20] == 1) || (idx[l - 20] == 1.1)) { // wenn drüber frei
                                            ti = l - 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 45.1; // drüber setzen
                                            if ((idx[l - 40] >= 8) && (idx[l - 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 20] >= 8) && (idx[l - 20] < 41))
                                            digger_death = true;
                                        break;
                                    //RECHTS
                                    case 44:
                                        if ((idx[l + 1] == 1) || (idx[l + 1] == 1.1)) { // wenn rechts frei
                                            ti = l + 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 44.1; // rechts setzen
                                            if ((idx[l + 2] >= 8) && (idx[l + 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 1] >= 8) && (idx[l + 1] < 41))
                                            digger_death = true;
                                        else if ((idx[l - 1] == 1) || (idx[l - 1] == 1.1)) { // wenn links frei
                                            ti = l - 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 46.1; // links setzen
                                            if ((idx[l - 2] >= 8) && (idx[l - 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 1] >= 8) && (idx[l - 1] < 41))
                                            digger_death = true;
                                        break;
                                    //LINKS
                                    case 46:
                                        if ((idx[l - 1] == 1) || (idx[l - 1] == 1.1)) { // wenn links frei
                                            ti = l - 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 46.1; // links setzen
                                            if ((idx[l - 2] >= 8) && (idx[l - 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 1] >= 8) && (idx[l - 1] < 41))
                                            digger_death = true;
                                        else if ((idx[l + 1] == 1) || (idx[l + 1] == 1.1)) { // wenn rechts frei
                                            ti = l + 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 44.1; // rechts setzen
                                            if ((idx[l + 2] >= 8) && (idx[l + 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 1] >= 8) && (idx[l + 1] < 41))
                                            digger_death = true;
                                        break;
                                }
                            }

                            //Geist toeten, wenn unter fallenden (.2) aber nicht bewegten (.1) Stein/Diamant
                            //- bewegter Stein/Diamant: 3.2/7.2
                            //- zu toetender Geist: n + 0.2
                            if ((idx[ti - 20] == 3.2) || (idx[ti - 20] == 7.2))
                                idx[ti] = ((idx[ti]) << 0) + 0.2;

                        }

                        // GEISTER 90L (47-50)
                        else if ((idx[l] >= 47) && (idx[l] < 51)) {
                            // Zum sterben markierte Geister(nn.2)?
                            if ((idx[l] == 47.2) || (idx[l] == 48.2) || (idx[l] == 49.2) || (idx[l] == 50.2)) {
                                // Wenn Digger in Explosionsnaehe, dann ihn auch killen!
                                if (((idx[l - 21] >= 8) && (idx[l - 21] < 41)) || ((idx[l - 20] >= 8) && (idx[l - 20] < 41)) || ((idx[l - 19] >= 8) && (idx[l - 19] < 41)) || ((idx[l - 1] >= 8) && (idx[l - 1] < 41)) || ((idx[l + 1] >= 8) && (idx[l + 1] < 41)) || ((idx[l + 19] >= 8) && (idx[l + 19] < 41)) || ((idx[l + 20] >= 8) && (idx[l + 20] < 41)) || ((idx[l + 21] >= 8) && (idx[l + 21] < 41)))
                                    digger_death = true;
                                // Geist zu Staub
                                idx[l - 21] = 0.1;
                                idx[l - 20] = 0.1;
                                idx[l - 19] = 0.1;
                                idx[l - 1] = 0.1;
                                idx[l] = 0.1;
                                idx[l + 1] = 0.1;
                                idx[l + 19] = 0.1;
                                idx[l + 20] = 0.1;
                                idx[l + 21] = 0.1;
                                SFX.STONE = true;
                            }
                            //Geister bewegen: 47=down,  49=up,  48=right,  50=left 90L
                            else {
                                ti = l;
                                switch (idx[l]) {
                                    //HOCH up left right down
                                    case 49:
                                        if ((idx[l - 20] == 1) || (idx[l - 20] == 1.1)) { // wenn drüber frei
                                            ti = l - 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 49.1; // drüber setzen
                                            if ((idx[l - 40] >= 8) && (idx[l - 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 20] >= 8) && (idx[l - 20] < 41))
                                            digger_death = true;
                                        else if ((idx[l - 1] == 1) || (idx[l - 1] == 1.1)) { // wenn links frei
                                            ti = l - 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 50.1; // links setzen
                                            if ((idx[l - 2] >= 8) && (idx[l - 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 1] >= 8) && (idx[l - 1] < 41))
                                            digger_death = true;
                                        else if ((idx[l + 1] == 1) || (idx[l + 1] == 1.1)) { // wenn rechts frei
                                            ti = l + 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 48.1; // rechts setzen
                                            if ((idx[l + 2] >= 8) && (idx[l + 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 1] >= 8) && (idx[l + 1] < 41))
                                            digger_death = true;
                                        else if ((idx[l + 20] == 1) || (idx[l + 20] == 1.1)) { // wenn drunter frei
                                            ti = l + 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 47.1; // drunter setzen
                                            if ((idx[l + 40] >= 8) && (idx[l + 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 20] >= 8) && (idx[l + 20] < 41))
                                            digger_death = true;
                                        break;
                                    //RUNTER down right left up
                                    case 47:
                                        if ((idx[l + 20] == 1) || (idx[l + 20] == 1.1)) { // wenn drunter frei
                                            ti = l + 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 47.1; // drunter setzen
                                            if ((idx[l + 40] >= 8) && (idx[l + 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 20] >= 8) && (idx[l + 20] < 41))
                                            digger_death = true;
                                        else if ((idx[l + 1] == 1) || (idx[l + 1] == 1.1)) { // wenn rechts frei
                                            ti = l + 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 48.1; // rechts setzen
                                            if ((idx[l + 2] >= 8) && (idx[l + 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 1] >= 8) && (idx[l + 1] < 41))
                                            digger_death = true;
                                        else if ((idx[l - 1] == 1) || (idx[l - 1] == 1.1)) { // wenn links frei
                                            ti = l - 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 50.1; // links setzen
                                            if ((idx[l - 2] >= 8) && (idx[l - 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 1] >= 8) && (idx[l - 1] < 41))
                                            digger_death = true;
                                        else if ((idx[l - 20] == 1) || (idx[l - 20] == 1.1)) { // wenn drüber frei
                                            ti = l - 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 49.1; // drüber setzen
                                            if ((idx[l - 40] >= 8) && (idx[l - 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 20] >= 8) && (idx[l - 20] < 41))
                                            digger_death = true;
                                        break;
                                    //RECHTS right up down left
                                    case 48:
                                        if ((idx[l + 1] == 1) || (idx[l + 1] == 1.1)) { // wenn rechts frei
                                            ti = l + 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 48.1; // rechts setzen
                                            if ((idx[l + 2] >= 8) && (idx[l + 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 1] >= 8) && (idx[l + 1] < 41))
                                            digger_death = true;
                                        else if ((idx[l - 20] == 1) || (idx[l - 20] == 1.1)) { // wenn drüber frei
                                            ti = l - 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 49.1; // drüber setzen
                                            if ((idx[l - 40] >= 8) && (idx[l - 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 20] >= 8) && (idx[l - 20] < 41))
                                            digger_death = true;
                                        else if ((idx[l + 20] == 1) || (idx[l + 20] == 1.1)) { // wenn drunter frei
                                            ti = l + 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 47.1; // drunter setzen
                                            if ((idx[l + 40] >= 8) && (idx[l + 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 20] >= 8) && (idx[l + 20] < 41))
                                            digger_death = true;
                                        else if ((idx[l - 1] == 1) || (idx[l - 1] == 1.1)) { // wenn links frei
                                            ti = l - 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 50.1; // links setzen
                                            if ((idx[l - 2] >= 8) && (idx[l - 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 1] >= 8) && (idx[l - 1] < 41))
                                            digger_death = true;
                                        break;
                                    //LINKS left down up right
                                    case 50:
                                        if ((idx[l - 1] == 1) || (idx[l - 1] == 1.1)) { // wenn links frei
                                            ti = l - 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 50.1; // links setzen
                                            if ((idx[l - 2] >= 8) && (idx[l - 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 1] >= 8) && (idx[l - 1] < 41))
                                            digger_death = true;
                                        else if ((idx[l + 20] == 1) || (idx[l + 20] == 1.1)) { // wenn drunter frei
                                            ti = l + 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 47.1; // drunter setzen
                                            if ((idx[l + 40] >= 8) && (idx[l + 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 20] >= 8) && (idx[l + 20] < 41))
                                            digger_death = true;
                                        else if ((idx[l - 20] == 1) || (idx[l - 20] == 1.1)) { // wenn drüber frei
                                            ti = l - 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 49.1; // drüber setzen
                                            if ((idx[l - 40] >= 8) && (idx[l - 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 20] >= 8) && (idx[l - 20] < 41))
                                            digger_death = true;
                                        else if ((idx[l + 1] == 1) || (idx[l + 1] == 1.1)) { // wenn rechts frei
                                            ti = l + 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 48.1; // rechts setzen
                                            if ((idx[l + 2] >= 8) && (idx[l + 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 1] >= 8) && (idx[l + 1] < 41))
                                            digger_death = true;
                                        break;
                                }
                            }

                            //Geist toeten, wenn unter fallenden (.2) aber nicht bewegten (.1) Stein/Diamant
                            //- bewegter Stein/Diamant: 3.2/7.2
                            //- zu toetender Geist: n + 0.2
                            if ((idx[ti - 20] == 3.2) || (idx[ti - 20] == 7.2))
                                idx[ti] = ((idx[ti]) << 0) + 0.2;

                        }

                        // GEISTER 90R (51-54)
                        else if ((idx[l] >= 51) && (idx[l] < 55)) {
                            // Zum sterben markierte Geister(nn.2)?
                            if ((idx[l] == 51.2) || (idx[l] == 52.2) || (idx[l] == 53.2) || (idx[l] == 54.2)) {
                                // Wenn Digger in Explosionsnaehe, dann ihn auch killen!
                                if (((idx[l - 21] >= 8) && (idx[l - 21] < 41)) || ((idx[l - 20] >= 8) && (idx[l - 20] < 41)) || ((idx[l - 19] >= 8) && (idx[l - 19] < 41)) || ((idx[l - 1] >= 8) && (idx[l - 1] < 41)) || ((idx[l + 1] >= 8) && (idx[l + 1] < 41)) || ((idx[l + 19] >= 8) && (idx[l + 19] < 41)) || ((idx[l + 20] >= 8) && (idx[l + 20] < 41)) || ((idx[l + 21] >= 8) && (idx[l + 21] < 41)))
                                    digger_death = true;
                                // Geist zu Staub
                                idx[l - 21] = 0.1;
                                idx[l - 20] = 0.1;
                                idx[l - 19] = 0.1;
                                idx[l - 1] = 0.1;
                                idx[l] = 0.1;
                                idx[l + 1] = 0.1;
                                idx[l + 19] = 0.1;
                                idx[l + 20] = 0.1;
                                idx[l + 21] = 0.1;
                                SFX.STONE = true;
                            }
                            //Geister bewegen: 51=down,  53=up,  52=right,  54=left 90R
                            else {
                                ti = l;
                                switch (idx[l]) {
                                    //HOCH up right left down
                                    case 53:
                                        if ((idx[l - 20] == 1) || (idx[l - 20] == 1.1)) { // wenn drüber frei
                                            ti = l - 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 53.1; // drüber setzen
                                            if ((idx[l - 40] >= 8) && (idx[l - 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 20] >= 8) && (idx[l - 20] < 41))
                                            digger_death = true;
                                        else if ((idx[l + 1] == 1) || (idx[l + 1] == 1.1)) { // wenn rechts frei
                                            ti = l + 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 52.1; // rechts setzen
                                            if ((idx[l + 2] >= 8) && (idx[l + 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 1] >= 8) && (idx[l + 1] < 41))
                                            digger_death = true;
                                        else if ((idx[l - 1] == 1) || (idx[l - 1] == 1.1)) { // wenn links frei
                                            ti = l - 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 54.1; // links setzen
                                            if ((idx[l - 2] >= 8) && (idx[l - 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 1] >= 8) && (idx[l - 1] < 41))
                                            digger_death = true;
                                        else if ((idx[l + 20] == 1) || (idx[l + 20] == 1.1)) { // wenn drunter frei
                                            ti = l + 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 51.1; // drunter setzen
                                            if ((idx[l + 40] >= 8) && (idx[l + 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 20] >= 8) && (idx[l + 20] < 41))
                                            digger_death = true;
                                        break;
                                    //RUNTER down left right up
                                    case 51:
                                        if ((idx[l + 20] == 1) || (idx[l + 20] == 1.1)) { // wenn drunter frei
                                            ti = l + 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 51.1; // drunter setzen
                                            if ((idx[l + 40] >= 8) && (idx[l + 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 20] >= 8) && (idx[l + 20] < 41))
                                            digger_death = true;
                                        else if ((idx[l - 1] == 1) || (idx[l - 1] == 1.1)) { // wenn links frei
                                            ti = l - 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 54.1; // links setzen
                                            if ((idx[l - 2] >= 8) && (idx[l - 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 1] >= 8) && (idx[l - 1] < 41))
                                            digger_death = true;
                                        else if ((idx[l + 1] == 1) || (idx[l + 1] == 1.1)) { // wenn rechts frei
                                            ti = l + 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 52.1; // rechts setzen
                                            if ((idx[l + 2] >= 8) && (idx[l + 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 1] >= 8) && (idx[l + 1] < 41))
                                            digger_death = true;
                                        else if ((idx[l - 20] == 1) || (idx[l - 20] == 1.1)) { // wenn drüber frei
                                            ti = l - 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 53.1; // drüber setzen
                                            if ((idx[l - 40] >= 8) && (idx[l - 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 20] >= 8) && (idx[l - 20] < 41))
                                            digger_death = true;
                                        break;
                                    //RECHTS right down up left
                                    case 52:
                                        if ((idx[l + 1] == 1) || (idx[l + 1] == 1.1)) { // wenn rechts frei
                                            ti = l + 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 52.1; // rechts setzen
                                            if ((idx[l + 2] >= 8) && (idx[l + 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 1] >= 8) && (idx[l + 1] < 41))
                                            digger_death = true;
                                        else if ((idx[l + 20] == 1) || (idx[l + 20] == 1.1)) { // wenn drunter frei
                                            ti = l + 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 51.1; // drunter setzen
                                            if ((idx[l + 40] >= 8) && (idx[l + 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 20] >= 8) && (idx[l + 20] < 41))
                                            digger_death = true;
                                        else if ((idx[l - 20] == 1) || (idx[l - 20] == 1.1)) { // wenn drüber frei
                                            ti = l - 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 53.1; // drüber setzen
                                            if ((idx[l - 40] >= 8) && (idx[l - 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 20] >= 8) && (idx[l - 20] < 41))
                                            digger_death = true;
                                        else if ((idx[l - 1] == 1) || (idx[l - 1] == 1.1)) { // wenn links frei
                                            ti = l - 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 54.1; // links setzen
                                            if ((idx[l - 2] >= 8) && (idx[l - 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 1] >= 8) && (idx[l - 1] < 41))
                                            digger_death = true;
                                        break;
                                    //LINKS left up down right
                                    case 54:
                                        if ((idx[l - 1] == 1) || (idx[l - 1] == 1.1)) { // wenn links frei
                                            ti = l - 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 54.1; // links setzen
                                            if ((idx[l - 2] >= 8) && (idx[l - 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 1] >= 8) && (idx[l - 1] < 41))
                                            digger_death = true;
                                        else if ((idx[l - 20] == 1) || (idx[l - 20] == 1.1)) { // wenn drüber frei
                                            ti = l - 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 53.1; // drüber setzen
                                            if ((idx[l - 40] >= 8) && (idx[l - 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 20] >= 8) && (idx[l - 20] < 41))
                                            digger_death = true;
                                        else if ((idx[l + 20] == 1) || (idx[l + 20] == 1.1)) { // wenn drunter frei
                                            ti = l + 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 51.1; // drunter setzen
                                            if ((idx[l + 40] >= 8) && (idx[l + 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 20] >= 8) && (idx[l + 20] < 41))
                                            digger_death = true;
                                        else if ((idx[l + 1] == 1) || (idx[l + 1] == 1.1)) { // wenn rechts frei
                                            ti = l + 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 52.1; // rechts setzen
                                            if ((idx[l + 2] >= 8) && (idx[l + 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 1] >= 8) && (idx[l + 1] < 41))
                                            digger_death = true;
                                        break;
                                }
                            }

                            //Geist toeten, wenn unter fallenden (.2) aber nicht bewegten (.1) Stein/Diamant
                            //- bewegter Stein/Diamant: 3.2/7.2
                            //- zu toetender Geist: n + 0.2
                            if ((idx[ti - 20] == 3.2) || (idx[ti - 20] == 7.2))
                                idx[ti] = ((idx[ti]) << 0) + 0.2;

                        }

                        // GEISTER 90LR (55-58)
                        else if ((idx[l] >= 55) && (idx[l] < 59)) {
                            // Zum sterben markierte Geister(nn.2)?
                            if ((idx[l] == 55.2) || (idx[l] == 56.2) || (idx[l] == 57.2) || (idx[l] == 58.2)) {
                                // Wenn Digger in Explosionsnaehe, dann ihn auch killen!
                                if (((idx[l - 21] >= 8) && (idx[l - 21] < 41)) || ((idx[l - 20] >= 8) && (idx[l - 20] < 41)) || ((idx[l - 19] >= 8) && (idx[l - 19] < 41)) || ((idx[l - 1] >= 8) && (idx[l - 1] < 41)) || ((idx[l + 1] >= 8) && (idx[l + 1] < 41)) || ((idx[l + 19] >= 8) && (idx[l + 19] < 41)) || ((idx[l + 20] >= 8) && (idx[l + 20] < 41)) || ((idx[l + 21] >= 8) && (idx[l + 21] < 41)))
                                    digger_death = true;
                                // Geist zu Staub
                                idx[l - 21] = 0.1;
                                idx[l - 20] = 0.1;
                                idx[l - 19] = 0.1;
                                idx[l - 1] = 0.1;
                                idx[l] = 0.1;
                                idx[l + 1] = 0.1;
                                idx[l + 19] = 0.1;
                                idx[l + 20] = 0.1;
                                idx[l + 21] = 0.1;
                                SFX.STONE = true;
                            }
                            //Geister bewegen: 55=down,  57=up,  56=right,  58=left 90LR
                            else {
                                ti = l;
                                switch (idx[l]) {
                                    //HOCH up left right down
                                    case 57:
                                        if ((idx[l - 20] == 1) || (idx[l - 20] == 1.1)) { // wenn drüber frei
                                            ti = l - 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 57.1; // drüber setzen
                                            if ((idx[l - 40] >= 8) && (idx[l - 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 20] >= 8) && (idx[l - 20] < 41))
                                            digger_death = true;
                                        else if ((idx[l - 1] == 1) || (idx[l - 1] == 1.1)) { // wenn links frei
                                            ti = l - 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 62.1; // links setzen -> 90RL
                                            if ((idx[l - 2] >= 8) && (idx[l - 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 1] >= 8) && (idx[l - 1] < 41))
                                            digger_death = true;
                                        else if ((idx[l + 1] == 1) || (idx[l + 1] == 1.1)) { // wenn rechts frei
                                            ti = l + 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 60.1; // rechts setzen -> 90RL
                                            if ((idx[l + 2] >= 8) && (idx[l + 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 1] >= 8) && (idx[l + 1] < 41))
                                            digger_death = true;
                                        else if ((idx[l + 20] == 1) || (idx[l + 20] == 1.1)) { // wenn drunter frei
                                            ti = l + 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 55.1; // drunter setzen
                                            if ((idx[l + 40] >= 8) && (idx[l + 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 20] >= 8) && (idx[l + 20] < 41))
                                            digger_death = true;
                                        break;
                                    //RUNTER down right left up
                                    case 55:
                                        if ((idx[l + 20] == 1) || (idx[l + 20] == 1.1)) { // wenn drunter frei
                                            ti = l + 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 55.1; // drunter setzen
                                            if ((idx[l + 40] >= 8) && (idx[l + 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 20] >= 8) && (idx[l + 20] < 41))
                                            digger_death = true;
                                        else if ((idx[l + 1] == 1) || (idx[l + 1] == 1.1)) { // wenn rechts frei
                                            ti = l + 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 60.1; // rechts setzen -> 90RL
                                            if ((idx[l + 2] >= 8) && (idx[l + 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 1] >= 8) && (idx[l + 1] < 41))
                                            digger_death = true;
                                        else if ((idx[l - 1] == 1) || (idx[l - 1] == 1.1)) { // wenn links frei
                                            ti = l - 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 62.1; // links setzen -> 90RL
                                            if ((idx[l - 2] >= 8) && (idx[l - 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 1] >= 8) && (idx[l - 1] < 41))
                                            digger_death = true;
                                        else if ((idx[l - 20] == 1) || (idx[l - 20] == 1.1)) { // wenn drüber frei
                                            ti = l - 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 57.1; // drüber setzen
                                            if ((idx[l - 40] >= 8) && (idx[l - 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 20] >= 8) && (idx[l - 20] < 41))
                                            digger_death = true;
                                        break;
                                    //RECHTS right up down left
                                    case 56:
                                        if ((idx[l + 1] == 1) || (idx[l + 1] == 1.1)) { // wenn rechts frei
                                            ti = l + 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 56.1; // rechts setzen
                                            if ((idx[l + 2] >= 8) && (idx[l + 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 1] >= 8) && (idx[l + 1] < 41))
                                            digger_death = true;
                                        else if ((idx[l - 20] == 1) || (idx[l - 20] == 1.1)) { // wenn drüber frei
                                            ti = l - 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 61.1; // drüber setzen -> 90RL
                                            if ((idx[l - 40] >= 8) && (idx[l - 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 20] >= 8) && (idx[l - 20] < 41))
                                            digger_death = true;
                                        else if ((idx[l + 20] == 1) || (idx[l + 20] == 1.1)) { // wenn drunter frei
                                            ti = l + 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 59.1; // drunter setzen -> 90RL
                                            if ((idx[l + 40] >= 8) && (idx[l + 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 20] >= 8) && (idx[l + 20] < 41))
                                            digger_death = true;
                                        else if ((idx[l - 1] == 1) || (idx[l - 1] == 1.1)) { // wenn links frei
                                            ti = l - 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 58.1; // links setzen
                                            if ((idx[l - 2] >= 8) && (idx[l - 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 1] >= 8) && (idx[l - 1] < 41))
                                            digger_death = true;
                                        break;
                                    //LINKS left down up right
                                    case 58:
                                        if ((idx[l - 1] == 1) || (idx[l - 1] == 1.1)) { // wenn links frei
                                            ti = l - 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 58.1; // links setzen
                                            if ((idx[l - 2] >= 8) && (idx[l - 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 1] >= 8) && (idx[l - 1] < 41))
                                            digger_death = true;
                                        else if ((idx[l + 20] == 1) || (idx[l + 20] == 1.1)) { // wenn drunter frei
                                            ti = l + 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 59.1; // drunter setzen 90RL
                                            if ((idx[l + 40] >= 8) && (idx[l + 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 20] >= 8) && (idx[l + 20] < 41))
                                            digger_death = true;
                                        else if ((idx[l - 20] == 1) || (idx[l - 20] == 1.1)) { // wenn drüber frei
                                            ti = l - 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 61.1; // drüber setzen -> 90RL
                                            if ((idx[l - 40] >= 8) && (idx[l - 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 20] >= 8) && (idx[l - 20] < 41))
                                            digger_death = true;
                                        else if ((idx[l + 1] == 1) || (idx[l + 1] == 1.1)) { // wenn rechts frei
                                            ti = l + 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 56.1; // rechts setzen
                                            if ((idx[l + 2] >= 8) && (idx[l + 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 1] >= 8) && (idx[l + 1] < 41))
                                            digger_death = true;
                                        break;
                                }
                            }

                            //Geist toeten, wenn unter fallenden (.2) aber nicht bewegten (.1) Stein/Diamant
                            //- bewegter Stein/Diamant: 3.2/7.2
                            //- zu toetender Geist: n + 0.2
                            if ((idx[ti - 20] == 3.2) || (idx[ti - 20] == 7.2))
                                idx[ti] = ((idx[ti]) << 0) + 0.2;

                        }

                        // GEISTER 90RL (59-62)
                        else if ((idx[l] >= 59) && (idx[l] < 63)) {
                            // Zum sterben markierte Geister(nn.2)?
                            if ((idx[l] == 59.2) || (idx[l] == 60.2) || (idx[l] == 61.2) || (idx[l] == 62.2)) {
                                // Wenn Digger in Explosionsnaehe, dann ihn auch killen!
                                if (((idx[l - 21] >= 8) && (idx[l - 21] < 41)) || ((idx[l - 20] >= 8) && (idx[l - 20] < 41)) || ((idx[l - 19] >= 8) && (idx[l - 19] < 41)) || ((idx[l - 1] >= 8) && (idx[l - 1] < 41)) || ((idx[l + 1] >= 8) && (idx[l + 1] < 41)) || ((idx[l + 19] >= 8) && (idx[l + 19] < 41)) || ((idx[l + 20] >= 8) && (idx[l + 20] < 41)) || ((idx[l + 21] >= 8) && (idx[l + 21] < 41)))
                                    digger_death = true;
                                // Geist zu Staub
                                idx[l - 21] = 0.1;
                                idx[l - 20] = 0.1;
                                idx[l - 19] = 0.1;
                                idx[l - 1] = 0.1;
                                idx[l] = 0.1;
                                idx[l + 1] = 0.1;
                                idx[l + 19] = 0.1;
                                idx[l + 20] = 0.1;
                                idx[l + 21] = 0.1;
                                SFX.STONE = true;
                            }
                            //Geister bewegen: 59=down,  61=up,  60=right,  62=left 90RL
                            else {
                                ti = l;
                                switch (idx[l]) {
                                    //HOCH up right left down
                                    case 61:
                                        if ((idx[l - 20] == 1) || (idx[l - 20] == 1.1)) { // wenn drüber frei
                                            ti = l - 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 61.1; // drüber setzen
                                            if ((idx[l - 40] >= 8) && (idx[l - 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 20] >= 8) && (idx[l - 20] < 41))
                                            digger_death = true;
                                        else if ((idx[l + 1] == 1) || (idx[l + 1] == 1.1)) { // wenn rechts frei
                                            ti = l + 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 56.1; // rechts setzen -> 90LR
                                            if ((idx[l + 2] >= 8) && (idx[l + 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 1] >= 8) && (idx[l + 1] < 41))
                                            digger_death = true;
                                        else if ((idx[l - 1] == 1) || (idx[l - 1] == 1.1)) { // wenn links frei
                                            ti = l - 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 58.1; // links setzen -> 90LR
                                            if ((idx[l - 2] >= 8) && (idx[l - 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 1] >= 8) && (idx[l - 1] < 41))
                                            digger_death = true;
                                        else if ((idx[l + 20] == 1) || (idx[l + 20] == 1.1)) { // wenn drunter frei
                                            ti = l + 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 59.1; // drunter setzen
                                            if ((idx[l + 40] >= 8) && (idx[l + 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 20] >= 8) && (idx[l + 20] < 41))
                                            digger_death = true;
                                        break;
                                    //RUNTER down left right up
                                    case 59:
                                        if ((idx[l + 20] == 1) || (idx[l + 20] == 1.1)) { // wenn drunter frei
                                            ti = l + 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 59.1; // drunter setzen
                                            if ((idx[l + 40] >= 8) && (idx[l + 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 20] >= 8) && (idx[l + 20] < 41))
                                            digger_death = true;
                                        else if ((idx[l - 1] == 1) || (idx[l - 1] == 1.1)) { // wenn links frei
                                            ti = l - 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 58.1; // links setzen 90LR
                                            if ((idx[l - 2] >= 8) && (idx[l - 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 1] >= 8) && (idx[l - 1] < 41))
                                            digger_death = true;
                                        else if ((idx[l + 1] == 1) || (idx[l + 1] == 1.1)) { // wenn rechts frei
                                            ti = l + 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 56.1; // rechts setzen -> 90LR
                                            if ((idx[l + 2] >= 8) && (idx[l + 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 1] >= 8) && (idx[l + 1] < 41))
                                            digger_death = true;
                                        else if ((idx[l - 20] == 1) || (idx[l - 20] == 1.1)) { // wenn drüber frei
                                            ti = l - 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 61.1; // drüber setzen
                                            if ((idx[l - 40] >= 8) && (idx[l - 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 20] >= 8) && (idx[l - 20] < 41))
                                            digger_death = true;
                                        break;
                                    //RECHTS right down up left
                                    case 60:
                                        if ((idx[l + 1] == 1) || (idx[l + 1] == 1.1)) { // wenn rechts frei
                                            ti = l + 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 60.1; // rechts setzen
                                            if ((idx[l + 2] >= 8) && (idx[l + 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 1] >= 8) && (idx[l + 1] < 41))
                                            digger_death = true;
                                        else if ((idx[l + 20] == 1) || (idx[l + 20] == 1.1)) { // wenn drunter frei
                                            ti = l + 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 55.1; // drunter setzen 90LR
                                            if ((idx[l + 40] >= 8) && (idx[l + 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 20] >= 8) && (idx[l + 20] < 41))
                                            digger_death = true;
                                        else if ((idx[l - 20] == 1) || (idx[l - 20] == 1.1)) { // wenn drüber frei
                                            ti = l - 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 57.1; // drüber setzen 90LR
                                            if ((idx[l - 40] >= 8) && (idx[l - 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 20] >= 8) && (idx[l - 20] < 41))
                                            digger_death = true;
                                        else if ((idx[l - 1] == 1) || (idx[l - 1] == 1.1)) { // wenn links frei
                                            ti = l - 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 62.1; // links setzen
                                            if ((idx[l - 2] >= 8) && (idx[l - 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 1] >= 8) && (idx[l - 1] < 41))
                                            digger_death = true;
                                        break;
                                    //LINKS left up down right
                                    case 62:
                                        if ((idx[l - 1] == 1) || (idx[l - 1] == 1.1)) { // wenn links frei
                                            ti = l - 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 62.1; // links setzen
                                            if ((idx[l - 2] >= 8) && (idx[l - 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 1] >= 8) && (idx[l - 1] < 41))
                                            digger_death = true;
                                        else if ((idx[l - 20] == 1) || (idx[l - 20] == 1.1)) { // wenn drüber frei
                                            ti = l - 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 57.1; // drüber setzen 90LR
                                            if ((idx[l - 40] >= 8) && (idx[l - 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l - 20] >= 8) && (idx[l - 20] < 41))
                                            digger_death = true;
                                        else if ((idx[l + 20] == 1) || (idx[l + 20] == 1.1)) { // wenn drunter frei
                                            ti = l + 20;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 55.1; // drunter setzen 90LR
                                            if ((idx[l + 40] >= 8) && (idx[l + 40] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 20] >= 8) && (idx[l + 20] < 41))
                                            digger_death = true;
                                        else if ((idx[l + 1] == 1) || (idx[l + 1] == 1.1)) { // wenn rechts frei
                                            ti = l + 1;
                                            idx[l] = 1.1; // lokal löschen
                                            idx[ti] = 60.1; // rechts setzen
                                            if ((idx[l + 2] >= 8) && (idx[l + 2] < 41))
                                                digger_death = true;
                                        } else if ((idx[l + 1] >= 8) && (idx[l + 1] < 41))
                                            digger_death = true;
                                        break;
                                }
                            }

                            //Geist toeten, wenn unter fallenden (.2) aber nicht bewegten (.1) Stein/Diamant
                            //- bewegter Stein/Diamant: 3.2/7.2
                            //- zu toetender Geist: n + 0.2
                            if ((idx[ti - 20] == 3.2) || (idx[ti - 20] == 7.2))
                                idx[ti] = ((idx[ti]) << 0) + 0.2;

                        }

                        // Steine und Diamanten
                        else if ((idx[l] == 7) || (idx[l] == 3)) {
                            //Stein in Diamant umwandeln
                            if ((idx[l] == 7) && (idx[l + 20] == 5) && (idx[l + 40] == 1)) {
                                idx[l + 40] = 3.2;
                                idx[l] = 1.1;
                                // trifft er auf einen Gegenstand?
                                if (idx[l + 60] > 1) {
                                    // Ja: Sound abspielen!
                                    SFX.STONE = true;
                                    // Digger: KILLEN!
                                    if ((idx[l + 60] >= 8) && (idx[l + 60] < 41))
                                        digger_death = true;
                                    // Geist: KILLEN!
                                    else if ((idx[l + 60] >= 43) && (idx[l + 60] < 63))
                                        idx[l + 60] = ((idx[l + 60]) << 0) + 0.2;
                                }
                            }

                            //Stein oder Diamant fallen
                            else if ((idx[l] == 7) || (idx[l] == 3)) {
                                // ? Drunter: frei
                                if (idx[l + 20] == 1) {
                                    idx[l + 20] = idx[l] + 0.2;
                                    idx[l] = 1.1;
                                    // trifft er auf einen Gegenstand
                                    if (idx[l + 40] >= 2) {
                                        //Ja: Sound abspielen
                                        SFX.STONE = true;
                                        // Digger KILLEN
                                        if ((idx[l + 40] >= 8) && (idx[l + 40] < 41))
                                            digger_death = true;
                                        // Geist KILLEN
                                        else if ((idx[l + 40] >= 43) && (idx[l + 40] < 63))
                                            idx[l + 40] = ((idx[l + 40]) << 0) + 0.2;
                                    }
                                }
                                // ? Drunter: Stein(7), Diamant(3) oder toter Digger(63)
                                else if ((idx[l + 20] == 7) || (idx[l + 20] == 3) || (idx[l + 20] == 63)) {
                                    //links plumpsen!
                                    if (((idx[l - 1] == 1) || (idx[l - 1] == 7.2) || (idx[l - 1] == 3.2)) && (idx[l + 19] == 1)) {
                                        idx[l + 19] = idx[l] + 0.2;
                                        idx[l] = 1 + (idx[l] / 10);
                                        // trifft er auf einen Gegenstand
                                        if (idx[l + 39] >= 2) {
                                            //Ja: Sound abspielen
                                            SFX.STONE = true;
                                            // Digger KILLEN
                                            if ((idx[l + 39] >= 8) && (idx[l + 39] < 41))
                                                digger_death = true;
                                            // Geist KILLEN
                                            else if ((idx[l + 39] >= 43) && (idx[l + 39] < 63))
                                                idx[l + 39] = ((idx[l + 39]) << 0) + 0.2;
                                        }
                                    }
                                    //rechts plumpsen!
                                    else if (((idx[l + 1] == 1) || (idx[l + 1] == 7.2) || (idx[l + 1] == 3.2)) && (idx[l + 21] == 1)) {
                                        idx[l + 21] = idx[l] + 0.2;
                                        idx[l] = 1 + (idx[l] / 10);
                                        // trifft er auf einen Gegenstand
                                        if (idx[l + 41] >= 2) {
                                            //Ja: Sound abspielen
                                            SFX.STONE = true;
                                            // Digger KILLEN
                                            if ((idx[l + 41] >= 8) && (idx[l + 41] < 41))
                                                digger_death = true;
                                            // Geist KILLEN
                                            else if ((idx[l + 41] >= 43) && (idx[l + 41] < 63))
                                                idx[l + 41] = ((idx[l + 41]) << 0) + 0.2;
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
                        state = 'highscore';
                        highscoreDraw();
                        score_raum = 1;
                        score_leben = LEBENMAX;
                        score_punkte = 0;
                    } else {
                        score_raum++;
                        state = 'init';
                        init_room(score_raum);
                    }
                    next_raum = false;
                    storageGameSave();
                }

                //Statuszeile und
                //Softscroller aktualisieren
                scorelineUpdate();
                soft_scroll();

                //Ton abspielen
                if (SFX.DIAMOND) {
                    playAudio('Diamond');
                } else if (SFX.STONE) {
                    playAudio('Stone');
                    brumm = true;
                } else if (SFX.STEP) {
                    playAudio('Step');
                }
                SFX.DIAMOND = false;
                SFX.STEP = false;
                SFX.STONE = false;

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
                    storageGameSave();
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

    setTimeout(draw_frame, FPS);

}

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

    //Bildschirm und Buffer neu skalieren
    window.addEventListener("resize", scaleReload, false);
}


//Bildschirm und Buffer neu skalieren
scaleReload();

//Gameloop
draw_frame();
init_events();
