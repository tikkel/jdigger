// jdigger/Digger.JS - Gamepad support
// Copyright (C) 2022–2025  Marko Klingner
// GNU GPL v3 - https://www.gnu.org/licenses/gpl-3.0.html


// Gamepad State Variablen
var gamepadConnected=false,gamepadType='none',gamepadBrand='keyboard',gamepadDualrumble=false;
// Previous frame states
var prevLeft=false,prevRight=false,prevUp=false,prevDown=false,prevA=false,prevB=false,prevX=false,prevY=false,prevL1=false,prevR1=false;
// Current frame states  
var currLeft=false,currRight=false,currUp=false,currDown=false,currA=false,currB=false,currX=false,currY=false,currL1=false,currR1=false;

function gamepadGetDirections(gp){
    var left=false,right=false,up=false,down=false;
    if(gamepadType=='8axes'){
        left=gp.axes[0]<-0.5||gp.axes[3]<-0.5||gp.axes[6]<-0.5;
        right=gp.axes[0]>0.5||gp.axes[3]>0.5||gp.axes[6]>0.5;
        up=gp.axes[1]<-0.5||gp.axes[4]<-0.5||gp.axes[7]<-0.5;
        down=gp.axes[1]>0.5||gp.axes[4]>0.5||gp.axes[7]>0.5;
    }else if(gamepadType=='4axes'){
        left=gp.buttons[14].value==1||gp.axes[0]<-0.5||gp.axes[2]<-0.5;
        right=gp.buttons[15].value==1||gp.axes[0]>0.5||gp.axes[2]>0.5;
        up=gp.buttons[12].value==1||gp.axes[1]<-0.5||gp.axes[3]<-0.5;
        down=gp.buttons[13].value==1||gp.axes[1]>0.5||gp.axes[3]>0.5;
    }else if(gamepadType=='2axes'){
        left=gp.axes[0]<-0.5;
        right=gp.axes[0]>0.5;
        up=gp.axes[1]<-0.5;
        down=gp.axes[1]>0.5;
    }
    return [left,right,up,down];
}

function gamepadHandleMovement(){
    // Links
    if(currLeft&&!prevLeft)kb_press_left();
    else if(!currLeft&&prevLeft)kb_release_left();
    // Rechts  
    if(currRight&&!prevRight)kb_press_right();
    else if(!currRight&&prevRight)kb_release_right();
    // Oben
    if(currUp&&!prevUp)kb_press_up();
    else if(!currUp&&prevUp)kb_release_up();
    // Unten
    if(currDown&&!prevDown)kb_press_down();
    else if(!currDown&&prevDown)kb_release_down();
}

function gamepadHandlePlayActions(){
    // B Button - Digger wiederbeleben/töten
    if(currB&&!prevB){
        if(digger_death){
            if(score_leben<LEBENMIN){
                state='highscore';
                highscoreDraw();
                score_punkte=0;
                score_leben=LEBENMAX;
                score_raum=1;
            }else{
                state='init';
                init_room(score_raum);
            }
            storageGameSave();
        }else{
            digger_death=true;
        }
    }
    // A Button - Quit/Back to Menu
    if(currA&&!prevA){
        idle_stop();
        state='menu';
        score_punkte=0;
        score_leben=LEBENMAX;
        score_raum=1;
        storageGameSave();
        init_room(score_raum);
        menuDraw();
    }
}

function gamepadHandleInitActions(){
    // A Button - Quit/Back to Menu
    if(currA&&!prevA){
        idle_stop();
        state='menu';
        score_punkte=0;
        score_leben=LEBENMAX;
        score_raum=1;
        storageGameSave();
        init_room(score_raum);
        menuDraw();
    }
}

function gamepadHandleMenuActions(){
    // B Button - Play
    if(currB&&!prevB){
        storageGameRestore();
        state='init';
        init_room(score_raum);
    }
    // X Button - Highscore
    if(currX&&!prevX){
        state='highscore';
        highscoreDraw();
    }
    // Y Button - Look
    if(currY&&!prevY){
        state='look';
        init_room(score_raum);
    }
}

