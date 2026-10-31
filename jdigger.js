// SPDX-License-Identifier: GPL-3.0
// jdigger/jdigger.js === KC85-DIGGER ===
// Copyright (C) 2019–2026  Marko Klingner

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

// ============================================================
// Geister-Konstanten & -Funktionen (Modulebene, hoisted)
// - keine Closure-Allokationen mehr im 280er-Spielfeld-Loop
// ============================================================

// Geister im Zustand .2 (Explosion) - O(1) Drawflag-Lookup in draw_field()
const GHOST_DRAW_SET = new Set([43.2, 44.2, 45.2, 46.2, 47.2, 48.2, 49.2, 50.2,
                                51.2, 52.2, 53.2, 54.2, 55.2, 56.2, 57.2, 58.2,
                                59.2, 60.2, 61.2, 62.2]);

// 8 Felder um den Geist / alle 9 inkl. Geistposition
const EXPLODE_AROUND = [-21, -20, -19, -1, 1, 19, 20, 21];

// Bewegungstabelle Digger (ehemals pro Tick neu allokiert)
const DIRS = {
    LEFT:  { off: -1,  stone_off: -2, init: 13, isLeft:  true },
    RIGHT: { off: 1,   stone_off: 2,  init: 19, isRight: true },
    UP:    { off: -20, stone_off: 0,  init: 9,  isUp:    true },
    DOWN:  { off: 20,  stone_off: 0,  init: 11 }
};

// Zeilenphase der Diamant-Animation (ehemals pro Diamant neu gerechnet)
const ROW_PHASE = [0, 6, 2, 8, 4, 0, 6, 2, 8, 4, 0, 6, 2, 8, 4];

// Symboltabelle ASCII-Karte -> Zellenwert-Nibble (levels*_map.js)
const SYM = { ' ': 0, 'S': 1, '.': 2, 'g': 3, '4': 4, 'D': 5, '#': 6, 'l': 7,
              '8': 8, 'U': 9, 'P': 10, 'r': 11, 'E': 12, 'd': 13, 'C': 14, 't': 15 };
const EXPLODE_ALL    = [-21, -20, -19, -1, 0, 1, 19, 20, 21];

// Bewegungstabellen der 5 Geistertypen:
// [Geist-Id, [Richtungs-Offset, Setze-Wert, Check-Offset], ...]
const GHOST_CFG_180 = [
    [46, [-1, 46.1, -2], [1, 44.1, 2]],
    [44, [1, 44.1, 2], [-1, 46.1, -2]],
    [45, [-20, 45.1, -40], [20, 43.1, 40]],
    [43, [20, 43.1, 40], [-20, 45.1, -40]]
];

const GHOST_CFG_90L = [
    [50, [-1, 50.1, -2], [20, 47.1, 40], [-20, 49.1, -40], [1, 48.1, 2]],
    [48, [1, 48.1, 2], [-20, 49.1, -40], [20, 47.1, 40], [-1, 50.1, -2]],
    [49, [-20, 49.1, -40], [-1, 50.1, -2], [1, 48.1, 2], [20, 47.1, 40]],
    [47, [20, 47.1, 40], [1, 48.1, 2], [-1, 50.1, -2], [-20, 49.1, -40]]
];

const GHOST_CFG_90R = [
    [54, [-1, 54.1, -2], [-20, 53.1, -40], [20, 51.1, 40], [1, 52.1, 2]],
    [52, [1, 52.1, 2], [20, 51.1, 40], [-20, 53.1, -40], [-1, 54.1, -2]],
    [53, [-20, 53.1, -40], [1, 52.1, 2], [-1, 54.1, -2], [20, 51.1, 40]],
    [51, [20, 51.1, 40], [-1, 54.1, -2], [1, 52.1, 2], [-20, 53.1, -40]]
];

const GHOST_CFG_90LR = [
    [58, [-1, 58.1, -2], [-20, 57.1, -40], [20, 55.1, 40], [1, 60.1, 2]],
    [56, [1, 56.1, 2], [20, 55.1, 40], [-20, 57.1, -40], [-1, 62.1, -2]],
    [57, [-20, 57.1, -40], [1, 56.1, 2], [-1, 58.1, -2], [20, 59.1, 40]],
    [55, [20, 55.1, 40], [-1, 58.1, -2], [1, 56.1, 2], [-20, 61.1, -40]]
];

