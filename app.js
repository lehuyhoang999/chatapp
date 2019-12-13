var name = '';
var myid = '';
var myfriendname = '';
var myfriendid = '';


  // TODO: Replace the following with your app's Firebase project configuration
var firebaseConfig = {
    // ...
    apiKey: "AIzaSyA2I9XT-HhzcRNgiiNm-9pi5yJY5suq3Ag",
    authDomain: "project6smart2h.firebaseapp.com",
    databaseURL: "https://project6smart2h.firebaseio.com",
    projectId: "project6smart2h",
    storageBucket: "project6smart2h.appspot.com",
    messagingSenderId: "837083928015",
    appId: "1:837083928015:web:6250696a02203b39b0aeba"
  };
  
  // Initialize Firebase
firebase.initializeApp(firebaseConfig);

var database = firebase.database();



const configuration = {iceServers: [{urls: 'stun:stun.l.google.com:19302'}]};
const pc = new RTCPeerConnection(configuration);
var dc;
const remoteView = document.getElementById('remoteStream');
// const config = {audio: true, video: true};
const config = {audio: true, video: true};
const localView = document.getElementById('localStream');
localView.muted = true;
localView.volume = 0;
var type = 'msg';
navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia || navigator.mediaDevices.webkitGetUserMedia || navigator.mediaDevices.mozGetUserMedia;


// send any ice candidates to the other peer
pc.onicecandidate = async ({candidate}) => {
    console.log(candidate);
    // signaling.send({candidate})
    if(candidate){
        let candi = JSON.stringify(candidate)
        await database.ref().child('Videos/' + myfriendid + '/candidate').push({candidate:candi,sender:myid});
    }
};

// let the "negotiationneeded" event trigger offer generation
pc.onnegotiationneeded = async () => {
    try {
      await pc.setLocalDescription(await pc.createOffer());
      console.log('onnegotiationneeded**********************offer');
      console.log(pc.localDescription);
      // send the offer to the other peer
    //   signaling.send({desc: pc.localDescription});
    let desc = JSON.stringify(pc.localDescription);
    await database.ref().child('Videos/' + myfriendid + '/desc').push({desc:desc,sender:myid,type:type});
    } catch (err) {
      console.error(err);
    }
};

// once remote track media arrives, show it in remote video element
pc.ontrack = (event) => {
    // don't set srcObject again if it is already set.
    if (remoteView.srcObject) return;
    remoteView.srcObject = event.streams[0];
    remoteView.play();
};

pc.ondatachannel = (event) => {
  event.channel.onmessage = (e) => {
    console.log('ondatachannel');
    console.log(e.data);
    $('#message').append(`<div class="d-flex justify-content-start">
                            <div class="msg_cotainer">
                                <span>${e.data}</span>
                            </div>
                          </div>`);
    scrollToBottom();
  };
  event.channel.onopen = (e) => {
    console.log('onopen');
    console.log(e);
    var state = event.channel.readyState;
    if (state === "open") {
      database.ref('Videos/'+ myfriendid + '/name').on('value', (value)=>{
        myfriendname = value.val();
        console.log(myfriendname);
      });
      $('#myForm').removeClass('chat-room');
      $('.data').empty();
      $('.data').append('<p class="name mb-0"><strong>' + myfriendname + '</strong></p>');
      $('#closeButton').click(()=> {
        $('#myForm').addClass('chat-room');
      });
      $('#btnsend').click(()=> {
        sendMsg(event.channel);
      });
      $('#inputmessage').keyup((e)=> {
        if (e.keyCode === 13) {
          sendMsg(event.channel);   
        }
      });
    } else {
      $('#myForm').addClass('chat-room');
      event.channel.close();
      alert('connect false !');
    }
  };
};

