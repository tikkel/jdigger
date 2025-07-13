// SPDX-License-Identifier: GPL-3.0
// jdigger/jdigger.js === KC85-DIGGER ===
// Copyright (C) 2019–2025  Marko Klingner

//wenn möglich, schönen Pixelsalat zeichnen
function scalePixelated(ctx) {
    ctx.imageSmoothingEnabled = false; /* standard */
    //ctx.mozImageSmoothingEnabled = false; /* Firefox */
    ctx.oImageSmoothingEnabled = false; /* Opera */
    ctx.webkitImageSmoothingEnabled = false; /* Safari */
    ctx.msImageSmoothingEnabled = false; /* IE */
}

function scaleInit() {
  // Screen-Größe ermitteln
  body_width = window.innerWidth || document.body.offsetWidth;
  body_height = window.innerHeight || document.body.offsetHeight;
  
  console.log(`body_size: ${body_width}x${body_height}`);
  
  // Sprite-Größe ermitteln (scale) - das GRÖSSERE wird gewählt
  scale = Math.max((body_width / 20) | 0, (body_height / 15) | 0);
  
  // Container und Viewport
  diggerdiv_width = body_width;
  diggerdiv_height = body_height - scale;
  pre_icon_size = scale;
  pre_max_w_offset = -(scale * 20 - diggerdiv_width);
  pre_max_h_offset = -(scale * 14 - diggerdiv_height);
  
  // Canvas field
  field_width = scale * 20;
  field_height = scale * 14;
}

function scaleBuffer() {
  // Prüfen ob Bilder geladen sind
  if (!spritesImage.complete || !charsImage.complete) {
    setTimeout(scaleBuffer, 1000);
    return;
  }
  
  // Sprites Buffer-Canvas Setup
  buffer_spritesCanvas.width = pre_icon_size;
  buffer_spritesCanvas.height = pre_icon_size * 40;
  scalePixelated(buffer_spritesContext);
  buffer_spritesContext.drawImage(spritesImage, 0, 0, buffer_spritesCanvas.width, buffer_spritesCanvas.height);
  console.log(`buffersize sprites: ${buffer_spritesCanvas.width}x${buffer_spritesCanvas.height}`);
  
  // Chars Buffer-Canvas Setup
  buffer_charsCanvas.width = (body_width / 40) << 0;
  buffer_charsCanvas.height = pre_icon_size * 192;
  scalePixelated(buffer_charsContext);
  buffer_charsContext.fillStyle = KCB_ROT;
  buffer_charsContext.fillRect(0, 0, buffer_charsCanvas.width, buffer_charsCanvas.height);
  buffer_charsContext.drawImage(charsImage, 0, 0, buffer_charsCanvas.width, buffer_charsCanvas.height);
  console.log(`buffersize chars: ${buffer_charsCanvas.width}x${buffer_charsCanvas.height}`);
}

function scaleReload() {
  // Fullscreen wieder ermöglichen
  fullscreen_flag = false;
  
  // Scalierfaktor und Puffer aktualisieren
  scaleInit();
  scaleBuffer();
  
  // Menu refreshen
  const menudiv = document.getElementById('menudiv');
  const menuimg = document.getElementById('menuimg');
  menudiv.style.width = body_width + 'px';
  menudiv.style.height = body_height + 'px';
  menuimg.width = body_width;
  menuimg.height = body_height;
  scalePixelated(context_menuimg);
  
  if (state === 'menu') menu_draw();
  else if (state === 'highscore') highscore_draw();
  
  rd_in = rd_yn = false;
  
  // Scoreline refreshen
  const scorelinediv = document.getElementById('scorelinediv');
  const scoreline = document.getElementById('scoreline');
  scorelinediv.style.width = body_width + 'px';
  scorelinediv.style.height = scale + 'px';
  scoreline.width = body_width;
  scoreline.height = scale;
  scorelinePrewrite();
  
  // Spielfeld refreshen
  const diggerdiv = document.getElementById('diggerdiv');
  const digger = document.getElementById('digger');
  diggerdiv.style.width = body_width + 'px';
  diggerdiv.style.height = (body_height - scale) + 'px';
  diggerdiv.style.top = scale + 'px';
  digger.width = field_width;
  digger.height = field_height;
  
  // Drawflags setzen (idx[1-280])
  for (let l = 1; l < 281; l++) {
    const i = idx[l] << 0;
    if (idx[l] === i) idx[l] += 0.1;
  }
}

// Eine Zeile in den Menu-Puffer zeichnen
function menuLine(strg, x, y) {
    const dy = y * 8;
    for (let i = 0; i < strg.length; i++) {
        buffer_menuContext.drawImage(
            charsImage, 
            0, (strg.charCodeAt(i) - 32) * 8, 8, 8,
            (x + i) * 8, dy, 8, 8
        );
    }
}