const GHOST_CFG_90RL = [
    [62, [-1, 62.1, -2], [20, 59.1, 40], [-20, 61.1, -40], [1, 56.1, 2]],
    [60, [1, 60.1, 2], [-20, 61.1, -40], [20, 59.1, 40], [-1, 58.1, -2]],
    [61, [-20, 61.1, -40], [-1, 62.1, -2], [1, 60.1, 2], [20, 55.1, 40]],
    [59, [20, 59.1, 40], [1, 60.1, 2], [-1, 62.1, -2], [-20, 57.1, -40]]
];

// Erkennt alle Explosionszustaende (43.2 bis 62.2) - keine Arrays/Closures
function handleGhostExplosion(l, val) {
    if (val < 43.2 || val > 62.2) return false;
    const whole = val | 0;
    if (Math.abs(val - whole - 0.2) > 1e-9) return false; // Float-sicher

    // Digger in der 3x3-Zone? (VOR dem Leeren pruefen - wie im Original)
    for (let k = 0; k < EXPLODE_AROUND.length; k++) {
        const v = idx[l + EXPLODE_AROUND[k]];
        if (v >= 8 && v < 41) { digger_death = true; break; }
    }

    for (let k = 0; k < EXPLODE_ALL.length; k++) {
        idx[l + EXPLODE_ALL[k]] = 0.1;
    }

    SFX.STONE = true;
    return true;
}

// Bewege einen Geist laut Tabelle; liefert die Position fuer den
// anschliessenden Falling-Check (Zielfeld oder Geist selbst)
function moveGhost(l, val, cfg) {
    for (let g = 0; g < cfg.length; g++) {
        const entry = cfg[g];
        if (val !== entry[0]) continue;

        for (let c = 1; c < entry.length; c++) {
            const dir   = entry[c][0];
            const set   = entry[c][1];
            const check = entry[c][2];
            const target = l + dir;

            if (idx[target] === 1 || idx[target] === 1.1) {
                idx[l] = 1.1;
                idx[target] = set;
                if (idx[l + check] >= 8 && idx[l + check] < 41) digger_death = true;
                return target;
            } else if (idx[target] >= 8 && idx[target] < 41) {
                digger_death = true;
            }
        }
        return l; // Geist gefunden, aber nicht bewegt
    }
    return l;
}

// Geist stirbt, wenn ein fallender Stein/Diamant auf ihn faellt
function killGhostUnderFalling(ti) {
    const above = idx[ti - 20];
    if (above === 3.2 || above === 7.2) {
        idx[ti] = (idx[ti] << 0) + 0.2;
    }
}

// ============================================================
// Softscroll-Margin-Status (ersetzt getComputedStyle pro Frame)
// - die CSS-Transition ist linear -> Wert exakt interpolierbar
// - actual_margin* entspricht damit exakt dem alten Verhalten,
//   inkl. "Animation laeuft noch"-Erkennung durch die Gates
// ============================================================
var margin_anim_x = { from: 0, to: 0, t0: 0, dur: 0 };
var margin_anim_y = { from: 0, to: 0, t0: 0, dur: 0 };

// Aktuellen (interpolierten) Margin-Wert einer Achse ermitteln
function marginValue(anim) {
    if (anim.dur <= 0) return anim.to;
    const p = (Date.now() - anim.t0) / (anim.dur * 1000);
    return p >= 1 ? anim.to : anim.from + (anim.to - anim.from) * p;
}

// Am Anfang von draw_field() und soft_scroll() aufrufen (|0 wie parseInt)
function updateActualMargins() {
    actual_marginLeft = marginValue(margin_anim_x) | 0;
    actual_marginTop  = marginValue(margin_anim_y) | 0;
}

