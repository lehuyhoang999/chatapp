var name = '';
var myid = '';
var myfriendname = '';
var myfriendid = '';

var showmsgchat = {};
var pc = {};
var readyState = {};

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

var iceServers = [{urls: ['stun:stun.l.google.com:19302',
'stun:stun.l.google.com:19302',
'stun:stun1.l.google.com:19302',
'stun:stun2.l.google.com:19302',
'stun:stun3.l.google.com:19302',
'stun:stun4.l.google.com:19302',
'stun:stun.ekiga.net',
'stun:stun.ideasip.com',
'stun:stun.rixtelecom.se',
'stun:stun.schlund.de',
'stun:stun.stunprotocol.org:3478',
'stun:stun.voiparound.com',
'stun:stun.voipbuster.com',
'stun:stun.voipstunt.com',
'stun:stun.voxgratia.org'
]},
{
  url: 'turn:turn.anyfirewall.com:443?transport=tcp',
  credential: 'webrtc',
  username: 'webrtc'
}];

var configuration = {iceServers: iceServers};

const remoteView = document.getElementById('remoteStream');
const config = {audio: true, video: true};
// const configVideoCall = {audio: true, video: true};
// const configAudioCall = {audio: true, video: false};
const localView = document.getElementById('localStream');
localView.muted = true;
localView.volume = 0;
var type = 'msg';
navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia || navigator.mediaDevices.webkitGetUserMedia || navigator.mediaDevices.mozGetUserMedia;

