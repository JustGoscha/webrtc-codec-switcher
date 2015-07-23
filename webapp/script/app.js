
$("#createOffer").hide();
$("#codecform").hide();
$("#sendform").hide();


$("#dc-connect").click(chooseCodecAndStart);
$("#send").click(sendDirect);
$("#createOffer").click(connectTo);


var localVideo = document.querySelector("#self");
var mediaStream = null;
var remoteVideo = document.querySelector("#remote");

var usermedia = false;
var my_offer = null;

navigator.getMedia = (navigator.getUserMedia ||
	navigator.webkitGetUserMedia ||
	navigator.mozGetUserMedia ||
	navigator.msGetUserMedia);

navigator.getMedia(
	{video: true, audio: true},
	function(localMediaStream){
		localVideo.src = window.URL.createObjectURL(localMediaStream);
		mediaStream = localMediaStream;
		localVideo.onloadmetadata = function(e) {
      // do something with the video.
    }
    usermedia = true;
    wsConnect();
  },
  function(err){
  	console.log("An error occured during getUserMedia: " + err);
  }
);

var ws = null;
var user = ""; // you
var user2 = ""; // user who is called

// $("#ws-connect").click(wsConnect);

function wsConnect(){
  ws = new WebSocket("ws://"+window.location.hostname+":9400");

  ws.onopen = function(e){    
    console.log("Websocket opened");
    $("#createOffer").show();
  }
  ws.onclose = function(e){   
    console.log("Websocket closed");
  }
  ws.onmessage = function(e){ 
    console.log("Websocket message received: " + e.data);

    var json = JSON.parse(e.data);

    if(json.action == "candidate"){
      if( true || json.to == user){
        processIce(json.data, json.from);
      }
    } else if(json.action == "offer"){
            // incoming offer
            if(true || json.to == user){
              //user2 = json.from;
              processOffer(json.data, null)
            }
          } else if(json.action == "answer"){
            // incoming answer
            if(true || json.to == user){
              processAnswer(json.data, null);
            }
          } 
        // else if(json.action == "id"){
        //     setMyId(json.data);
        // } else if(json.action=="newUser"){
        //     if(user!=null && json.data!=user){
        //         connectTo(json.data);
        //     }
        // }

      }
      ws.onerror = function(e){   
        console.log("Websocket error");
      }
    }

// function setMyId(u){
//     user = u;
// }

var config = {"iceServers":[{"url":"stun:stun.l.google.com:19302"}]};
var connection = { 'optional': [{'DtlsSrtpKeyAgreement': true}, {'RtpDataChannels': true }] };

var peerConnection;
var dataChannel;

var codecs = null;
var remoteCodecs = null;

function connectTo(){
	console.log("connect to");
	openDataChannel();

	var sdpConstraints = {
    'mandatory':
  	{
  		'OfferToReceiveAudio': true,
  		'OfferToReceiveVideo': true
  	}
  };
  console.log("Creating offer")
  var offer = peerConnection.createOffer(function (offer) {
      // parse SDP 
      // find available audio codecs
      codecs = CodecSwitch.extractCodecs(offer.sdp);

      console.log("offer created")
      // display codecs in the site
      addCodecsToSite(codecs);

      // user2 = to;
      $("#codecform").show();
      my_offer = offer;

  }, function(){return null;}, sdpConstraints);

}

function chooseCodecAndStart(e){
	e.preventDefault();

  // get selected codecs from input
  var audioCodecNum = $('input[name="audio"]:checked').val();
  var videoCodecNum = $('input[name="video"]:checked').val();

  my_offer.sdp = CodecSwitch.preferCodec(audioCodecNum, videoCodecNum, my_offer.sdp);

  peerConnection.setLocalDescription(my_offer);
  sendNegotiation(null,"offer", my_offer);
  console.log("------ SEND OFFER ------");

  return false;
}

