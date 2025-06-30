// jdigger/jdigger.js
// Copyright (C) 2019–2025  Marko Klingner
// GNU GPL v3 - https://www.gnu.org/licenses/gpl-3.0.html

// Wenn moeglich, schoenen Pixelsalat zeichnen
function scale_pixelated(ctx) {
    ctx.imageSmoothingEnabled = false  /* standard */
    ctx.oImageSmoothingEnabled = false  /* Opera */
    ctx.webkitImageSmoothingEnabled = false  /* Safari */
    ctx.msImageSmoothingEnabled = false  /* IE */
}

function scale_init() {
    // Screen Groesse ermitteln
    if (window.innerWidth) {
        body_width = window.innerWidth
        body_height = window.innerHeight
    } else {
        body_width = document.body.offsetHeight
        body_height = document.body.offsetHeight
    }
    console.log('screensize: ' + body_width + 'x' + body_height)

    // Sprite Groesse ermitteln
    let scale_width = (body_width / 20) << 0
    let scale_height = (body_height / 15) << 0
    if (scale_width > scale_height)
        scale = scale_width
    else
        scale = scale_height

    // Div container fuer canvas #digger
    diggerdiv_width = body_width
    diggerdiv_height = body_height - scale

    // Viewport bestimmen
    pre_icon_size = scale
    pre_max_w_offset = -(pre_icon_size * 20 - diggerdiv_width)
    pre_max_h_offset = -(pre_icon_size * 14 - diggerdiv_height)

    // Canvas field Groesse
    field_width = pre_icon_size * 20
    field_height = pre_icon_size * 14
}

function scale_buffer() {
    if (sprites_image.complete && chars_image.complete) {
        // Sprites Puffer-Canvas
        buffer_sprites_canvas.width = pre_icon_size
        buffer_sprites_canvas.height = pre_icon_size * 40
        scale_pixelated(buffer_sprites_context)
        buffer_sprites_context.drawImage(
            sprites_image, 
            0, 0, 
            buffer_sprites_canvas.width, 
            buffer_sprites_canvas.height
        )
        console.log('buffersize sprites: ' + 
                   buffer_sprites_canvas.width + 'x' + 
                   buffer_sprites_canvas.height)

        // Zeichen Puffer-Canvas
        buffer_chars_canvas.width = (body_width / 40) << 0
        buffer_chars_canvas.height = pre_icon_size * 192
        scale_pixelated(buffer_chars_context)
        buffer_chars_context.fillStyle = KCB_ROT
        buffer_chars_context.fillRect(0, 0, 
                                    buffer_chars_canvas.width, 
                                    buffer_chars_canvas.height)
        buffer_chars_context.drawImage(
            chars_image, 
            0, 0, 
            buffer_chars_canvas.width, 
            buffer_chars_canvas.height
        )
        console.log('buffersize chars: ' + 
                   buffer_chars_canvas.width + 'x' + 
                   buffer_chars_canvas.height)
    } else {
        setTimeout(scale_buffer, 1000)
    }
}

function scale_reload() {
    fullscreen_flag = false
    scale_init()
    scale_buffer()

    document.getElementById('menudiv').style.width = body_width + 'px'
    document.getElementById('menudiv').style.height = body_height + 'px'
    document.getElementById('menuimg').width = body_width
    document.getElementById('menuimg').height = body_height
    scale_pixelated(context_menuimg)
    
    if (state == 'menu') {
        menu_draw()
    } else if (state == 'highscore') {
        highscore_draw()
    }
    
    rd_in = false
    rd_yn = false

    document.getElementById('scorelinediv').style.width = body_width + 'px'
    document.getElementById('scorelinediv').style.height = scale + 'px'
    document.getElementById('scoreline').width = body_width
    document.getElementById('scoreline').height = scale
    scoreline_prewrite()

    document.getElementById('diggerdiv').style.width = body_width + 'px'
    document.getElementById('diggerdiv').style.height = (body_height - scale) + 'px'
    document.getElementById('diggerdiv').style.top = scale + 'px'
    document.getElementById('digger').width = field_width
    document.getElementById('digger').height = field_height
    
    for (let l = 1; l < 281; l++) {
        let i = (idx[l] << 0)
        if (idx[l] == i) {
            idx[l] += 0.1
        }
    }
}

function highscore_draw() {
    buffer_menu_context.globalCompositeOperation = "copy"
    buffer_menu_context.fillStyle = KCB_TUERKIS
    buffer_menu_context.fillRect(0, 0, 320, 240)

    if (chars_image.complete) {
        buffer_menu_context.globalCompositeOperation = "destination-out"
        menu_line("HIGHSCORE :", 8, 4)
        menu_line("\217\217\217\217\217\217\217\217\217\217\217", 8, 5)
        storage_highscore_update()

        for (let i = 0; i < 20; i++) {
            menu_line(highscore[i], 10, 7 + i)
        }

        context_menuimg.globalCompositeOperation = "copy"
        context_menuimg.fillStyle = KCF_GELB
        context_menuimg.fillRect(0, 0, body_width, body_height)
        context_menuimg.globalCompositeOperation = "source-over"
        context_menuimg.drawImage(
            buffer_menu_canvas, 
            0, 0, 320, 240, 
            0, 0, body_width, body_height
        )
        document.getElementById('menudiv').style.visibility = "visible"

        if (state == 'input') {
            setTimeout(highscore_input, 50)
        }
    } else {
        setTimeout(menu_draw, 1000)
    }
}

