(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var BufferLoader = function BufferLoader(context) {
    var newInstrumentPack = new Array();

    var loadBuffer = function loadBuffer(instrument, index) {
        var bufferAmount = instrument.paths.length;
        var bufferCount = 0;
        instrument.buffers = [];

        var loadingSound = new Promise(function (res, rej) {

            instrument.paths.map(function (url, i) {
                // Load buffer asynchronously
                var request = new XMLHttpRequest();
                request.open("GET", url, true);
                request.responseType = "arraybuffer";

                request.onload = function () {
                    // Asynchronously decode the audio file data in request.response
                    context.decodeAudioData(request.response, function (buffer) {
                        if (!buffer) {
                            alert('error decoding file data: ' + url);
                            return;
                        }

                        instrument.buffers[i] = buffer;
                        newInstrumentPack[index] = instrument;
                        bufferCount++;
                        if (bufferCount === bufferAmount) {
                            res();
                        }
                    }, function (error) {
                        rej();
                        console.error('decodeAudioData error', error);
                    });
                };

                request.onerror = function () {
                    alert('BufferLoader: XHR error');
                };

                request.send();
            });
        });

        return loadingSound;
    };

    var load = function load(instrumentPack) {
        var loadingSounds = instrumentPack.map(loadBuffer);

        return new Promise(function (res, rej) {
            Promise.all(loadingSounds).then(function () {
                return res(newInstrumentPack);
            })["catch"](rej);
        });
    };

    return {
        load: load
    };
};

var loadInstrumentBuffers = function loadInstrumentBuffers(context, instrumentPack) {
    return BufferLoader(context).load(instrumentPack);
};

var renderSoundsToBuffer = function renderSoundsToBuffer(buffers) {
    var offlineCtx = new OfflineAudioContext(2, 44100 * 40, 44100);

    buffers.forEach(function (buffer) {
        return playSound();
    });

    return newBuffer;
};

var playSound = function playSound(context, buffer, time, duration, volume) {
    var detune = arguments.length <= 5 || arguments[5] === undefined ? 0 : arguments[5];

    var source = context.createBufferSource();
    var gainNode = context.createGain();

    source.connect(gainNode);

    gainNode.connect(context.destination);
    gainNode.gain.value = volume;

    source.buffer = buffer;
    source.start(time, 0, duration);

    source.detune.value = detune;

    return source;
};

exports.loadInstrumentBuffers = loadInstrumentBuffers;
exports.renderSoundsToBuffer = renderSoundsToBuffer;
exports.playSound = playSound;

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var _sequences = require('./sequences');

var _tools = require('./tools');

var _audio = require('./audio');

var defaultInstrument = {
    id: '',
    buffers: [],
    durations: [],
    hitTypes: [],
    paths: [],
    sequence: [],
    sources: [],
    timeMap: []
};

var instruments = {
    guitar: {
        id: 'guitar',
        paths: ['assets/audio/guitar-palm-zero-1.wav', 'assets/audio/guitar-palm-zero-2.wav', 'assets/audio/guitar-open-zero-1.wav', 'assets/audio/guitar-open-zero-2.wav', 'assets/audio/guitar-open-first-1.wav', 'assets/audio/guitar-open-first-2.wav',
        // 'assets/audio/guitar-open-eighth.wav',
        'assets/audio/guitar-dissonance-high.wav']
    },
    kick: {
        id: 'kick',
        paths: ['assets/audio/kick.wav']
    },
    snare: {
        id: 'snare',
        paths: ['assets/audio/snare.wav']
    },
    hihat: {
        id: 'hihat',
        paths: ['assets/audio/hihat.wav']
    },
    crash: {
        id: 'crash',
        paths: [
        // 'assets/audio/crash1.wav',
        // 'assets/audio/crash2.wav',
        'assets/audio/china.wav']
    }
};

var getInstrument = function getInstrument(id, other) {
    return _extends({}, defaultInstrument, instruments[id], other);
};

var getInstrumentPack = function getInstrumentPack(sequences, totalBeats) {
    return Object.keys(sequences).map(function (instrumentId) {
        return getInstrument(instrumentId, { sequence: (0, _sequences.loopSequence)(sequences[instrumentId]) });
    });
};

var generateInstrumentTimeMap = function generateInstrumentTimeMap(instrument) {
    var timeMap = (0, _sequences.generateTimeMap)(instrument.sequence);

    return _extends({}, instrument, {
        timeMap: timeMap
    });
};

var generateInstrumentHitTypes = function generateInstrumentHitTypes(instrument) {
    var hitTypes = instrument.sequence.map(function (hit) {
        return (0, _tools.randFromTo)(0, instrument.buffers.length - 1);
    });

    return _extends({}, instrument, {
        hitTypes: hitTypes
    });
};

var renderInstrumentSoundsAtTempo = function renderInstrumentSoundsAtTempo(instruments, totalBeats, bpmMultiplier) {
    var timeLength = totalBeats * bpmMultiplier;
    var offlineCtx = new OfflineAudioContext(2, 44100 * timeLength, 44100);

    instruments.forEach(function (instrument) {
        var startTimes = [];
        var durations = [];
        var sources = instrument.timeMap.reduce(function (sources, time, i) {
            var instrumentSound = instrument.buffers[instrument.hitTypes[i]];
            var startTime = offlineCtx.currentTime + time * bpmMultiplier;
            var duration = 1 / instrument.sequence[i].beat * bpmMultiplier;
            var source = (0, _audio.playSound)(offlineCtx, instrumentSound, startTime, duration, instrument.sequence[i].volume, 0);

            startTimes[i] = startTime;
            durations[i] = duration;

            return [].concat(_toConsumableArray(sources), [source]);
        }, []);
    });
    return new Promise(function (res, rej) {
        offlineCtx.oncomplete = function (ev) {
            return res(ev.renderedBuffer);
        };
        offlineCtx.onerror = function (ev) {
            return rej(ev.renderedBuffer);
        };
        offlineCtx.startRendering();
    });
};
//
// const renderInstrumentSoundsAtTempo = (context, bpmMultiplier) => (instrument) => {
//     let startTimes = [];
//     let durations  = [];
//     const sources = instrument.timeMap.reduce((sources, time, i) => {
//         const instrumentSound = instrument.buffers[instrument.hitTypes[i]];
//         const startTime       = context.currentTime + (time * bpmMultiplier);
//         const duration        = (1 / instrument.sequence[i].beat) * bpmMultiplier;
//         const source          = playSound(context, instrumentSound, startTime, duration, instrument.sequence[i].volume);
//
//         startTimes[i] = startTime;
//         durations[i]   = duration;
//
//         return [ ...sources, source ];
//     }, []);
//
//     const newInstrument = { ...instrument, sources, startTimes, durations };
//
//     return newInstrument;
// }

var repeatHits = function repeatHits(instrument) {
    var hitTypes = (0, _tools.repeatArray)(instrument.hitTypes, instrument.sequence.length);

    return _extends({}, instrument, {
        hitTypes: hitTypes
    });
};

var repeatSequence = function repeatSequence(instrument, beats) {
    var sequence = (0, _sequences.loopSequence)(instrument.sequence, beats);

    return _extends({}, instrument, {
        sequence: sequence
    });
};

exports.getInstrument = getInstrument;
exports.getInstrumentPack = getInstrumentPack;
exports.generateInstrumentTimeMap = generateInstrumentTimeMap;
exports.generateInstrumentHitTypes = generateInstrumentHitTypes;
exports.renderInstrumentSoundsAtTempo = renderInstrumentSoundsAtTempo;
exports.repeatHits = repeatHits;
exports.repeatSequence = repeatSequence;

},{"./audio":1,"./sequences":3,"./tools":4}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var _tools = require('./tools');

