

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


//  PNGs mit Gimp hochoptimiert abspeichern (compress 9) und dann alle Metadaten entfernen (convert strip)
//  z.B. convert sprites.png -strip sprites.png

var rescale = false;
var spriteset; // Sprites
var charset; // Zeichensatz
var max_diamond_blink = 10;
var sprites = [
    0, // 0=Explode
    1, // 1=Nothing
    2, // 2=Ground
    3, // 3=Diamant
    4, // 4=Wall
    5, // 5=Changer
    4, // 6=Exit, zu Anfangs Wall
    7, // 7=Stein

    37, // 8=Digger

    30, // 9=Digger up1 Laufanimation hoch
    31, // 10=Digger up2

    32, // 11=Digger down1 Laufanimation runter
    33, // 12=Digger down2

    21, //13 Laufanimation links
    20, //14
    21, //15
    22, //16
    23, //17
    22, //18

    25, //19 Laufanimation rechts
    24, //20
    25, //21
    26, //22
    27, //23
    26, //24

    35, //eye1 Idle Animation Augenblinzeln
    36, //eye2
    35, //eye1
    37, //digger
    35, //eye1
    36, //eye2
    35, //eye1
    37, //digger

    34, //foot Idle Animation Fussstampfen
    34, //foot
    34, //foot
    37, //digger
    34, //foot
    37, //digger
    34, //foot
    37, //digger

    6, //41=Exit blinkender Ausgang
    4, //42=Wall

    38, //43 down 180
    29, //44 right
    39, //45 up
    28, //46 left

    38, //47 down 90l
    29, //48 right
    39, //49 up
    28, //50 left

    38, //51 down 90r
    29, //52 right
    39, //53 up
    28, //54 left

    38, //55 down 90lr
    29, //56 right
    39, //57 up
    28, //58 left

    38, //59 down 90rl
    29, //60 right
    39, //61 up
    28, //62 left

    8, //63 Kreuz

    10, //64 Diamanten Animation
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19 //73 == sprites.length-1
];

function drawHighscore() {

    //Puffer mit Farbe löschen (copy)
    menu_context.globalCompositeOperation = "copy";
    menu_context.fillStyle = "#028965"; //KCB_TUERKIS
    menu_context.fillRect(0, 0, 320, 240);

    if (charset.complete) {

        //schneide KCF_WEISS aus KCB_TUERKIS aus
        //KCB_TUERKIS ist die Hintergrundfarbe und KCF_WEISS ist 100% transparent (destination-out)
        //im Zielcanvas ist KCF_WEISS dann die vorher gefüllte Farbe
        menu_context.globalCompositeOperation = "destination-out";

        //die Überschrift ...
        drawLine8("HIGHSCORE :", 8, 4);
        drawLine8("\217\217\217\217\217\217\217\217\217\217\217", 8, 5);

        //Higscore laden und eventl. aktualisieren
        highscore_update();

        //die Liste ... 20 Zeilen
        for (var i = 0; i < 20; i++) {
            //sprintf(entry, "%.6d  %s", highscore[i].score, highscore[i].name);
            //var entry = "123456  1234567890";
            drawLine8(highscore[i], 10, 7 + i);
        }

        //... wenn möglich, schönen Pixelsalat zeichnen
        setpixelated(context_menuimg);

        //kopiere die Grafik aus dem Puffer skaliert (body_width x body_height) in das sichtbare Menu-Canvas (canvas_menuimg)
        //Menu mit Farbe löschen (copy)
        context_menuimg.globalCompositeOperation = "copy";
        context_menuimg.fillStyle = "#E7E95D"; //KCF_GELB
        context_menuimg.fillRect(0, 0, body_width, body_height);
        //Menu mit Puffer beschreiben (Weiß ist ausgeschnitten und transparent, KCF_GELB)
        context_menuimg.globalCompositeOperation = "source-over";
        context_menuimg.drawImage(menu_canvas, 0, 0, 320, 240, 0, 0, body_width, body_height);
        document.getElementById('menudiv').style.visibility = "visible";

        //eventl. neuen Alias abfragen
        if (state == 'input')
            setTimeout(drawInput, 50);

    } else
        setTimeout(drawMenu, 1000);

}