function highscore_input() {
    if (!rd_in) {
        buffer_menu_context.globalCompositeOperation = "destination-out"
        menu_line("...well done, please enter your name :", 1, 2)

        buffer_menu_context.globalCompositeOperation = "source-over"
        buffer_menu_context.fillStyle = KCB_TUERKIS
        buffer_menu_context.fillRect(17 * 8, (7 + input_line) * 8, 15 * 8, 8)
        buffer_menu_context.globalCompositeOperation = "destination-out"
        menu_line(input_alias + "\177", 17, 7 + input_line)

        context_menuimg.globalCompositeOperation = "copy"
        context_menuimg.fillStyle = KCF_GELB
        context_menuimg.fillRect(0, 0, body_width, body_height)
        context_menuimg.globalCompositeOperation = "source-over"
        context_menuimg.drawImage(
            buffer_menu_canvas, 
            0, 0, 320, 240, 
            0, 0, body_width, body_height
        )

        rd_in = true
    }

    if (input != undefined) {
        if (input == 'Enter') {
            rd_in = false
            input = undefined
            handled = true
            highscore[input_line] = highscore[input_line] + "  " + input_alias
            storage_highscore_save()
            setTimeout(highscore_yes_no, 100)
            return
        } else if (input == 'Backspace') {
            if (input_alias.length > 0) {
                input_alias = input_alias.substr(0, input_alias.length - 1)
                rd_in = false
            }
            input = undefined
            handled = true
        } else {
            input_alias = input_alias + input
            rd_in = false
            input = undefined
            handled = true
            if (input_alias.length == 14) {
                highscore[input_line] = highscore[input_line] + "  " + input_alias
                storage_highscore_save()
                setTimeout(highscore_yes_no, 100)
                return
            }
        }
    }

    setTimeout(highscore_input, 50)
}

function highscore_yes_no() {
    if (!rd_yn) {
        buffer_menu_context.globalCompositeOperation = "destination-out"
        menu_line("NEW GAME ? (Y/N)", 12, 28)

        buffer_menu_context.globalCompositeOperation = "source-over"
        buffer_menu_context.fillStyle = KCB_TUERKIS
        buffer_menu_context.fillRect(17 * 8, (7 + input_line) * 8, 15 * 8, 8)
        buffer_menu_context.globalCompositeOperation = "destination-out"
        menu_line(input_alias, 17, 7 + input_line)

        context_menuimg.globalCompositeOperation = "copy"
        context_menuimg.fillStyle = KCF_GELB
        context_menuimg.fillRect(0, 0, body_width, body_height)
        context_menuimg.globalCompositeOperation = "source-over"
        context_menuimg.drawImage(
            buffer_menu_canvas, 
            0, 0, 320, 240, 
            0, 0, body_width, body_height
        )

        rd_yn = true
    }

    switch (input) {
    case 'y':
    case 'Y':
        input_alias = ""
        input_line = 0
        input = undefined
        rd_yn = false
        state = 'init'
        init_room(score_raum)
        handled = true
        document.body.removeEventListener('click', vkb_focus, false)
        document.body.removeEventListener('input', vkb_input, false)
        virt_kbd.blur()
        return
    case 'n':
    case 'N':
        input_alias = ""
        input_line = 0
        input = undefined
        rd_yn = false
        idle_stop()
        state = 'menu'
        menu_draw()
        handled = true
        document.body.removeEventListener('click', vkb_focus, false)
        document.body.removeEventListener('input', vkb_input, false)
        virt_kbd.blur()
        return
    }

    setTimeout(highscore_yes_no, 50)
}

