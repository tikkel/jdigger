

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

var soundType = 'no';  // erstmal 'no', bei Initialisierungserfolg 'api'
var gainNode  = null;

// Variablen für Sound über AudioContext-Klasse (webAudio API)
var audioContext;
var audioBufferLeer;
var audioBufferStep;
var audioBufferStone;
var audioBufferDiamond;

//original xdigger 58472Hz
//[CPU-Takt] / [CTC-Vorteiler] = max. Samplefreq. (Halbwellen)
var CPU_FREQ_KC85_2 = 1750000;   //CPU-Takt KC85/2
var CPU_FREQ_KC85_3 = 1750000;   //CPU-Takt KC85/3
var CPU_FREQ_KC85_4 = 1773447.5; //CPU-Takt KC85/4
var KC_CTC_FREQ_VT16  = CPU_FREQ_KC85_3 / 16;  //VT16  -> 109375Hz
var KC_CTC_FREQ_VT256 = CPU_FREQ_KC85_3 / 256; //VT256 -> 6835,9375Hz
var TON_LOW  = -1;
var TON_HIGH =  1;
var TON_RATE = 44100; //default  44100 Hz webAudio-API-Samplefreq. (Halbwellen)

function initAudio() {
	window.AudioContext = window.AudioContext || window.webkitAudioContext;

	// webAudio API: "Audio-Puffer"
	if (window.AudioContext) {

        //buf > merger > gain > destination
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
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
            
        // TON_SCHRITT (ctc0 rechter Lautsprecher)
        audioBufferStep = audioContext.createBuffer(1, (TON_RATE / KC_CTC_FREQ_VT256 * (0x40 + 0x40) << 0), TON_RATE);
        var buffer_tmp = audioBufferStep.getChannelData(0); //Zeiger auf Wellendatenpuffer
        augenblicklicherpeak=TON_LOW;
        for (i=0,j=2; j>0; j--) {
            for(k=0;k<0x40;k++) {
                for (var n = 0; n <= ( TON_RATE / KC_CTC_FREQ_VT256 << 0 ); n++)
                    buffer_tmp[ ( TON_RATE*i/KC_CTC_FREQ_VT256 << 0 ) + n ] = augenblicklicherpeak;
                i++;
            }
            augenblicklicherpeak = TON_LOW + TON_HIGH - augenblicklicherpeak;
        }
        console.log('tonsynthese: schritt buffer: ' + (TON_RATE / KC_CTC_FREQ_VT256 * (0x40 + 0x40) << 0));
        
        // TON_STEIN (ctc1 linker Lautsprecher)
        // Puffergrößenberechnung m.H "Gaußsche Summenformel", (n*n+n)/2
        audioBufferStone = audioContext.createBuffer(1, (TON_RATE / KC_CTC_FREQ_VT16 * (0x0ff + 0x100 + ((0x12 * 0x12 + 0x12) / 2)) << 0), TON_RATE);
        var buffer_tmp = audioBufferStone.getChannelData(0); //Zeiger auf Wellendatenpuffer 
        augenblicklicherpeak=TON_LOW;
        for (i=0,j=0x0ff; ; j++) {
            if (j > 256) j = 1;
            if (j == 0x12) break; //j^TC-Reihe: 255,256,1...18 (^0x14 loops)
            for(k=0;k<j;k++) {
                for (var n = 0; n <= ( TON_RATE / KC_CTC_FREQ_VT16 << 0 ); n++)
                    buffer_tmp[ ( TON_RATE*i/KC_CTC_FREQ_VT16 << 0 ) + n ] = augenblicklicherpeak;
                i++;
            }
            augenblicklicherpeak = TON_LOW + TON_HIGH - augenblicklicherpeak;
        }
        console.log('tonsynthese: stein buffer: ' + (TON_RATE / KC_CTC_FREQ_VT16 * (0x0ff + 0x100 + ((0x12 * 0x12 + 0x12) / 2)) << 0));
                
        // TON_DIAMANT (ctc0 rechter Lautsprecher)
        // Puffergrößenberechnung m.H "Gaußsche Summenformel", (n*n+n)/2
        audioBufferDiamond = audioContext.createBuffer(1, (TON_RATE / KC_CTC_FREQ_VT16 * ((0x40 * 0x40 + 0x40) / 2) << 0), TON_RATE);
        var buffer_tmp = audioBufferDiamond.getChannelData(0); //Zeiger auf Wellendatenpuffer
        augenblicklicherpeak=TON_LOW;
        for (i=0, j=0x40; j>0; j--) {
            for(k=0;k<j;k++){
                for (var n = 0; n <= ( TON_RATE / KC_CTC_FREQ_VT16 << 0 ); n++)
                    buffer_tmp[ ( TON_RATE*i/KC_CTC_FREQ_VT16 << 0 ) + n ] = augenblicklicherpeak;
                i++;
            }
            augenblicklicherpeak = TON_LOW + TON_HIGH - augenblicklicherpeak;
        }
        console.log('tonsynthese: diamant buffer: ' + (TON_RATE / KC_CTC_FREQ_VT16 * ((0x40 * 0x40 + 0x40) / 2) << 0));
        
        soundType = 'api';
        console.log('initAudio: api: audioBuffer wird benutzt');
    }

	console.log('initAudio: ' + soundType + ': Initialisierung abgeschlossen');
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

//
// *Probleme mit dem iPad*
//
// var snd = document.createElement('audio'), src = document.createElement('source');
// src.src = "http://www.largesound.com/ashborytour/sound/brobob.mp3";
// src.type = "audio/mpeg";
// snd.appendChild(src);
// snd.preload = 'metadata';
// snd.play();
//
// https://www.ibm.com/developerworks/library/wa-ioshtml5/
// https://www.ibm.com/developerworks/library/wa-ioshtml5/#audiosprites
//
// on iOS,
// Audio streams cannot be loaded unless triggered by a user touch event
// such as onmousedown, onmouseup, onclick, or ontouchstart.
//     preloading, ontouchstart event triggered
//     ontouchstart event handler: soundsprite.play();


//
// *Notizen zum KC85-Sound*
//
// //Screenshots von Audacity, Wellenformen, youtube-Video von einem echten KC85
//     gfs/audio.png
//     http://youtu.be/gwyI_xZ1e5A
//
// //Links - Dokumentationen U857D-CTC Baustein
//     http://informatik.rostfrank.de/rt/lex09/z80ctc/ctc.htm
//     http://www.z80.info/zip/um0081.pdf
//     http://www.blunk-electronic.de/train-z/pdf/howto_program_the_Z80-CTC.pdf
//     https://lanale.de/kc85_emu/KC85_Emu.html
//     http://floooh.github.io/virtualkc/p010_kc85.html    
// 
// //CTC-Verarbeitung bei Digger
// [CPU-Takt/16|256] --> [--Timer0] (? == 0) --> ZC0       -pulse-> [FlipFlop rechts]
//                                           --> Interrupt -->      (ISR-CTC0)
// [CPU-Takt/16|256] --> [--Timer1] (? == 0) --> ZC1       -pulse-> [FlipFlop  links]
//                                           --> Interrupt -->      (ISR-CTC1)
// 
// //Konfiguration
// Es werden auf den I/O-Port 2 Byte geschrieben.
// In der Interrupttabelle müssen die ISR definiert sein.
// Bei jedem "Nulldurchlauf" wird ein Interrupt ausgelöst.
// Der FlipFlop schaltet via ZC-Impuls um (Halbwelle wechselt).
// Jetzt braucht der CTC eine neue Konfiguration (2 Byte).
// 
// //1.Byte, Steuercode
// 7 1 enable interrupt, 0 disable interrupt
// 6 1 counter-mode, 0 timer-mode (Zeitrunterzähler)
// 5 Vorteiler: 0 = 16 oder 1 = 256
// 4 Taktsignal aktiv: 1 steigende Flanke, 0 fallende Flanke
// 3 time trigger: 1 pulse starts timer, 0 automatischer start sobald die Zeitkonstante geladen wurde
// 2 time constant: 1 Zeitkonstante folgt, 0 nachfolgend keine Zeitkonstante
// 1 1 reset, 0 continue
// 0 1 control, 0 vector
// 
// Bei Digger wird 85h (Diamant und Stein), a5h (Schritt) und 03h (Reset/Stop) verwendet.
//  85h: Interrupt, Zeitrunterzähler, Vorteiler  16, startet nach schreiben der Zeitkonstante, nachfolgend Zeitkonstante, continue, control
//  a5h: Interrupt, Zeitrunterzähler, Vorteiler 256, startet nach schreiben der Zeitkonstante, nachfolgend Zeitkonstante, continue, control
//  03h: Reset/Stop
// 
// //2. Byte, Zeitkonstante (1-256)
// Besonderheit, TC = 0 entspricht 256!
// TC Wert:             1...255,   0
// entspricht Zeitwert: 1...255, 256
// 
// //Beispiel für CTC0
//     ld   hl,$2923
//     ld   ($01E8),hl //ISR Adresse in Interrupttabelle eintragen
//     ld   a,$85
//     out  ($8C),a    //Steuercode schreiben
//     ld   a,$40
//     out  ($8C),a    //Zeitkonstante schreiben
//     
// 2 Rechteck Generatoren, ctc0 und ctc1
//     - max. Samplerate <-- ( CPU-Takt/(16|256)/(1...256) )
//     - Samplerate = Halbwelle
//     - Rechteckschwingung wird mit FlipFlops realisiert
//     - nach Ablauf (wird runter gezählt) der Zeitkonstante (TC)
//         - wird der ZC-Ausgang gepulsed (und der triggert das FlipFlop)
//         - ein Interrupt wird ausgelöst
// 
// //CPU-Takt
//     KC85/2/3 1,75MHz
//     KC85/4   1,7734475 MHz
// 
// Parameter pro Kanal
//     Vorteiler 16 oder 256
//     Zeitkonstante 1...256 (1...255,0)
//     Lautstärke 0...32
// 
// //I/O Portadressen für die Konfiguration
// CTC0 8ch rechts
// CTC1 8dh links
// PIO  89h
// 
// 0x89
//     0-4 Lautstärke
//     5-6 frei
//     7 blinken an/aus
// 
// //Interrupt-Tabelle
//     CTC0
//     (0x01e8) <- 0x2923 (ISR Adresse, DIAMANT)
//              <- 0x290b (ISR Adresse, SCHRITT)
//     CTC1
//     (0x01ea) <- 0x3cf4 (ISR Adresse, STEIN)
// 
// //SCHRITT
// Steuercode a5h Vorteiler 256
// Zeitkonstanten 2
// Zeitkonstantenreihe 64 64
// 
// //DIAMANT
// Steuercode 85h Vorteiler 16
// Zeitkonstanten 64
// Zeitkonstantenreihe 64 63 62 ... 3 2 1
// 
// //STEIN
// Steuercode 85h Vorteiler 16
// Zeitkonstanten 20
// Zeitkonstantenreihe 255 0 1 2 3 ... 16 17 18
// //Besonderheit, Zeitkonstante 0 entspricht 256
// //also entspricht 255 256 1 2 3 ... 16 17 18)
// 
// //Assemblerroutinen, Digger-Töne
// 
// 2944: //UP Schritt
//     push hl
//     ld   hl,$290B
//     ld   ($01E8),hl
//     ld   a,$02
//     ld   ($0988),a
//     ld   a,$A5
//     out  ($8C),a
//     ld   a,$40
//     out  ($8C),a
//     pop  hl
//     ret
//     
// 290B: //ISR Schritt
//     di
//     push af
//     ld   a,($0988)
//     dec  a
//     jp   z,$291B
//     ld   ($0988),a
//     pop  af
//     ei
//     reti
// 291B:
//     ld   a,$03
//     out  ($8C),a
//     pop  af
//     ei
//     reti
// 
// 295A: //UP Diamant
//     push hl
//     ld   hl,$2923
//     ld   ($01E8),hl
//     ld   a,$40
//     ld   ($0988),a
//     ld   a,$85
//     out  ($8C),a
//     ld   a,$40
//     out  ($8C),a
//     pop  hl
//     ret
// 
// 2923: //ISR Diamant
//     di
//     push af
//     ld   a,($0988)
//     dec  a
//     jp   z,$293C
//     ld   ($0988),a
//     ld   a,$85
//     out  ($8C),a
//     ld   a,($0988)
//     out  ($8C),a
//     pop  af
//     ei
//     reti
// 293C:
//     ld   a,$03
//     out  ($8C),a
//     pop  af
//     ei
//     reti
// 
// 3D19: //UP Stein
//     push hl
//     ld   hl,$3CF4
//     ld   ($01EA),hl
//     ld   a,$14
//     ld   ($09FE),a
//     ld   a,$85
//     out  ($8D),a
//     ld   a,$FF
//     ld   ($09FF),a
//     out  ($8D),a
//     pop  hl
//     ret
// 
// 3CF4: //ISR Stein
//     di
//     push af
//     ld   a,($09FE)
//     dec  a
//     jp   z,$3D11
//     ld   ($09FE),a
//     ld   a,$85
//     out  ($8D),a
//     ld   a,($09FF)
//     inc  a
//     ld   ($09FF),a
//     out  ($8D),a
//     pop  af
//     ei
//     reti
// 3D11:
//     ld   a,$03
//     out  ($8D),a
//     pop  af
//     ei
//     reti
