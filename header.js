

//     jdigger/Digger.JS
//     Copyright (C) 2017  Marko Klingner
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


//Parameter
var LEBENMAX = 20;
var LEBENMIN = 1;
var FPS = 27; //Interruptschleife in Millisekunden, siehe setTimeout(draw_frame, FPS), 27ms^37Hz

//allgem. Variablen
var digger_version = '20.11.21';
var exit_blink = 41.1;
var diamond_blink = 64;
var zufall = 1;
var stone_l = false;
var stone_r = false;
var digger_idle_augen = 25;
var digger_idle_eier = 33;
var digger_step_up = 9;
var digger_step_down = 11;
var digger_step_left = 13;
var digger_step_right = 19;

var ton_schritt = false;
var ton_stein = false;
var ton_diamant = false;
var brumm = false;

var next_raum = false;
var verz = 0; //10 Sek. Verzoegerung
var state = 'menu'; //look, menu, init, play, highscore, input
var idx = new Array(281);
var d_idx = 280;

var score_raum = 1;
var score_leben = LEBENMAX;
var score_zeit = 1500;
var score_punkte = 0;
var last_punkte = 0;
var score_dia = 0;
var score_ges = 0;
var last_ges = 0;
var highscore = new Array(20);
var digger_x = 0;
var digger_y = 0;
var digger_left = false;
var digger_start_left = false;
var digger_up = false;
var digger_start_up = false;
var digger_right = false;
var digger_start_right = false;
var digger_down = false;
var digger_start_down = false;
var digger_idle = true;
var digger_in_idle = false;
var digger_animation_left = false;
var digger_animation_right = false;
var digger_animation_up = false;
var digger_animation_down = false;

var backup_left = digger_left;
var backup_up = digger_up;
var backup_right = digger_right;
var backup_down = digger_down;
var backup_idle = digger_idle;

var digger_cheat = false;
var cheat_tmp = '';
var digger_half_step = false;
var takt_teiler = 1; //siehe setTimeout(draw_frame, FPS)
var digger_go = 'NONE'; //LEFT, RIGHT, UP, DOWN, NONE
var digger_death = false;
var digger_is_dead = false;

var input;
var input_line = 0;
var input_alias = "";
var taste = 0;
var ptaste = 0; //pressed-taste
var lptaste = 0; //last-pressed-taste
var llptaste = 0;
var lllptaste = 0;
var rtaste = 0; //released-taste
var handled = true;
var virt_kbd_last_length;
var touchX;
var touchY;
var direction = 'stop';
var ldirection = 'stop';
var touch_flag = false;
var fullscreen_flag = false;
var single_touch = 0;
var mouseIsDown = false;
var joyOn = false;
var joyX = 0;
var joyY = 0;

var action = 0;
var laction = 0;

//KC-Farben
var KCB_TUERKIS = "#028965";
var KCF_GELB    = "#E7E95D";
var KCB_BLAU    = "#04028f";
var KCB_ROT     = "#920205";

var diggerdiv_height = 14;
var diggerdiv_width = 20;
var scale = 1;

var pre_icon_size = scale;
var pre_max_w_offset = -(pre_icon_size * 20 - diggerdiv_width);
var pre_max_h_offset = -(pre_icon_size * 14 - diggerdiv_height);

var body_width;
var body_height;
var field_width;
var field_height;

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
    1, //42=Nothing

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

var rd_in = false; //Highscore Input
var rd_yn = false; //Highscore YesNo

var viewport_x = 0;
var viewport_y = 0;
var actual_marginLeft = 0;
var actual_marginTop = 0;
var duration_x = 0;
var duration_y = 0;

var canvas_scoreline = document.getElementById('scoreline');
var context_scoreline = canvas_scoreline.getContext('2d', {alpha: false});

var canvas_digger = document.getElementById('digger');
var context_digger = canvas_digger.getContext('2d', {alpha: false});

var canvas_menuimg = document.getElementById('menuimg');
var context_menuimg = canvas_menuimg.getContext('2d', {alpha: false});

//Offscreen-Buffer fuer "Menu/Highscore"
// - wird den Vorgerenderten Titelscreen oder Highscore enthalten
var menu_canvas = document.createElement('canvas');
var menu_context = menu_canvas.getContext('2d', {alpha: true});
// - in original KC85/3/4-Auflösung
menu_canvas.width = 320;
menu_canvas.height = 240;

//Offscreen-Buffer fuer "Zeichensatz"
// - soll die korrekt vorskalierten Zeichen enthalten
// - mit KCB_ROT als Hintergrundfarbe
var charset_canvas = document.createElement('canvas');
var charset_context = charset_canvas.getContext('2d', {alpha: true});

//Offscreen-Buffer fuer "Sprites"
// - soll die korrekt vorskalierten Sprites enthalten
// - um sie dann performanter im Spielfeld darzustellen
var buffer_canvas = document.createElement('canvas');
var buffer_context = buffer_canvas.getContext('2d', {alpha: false});

//"Zeichensatz" laden
charset = new Image();
charset.src = 'charset.png';

//"Sprites" laden
spriteset = new Image();
spriteset.src = 'spriteset.png';
