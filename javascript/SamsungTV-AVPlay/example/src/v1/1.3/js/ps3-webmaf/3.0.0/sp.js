// Copyright (c) 2014 NicePeopleAtWork
// Author: Lluís Campos Beltran
// Version: 3.1.0
var SmartPlugin = {
    debug: youboraData.getDebug(),
    balancing: youboraData.getBalanceEnabled(),
    balanceObject: "",
    balanceIndex: 1,
    bandwidth: { username: youboraData.getUsername(), interval: 6000 },
    targetDevice: "PS3",
    pluginName: "PS3",
    pluginVersion: "1.3.3.0.0",
    headTimer: "",
    currentTime: 0,
    urlResource: "",
    originalResource: "",
    isLive: youboraData.getLive(),
    duration: 0,
    communicationClass: "",
    previousElapsedTime: 0,
    service: youboraData.getService(),
    metadata: {},
    buffering: false,
    paused: false,
    streamError: false,
    bufferTimeBegin: 0,
    isStartSent: false,
    isJoinEventSent: false,
    joinTimeBegin: 0,
    joinTimeEnd: 0,
    accessfunction: '',
    PS3CommandFunction: "",
    pingTimer: "", 
    playerStreamingError: false,
    SmartPluginsEvents: { BUFFER_BEGIN: 1, BUFFER_END: 0, JOIN_SEND: 2 },
    initDone: false,
    Init: function () {
        try {
            if (spYoubora.isYouboraApiLoaded() == false) {
                if (SmartPlugin.debug) {
                    console.log("SmartPlugin :: " + SmartPlugin.pluginName + " :: Init :: Api not ready...");
                }
                setTimeout("SmartPlugin.Init()", 200);
            } else {
                try {

                    if (SmartPlugin.debug) {
                        console.log("SmartPlugin :: " + SmartPlugin.pluginName + " :: Init ::");
                    }

                    SmartPlugin.replaceFunctions();
                    SmartPlugin.setAccessFunction();
                    SmartPlugin.communicationClass = new YouboraCommunication(youboraData.getAccountCode(), youboraData.getService(), SmartPlugin.bandwidth, SmartPlugin.pluginVersion, 'PS3');
 
                    spLoaded = true;
                } catch (error) {
                    if (SmartPlugin.debug) {
                        console.log("SmartPlugin :: " + SmartPlugin.pluginName + " :: Init :: Error: " + error);
                    }
                    spLoaded = false;
                }
            }
        } catch (error) {
                    if (SmartPlugin.debug) {
                        console.log("SmartPlugin :: " + SmartPlugin.pluginName + " :: Init :: Error: " + error);
                    }
            console.log("SmartPlugin :: PS3 :: Init :: Error: " + err);
            spLoaded = false;
        }
    },
    getBalancerErrorCount: function () {
        if (SmartPlugin.balanceIndex < 10) {
            return "0" + SmartPlugin.balanceIndex;
        } else if (SmartPlugin.balanceIndex > 10) {
            return SmartPlugin.balanceIndex;
        } else {
            return "000";
        }
    },
    refreshBalancedResource: function () {
        try {
            if (typeof SmartPlugin.balanceObject[SmartPlugin.balanceIndex]['URL'] != "undefined") {
                var stringCall = '{"command":"load","contentUri":"' + SmartPlugin.balanceObject[SmartPlugin.balanceIndex]['URL'] + '"}'
                window.external.user(stringCall);
                if (SmartPlugin.debug) {
                    console.log("SmartPlugin :: " + SmartPlugin.pluginName + " :: refreshBalancedResource :: Next URL (" + SmartPlugin.balanceIndex + "): " + SmartPlugin.balanceObject[SmartPlugin.balanceIndex]['URL']);
                }
            } else {
                if (SmartPlugin.debug) {
                    console.log("SmartPlugin :: " + SmartPlugin.pluginName + " :: refreshBalancedResource :: End of mirrors...");
                }
                SmartPlugin.balancing = false;
                SmartPlugin.communicationClass.sendErrorWithParameters("131" + SmartPlugin.getBalancerErrorCount(), "CDN_PLAY_FAILURE", 0, window.location.href, "", youboraData.getLive(), SmartPlugin.urlResource, SmartPlugin.duration);
                SmartPlugin.reset();
            }
        } catch ( error ) {
            if (SmartPlugin.debug) {
                console.log("SmartPlugin :: " + SmartPlugin.pluginName + " :: refreshBalancedResource :: End of mirrors...");
            }
            SmartPlugin.balancing = false;
            SmartPlugin.communicationClass.sendErrorWithParameters("131" + SmartPlugin.getBalancerErrorCount(), "CDN_PLAY_FAILURE", 0, window.location.href, "", youboraData.getLive(), SmartPlugin.urlResource, SmartPlugin.duration);
            SmartPlugin.reset();
        }
    },
    setBalancedResource: function (obj) {
        if (obj != false) {
            var indexCount = 0;
            for (index in obj) { indexCount++; }
            SmartPlugin.balanceObject = obj;
            SmartPlugin.balanceObject['' + (indexCount + 1) + ''] = new Object();
            SmartPlugin.balanceObject['' + (indexCount + 1) + '']['URL'] = SmartPlugin.urlResource;

            if (typeof obj['1']['URL'] != "undefined") {
                if (SmartPlugin.debug) {
                    console.log("SmartPlugin :: " + SmartPlugin.pluginName + "  :: Balance Current Resource  :: " + SmartPlugin.urlResource);
                    console.log("SmartPlugin :: " + SmartPlugin.pluginName + "  :: Balance Priority Resource :: " + obj['1']['URL']); 
                }
                if (obj['1']['URL'] != SmartPlugin.urlResource) {
                    if (SmartPlugin.debug) {
                        console.log("SmartPlugin :: " + SmartPlugin.pluginName + " :: Balancing :: " + obj['1']['URL']);
                    }
                    youboraData.setBalancedResource(true);                    
                    try {
                        var stringCall = '{"command":"load","contentUri":"' + obj['1']['URL'] + '"}';
                        SmartPlugin.PS3CommandFunction(stringCall);
                    } catch ( error ) {
                        if (SmartPlugin.debug) {
                            console.log("SmartPlugin :: " + SmartPlugin.pluginName + " :: setBalancedResource :: Error While Changing Media: " + error);
                        }
                        SmartPlugin.PS3CommandFunction('{"command":"load","contentUri":"' + SmartPlugin.urlResource + '"}');
                    }

                } else {
                    if (SmartPlugin.debug) {
                        console.log("SmartPlugin :: " + SmartPlugin.pluginName + " :: setBalancedResource :: Same Resource");
                    }
                    SmartPlugin.PS3CommandFunction('{"command":"load","contentUri":"' + SmartPlugin.urlResource + '"}');
                }
            } else {
                if (SmartPlugin.debug) {
                    console.log("SmartPlugin :: " + SmartPlugin.pluginName + " :: setBalancedResource :: Invalid balance object.");
                }
                SmartPlugin.PS3CommandFunction('{"command":"load","contentUri":"' + SmartPlugin.urlResource + '"}');
            }
        } else {
            if (SmartPlugin.debug) {
                console.log("SmartPlugin :: " + SmartPlugin.pluginName + " :: setBalancedResource :: Balance unavailable with current parameters");
            }
            SmartPlugin.PS3CommandFunction('{"command":"load","contentUri":"' + SmartPlugin.urlResource + '"}');
        }
    }, 
    setAccessFunction: function () {
        
        SmartPlugin.accessfunction = window.accessfunction;

        try {
            window.accessfunction = function (json) {

                var data = JSON.parse(json);

                if (SmartPlugin.debug && data.command != "getPlaybackTime") {
                    console.log("SmartPlugin :: " + SmartPlugin.pluginName + " :: accessfunction :: " + json);
                }

                switch (data.command) {

                    case 'playerError':
                        try {
                            SmartPlugin.checkBuffering();
                            if (SmartPlugin.balancing && SmartPlugin.communicationClass.enableBalancer) {
                                if (SmartPlugin.debug) {
                                    console.log("SmartPlugin :: " + SmartPlugin.pluginName + " :: Balancing to next resource due to error...");
                                }
                                SmartPlugin.isStreamError = true;
                                SmartPlugin.communicationClass.sendErrorWithParameters("130" + SmartPlugin.getBalancerErrorCount(), "CDN_PLAY_FAILURE_AND_TRY_NEXT", 0, window.location.href, "", youboraData.getLive(), SmartPlugin.urlResource, SmartPlugin.duration);
                                SmartPlugin.balanceIndex++;
                                SmartPlugin.refreshBalancedResource();
                            } else {
                                SmartPlugin.isStreamError = true;
                                SmartPlugin.checkBuffering();             
                                clearInterval(SmartPlugin.pingTimer); 
                                SmartPlugin.communicationClass.sendError( 3001 , "PLAY_FAILURE");  
                                SmartPlugin.reset();
                            } 
                        } catch (error) {
                            if (SmartPlugin.debug) {
                                console.log("SmartPlugin :: " + SmartPlugin.pluginName + " :: playerError :: Error: " + error);
                            }
                        } 
                    break;

                    case 'playerStreamingError':
                        try {
                            SmartPlugin.checkBuffering();
                            if (SmartPlugin.balancing && SmartPlugin.communicationClass.enableBalancer) {
                                if (SmartPlugin.debug) {
                                    console.log("SmartPlugin :: " + SmartPlugin.pluginName + " :: Balancing to next resource due to error...");
                                }
                                SmartPlugin.isStreamError = true;
                                SmartPlugin.communicationClass.sendErrorWithParameters("130" + SmartPlugin.getBalancerErrorCount(), "CDN_PLAY_FAILURE_AND_TRY_NEXT", 0, window.location.href, "", youboraData.getLive(), SmartPlugin.urlResource, SmartPlugin.duration);
                                SmartPlugin.balanceIndex++;
                                SmartPlugin.refreshBalancedResource();
                            } else {
                                SmartPlugin.isStreamError = true;
                                SmartPlugin.checkBuffering();             
                                clearInterval(SmartPlugin.pingTimer); 
                                SmartPlugin.communicationClass.sendError( 3001 , "PLAY_FAILURE");  
                                SmartPlugin.reset();
                            } 
                        } catch (error) {
                            if (SmartPlugin.debug) {
                                console.log("SmartPlugin :: " + SmartPlugin.pluginName + " :: playerStreamingError :: Error: " + error);
                            }
                        } 
                    break;

                    case 'playerStatusChange':
                        SmartPlugin.statusChange(data.playerState);
                        break;

                    case 'getPlaybackTime':

                        if (SmartPlugin.isStartSent && !SmartPlugin.isJoinEventSent)
                        {
                           SmartPlugin.setBufferEvent(SmartPlugin.SmartPluginsEvents.BUFFER_END); 
                        }

                        if (SmartPlugin.previousElapsedTime != data.elapsedTime) {
                            SmartPlugin.checkBuffering();
                        }
                        SmartPlugin.previousElapsedTime = data.elapsedTime;
                        SmartPlugin.currentTime = data.elapsedTime;
                    break;

                    case 'contentAvailable': 
                        SmartPlugin.duration = data.totalLength;
                        SmartPlugin.checkBuffering();
                    break;
                }

                SmartPlugin.accessfunction(json);
            }

        } catch ( error ) {
            if (SmartPlugin.debug) {
                console.log("SmartPlugin :: " + SmartPlugin.pluginName + " :: setAccessFunction :: Error: " + error);
            }
        }

    },
    replaceFunctions: function () {

        SmartPlugin.PS3CommandFunction = window.external.user;

        try {
            window.external.user = function (json) {
                var data = JSON.parse(json);
                if (SmartPlugin.debug && data.command != "getPlaybackTime") {
                    console.log("SmartPlugin :: " + SmartPlugin.pluginName + " :: external :: " + json);
                }                
                switch (data.command) {
                    case "load":

                        if (typeof data.fileName != "undefined") {
                            SmartPlugin.urlResource = data.fileName;
                        } else if (typeof data.contentUri != "undefined") {
                            SmartPlugin.urlResource = data.contentUri;
                        }

                        if ( SmartPlugin.balancing && SmartPlugin.communicationClass.enableBalancer )
                        {
                            if ( SmartPlugin.balanceObject == "")
                            {
                                var path = SmartPlugin.communicationClass.getResourcePath(SmartPlugin.urlResource);
                                SmartPlugin.communicationClass.getBalancedResource(path , function(obj) { SmartPlugin.setBalancedResource(obj); });       
                            }  
                        }  

                    break;
                }
                SmartPlugin.PS3CommandFunction(json);
            }

        } catch ( error ) {
            if (SmartPlugin.debug) {
                console.log("SmartPlugin :: " + SmartPlugin.pluginName + " :: replaceFunctions :: Error: " + error);
            }
        }
    },
    checkBuffering: function () {
        if (SmartPlugin.buffering) {
            if (SmartPlugin.isStartSent) SmartPlugin.setBufferEvent(SmartPlugin.SmartPluginsEvents.BUFFER_END);
        }
        SmartPlugin.buffering = false;
    },
    setBufferEvent: function ( bufferState ) {
        try {
            var d = new Date();
            var bufferTimeEnd = 0;
            var bufferTimeTotal = 0;

            switch (bufferState) {
            case SmartPlugin.SmartPluginsEvents.BUFFER_BEGIN:

                SmartPlugin.bufferTimeBegin = d.getTime();

                if (SmartPlugin.joinTimeBegin == 0) {
                    SmartPlugin.joinTimeBegin = d.getTime();
                }

                break;

            case SmartPlugin.SmartPluginsEvents.BUFFER_END:

                bufferTimeEnd = d.getTime();
                bufferTimeTotal = bufferTimeEnd - SmartPlugin.bufferTimeBegin;

                if (SmartPlugin.isJoinEventSent == false) {
                    SmartPlugin.isJoinEventSent = true;
                    var joinTimeTotal = d.getTime() - SmartPlugin.joinTimeBegin;

                    if (SmartPlugin.isStartSent) 
                    {
                        SmartPlugin.communicationClass.sendJoin(SmartPlugin.currentTime, joinTimeTotal); 
                        if (SmartPlugin.debug) {
                            console.log("SmartPlugin :: " + SmartPlugin.pluginName + " :: setBufferEvent :: Join sent!");
                        }
                    }


                } else {
                    var currentTime = SmartPlugin.currentTime;
                    if (currentTime == 0 && SmartPlugin.isLive) {
                        currentTime = 10;
                    }

                    if (SmartPlugin.isStartSent) {
                        SmartPlugin.communicationClass.sendBuffer(currentTime, bufferTimeTotal);
                        if (SmartPlugin.debug) {
                            console.log("SmartPlugin :: " + SmartPlugin.pluginName + " :: setBufferEvent :: Buffer sent!");
                        }
                    }
                }

                break;
            }
        } catch ( error ) {
            if (SmartPlugin.debug) {
                console.log("SmartPlugin :: " + SmartPlugin.pluginName + " :: setBufferEvent :: Error: " + error);
            }
        }
    },
    setPing: function () {
        SmartPlugin.pingTimer = setInterval(function () { SmartPlugin.ping(); }, SmartPlugin.communicationClass.getPingTime());
    },
    ping: function () {
        try { 
            if (SmartPlugin.isStartSent && !SmartPlugin.paused) {
                SmartPlugin.communicationClass.sendPingTotalBitrate(videometrics.currentBitrate, SmartPlugin.currentTime);
            }
        } catch ( error ) {
            if (SmartPlugin.debug) {
                console.log("SmartPlugin :: " + SmartPlugin.pluginName + " :: ping :: Error: " + error);
            }
        }
    },
    statusChange: function (status) {
        try {

            if (SmartPlugin.debug) {
                console.log("SmartPlugin :: " + SmartPlugin.pluginName + " :: statusChange :: "+ status);
            }

            switch (status) {
                case 'paused':
                    if (SmartPlugin.isStartSent) {
                        if (!SmartPlugin.paused) {
                            SmartPlugin.communicationClass.sendPause();
                            SmartPlugin.paused = true;
                        }
                    } 
                break;
                
                case 'stopped':
                    if (SmartPlugin.isStartSent) {
                        SmartPlugin.reset();
                    }
                break;

                case 'playing':
                    if (!SmartPlugin.isStartSent) {
                        SmartPlugin.communicationClass.sendStart(0, window.location.href, "", youboraData.getLive(), SmartPlugin.urlResource, SmartPlugin.duration,youboraData.getTransaction());
                        SmartPlugin.setPing();
                        SmartPlugin.isStartSent = true;
                    } 
                    if (SmartPlugin.paused) {
                        SmartPlugin.communicationClass.sendResume();
                        SmartPlugin.paused = false;
                    }
                    if (!SmartPlugin.isJoinEventSent)
                    {
                       SmartPlugin.setBufferEvent(SmartPlugin.SmartPluginsEvents.BUFFER_BEGIN); 
                    }
                break;

                case 'buffering':
                    SmartPlugin.setBufferEvent(SmartPlugin.SmartPluginsEvents.BUFFER_BEGIN);
                    SmartPlugin.buffering = true;
                break;

                case 'opening':
                    if(!SmartPlugin.isJoinEventSent)
                    {
                        SmartPlugin.setBufferEvent(SmartPlugin.SmartPluginsEvents.BUFFER_BEGIN);
                    }
                    SmartPlugin.previousElapsedTime = 0;
                    if (SmartPlugin.headTimer == "") {
                        SmartPlugin.headTimer = setInterval(function () { window.external.user('{"command":"getPlaybackTime"}'); }, 500);
                    } 
                break;

                case 'endOfStream':
                    SmartPlugin.checkBuffering();
                    clearInterval(SmartPlugin.headTimer);
                    SmartPlugin.reset();
                break;
            }
        } catch ( error ) {
            if (SmartPlugin.debug) {
                console.log("SmartPlugin :: " + SmartPlugin.pluginName + " :: statusChange :: Error: " + error);
            }
        }
    },
    reset: function () {
        try {
            clearInterval(SmartPlugin.headTimer);
            clearInterval(SmartPlugin.pingTimer);
            if(SmartPlugin.isStartSent)
            {
                SmartPlugin.communicationClass.sendStop();
            }
            SmartPlugin.headTimer = "";
            SmartPlugin.currentTime = 0;
            SmartPlugin.urlResource = "";
            SmartPlugin.isLive = youboraData.getLive();
            SmartPlugin.duration = 0; 
            SmartPlugin.previousElapsedTime = 0;
            SmartPlugin.buffering = false;
            SmartPlugin.paused = false;
            SmartPlugin.isStartSent = false;
            SmartPlugin.bufferTimeBegin = 0;
            SmartPlugin.isJoinEventSent = false;
            SmartPlugin.joinTimeBegin = 0;
            SmartPlugin.joinTimeEnd = 0;
            SmartPlugin.pingTimer = "";
            SmartPlugin.playerStreamingError = false;
            SmartPlugin.balanceIndex = 1;
            SmartPlugin.balanceObject = "";
            
            if (SmartPlugin.debug) {
                console.log("SmartPlugin :: " + SmartPlugin.pluginName + " :: reset :: Done");
            }

            SmartPlugin.replaceFunctions();
            SmartPlugin.setAccessFunction();
            SmartPlugin.communicationClass = new YouboraCommunication(youboraData.getAccountCode(), youboraData.getService(), SmartPlugin.bandwidth, SmartPlugin.pluginVersion, 'PS3');

        } catch ( error ) {
            if (SmartPlugin.debug) {
                console.log("SmartPlugin :: " + SmartPlugin.pluginName + " :: reset :: Error: " + error);
            }
        }
    }
}