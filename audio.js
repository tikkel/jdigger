// SPDX-License-Identifier: GPL-3.0
// jdigger/audio.js - KC85 Soundemulation mit WebAudio
// Copyright (C) 2017–2025  Marko Klingner

let sound_type = 'no';
let gain_node;
let merger_node;
let audio_context;
let audio_buffers = {};

/* KC85 Systemkonstanten */
const CPU_FREQ_KC85_2 = 1750000;	// CPU-Takt KC85/2
const CPU_FREQ_KC85_3 = 1750000;	// CPU-Takt KC85/3
const CPU_FREQ_KC85_4 = 1773447.5;	// CPU-Takt KC85/4
/*
 * Max. Samplefreq. (Halbwellen)[CPU-Takt] / [CTC-Vorteiler]
 * Ich benutze den KC85/3-Takt
 */
const KC_CTC_FREQ_VT16 = CPU_FREQ_KC85_3 / 16;	// VT16  -> 109375Hz
const KC_CTC_FREQ_VT256 = CPU_FREQ_KC85_3 / 256;	// VT256 -> 6835.9375Hz
const TONE_LOW = -1;
const TONE_HIGH = 1;
const TONE_RATE = 44100;	// WebAudio-API-Samplefreq.

function init_audio() {
	const AC = window.AudioContext || window.webkitAudioContext;
	if (!AC)
		return;

	audio_context = new AC();
	gain_node = audio_context.createGain();
	gain_node.gain.value = 0.2;
	gain_node.connect(audio_context.destination);
	merger_node = audio_context.createChannelMerger(2);
	merger_node.connect(gain_node);

	/* Leerer Buffer */
	audio_buffers.Leer = audio_context.createBuffer(1, 1, TONE_RATE);

	/* Generiere Step-, Stone- und Diamond-Buffer */
	// Step: 2 Halbwellen mit Zeitkonstante 0x40 und Prescaler 256
	audio_buffers.Step = create_tone_buffer([{
		tc: 0x40,
		count: 2,
		freq: KC_CTC_FREQ_VT256
	}]);
	console.log('tonsynthese: schritt buffer: ' + audio_buffers.Step.length);

	/* Stone: 0x14 Halbwellen mit aufsteigender Zeitkonstante */
	audio_buffers.Stone = create_tone_buffer(Array.from({
		length: 0x14
	}, (v, i) => ({
		tc: ((0xFF + i) & 0xFF) || 256,
		count: 1,
		freq: KC_CTC_FREQ_VT16
	})));
	console.log('tonsynthese: stein buffer: ' + audio_buffers.Stone.length);

	/* Diamond: 0x40 Halbwellen mit absteigender Zeitkonstante */
	audio_buffers.Diamond = create_tone_buffer(Array.from({
		length: 0x40
	}, (v, i) => ({
		tc: 0x40 - i,
		count: 1,
		freq: KC_CTC_FREQ_VT16
	})));
	console.log('tonsynthese: diamant buffer: ' + audio_buffers.Diamond.length);

	sound_type = 'api';
	console.log('webAudio: ' + sound_type + ': Initialisierung abgeschlossen');
}

/* Berechne Rechteck-Wellenformen */
function create_tone_buffer(tones) {
	/* Berechne Gesamtsamples für alle Halbwellen */
	let total_samples = 0;
	tones.forEach(({
		tc,
		count,
		freq
	}) => {
		total_samples += count * Math.floor(TONE_RATE / freq * tc);
	});

	const buffer = audio_context.createBuffer(1, total_samples, TONE_RATE);
	const data = buffer.getChannelData(0);
	let pos = 0;
	let peak = TONE_LOW;

	tones.forEach(({
		tc,
		count,
		freq
	}) => {
		/* Samples pro Halbwelle */
		const samples_per_half_wave = Math.floor(TONE_RATE / freq * tc);

		/* Erzeuge Halbwellen */
		for (let i = 0; i < count; i++) {
			for (let k = 0; k < samples_per_half_wave; k++)
				data[pos++] = peak;

			/* Polarität umschalten (CTC-Interrupt) */
			peak = TONE_LOW + TONE_HIGH - peak;
		}
	});

	return buffer;
}

function play_audio(ton) {
	if (sound_type !== 'api' || !audio_buffers[ton])
		return;

	const source = audio_context.createBufferSource();
	source.buffer = audio_buffers[ton];
	source.connect(
		merger_node,
		0,
		(ton === 'Step' || ton === 'Diamond') ? 1 : 0
	);
	source.start(0);
}