// call start() to initiate
  async function start(id) {
    try {
        // get local stream, show it in self-view and add it to be sent
        await navigator.mediaDevices.getUserMedia(config).then((stream)=>{
          stream.getTracks().forEach((track) => pc[id].addTrack(track, stream));
          localView.srcObject = stream;
          localView.play();
        });
    } catch (err) {
      console.error(err);
    }
  }

  async function configDescMessage(id, desc) {
    console.log(desc);
    try {
        if (desc) {
            console.log('connectionSetting********desc');
            // if we get an offer, we need to reply with an answer
            if (desc.type === 'offer') {
                if (!readyState[id]) {
                  createPeerConn(id);
                }
                await pc[id].setRemoteDescription(new RTCSessionDescription(desc));
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
                  stream.getTracks().forEach((track) => pc[id].addTrack(track, stream));
                  localView.srcObject = stream;
                  localView.play();
                  });
                }
                
                await pc[id].setLocalDescription(await pc[id].createAnswer());
                let descanser = JSON.stringify(pc[id].localDescription);
                await database.ref().child('Videos/' + id + '/desc').push({desc: descanser, sender: myid, type:type});
                
                // signaling.send({desc: pc.localDescription});
                console.log('offer****************************');
                console.log(pc[id].localDescription);
            } else if (desc.type === 'answer') {
              await pc[id].setRemoteDescription(desc);
              console.log('answer *****************************');
            } else {
              console.log('Unsupported SDP type.');
            }
        }
    } catch (err) {
      console.error(err);
    }
  }


  async function configCandicate(id, candidate) {
    try {
        await pc[id].addIceCandidate(new RTCIceCandidate(candidate));
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
                    configDescMessage(myfriendid, JSON.parse(obj.val().desc));
            });

        });

        database.ref('Videos/' + myid + '/candidate').on('value', (snapshot)=> {
            snapshot.forEach((obj)=>{
                console.log(obj.val().sender);
                myfriendid = obj.val().sender;
                configCandicate(myfriendid, JSON.parse(obj.val().candidate));
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
    if (!readyState[id]) {

      createPeerConn(id)
    
      type = 'msg';
      database.ref('Videos/'+ id + '/desc').remove();
      database.ref('Videos/'+ id + '/candidate').remove();
      database.ref('Videos/'+ myid + '/desc').remove();
      database.ref('Videos/'+ myid + '/candidate').remove();
      let dc = pc[id].createDataChannel(id);
      console.log('***********createDataChannel');
      dc.onmessage = function(e){
        console.log('onmessage');
        console.log(e.data);
        showmsgHistory(id, e.data, false);
      }
      dc.onopen = function(event){
          console.log('onopen');
          console.log(event.data);
          var state = dc.readyState;
          if (state === "open") {
            readyState[id] = state;

            createWindowChat(dc, id);

          } else {
            dc.close();
            alert('connect false !');
          }
      }

      dc.onclose = (e) => {
        console.log('close');
      };
    }
  }

  function sendMsg(channel, id, msg) {
    if (channel.readyState === 'open'){
      channel.send(msg);
      showmsgHistory(id, msg, true);
    } else {
      alert('Connection False !');
    }
    
  }

  function showmsgHistory(id, msg, type){
    if (showmsgchat[id]) {
      if (type) {
        showmsgchat[id].append(`<div class="d-flex justify-content-end">
                                  <div class="msg_cotainer_send">
                                      <span>${msg}</span>
                                  </div>
                                </div>`);
      } else {
        showmsgchat[id].append(`<div class="d-flex justify-content-start">
                                  <div class="msg_cotainer">
                                      <span>${msg}</span>
                                  </div>
                                </div>`);
      }
      scrollToBottom(id);
    }
  }

  function createPeerConn(id) {
    pc[id] = new RTCPeerConnection(configuration);
    // send any ice candidates to the other peer
    pc[id].onicecandidate = async ({candidate}) => {
      console.log(candidate);
      // signaling.send({candidate})
      if(candidate){
          let candi = JSON.stringify(candidate)
          await database.ref().child('Videos/' + id + '/candidate').push({candidate:candi,sender:myid});
      }
    };

    // let the "negotiationneeded" event trigger offer generation
    pc[id].onnegotiationneeded = async () => {
      try {
        await pc[id].setLocalDescription(await pc[id].createOffer());
        console.log('onnegotiationneeded**********************offer');
        console.log(pc[id].localDescription);
        // send the offer to the other peer
      //   signaling.send({desc: pc.localDescription});
      let desc = JSON.stringify(pc[id].localDescription);
      await database.ref().child('Videos/' + id + '/desc').push({desc:desc,sender:myid,type:type});
      } catch (err) {
        console.error(err);
      }
    };

    // once remote track media arrives, show it in remote video element
    pc[id].ontrack = (event) => {
      // don't set srcObject again if it is already set.
      if (remoteView.srcObject) return;
      remoteView.srcObject = event.streams[0];
      remoteView.play();
    };

    pc[id].ondatachannel = (event) => {
      event.channel.onmessage = (e) => {
        console.log('ondatachannel');
        console.log(e.data);
        showmsgHistory(id, e.data, false);
      };
      event.channel.onopen = (e) => {
        console.log('onopen');
        console.log(e);
        var state = event.channel.readyState;
        if (state === "open") {
          readyState[id] = state;
          database.ref('Videos/'+ id + '/name').on('value', (value)=>{
            myfriendname = value.val();
            console.log(myfriendname);
          });

          createWindowChat(event.channel, id);

        } else {
          event.channel.close();
          alert('connect false !');
        }
      };

      event.channel.onclose = (e) => {
        console.log('close');
      };

    };
  }

  function createWindowChat(dc, id) {
    var panel = $(
      `<div class="card small-chat wide">
        <div class="card-header white d-flex justify-content-between p-2" style="cursor: pointer;">
          <div class="heading d-flex justify-content-start">
            <div class="profile-photo">
              <img src="" alt="avatar" class="avatar rounded-circle mr-2 ml-0">
              <span class="state"></span>
            </div>
            <div class="data">
              
            </div>
          </div>
          <div class="icons-up">
            
          </div>
        </div>
        <div class="card-body my-custom-scrollbar">
            
        </div>
        <div class="card-footer text-muted white pt-1 pb-2 px-3">
            <div class="input-group">
                
            </div>
            <div class="icons-down">
                
            </div>
        </div>
      </div>`);

      var title = $('<p class="name mb-0"><strong></strong></p>').text(myfriendname);

      var videocall = $('<a class="feature"><i class="fa fa-video mr-2"></i></a>');
      var audiocall = $('<a class="feature"><i class="fa fa-phone mr-2"></i></a>');
      var closemsg = $('<a id="closeButton"><i class="fa fa-times mr-2"></i></a>');

      var msg = $('<input type="text" class="form-control" placeholder="Type a message...">');
      var sendbtn = $(`<div class="input-group-append">
      <span class="input-group-text"><i class="fa fa-paper-plane"></i></span>
      </div>`)

      $('.data', panel).append(title);
      $('.icons-up', panel).append(videocall).append(audiocall).append(closemsg);

      showmsgchat[id] = $('.card-body', panel);

      $('.input-group', panel).append(msg).append(sendbtn);

      $('#myForm > div').append(panel);

      closemsg.click(()=>{
        console.log('close');
        panel.remove();
        delete pc[id];
        pc[id] = null;
        delete readyState[id];
        readyState[id] = null;
      });

      msg.keyup((event)=>{
        if (event.keyCode === 13){
          console.log('keyup');
          let ms = msg.val();
          msg.val('');
          console.log(ms);
          sendMsg(dc, id, ms);
        }
      });

      sendbtn.click(()=>{
        console.log('sendbtn');
        let ms = msg.val();
        msg.val('');
        console.log(ms);
        sendMsg(dc, id, ms);
      });

      videocall.click(()=>videoClick(id));
  }

  function videoClick(id) {
    database.ref('Videos/'+ id + '/desc').remove();
    database.ref('Videos/'+ id + '/candidate').remove();
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
    start(id);
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

  function scrollToBottom(id) {
    showmsgchat[id].scrollTop(showmsgchat[id].prop('scrollHeight'));
  }

$(document).ready(function () {
  // window.onload = function() {
    console.log("onload: ", configuration);
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function($evt){
       if(xhr.readyState == 4 && xhr.status == 200){
           let res = JSON.parse(xhr.responseText);
           iceServers = res.v.iceServers;
           configuration = iceServers;
           console.log("response: ", iceServers);
           console.log("onload: ", configuration);
       }
    };
    xhr.open("PUT", "https://global.xirsys.net/_turn/MyFirstApp", true);
    xhr.setRequestHeader ("Authorization", "Basic " + btoa("lehuyhoang999:09ae095a-26d2-11ea-827c-0242ac110004"));
    xhr.setRequestHeader ("Content-Type", "application/json");
    xhr.send( JSON.stringify({"format": "urls"}) );
//  };
});