var predefinedSequences = {
    steadyWholes: {
        sequence: [{ beat: .25, volume: 1 }]
    },

    steadyHalfs: {
        sequence: [{ beat: .5, volume: 1 }]
    },

    steadyQuarters: {
        sequence: [{ beat: 1, volume: 1 }]
    },

    middleBeat: {
        sequence: [{ beat: 1, volume: 0 }, { beat: 1, volume: 0 }, { beat: 1, volume: 1 }, { beat: 1, volume: 0 }]
    }
};

var instrumentSequences = {
    hihat: [predefinedSequences.steadyHalfs.sequence, predefinedSequences.steadyQuarters.sequence],
    crash: [predefinedSequences.steadyWholes.sequence, predefinedSequences.steadyHalfs.sequence, predefinedSequences.steadyQuarters.sequence],
    snare: [predefinedSequences.middleBeat.sequence]
};

var getSequenceForInstrument = function getSequenceForInstrument(instrument) {
    return (0, _tools.randomFromArray)(instrumentSequences[instrument]);
};

var generateSequence = function generateSequence(_ref) {
    var totalBeats = _ref.totalBeats;
    var allowedLengths = _ref.allowedLengths;
    var hitChance = _ref.hitChance;

    return (function loop(_x, _x2, _x3) {
        var _again = true;

        _function: while (_again) {
            var seq = _x,
                sum = _x2,
                target = _x3;
            _again = false;

            var newLength = (0, _tools.randomFromArray)(allowedLengths);

            if (sum + 1 / newLength > target) {
                if (!allowedLengths.filter(function (length) {
                    return 1 / length < target - sum;
                }).length) {
                    newLength = 1 / (target - sum);
                } else {
                    _x = seq;
                    _x2 = sum;
                    _x3 = target;
                    _again = true;
                    newLength = undefined;
                    continue _function;
                }
            }

            if (Math.floor(sum + .001) < target && isFinite(newLength)) {
                sum += 1 / newLength;
                var newBeat = {
                    beat: newLength,
                    volume: Math.random() < hitChance ? 1 : 0
                };
                _x = [].concat(_toConsumableArray(seq), [newBeat]);
                _x2 = sum;
                _x3 = target;
                _again = true;
                newLength = newBeat = undefined;
                continue _function;
            }
            return seq;
        }
    })([], 0, totalBeats);
};

