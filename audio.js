// jdigger/Digger.JS - KC85 Soundemulation per WebAudio
// Copyright (C) 2017–2025  Marko Klingner
// GNU GPL v3 - https://www.gnu.org/licenses/gpl-3.0.html


let soundType='no',gainNode,mergerNode,audioContext,audioBuffers={};

// KC85 System Konstanten
const CPU_FREQ_KC85_2=1750000,   //CPU-Takt KC85/2
      CPU_FREQ_KC85_3=1750000,   //CPU-Takt KC85/3
      CPU_FREQ_KC85_4=1773447.5, //CPU-Takt KC85/4
      // max. Samplefreq. (Halbwellen)[CPU-Takt] / [CTC-Vorteiler]
      // ich benutze den KC85/3-Takt
      KC_CTC_FREQ_VT16=CPU_FREQ_KC85_3/16,  //VT16  -> 109375Hz
      KC_CTC_FREQ_VT256=CPU_FREQ_KC85_3/256, //VT256 -> 6835,9375Hz
      TONE_LOW=-1,
      TONE_HIGH=1,
      TONE_RATE=44100; //default 44100Hz webAudio-API-Samplefreq. (Halbwellen)

function initAudio(){
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC)return;
  audioContext=new AC();
  gainNode=audioContext.createGain();
  gainNode.gain.value=.2;
  gainNode.connect(audioContext.destination);
  mergerNode=audioContext.createChannelMerger(2);
  mergerNode.connect(gainNode);
  
  // Leerer Buffer
  audioBuffers.Leer=audioContext.createBuffer(1,1,TONE_RATE);
  
  // Generiere Step-, Stone- und Diamond-Buffer
  
  // Step: 2 Halbwellen mit Zeitkonstante 0x40 und Prescaler 256
  audioBuffers.Step=createToneBuffer([{tc:0x40,count:2,freq:KC_CTC_FREQ_VT256}]);
  console.log('tonsynthese: schritt buffer: '+audioBuffers.Step.length);
  
  // Stone: 0x14 (20) Halbwellen mit aufsteigender Zeitkonstante (0xFF, 0x00, 0x01...) und Prescaler 16
  audioBuffers.Stone=createToneBuffer(Array.from({length:0x14},(v,i)=>({tc:((0xFF+i)&0xFF)||256,count:1,freq:KC_CTC_FREQ_VT16})));
  console.log('tonsynthese: stein buffer: '+audioBuffers.Stone.length);
  
  // Diamond: 0x40 (64) Halbwellen mit absteigender Zeitkonstante (0x40, 0x3F...) und Prescaler 16
  audioBuffers.Diamond=createToneBuffer(Array.from({length:0x40},(v,i)=>({tc:0x40-i,count:1,freq:KC_CTC_FREQ_VT16})));
  console.log('tonsynthese: diamant buffer: '+audioBuffers.Diamond.length);
  
  soundType='api';
  console.log('webAudio: '+soundType+': Initialisierung abgeschlossen');
}

// Berechne die Rechteck-Wellenformen
function createToneBuffer(tones){
  // Berechne die Gesamtanzahl der Samples für alle Halbwellen
  const totalSamples=tones.reduce((sum,{tc,count,freq})=>sum+count*Math.floor(TONE_RATE/freq*tc),0);
  
  const buffer=audioContext.createBuffer(1,totalSamples,TONE_RATE);
  const data=buffer.getChannelData(0);
  let pos=0,peak=TONE_LOW;
  
  tones.forEach(({tc,count,freq})=>{
    // Samples pro Halbwelle basierend auf Zeitkonstante und Frequenz
    const samplesPerHalfWave=Math.floor(TONE_RATE/freq*tc);
    
    // Erzeuge 'count' Halbwellen
    for(let i=0;i<count;i++){
      // Fülle eine Halbwelle mit dem aktuellen Pegel
      for(let k=0;k<samplesPerHalfWave;k++)
        data[pos++]=peak;
      
      // Schalte die Polarität um (entspricht einem CTC-Interrupt)
      peak=TONE_LOW+TONE_HIGH-peak;
    }
  });
  
  return buffer;
}

function playAudio(ton){
    if(soundType!=='api'||!audioBuffers[ton])return;
    
    const source=audioContext.createBufferSource();
    source.buffer=audioBuffers[ton];
    source.connect(mergerNode,0,ton==='Step'||ton==='Diamond'?1:0);
    source.start(0);
}