// Margin setzen: Transition startet vom aktuellen interpolierten Wert,
// exakt wie ein Browser bei einem Neusetzen waehrend einer Transition
function setMarginX(v, dur) {
    margin_anim_x.from = actual_marginLeft;
    margin_anim_x.to = v;
    margin_anim_x.t0 = Date.now();
    margin_anim_x.dur = dur;
    actual_marginLeft = v;
    canvas_digger.style.marginLeft = v + "px";
}
function setMarginY(v, dur) {
    margin_anim_y.from = actual_marginTop;
    margin_anim_y.to = v;
    margin_anim_y.t0 = Date.now();
    margin_anim_y.dur = dur;
    actual_marginTop = v;
    canvas_digger.style.marginTop = v + "px";
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
        // Rahmen zeichnen (Wiederholungszeichen generiert)
    menuLine("\x9c" + "\x9d".repeat(38) + "\x9e", 0, 0);
    menuLine("\x9f\xa0" + "\xa1".repeat(36) + "\xa2\x9f", 0, 1);
    menuLine("\x9f\xa3\x9c" + "\x9d".repeat(34) + "\x9e\xa9\x9f", 0, 2);


    // Seitenrahmen
    for (let i = 3; i < 27; i++) {
        menuLine("\x9f\xa3\x9f", 0, i);
        menuLine("\x9f\xa9\x9f", 37, i);
    }

    // Spieltitel
    const title = [
        "\x80\x81\x82\x83 \x88 \x89\x8a\x8b\x8c \x89\x8a\x8b\x8c \x80\x81\x8d\x8d \x5b\x8d\x91\x92",
        "\x5b \x86\x87 \x5b \x5b  \x8d \x5b  \x8d \x5b    \x5b \x93\x94",
        "\x5b  \x5b \x5b \x5b \xa4\x8e \x5b \xa4\x8e \x5b\x8f\x90  \x5b\x95\x96\x97",
        "\x5b \xb0\xb1 \x5b \x5b \xce\x5b \x5b \xce\x5b \x5b    \x5b \x98\x99",
        "\xaa\xab\xac\xad \xb2 \xb3\xb4\xb5\xb6 \xb3\xb4\xb5\xb6 \xaa\xab\xb7\xb7 \x5b \x9a\x9b"
    ];
    
    title.forEach((line, i) => menuLine(line, 7, 6 + i));

    // Credits
    menuLine("WRITTEN BY  ALEXANDER LANG", 7, 13);
    menuLine("GRAPHIX BY  STEFAN  DAHLKE", 7, 15);
    menuLine("HUMBOLDT-UNIVERSITY     \xa5\xa6", 7, 17);
    menuLine("         BERLIN         \xa7\xa8", 7, 18);

    // Gamepad-spezifische Symbole holen
    const controls = menu_get_gamepad_symbols();
    menuLine(controls.play, 9, 20);
    menuLine(controls.rooms, 9, 22);

    // Version und Copyright
    menuLine("JSv " + DIGGER_VERSION, 5, 25);
    menuLine("\x60 1988", 29, 25);
    menuLine("by TIKKEL", 5, 26);
    menuLine("BERLIN", 29, 26);

    // Unterer Rahmen
    menuLine("\x9f\xa3\xc6" + "\x9d".repeat(34) + "\xc8\xa9\x9f", 0, 27);
    menuLine("\x9f\xca" + "\xcb".repeat(36) + "\xcc\x9f", 0, 28);
    menuLine("\xc6" + "\x9d".repeat(38) + "\xc8", 0, 29);

    // Canvas aktualisieren und anzeigen
    context_menuimg.drawImage(buffer_menuCanvas, 0, 0, 320, 240, 0, 0, body_width, body_height);
    document.getElementById('menudiv').style.visibility = "visible";
}

// zeige Gamepad-spezifische Symbole (wenn angeschlossen)
function menu_get_gamepad_symbols() {
    const controlMaps = {
        playstation: { play: "\xd8: PLAY   \xdb: HIGHSCORE", rooms: "\xda: A LOOK AT THE ROOMS" },
        xbox: { play: "\xdc: PLAY   \xdf: HIGHSCORE", rooms: "\xde: A LOOK AT THE ROOMS" },
        nintendo: { play: "\xdc: PLAY   \xdf: HIGHSCORE", rooms: "\xde: A LOOK AT THE ROOMS" },
        generic: { play: "\xdc: PLAY   \xdf: HIGHSCORE", rooms: "\xde: A LOOK AT THE ROOMS" }
    };
    
    return controlMaps[gamepad_brand] || 
           { play: "P: PLAY   H: HIGHSCORE", rooms: "L: A LOOK AT THE ROOMS" };
}

function highscore_draw() {
  if (!charsImage.complete) {
    setTimeout(highscore_draw, 1000);
    return;
  }
  
  // Puffer mit KCB_TUERKIS füllen (copy)
  buffer_menuContext.globalCompositeOperation = "copy";
  buffer_menuContext.fillStyle = KCB_TUERKIS;
  buffer_menuContext.fillRect(0, 0, 320, 240);
  
  // KCF_WEISS aus KCB_TUERKIS ausschneiden (destination-out für Transparenz)
  buffer_menuContext.globalCompositeOperation = "destination-out";
  menuLine("HIGHSCORE :", 8, 4);
  menuLine("\x8f\x8f\x8f\x8f\x8f\x8f\x8f\x8f\x8f\x8f\x8f", 8, 5);
  
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
    menuLine(input_alias + "\x7f", 17, 7 + input_line);
    
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
        // aktiviere wieder game_loop Tastatureingabe
        document.body.removeEventListener('keydown', highscore_input);
        document.body.addEventListener('keydown', key_down);
        return;
    }

    // Weiter warten auf Y/N Eingabe
    setTimeout(highscoreYesNo, 50);
}