function gamepadHandleLookActions(){
    // Y Button - Raum+
    if(currY&&!prevY&&score_raum<room.length){
        score_raum++;
        init_room(score_raum);
    }
    // R1 Button - Raum+
    if(currR1&&!prevR1&&score_raum<room.length){
        score_raum++;
        init_room(score_raum);
    }
    // L1 Button - Raum-
    if(currL1&&!prevL1&&score_raum>1){
        score_raum--;
        init_room(score_raum);
    }
    // A Button - Abbruch Look
    if(currA&&!prevA){
        state='menu';
        menuDraw();
    }
}

function gamepadHandleHighscoreActions(){
    // A Button - Abbruch Highscore
    if(currA&&!prevA){
        state='menu';
        menuDraw();
    }
}

function gamepadStorePreviousState(){
    prevLeft=currLeft;prevRight=currRight;prevUp=currUp;prevDown=currDown;
    prevA=currA;prevB=currB;prevX=currX;prevY=currY;prevL1=currL1;prevR1=currR1;
}

function gamepadConnect(e){
    gamepadConnected=true;

    // Resume or Init audioContext
    try {
        audioContext.resume();
    } catch (e) {
        initAudio();
    }
    
    // Dualrumble Test
    if(!gamepadDualrumble){
        try{
            const gamepad=navigator.getGamepads()[0];
            gamepad.vibrationActuator.playEffect("dual-rumble",{startDelay:0,duration:100,weakMagnitude:1.0,strongMagnitude:1.0});
            gamepadDualrumble=true;
        }catch(error){
            gamepadDualrumble=false;
        }
    }
    
    // Type detection
    gamepadType=e.gamepad.axes.length>=8?'8axes':(e.gamepad.buttons.length>=16&&e.gamepad.axes.length==4)?'4axes':(e.gamepad.buttons.length>=6&&e.gamepad.axes.length==2)?'2axes':'none';
    
    // Brand detection  
    gamepadBrand=e.gamepad.id.includes('054c')?'sony':'xbox';
    
    // Reset button states - erste Eingabe abfangen
    prevA=prevB=prevX=prevY=currA=currB=currX=currY=true;
    
    if(state=='menu')menuDraw();
    console.log('Gamepad#%d connect"%s" buttons#%d axes#%d mapping"%s" typ"%s" brand"%s"',e.gamepad.index,e.gamepad.id,e.gamepad.buttons.length,e.gamepad.axes.length,e.gamepad.mapping,gamepadType,gamepadBrand);
}

function gamepadDisconnect(e){
    gamepadConnected=false;
    gamepadDualrumble=false;
    gamepadBrand='keyboard';
    if(state=='menu')menuDraw();
    console.log('Gamepad#%d lost"%s" brand"%s"',e.gamepad.index,e.gamepad.id,gamepadBrand);
}

function gamepadUpdate(){
    if(!gamepadConnected||state=='input')return;
    
    const gp=navigator.getGamepads()[0];
    if(!gp)return;
    
    // Previous state speichern
    gamepadStorePreviousState();
    
    // Directional input lesen
    var dirs=gamepadGetDirections(gp);
    currLeft=dirs[0];currRight=dirs[1];currUp=dirs[2];currDown=dirs[3];
    
    // Button input lesen
    currA=gp.buttons[1].value>0.5;  // A=1
    currB=gp.buttons[0].value>0.5;  // B=0  
    currX=gp.buttons[3].value>0.5;  // X=3
    currY=gp.buttons[2].value>0.5;  // Y=2
    currL1=gp.buttons[4].value>0.5; // L1=4
    currR1=gp.buttons[5].value>0.5; // R1=5
    
    // State-spezifische Behandlung
    if(state=='play'){
        gamepadHandleMovement();
        gamepadHandlePlayActions();
    }else if(state=='init'){
        gamepadHandleInitActions();
    }else if(state=='menu'){
        gamepadHandleMenuActions();
    }else if(state=='look'){
        gamepadHandleLookActions();
    }else if(state=='highscore'){
        gamepadHandleHighscoreActions();
    }
}