function menu_draw() {
    buffer_menu_context.globalCompositeOperation = "copy"
    buffer_menu_context.fillStyle = KCB_BLAU
    buffer_menu_context.fillRect(0, 0, 320, 240)

    if (chars_image.complete) {
        buffer_menu_context.globalCompositeOperation = "source-over"
        menu_line("\234\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\236", 0, 0)
        menu_line("\237\240\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\241\242\237", 0, 1)
        menu_line("\237\243\234\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\236\251\237", 0, 2)
        
        for (let i = 3; i < 27; i++) {
            menu_line("\237\243\237", 0, i)
            menu_line("\237\251\237", 37, i)
        }
        
        menu_line("\200\201\202\203 \210 \211\212\213\214 \211\212\213\214 \200\201\215\215 \133\215\221\222", 7, 6)
        menu_line("\133 \206\207 \133 \133  \215 \133  \215 \133    \133 \223\224", 7, 7)
        menu_line("\133  \133 \133 \133 \244\216 \133 \244\216 \133\217\220  \133\225\226\227", 7, 8)
        menu_line("\133 \260\261 \133 \133 \316\133 \133 \316\133 \133    \133 \230\231", 7, 9)
        menu_line("\252\253\254\255 \262 \263\264\265\266 \263\264\265\266 \252\253\267\267 \133 \232\233", 7, 10)
        menu_line("WRITTEN BY  ALEXANDER LANG", 7, 13)
        menu_line("GRAPHIX BY  STEFAN  DAHLKE", 7, 15)
        menu_line("HUMBOLDT-UNIVERSITY     \245\246", 7, 17)
        menu_line("         BERLIN         \247\250", 7, 18)
        
        if (gamepad_brand == 'sony') {
            menu_line("\330: PLAY   \333: HIGHSCORE", 9, 20)
            menu_line("\332: A LOOK AT THE ROOMS", 9, 22)
        } else if (gamepad_brand == 'xbox') {
            menu_line("\334: PLAY   \337: HIGHSCORE", 9, 20)
            menu_line("\336: A LOOK AT THE ROOMS", 9, 22)
        } else if (gamepad_brand == 'nintendo') {
            menu_line("\334: PLAY   \337: HIGHSCORE", 9, 20)
            menu_line("\336: A LOOK AT THE ROOMS", 9, 22)
        } else { 
            menu_line("P: PLAY   H: HIGHSCORE", 9, 20)
            menu_line("L: A LOOK AT THE ROOMS", 9, 22)
        }
        
        menu_line("JSv " + digger_version, 5, 25)
        menu_line("\140 1988", 29, 25)
        menu_line("by TIKKEL", 5, 26)
        menu_line("BERLIN", 29, 26)
        menu_line("\237\243\306\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\310\251\237", 0, 27)
        menu_line("\237\312\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\313\314\237", 0, 28)
        menu_line("\306\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\235\310", 0, 29)

        context_menuimg.drawImage(
            buffer_menu_canvas, 
            0, 0, 320, 240, 
            0, 0, body_width, body_height
        )
        document.getElementById('menudiv').style.visibility = "visible"
    } else {
        setTimeout(menu_draw, 1000)
    }
}

function menu_line(s, x, y) {
    let pre_w = 8
    let pre_h = 8
    
    for (let i = 0; i < s.length; i++) {
        let sx = 0
        let sy = (s.charCodeAt(i) - 32) * 8
        let dx = (x + i) * pre_w
        let dy = y * pre_h
        
        buffer_menu_context.drawImage(
            chars_image, 
            sx, sy, 8, 8, 
            dx, dy, pre_w, pre_h
        )
    }
}

function storage_highscore_update() {
    let h
    try {
        if (localStorage.getItem("highscore"))
            highscore = JSON.parse(localStorage.getItem("highscore"))
    } catch (e) {
        let name = "highscore="
        let ca = document.cookie.split(';')
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i]
            while (c.charAt(0) == ' ') {
                c = c.substring(1)
            }
            if (c.indexOf(name) == 0) {
                highscore = JSON.parse(c.substring(name.length, c.length))
            }
        }
    }

    if (highscore[0] == undefined) {
        console.log('storage_highscore_update: generiere Default-Highscore')
        highscore[0] = "10000  --------------"
        highscore[1] = "09000  Digger"
        highscore[2] = "08000  (c) 1988 by"
        highscore[3] = "07000  Alexander Lang"
        highscore[4] = "06000  --------------"
        for (h = 5; h < 20; h++) {
            highscore[h] = "00000"
        }
    }

    for (h = 0; h < 20; h++) {
        if (score_punkte > Number(highscore[h].substring(0, 5))) {
            input_line = h
            for (let m = 19; m > h; m--) {
                highscore[m] = highscore[m - 1]
            }
            let sp = "" + score_punkte
            while (sp.length < 5) {
                sp = "0" + sp
            }
            highscore[h] = sp
            state = 'input'
            break
        }
    }
}

function storage_highscore_save() {
    try {
        localStorage.setItem("highscore", JSON.stringify(highscore))
    } catch (e) {
        let d = new Date()
        d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000))
        let expires = "expires=" + d.toUTCString()
        document.cookie = "highscore=" + JSON.stringify(highscore) + "; " + expires
    }
}