// ============================================================
// Speicher-Helfer: localStorage mit Cookie-Fallback
// (ersetzt 4x identisches try/catch-Boilerplate)
// ============================================================
function storage_get(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        var m = document.cookie.match(new RegExp("(?:^|; )" + key + "=([^;]*)"));
        return m ? m[1] : null;
    }
}

function storage_set(key, value) {
    try {
        localStorage.setItem(key, value);
        return;
    } catch (e) { /* Fallback: Cookie */ }
    var d = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    document.cookie = key + "=" + value + "; expires=" + d.toUTCString();
}

//Highscore laden und aktualisieren
function storageHighscoreUpdate() {
    var stored = storage_get("highscore");
    if (stored)
        highscore = JSON.parse(stored);

    //highscore[] vorbelegen
    if (highscore[0] === undefined) {
        highscore[0] = "10000  --------------";
        highscore[1] = "09000  Digger";
        highscore[2] = "08000  (c) 1988 by";
        highscore[3] = "07000  Alexander Lang";
        highscore[4] = "06000  --------------";
        for (var h = 5; h < 20; h++) {
            highscore[h] = "00000";
        }
    }

    //über alle 20 Einträge iterieren
    for (h = 0; h < 20; h++) {
        if (score_punkte > Number(highscore[h].substring(0, 5))) {
            input_line = h;
            for (var m = 19; m > h; m--)
                highscore[m] = highscore[m - 1];
            var sp = "" + score_punkte;
            while (sp.length < 5)
                sp = "0" + sp;
            highscore[h] = sp;
            state = 'input';
            document.body.removeEventListener('keydown', key_down);
            document.body.addEventListener('keydown', highscore_input);
            break;
        }
    }
}

//Highscore sichern
function storageHighscoreSave() {
    storage_set("highscore", JSON.stringify(highscore));
}

// Highscore-Eingabe über Tastatur (PC)
function highscore_input(event) {
    event.preventDefault();
    const key = event.key;

    // Erlaubt:
    // 1. Alle "normale" Tasten, die ein Zeichen erzeugen (inkl. Umlaute ß,ä,ö,ü)
    // 2. Explizit: Backspace und Enter
    const isPrintableKey = (
        key.length === 1 &&  // Einzelzeichen (keine Steuertaste)
        !event.ctrlKey &&    // Keine Ctrl-Kombination
        !event.altKey &&     // Keine Alt-Kombination
        !event.metaKey      // Keine Cmd/Win-Kombination
    );
    const isAllowedControlKey = key === "Backspace" || key === "Enter";

    if (!isPrintableKey && !isAllowedControlKey) {
        return; // Blockiere unerwünschte Tasten (z. B. Pfeiltasten, F1-F12)
    }

    input = event.key;
    console.log(`Inputkey: ${input}`);
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
    storage_set("level", score_raum);
    storage_set("lives", score_leben);
    storage_set("score", score_punkte);
}