function addCodecsToSite(codecs){

  // put it in the html form
  var aform = document.querySelector("#codec");

  for(var i=0;i<codecs.audio.num.length;i++){
  	aform.innerHTML = aform.innerHTML + '<label><input type="radio" name="audio" value="'+codecs.audio.num[i]+'">'+codecs.audio.name[i]+'</label>';   
  }

  var vform = document.querySelector("#vcodec");
  for(var i=0;i<codecs.video.num.length;i++){
  	vform.innerHTML = vform.innerHTML + '<label><input type="radio" name="video" value="'+codecs.video.num[i]+'">'+codecs.video.name[i]+'</label>';   
  }

}

function sendDirect(e){
	e.preventDefault();
	dataChannel.send($("#message").val()); 

	console.log("Sending over datachannel: " + $("#message").val());
}

function getURLParameter(name) {
	return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null
}

var RTCPeerConnection = window.webkitRTCPeerConnection || 
window.RTCPeerConnection || 
window.mozRTCPeerConnection ||
null;

var RTCIceCandidate = window.webkitRTCIceCandidate || 
window.RTCIceCandidate || 
window.mozRTCIceCandidate ||
null;

var RTCSessionDescription = window.webkitRTCSessionDescription || 
window.RTCSessionDescription || 
window.mozRTCSessionDescription ||
null;


function openDataChannel (){
	peerConnection = new RTCPeerConnection(config, connection);
	peerConnection.onicecandidate = function(e){
		if (!peerConnection || !e || !e.candidate) return;
		var candidate = e.candidate;
		sendNegotiation(null,"candidate", candidate);
	};
	peerConnection.onaddstream = function(e) {
		remoteVideo.src = window.URL.createObjectURL(e.stream);
	};

	if(mediaStream)
		peerConnection.addStream(mediaStream);

	dataChannel = peerConnection.createDataChannel("datachannel", {reliable: false});

	dataChannel.onmessage = function(e){
		console.log("DC from ["+null+"]:" +e.data);
	}
	dataChannel.onopen = function(){
		console.log("------ DATACHANNEL OPENED ------")
		$("#sendform").show();
	};
	dataChannel.onclose = function(){console.log("------ DC closed! ------")};
	dataChannel.onerror = function(){console.log("DC ERROR!!!")};

	peerConnection.ondatachannel = function () {
		console.log('peerConnection.ondatachannel event fired.');
	};

}

function sendNegotiation(to, type, sdp){
	var json = { from: null, to: null, action: type, data: sdp};
	ws.send(JSON.stringify(json));
	console.log("Sending ["+null+"] to ["+null+"]: " + JSON.stringify(sdp));
}

function processOffer(offer, from){
	openDataChannel();
	var sdp = new RTCSessionDescription(offer);
	peerConnection.setRemoteDescription(sdp);

	var sdpConstraints = {'mandatory':
  	{
  		'OfferToReceiveAudio': true,
  		'OfferToReceiveVideo': true
  	}
  };

  remoteCodecs = CodecSwitch.extractCodecs(sdp.sdp);

  peerConnection.createAnswer(function (answer) {
  	peerConnection.setLocalDescription(answer);

  	codecs = CodecSwitch.extractCodecs(answer.sdp);
    // prefer the codecs that the other client suggested
    answer.sdp = CodecSwitch.preferCodec(remoteCodecs.audio.num[0], remoteCodecs.video.num[0], answer.sdp);

    sendNegotiation(from, "answer", answer);
    console.log("------ SEND ANSWER ------");
  }, function(){return null;}, sdpConstraints);
  console.log("------ PROCESSED OFFER ------");

};

function processAnswer(answer, from){
	peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
	console.log("------ PROCESSED ANSWER ------");
	return true;
};

function processIce(iceCandidate, from){
	if(peerConnection.remoteDescription)
		peerConnection.addIceCandidate(new RTCIceCandidate(iceCandidate));
}
