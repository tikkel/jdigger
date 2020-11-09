

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


//aktiviere Vibrationen (Handys und Tablets)
navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;

var soundType = 'no'; // erstmal 'no', bei Initialisierungserfolg dann 'api'
var gainNode = null;
var mergerNode = null;

// Variablen für Sound über AudioContext-Klasse (webAudio API)
var audioContext;
var audioBufferLeer;
var audioBufferStep;
var audioBufferStone;
var audioBufferDiamond;

//original xdigger 58472Hz
//[CPU-Takt] / [CTC-Vorteiler] = max. Samplefreq. (Halbwellen)
var CPU_FREQ_KC85_2 = 1750000; //CPU-Takt KC85/2
var CPU_FREQ_KC85_3 = 1750000; //CPU-Takt KC85/3
var CPU_FREQ_KC85_4 = 1773447.5; //CPU-Takt KC85/4
var KC_CTC_FREQ_VT16 = CPU_FREQ_KC85_3 / 16; //VT16  -> 109375Hz
var KC_CTC_FREQ_VT256 = CPU_FREQ_KC85_3 / 256; //VT256 -> 6835,9375Hz
var TON_LOW = -1;
var TON_HIGH = 1;
var TON_RATE = 44100; //default  44100 Hz webAudio-API-Samplefreq. (Halbwellen)

function initAudio() {

    // webAudio API: "Audio-Puffer"
    if (window.AudioContext || window.webkitAudioContext) {

        //buf > merger > gain > destination
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();

        // Lautstärkeregler stereo > GAINE > stereo
        gainNode = audioContext.createGain();
        gainNode.gain.value = 0.2;
        gainNode.connect(audioContext.destination);

        // Verbinder mono0.links + mono1.rechts > MERGER > stereo
        mergerNode = audioContext.createChannelMerger(2);
        mergerNode.connect(gainNode);

        //TON_LEER (für iOS Soundaktivierung)
        audioBufferLeer = audioContext.createBuffer(1, 1, TON_RATE);

        // prozedurale Ton-Synthese vom KC85-Diggersound
        // Es werden die orig. Wellen und Wellenpattern in Puffern vorberechnet
        // siehe Kommentare unten: *Notizen zum KC85-Sound*

        var i, j, k, n = 0;
        var augenblicklicherpeak = 0;
        var buffer_tmp;

        // TON_SCHRITT (ctc0 rechter Lautsprecher)
        audioBufferStep = audioContext.createBuffer(1, (TON_RATE / KC_CTC_FREQ_VT256 * (0x40 + 0x40) << 0), TON_RATE);
        buffer_tmp = audioBufferStep.getChannelData(0); //Zeiger auf Wellendatenpuffer
        augenblicklicherpeak = TON_LOW;
        for (i = 0, j = 2; j > 0; j--) {
            for (k = 0; k < 0x40; k++) {
                for (n = 0; n <= (TON_RATE / KC_CTC_FREQ_VT256 << 0); n++)
                    buffer_tmp[(TON_RATE * i / KC_CTC_FREQ_VT256 << 0) + n] = augenblicklicherpeak;
                i++;
            }
            augenblicklicherpeak = TON_LOW + TON_HIGH - augenblicklicherpeak;
        }
        console.log('tonsynthese: schritt buffer: ' + (TON_RATE / KC_CTC_FREQ_VT256 * (0x40 + 0x40) << 0));

        // TON_STEIN (ctc1 linker Lautsprecher)
        // Puffergrößenberechnung m.H "Gaußsche Summenformel", (n*n+n)/2
        audioBufferStone = audioContext.createBuffer(1, (TON_RATE / KC_CTC_FREQ_VT16 * (0x0ff + 0x100 + ((0x12 * 0x12 + 0x12) / 2)) << 0), TON_RATE);
        buffer_tmp = audioBufferStone.getChannelData(0); //Zeiger auf Wellendatenpuffer
        augenblicklicherpeak = TON_LOW;
        for (i = 0, j = 0x0ff;; j++) {
            if (j > 256) j = 1;
            if (j == 0x12) break; //j^TC-Reihe: 255,256,1...18 (^0x14 loops)
            for (k = 0; k < j; k++) {
                for (n = 0; n <= (TON_RATE / KC_CTC_FREQ_VT16 << 0); n++)
                    buffer_tmp[(TON_RATE * i / KC_CTC_FREQ_VT16 << 0) + n] = augenblicklicherpeak;
                i++;
            }
            augenblicklicherpeak = TON_LOW + TON_HIGH - augenblicklicherpeak;
        }
        console.log('tonsynthese: stein buffer: ' + (TON_RATE / KC_CTC_FREQ_VT16 * (0x0ff + 0x100 + ((0x12 * 0x12 + 0x12) / 2)) << 0));

        // TON_DIAMANT (ctc0 rechter Lautsprecher)
        // Puffergrößenberechnung m.H "Gaußsche Summenformel", (n*n+n)/2
        audioBufferDiamond = audioContext.createBuffer(1, (TON_RATE / KC_CTC_FREQ_VT16 * ((0x40 * 0x40 + 0x40) / 2) << 0), TON_RATE);
        buffer_tmp = audioBufferDiamond.getChannelData(0); //Zeiger auf Wellendatenpuffer
        augenblicklicherpeak = TON_LOW;
        for (i = 0, j = 0x40; j > 0; j--) {
            for (k = 0; k < j; k++) {
                for (n = 0; n <= (TON_RATE / KC_CTC_FREQ_VT16 << 0); n++)
                    buffer_tmp[(TON_RATE * i / KC_CTC_FREQ_VT16 << 0) + n] = augenblicklicherpeak;
                i++;
            }
            augenblicklicherpeak = TON_LOW + TON_HIGH - augenblicklicherpeak;
        }
        console.log('tonsynthese: diamant buffer: ' + (TON_RATE / KC_CTC_FREQ_VT16 * ((0x40 * 0x40 + 0x40) / 2) << 0));

        soundType = 'api';
    }

    console.log('webAudio: ' + soundType + ': Initialisierung abgeschlossen');
}

function playAudio(ton) {

    if (soundType == 'api') {

        var audioBufferSource = audioContext.createBufferSource();

        if (ton == "Step") {
            audioBufferSource.buffer = audioBufferStep;
            audioBufferSource.connect(mergerNode, 0, 1); //rechts
        } else if (ton == "Stone") {
            audioBufferSource.buffer = audioBufferStone;
            audioBufferSource.connect(mergerNode, 0, 0); //links
        } else if (ton == "Diamond") {
            audioBufferSource.buffer = audioBufferDiamond;
            audioBufferSource.connect(mergerNode, 0, 1); //rechts
        } else if (ton == "Leer") {
            audioBufferSource.buffer = audioBufferLeer;
            audioBufferSource.connect(mergerNode, 0, 0); //links
        }
        audioBufferSource.start(0);
    }

}