// Schreibe zeilenweise die MENU-Grafik (320x240) in den Canvas-Puffer
function menu_draw() {
    if (!charsImage.complete) {
        setTimeout(menu_draw, 1000);
        return;
    }

    // Puffer mit Hintergrundfarbe füllen
    buffer_menuContext.globalCompositeOperation = "copy";
    buffer_menuContext.fillStyle = KCB_BLAU;
    buffer_menuContext.fillRect(0, 0, 320, 240);
    buffer_menuContext.globalCompositeOperation = "source-over";

    // Rahmen zeichnen
    const border = [
        "\234\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\236",
        "\237\240\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\242\237",
        "\237\243\234\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\236\251\237"
    ];
    
    border.forEach((line, i) => menuLine(line, 0, i));
    
    // Seitenrahmen
    for (let i = 3; i < 27; i++) {
        menuLine("\237\243\237", 0, i);
        menuLine("\237\251\237", 37, i);
    }

    // Spieltitel
    const title = [
        "\200\201\202\203 \210 \211\212\213\214 \211\212\213\214 \200\201\215\215 \133\215\221\222",
        "\133 \206\207 \133 \133  \215 \133  \215 \133    \133 \223\224",
        "\133  \133 \133 \133 \244\216 \133 \244\216 \133\217\220  \133\225\226\227",
        "\133 \260\261 \133 \133 \316\133 \133 \316\133 \133    \133 \230\231",
        "\252\253\254\255 \262 \263\264\265\266 \263\264\265\266 \252\253\267\267 \133 \232\233"
    ];
    
    title.forEach((line, i) => menuLine(line, 7, 6 + i));

    // Credits
    menuLine("WRITTEN BY  ALEXANDER LANG", 7, 13);
    menuLine("GRAPHIX BY  STEFAN  DAHLKE", 7, 15);
    menuLine("HUMBOLDT-UNIVERSITY     \245\246", 7, 17);
    menuLine("         BERLIN         \247\250", 7, 18);

    // Gamepad-spezifische Steuerung
    const controls = getGamepadText();
    menuLine(controls.play, 9, 20);
    menuLine(controls.rooms, 9, 22);

    // Version und Copyright
    menuLine("JSv " + DIGGER_VERSION, 5, 25);
    menuLine("\140 1988", 29, 25);
    menuLine("by TIKKEL", 5, 26);
    menuLine("BERLIN", 29, 26);

    // Unterer Rahmen
    menuLine("\237\243\306\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\310\251\237", 0, 27);
    menuLine("\237\312\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\314\237", 0, 28);
    menuLine("\306\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\310", 0, 29);

    // Canvas aktualisieren und anzeigen
    context_menuimg.drawImage(buffer_menuCanvas, 0, 0, 320, 240, 0, 0, body_width, body_height);
    document.getElementById('menudiv').style.visibility = "visible";
}

// Hilfsfunktion für Gamepad-spezifische Texte
function getGamepadText() {
    const controlMaps = {
        sony: { play: "\330: PLAY   \333: HIGHSCORE", rooms: "\332: A LOOK AT THE ROOMS" },
        xbox: { play: "\334: PLAY   \337: HIGHSCORE", rooms: "\336: A LOOK AT THE ROOMS" },
        nintendo: { play: "\334: PLAY   \337: HIGHSCORE", rooms: "\336: A LOOK AT THE ROOMS" }
    };
    
    return controlMaps[gp_brand] || 
           { play: "P: PLAY   H: HIGHSCORE", rooms: "L: A LOOK AT THE ROOMS" };
}

function highscore_draw() {
  if (!charsImage.complete) {
    setTimeout(menu_draw, 1000);
    return;
  }
  
  // Puffer mit KCB_TUERKIS füllen (copy)
  buffer_menuContext.globalCompositeOperation = "copy";
  buffer_menuContext.fillStyle = KCB_TUERKIS;
  buffer_menuContext.fillRect(0, 0, 320, 240);
  
  // KCF_WEISS aus KCB_TUERKIS ausschneiden (destination-out für Transparenz)
  buffer_menuContext.globalCompositeOperation = "destination-out";
  menuLine("HIGHSCORE :", 8, 4);
  menuLine("\217\217\217\217\217\217\217\217\217\217\217", 8, 5);
  
  // Highscore laden und 20 Zeilen zeichnen
  storageHighscoreUpdate();
  for (let i = 0; i < 20; i++) {
    menuLine(highscore[i], 10, 7 + i);
  }
  
  // Menu-Canvas mit KCF_GELB füllen, dann Puffer skaliert kopieren
  context_menuimg.globalCompositeOperation = "copy";
  context_menuimg.fillStyle = KCF_GELB;
  context_menuimg.fillRect(0, 0, body_width, body_height);
  context_menuimg.globalCompositeOperation = "source-over";
  context_menuimg.drawImage(buffer_menuCanvas, 0, 0, 320, 240, 0, 0, body_width, body_height);
  
  document.getElementById('menudiv').style.visibility = "visible";
  
  // Eventl. neuen Alias abfragen
  if (state === 'input' && digger_is_dead) setTimeout(highscoreInput, 50);
}

