// jdigger/Digger.JS - KC85 Soundemulation per WebAudio
// Copyright (C) 2017–2025  Marko Klingner
// GNU GPL v3 - http://www.gnu.org/licenses/

let soundType='no',gainNode,mergerNode,audioContext,audioBuffers={};

// KC85 System Konstanten
const CPU_FREQ_KC85_2=1750000,   //CPU-Takt KC85/2
      CPU_FREQ_KC85_3=1750000,   //CPU-Takt KC85/3
      CPU_FREQ_KC85_4=1773447.5, //CPU-Takt KC85/4
      //max. Samplefreq. (Halbwellen)[CPU-Takt] / [CTC-Vorteiler]
      KC_CTC_FREQ_VT16=CPU_FREQ_KC85_3/16,  //VT16  -> 109375Hz
      KC_CTC_FREQ_VT256=CPU_FREQ_KC85_3/256, //VT256 -> 6835,9375Hz
      TON_LOW=-1,
      TON_HIGH=1,
      TON_RATE=44100; //default 44100Hz webAudio-API-Samplefreq. (Halbwellen)

function initAudio(){
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return;
    
    audioContext=new AC();
    gainNode=audioContext.createGain();
    gainNode.gain.value=.2;
    gainNode.connect(audioContext.destination);
    mergerNode=audioContext.createChannelMerger(2);
    mergerNode.connect(gainNode);
    
    // leerer Buffer
    audioBuffers.Leer=audioContext.createBuffer(1,1,TON_RATE);
    
    // generiere Step-, Stone- und Diamond-Buffer
    audioBuffers.Step=createToneBuffer([{tc:0x40,count:2,freq:KC_CTC_FREQ_VT256}]);
    console.log('tonsynthese: schritt buffer: '+audioBuffers.Step.length);
    
    audioBuffers.Stone=createToneBuffer(Array.from({length:0x14},(v,i)=>({tc:((0xFF+i)&0xFF)||256,count:1,freq:KC_CTC_FREQ_VT16})));
    console.log('tonsynthese: stein buffer: '+audioBuffers.Stone.length);
    
    audioBuffers.Diamond=createToneBuffer(Array.from({length:0x40},(v,i)=>({tc:0x40-i,count:1,freq:KC_CTC_FREQ_VT16})));
    console.log('tonsynthese: diamant buffer: '+audioBuffers.Diamond.length);
    
    soundType='api';
    console.log('webAudio: '+soundType+': Initialisierung abgeschlossen');
}

// berechne CTC-Rechteck-Wellenformen
function createToneBuffer(tones){
    const totalSamples=tones.reduce((sum,{tc,count,freq})=>sum+count*2*Math.floor(TON_RATE/freq*tc),0);
    const buffer=audioContext.createBuffer(1,totalSamples,TON_RATE);
    const data=buffer.getChannelData(0);
    
    let pos=0,peak=TON_LOW;
    tones.forEach(({tc,count,freq})=>{
        const samples=Math.floor(TON_RATE/freq*tc);
        for(let i=0;i<count;i++){
            for(let k=0;k<samples;k++)data[pos++]=peak;
            peak=TON_LOW+TON_HIGH-peak;
            for(let k=0;k<samples;k++)data[pos++]=peak;
            peak=TON_LOW+TON_HIGH-peak;
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