var loopSequence = function loopSequence(sequence, totalBeats) {
    var totalBeatLength = Math.round(sequence.reduce(function (prev, next) {
        return 1 / next.beat + prev;
    }, 0));
    var newSequence = [].concat(_toConsumableArray(sequence));

    if (totalBeatLength === totalBeats) return newSequence;
    if (totalBeatLength > totalBeats) return newSequence.slice(0, totalBeats - 1);

    var i = 0;
    while (Math.floor(totalBeatLength) < totalBeats) {
        newSequence = newSequence.concat(newSequence[i]);
        totalBeatLength += 1 / newSequence[i].beat;
        i = i + 1 < newSequence.length ? i + 1 : 0;
    }

    return newSequence;
};

var generateTimeMap = function generateTimeMap(sequence) {
    var times = sequence.map(function (beat, i, seq) {
        var result = seq.slice(0, i + 1).reduce(function (prev, cur, i, seq) {
            return prev + 1 / cur.beat;
        }, 0);
        return result;
    });

    return [0].concat(_toConsumableArray(times.slice(0, times.length - 1)));
};

exports.generateSequence = generateSequence;
exports.getSequenceForInstrument = getSequenceForInstrument;
exports.loopSequence = loopSequence;
exports.generateTimeMap = generateTimeMap;

},{"./tools":4}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var arraySelector = function arraySelector(selector) {
	return Array.from(document.querySelectorAll(selector));
};

var repeat = function repeat(simsNeeded, fn) {
	for (var i = simsNeeded - 1, x = 0; i >= 0; i--) {
		fn(simsNeeded, x);
		x++;
	};
};

var repeatArray = function repeatArray(arr, length) {
	if (length === 0) return [];
	if (arr.length === length) return arr;
	if (arr.length > length) return arr.slice(0, length);

	var diff = Math.ceil(length / arr.length);
	return Array.from(Array(diff).keys()).reduce(function (newArr, index) {
		return newArr.concat.apply(newArr, _toConsumableArray(arr));
	}, []).slice(0, length);
};

var compose = function compose() {
	for (var _len = arguments.length, funcs = Array(_len), _key = 0; _key < _len; _key++) {
		funcs[_key] = arguments[_key];
	}

	return function () {
		if (funcs.length === 0) {
			return arguments[0];
		}

		var last = funcs[funcs.length - 1];
		var rest = funcs.slice(0, -1);

		return rest.reduceRight(function (composed, f) {
			return f(composed);
		}, last.apply(undefined, arguments));
	};
};

var randFromTo = function randFromTo(from, to) {
	return Math.floor(Math.random() * (to - from + 1) + from);
};

var randomFromArray = function randomFromArray(arr) {
	return arr[randFromTo(0, arr.length - 1)];
};