function highscoreInput() {
  // Eingabefeld nur einmal zeichnen
  if (!rd_in) {
    // Eingabeaufforderung ausschneiden
    buffer_menuContext.globalCompositeOperation = "destination-out";
    menuLine("...well done, please enter your name :", 1, 2);
    
    // Eingabezeile mit Cursor neu zeichnen
    buffer_menuContext.globalCompositeOperation = "source-over";
    buffer_menuContext.fillStyle = KCB_TUERKIS;
    buffer_menuContext.fillRect(17 * 8, (7 + input_line) * 8, 15 * 8, 8);
    buffer_menuContext.globalCompositeOperation = "destination-out";
    menuLine(input_alias + "\177", 17, 7 + input_line);
    
    // Puffer skaliert ins Menu-Canvas kopieren
    context_menuimg.globalCompositeOperation = "copy";
    context_menuimg.fillStyle = KCF_GELB;
    context_menuimg.fillRect(0, 0, body_width, body_height);
    context_menuimg.globalCompositeOperation = "source-over";
    context_menuimg.drawImage(buffer_menuCanvas, 0, 0, 320, 240, 0, 0, body_width, body_height);
    
    rd_in = true;
  }
  
  // Tasteneingabe verarbeiten
  if (input !== undefined) {
    if (input === 'Enter') {
      // Enter -> Eingabe abschließen
      rd_in = false;
      input = undefined;
      handled = true;
      highscore[input_line] += "  " + input_alias;
      storageHighscoreSave();
      resetGame();
      setTimeout(highscoreYesNo, 100);
      return;
    } else if (input === 'Backspace') {
      // Backspace -> letztes Zeichen löschen
      if (input_alias.length > 0) {
        input_alias = input_alias.slice(0, -1);
        rd_in = false;
      }
    } else {
      // Zeichen hinzufügen
      input_alias += input;
      rd_in = false;
      
      // Max. 14 Zeichen -> automatisch abschließen
      if (input_alias.length === 14) {
        highscore[input_line] += "  " + input_alias;
        storageHighscoreSave();
        resetGame();
        setTimeout(highscoreYesNo, 100);
        return;
      }
    }
    
    input = undefined;
    handled = true;
  }
  
  // Weiter warten auf Eingabe
  setTimeout(highscoreInput, 50);
}

