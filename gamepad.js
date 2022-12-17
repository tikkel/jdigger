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


var gamepadConnected = false;
var gamepadLeft = false;
var gamepadRight = false;
var gamepadUp = false;
var gamepadDown = false;
var gamepadB = false;
var gamepadA = false;
var gamepadX = false;
var gamepadY = false;
var gamepadR1 = false;
var gamepadL1 = false;
var gamepadType = 'none'; //8axes, 4axes, 2axes, none
var gamepadBrand = 'keyboard'; //sony, xbox, keyboard
var gamepadDualrumble = false;


function gamepadConnect(e) {
    
    gamepadConnected = true;

    //Dualrumble Unterstützung?
    if (!gamepadDualrumble) {
        try {
            const gamepad = navigator.getGamepads()[0];
            gamepad.vibrationActuator.playEffect("dual-rumble", {startDelay:0,duration:100,weakMagnitude:1.0,strongMagnitude:1.0})
            gamepadDualrumble = true;
        } catch (error) {
            gamepadDualrumble = false;
        }
    }

    if (e.gamepad.axes.length >= 8)
        gamepadType = '8axes';
    else if ((e.gamepad.buttons.length >= 16) && (e.gamepad.axes.length == 4))
        gamepadType = '4axes';
    else if ((e.gamepad.buttons.length >= 6) && (e.gamepad.axes.length == 2))
        gamepadType = '2axes';
    //Github Vendor Id List: nondebug/known_gamepads.txt
    //Xbox: 045e (default)
    gamepadBrand = 'xbox';
    //Sony: 054c
    if (e.gamepad.id.includes('054c'))
        gamepadBrand = 'sony';
    //die 1. Tasteneingabe "abfangen"
    gamepadA = gamepadB = gamepadX = gamepadY = true;
    //wenn im Menü connectet, dann mit neuen Symbolen aktualisieren
    if (state == 'menu')
        menuDraw();
    console.log('Gamepad#%d connect"%s" buttons#%d axes#%d mapping"%s" typ"%s" brand"%s"',
        e.gamepad.index, e.gamepad.id, e.gamepad.buttons.length, e.gamepad.axes.length,
        e.gamepad.mapping, gamepadType, gamepadBrand);
}


function gamepadDisconnect(e) {

    gamepadConnected = false;
    
    gamepadDualrumble = false;
    gamepadBrand = 'keyboard';
    if (state == 'menu')
        menuDraw();
    console.log('Gamepad#%d lost"%s" brand"%s"',
        e.gamepad.index, e.gamepad.id, gamepadBrand);
}