// call start() to initiate
async function start() {
    try {
        // get local stream, show it in self-view and add it to be sent
        await navigator.mediaDevices.getUserMedia(config).then((stream)=>{
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));
          localView.srcObject = stream;
          localView.play();
        });
    } catch (err) {
      console.error(err);
    }
  }

  async function configDescMessage(desc) {
    console.log(desc);
    try {
        if (desc) {
            console.log('connectionSetting********desc');
            // if we get an offer, we need to reply with an answer
            if (desc.type === 'offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(desc));
                if(type === 'call'){
                  console.log('navigator');
                  $('#video').addClass('show');
                  $('#closeVideo').click(()=> {
                    $('#video').removeClass('show');
                    type = 'msg';
                    let stream = localView.srcObject;
                    stream.getTracks().forEach((track)=>{
                      track.stop();
                    });
                    localView.srcObject = null;
                    stream = remoteView.srcObject;
                    stream.getTracks().forEach((track)=>{
                      track.stop();
                    });
                    remoteView.srcObject = null;
                  });
                  await navigator.mediaDevices.getUserMedia(config).then((stream)=>{
                  stream.getTracks().forEach((track) => pc.addTrack(track, stream));
                  localView.srcObject = stream;
                  localView.play();
                  });
                }
                
                await pc.setLocalDescription(await pc.createAnswer());
                let descanser = JSON.stringify(pc.localDescription);
                await database.ref().child('Videos/' + myfriendid + '/desc').push({desc: descanser, sender: myid, type:type});
                
                // signaling.send({desc: pc.localDescription});
                console.log('offer****************************');
                console.log(pc.localDescription);
            } else if (desc.type === 'answer') {
              await pc.setRemoteDescription(desc);
              console.log('answer *****************************');
            } else {
              console.log('Unsupported SDP type.');
            }
        }
    } catch (err) {
      console.error(err);
    }
  }


  async function configCandicate(candidate) {
    try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
        console.error(err);
    }
  }

  function login() {
        database.ref('Videos/' + myid + '/desc').on('value', (snapshot)=> {
            snapshot.forEach((obj)=>{
                    myfriendid = obj.val().sender;
                    type = obj.val().type;
                    console.log('login');
                    console.log(myfriendid);
                    configDescMessage(JSON.parse(obj.val().desc));
            });

        });

        database.ref('Videos/' + myid + '/candidate').on('value', (snapshot)=> {
            snapshot.forEach((obj)=>{
                console.log(obj.val().sender);
                myfriendid = obj.val().sender;
                configCandicate(JSON.parse(obj.val().candidate));
            });
        });
  }

  function listfriend() {
    database.ref('Videos').on('value', (snapshot)=>{
      console.log(snapshot);
      document.getElementById('listfriend').innerHTML = '';
      snapshot.forEach(user => {
        console.log(user.val().id);
        if (user.val().id !== myid) {
          $('#listfriend').append('<li onclick="chatwith(\''+ user.val().id + '\',\''+ user.val().name +'\')">'+user.val().name + '</li>');
        }
      });
    });
  }

  function chatwith(id, name) {
    console.log(id);
    console.log(name);
    myfriendid = id;
    myfriendname = name;
    type = 'msg';
    database.ref('Videos/'+ myfriendid + '/desc').remove();
    database.ref('Videos/'+ myfriendid + '/candidate').remove();
    database.ref('Videos/'+ myid + '/desc').remove();
    database.ref('Videos/'+ myid + '/candidate').remove();
    
    let date = new Date();
    console.log(myfriendid + date);
    if(dc){
      dc.close();
    }
    dc = pc.createDataChannel(myfriendid + date);
    dc.onmessage = function(e){
      console.log('onmessage');
      console.log(e.data);
      $('#message').append(`<div class="d-flex justify-content-start">
                              <div class="msg_cotainer">
                                  <span>${e.data}</span>
                              </div>
                            </div>`);
      scrollToBottom();
    }
    dc.onopen = function(event){
        console.log('onopen');
        console.log(event.data);
        var state = dc.readyState;
        if (state === "open") {
          $('#myForm').removeClass('chat-room');
          $('.data').empty();
          $('.data').append('<p class="name mb-0"><strong>' + name + '</strong></p>');
          $('#closeButton').click(()=> {
            $('#myForm').addClass('chat-room');
          });
          $('#btnsend').click(()=> {
            sendMsg(dc);
          });
          $('#inputmessage').keyup((event)=> {
            if (event.keyCode === 13) {
              sendMsg(dc);   
            }
          });
        } else {
          $('#myForm').addClass('chat-room');
          dc.close();
          alert('connect false !');
        }
    }
  }

  function sendMsg(channel) {
    console.log('btnsend');
    let msg = $('#inputmessage').val();
    console.log(msg);
    channel.send(msg);
    $('#inputmessage').val('');
    $('#message').append(`<div class="d-flex justify-content-end">
                            <div class="msg_cotainer_send">
                                <span>${msg}</span>
                            </div>
                          </div>`);
      scrollToBottom()
  }

  function videoClick() {
    database.ref('Videos/'+ myfriendid + '/desc').remove();
    database.ref('Videos/'+ myfriendid + '/candidate').remove();
    database.ref('Videos/'+ myid + '/desc').remove();
    database.ref('Videos/'+ myid + '/candidate').remove();
    $('#video').addClass('show');
    type = 'call';
    $('#closeVideo').click(()=> {
      $('#video').removeClass('show');
      type = 'msg';
      let stream = localView.srcObject;
      stream.getTracks().forEach((track)=>{
        track.stop();
      });
      localView.srcObject = null;
      stream = remoteView.srcObject;
      stream.getTracks().forEach((track)=>{
        track.stop();
      });
      remoteView.srcObject = null;
    });
    start();
  }

  function inputName() {
    $('#inputname').addClass('show');
    $('#myname').focus();
  }

  function okInputName() {
    name = document.getElementById('myname').value;
    if (name.length > 0) {
      myid = database.ref().child('Videos').push().key;
      document.getElementById('name').innerHTML = name;
      document.getElementById('id').innerHTML = myid;
      database.ref('Videos/' + myid).set({name:name,id:myid, status: 'free'});
      database.ref('Videos/'+ myid).onDisconnect().remove();
      listfriend();
      login();
      $('#inputname').removeClass('show');
    } else {
      alert('Hãy nhập tên bạn !')
    }
    
  }

  function scrollToBottom() {
    $('#message').scrollTop($('#message').prop('scrollHeight'));
  }
  