function storage_game_save() {
    try {
        localStorage.setItem("level", score_raum)
        localStorage.setItem("lives", score_leben)
        localStorage.setItem("score", score_punkte)
        console.log('storage_game_save: nach localStorage: Raum:' + 
                   score_raum + ' Leben:' + score_leben + 
                   ' Punkte:' + score_punkte)
    } catch (e) {
        let d = new Date()
        d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000))
        let expires = "expires=" + d.toUTCString()
        document.cookie = "level=" + score_raum + "; " + expires
        document.cookie = "lives=" + score_leben + "; " + expires
        document.cookie = "score=" + score_punkte + "; " + expires
        console.log('storage_game_save: nach Cookies: Raum:' + 
                   score_raum + ' Leben:' + score_leben + 
                   ' Punkte:' + score_punkte)
    }
}

function storage_game_restore() {
    let ca
    let i
    let c
    try {
        if (localStorage.getItem("level"))
            score_raum = Number(localStorage.getItem("level"))
        if (localStorage.getItem("lives"))
            score_leben = Number(localStorage.getItem("lives"))
        if (localStorage.getItem("score"))
            score_punkte = Number(localStorage.getItem("score"))
        console.log('storage_game_restore: von localStorage: Raum:' + 
                   score_raum + ' Leben:' + score_leben + 
                   ' Punkte:' + score_punkte)
    } catch (e) {
        let name = "level="
        ca = document.cookie.split(';')
        for (i = 0; i < ca.length; i++) {
            c = ca[i]
            while (c.charAt(0) == ' ') {
                c = c.substring(1)
            }
            if (c.indexOf(name) == 0) {
                score_raum = Number(c.substring(name.length, c.length))
            }
        }

        name = "lives="
        ca = document.cookie.split(';')
        for (i = 0; i < ca.length; i++) {
            c = ca[i]
            while (c.charAt(0) == ' ') {
                c = c.substring(1)
            }
            if (c.indexOf(name) == 0) {
                score_leben = Number(c.substring(name.length, c.length))
            }
        }

        name = "score="
        ca = document.cookie.split(';')
        for (i = 0; i < ca.length; i++) {
            c = ca[i]
            while (c.charAt(0) == ' ') {
                c = c.substring(1)
            }
            if (c.indexOf(name) == 0) {
                score_punkte = Number(c.substring(name.length, c.length))
            }
        }

        console.log('storage_game_restore: von Cookies: Raum:' + 
                   score_raum + ' Leben:' + score_leben + 
                   ' Punkte:' + score_punkte)
    }
}

function mo_press(ev) {
    if (!fullscreen_flag) fullscreen()

    if (touch_flag) {
        touch_flag = false
        return
    }

    const maus_x = (ev.pageX / (body_width / 40)) << 0
    const maus_y = (ev.pageY / (body_height / 30)) << 0

    const reset_game = () => {
        score_punkte = 0
        score_leben = LEBENMAX
        score_raum = 1
    }

    const handlers = {
        menu: () => {
            try { audio_context.resume() } catch (e) { init_audio() }
            if (maus_y == 20 && maus_x >= 9 && maus_x <= 15) {
                storage_game_restore()
                state = 'init'
                init_room(score_raum)
            } else if (maus_y == 20 && maus_x >= 19 && maus_x <= 30) {
                state = 'highscore'
                highscore_draw()
            } else if (maus_y == 22 && maus_x >= 9 && maus_x <= 30) {
                state = 'look'
                init_room(score_raum)
            }
        },

        look: () => {
            if (score_raum < room.length) {
                score_raum++
                init_room(score_raum)
            } else {
                state = 'menu'
                reset_game()
                init_room(score_raum)
                menu_draw()
            }
        },

        play: () => {
            if (digger_death) {
                if (score_leben < LEBENMIN) {
                    state = 'highscore'
                    highscore_draw()
                    reset_game()
                } else {
                    state = 'init'
                    init_room(score_raum)
                }
                storage_game_save()
            }
        },

        highscore: () => {
            state = 'menu'
            menu_draw()
        }
    }

    if (handlers[state]) {
        handlers[state]()
    }
}

function fullscreen() {
    let i = document.getElementById('body')
    if (i.requestFullscreen) {
        i.requestFullscreen()
        fullscreen_flag = true
    } else if (i.webkitRequestFullscreen) {
        i.webkitRequestFullscreen()
        fullscreen_flag = true
    } else if (i.mozRequestFullScreen) {
        i.mozRequestFullScreen()
        fullscreen_flag = true
    } else if (i.msRequestFullscreen) {
        i.msRequestFullscreen()
        fullscreen_flag = true
    }
}

function exit_fullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen()
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen()
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen()
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen()
    }
}

function idle_start() {
    for (let l = 1; l < 281; l++) {
        if (idx[l] == 41)
            idx[l] = 8.1
    }
    sfx.step = true
    state = 'play'
}

function idle_exit() {
    next_raum = true
}

function idle_stop() {
    window.clearTimeout(verz)
}