var rd_in = false;

function drawInput() {
    if (!rd_in) { //braucht nur 1x gemalt werden

        //Loop Tastaturabfrage
        menu_context.globalCompositeOperation = "destination-out";
        drawLine8("...well done, please enter your name :", 1, 2);

        //Zeile löschen
        //Cursor(\177) und Zeichen
        menu_context.globalCompositeOperation = "source-over";
        menu_context.fillStyle = "#028965"; //KCB_TUERKIS
        menu_context.fillRect(17 * 8, (7 + input_line) * 8, 15 * 8, 8);
        menu_context.globalCompositeOperation = "destination-out";
        drawLine8(input_alias + "\177", 17, 7 + input_line);

        //... wenn möglich, schönen Pixelsalat zeichnen
        setpixelated(context_menuimg);

        //kopiere die Grafik aus dem Puffer skaliert (body_width x body_height) in das sichtbare Menu-Canvas (canvas_menuimg)
        //Menu mit Farbe löschen (copy)
        context_menuimg.globalCompositeOperation = "copy";
        context_menuimg.fillStyle = "#E7E95D"; //KCF_GELB
        context_menuimg.fillRect(0, 0, body_width, body_height);
        //Menu mit Puffer beschreiben (Weiß ist ausgeschnitten und transparent, KCF_GELB)
        context_menuimg.globalCompositeOperation = "source-over";
        context_menuimg.drawImage(menu_canvas, 0, 0, 320, 240, 0, 0, body_width, body_height);

        rd_in = true;
    }

    if (input != undefined) {
        if (input == 'Enter') { //Enter -> 'weiter zu YesNo'
            rd_in = false;
            input = undefined;
            handled = true;
            highscore[input_line] = highscore[input_line] + "  " + input_alias; //"99999  alias678901234"
            highscore_save();
            setTimeout(drawYesNo, 100);
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
                highscore_save();
                setTimeout(drawYesNo, 100);
                return;
            }
        }
    }

    //keine Taste, weiter warten
    setTimeout(drawInput, 50);
}

var rd_yn = false;

function drawYesNo() {
    if (!rd_yn) { //braucht nur 1x gemalt werden
        //Loop Tastaturabfrage Y/N (89/78)
        menu_context.globalCompositeOperation = "destination-out";
        drawLine8("NEW GAME ? (Y/N)", 12, 28);

        //Zeile löschen
        //Cursor(\177) und Zeichen
        menu_context.globalCompositeOperation = "source-over";
        menu_context.fillStyle = "#028965"; //KCB_TUERKIS
        menu_context.fillRect(17 * 8, (7 + input_line) * 8, 15 * 8, 8);
        menu_context.globalCompositeOperation = "destination-out";
        drawLine8(input_alias, 17, 7 + input_line);

        //... wenn möglich, schönen Pixelsalat zeichnen
        setpixelated(context_menuimg);

        //kopiere die Grafik aus dem Puffer skaliert (body_width x body_height) in das sichtbare Menu-Canvas (canvas_menuimg)
        //Menu mit Farbe löschen (copy)
        context_menuimg.globalCompositeOperation = "copy";
        context_menuimg.fillStyle = "#E7E95D"; //KCF_GELB
        context_menuimg.fillRect(0, 0, body_width, body_height);
        //Menu mit Puffer beschreiben (Weiß ist ausgeschnitten und transparent, KCF_GELB)
        context_menuimg.globalCompositeOperation = "source-over";
        context_menuimg.drawImage(menu_canvas, 0, 0, 320, 240, 0, 0, body_width, body_height);

        rd_yn = true;
    }

    switch (input) {
        case 'y':
        case 'Y':
            input_alias = "";
            input_line = 0;
            input = undefined;
            rd_yn = false;
            game_restore(); //spielstand restaurieren
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
            //spielstand resetten
            score_punkte = 0;
            score_leben = LEBENMAX;
            score_raum = 1;
            game_save(); //spielstand sichern
            init_room(score_raum);
            drawMenu();
            handled = true;
            //virtuelle Tastatur ausblenden
            document.body.removeEventListener('click', vkb_focus, false);
            document.body.removeEventListener('input', vkb_input, false);
            virt_kbd.blur();
            return;
    }

    //keine Taste, weiter warten
    setTimeout(drawYesNo, 50);
}

