// SPDX-License-Identifier: GPL-3.0
// jdigger/keyboard.js - Tastatursteuerung
// Copyright (C) 2023–2025  Marko Klingner

/* Hauptfunktion für Keyboard-Press-Events */
function kb_press(taste) {
	handled = false;

	/* Input-Modus: Nur Backspace verarbeiten */
	if (state === 'input') {
		if (taste.key === 'Backspace')
			input = taste.key;
		return;
	}

	const key_code = taste.keyCode || taste.which;

	/* Lookup-Table für Keyboard-Aktionen */
	const actions = {
		/* Q - Quit */
		81: () => {
			if (state === 'play' || state === 'init') {
				idle_stop();
				resetGame();
				storage_game_save();
				state = 'menu';
				init_room(score_raum);
				menu_draw();
			}
		},

		/* H - Highscore */
		72: () => {
			if (state === 'menu') {
				state = 'highscore';
				highscore_draw();
			}
		},

		/* 9 - Cheat */
		57: () => cheat_tmp = '9' + cheat_tmp,

		/* D - Cheat */
		68: () => {
			cheat_tmp = cheat_tmp + 'd';
			if (cheat_tmp === '99d')
				digger_cheat = !digger_cheat;
			cheat_tmp = '';
		},

		/* Escape */
		27: () => {
			if (state === 'play') {
				digger_death = true;
			} else if (state === 'highscore' || state === 'look') {
				state = 'menu';
				menu_draw();
			}
		},

		/* Enter */
		13: () => {
			if (state === 'play' && digger_death) {
				if (score_leben < LEBENMIN) {
					state = 'highscore';
					highscore_draw();
				} else {
					state = 'init';
					init_room(score_raum);
				}
				storage_game_save();
			} else if (state === 'highscore') {
				state = 'menu';
				menu_draw();
			}
		},

		/* Space */
		32: () => {
			if (state === 'play' && digger_death) {
				if (score_leben < LEBENMIN) {
					state = 'highscore';
					highscore_draw();
				} else {
					state = 'init';
					init_room(score_raum);
				}
				storage_game_save();
			} else if (state === 'highscore') {
				state = 'menu';
				menu_draw();
			}
		},

		/* P - Play */
		80: () => {
			if (state === 'menu') {
				try {
					audio_context.resume();
				} catch (e) {
					init_audio();
				}
				storage_game_restore();
				state = 'init';
				init_room(score_raum);
			}
		},

		/* Pos1 - Cheat Navigation */
		36: () => {
			if (digger_cheat && (state === 'play' || state === 'init')) {
				const direction = !taste.shiftKey ? 1 : -1;
				const new_room = score_raum + direction;
				if (new_room >= 1 && new_room <= room.length) {
					idle_stop();
					score_raum = new_room;
					state = 'init';
					init_room(score_raum);
					storage_game_save();
				}
			}
		},

		/* L - Look */
		76: () => {
			if (state === 'menu') {
				state = 'look';
				storage_game_restore();
				init_room(score_raum);
			} else if (state === 'look') {
				const direction = !taste.shiftKey ? 1 : -1;
				const new_room = score_raum + direction;
				if (new_room >= 1 && new_room <= room.length) {
					score_raum = new_room;
					init_room(score_raum);
				}
			}
		},

		/* Bewegungssteuerung */
		38: kb_press_up,	/* Pfeil hoch */
		40: kb_press_down,	/* Pfeil runter */
		37: kb_press_left,	/* Pfeil links */
		39: kb_press_right	/* Pfeil rechts */
	};

	if (actions[key_code]) {
		actions[key_code]();
		handled = true;
	}

	if (handled)
		taste.preventDefault();
}

/* Behandelt Drücken der UP-Taste */
function kb_press_up() {
	/* Verhindere doppelte Aktivierung */
	if (digger_start_up)
		return;

	digger_up = true;
	digger_go = 'UP';
	digger_idle = false;
	digger_start_up = true;
}

/* Behandelt Drücken der DOWN-Taste */
function kb_press_down() {
	if (digger_start_down)
		return;

	digger_down = true;
	digger_go = 'DOWN';
	digger_idle = false;
	digger_start_down = true;
}

/* Behandelt Drücken der LEFT-Taste */
function kb_press_left() {
	if (digger_start_left)
		return;

	digger_left = true;
	digger_go = 'LEFT';
	digger_idle = false;
	digger_start_left = true;
}

/* Behandelt Drücken der RIGHT-Taste */
function kb_press_right() {
	if (digger_start_right)
		return;

	digger_right = true;
	digger_go = 'RIGHT';
	digger_idle = false;
	digger_start_right = true;
}

/* Behandelt Keyboard-Release-Events */
function kb_release(taste) {
	/* Ignoriere Input im Eingabe-Modus */
	if (state === 'input')
		return;

	const key_code = taste.keyCode || taste.which;

	/* Mapping von Keycodes zu Release-Funktionen */
	const key_actions = {
		38: kb_release_up,	/* Pfeil hoch */
		40: kb_release_down,	/* Pfeil runter */
		37: kb_release_left,	/* Pfeil links */
		39: kb_release_right	/* Pfeil rechts */
	};

	const action = key_actions[key_code];
	if (action) {
		action();
		handled = true;
	}
}

/* Behandelt Loslassen der UP-Taste */
function kb_release_up() {
	/* Warte bis Start-Animation abgeschlossen */
	if (digger_start_up) {
		window.setTimeout(kb_release_up, 10);
		return;
	}

	digger_up = false;

	/* Nächste Bewegungsrichtung bestimmen */
	digger_go = digger_down ? 'DOWN' :
		    digger_left ? 'LEFT' :
		    digger_right ? 'RIGHT' :
		    'NONE';
}

/* Behandelt Loslassen der DOWN-Taste */
function kb_release_down() {
	if (digger_start_down) {
		window.setTimeout(kb_release_down, 10);
		return;
	}

	digger_down = false;

	digger_go = digger_up ? 'UP' :
		    digger_left ? 'LEFT' :
		    digger_right ? 'RIGHT' :
		    'NONE';
}

/* Behandelt Loslassen der LEFT-Taste */
function kb_release_left() {
	if (digger_start_left) {
		window.setTimeout(kb_release_left, 10);
		return;
	}

	digger_left = false;

	digger_go = digger_up ? 'UP' :
		    digger_down ? 'DOWN' :
		    digger_right ? 'RIGHT' :
		    'NONE';
}

/* Behandelt Loslassen der RIGHT-Taste */
function kb_release_right() {
	if (digger_start_right) {
		window.setTimeout(kb_release_right, 10);
		return;
	}

	digger_right = false;

	digger_go = digger_up ? 'UP' :
		    digger_down ? 'DOWN' :
		    digger_left ? 'LEFT' :
		    'NONE';
}

/* Stoppt alle Bewegungen */
function kb_release_all() {
	kb_release_up();
	kb_release_down();
	kb_release_left();
	kb_release_right();
}
