A WebRTC codec switcher
========================================

This is a demo of the WebRTC codec extractor and switcher.
You can find the CodecSwitcher in webapp/script/codecSwitcher.js

# Running the demo


0. You need NodeJS/npm for the server so install that first.

1. Clone this repository. 

```
git clone https://github.com/JustGoscha/webrtc-codec-switcher.git
```

2. Then run this command to install.

```
cd webrtc-codec-switch
npm install
```

3. Run the server.

```
node server.js
```

4. Now open the browser (Chrome) and navigate to http://127.0.0.1:8000 (or whatever the IP adress is, if you don't run it locally). You should also open two browser tabs of the page to test the communication capability.

5. Allow camera access in both browser tabs. After that for the rest you can use one of those tabs, while leaving the other still open.

6. Now press on "Create Offer" - button. The browser should now generate an SDP and and extract all codecs from it. These codecs are now shown. You can now choose the one you like and then press "Choose Codec". It sends the offer out to the other Browser (tab) and if everything worked it should now show two videos, a local one and a remote.

# CodecSwitch library

The CodecSwitch library consists of two simple functions.
function | input | output
---------|-------|-------
`CodecSwitch.etractCodecs(sdp)` | SDP string of offer or answer | Returns an object with a list of codec names and an their numbers `{video: {num: [], name: [], lines: []},audio:{num:[],name:[],lines:[]}}`
`CodecSwitch.preferCodec(numA,numV,sdp)` | numA, numV - numbers of Audio & Video Codec | returns new SDP string