function kb_input(taste) {
    if (state == 'input')
        input = taste.key.replace(/[^a-zA-Z0-9!"#$%&()*+,./:;<=>?@\-\s]+/g, '')
}

function vkb_input() {
    if (state == 'input' && (virt_kbd_last_length < virt_kbd.value.length)) {
        input = virt_kbd.value.charAt(virt_kbd.value.length - 1)
                  .replace(/[^a-zA-Z0-9!"#$%&()*+,./:;<=>?@\-\s]+/g, '')
        virt_kbd_last_length = virt_kbd.value.length
    } else {
        input = 'Backspace'
        virt_kbd_last_length = virt_kbd.value.length
    }
}

function vkb_focus() {
    exit_fullscreen()
    virt_kbd.focus()
    virt_kbd.value = ""
    virt_kbd_last_length = -1
}

function init_room(level) {
    console.log('Level: ' + level)
    
    digger_idle = true
    digger_half_step = false
    digger_go = 'NONE'
    digger_is_dead = false
    digger_left = false
    digger_up = false
    digger_right = false
    digger_down = false
    digger_death = false
    
    score_ges = 0
    last_ges = -1
    score_zeit = 5000

    let room_data = room[level - 1]
    let trans_map = {
        0:1.1, 
        1:7.1, 
        2:2.1, 
        3:43.1, 
        5:3.1, 
        6:4.1, 
        7:47.1, 
        9:7.1, 
        10:41.1, 
        11:55.1, 
        12:6.1, 
        14:5.1, 
        15:51.1
    }
    
    let bcd = function(b) { 
        return ((b >> 4) * 10) + (b & 15) 
    }
    
    score_dia = bcd(room_data[139 + 8])
    let geist_nr = 0
    let p = 0
    let j = 1
    
    for (let i = 0; i < 140; i++) {
        let byte_value = room_data[i]
        let nibbles = [byte_value >> 4, byte_value & 15]
        
        for (let n = 0; n < 2; n++) {
            let trans = trans_map[nibbles[n]] !== undefined ? 
                        trans_map[nibbles[n]] : 
                        nibbles[n]
            
            if (trans >= 43 && trans < 63) {
                let ghost_data_idx = 0x94 + (geist_nr >> 1)
                let richtung = p ? 
                    (room_data[ghost_data_idx] & 0x0F) : 
                    (room_data[ghost_data_idx] >> 0x04)
                
                let offsets = [0, 2, 1, 3]
                trans += offsets[richtung] || 0
                
                geist_nr++
                p = 1 - p
            }
            idx[j++] = trans
        }
    }
    
    console.log('gefundene Geister: ' + geist_nr)
    exit_blink = 41
    digger_animation_left = false
    digger_animation_right = false
    digger_animation_up = false
    digger_animation_down = false
    digger_step_left = 13
    digger_step_up = 9
    digger_step_right = 19
    digger_step_down = 11
    
    let d_x = bcd(room_data[139 + 6])
    let d_y = bcd(room_data[139 + 7]) - 2
    d_idx = (d_x + 1) + (d_y * 20)
    digger_x = d_x * pre_icon_size
    digger_y = d_y * pre_icon_size

    scoreline_prewrite()
    document.getElementById('menudiv').style.visibility = "hidden"

    if (state == 'init') {
        verz = setTimeout(idle_start, 3000)
    }
}

function draw_digger_death() {
    let positions = [-21, -20, -19, -1, 0, 1, 19, 20, 21]
    let diamond_indices = [0, 1, 2, 3, 4, 5, 6, 7]

    for (let i = 0; i < positions.length; i++) {
        idx[d_idx + positions[i]] = 
            (diamond_indices.indexOf(i) !== -1 && score_ges > i) ? 
            3.1 : 
            0.1
    }

    idx[d_idx] = 63.1
    digger_is_dead = true
    sfx.diamond = true

    digger_animation_left = false
    digger_animation_right = false
    digger_animation_up = false
    digger_animation_down = false
    digger_step_left = 13
    digger_step_up = 9
    digger_step_right = 19
    digger_step_down = 11
}

function soft_scroll() {
    let pre_abstand = pre_icon_size * 2
    let duration = 90

    if (state == 'look') {
        duration = 15
        if (viewport_x == 0)
            digger_x = field_width
        else
            digger_x = 0
        if (viewport_y == 0)
            digger_y = field_height
        else
            digger_y = 0
    }

    if (((digger_x + viewport_x) < pre_abstand) && 
        (actual_margin_left <= viewport_x) && 
        (viewport_x != 0)) {
        viewport_x = (diggerdiv_width / 2 - digger_x - pre_icon_size / 2) << 0
        if (viewport_x > 0)
            viewport_x = 0
        duration_x = Math.abs(viewport_x - actual_margin_left) / duration / (pre_icon_size / 16)
        canvas_digger.style.transitionDuration = duration_y + "s" + ", " + duration_x + "s"
        canvas_digger.style.marginLeft = viewport_x + "px"
    } else if (((digger_x + pre_icon_size + viewport_x) > (diggerdiv_width - pre_abstand)) && 
               (actual_margin_left >= viewport_x) && 
               (viewport_x != pre_max_w_offset)) {
        viewport_x = (diggerdiv_width / 2 - digger_x - pre_icon_size / 2) << 0
        if (viewport_x < pre_max_w_offset)
            viewport_x = pre_max_w_offset
        if (viewport_x > 0)
            viewport_x = 0
        duration_x = Math.abs(viewport_x - actual_margin_left) / duration / (pre_icon_size / 16)
        canvas_digger.style.transitionDuration = duration_y + "s" + ", " + duration_x + "s"
        canvas_digger.style.marginLeft = viewport_x + "px"
    }

    if (((digger_y + viewport_y) < pre_abstand) && 
        (actual_margin_top <= viewport_y) && 
        (viewport_y != 0)) {
        viewport_y = (diggerdiv_height / 2 - digger_y - pre_icon_size / 2) << 0
        if (viewport_y > 0)
            viewport_y = 0
        duration_y = Math.abs(viewport_y - actual_margin_top) / duration / (pre_icon_size / 16)
        canvas_digger.style.transitionDuration = duration_y + "s" + ", " + duration_x + "s"
        canvas_digger.style.marginTop = viewport_y + "px"
    } else if (((digger_y + pre_icon_size + viewport_y) > (diggerdiv_height - pre_abstand)) && 
               (actual_margin_top >= viewport_y) && 
               (viewport_y != pre_max_h_offset)) {
        viewport_y = (diggerdiv_height / 2 - digger_y - pre_icon_size / 2) << 0
        if (viewport_y < pre_max_h_offset)
            viewport_y = pre_max_h_offset
        if (viewport_y > 0)
            viewport_y = 0
        duration_y = Math.abs(viewport_y - actual_margin_top) / duration / (pre_icon_size / 16)
        canvas_digger.style.transitionDuration = duration_y + "s" + ", " + duration_x + "s"
        canvas_digger.style.marginTop = viewport_y + "px"
    }
}

function draw_field() {
    actual_margin_left = parseInt(
        window.getComputedStyle(canvas_digger).marginLeft, 
        10
    )
    actual_margin_top = parseInt(
        window.getComputedStyle(canvas_digger).marginTop, 
        10
    )
    
    const ghost_set = new Set([
        43.2, 44.2, 45.2, 46.2, 47.2, 48.2, 49.2, 50.2, 
        51.2, 52.2, 53.2, 54.2, 55.2, 56.2, 57.2, 58.2, 
        59.2, 60.2, 61.2, 62.2
    ])
    
    const view_left = -actual_margin_left
    const view_right = diggerdiv_width - actual_margin_left
    const view_top = -actual_margin_top
    const view_bottom = diggerdiv_height - actual_margin_top
    
    for (let l = 1; l < 281; l++) {
        let idx_val = idx[l]
        let i = idx_val << 0
        
        if (!(idx_val > i || idx_val === 3 || idx_val === 41)) continue
        
        if (i > 0 && !ghost_set.has(idx_val)) {
            idx[l] = i
        }
        
        let z = (l - 1) / 20 << 0
        let s = (l - 1) - (z * 20)
        let y = z * pre_icon_size
        let x = s * pre_icon_size
        
        if (i === 3) {
            i = diamond_blink + (z * 6) - ((z * 6 / 10) << 0) * 10
            if (i > 73) i -= 10
        }
        
        if (i === 41) {
            i = exit_blink << 0
        }
        
        if (i > 7 && i < 41) {
            digger_x = x
            digger_y = y
        }
        
        if (i < 64 || 
            (x + pre_icon_size >= view_left && 
             x <= view_right && 
             y + pre_icon_size >= view_top && 
             y <= view_bottom)) {
            context_digger.drawImage(
                buffer_sprites_canvas, 
                0, 
                sprites[i] * pre_icon_size, 
                pre_icon_size, 
                pre_icon_size, 
                x, 
                y, 
                pre_icon_size, 
                pre_icon_size
            )
        }
    }
}

function scoreline_char(s, x, y) {
    for (let i = 0; i < s.length; i++) {
        const sx = 0
        const sy = (s.charCodeAt(i) - 32) * pre_icon_size
        const dx = (x + i) * buffer_chars_canvas.width
        const dy = y * pre_icon_size

        context_scoreline.drawImage(
            buffer_chars_canvas,
            sx, 
            sy,
            buffer_chars_canvas.width, 
            pre_icon_size,
            dx, 
            dy,
            buffer_chars_canvas.width, 
            pre_icon_size
        )
    }
}

function scoreline_prewrite() {
    const PADDING = 2
    const SCORE_LENGTH = 5
    const LIFE_LENGTH = 2
    const DIAMOND_LENGTH = 2

    let sr = score_raum.toString().padStart(LIFE_LENGTH, '0')
    let sl = score_leben.toString().padStart(LIFE_LENGTH, '0')
    let sd = score_dia.toString().padStart(DIAMOND_LENGTH, '0')

    scoreline_char(
        "  " + sr + "   " + sl + "\324\325    5000" + 
        "      \326\327" + sd + "              ", 
        0, 
        0
    )
    
    last_ges = score_ges - 1
    last_punkte = score_punkte - 1
}

function scoreline_update() {
    const LIFE_LENGTH = 2
    const TIME_LENGTH = 4
    const DIAMOND_LENGTH = 2
    const SCORE_LENGTH = 5

    if (digger_death) {
        let sl = score_leben.toString().padStart(LIFE_LENGTH, '0')
        scoreline_char(sl, 7, 0)
    }

    let sz = score_zeit.toString().padStart(TIME_LENGTH, '0')
    if (score_zeit < 1000 && (score_zeit % 4) <= 1 && score_zeit !== 0) {
        sz = "    "
    }
    scoreline_char(sz, 15, 0)

    if (score_ges !== last_ges) {
        let sg = score_ges.toString().padStart(DIAMOND_LENGTH, '0')
        scoreline_char(sg, 23, 0)
        last_ges = score_ges
    }

    if (autoscore > 0) {
        score_punkte += 5
        autoscore -= 5
        sfx.stone = true
    }
    if (score_punkte !== last_punkte) {
        let sp = score_punkte.toString().padStart(SCORE_LENGTH, '0')
        scoreline_char(sp, 33, 0)
        last_punkte = score_punkte
    }
}

function draw_frame1() {
    if (state === 'play' && !digger_death && !digger_idle && digger_go === 'NONE') {
        idx[d_idx] = 8.1
        digger_step_left = 13
        digger_step_up = 9
        digger_step_right = 19
        digger_step_down = 11
        digger_animation_left = false
        digger_animation_right = false
        digger_animation_up = false
        digger_animation_down = false
        digger_idle = true
    }

    if (state === 'play' && !digger_death && !digger_idle) {
        if (stone_l && digger_go !== 'LEFT') stone_l = false
        if (stone_r && digger_go !== 'RIGHT') stone_r = false
        
        const directions = {
            'LEFT': { 
                offset: -1, 
                stone_offset: -2, 
                stone_flag: 'stone_l', 
                step_var: 'digger_step_left', 
                step_init: 13, 
                anim_flag: 'digger_animation_left' 
            },
            'UP': { 
                offset: -20, 
                stone_offset: null, 
                stone_flag: null,
                step_var: 'digger_step_up', 
                step_init: 9, 
                anim_flag: 'digger_animation_up' 
            },
            'RIGHT': { 
                offset: 1, 
                stone_offset: 2, 
                stone_flag: 'stone_r',
                step_var: 'digger_step_right', 
                step_init: 19, 
                anim_flag: 'digger_animation_right' 
            },
            'DOWN': { 
                offset: 20, 
                stone_offset: null, 
                stone_flag: null,
                step_var: 'digger_step_down', 
                step_init: 11, 
                anim_flag: 'digger_animation_down' 
            }
        }
        
        const dir = directions[digger_go]
        if (dir) {
            const target_idx = d_idx + dir.offset
            const target_val = idx[target_idx]
            
            if (target_val === 3) {
                score_ges++
                score_punkte += 3
                sfx.diamond = true
            } else if (target_val === 41) {
                autoscore = 100
                state = 'init'
                verz = window.setTimeout(idle_exit, 3000)
            } else if (target_val >= 43 && target_val < 63) {
                digger_death = true
            }
            
            if (target_val === 7 && dir.stone_offset) {
                if (idx[d_idx + dir.stone_offset] === 1) {
                    const stone_flag = window[dir.stone_flag]
                    if (stone_flag) {
                        idx[d_idx + dir.stone_offset] = 7.1
                        idx[target_idx] = 1.1
                        window[dir.stone_flag] = false
                        brumm = true
                    } else {
                        window[dir.stone_flag] = true
                    }
                }
            }
            
            if (target_val < 4 || 
                target_val === 41 || 
                (target_val === 7 && dir.stone_offset && idx[target_idx] === 1.1)) {
                idx[d_idx] = 1.1
                d_idx += dir.offset
                sfx.step = true
            }
            
            if (window[dir.step_var] === dir.step_init) {
                digger_animation_left = false
                digger_animation_right = false
                digger_animation_up = false
                digger_animation_down = false
                window[dir.anim_flag] = true
                digger_step_left = 13
                digger_step_up = 9
                digger_step_right = 19
                digger_step_down = 11
            }
        }
    }

    if (digger_animation_left) {
        idx[d_idx] = digger_step_left + 0.1
        digger_step_left = digger_step_left === 18 ? 13 : digger_step_left + 1
    } else if (digger_animation_right) {
        idx[d_idx] = digger_step_right + 0.1
        digger_step_right = digger_step_right === 24 ? 19 : digger_step_right + 1
    }
    
    if (digger_animation_up) {
        idx[d_idx] = digger_step_up + 0.1
        digger_step_up = digger_step_up === 10 ? 9 : digger_step_up + 1
    } else if (digger_animation_down) {
        idx[d_idx] = digger_step_down + 0.1
        digger_step_down = digger_step_down === 12 ? 11 : digger_step_down + 1
    }

    if (state == 'play') {
        if (digger_idle) {
            zufall = (zufall % 280) + 1
            if (!digger_in_idle) {
                const zufalls_wert = idx[zufall]
                if (zufalls_wert === 7) {
                    digger_idle_augen = 24
                    digger_in_idle = true
                    idle_augen = true
                } else if (zufalls_wert === 3) {
                    digger_idle_stampfen = 32
                    digger_in_idle = true
                    idle_augen = false
                }
            }
            
            if (digger_in_idle) {
                if (idle_augen) {
                    if (++digger_idle_augen === 33) {
                        digger_in_idle = false
                    }
                } else {
                    if (++digger_idle_stampfen === 41) {
                        digger_in_idle = false
                    }
                }
            }
        } else {
            digger_in_idle = false
        }
        
        if (digger_in_idle && !digger_death) {
            idx[d_idx] = (idle_augen ? 
                         digger_idle_augen : 
                         digger_idle_stampfen) + 0.1
        }

        for (let l = 1; l < 281; l++) {
            // ... (Geister, Steine und Diamanten Logik)
        }
    }

    if (next_raum) {
        if (score_raum == room.length) {
            state = 'highscore'
            highscore_draw()
            score_raum = 1
            score_leben = LEBENMAX
            score_punkte = 0
        } else {
            score_raum++
            state = 'init'
            init_room(score_raum)
        }
        next_raum = false
        storage_game_save()
    }

    scoreline_update()
    soft_scroll()

    if (sfx.diamond) {
        play_audio('Diamond')
    } else if (sfx.stone) {
        play_audio('Stone')
        brumm = true
    } else if (sfx.step) {
        play_audio('Step')
    }
    sfx.diamond = false
    sfx.step = false
    sfx.stone = false

    if (brumm) {
        if (gamepad_dualrumble) {
            navigator.getGamepads()[0].vibrationActuator.playEffect(
                "dual-rumble", 
                {
                    startDelay:0,
                    duration:48,
                    weakMagnitude:1.0,
                    strongMagnitude:0.0
                }
            )
        } else if (navigator.vibrate) {
            navigator.vibrate([50, 20, 50, 20, 50, 20, 30, 20, 20])
        }
        brumm = false
    }

    if (digger_death && !digger_is_dead) {
        draw_digger_death()
        digger_go = 'NONE'
        score_leben--
        storage_game_save()
    }

    digger_half_step = true
    digger_start_up = false
    digger_start_down = false
    digger_start_left = false
    digger_start_right = false
}

function draw_frame2() {
    if (digger_animation_left) {
        idx[d_idx] = digger_step_left + 0.1
        digger_step_left++
        if (digger_step_left > 18)
            digger_step_left = 13
    } else if (digger_animation_right) {
        idx[d_idx] = digger_step_right + 0.1
        digger_step_right++
        if (digger_step_right > 24)
            digger_step_right = 19
    }

    digger_half_step = false
}

function game_loop() {
    gamepad_update()

    if (state == 'look' || state == 'init' || state == 'play') {
        if (takt_teiler == 1) {
            if (!digger_half_step) {
                draw_frame1()
            } else {
                draw_frame2()
            }

            if ((state == 'play') && !digger_death) {
                score_zeit--
                if (score_zeit <= 0)
                    digger_death = true
            }
        }

        requestAnimationFrame(draw_field)

        diamond_blink++
        if (diamond_blink > (64 + max_diamond_blink - 1))
            diamond_blink = 64

        exit_blink += 0.05
        if (exit_blink > 43)
            exit_blink = 41
    }

    if (takt_teiler == 1)
        takt_teiler = 2
    else if (takt_teiler == 2)
        takt_teiler = 1

    setTimeout(game_loop, FPS)
}

function init_events() {
    document.body.addEventListener('touchstart', touch_down, false)
    document.body.addEventListener('touchend', touch_up, false)
    document.body.addEventListener('touchcancel', touch_up, false)
    document.body.addEventListener('touchmove', touch_xy, true)
    document.body.style.touchAction = 'manipulation'

    document.body.addEventListener('click', mo_press, false)
    document.body.addEventListener('keydown', kb_press, false)
    document.body.addEventListener('keyup', kb_release, false)
    document.body.addEventListener('keypress', kb_input, false)

    window.addEventListener('resize', scale_reload, false)

    if (navigator.getGamepads) {
        window.addEventListener('gamepadconnected', gamepad_connect, false)
        window.addEventListener('gamepaddisconnected', gamepad_disconnect, false)
    }
}

scale_reload()
game_loop()
init_events()