//Spielstand restaurieren
function storage_game_restore() {
    var v = storage_get("level"); if (v) score_raum = Number(v);
    v = storage_get("lives");     if (v) score_leben = Number(v);
    v = storage_get("score");     if (v) score_punkte = Number(v);
    if (score_leben < LEBENMIN) resetGame();
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

    // Raum(level) initialisieren (idx[], 1-basiert, je 20 Zellen/Zeile):
    //  0 Staub, 1 leer, 2 Boden, 3 Diamant, 4 Wand, 5 Changer, 6 Exit,
    //  7 Stein, 8 Digger, 41 versteckter Exit (= Diggerstart), 63 Kreuz,
    //  43-62 Geister (je 4er-Block: 180, 90L, 90R, 90LR, 90RL; Richtung +0..+3)
    // Leveldaten (room_data): 140 Bytes Feld (2 Nibbles/Zelle), ab Offset 139:
    //  +6/+7 Diggerposition (BCD), +8 Diamantenziel (BCD), ab +16 Geisterrichtungen
    // Leveldaten: ASCII-Karte + Kopfzeile dekodieren (levels*_map.js)
    // 14 Zeilen à 20 Zeichen Spielfeld + 1 Kopfzeile mit 16 Header-Bytes
    // (Diggerposition BCD, Diamantenziel BCD, Geisterrichtungen ab Byte 148)
    var lines = room[level - 1].split('\n');
    var head = lines[14].slice(1).split(',');
    var room_data = new Array(156);
    // 280 Zellen (2 pro Byte) aus der 14x20-Karte zusammensetzen
    for (var d = 0; d < 140; d++) {
        var k = d * 2;
        room_data[d] = SYM[lines[(k / 20) | 0].charAt(k % 20)] << 4
                     | SYM[lines[(k + 1) / 20 | 0].charAt((k + 1) % 20)];
    }
    for (var d = 0; d < 16; d++) {
        room_data[140 + d] = Number(head[d]);
    }
    
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

    // Altes Feld sofort uebermalen: Im Menue laeuft draw_field nicht, das
    // Canvas behalte sonst 1-2 Frames den Stand des letzten Levels
    // (incl. Digger) - in Zeitlupe sichtbarer "Digger-Blitz".
    context_digger.clearRect(0, 0, field_width, field_height);
    draw_field();

    // Spiel verzögert starten (wenn Status init)
    if (state === 'init') {
        verz = setTimeout(idle_start, 3000);
    }
}

function draw_digger_death() {
    var positions = [-21, -20, -19, -1, 0, 1, 19, 20, 21];

    for (var i = 0; i < positions.length; i++) {
        idx[d_idx + positions[i]] = (i < 8 && score_ges > i) ? 3.1 : 0.1;
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
    updateActualMargins();
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
        setMarginX(viewport_x, duration_x);
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
        setMarginX(viewport_x, duration_x);
    }

    //oben, Randabstand < 2 Spritehöhen
    if (((digger_y + viewport_y) < (pre_abstand)) && (actual_marginTop <= viewport_y) && (viewport_y !== 0)) {
        //scroll nach unten, -y..0
        viewport_y = (diggerdiv_height / 2 - digger_y - pre_icon_size / 2) << 0;
        if (viewport_y > 0)
            viewport_y = 0;
        duration_y = Math.abs(viewport_y - actual_marginTop) / duration / (pre_icon_size / 16);
        canvas_digger.style.transitionDuration = duration_y + "s" + ", " + duration_x + "s";
        setMarginY(viewport_y, duration_y);
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
        setMarginY(viewport_y, duration_y);
    }

}