function highscoreYesNo() {
    // Einmaliges Zeichnen der Y/N Abfrage
    if (!rd_yn) {
        // Y/N Abfrage anzeigen
        buffer_menuContext.globalCompositeOperation = "destination-out";
        menuLine("NEW GAME ? (Y/N)", 12, 28);

        // Eingabezeile löschen
        buffer_menuContext.globalCompositeOperation = "source-over";
        buffer_menuContext.fillStyle = KCB_TUERKIS;
        buffer_menuContext.fillRect(17 * 8, (7 + input_line) * 8, 15 * 8, 8);
        buffer_menuContext.globalCompositeOperation = "destination-out";
        menuLine(input_alias, 17, 7 + input_line);

        // Puffer ins sichtbare Canvas kopieren
        context_menuimg.globalCompositeOperation = "copy";
        context_menuimg.fillStyle = KCF_GELB;
        context_menuimg.fillRect(0, 0, body_width, body_height);
        context_menuimg.globalCompositeOperation = "source-over";
        context_menuimg.drawImage(buffer_menuCanvas, 0, 0, 320, 240, 0, 0, body_width, body_height);

        rd_yn = true;
    }

    // Eingabe verarbeiten
    const key = input?.toLowerCase();
    if (key === 'y' || key === 'n') {
        // Gemeinsame Aufräumarbeiten
        input_alias = "";
        input_line = 0;
        input = undefined;
        rd_yn = false;
        handled = true;
        
        // Virtuelle Tastatur ausblenden
        document.body.removeEventListener('click', vkb_focus, false);
        document.body.removeEventListener('input', vkb_input, false);
        virt_kbd.blur();

        if (key === 'y') {
            // Neues Spiel starten
            digger_is_dead = false;
            state = 'init';
            init_room(score_raum);
        } else {
            // Zurück zum Menü
            digger_is_dead = false;
            idle_stop();
            state = 'menu';
            menu_draw();
        }
        return;
    }

    // Weiter warten auf Y/N Eingabe
    setTimeout(highscoreYesNo, 50);
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
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                highscore = JSON.parse(c.substring(name.length, c.length));
            }
        }
    }

    //highscore[] vorbelegen
    if (highscore[0] === undefined) {
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

// Highscore-Eingabe über Tastatur (PC)
function kb_input(taste) {
    if (state === 'input') {
        input = taste.key.replace(ALLOWED_CHARS, '');
    }
}

// Highscore-Eingabe über virtuelle Tastatur (Mobile/Smart TV)
function vkb_input() {
    if (state !== 'input') return;
    
    const currentLength = virt_kbd.value.length;
    const hasNewChar = virt_kbd_last_length < currentLength;
    
    input = hasNewChar 
        ? virt_kbd.value.charAt(currentLength - 1).replace(ALLOWED_CHARS, '')
        : 'Backspace';
    
    virt_kbd_last_length = currentLength;
}

// Virtuelle Tastatur aktivieren (Mobile)
function vkb_focus() {
    exit_fullscreen();
    virt_kbd.focus();
    virt_kbd.value = "";
    virt_kbd_last_length = -1;
}

function resetGame () {
    score_punkte = 0;
    score_leben = LEBENMAX;
    score_raum = 1;
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
        if (score_leben < LEBENMIN) resetGame()
        console.log('storage_game_restore: von localStorage: Raum:' + score_raum + ' Leben:' + score_leben + ' Punkte:' + score_punkte);
    } catch (e) { //ansonsten Cookies benutzen
        var name = "level=";
        ca = document.cookie.split(';');
        for (i = 0; i < ca.length; i++) {
            c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0)
                score_raum = Number(c.substring(name.length, c.length));
        }
        name = "lives=";
        ca = document.cookie.split(';');
        for (i = 0; i < ca.length; i++) {
            c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                score_leben = Number(c.substring(name.length, c.length));
            }
        }
        name = "score=";
        ca = document.cookie.split(';');
        for (i = 0; i < ca.length; i++) {
            c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                score_punkte = Number(c.substring(name.length, c.length));
            }
        }
        if (score_leben < LEBENMIN) resetGame()
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

    //State handlers
    const handlers = {
        menu: () => {
            //Resume or Init audioContext
            try { audioContext.resume(); } catch (e) { init_audio(); }

            //Menu actions
            if (mausY === 20 && mausX >= 9 && mausX <= 15) {         // P: Play
                storage_game_restore();
                state = 'init';
                init_room(score_raum);
            } else if (mausY === 20 && mausX >= 19 && mausX <= 30) { // H: Highscore
                state = 'highscore';
                highscore_draw();
            } else if (mausY === 22 && mausX >= 9 && mausX <= 30) {  // L: Look at rooms
                state = 'look';
                storage_game_restore();
                init_room(score_raum);
            }
        },

        look: () => {
            if (score_raum < room.length) {
                score_raum++;
                init_room(score_raum);
            } else {
                state = 'menu';
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

// Fullscreen aktivieren
function fullscreen() {
    const element = document.getElementById('body');
    const methods = ['requestFullscreen', 'webkitRequestFullscreen', 'mozRequestFullScreen', 'msRequestFullscreen'];
    
    for (const method of methods) {
        if (element[method]) {
            element[method]();
            fullscreen_flag = true;
            return;
        }
    }
}

// Fullscreen beenden
function exit_fullscreen() {
    const methods = ['exitFullscreen', 'webkitExitFullscreen', 'mozCancelFullScreen', 'msExitFullscreen'];
    
    for (const method of methods) {
        if (document[method]) {
            document[method]();
            return;
        }
    }
}

// Idle-Modus starten - EXIT(41) durch Digger(8.1) ersetzen
function idle_start() {
    for (let i = 1; i < 281; i++) {
        if (idx[i] === 41) idx[i] = 8.1;
    }
    SFX.STEP = true;
    state = 'play';
}

// Zum nächsten Raum wechseln
const idle_exit = () => next_raum = true;

// Timeout stoppen
const idle_stop = () => clearTimeout(verz);

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
    if (state === 'init') {
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
    SFX.DIAMOND = true;

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
    if (state === 'look') {
        duration = 15; //sehr langsames (15) Scrollen
        if (viewport_x === 0)
            digger_x = field_width;
        else
            digger_x = 0;
        if (viewport_y === 0)
            digger_y = field_height;
        else
            digger_y = 0;
    }

    //links, Randabstand < 2 Spritebreiten?
    if (((digger_x + viewport_x) < (pre_abstand)) && (actual_marginLeft <= viewport_x) && (viewport_x !== 0)) {
        //scroll nach rechts, -x..0
        viewport_x = (diggerdiv_width / 2 - digger_x - pre_icon_size / 2) << 0;
        if (viewport_x > 0)
            viewport_x = 0;
        duration_x = Math.abs(viewport_x - actual_marginLeft) / duration / (pre_icon_size / 16);
        canvas_digger.style.transitionDuration = duration_y + "s" + ", " + duration_x + "s";
        canvas_digger.style.marginLeft = viewport_x + "px";
    }
    //rechts, Randabstand < 2 Spritebreiten?
    else if (((digger_x + pre_icon_size + viewport_x) > (diggerdiv_width - pre_abstand)) && (actual_marginLeft >= viewport_x) && (viewport_x !== pre_max_w_offset)) {
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
    if (((digger_y + viewport_y) < (pre_abstand)) && (actual_marginTop <= viewport_y) && (viewport_y !== 0)) {
        //scroll nach unten, -y..0
        viewport_y = (diggerdiv_height / 2 - digger_y - pre_icon_size / 2) << 0;
        if (viewport_y > 0)
            viewport_y = 0;
        duration_y = Math.abs(viewport_y - actual_marginTop) / duration / (pre_icon_size / 16);
        canvas_digger.style.transitionDuration = duration_y + "s" + ", " + duration_x + "s";
        canvas_digger.style.marginTop = viewport_y + "px";
    }
    //unten, Randabstand < 2 Spritehöhen
    else if (((digger_y + pre_icon_size + viewport_y) > (diggerdiv_height - pre_abstand)) && (actual_marginTop >= viewport_y) && (viewport_y !== pre_max_h_offset)) {
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
    // Style-Werte nur einmal pro Frame berechnen
    actual_marginLeft = parseInt(window.getComputedStyle(canvas_digger).marginLeft, 10);
    actual_marginTop = parseInt(window.getComputedStyle(canvas_digger).marginTop, 10);
    
    // Geister-Set für O(1) Lookup statt wiederholten Vergleichen
    const ghostSet = new Set([43.2, 44.2, 45.2, 46.2, 47.2, 48.2, 49.2, 50.2, 
                              51.2, 52.2, 53.2, 54.2, 55.2, 56.2, 57.2, 58.2, 
                              59.2, 60.2, 61.2, 62.2]);
    
    // Viewport-Grenzen vorberechnen
    const viewLeft = -actual_marginLeft;
    const viewRight = diggerdiv_width - actual_marginLeft;
    const viewTop = -actual_marginTop;
    const viewBottom = diggerdiv_height - actual_marginTop;
    
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
            context_digger.drawImage(buffer_spritesCanvas, 0, sprites[i] * pre_icon_size, 
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
        const dx = (x + i) * buffer_charsCanvas.width;
        const dy = y * pre_icon_size;

        // vorskalierte Zeichen aus "buffer_charsCanvas" ins sichtbare "canvas_scoreline" zeichnen
        context_scoreline.drawImage(
            buffer_charsCanvas,
            sx, sy,
            buffer_charsCanvas.width, pre_icon_size,
            dx, dy,
            buffer_charsCanvas.width, pre_icon_size
        );
    }
}


// belege die ganze Scoreline vor
function scorelinePrewrite() {
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
        SFX.STONE = true;
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
    // === Keyboard Update ===
    if (keys_stack.length < 1 && digger_go_handled)
        digger_go = 'NONE';

    // === DIGGER STOPP ===
    // Wenn das Spiel läuft, der Digger nicht tot ist, nicht im Leerlauf ist und sich nicht bewegt,
    // dann wird er in den Leerlauf-Zustand versetzt
    if (state === 'play' && !digger_death && !digger_idle && digger_go === 'NONE') {
        idx[d_idx] = 8.1;
        digger_step_left = 13; digger_step_up = 9; digger_step_right = 19; digger_step_down = 11;
        digger_animation_left = digger_animation_right = digger_animation_up = digger_animation_down = false;
        digger_idle = true;
    }

    // === DIGGER BEWEGUNG ===
    // Behandelt die Bewegung des Diggers in alle vier Richtungen
    if (state === 'play' && !digger_death && !digger_idle) {
        // Stein-Schiebe-Flags zurücksetzen wenn Richtung gewechselt wird
        if (stone_l && digger_go !== 'LEFT') stone_l = false;
        if (stone_r && digger_go !== 'RIGHT') stone_r = false;
        
        // Konfiguration für alle Bewegungsrichtungen
        const dirs = {
            'LEFT': { off: -1, stone_off: -2, stone_flag: 'stone_l', step: 'digger_step_left', init: 13, anim: 'digger_animation_left' },
            'UP': { off: -20, stone_off: null, stone_flag: null, step: 'digger_step_up', init: 9, anim: 'digger_animation_up' },
            'RIGHT': { off: 1, stone_off: 2, stone_flag: 'stone_r', step: 'digger_step_right', init: 19, anim: 'digger_animation_right' },
            'DOWN': { off: 20, stone_off: null, stone_flag: null, step: 'digger_step_down', init: 11, anim: 'digger_animation_down' }
        };
        
        const dir = dirs[digger_go];
        if (dir) {
            const target = d_idx + dir.off;
            const val = idx[target];
            
            // Interaktionen mit Spielelementen behandeln
            if (val === 3) { score_ges++; score_punkte += 3; SFX.DIAMOND = true; } // Diamant einsammeln
            else if (val === 41) { autoscore = 100; state = 'init'; verz = window.setTimeout(idle_exit, 3000); } // Ausgang erreicht
            else if (val >= 43 && val < 63) digger_death = true; // Geist berührt - Tod
            
            // Steine schieben (nur links/rechts möglich)
            if (val === 7 && dir.stone_off && idx[d_idx + dir.stone_off] === 1) {
                if (window[dir.stone_flag]) {
                    // Stein wird geschoben
                    idx[d_idx + dir.stone_off] = 7.1;
                    idx[target] = 1.1;
                    window[dir.stone_flag] = false;
                    brumm = true; // Vibration aktivieren
                } else {
                    window[dir.stone_flag] = true; // Stein-Schiebe-Flag setzen
                }
            }
            
            // Bewegung ausführen wenn Zielfeld frei ist
            if (val < 4 || val === 41 || (val === 7 && dir.stone_off && idx[target] === 1.1)) {
                idx[d_idx] = 1.1; // Alte Position leeren
                d_idx += dir.off; // Neue Position setzen
                SFX.STEP = true; // Schritt-Sound aktivieren
            }
            
            // Animation starten
            if (window[dir.step] === dir.init) {
                digger_animation_left = digger_animation_right = digger_animation_up = digger_animation_down = false;
                window[dir.anim] = true;
                digger_step_left = 13; digger_step_up = 9; digger_step_right = 19; digger_step_down = 11;
            }
        }
    }

    // === DIGGER ANIMATION ===
    // Animiert den Digger während der Bewegung
    if (digger_animation_left) {
        idx[d_idx] = digger_step_left + 0.1;
        digger_step_left = digger_step_left === 18 ? 13 : digger_step_left + 1;
    } else if (digger_animation_right) {
        idx[d_idx] = digger_step_right + 0.1;
        digger_step_right = digger_step_right === 24 ? 19 : digger_step_right + 1;
    }
    if (digger_animation_up) {
        idx[d_idx] = digger_step_up + 0.1;
        digger_step_up = digger_step_up === 10 ? 9 : digger_step_up + 1;
    } else if (digger_animation_down) {
        idx[d_idx] = digger_step_down + 0.1;
        digger_step_down = digger_step_down === 12 ? 11 : digger_step_down + 1;
    }

    // === SPIELFELD AKTIVITÄTEN ===
    if (state === 'play') {
        // === DIGGER IDLE ===
        // Spezielle Animationen wenn der Digger stillsteht
        if (digger_idle) {
            zufall = (zufall % 280) + 1; // Zufällige Position im Spielfeld
            if (!digger_in_idle) {
                const val = idx[zufall];
                if (val === 7) { digger_idle_augen = 24; digger_in_idle = true; idle_augen = true; } // Augen-Animation bei Steinen
                else if (val === 3) { digger_idle_stampfen = 32; digger_in_idle = true; idle_augen = false; } // Stampf-Animation bei Diamanten
            }
            if (digger_in_idle) {
                if (idle_augen && ++digger_idle_augen === 33) digger_in_idle = false;
                else if (!idle_augen && ++digger_idle_stampfen === 41) digger_in_idle = false;
            }
        } else {
            digger_in_idle = false;
        }
        // Leerlauf-Animation anzeigen
        if (digger_in_idle && !digger_death) {
            idx[d_idx] = (idle_augen ? digger_idle_augen : digger_idle_stampfen) + 0.1;
        }

        // === HAUPT-SPIELSCHLEIFE (280 Iterationen) ===
        // Durchläuft das gesamte Spielfeld und behandelt alle Objekte
        let ti = 1;
        for (let l = 1; l < 281; l++) {
            const val = idx[l];

            // === GEISTER BEHANDLUNG ===
            // Funktion für Geister-Explosion
            const handleGhostExplosion = (ghostVals) => {
                if (ghostVals.includes(val)) {
                    // 3x3 Explosionsbereich um den Geist
                    const explode = [l-21,l-20,l-19,l-1,l+1,l+19,l+20,l+21];
                    if (explode.some(i => idx[i] >= 8 && idx[i] < 41)) digger_death = true; // Digger in Explosion
                    explode.forEach(i => idx[i] = 0.1); // Explosionsbereich leeren
                    [l-21,l-20,l-19,l-1,l,l+1,l+19,l+20,l+21].forEach(i => idx[i] = 0.1);
                    SFX.STONE = true;
                    return true;
                }
                return false;
            };

            // Funktion für Geister-Bewegung
            const moveGhost = (ghostConfigs) => {
                for (const [ghost, ...checks] of ghostConfigs) {
                    if (val === ghost) {
                        for (const [dir, set, check] of checks) {
                            const target = l + dir;
                            if (idx[target] === 1 || idx[target] === 1.1) {
                                // Geist kann sich bewegen
                                ti = target;
                                idx[l] = 1.1;
                                idx[ti] = set;
                                if (idx[l + check] >= 8 && idx[l + check] < 41) digger_death = true;
                                return;
                            } else if (idx[target] >= 8 && idx[target] < 41) {
                                // Geist berührt Digger direkt
                                digger_death = true;
                            }
                        }
                        return;
                    }
                }
            };

            // Geist stirbt wenn Stein/Diamant darauf fällt
            const killGhostUnderFalling = () => {
                if (idx[ti - 20] === 3.2 || idx[ti - 20] === 7.2) {
                    idx[ti] = (idx[ti] << 0) + 0.2;
                }
            };

            // GEISTER TYP 180° (0x3 43-46) - drehen sich immer um 180°
            // 43=down,  45=up,  44=right,  46=left  180
            if (val >= 43 && val < 47) {
                if (!handleGhostExplosion([43.2, 44.2, 45.2, 46.2])) {
                    ti = l;
                    moveGhost([
                        [46, [-1, 46.1, -2], [1, 44.1, 2]],      // links: links rechts
                        [44, [1, 44.1, 2], [-1, 46.1, -2]],      // rechts: recht links
                        [45, [-20, 45.1, -40], [20, 43.1, 40]],  // hoch: hoch runter
                        [43, [20, 43.1, 40], [-20, 45.1, -40]]   // runter: runter hoch
                        
                    ]);
                    killGhostUnderFalling();
                }
            }
            // GEISTER TYP 90L (0x7 47-50) - drehen sich primär 90° nach links
            // 47=down,  49=up,  48=right,  50=left  90L
            else if (val >= 47 && val < 51) {
                if (!handleGhostExplosion([47.2, 48.2, 49.2, 50.2])) {
                    ti = l;
                    moveGhost([
                        [50, [-1, 50.1, -2], [20, 47.1, 40], [-20, 49.1, -40], [1, 48.1, 2]],  // links: links runter hoch rechts
                        [48, [1, 48.1, 2], [-20, 49.1, -40], [20, 47.1, 40], [-1, 50.1, -2]],  // rechts: rechts hoch runter links
                        [49, [-20, 49.1, -40], [-1, 50.1, -2], [1, 48.1, 2], [20, 47.1, 40]],  // hoch: hoch links rechts runter
                        [47, [20, 47.1, 40], [1, 48.1, 2], [-1, 50.1, -2], [-20, 49.1, -40]]   // runter: runter rechts links hoch
                    ]);
                    killGhostUnderFalling();
                }
            }
            // GEISTER TYP 90R (0xB 51-54) - drehen sich primär 90° nach rechts
            // 51=down,  53=up,  52=right,  54=left  90R
            else if (val >= 51 && val < 55) {
                if (!handleGhostExplosion([51.2, 52.2, 53.2, 54.2])) {
                    ti = l;
                    moveGhost([
                        [54, [-1, 54.1, -2], [-20, 53.1, -40], [20, 51.1, 40], [1, 52.1, 2]],  // links: links hoch runter rechts
                        [52, [1, 52.1, 2], [20, 51.1, 40], [-20, 53.1, -40], [-1, 54.1, -2]],  // rechts: rechts runter hoch links
                        [53, [-20, 53.1, -40], [1, 52.1, 2], [-1, 54.1, -2], [20, 51.1, 40]],  // hoch: hoch rechts links runter
                        [51, [20, 51.1, 40], [-1, 54.1, -2], [1, 52.1, 2], [-20, 53.1, -40]]   // runter: runter links rechts hoch
                    ]);
                    killGhostUnderFalling();
                }
            }
            // GEISTER TYP 90LR (0xF 55-58) - wechseln zwischen links und rechts drehen
            // 55=down,  57=up,  56=right,  58=left  90LR  zuletzt links abgebogen
            else if (val >= 55 && val < 59) {
                if (!handleGhostExplosion([55.2, 56.2, 57.2, 58.2])) {
                    ti = l;
                    moveGhost([
                        [58, [-1, 58.1, -2], [-20, 57.1, -40], [20, 55.1, 40], [1, 60.1, 2]],  // links: links hoch runter rechts(90RL)
                        [56, [1, 56.1, 2], [20, 55.1, 40], [-20, 57.1, -40], [-1, 62.1, -2]],  // rechts: rechts runter hoch links(90RL)
                        [57, [-20, 57.1, -40], [1, 56.1, 2], [-1, 58.1, -2], [20, 59.1, 40]],  // hoch: hoch rechts links runter(90RL)
                        [55, [20, 55.1, 40], [-1, 58.1, -2], [1, 56.1, 2], [-20, 61.1, -40]]   // runter: runter links rechts hoch(90RL)
                    ]);
                    killGhostUnderFalling();
                }
            }
            // GEISTER TYP 90RL (59-62) - wechseln zwischen rechts und links drehen
            // 59=down,  61=up,  60=right,  62=left  90RL  zuletzt rechts abgebogen
            else if (val >= 59 && val < 63) {
                if (!handleGhostExplosion([59.2, 60.2, 61.2, 62.2])) {
                    ti = l;
                    moveGhost([
                        [62, [-1, 62.1, -2], [20, 59.1, 40], [-20, 61.1, -40], [1, 56.1, 2]],  // links: links runter hoch rechts
                        [60, [1, 60.1, 2], [-20, 61.1, -40], [20, 59.1, 40], [-1, 58.1, -2]],  // rechts: rechts hoch runter links
                        [61, [-20, 61.1, -40], [-1, 62.1, -2], [1, 60.1, 2], [20, 55.1, 40]],  // hoch: hoch links rechts runter
                        [59, [20, 59.1, 40], [1, 60.1, 2], [-1, 62.1, -2], [-20, 57.1, -40]]   // runter: runter rechts links hoch
                    ]);
                    killGhostUnderFalling();
                }
            }
            // === STEINE UND DIAMANTEN ===
            else if (val === 7 || val === 3) {
                // Stein wird zu Diamant wenn er auf Dreck fällt
                if (val === 7 && idx[l + 20] === 5 && idx[l + 40] === 1) {
                    idx[l + 40] = 3.2; // Diamant erscheint unten
                    idx[l] = 1.1; // Stein verschwindet
                    if (idx[l + 60] > 1) {
                        SFX.STONE = true;
                        if (idx[l + 60] >= 8 && idx[l + 60] < 41) digger_death = true; // Digger getroffen
                        else if (idx[l + 60] >= 43 && idx[l + 60] < 63) idx[l + 60] = (idx[l + 60] << 0) + 0.2; // Geist getroffen
                    }
                }
                // Freier Fall nach unten
                else if (idx[l + 20] === 1) {
                    idx[l + 20] = val + 0.2; // Stein/Diamant fällt
                    idx[l] = 1.1; // Alte Position wird leer
                    if (idx[l + 40] >= 2) {
                        SFX.STONE = true;
                        if (idx[l + 40] >= 8 && idx[l + 40] < 41) digger_death = true; // Digger getroffen
                        else if (idx[l + 40] >= 43 && idx[l + 40] < 63) idx[l + 40] = (idx[l + 40] << 0) + 0.2; // Geist getroffen
                    }
                }
                // Rollen wenn Untergrund blockiert ist
                else if (idx[l + 20] === 7 || idx[l + 20] === 3 || idx[l + 20] === 63) {
                    // Versuche links oder rechts zu rollen
                    for (let d = -1; d <= 1; d += 2) {
                        if ((idx[l + d] === 1 || idx[l + d] === 7.2 || idx[l + d] === 3.2) && idx[l + 20 + d] === 1) {
                            idx[l + 20 + d] = val + 0.2; // Stein/Diamant rollt seitlich nach unten
                            idx[l] = 1.1;
                            if (idx[l + 40 + d] >= 2) {
                                SFX.STONE = true;
                                if (idx[l + 40 + d] >= 8 && idx[l + 40 + d] < 41) digger_death = true;
                                else if (idx[l + 40 + d] >= 43 && idx[l + 40 + d] < 63) idx[l + 40 + d] = (idx[l + 40 + d] << 0) + 0.2;
                            }
                            break;
                        }
                    }
                }
            }
            // === AUSGANG AKTIVIERUNG ===
            // Ausgang öffnet sich wenn alle Diamanten eingesammelt wurden
            else if (val === 6 && score_ges >= score_dia) {
                idx[l] = 41.1;
                exit_blink = 41; // Blink-Animation für Ausgang
            }
            // === STAUB AUFLÖSUNG ===
            // Staub löst sich langsam auf (4 Stufen)
            else if (val >= 0.1 && val <= 0.4) {
                idx[l] += 0.1;
                if (idx[l] === 0.4) idx[l] = 1.1; // Wird zu leerem Feld
            }
        }
    }

    // === LEVELWECHSEL ===
    // Übergang zum nächsten Level oder Highscore
    if (next_raum) {
        if (score_raum === room.length) {
            // Alle Level geschafft - Highscore anzeigen
            state = 'highscore';
            highscore_draw();
            resetGame();
        } else {
            // Nächstes Level laden
            score_raum++;
            state = 'init';
            init_room(score_raum);
        }
        next_raum = false;
        storage_game_save(); // Spielstand speichern
    }

    // === STATUS UPDATE ===
    scorelineUpdate(); // Punktestand aktualisieren
    soft_scroll(); // Weiche Kamera-Bewegung

    // === SOUND EFFEKTE ===
    // Verschiedene Sounds basierend auf Spielereignissen
    if (SFX.DIAMOND) play_audio('Diamond'); // Diamant eingesammelt
    else if (SFX.STONE) { play_audio('Stone'); brumm = true; } // Stein gefallen/geschoben
    else if (SFX.STEP) play_audio('Step'); // Digger-Schritt
    SFX.DIAMOND = SFX.STEP = SFX.STONE = false; // Flags zurücksetzen

    // === VIBRATION ===
    // Controller- oder Handy-Vibration für haptisches Feedback
    if (brumm) {
        if (gp_rumble) {
            // Gamepad-Vibration
            navigator.getGamepads()[0].vibrationActuator.playEffect("dual-rumble", {
                startDelay: 0,
                duration: 48,
                weakMagnitude: 1.0,
                strongMagnitude: 0.0
                }).then(() => {
                    // Dual-Rumble erfolgreich
                }).catch(error => {
                    console.error('Dual-Rumble Fehler:', error.message);
                });
            } else if (navigator.vibrate) {
                // Handy-Vibration
                navigator.vibrate([50, 20, 50, 20, 50, 20, 30, 20, 20]);
            }
        brumm = false;
        }

    // === DIGGER TOD ===
    // Behandlung wenn der Digger stirbt
    if (digger_death && !digger_is_dead) {
        draw_digger_death(); // Tod-Animation
        digger_go = 'NONE'; // Bewegung stoppen
        score_leben--; // Leben abziehen
        storage_game_save(); // Spielstand speichern
    }

    // === Digger-Bewegung wurde verarbeitet ===
    digger_go_handled = true;

    // === FRAME ÜBERGANG ===
    // Vorbereitung für nächsten Frame
    digger_half_step = true;
    digger_start_up = digger_start_down = digger_start_left = digger_start_right = false;
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
    // === Gamepad Update ===
    gamepad_update();

    // Early Return: spart CPU/Akku wenn nicht im Spiel
    if (state !== 'look' && state !== 'init' && state !== 'play') {
        takt_teiler ^= 3;
        setTimeout(game_loop, FPS);
        return;
    }

    // Spiellogik nur jeden 1. von 2 Durchläufen
    if (takt_teiler === 1) {
        // Jetzt entweder Frame1 oder Frame2
        !digger_half_step ? draw_frame1() : draw_frame2();
        // Countdown (in beiden FRAMEs)
        if (state === 'play' && !digger_death) digger_death = (--score_zeit === 0);
    }

    // Webbrowser-Rendering (60Hz)
    requestAnimationFrame(draw_field);

    // Diamant Farbscrollsequenz (64 bis max_diamond_blink)
    diamond_blink = diamond_blink >= 64 + max_diamond_blink - 1 ? 64 : diamond_blink + 1;

    // Exit Blinksequenz (41 exit <--> 42 wall)
    exit_blink = exit_blink >= 43 ? 41 : exit_blink + 0.05;
    
    // Die Spiellogik nur bei jedem 2. Durchlauf (takt_teiler==1) ausführen
    takt_teiler ^= 3;  //  XOR mit 3, Wechselt zwischen 1 und 2, 1^3=2, 2^3=1
    setTimeout(game_loop, FPS);
}


function init_events() {

    //Touch aktivieren (Handy, Tablet)
    // Beim Registrieren der Touch-Events explizit passive: false setzen
    document.body.addEventListener('touchstart', touch_down, { passive: false });
    document.body.addEventListener('touchmove', touch_xy, { passive: false });
    document.body.addEventListener('touchend', touch_up, { passive: false });
    document.body.addEventListener('touchcancel', touch_cancel, { passive: false });
    
    // Verhindert Zoomen durch Doppeltipp
    document.body.style.touchAction = 'manipulation';

    //Maus und Tastatur aktivieren (PC, LG-SmartTV)
    document.body.addEventListener('click', mo_press, false);
    document.body.addEventListener('keydown', key_down, false);
    document.body.addEventListener('keyup', key_up, false);
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
