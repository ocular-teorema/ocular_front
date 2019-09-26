function OcularShakaManifestGenerator() {
    this.curId_ = 0;
    this.config_ = null;
}

OcularShakaManifestGenerator.prototype.configure = function (config) {
    this.config_ = config;
};

OcularShakaManifestGenerator.prototype.start = function (uri, playerInterface) {
    var _this = this;
    return new Promise(function (resolve) {
        var httpRequest = new XMLHttpRequest();
        httpRequest.onreadystatechange = function () {
            if (httpRequest.readyState === 4) {
                if (httpRequest.status === 200) {
                    resolve(_this.loadManifest_(JSON.parse(httpRequest.responseText), new URL(uri).hostname));
                }
            }
        };
        httpRequest.open('GET', uri);
        httpRequest.send();
    });

};

OcularShakaManifestGenerator.prototype.stop = function () {
    return Promise.resolve();
};

OcularShakaManifestGenerator.prototype.loadManifest_ = function (data, serverAddress) {
    var timeline = new shaka.media.PresentationTimeline(null, 0);
    timeline.setDuration(data.length > 0 ? Math.floor((data[data.length - 1].end - data[0].start) / 1000) : 0);  // seconds

    var manifest = {
        presentationTimeline: timeline,
        minBufferTime: 5,  // seconds
        offlineSessionIds: [],
        periods: []
    };
    for (var i = 0; i < data.length; i++) {
        manifest.periods.push(
            this.loadPeriod_(i, 
                Math.floor((data[i].start - data[0].start) / 1000), 
                Math.floor((data[i].end - data[0].start) / 1000),
                'http://' + serverAddress + ':8080' + data[i].archivePostfix));
    }
    return manifest;
};

OcularShakaManifestGenerator.prototype.loadPeriod_ = function (position, startSecond, endSecond, url) {
    return {
        startTime: startSecond,  // seconds, relative to presentation
        variants: [
            this.loadVariant_(position, 0, endSecond - startSecond, url)
        ],
        textStreams: []
    };
};

OcularShakaManifestGenerator.prototype.loadVariant_ = function (position, startSecond, endSecond, url) {

    return {
        id: this.curId_++,  // globally unique ID
        language: 'en',
        primary: true,
        audio: null,
        video: this.loadStream_(position, startSecond, endSecond, url),
        bandwidth: 8000,  // bits/sec, audio+video combined
        drmInfos: [],
        allowedByApplication: true,  // always initially true
        allowedByKeySystem: true   // always initially true
    };
};

OcularShakaManifestGenerator.prototype.loadStream_ = function (position, startSecond, endSecond, url) {
    var references = [
        this.loadReference_(position, startSecond, endSecond, url)
    ];

    return {
        id: this.curId_++,  // globally unique ID
        createSegmentIndex: function () { return Promise.resolve(); },
        findSegmentPosition: function (seconds) { return 0; },
        getSegmentReference: function (pos) { return references[0]; },
        //segmentIndex:           index,
        presentationTimeOffset: startSecond,
        mimeType: 'video/mp4',
        codecs: 'avc1.4d4028', //type == 'video' ? 'vp9' : (type == 'audio' ? 'vorbis' : ''),
        frameRate: 24, //type == 'video' ? 24 : undefined,
        bandwidth: 8000,  // bits/sec
        width: 640, //type == 'video' ? 640 : undefined,
        height: 480, //type == 'video' ? 480 : undefined,
        kind: undefined, //type == 'text' ? 'subtitles' : undefined,
        channelsCount: undefined, //type == 'audio' ? 2 : undefined,
        encrypted: false,
        keyId: null,
        language: 'en',
        label: 'archive_stream',
        type: 'video',
        primary: false,
        trickModeVideo: null,
        containsEmsgBoxes: false,
        roles: []
    };
};

OcularShakaManifestGenerator.prototype.loadReference_ =
    function (position, start, end, url) {
        var getUris = function () { return [url]; };
        return new shaka.media.SegmentReference(
            position, start, end, getUris,
      /* startByte */ 0,
      /* endByte */ null);
    };

// Install built-in polyfills to patch browser incompatibilities.
shaka.polyfill.installAll();
//shaka.media.ManifestParser.registerParserByExtension('json', OcularShakaManifestGenerator);
shaka.media.ManifestParser.registerParserByMime('application/json', OcularShakaManifestGenerator);