function draw_field() {
    // Margin-Werte aus der linearen CSS-Transition interpolieren
    // (exakt wie getComputedStyle, aber ohne Layout-Flush pro Frame)
    updateActualMargins();

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
        if (i > 0 && !GHOST_DRAW_SET.has(idx_val)) {
            idx[l] = i;
        }
        
        // Position berechnen (Bit-Shift für Division)
        z = (l - 1) / 20 << 0;
        s = (l - 1) - (z * 20);
        y = z * pre_icon_size;
        x = s * pre_icon_size;
        
        // Diamant Blinksequenz
        if (i === 3) {
            i = diamond_blink + ROW_PHASE[z];   // zeilenversetzte Phase
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
    scorelineChar("  " + sr + "   " + sl + "\xd4\xd5    5000" + "      \xd6\xd7" + sd + "              ", 0, 0);
    
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
    // (Konfiguration auf Modulebene - keine Allokationen, keine window[]-Lookups)
    if (state === 'play' && !digger_death && !digger_idle) {
        // Stein-Schiebe-Flags zurücksetzen wenn Richtung gewechselt wird
        if (stone_l && digger_go !== 'LEFT') stone_l = false;
        if (stone_r && digger_go !== 'RIGHT') stone_r = false;

        const dir = DIRS[digger_go];
        if (dir) {
            const target = d_idx + dir.off;
            const val = idx[target];

            // Interaktionen mit Spielelementen behandeln
            if (val === 3) { score_ges++; score_punkte += 3; SFX.DIAMOND = true; } // Diamant einsammeln
            else if (val === 41) { autoscore = 100; state = 'init'; verz = window.setTimeout(idle_exit, 3000); } // Ausgang erreicht
            else if (val >= 43 && val < 63) digger_death = true; // Geist berührt - Tod

            // Steine schieben (nur links/rechts möglich, stone_off = 0 heißt "nicht möglich")
            if (val === 7 && dir.stone_off !== 0 && idx[d_idx + dir.stone_off] === 1) {
                if (dir.isLeft ? stone_l : stone_r) {
                    // Stein wird geschoben
                    idx[d_idx + dir.stone_off] = 7.1;
                    idx[target] = 1.1;
                    if (dir.isLeft) stone_l = false; else stone_r = false;
                    brumm = true; // Vibration aktivieren
                } else {
                    if (dir.isLeft) stone_l = true; else stone_r = true; // Stein-Schiebe-Flag setzen
                }
            }

            // Bewegung ausführen wenn Zielfeld frei ist
            if (val < 4 || val === 41 || (val === 7 && dir.stone_off !== 0 && idx[target] === 1.1)) {
                idx[d_idx] = 1.1; // Alte Position leeren
                d_idx += dir.off; // Neue Position setzen
                SFX.STEP = true; // Schritt-Sound aktivieren
            }

            // Animation starten (Schrittzähler der aktuellen Richtung prüfen)
            const stepVal = dir.isLeft ? digger_step_left :
                            dir.isRight ? digger_step_right :
                            dir.isUp ? digger_step_up : digger_step_down;
            if (stepVal === dir.init) {
                digger_animation_left = digger_animation_right = digger_animation_up = digger_animation_down = false;
                if (dir.isLeft) digger_animation_left = true;
                else if (dir.isRight) digger_animation_right = true;
                else if (dir.isUp) digger_animation_up = true;
                else digger_animation_down = true;
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
        // (Geister-Funktionen & Tabellen liegen auf Modulebene - siehe oben)
        for (let l = 1; l < 281; l++) {
            const val = idx[l];

            // === GEISTER (alle 5 Typen in einem Zweig) ===
            if (val >= 43 && val < 63) {
                if (!handleGhostExplosion(l, val)) {
                    const cfg = val < 47 ? GHOST_CFG_180 :
                                val < 51 ? GHOST_CFG_90L :
                                val < 55 ? GHOST_CFG_90R :
                                val < 59 ? GHOST_CFG_90LR :
                                           GHOST_CFG_90RL;
                    const ti = moveGhost(l, val, cfg);
                    killGhostUnderFalling(ti);
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
        if (gamepad_rumble) {
            // Chrome
            navigator.getGamepads()[0].vibrationActuator.playEffect("dual-rumble", {
                startDelay:0, duration:FPS*2, strongMagnitude:1.0, weakMagnitude:1.0});
        } else if (navigator.vibrate) {
            // Handy
            navigator.vibrate([
                15, 10, 15]); 
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
    // Float-Rundung noetig: 0.05 ist binaer nicht exakt, sonst landet der
    // Zaehler zwischendurch bei z.B. 43.0499.. -> <<0 ergibt 43 ->
    // sprites[43] = 38 -> ein Geist-Frame blitzt im Exit auf
    exit_blink = Math.round((exit_blink + 0.05) * 100) / 100;
    if (exit_blink >= 43) exit_blink = 41;
    
    // Die Spiellogik nur bei jedem 2. Durchlauf (takt_teiler==1) ausführen
    takt_teiler ^= 3;  //  XOR mit 3, Wechselt zwischen 1 und 2, 1^3=2, 2^3=1
    setTimeout(game_loop, FPS);
}


function init_events() {
    // Touch aktivieren (Handy, Tablet)
    document.body.addEventListener('touchstart', touch_down);
    document.body.addEventListener('touchmove', touch_xy);
    document.body.addEventListener('touchend', touch_up);
    document.body.addEventListener('touchcancel', touch_cancel);
    // Touch-Optimierungen
    document.body.style.touchAction = 'none';
    document.body.style.userSelect = 'none';
    //document.body.style.webkitUserSelect = 'none';
    document.body.style.webkitTouchCallout = 'none';
    document.body.style.webkitTapHighlightColor = 'transparent';
    // Verhindert Kontext-Menu bei langem Touch
    document.body.addEventListener('contextmenu', (e) => e.preventDefault());

    // Maus und Tastatur aktivieren (PC, LG-SmartTV)
    document.body.addEventListener('click', mouse_click);
    document.body.addEventListener('keydown', key_down);
    document.body.addEventListener('keyup', key_up);

    // Bildschirm und Buffer neu skalieren
    window.addEventListener('resize', scaleReload);

    // Gamepad verbunden|abgesteckt
    if (navigator.getGamepads) {
        window.addEventListener('gamepadconnected', gamepad_connect);
        window.addEventListener('gamepaddisconnected', gamepad_disconnect);
    }
    
}


//Bildschirm und Buffer neu skalieren
scaleReload();

//Gameloop
game_loop();
init_events();
