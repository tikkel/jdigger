

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
var digger_version = '20.11.09';
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
var score_dia = 0;
var score_ges = 0;
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

var action = 0;
var laction = 0;

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

var viewport_x = 0;
var viewport_y = 0;
var actual_marginLeft = 0;
var actual_marginTop = 0;
var duration_x = 0;
var duration_y = 0;

function set_scale() {

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

function reset_scale() {

    //Fullscreen wieder ermöglichen
    fullscreen_flag = false;

    // Scalierfaktor aktualisieren
    set_scale();

    // Puffer refreshen (Sprites and Chars)
    scaleBuffer();
    context_digger.scale(0.5, 0.5);

    // Menu refreshen
    document.getElementById('menudiv').style.width = (body_width) + 'px';
    document.getElementById('menudiv').style.height = (body_height) + 'px';
    document.getElementById('menuimg').width = body_width;
    document.getElementById('menuimg').height = body_height;
    if (state == 'menu')
        drawMenu();
    else if (state == 'highscore')
        drawHighscore();
    rd_in = false;
    rd_yn = false;

    // Scoreline refreshen
    document.getElementById('scorelinediv').style.width = (body_width) + 'px';
    document.getElementById('scorelinediv').style.height = (scale) + 'px';
    document.getElementById('scoreline').width = body_width;
    document.getElementById('scoreline').height = scale;
    draw_header();

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
        if (idx[l] == i) {
            idx[l] += 0.1;
        }

    }

}