//schreibe zeilenweise die MENU-Grafik (in orig. Größe 320x240) in einen Canvas-Puffer (menu_canvas)
function drawMenu() {

    //Puffer mit Farbe löschen (copy)
    menu_context.globalCompositeOperation = "copy";
    menu_context.fillStyle = "#04028f"; //KCB_BLAU
    menu_context.fillRect(0, 0, 320, 240);

    if (charset.complete) {

        //male KCF_WEISS auf die vorher KCB_BLAU gefüllte Fläche über
        //KCB_BLAU ist die Hintergrundfarbe und KCF_WEISS ist 100% deckend (source-over)
        //im Zielcanvas ist KCF_WEISS dann also normal KCF_WEISS
        menu_context.globalCompositeOperation = "source-over";

        //der Text ...
        drawLine8("\234\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\236", 0, 0);
        drawLine8("\237\240\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\242\237", 0, 1);
        drawLine8("\237\243\234\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\236\251\237", 0, 2);
        for (var i = 3; i < 27; i++) {
            drawLine8("\237\243\237", 0, i);
            drawLine8("\237\251\237", 37, i);
        }
        drawLine8("\200\201\202\203 \210 \211\212\213\214 \211\212\213\214 \200\201\215\215 \133\215\221\222", 7, 6);
        drawLine8("\133 \206\207 \133 \133  \215 \133  \215 \133    \133 \223\224", 7, 7);
        drawLine8("\133  \133 \133 \133 \244\216 \133 \244\216 \133\217\220  \133\225\226\227", 7, 8);
        drawLine8("\133 \260\261 \133 \133 \316\133 \133 \316\133 \133    \133 \230\231", 7, 9);
        drawLine8("\252\253\254\255 \262 \263\264\265\266 \263\264\265\266 \252\253\267\267 \133 \232\233", 7, 10);

        drawLine8("WRITTEN BY  ALEXANDER LANG", 7, 13);
        /* drawLine8("GRAPHIX BY  MARTIN    GUTH", 7, 15); */
        drawLine8("GRAPHIX BY  STEFAN  DAHLKE", 7, 15);
        drawLine8("HUMBOLDT-UNIVERSITY     \245\246", 7, 17);
        drawLine8("         BERLIN         \247\250", 7, 18);
        drawLine8("P: PLAY   H: HIGHSCORE", 9, 20);
        drawLine8("L: A LOOK AT THE ROOMS", 9, 22);
        drawLine8("JSv " + digger_version, 5, 25);
        drawLine8("\140 1988", 29, 25);
        drawLine8("by TIKKEL", 5, 26);
        drawLine8("BERLIN", 29, 26);

        drawLine8("\237\243\306\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\310\251\237", 0, 27);
        drawLine8("\237\312\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\314\237", 0, 28);
        drawLine8("\306\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\310", 0, 29);

        //... wenn möglich, schönen Pixelsalat zeichnen
        setpixelated(context_menuimg);

        //kopiere die Grafik aus dem Puffer skaliert (body_width x body_height) in das sichtbare Menu-Canvas (canvas_menuimg)
        context_menuimg.drawImage(menu_canvas, 0, 0, 320, 240, 0, 0, body_width, body_height);
        document.getElementById('menudiv').style.visibility = "visible";

    } else
        setTimeout(drawMenu, 1000);
}

