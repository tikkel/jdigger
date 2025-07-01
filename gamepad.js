// SPDX-License-Identifier: GPL-3.0
// jdigger/gamepad.js - Gamepad Steuerung
// Copyright (C) 2022–2025  Marko Klingner

/* Gamepad State Variablen */
var gamepad_connected = false
var gamepad_type = 'none'
var gamepad_brand = 'keyboard'
var gamepad_dualrumble = false
var gamepad_index = 0

/* Button States */
var prev_buttons = {
	left: false, right: false, up: false, down: false,
	A: false, B: false, X: false, Y: false, L1: false, R1: false
}
var curr_buttons = {
	left: false, right: false, up: false, down: false,
	A: false, B: false, X: false, Y: false, L1: false, R1: false
}

/* Controller-Typen mit Button-Mapping */
var CONTROLLER_TYPES = {
	xbox: {
		name: 'Xbox',
		patterns: ['xbox', '045e', 'microsoft'],
		buttons: { action: 1, back: 0, option1: 3, option2: 2, shoulder_l: 4, shoulder_r: 5 }
	},
	sony: {
		name: 'PlayStation',
		patterns: ['054c', 'sony', 'playstation', 'dualshock', 'dualsense'],
		buttons: { action: 1, back: 0, option1: 2, option2: 3, shoulder_l: 4, shoulder_r: 5 }
	},
	nintendo: {
		name: 'Nintendo',
		patterns: ['nintendo', 'switch', 'joy-con', '057e'],
		buttons: { action: 1, back: 0, option1: 3, option2: 2, shoulder_l: 4, shoulder_r: 5 }
	},
	generic: {
		name: 'Generic',
		patterns: ['generic', 'unknown'],
		buttons: { action: 0, back: 1, option1: 3, option2: 2, shoulder_l: 4, shoulder_r: 5 }
	}
}

var current_controller = CONTROLLER_TYPES.xbox

/* Richtungserkennung für verschiedene Gamepad-Typen */
function gamepad_get_directions(gp) {
	var left = false, right = false, up = false, down = false

	switch (gamepad_type) {
		case '8axes':
			/* Prüfe alle 3 möglichen Achsenpaare */
			for (let i = 0; i < 6; i += 3) {
				left = left || gp.axes[i] < -0.5
				right = right || gp.axes[i] > 0.5
				up = up || gp.axes[i + 1] < -0.5
				down = down || gp.axes[i + 1] > 0.5
			}
			break

		case '4axes':
			/* D-Pad Buttons + Analoge Sticks */
			left = gp.buttons[14]?.pressed || gp.axes[0] < -0.5 || gp.axes[2] < -0.5
			right = gp.buttons[15]?.pressed || gp.axes[0] > 0.5 || gp.axes[2] > 0.5
			up = gp.buttons[12]?.pressed || gp.axes[1] < -0.5 || gp.axes[3] < -0.5
			down = gp.buttons[13]?.pressed || gp.axes[1] > 0.5 || gp.axes[3] > 0.5
			break

		case '2axes':
			left = gp.axes[0] < -0.5
			right = gp.axes[0] > 0.5
			up = gp.axes[1] < -0.5
			down = gp.axes[1] > 0.5
			break
	}

	return { left, right, up, down }
}

/* Button-Prüfung */
function is_button_pressed(gamepad, button_function) {
	const button_index = current_controller.buttons[button_function]
	return gamepad.buttons[button_index]?.pressed || gamepad.buttons[button_index]?.value > 0.5
}

/* State-Verwaltung */
function update_button_states() {
	Object.assign(prev_buttons, curr_buttons)
}

function check_button_press(button) {
	return curr_buttons[button] && !prev_buttons[button]
}

function check_button_release(button) {
	return !curr_buttons[button] && prev_buttons[button]
}

/* Movement-Behandlung */
function gamepad_handle_movement() {
	const movements = [
		{ curr: 'left', prev: 'left', press: kb_press_left, release: kb_release_left },
		{ curr: 'right', prev: 'right', press: kb_press_right, release: kb_release_right },
		{ curr: 'up', prev: 'up', press: kb_press_up, release: kb_release_up },
		{ curr: 'down', prev: 'down', press: kb_press_down, release: kb_release_down }
	]

	movements.forEach(({ curr, prev, press, release }) => {
		if (curr_buttons[curr] && !prev_buttons[prev])
			press()
		else if (!curr_buttons[curr] && prev_buttons[prev])
			release()
	})
}

