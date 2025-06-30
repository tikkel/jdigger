// SPDX-License-Identifier: GPL-3.0
// jdigger/touch.js - TouchSteuerung auf Smartphone/Tablet
// Copyright (C) 2019–2025  Marko Klingner

function touch_down(e) {
	touch_flag = true
	const touches = e.touches.length

	/* 3 Finger Tap (Abbruch und zurück zum Menü) */
	if (touches > 2) {
		if (state === 'play' || state === 'init') {
			idle_stop()
			state = 'menu'
			score_punkte = 0
			score_leben = LEBENMAX
			score_raum = 1
			storage_game_save()
			init_room(score_raum)
			menu_draw()
		}
	/* 2 Finger Tap (Abbruch und Level neu starten) */
	} else if (touches > 1) {
		if (state === 'play')
			digger_death = true
		else if (state === 'highscore' || state === 'look') {
			state = 'menu'
			menu_draw()
		}
	/* 1 Finger Tap - im Spiel und tot */
	} else if (state === 'play' && digger_death) {
		if (score_leben < LEBENMIN) {
			const body = document.body
			body.removeEventListener('click', vkb_focus, false)
			body.addEventListener('click', vkb_focus, false)
			body.removeEventListener('input', vkb_input, false)
			body.addEventListener('input', vkb_input, false)
			state = 'highscore'
			highscore_draw()
			score_punkte = 0
			score_leben = LEBENMAX
			score_raum = 1
		} else {
			state = 'init'
			init_room(score_raum)
		}
		storage_game_save()
	/* Im Spiel - Richtungsgesten */
	} else {
		mouse_is_down = joy_on = true
		touch_xy(e)
	}
}

function touch_up(e) {
	/* Im Menu */
	if (state === 'menu' && single_touch === 0) {
		try {
			audio_context.resume()
		} catch (err) {
			init_audio()
		}

		/* iOS: Initiiere Sound von Benutzergeste aus */
		play_audio('Leer')

		const touch = e.changedTouches[0]
		const touch_s = touch.pageX / (body_width / 40) << 0
		const touch_z = touch.pageY / (body_height / 30) << 0

		/* P: Play */
		if (touch_s >= 9 && touch_s <= 15 && touch_z === 20) {
			storage_game_restore()
			state = 'init'
			init_room(score_raum)
		/* H: Highscore */
		} else if (touch_s >= 19 && touch_s <= 30 && touch_z === 20) {
			state = 'highscore'
			highscore_draw()
		/* L: Look at the rooms */
		} else if (touch_s >= 9 && touch_s <= 30 && touch_z === 22) {
			state = 'look'
			init_room(score_raum)
		}
	/* Im Look */
	} else if (state === 'look') {
		if (score_raum < room.length) {
			score_raum++
			init_room(score_raum)
		} else {
			state = 'menu'
			score_punkte = 0
			score_leben = LEBENMAX
			score_raum = 1
			init_room(score_raum)
			menu_draw()
		}
	/* Im Highscore */
	} else if (state === 'highscore') {
		state = 'menu'
		menu_draw()
	}

	mouse_is_down = false
	direction = 'stop'
	set_pos()
	single_touch = e.touches.length
}

function touch_xy(e) {
	/* iOS: Scrolling verhindern */
	e.preventDefault()

	touch_x = e.targetTouches[0].pageX
	touch_y = e.targetTouches[0].pageY
	if (joy_on) {
		joy_x = touch_x
		joy_y = touch_y
		joy_on = false
	}
	set_pos()
}

function set_pos() {
	if (mouse_is_down) {
		const delta_x = joy_x - touch_x
		const delta_y = joy_y - touch_y

		/* Richtung basierend auf Bewegungsdelta */
		if (delta_x < -30 && direction !== 'rechts') {
			direction = 'rechts'
			joy_x = touch_x
			joy_y = touch_y
		} else if (delta_x > 30 && direction !== 'links') {
			direction = 'links'
			joy_x = touch_x
			joy_y = touch_y
		} else if (delta_y < -30 && direction !== 'runter') {
			direction = 'runter'
			joy_x = touch_x
			joy_y = touch_y
		} else if (delta_y > 30 && direction !== 'hoch') {
			direction = 'hoch'
			joy_x = touch_x
			joy_y = touch_y
		}
	}

	/* Keyboard-Events bei Richtungsänderung */
	if (direction !== last_direction) {
		const actions = {
			'links': kb_press_left,
			'rechts': kb_press_right,
			'hoch': kb_press_up,
			'runter': kb_press_down,
			'stop': kb_release_all
		}
		actions[direction]()
		last_direction = direction
	}
}

function touch_cancel(e) {
	mouse_is_down = false
	direction = 'stop'
	joy_on = false
	touch_flag = false
	set_pos()
	single_touch = 0
}
