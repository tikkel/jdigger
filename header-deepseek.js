// jdigger/header.js
// Copyright (C) 2017–2025  Marko Klingner
// GNU GPL v3 - http://www.gnu.org/licenses/

// Parameter
const LEBENMAX = 20
const LEBENMIN = 1
const FPS = 27  // Interruptschleife in Millisekunden

// Allgemeine Variablen
let digger_version = '30.06.25'
let exit_blink = 41.1
let diamond_blink = 64
let zufall = 1
let stone_l = false
let stone_r = false
let digger_idle_augen = 25
let digger_idle_stampfen = 33
let digger_step_up = 9
let digger_step_down = 11
let digger_step_left = 13
let digger_step_right = 19

let sfx = { 
    step: false, 
    stone: false, 
    diamond: false 
}
let brumm = false

let next_raum = false
let verz = 0  // 10 Sek. Verzoegerung
let state = 'menu'  // look, menu, init, play, highscore, input
let idx = new Array(281)
let d_idx = 280

let score_raum = 1
let score_leben = LEBENMAX
let score_zeit = 1500
let score_punkte = 0
let autoscore = 0
let last_punkte = 0
let score_dia = 0
let score_ges = 0
let last_ges = 0
let highscore = new Array(20)
let digger_x = 0
let digger_y = 0
let digger_left = false
let digger_start_left = false
let digger_up = false
let digger_start_up = false
let digger_right = false
let digger_start_right = false
let digger_down = false
let digger_start_down = false
let digger_idle = true
let digger_in_idle = false
let digger_animation_left = false
let digger_animation_right = false
let digger_animation_up = false
let digger_animation_down = false

let backup_left = digger_left
let backup_up = digger_up
let backup_right = digger_right
let backup_down = digger_down
let backup_idle = digger_idle

let digger_cheat = false
let cheat_tmp = ''
let digger_half_step = false
let takt_teiler = 1  // siehe setTimeout(draw_frame, FPS)
let digger_go = 'NONE'  // LEFT, RIGHT, UP, DOWN, NONE
let digger_death = false
let digger_is_dead = false

let input
let input_line = 0
let input_alias = ""
let taste = 0
let ptaste = 0  // pressed-taste
let lptaste = 0  // last-pressed-taste
let llptaste = 0
let lllptaste = 0
let rtaste = 0  // released-taste
let handled = true
let virt_kbd_last_length
let touch_x
let touch_y
let direction = 'stop'
let last_direction = 'stop'
let touch_flag = false
let fullscreen_flag = false
let single_touch = 0
let mouse_is_down = false
let joy_on = false
let joy_x = 0
let joy_y = 0

let action = 0
let laction = 0

// KC-Farben
const KCB_TUERKIS = "#028965"
const KCF_GELB = "#E7E95D"
const KCB_BLAU = "#04028f"
const KCB_ROT = "#920205"

let diggerdiv_height = 14
let diggerdiv_width = 20
let scale = 1

let pre_icon_size = scale
let pre_max_w_offset = -(pre_icon_size * 20 - diggerdiv_width)
let pre_max_h_offset = -(pre_icon_size * 14 - diggerdiv_height)

let body_width
let body_height
let field_width
let field_height

let rescale = false

let max_diamond_blink = 10
let sprites = [
    0,   // 0=Explode
    1,   // 1=Nothing
    2,   // 2=Ground
    3,   // 3=Diamant
    4,   // 4=Wall
    5,   // 5=Changer
    4,   // 6=Exit, zu Anfangs Wall
    7,   // 7=Stein
    37,  // 8=Digger
    30,  // 9=Digger up1 Laufanimation hoch
    31,  // 10=Digger up2
    32,  // 11=Digger down1 Laufanimation runter
    33,  // 12=Digger down2
    21,  //13 Laufanimation links
    20,  //14
    21,  //15
    22,  //16
    23,  //17
    22,  //18
    25,  //19 Laufanimation rechts
    24,  //20
    25,  //21
    26,  //22
    27,  //23
    26,  //24
    35,  //eye1 Idle Animation Augenblinzeln
    36,  //eye2
    35,  //eye1
    37,  //digger
    35,  //eye1
    36,  //eye2
    35,  //eye1
    37,  //digger
    34,  //foot Idle Animation Fussstampfen
    34,  //foot
    34,  //foot
    37,  //digger
    34,  //foot
    37,  //digger
    34,  //foot
    37,  //digger
    6,   //41=Exit blinkender Ausgang
    1,   //42=Nothing
    38,  //43 down 180
    29,  //44 right
    39,  //45 up
    28,  //46 left
    38,  //47 down 90l
    29,  //48 right
    39,  //49 up
    28,  //50 left
    38,  //51 down 90r
    29,  //52 right
    39,  //53 up
    28,  //54 left
    38,  //55 down 90lr
    29,  //56 right
    39,  //57 up
    28,  //58 left
    38,  //59 down 90rl
    29,  //60 right
    39,  //61 up
    28,  //62 left
    8,   //63 Kreuz
    10,  //64 Diamanten Animation
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19   //73 == sprites.length-1
]

let rd_in = false  // Highscore Input
let rd_yn = false  // Highscore YesNo

let viewport_x = 0
let viewport_y = 0
let actual_margin_left = 0
let actual_margin_top = 0
let duration_x = 0
let duration_y = 0

let canvas_scoreline = document.getElementById('scoreline')
let context_scoreline = canvas_scoreline.getContext('2d', { alpha: false })

let canvas_digger = document.getElementById('digger')
let context_digger = canvas_digger.getContext('2d', { alpha: false })

let canvas_menuimg = document.getElementById('menuimg')
let context_menuimg = canvas_menuimg.getContext('2d', { alpha: false })

// Offscreen-Buffer fuer "Menu/Highscore"
let buffer_menu_canvas = document.createElement('canvas')
let buffer_menu_context = buffer_menu_canvas.getContext('2d', { alpha: true })
buffer_menu_canvas.width = 320
buffer_menu_canvas.height = 240

// Offscreen-Buffer fuer "Zeichensatz"
let buffer_chars_canvas = document.createElement('canvas')
let buffer_chars_context = buffer_chars_canvas.getContext('2d', { alpha: true })

// Offscreen-Buffer fuer "Sprites"
let buffer_sprites_canvas = document.createElement('canvas')
let buffer_sprites_context = buffer_sprites_canvas.getContext('2d', { alpha: false })

// "Zeichensatz" laden
let chars_image = new Image()
chars_image.src = 'chars.png'

// "Sprites" laden
let sprites_image = new Image()
sprites_image.src = 'sprites.png'