/* Action-Handler für verschiedene Game-States */
var ACTION_HANDLERS = {
	play: function() {
		gamepad_handle_movement()

		if (check_button_press('B')) {
			if (digger_death) {
				if (score_leben < LEBENMIN) {
					state = 'highscore'
					highscore_draw()
				} else {
					state = 'init'
					init_room(score_raum)
				}
				storage_game_save()
			} else {
				digger_death = true
			}
		}

		if (check_button_press('A'))
			gamepad_back_to_menu()
	},

	init: function() {
		if (check_button_press('A'))
			gamepad_back_to_menu()
	},

	menu: function() {
		if (check_button_press('B')) {
			storage_game_restore()
			state = 'init'
			init_room(score_raum)
		}
		if (check_button_press('X')) {
			state = 'highscore'
			highscore_draw()
		}
		if (check_button_press('Y')) {
			state = 'look'
			storage_game_restore()
			init_room(score_raum)
		}
	},

	look: function() {
		if ((check_button_press('Y') || check_button_press('R1')) && score_raum < room.length) {
			score_raum++
			init_room(score_raum)
		}
		if (check_button_press('L1') && score_raum > 1) {
			score_raum--
			init_room(score_raum)
		}
		if (check_button_press('A')) {
			state = 'menu'
			menu_draw()
		}
	},

	highscore: function() {
		if (check_button_press('A')) {
			state = 'menu'
			menu_draw()
		}
	}
}

/* Hilfsfunktion für Menu-Rückkehr */
function gamepad_back_to_menu() {
	idle_stop()
	resetGame()
	storage_game_save()
	state = 'menu'
	init_room(score_raum)
	menu_draw()
}

/* Controller-Erkennung */
function detect_controller_type(gamepad) {
	const id = gamepad.id.toLowerCase()

	/* Durchsuche Controller-Typen nach Mustern */
	for (const [type, config] of Object.entries(CONTROLLER_TYPES)) {
		if (config.patterns.some(pattern => id.includes(pattern)))
			return config
	}

	return CONTROLLER_TYPES.xbox /* Fallback */
}

/* Gamepad-Typ-Detection */
function detect_gamepad_type(gamepad) {
	const axes_count = gamepad.axes.length
	const button_count = gamepad.buttons.length

	if (axes_count >= 8)
		return '8axes'
	if (button_count >= 16 && axes_count === 4)
		return '4axes'
	if (button_count >= 6 && axes_count === 2)
		return '2axes'
	return 'none'
}

/* Gamepad Connect Handler */
function gamepad_connect(e) {
	gamepad_connected = true
	gamepad_index = e.gamepad.index

	/* Audio Context aktivieren */
	try {
		audio_context.resume()
	} catch (err) {
		init_audio()
	}

	/* Controller-Typ erkennen */
	current_controller = detect_controller_type(e.gamepad)
	gamepad_brand = current_controller.name.toLowerCase()
	gamepad_type = detect_gamepad_type(e.gamepad)

	/* Vibration testen */
	if (!gamepad_dualrumble) {
		try {
			if (e.gamepad.vibrationActuator && 
			    typeof e.gamepad.vibrationActuator.playEffect === 'function') {
				e.gamepad.vibrationActuator.playEffect("dual-rumble", {
					startDelay: 0,
					duration: 100,
					weakMagnitude: 1.0,
					strongMagnitude: 1.0
				})
				gamepad_dualrumble = true
			} else {
				gamepad_dualrumble = false
			}
		} catch (error) {
			gamepad_dualrumble = false
			console.log('Vibration nicht unterstützt:', error.message)
		}
	}

	/* Button States zurücksetzen */
	Object.keys(curr_buttons).forEach(key => {
		if (key !== 'left' && key !== 'right' && key !== 'up' && key !== 'down')
			prev_buttons[key] = curr_buttons[key] = true
	})

	if (state === 'menu')
		menu_draw()

	console.log('Gamepad #%d verbunden: "%s" | Buttons: %d, Achsen: %d, Typ: %s, Marke: %s', 
		e.gamepad.index, e.gamepad.id, e.gamepad.buttons.length, 
		e.gamepad.axes.length, gamepad_type, current_controller.name)
}

/* Gamepad Disconnect Handler */
function gamepad_disconnect(e) {
	gamepad_connected = false
	gamepad_dualrumble = false
	gamepad_brand = 'keyboard'
	gamepad_index = 0

	if (state === 'menu')
		menu_draw()

	console.log('Gamepad #%d getrennt: "%s"', e.gamepad.index, e.gamepad.id)
}

/* Hauptupdate-Funktion */
function gamepad_update() {
	if (!gamepad_connected || state === 'input')
		return

	const gp = navigator.getGamepads()[gamepad_index]
	if (!gp || !gp.connected)
		return

	update_button_states() /* Previous state sichern */

	/* Richtungen lesen */
	const directions = gamepad_get_directions(gp)
	Object.assign(curr_buttons, directions)

	/* Action-Buttons lesen */
	curr_buttons.A = is_button_pressed(gp, 'back')
	curr_buttons.B = is_button_pressed(gp, 'action')
	curr_buttons.X = is_button_pressed(gp, 'option2')
	curr_buttons.Y = is_button_pressed(gp, 'option1')
	curr_buttons.L1 = is_button_pressed(gp, 'shoulder_l')
	curr_buttons.R1 = is_button_pressed(gp, 'shoulder_r')

	/* State-Handler aufrufen */
	if (ACTION_HANDLERS[state])
		ACTION_HANDLERS[state]()
}