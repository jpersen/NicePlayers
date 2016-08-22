/* Nice264 TV Plugins packageserve do nothing
 * Copyright (c) 2014 NicePeopleAtWork
 * Author: Biel Conde
 * Contributor: Jordi Aguilar
 * Version: 3.2.1
 */

(function(jwplayer) {

    /*
     * JWPlayer(v7 Beta) Plugin
     */
    var template = function(player, config, div) {
        //////////////////////////////////
        // plugin definitions (analytics)
        //////////////////////////////////
        var pluginEnabled = false;
        var pluginVersion = "3.2.1-jwplayer7";
        var pamXML = null;
        var pamUrl = "";
        var pamSystem = "";
        var pamService = "http://nqs.nice264.com";
        var pamUser = "";
        var transaction = "";
        var bandwidth = {};
        var mediaResource = "";
        var mediaAttributes = null;
        var mediaBitrate = 0;
        var windowLocation = "";

        var isStartEventSent = false;
        var isJoinEventSent = false;
        var continuityTimer = null;
        var joinTime = 0;
        var bufferTime = 0;
        var seekTime = 0;
        var duration = 0;
        var position = 0;

        var isGlobalLive = null;

        var pamCode = "";
        var pamCodeOriginal = "";
        var pamCodeCounter = 0;
        var pamPingTime = "";
        var pamBufferUnderRunUrl = "";
        var pamJoinTimeUrl = "";
        var pamStartUrl = "";
        var pamStopUrl = "";
        var pamPauseUrl = "";
        var pamResumeUrl = "";
        var pamContinuityUrl = "";
        var pamErrorUrl = "";
        var pamMediaProperties = {};

        //////////////////////////////////
        // plugin definitions (bandwidth)
        //////////////////////////////////
        var repeatTime = 0;
        var repeatEvent = null;
        var iterator = 0;
        var images = [];
        var total_latency = 9000;
        var total_band = 0;
        var testCounter = 0;
        var ip = "";
        var country = "";
        var city = "";
        var isp = "";
        var ping = "";
        var band = "";
        var imagesCounter = 0;
        var latencies = [];
        var bandwidths = [];
        var genericIndex = 0;
        var totalBandwidhtFiles = 0;
        var username = "";
        var system = "";
        var minutes = 0;
        var isPaused = false;
        //Set here to prevent null. Will be set in start again.
        var startDateTime = new Date().getTime() / 1000;
        var resume = false;
        var contentId;
        var streamModeStartDateTime = new Date().getTime();

        //////////////////////////////////
        // Overlay variables
        //////////////////////////////////
        var overlayText = "";
        var overlayEnabled = false;
        var overlayTime = 60000;
        var overlayDuration = 6000;
        var isOverlayVisible = false;
        var overlayTimer = null;
        var overlayTextColor = "black";
        //defaultColor : dark Green
        var overlayBackgroundColor = '#415825';

        var communications = {};

        var resource;
        var resourceToPass;

        var resourcePath = "";
        //Current index of the playlist that has been requested to the balancer.
        //It is used for avoiding the plugin to look for the same data more than once
        var playlistIndexRequested = NaN;
        //Current index in the balancer reponse.
        //It starts in 1 due to the response format
        var nextUrlIndexFromBalancer = 1;
        //Response of the balancer. It is kept for the switching
        var balancerJson = {};
        //Original resource, set by the user as a playlistItem
        var originalResource = "";
        //Flag to know if we already have the balancer data or not
        var playlistHasBeenUpdated = false;
        //Instant to go back if the play fails
        var seekTime = 0;
        //var isBalancerActivated=false;
        var isOriginalVideoLoaded = false;
        var originalCdnCode = "";
        //Variable to know if the user has pressed play and we need to
        //start playing the new video
        var isPlayPressed = false;
        //Variable to send the CDN from of the balancer info
        var cdnCode = "";
        var isSeeking = false;
        var lastBitrate = -1;
        var isBuffering = false;


        var SmartPluginError = {
            'Could not connect to server': "7000",
            'Unsupported Media Format': "7001",
            'Unsupported Media Format': "7002",
            'Cannot load M3U8: 404 not found': "7003",
            'Cannot load M3U8: crossdomain access denied': "7004",
            'Cannot load M3U8: No levels to play': "7005",
            'Error loading player: Flash version must be 10.0 or greater': "7006",
            'Error loading player: No media sources found': "7007",
            'Error loading player: Offline playback not supported': "7008",
            'Error loading skin: File not found': "7009",
            'Error loading skin: Crossdomain loading denied': "7010",
            'Error loading skin: Error loading file': "7011",
            'Error loading skin: Invalid file type': "7012",
            'Error loading skin: Skin formatting error': "7013",
            'Error loading playlist: File not found': "7014",
            'Error loading playlist: Crossdomain loading denied': "7015",
            'Error loading playlist: Error loading file': "7016",
            'Error loading playlist: Not a valid RSS feed': "7017",
            'Error loading playlist: No playable sources found': "7018",
            'Error drawing fallback: No downloadable media found': "7019",
            'Error loading media: File not found': "7020",
            'Error loading media: File could not be played': "7021",
            'Error loading YouTube: Video ID is invalid': "7022",
            'Error loading YouTube: Video removed or private': "7023",
            'Error loading YouTube: Embedding not allowed': "7024",
            'Error loading YouTube: API connection error': "7025",
            'Error loading stream: Could not connect to server': "7026",
            'Error loading stream: ID not found on server': "7027",
            'Error loading stream: Manifest not found or invalid': "7028",
            'Video stutters frequently': "7029",
            'Video is stretched or has black bars': "7030",
            'MP3 playback is too fast or too slow': "7031",
            'FLV video seeking is not working': "7032",
            'MP4 video seeking is not working': "7033",
            'Network Error: http status 404': "7034"
        };


        ////////////////
        // plugin setup
        ////////////////
        //player.onReady(readyHandler);

        player.on('ready', readyHandler);

        function readyHandler(event) {
            try {
                //Config is YouboraData
                pamUser = getYouboraData().username;
                pamSystem = getYouboraData().accountCode;
                bandwidth.username = getYouboraData().username;
                minutes = getYouboraData().bandwidth;
                transaction = getYouboraData().transaction;
                mediaResource = getYouboraData().mediaResource;
                resume = getYouboraData().resume;
                contentId = getYouboraData().contentId;
                isGlobalLive = getYouboraData().live;

                if (getYouboraData().service !== "" && typeof(getYouboraData().service) != "undefined") {
                    pamService = getYouboraData().service;
                }
                var jsonObj = JSON.stringify(getYouboraData().properties);
                pamMediaProperties = encodeURIComponent(jsonObj);

                try {
                    communications = new YouboraCommunication(pamSystem, pamService, bandwidth, pluginVersion, "jwplayer", player.id);

                    pamPingTime = communications.getPingTime();


                    /*************************************
                     *	EVENTS HANDLING
                     ****************************************/
                    player.on('buffer', bufferHandler);
                    player.on('beforePlay', beforePlayHandler);
                    player.on('play', playHandler);
                    player.on('pause', pauseHandler);
                    player.on('time', timeHandler);
                    player.on('meta', metaHandler);
                    player.on('playlistItem', playListItemHandler);
                    player.on('error', errorHandler);
                    player.on('setupError', errorHandler);
                    player.on('idle', idleHandler);
                    player.on('seek', seekHandler);
                    player.on('seeked', seekedHandler);

                    // AD events not implementet yet
                    player.on('adClick', function() {});
                    player.on('adCompanions', function() {});
                    player.on('adComplete', function() {});
                    player.on('adError', function() {});
                    player.on('adImpression', function() {});
                    player.on('adMeta', function() {});
                    player.on('adPause', function() {});
                    player.on('adPlay', function() {});
                    player.on('adSkipped', function() {});
                    player.on('adTime', function() {});


                } catch (err) {
                    pamPingTime = 5000;
                    getYouboraData().log("JWPlayer Plugin can't create YouboraCommunication.");
                    getYouboraData().log(err);
                }

                //It is important to call set for the overlay text
                if (getYouboraData().jwplayerOverlayText != undefined) {
                    setOverlayText(getYouboraData().jwplayerOverlayText);
                } else {
                    setOverlayText(getYouboraData().username);
                }
                overlayEnabled = getYouboraData().jwplayerOverlayEnabled;
                overlayTime = getYouboraData().jwplayerOverlayTime;
                if (overlayTime == undefined) {
                    overlayTime = 90000;
                }
                overlayDuration = getYouboraData().jwplayerOverlayDuration;
                if (overlayDuration == undefined) {
                    overlayDuration = 5000;
                }
                if (overlayEnabled == true) {
                    resetOverlayTimer();
                }


                //Balancer configuration
                resource = player.getPlaylistItem().file;
                originalResource = player.getPlaylistItem();
                originalCdnCode = getYouboraData().getCDN();
                resourceToPass = (mediaResource == undefined || mediaResource == "") ? resource : mediaResource;
                getYouboraData().mediaResource = resourceToPass;
                try {
                    resourcePath = communications.getResourcePath(resourceToPass);
                } catch (err) {
                    getYouboraData().log(err);
                }

                // isBalancerActivated = isBalancerActive();
                if (!isBalancerActive()) {
                    isOriginalVideoLoaded = true;
                }
            } catch (err) {
                if (getYouboraData() != undefined) getYouboraData().log(err);
                else console.log(err);
            }
        }

        //Balancer is active if originCode and zoneCode are not set
        function isBalancerActive() {
            return getYouboraData().getBalanceEnabled();
            //return ((getYouboraData().getBalanceOriginCode() != "") || (getYouboraData().getBalanceZoneCode() !="") && ( communications.enableBalancer ) && getYouboraData().enableBalancer);
        }

        function callbackBalancer(jsonObject) {
            try {
                if (jsonObject != false) {
                    getYouboraData().isBalanced = true;
                    //Next source to test: first one
                    nextUrlIndexFromBalancer = 1;
                    balancerJson = jsonObject;
                    updatePlayList(jsonObject);
                    //getYouboraData().log("PlayListAfter");
                    //getYouboraData().log(player.getPlaylist());


                } else {
                    isOriginalVideoLoaded = true;
                    getYouboraData().setEnableBalancer(false);
                }
            } catch (err) {
                getYouboraData().log(err);
            }
        }

        function updatePlayList(jsonObject) {

            var newPlayList = new Array();
            //getYouboraData().log("Current Playing Index : " + player.getPlaylistIndex());
            //getYouboraData().log("Video it should be playing : " + playlistIndexRequested);
            playlistIndexRequested = player.getPlaylistIndex();
            //getYouboraData().log(jsonObject);
            for (var i = 0; i < player.getPlaylist().length; i++) {
                if (i == player.getPlaylistIndex()) {
                    var currentPlayingFile = player.getPlaylistItem();
                    //getYouboraData().log(jsonObject[nextUrlIndexFromBalancer]);
                    //getYouboraData().log(typeof jsonObject[nextUrlIndexFromBalancer] == "undefined");

                    if (typeof jsonObject[nextUrlIndexFromBalancer] == "undefined") {
                        currentPlayingFile = originalResource;
                        getYouboraData().setCDN(originalCdnCode);
                        isOriginalVideoLoaded = true;

                    } else {

                        var balancerUrl = jsonObject[nextUrlIndexFromBalancer].URL;
                        getYouboraData().setCDN(jsonObject[nextUrlIndexFromBalancer].CDN_CODE);
                        //var balancerUrl = "http://mirrorblender.top-ix.org/movies/sintel-1024-surround.mp4";
                        currentPlayingFile.file = balancerUrl;
                        currentPlayingFile.sources[0].file = balancerUrl;
                        nextUrlIndexFromBalancer = nextUrlIndexFromBalancer + 1;

                        //Test, erase this
                        //currentPlayingFile.sources[0].type= "mp4";

                    }
                    //currentPlayingFile.description = i;
                    newPlayList.push(currentPlayingFile);
                } else {
                    /*getYouboraData().log("Do not change : " );
					getYouboraData().log(player.getPlaylistItem(i));*/
                    newPlayList.push(player.getPlaylistItem(i));
                }
            }

            //Indicate that the data has been fetched and changes
            playlistHasBeenUpdated = true;
            player.load(newPlayList);
            //getYouboraData().log("List reloaded") ;

            //getYouboraData().log("Player state 250 : "  +player.getState());



        }

        this.resize = function(width, height) {};

        /////////////////
        // player events
        /////////////////
        function playListItemHandler(event) {
            if (getYouboraData().jwplayerStreamMode == false) {
                resetAnalytics();
            }
            if (isBalancerActive()) {
                resetAnalytics();
                seekTime = 0;
                //If we come from a status of clicking another video, we need to download the data and get the
                //video index we are at
                if (!playlistHasBeenUpdated) {
                    //resourcePath="/npaw/demosite/tears_of_steel_404p.mp4";
                    //resourcePath="/mp_series1/2012/09/10/00001.mp4";
                    communications.getBalancedResource(resourcePath, callbackBalancer);
                    playlistIndexRequested = player.getPlaylistIndex();

                    //If we come from the status of having already changed the playlist and we need to go back to the video we where at
                } else {
                    player.playlistItem(playlistIndexRequested);
                    //Clean flag for the next change of video
                    playlistHasBeenUpdated = false;

                }
                //getYouboraData().log("Player state 282 : "  +player.getState());
            }
        }

        function idleHandler(event) {
            if (getYouboraData().jwplayerStreamMode == false) {
                var oldState = event.oldstate;

                if (oldState == "playing" || oldState == "paused") {
                    sendAnalytics("stop");
                    resetAnalytics();
                }
            }
        }

        function seekHandler(event) {
            seekTime = new Date().getTime();
            isSeeking = true;
        }

        function seekedHandler(event) {
            //isSeeking = false;
            //sendAnalytics('seek', new Date().getTime() - seekTime);
        }

        function bufferHandler(event) {
            if (isJoinEventSent) {
                getYouboraData().log("sp :: BufferStart");
                isPlayPressed = true;

                if (event.oldstate != "paused" && event.oldstate != "idle") {
                    var now = new Date();
                    bufferTime = now.getTime();
                    isBuffering = true;
                }
            }
        }

        function beforePlayHandler(event) {
            //When we are not balancing, we will send the start
            //rigth before the video starts buffering and playing.
            //When we are balancing, we cannot do that because the video
            //the server provided might fail and we only know that when
            //it starts playing.
            if (!isStartEventSent && !isBalancerActive()) {
                startDateTime = new Date().getTime() / 1000;
                isStartEventSent = true;
                sendAnalytics("start");
                setPing();

                if (!isJoinEventSent) {
                    joinTime = new Date().getTime();
                }
            }
        }

        function playHandler(event) {
            //When balancing, we will accept the start when the video starts playing.
            //Opposite case of beforePlayHandler
            if (!isStartEventSent) {
                startDateTime = new Date().getTime() / 1000;
                isStartEventSent = true;
                sendAnalytics("start");
                setPing();
            }

            if (isPaused || (event.oldstate == "paused" && event.newstate == "playing")) {
                sendAnalytics("resume");
                isPaused = false;
            }
            isSeeking = false;
        }

        function pauseHandler(event) {
            isPaused = true;
            sendAnalytics("pause");
        }

        function timeHandler(event) {
            duration = event.duration;
            if (position && Math.abs((position * 1000) - (event.position * 1000) < 600)) { // is playing

                if (isStartEventSent && !isJoinEventSent) {
                    isJoinEventSent = true;
                    sendAnalytics("join", {
                        diff: Math.round(new Date().getTime() - joinTime),
                        duration: Math.round(duration)
                    });
                }

                if (isSeeking) {
                    isSeeking = false;
                    isBuffering = false;
                    sendAnalytics('seek', Math.round(new Date().getTime() - seekTime));
                }

                if (isBuffering) {
                    isBuffering = false;
                    var bufferTimeDiff = Math.round(new Date().getTime() - bufferTime);
                    sendAnalytics("buffer", Math.round(bufferTimeDiff));
                }

            }

            position = event.position;

            //duration-1 to avoid precision errors
            if (getYouboraData().jwplayerStreamMode == false) {
                if (event.duration > 0) {
                    if ((event.position - 1) >= (event.duration - 1)) {
                        sendAnalytics("stop");
                        resetAnalytics();
                    }
                }
            }
        }

        function metaHandler(event) {
            mediaAttributes = event;
            //In html, the plugin does not
            try {
                duration = event.metadata.duration;
            } catch (e) {
                // getYouboraData().log(e);
            }

            if (duration == 0) {
                try {
                    duration = event.duration;
                } catch (e) {
                    getYouboraData().log(e);
                }
            }
        }

        function errorHandler(message) {
            try {
                player.stop();
                sendAnalytics("error", "", message);
                sendAnalytics("stop");
                resetAnalytics();
                //Retry to get the data

            } catch (err) {
                getYouboraData().log(err);
            } finally {
                if (isBalancerActive() && !isOriginalVideoLoaded) {
                    seekTime = player.getPosition();
                    updatePlayList(balancerJson);

                }
            }
        }

        function resumePlay() {
            seekTime = player.getPosition();
            player.play();
        }

        function updateCode() {
            if (pamCodeCounter <= 0) {
                pamCodeOriginal = pamCode;
            }
            pamCodeCounter++;
            pamCode = pamCodeOriginal + "_" + pamCodeCounter;
        }

        function resetAnalytics() {
            clearPing();
            updateCode();

            isStartEventSent = false;
            isJoinEventSent = false;
            continuityTimer = null;
            joinTime = 0;
            bufferTime = 0;
        }

        function loadAnalytics(response) {

            try {
                // analytics data
                pamCode = response.c;

                // bandwidth
                pamXML = response;
                //initBW();
                // enable plugin
                pluginEnabled = true;
            } catch (err) {

                pluginEnabled = false;
            }
        }

        function sendAnalytics(type, videoPlayTime, errorObj) {
            var request_url = "";
            if (getYouboraData().jwplayerStreamMode == true) {
                try {
                    var accTime = ((new Date().getTime()) - streamModeStartDateTime) / 1000;
                    videoPlayTime = accTime; // + videoPlayTime;

                } catch (e) {
                    getYouboraData().log(e);
                }

            }
            switch (type) {
                case "buffer":
                    var currentPosition = 0;
                    try {
                        currentPosition = player.getPosition();
                    } catch (err) {
                        currentPosition = 0;
                    }
                    //In live player.getPosition() is 0. We calculate the time if that happens
                    if (currentPosition == 0) {
                        currentPosition = (new Date().getTime() / 1000) - startDateTime;
                    }
                    communications.sendBuffer(Math.round(currentPosition), videoPlayTime);
                    //request_url = pamBufferUnderRunUrl+"?time="+currentPosition+"&duration="+videoPlayTime+"&code="+pamCode;
                    break;
                case "join":
                    var eventTime = 0;
                    try {
                        eventTime = player.getPosition() / 1000;
                    } catch (err) {

                    }

                    communications.sendJoinWithMediaDuration(Math.round(eventTime), videoPlayTime.diff, videoPlayTime.duration);
                    //request_url = pamJoinTimeUrl+"?time="+videoPlayTime+"&code="+pamCode;
                    break;
                case "start":
                    try {

                        var pingTimeInSeconds = pamPingTime / 1000;
                        var isLive = true;
                        var duration = 0;
                        if (mediaAttributes != null && mediaAttributes) {
                            //Depending on the browser, the data comes from different levels
                            if (typeof mediaAttributes.duration !== 'undefined') {
                                duration = mediaAttributes.duration;
                            } else {
                                if (typeof mediaAttributes.metadata !== 'undefined') {
                                    duration = mediaAttributes.metadata.duration;
                                }
                            }
                        }
                        if (typeof duration === 'undefined') {
                            duration = player.getDuration();
                        }
                        // The resource could have been updated due to the balancer, we need to check again
                        var resource = player.getPlaylistItem().file;
                        resourceToPass = (typeof mediaResource === 'undefined' || mediaResource == "") ? resource : mediaResource;
                        getYouboraData().mediaResource = resourceToPass;

                        duration = typeof duration === 'undefined' ? 0 : duration;
                        if (duration > 0) {
                            isLive = false;
                        }
                        if (isGlobalLive != null) {
                            isLive = isGlobalLive;
                        }
                        if (isLive == true) {
                            duration = 0;
                        }
                        //windowLocation = encodeURIComponent(window.location.href.toString());
                        windowLocation = (window.location.href.toString());

                        communications.sendStart("0", windowLocation, pamMediaProperties, isLive, resourceToPass, duration, transaction);
                        //request_url = pamStartUrl+"?system="+pamSystem+"&user="+pamUser+"&transcode="+transaction+"&pluginVersion="+pluginVersion+"&pingTime="+pingTimeInSeconds+"&live="+isLive+"&totalBytes=0&duration="+duration+"&resource="+resourceToPass+"&referer="+windowLocation+"&properties="+pamMediaProperties+"&code="+pamCode;
                    } catch (err) {
                        getYouboraData().log(err);
                    }
                    break;
                case "stop":
                    communications.sendStop();
                    break;
                case "pause":
                    communications.sendPause();
                    break;
                case "resume":
                    communications.sendResume();
                    break;
                case "continuity":
                    // bitrate
                    var qtys = null;
                    var bitrate = 0;
                    try {
                        qtys = player.getQualityLevels();
                        bitrate = qtys[player.getCurrentQuality()].bitrate;
                        if (typeof(bitrate) === "undefined" || typeof(bitrate) === null) {
                            bitrate = -1;
                        } else {
                            bitrate = bitrate;
                        }
                        //In case the bitrate has not been set yet, we get it from mediaAttributes
                        if (bitrate == 0 || bitrate == -1) {
                            //Metdata is an object with the following structure:
                            //Object {currentLevel: of 3 (1639kbps, 1280px), width: 480, droppedFrames: 0, bandwidth: 13549}
                            if (mediaAttributes != null && (mediaAttributes.metadata != null && typeof mediaAttributes.metadata !== 'undefined')) {
                                if (mediaAttributes.metadata.currentLevel != null && mediaAttributes.metadata.currentLevel !== 'undefined') {
                                    var currentLevel = mediaAttributes.metadata.currentLevel;
                                    var regex = /(([0-9]+)kbps)/i;
                                    //currentLevel.match returns 3 elements, we need the 3rd one which is the number alone
                                    bitrate = currentLevel.match(regex)[2];
                                    //convert bitRate from kbps to bps
                                    bitrate = bitrate * 1024;
                                }
                            }
                        }
                        if (bitrate == 0) {
                            bitrate = -1;
                        }

                    } catch (err) {
                        bitrate = -1;
                        getYouboraData().log(err);
                    }
                    if (bitrate == -1) {
                        bitrate = lastBitrate;
                    } else {
                        lastBitrate = bitrate;
                    }
                    // current video position
                    var currentPosition = 0;
                    try {
                        currentPosition = player.getPosition();
                    } catch (err) {
                        currentPosition = 0;
                    }
                    var pingTimeInSeconds = pamPingTime / 1000;
                    communications.sendPingTotalBitrate(bitrate ? bitrate : -1, videoPlayTime);
                    setPing();
                    break;
                case "error":
                    var pingTimeInSeconds = pamPingTime / 1000;
                    if (mediaAttributes != null) {
                        if (mediaAttributes.duration > 0) {
                            isLive = false;
                        }
                    }

                    var resource = player.getPlaylistItem().file;
                    var resourceToPass = (mediaResource == "") ? resource : mediaResource;

                    if (isGlobalLive != null || isGlobalLive != undefined) {
                        isLive = isGlobalLive;
                    }
                    //windowLocation = encodeURIComponent(window.location.href.toString());
                    windowLocation = (window.location.href.toString());
                    //some error might come from the first load of data. We do not want to send that. We'll send a loading error
                    if (isStartEventSent) {
                        try {
                            errorCode = SmartPluginError[errorObj.message];
                            errorMsg = parseError(errorObj);
                            errorTotalBytes = "0";
                            errorReferer = windowLocation;
                            errorProperties = pamMediaProperties;
                            errorIsLive = isLive;
                            errorResource = resourceToPass;
                            errorDuration = duration;
                            errorTransaction = transaction;

                            //errorCode, message, totalBytes, referer, properties, isLive, resource, duration, transcode
                            communications.sendAdvancedError(errorCode, 'jwplayer7', errorMsg, errorTotalBytes, errorReferer, errorProperties, errorIsLive, errorResource, errorDuration, errorTransaction);
                        } catch (e) {
                            getYouboraData().log(e);
                        }
                    } else if (isBalancerActive()) {
                        var errorCode = "";
                        if (!isOriginalVideoLoaded) {
                            errorCode = 13000 + nextUrlIndexFromBalancer - 1;
                            //communications.sendErrorWithParameters(errorCode.toString(), parseError(errorObj),transaction,resourceToPass, pamSystem,isLive,pamMediaProperties,pamUser,windowLocation,"0",pingTimeInSeconds,pluginVersion);
                        } else {
                            errorCode = 13100 + nextUrlIndexFromBalancer - 1;
                            //communications.sendErrorWithParameters(errorCode.toString(), parseError(errorObj),transaction,resourceToPass, pamSystem,isLive,pamMediaProperties,pamUser,windowLocation,"0",pingTimeInSeconds,pluginVersion);
                        }

                        errorMsg = parseError(errorObj);
                        errorTotalBytes = "0";
                        errorReferer = windowLocation;
                        errorProperties = pamMediaProperties;
                        errorIsLive = isLive;
                        errorResource = resourceToPass;
                        errorDuration = mediaAttributes.duration;
                        errorTransaction = transaction;
                        communications.sendAdvancedError(errorCode.toString(), 'jwplayer7', errorMsg, errorTotalBytes, errorReferer, errorProperties, errorIsLive, errorResource, errorDuration, errorTransaction);
                        //communications.sendErrorWithParameters(errorCode.toString(), errorMsg,transaction,resourceToPass, pamSystem,isLive,pamMediaProperties,pamUser,windowLocation,"0",pingTimeInSeconds,pluginVersion);

                    }

                    break;
                case "seek":
                    var currentPosition = 0;
                    try {
                        currentPosition = player.getPosition();
                    } catch (err) {
                        currentPosition = 0;
                    }
                    //In live player.getPosition() is 0. We calculate the time if that happens
                    if (currentPosition == 0) {
                        currentPosition = (new Date().getTime() / 1000) - startDateTime;
                    }
                    communications.sendSeek(currentPosition, videoPlayTime);
                    break;
            }
        }
        this.setProperties = function(props_obj) {
            var jsonObj = JSON.stringify(props_obj);
            pamMediaProperties = encodeURIComponent(jsonObj);
        };
        this.setTransaction = function(trans) {
            transaction = trans;
        };
        this.setLive = function(isLive) {
            isGlobalLive = isLive;
        };
        this.setMediaResource = function(resource_url) {
            mediaResource = encodeURIComponent(resource_url);
        };

        function setPing() {
            try {
                continuityTimer = setTimeout(function() {
                    sendAnalytics("continuity", player.getPosition());
                }, pamPingTime);
            } catch (err) {
                getYouboraData().log(err);
            }
        }

        function clearPing() {
            clearInterval(continuityTimer);
        }

        function parseError(error_obj) {
            var jsonObj = JSON.stringify(error_obj);
            return encodeURIComponent(jsonObj);
        }

        function setOverlayText(text) {
            div.innerHTML = text;
            overlayText = text;
            hideOverlay();
        }

        this.setOverlayText = function(text) {
            setOverlayText(text);
        }

        this.setOverlayEnabled = function(enabled) {
            overlayEnabled = enabled;
        }

        this.setOverlayTime = function(time) {
            overlayTime = time;
        }

        this.setOverlayDuration = function(time) {
            overlayDuration = time;
        }

        this.stop = function() {
            sendAnalytics("stop");
            resetAnalytics();
        }

        this.onPlayEvent = function(event) {
            playHandler(event);
        }

        function setStyleOverlay(object) {
            for (var style in object) {
                div.style[style] = object[style];
            }
        }

        function showOverlay() {
            isOverlayVisible = true;

            if (overlayEnabled)
                createStyleOverlay();

            if (overlayEnabled == true) {
                setStyleOverlay({
                    opacity: 1,
                });
            } else {
                hideOverlay();
            }
        };

        function hideOverlay() {
            isOverlayVisible = false;
            setStyleOverlay({
                opacity: 0
            });
        };

        function resetOverlayTimer() {
            try {
                if (!isOverlayVisible) {
                    setTimeout(function() {
                        showOverlay();
                        resetOverlayTimer();
                    }, overlayTime);
                } else {
                    setTimeout(function() {
                        hideOverlay();
                        resetOverlayTimer();
                    }, overlayDuration);
                }
            } catch (err) {
                getYouboraData().log(err);
            }
        }

        function createStyleOverlay() {
            //Width value = length of overlayText. Using .length won't work
            //var widthValue  = overlayText.length;// player.getWidth();
            var yPosition = player.getHeight() - 0.25 * player.getHeight();
            // Offset to compensate the size of the text in the overlay when calculating the xPosition
            var textSize = 7;
            var xPosition = Math.floor((Math.random() * (player.getWidth() - (overlayText.length * textSize))));

            //If the color is set, use them. Otherwise default
            if (getYouboraData().jwplayerOverlayTextColor != undefined) {
                overlayTextColor = getYouboraData().jwplayerOverlayTextColor;
            }
            if (getYouboraData().jwplayerOverlayBackgroundColor != undefined) {
                overlayBackgroundColor = getYouboraData().jwplayerOverlayBackgroundColor;
            }
            setStyleOverlay({
                position: 'absolute',
                left: xPosition + 'px',
                top: yPosition + 'px',
                margin: '0',
                padding: '5px 10px 5px',
                background: overlayBackgroundColor,
                'font-weight': 'bold',
                color: overlayTextColor,
                fontSize: '13px',
            });
        }

        // Matches our text container to the size of the player instance
        this.resize = function(width, height) {
            if (overlayEnabled)
                createStyleOverlay();
        };

        function getYouboraData() {
            try {
                if (typeof youboraDataMap !== 'undefined') {
                    /*if (typeof youboraData === 'undefined') 
						youboraData = youboraDataMap.get(player.id);
					}*/
                    return youboraDataMap.get(player.id);
                } else {
                    return youboraData;
                }
            } catch (err) {
                if (debug) console.log(err.stack.replace(' at ', '\r\n\tat '));
            }
        }



    };

    jwplayer().registerPlugin('sp', '6.0', template);

})(jwplayer);