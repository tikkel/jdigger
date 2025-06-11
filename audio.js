//     jdigger/Digger.JS
//     Copyright (C) 2017  Marko Klingner
//     GNU General Public License v3 - http://www.gnu.org/licenses/

// Vibration support
navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;

// Audio variables
var soundType = 'no';
var gainNode = null;
var mergerNode = null;
var audioContext, audioBufferLeer, audioBufferStep, audioBufferStone, audioBufferDiamond;

// KC85 system constants
//original xdigger 58472Hz
//[CPU-Takt] / [CTC-Vorteiler] = max. Samplefreq. (Halbwellen)
var CPU_FREQ_KC85_2 = 1750000;   //CPU-Takt KC85/2
var CPU_FREQ_KC85_3 = 1750000;   //CPU-Takt KC85/3
var CPU_FREQ_KC85_4 = 1773447.5; //CPU-Takt KC85/4
var KC_CTC_FREQ_VT16  = CPU_FREQ_KC85_3 / 16;  //VT16  -> 109375Hz
var KC_CTC_FREQ_VT256 = CPU_FREQ_KC85_3 / 256; //VT256 -> 6835,9375Hz
var TON_LOW  = -1;
var TON_HIGH =  1;
var TON_RATE =  44100; //default  44100 Hz webAudio-API-Samplefreq. (Halbwellen)

function initAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    // Setup audio chain: buffer > merger > gain > destination
    audioContext = new AudioContextClass();
    
    gainNode = audioContext.createGain();
    gainNode.gain.value = 0.2;
    gainNode.connect(audioContext.destination);
    
    mergerNode = audioContext.createChannelMerger(2);
    mergerNode.connect(gainNode);

    // Empty buffer for iOS activation
    audioBufferLeer = audioContext.createBuffer(1, 1, TON_RATE);

    // Generate procedural KC85 sound buffers
    createStepSound();
    createStoneSound();
    createDiamondSound();
    
    soundType = 'api';
    console.log('webAudio: ' + soundType + ': Initialisierung abgeschlossen');
}

function createStepSound() {
    // Original: (TON_RATE / KC_CTC_FREQ_VT256 * (0x40 + 0x40) << 0)
    audioBufferStep = audioContext.createBuffer(1, (TON_RATE / KC_CTC_FREQ_VT256 * (0x40 + 0x40) << 0), TON_RATE);
    const buffer = audioBufferStep.getChannelData(0);
    let peak = TON_LOW;
    
    for (let i = 0, j = 2; j > 0; j--) {
        for (let k = 0; k < 0x40; k++) {
            for (let n = 0; n <= (TON_RATE / KC_CTC_FREQ_VT256 << 0); n++)
                buffer[(TON_RATE * i / KC_CTC_FREQ_VT256 << 0) + n] = peak;
            i++;
        }
        peak = TON_LOW + TON_HIGH - peak;
    }
    console.log('tonsynthese: schritt buffer: ' + (TON_RATE / KC_CTC_FREQ_VT256 * (0x40 + 0x40) << 0));
}

function createStoneSound() {
    // Original: (TON_RATE / KC_CTC_FREQ_VT16 * (0x0ff + 0x100 + ((0x12 * 0x12 + 0x12) / 2)) << 0)
    audioBufferStone = audioContext.createBuffer(1, (TON_RATE / KC_CTC_FREQ_VT16 * (0x0ff + 0x100 + ((0x12 * 0x12 + 0x12) / 2)) << 0), TON_RATE);
    const buffer = audioBufferStone.getChannelData(0);
    let peak = TON_LOW;
    
    for (let i = 0, j = 0x0ff;; j++) {
        if (j > 256) j = 1;
        if (j == 0x12) break; // j^TC-Reihe: 255,256,1...18 (^0x14 loops)
        for (let k = 0; k < j; k++) {
            for (let n = 0; n <= (TON_RATE / KC_CTC_FREQ_VT16 << 0); n++)
                buffer[(TON_RATE * i / KC_CTC_FREQ_VT16 << 0) + n] = peak;
            i++;
        }
        peak = TON_LOW + TON_HIGH - peak;
    }
    console.log('tonsynthese: stein buffer: ' + (TON_RATE / KC_CTC_FREQ_VT16 * (0x0ff + 0x100 + ((0x12 * 0x12 + 0x12) / 2)) << 0));
}

function createDiamondSound() {
    // Original: (TON_RATE / KC_CTC_FREQ_VT16 * ((0x40 * 0x40 + 0x40) / 2) << 0)
    audioBufferDiamond = audioContext.createBuffer(1, (TON_RATE / KC_CTC_FREQ_VT16 * ((0x40 * 0x40 + 0x40) / 2) << 0), TON_RATE);
    const buffer = audioBufferDiamond.getChannelData(0);
    let peak = TON_LOW;
    
    for (let i = 0, j = 0x40; j > 0; j--) {
        for (let k = 0; k < j; k++) {
            for (let n = 0; n <= (TON_RATE / KC_CTC_FREQ_VT16 << 0); n++)
                buffer[(TON_RATE * i / KC_CTC_FREQ_VT16 << 0) + n] = peak;
            i++;
        }
        peak = TON_LOW + TON_HIGH - peak;
    }
    console.log('tonsynthese: diamant buffer: ' + (TON_RATE / KC_CTC_FREQ_VT16 * ((0x40 * 0x40 + 0x40) / 2) << 0));
}

function playAudio(ton) {
    if (soundType !== 'api') return;
    
    const source = audioContext.createBufferSource();
    const soundMap = {
        'Step': { buffer: audioBufferStep, channel: 1 },    // rechts
        'Stone': { buffer: audioBufferStone, channel: 0 },  // links  
        'Diamond': { buffer: audioBufferDiamond, channel: 1 }, // rechts
        'Leer': { buffer: audioBufferLeer, channel: 0 }     // links
    };
    
    const sound = soundMap[ton];
    if (sound) {
        source.buffer = sound.buffer;
        source.connect(mergerNode, 0, sound.channel);
        source.start(0);
    }
}
