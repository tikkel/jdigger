// SPDX-License-Identifier: GPL-3.0
// jdigger/mouse.js - Maus Steuerung
// Copyright (C) 2022–2025  Marko Klingner

function mouse_click(event) {
    //Fullscreen
    if (!fullscreen_flag) fullscreen();

    //Mausposition
    const mausX = (event.pageX / (body_width / 40)) << 0;
    const mausY = (event.pageY / (body_height / 30)) << 0;

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