exports.arraySelector = arraySelector;
exports.repeat = repeat;
exports.repeatArray = repeatArray;
exports.compose = compose;
exports.randomFromArray = randomFromArray;
exports.randFromTo = randFromTo;

},{}],5:[function(require,module,exports){
'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

require('./polyfills/array.values.js');

require('./polyfills/AudioContext');

var _appAudio = require('./app/audio');

var _appSequences = require('./app/sequences');

var _appInstruments = require('./app/instruments');

var _appTools = require('./app/tools');

var generateRiff = function generateRiff(_ref) {
    var bpm = _ref.bpm;
    var totalBeats = _ref.totalBeats;
    var grooveBeats = _ref.grooveBeats;
    var allowedLengths = _ref.allowedLengths;
    var sequences = _ref.sequences;

    var bpmMultiplier = 60 / bpm;
    var context = new AudioContext();
    var instrumentPack = (0, _appInstruments.getInstrumentPack)(sequences, totalBeats);

    (0, _appAudio.loadInstrumentBuffers)(context, instrumentPack).then(function (instrumentPack) {
        return initiateInstruments(context, instrumentPack, totalBeats, bpmMultiplier);
    }).then(function (buffer) {
        return initiateBufferController(context, buffer);
    })['catch'](console.log);
};

var initiateInstruments = function initiateInstruments(context, instrumentPack, totalBeats, bpmMultiplier) {
    var createSoundMaps = function createSoundMaps(instrument) {
        return (0, _appTools.compose)(_appInstruments.generateInstrumentTimeMap, _appInstruments.repeatHits, function (instrument) {
            return (0, _appInstruments.repeatSequence)(instrument, totalBeats);
        }, _appInstruments.generateInstrumentHitTypes)(instrument);
    };

    var instruments = instrumentPack.map(createSoundMaps);

    return (0, _appInstruments.renderInstrumentSoundsAtTempo)(instruments, totalBeats, bpmMultiplier);
};

var initiateBufferController = function initiateBufferController(context, buffer) {
    var playButton = document.querySelector('.js-play');
    var stopButton = document.querySelector('.js-stop');
    var regenerateButton = document.querySelector('.js-regenerate');
    var loopCheckbox = document.querySelector('.js-loop');

    var src = undefined;

    var play = function play() {
        return (0, _appAudio.playSound)(context, buffer, context.currentTime, buffer.duration, 1, true);
    };
    var stop = function stop() {
        if (src) src.stop();
    };
    var isLooping = loopCheckbox.checked;

    var playEvent = function playEvent() {
        stop();
        src = play();
        src.loop = isLooping;
    };

    var stopEvent = stop;

    var regenerateEvent = function regenerateEvent() {
        stop();
        deactivate();
        init();
    };

    var loopEvent = function loopEvent(evt) {
        isLooping = evt.target.checked;
    };

    var deactivate = function deactivate() {
        context.close();
        playButton.removeEventListener('click', playEvent);
        stopButton.removeEventListener('click', stopEvent);
        regenerateButton.removeEventListener('click', regenerateEvent);
        loopCheckbox.removeEventListener('change', loopEvent);
    };

    playButton.addEventListener('click', playEvent);
    stopButton.addEventListener('click', stopEvent);
    regenerateButton.addEventListener('click', regenerateEvent);
    loopCheckbox.addEventListener('change', loopEvent);
};

var init = function init() {
    var bpm = parseInt(document.querySelector('.js-bpm').value);
    var totalBeats = parseInt(document.querySelector('.js-total-beats').value);
    var grooveBeats = parseInt(document.querySelector('.js-groove-beats').value);

    var allowedLengths = (0, _appTools.arraySelector)('.js-lengths').reduce(function (lengths, cur, index, arr) {
        var children = Array.from(cur.children);
        var isTriplet = cur.querySelector('.js-triplet').checked;
        var amount = parseInt(cur.querySelector('.js-amount').value);
        var length = parseFloat(cur.dataset.length) * (isTriplet ? 1.5 : 1);

        return [].concat(_toConsumableArray(lengths), _toConsumableArray((0, _appTools.repeatArray)([length], amount)));
    }, []);

    if (!allowedLengths.length) return;

    var mainBeat = (0, _appSequences.generateSequence)({ totalBeats: grooveBeats, allowedLengths: allowedLengths, hitChance: 1 });
    var crashSequence = (0, _appSequences.getSequenceForInstrument)('crash');
    var hihatSequence = (0, _appSequences.getSequenceForInstrument)('hihat');
    var snareSequence = (0, _appSequences.getSequenceForInstrument)('snare');

    var sequences = {
        crash: crashSequence,
        hihat: hihatSequence,
        kick: mainBeat,
        guitar: mainBeat,
        snare: snareSequence
    };

    generateRiff({ bpm: bpm, totalBeats: totalBeats, grooveBeats: grooveBeats, allowedLengths: allowedLengths, sequences: sequences });
};

init();

},{"./app/audio":1,"./app/instruments":2,"./app/sequences":3,"./app/tools":4,"./polyfills/AudioContext":6,"./polyfills/array.values.js":7}],6:[function(require,module,exports){
"use strict";

window.AudioContext = window.AudioContext || window.webkitAudioContext;

},{}],7:[function(require,module,exports){
'use strict';

var reduce = Function.bind.call(Function.call, Array.prototype.reduce);
var isEnumerable = Function.bind.call(Function.call, Object.prototype.propertyIsEnumerable);
var concat = Function.bind.call(Function.call, Array.prototype.concat);
var keys = Reflect.ownKeys;

if (!Object.values) {
	Object.values = function values(O) {
		return reduce(keys(O), function (v, k) {
			return concat(v, typeof k === 'string' && isEnumerable(O, k) ? [O[k]] : []);
		}, []);
	};
}

if (!Object.entries) {
	Object.entries = function entries(O) {
		return reduce(keys(O), function (e, k) {
			return concat(e, typeof k === 'string' && isEnumerable(O, k) ? [[k, O[k]]] : []);
		}, []);
	};
}

},{}]},{},[5])