(function(root){
  function CodecSwitch(){
    this.codecs = null;
  }

  /**
   * Extracts video and audio codecs from an SDP
   * @param  {string} sdp An SDP as string
   * @return {object}     Returns an object with video and audio codecs
   */
  CodecSwitch.prototype.extractCodecs = function(sdp){
    this.codecs = { 
      video: {
        num: [],
        name: [],
        lines: [] 
      },
      audio: {
        num: [],
        name: [],
        lines: []
      }
    };

    var sdpLines = sdp.split('\r\n');
    for (var i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].search('m=audio') !== -1) {
        var mAudioLineIndex = i;
        break;
      }
    }

    for (var i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].search('m=video') !== -1) {
        var mVideoLineIndex = i;
        break;
      }
    }

    // get codec numbers from the mline
    this.codecs.audio.num = sdpLines[mAudioLineIndex].split(" ").slice(3);
    this.codecs.audio.name = new Array(this.codecs.audio.num.length);

    this.codecs.video.num = sdpLines[mVideoLineIndex].split(" ").slice(3);
    this.codecs.video.name = new Array(this.codecs.video.num.length);

    for(var i=0;i<this.codecs.audio.num.length;i++){
      console.log("Extracting:" + this.codecs.audio.num[i]);
      for(var j=0;j<sdpLines.length;j++){
        var temp = sdpLines[j].split(new RegExp("a=(\\w+):"+this.codecs.audio.num[i]+" ",'i'));

        if(temp.length>2){
          if(this.codecs.audio.lines[i]){
            this.codecs.audio.lines[i].push(j)
          } else {
            this.codecs.audio.lines[i] = [j];
          }
          console.log(temp);
          if(temp[1]=="rtpmap"){
            console.log(temp);
            this.codecs.audio.name[i] = temp[2];
          }
        }
      }
    }

    for(var i=0;i<this.codecs.video.num.length;i++){
      console.log("Extracting:" + this.codecs.video.num[i]);
      for(var j=0;j<sdpLines.length;j++){
        var temp = sdpLines[j].split(new RegExp("a=(\\w+):"+this.codecs.video.num[i]+" ",'i'));

        if(temp.length>2){
          if(this.codecs.video.lines[i]){
            this.codecs.video.lines[i].push(j)
          } else {
            this.codecs.video.lines[i] = [j];
          }
          if(temp[1]=="rtpmap"){
            console.log(temp);
            this.codecs.video.name[i] = temp[2];
          }
        }
      }
    }

    return this.codecs;
  }

  /**
   * Modifies an SDP to prefer the codec given in numA (audio) and numV (video)
   * @param  {int} numA number of preferred audio codec
   * @param  {int} numV number of preferred video codec
   * @param  {string} sdp  a session description
   * @return {string}      Return sdp with preferred codecs
   */
  CodecSwitch.prototype.preferCodec = function(numA, numV, sdp) {
    if (codecs===null){
      this.codecs = this.extractCodecs(sdp);
    }

    numA = numA.toString();
    numV = numV.toString();

    var index = this.codecs.audio.num.indexOf(numA);

    var sdpLines = sdp.split('\r\n');

    if(index>=0){
      // get the mLine again
      for (var i = 0; i < sdpLines.length; i++) {
        if (sdpLines[i].search('m=audio') !== -1) {
          var mAudioLineIndex = i;
          break;
        }
      }
      var line = sdpLines[mAudioLineIndex].split(" ");

      // splitting the array in half... line has the beginning of the line and
      // nums has the codec numbers
      var nums = line.splice(3);

      // remove codec number first and then bring it to first position
      nums.splice(index, 1);
      nums.unshift(numA);

      // [HOTFIX][DEBUG][TEST] just set it as the only codec
      // nums = [numA];  // the problem is, the offer doesn't get processed... so no answer 

      // SOLUTION 1: Reorder RTP maps
      // --> get selected codec in front
      var aLines = sdpLines.splice(this.codecs.audio.lines[index][0], this.codecs.audio.lines[index].length);

      for(var i = aLines.length-1; i>=0; i--){
        // should be the first position in a lines, 
        // TODO: but would be better to search again
        var first = this.codecs.audio.lines[0][0];
        sdpLines.splice(first,0,aLines[i]);
      }

      // SOLUTION 2: Remove all codecs rtpmaps above the specified codec

      // Bring the line back together
      line = line.concat(nums);

      // put it back into SDP
      sdpLines[mAudioLineIndex] = line.toString().replace(/,/g, " ");
      
    }

    index = this.codecs.video.num.indexOf(numV);
    if(index>=0){
      // get the mLine
      for (var i = 0; i < sdpLines.length; i++) {
        if (sdpLines[i].search('m=video') !== -1) {
          var mVideoLineIndex = i;
          break;
        }
      }

      var line = sdpLines[mVideoLineIndex].split(" ");

      // splitting the array in half... line has the beginning of the line and
      // nums has the codec numbers
      var nums = line.splice(3);

      // remove codec number first and then bring it to first position
      nums.splice(index, 1);
      nums.unshift(numV);

      // [HOTFIX][DEBUG][TEST] just set it as the only codec
      // nums = [numV]; // the problem is, the offer doesn't get processed... so no answer 

      // Bring the line back together
      line = line.concat(nums);

      // put it back into SDP
      sdpLines[mVideoLineIndex] = line.toString().replace(/,/g, " "); 
    }

    // store everything to sdp and convert to string
    sdp = sdpLines.toString().replace(/,/g, "\r\n");

    return sdp;
  }

  root.CodecSwitch = new CodecSwitch();
})(this)