// eine Zeile in den Menu-Puffer
function drawLine8(s, x, y) {
    var sx, sy, dx, dy;
    var pre_w = 8;
    var pre_h = 8;
    for (var i = 0; i < s.length; i++) {
        sx = 0;
        sy = (s.charCodeAt(i) - 32) * 8;
        dx = (x + i) * pre_w;
        dy = y * pre_h;
        //menu_context.globalCompositeOperation = "destination-out";
        menu_context.drawImage(charset, sx, sy, 8, 8, dx, dy, pre_w, pre_h);

    }
}

// SCORELINE
// schreibe Zeichenweise in das Scoreline-Canvas (Leben, Counter, Diamanten ...)
function drawText(s, x, y) {
    var sx, sy, dx, dy;
    for (var i = 0; i < s.length; i++) {
        sx = 0;
        sy = (s.charCodeAt(i) - 32) * pre_icon_size;
        dx = (x + i) * charset_canvas.width;
        dy = y * pre_icon_size;
        //vorskalierte Zeichen aus "charset_canvas" ins sichtbare "canvas_scoreline" zeichnen
        context_scoreline.drawImage(charset_canvas, sx, sy, charset_canvas.width, pre_icon_size, dx, dy, charset_canvas.width, pre_icon_size);
    }
}

// belege die ganze Scoreline vor
function drawHeader() {
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
    drawText("  " + sr + "   " + sl + "\324\325    5000" + "      \326\327" + sd + "    00000     ", 0, 0);
}

charset = new Image();
charset.src = 'charset.png';

spriteset = new Image();
spriteset.src = 'spriteset.png';

//menu_canvas erzeugen
// - offscreen-puffer fuer "canvas_menuimg"
var menu_canvas = document.createElement('canvas');
var menu_context = menu_canvas.getContext('2d', {
    alpha: true
});
menu_canvas.width = 320;
menu_canvas.height = 240;

//charset_canvas erzeugen
// - offscreen-puffer fuer "charset" 
// - soll die korrekt vorscalierten Zeichen (mit KCB_ROT) fuer "canvas_scoreline" enthalten
var charset_canvas = document.createElement('canvas');
var charset_context = charset_canvas.getContext('2d', {
    alpha: true
});

//buffer_canvas erzeugen
// - soll die korrekt-scalierten Sprites enthalten
// - um sie dann performanter im Spielfeld darzustellen
var buffer_canvas = document.createElement('canvas');
var buffer_context = buffer_canvas.getContext('2d', {
    alpha: false
});

function scaleBuffer() {
    // ? alle sprites und charset vorgeladen
    if (spriteset.complete && charset.complete) {

        //Sprites Puffer, 1x40 Sprites
        buffer_canvas.width = pre_icon_size;
        buffer_canvas.height = pre_icon_size * 40;
        //kein Smoothing/Antialiasing
        setpixelated(buffer_context);
        // spriteset skalieren und in "buffer_canvas" schreiben
        buffer_context.drawImage(spriteset, 0, 0, buffer_canvas.width, buffer_canvas.height);
        console.log('buffersize sprites: ' + buffer_canvas.width + 'x' + buffer_canvas.height);

        //Zeichen Puffer
        charset_canvas.width = (body_width / 40) << 0;
        charset_canvas.height = pre_icon_size * 184;
        //kein Smoothing/Antialiasing
        setpixelated(charset_context);
        // charset skalieren und in "charset_canvas" schreiben (mit KCB_ROT #920205)
        charset_context.fillStyle = "#920205";
        charset_context.fillRect(0, 0, charset_canvas.width, charset_canvas.height);
        charset_context.drawImage(charset, 0, 0, charset_canvas.width, charset_canvas.height);
        console.log('buffersize chars: ' + charset_canvas.width + 'x' + charset_canvas.height);

    } else
        setTimeout(scaleBuffer, 1000);
}