var module = angular.module('Directives');
module.directive('ngShakaPlayer', function ($timeout) {
    function getByte(uint8Array, prevBuffer, pos) {
        return pos < 0 ? prevBuffer[prevBuffer.length - i] : uint8Array[pos];
    }

    function setByte(uint8Array, pos, val) {
        if (pos >= 0) uint8Array[pos] = val;
    }

    function getInt32(uint8Array, prevBuffer, pos) {
        return getByte(uint8Array, prevBuffer, pos) << 24 |
            getByte(uint8Array, prevBuffer, pos + 1) << 16 |
            getByte(uint8Array, prevBuffer, pos + 2) << 8 |
            getByte(uint8Array, prevBuffer, pos + 3);
    }

    function setInt32(uint8Array, pos, val) {
        setByte(uint8Array, pos, val >>> 24 & 0xff);
        setByte(uint8Array, pos + 1, val >>> 16 & 0xff);
        setByte(uint8Array, pos + 2, val >>> 8 & 0xff);
        setByte(uint8Array, pos + 3, val & 0xff);
    }

    function scanSignature(uint8Array, prevBuffer, pos, signature) {
        for (var i = 0; i < signature.length; i++) {
            if (getByte(uint8Array, prevBuffer, pos + i) !== signature.charCodeAt(i))
                return false;
        }
        return true;
    }

    function removeBaseDataOffsetResponseFilter(type, response) {
        var lastPartialMoof = [];
        var moofSize = 8 + 128;
        var trafOffset = 24;
        var tfhdOffset = trafOffset + 8;
        var trunOffset = tfhdOffset + 56;
        var responseNumber = 0;
        var mustReencode = false;

        responseNumber++;
        if (type === shaka.net.NetworkingEngine.RequestType.SEGMENT) {
            var buffer = new Uint8Array(response.data);
            var newBuffer;
            var i = -lastPartialMoof.length;
            var ni = 0;
            while (i < buffer.length) {
                try {
                    if (scanSignature(buffer, lastPartialMoof, i, 'moof')) {
                        if (buffer.length - i < moofSize) {
                            lastPartialMoof = [];
                            while (i < buffer.length)
                                lastPartialMoof.push(buffer[i++]);
                            break;
                        }
                        if (scanSignature(buffer, lastPartialMoof, i + trafOffset, 'traf')) {
                            if (scanSignature(buffer, lastPartialMoof, i + tfhdOffset, 'tfhd')) {
                                var tfhdFlags = getInt32(buffer, lastPartialMoof, i + tfhdOffset + 4);
                                var hasBaseDataOffset = tfhdFlags & 1;
                                if (hasBaseDataOffset) {
                                    // first time initializing new buffer for re-encoded content
                                    if (!mustReencode) {
                                        newBuffer = new Uint8Array(buffer.length);
                                        mustReencode = true;
                                        for (ni = 0; ni < i; ni++)
                                            newBuffer[ni] = buffer[ni];
                                    }

                                    for (var k = 0; k < tfhdOffset + 12; k++)
                                        newBuffer[ni + k] = buffer[i + k];
                                    moofSize = getInt32(buffer, lastPartialMoof, i - 4);
                                    var trafSize = getInt32(buffer, lastPartialMoof, i + trafOffset - 4);
                                    var tfhdSize = getInt32(buffer, lastPartialMoof, i + tfhdOffset - 4);
                                    setInt32(newBuffer, ni - 4, moofSize - 8);
                                    setInt32(newBuffer, ni + trafOffset - 4, trafSize - 8);
                                    setInt32(newBuffer, ni + tfhdOffset - 4, tfhdSize - 8);
                                    setInt32(newBuffer, ni + tfhdOffset + 4, (tfhdFlags | 0x020000) & 0xfffffffe); // removing base-data-offset flag and setting default-base-is-moof
                                    for (k = tfhdOffset + 20; k < moofSize; k++)
                                        newBuffer[ni + k - 8] = buffer[i + k];
                                    //setInt32(buffer, lastPartialMoof, i+tfhdOffset+8, 0);
                                    //setInt32(buffer, lastPartialMoof, i+tfhdOffset+8+8, 0);
                                    if (scanSignature(buffer, lastPartialMoof, i + trunOffset, 'trun')) {
                                        var dataOffset = getInt32(buffer, lastPartialMoof, i + trunOffset + 12);
                                        setInt32(newBuffer, ni + trunOffset + 12 - 8, dataOffset - 8);
                                    } else {
                                        console.log('resp ', responseNumber, 'trun signature is not in place, position ', i);
                                    }
                                    i += moofSize;
                                    ni += moofSize - 8;
                                } else {
                                    if (!mustReencode)
                                        return;
                                }
                            } else {
                                console.log('resp ', responseNumber, 'tfhd signature is not in place, position ', i);
                            }
                        } else {
                            console.log('resp ', responseNumber, 'traf signature is not in place, position ', i);
                        }
                    }
                    if (newBuffer) {
                        newBuffer[ni++] = buffer[i];
                    }
                }
                catch (e) {
                    console.log(e);
                }
                finally {
                    i++;
                }
            }
            if (newBuffer) {
                response.data = newBuffer.slice(0, ni);
            }
        }
    }

    function onErrorEvent(event) {
        // Extract the shaka.util.Error object from the event.
        onError(event.detail);
    }

    function onError(error) {
        // Log the error.
        console.error('Error code', error.code, 'object', error);
    }

    return {
        'restrict': 'A',
        'scope': {
            ngShakaPlayer: '='
        },
        'controller': function ($scope) {
        },

        'link': function ($scope, element) {
            var video = element.get(0);
            var player = new shaka.Player(video);
            player.getNetworkingEngine().registerResponseFilter(removeBaseDataOffsetResponseFilter);

            // Listen for error events.
            player.addEventListener('error', onErrorEvent);

            $scope.$watch('ngShakaPlayer', function (url) {
                // Try to load a manifest.
                // This is an asynchronous process.
                player.load(url).then(function () {
                    // This runs if the asynchronous load is successful.
                    console.log('The video has now been loaded!');
                }).catch(onError);  // onError is executed if the asynchronous load fails.
            });
        }
    };
});