function gamepadUpdate() {

    if ((gamepadConnected) && (state != 'input')) {

        //Gamepad#0 alle Achsen und Knöpfe auslesen
        const gamepad = navigator.getGamepads()[0];

        var pressedLeft = false;
        var pressedRight = false;
        var pressedUp = false;
        var pressedDown = false;
        if (gamepadType == '8axes') {
            if ((gamepad.axes[0] < -0.5) || (gamepad.axes[3] < -0.5) || (gamepad.axes[6] < -0.5))
                pressedLeft = true;
            if ((gamepad.axes[0] > 0.5) || (gamepad.axes[3] > 0.5) || (gamepad.axes[6] > 0.5))
                pressedRight = true;
            if ((gamepad.axes[1] < -0.5) || (gamepad.axes[4] < -0.5) || (gamepad.axes[7] < -0.5))
                pressedUp = true;
            if ((gamepad.axes[1] > 0.5) || (gamepad.axes[4] > 0.5) || (gamepad.axes[7] > 0.5))
                pressedDown = true;
        }
        else if (gamepadType == '4axes') {
            if ((gamepad.buttons[14].value == 1) || (gamepad.axes[0] < -0.5) || (gamepad.axes[2] < -0.5))
                pressedLeft = true;
            if ((gamepad.buttons[15].value == 1) || (gamepad.axes[0] > 0.5) || (gamepad.axes[2] > 0.5))
                pressedRight = true;
            if ((gamepad.buttons[12].value == 1) || (gamepad.axes[1] < -0.5) || (gamepad.axes[3] < -0.5))
                pressedUp = true;
            if ((gamepad.buttons[13].value == 1) || (gamepad.axes[1] > 0.5) || (gamepad.axes[3] > 0.5))
                pressedDown = true;
        }
        else if (gamepadType == '2axes') {
            if (gamepad.axes[0] < -0.5)
                pressedLeft = true;
            if (gamepad.axes[0] > 0.5)
                pressedRight = true;
            if (gamepad.axes[1] < -0.5)
                pressedUp = true;
            if (gamepad.axes[1] > 0.5)
                pressedDown = true;
        }

        if (state == 'play') {

            // axes#0 links
            if (!gamepadLeft) {
                if (pressedLeft) {
                    kb_press_left();
                    gamepadLeft = true;
                }
            } else if (gamepadLeft) {
                if (!pressedLeft) {
                    kb_release_left();
                    gamepadLeft = false;
                }
            }

            // axes#0 rechts
            if (!gamepadRight) {
                if (pressedRight) {
                    kb_press_right();
                    gamepadRight = true;
                }
            } else if (gamepadRight) {
                if (!pressedRight) {
                    kb_release_right();
                    gamepadRight = false;
                }
            }

            // axes#0 oben
            if (!gamepadUp) {
                if (pressedUp) {
                    kb_press_up();
                    gamepadUp = true;
                }
            } else if (gamepadUp) {
                if (!pressedUp) {
                    kb_release_up();
                    gamepadUp = false;
                }
            }

            // axes#0 unten
            if (!gamepadDown) {
                if (pressedDown) {
                    kb_press_down();
                    gamepadDown = true;
                }
            } else if (gamepadDown) {
                if (!pressedDown) {
                    kb_release_down();
                    gamepadDown = false;
                }
            }

            //Digger wiederbeleben oder töten
            if (!gamepadB) {
                if (gamepad.buttons[0].value > 0.5) { //#B #Kreuz
                    gamepadB = true;
                    if (digger_death) { //Digger wiederbeleben
                        if (score_leben < LEBENMIN) {
                            state = 'highscore';
                            highscoreDraw();
                            score_punkte = 0;
                            score_leben = LEBENMAX;
                            score_raum = 1;
                        } else {
                            state = 'init';
                            init_room(score_raum);
                        }
                        storageGameSave(); //Spielstand sichern
                    }
                    else
                        digger_death = true; //Digger töten
                }
            } else if (gamepadB) {
                if (gamepad.buttons[0].value < 0.5) //#B #Kreuz
                    gamepadB = false;
            }

            //Quit/Back to Menu
            if (!gamepadA) {
                if (gamepad.buttons[1].value > 0.5) { //#A #Kreis
                    gamepadA = true;
                    idle_stop();
                    state = 'menu';
                    //Spielstand resetten
                    score_punkte = 0;
                    score_leben = LEBENMAX;
                    score_raum = 1;
                    storageGameSave(); //Spielstand sichern
                    init_room(score_raum);
                    menuDraw();
                }
            } else if (gamepadA) {
                if (gamepad.buttons[1].value < 0.5) //#A #Kreis
                    gamepadA = false;
            }

        }

        else if (state == 'init') {

            //Quit/Back to Menu
            if (!gamepadA) {
                if (gamepad.buttons[1].value > 0.5) { //#A #Kreis
                    gamepadA = true;
                    idle_stop();
                    state = 'menu';
                    //Spielstand resetten
                    score_punkte = 0;
                    score_leben = LEBENMAX;
                    score_raum = 1;
                    storageGameSave(); //Spielstand sichern
                    init_room(score_raum);
                    menuDraw();
                }
            } else if (gamepadA) {
                if (gamepad.buttons[1].value < 0.5) //#A #Kreis
                    gamepadA = false;
            }

        }

        else if (state == 'menu') {

            //Play
            if (!gamepadB) {
                if (gamepad.buttons[0].value > 0.5) { //#B #Kreis
                    gamepadB = true;
                    storageGameRestore(); //Spielstand restaurieren
                    state = 'init';
                    init_room(score_raum);
                }
            } else if (gamepadB) {
                if (gamepad.buttons[0].value < 0.5) //#B #Kreuz
                    gamepadB = false;
            }

            //Highscore
            if (!gamepadX) {
                if (gamepad.buttons[3].value > 0.5) { //#X #Rechteck
                    gamepadX = true;
                    state = 'highscore';
                    highscoreDraw();
                }
            } else if (gamepadX) {
                if (gamepad.buttons[3].value < 0.5) //#X #Rechteck
                    gamepadX = false;
            }

            //Look
            if (!gamepadY) {
                if (gamepad.buttons[2].value > 0.5) { //#Y #Dreieck
                    gamepadY = true;
                    state = 'look';
                    init_room(score_raum);
                }
            } else if (gamepadY) {
                if (gamepad.buttons[2].value < 0.5) //#A #Kreis
                    gamepadY = false;
            }

        }

        else if (state == 'look') {

            //+
            if (!gamepadY) {
                if ((gamepad.buttons[2].value > 0.5) && (score_raum < room.length)) { //#Y #Dreieck
                    gamepadY = true;
                    score_raum++;
                    init_room(score_raum);
                }
            } else if (gamepadY) {
                if (gamepad.buttons[2].value < 0.5) //#A #Kreis
                    gamepadY = false;
            }

            //+
            if (!gamepadR1) {
                if ((gamepad.buttons[5].value > 0.5) && (score_raum < room.length)) { //#R #R1
                    gamepadR1 = true;
                    score_raum++;
                    init_room(score_raum);
                }
            } else if (gamepadR1) {
                if (gamepad.buttons[5].value < 0.5) //#R #R1
                    gamepadR1 = false;
            }

            //-
            if (!gamepadL1) {
                if ((gamepad.buttons[4].value > 0.5) && (score_raum > 1)) { //#L #L1
                    gamepadL1 = true;
                    score_raum--;
                    init_room(score_raum);
                }
            } else if (gamepadL1) {
                if (gamepad.buttons[4].value < 0.5) //#L #L1
                    gamepadL1 = false;
            }

            //Abbruch Look
            if (!gamepadA) {
                if (gamepad.buttons[1].value > 0.5) { //#A #Kreis
                    gamepadA = true;
                    state = 'menu';
                    menuDraw();
                }
            } else if (gamepadA) {
                if (gamepad.buttons[1].value < 0.5) //#A #Kreis
                    gamepadA = false;
            }

        }

        else if (state == 'highscore') {

            //Abbruch Highscore
            if (!gamepadA) {
                if (gamepad.buttons[1].value > 0.5) { //#A #Kreis
                    gamepadA = true;
                    state = 'menu';
                    menuDraw();
                }
            } else if (gamepadA) {
                if (gamepad.buttons[1].value < 0.5) //#A #Kreis
                    gamepadA = false;
            }

        }

        // //9
        // case 57:
        //     cheat_tmp = '9' + cheat_tmp;
        //     handled = true;
        //     break;
        // //d
        // case 68:
        //     cheat_tmp = cheat_tmp + 'd';
        //     if (cheat_tmp == '99d') {
        //         if (!digger_cheat) digger_cheat = true;
        //         else digger_cheat = false;
        //     }
        //     cheat_tmp = '';
        //     handled = true;
        //     break;

        // //pos1 (+shiftKey)
        // case 36:
        //     if (digger_cheat && ((state == 'play') || (state == 'init'))) {
        //         if (!taste.shiftKey && (score_raum < room.length)) {
        //             idle_stop();
        //             score_raum++;
        //             state = 'init';
        //             init_room(score_raum);
        //             storageGameSave();
        //         }
        //         else if (taste.shiftKey && (score_raum > 1)) {
        //             idle_stop();
        //             score_raum--;
        //             state = 'init';
        //             init_room(score_raum);
        //             storageGameSave();
        //         }
        //     }
        //     handled = true;
        //     break;

    }

}
