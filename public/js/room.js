// public/js/room.js
const socket = io('/');
const myVideo = document.getElementById('myVideo');
const userVideo = document.getElementById('userVideo');

let myStream;
let peerConnection;
const config = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }, // Public Google STUN server
  ],
};

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myStream = stream;
  myVideo.srcObject = stream;

  socket.emit('join-room', ROOM_ID, socket.id);

  socket.on('user-connected', (userId) => {
    console.log('New user connected:', userId);
    callUser(userId);
  });

  socket.on('offer', handleReceiveOffer);
  socket.on('answer', handleReceiveAnswer);
  socket.on('ice-candidate', handleNewICECandidateMsg);
});

function callUser(userId) {
    peerConnection = new RTCPeerConnection(config);

    myStream.getTracks().forEach(track => peerConnection.addTrack(track, myStream));

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', ROOM_ID, event.candidate);
        }
    };

    peerConnection.ontrack = (event) => {
        // Create a new video element for the remote user
        const video = document.createElement('video');
        video.id = userId; // Set the unique ID for each remote user
        video.srcObject = event.streams[0];
        video.autoplay = true;
        document.body.append(video);
    };

    peerConnection.createOffer()
        .then(offer => {
            return peerConnection.setLocalDescription(offer);
        })
        .then(() => {
            socket.emit('offer', ROOM_ID, peerConnection.localDescription);
        });
}

function handleReceiveOffer(offer) {
  peerConnection = new RTCPeerConnection(config);

  myStream.getTracks().forEach(track => peerConnection.addTrack(track, myStream));

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice-candidate', ROOM_ID, event.candidate);
    }
  };

  peerConnection.ontrack = (event) => {
    userVideo.srcObject = event.streams[0];
  };

  peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
    .then(() => {
      return peerConnection.createAnswer();
    })
    .then(answer => {
      return peerConnection.setLocalDescription(answer);
    })
    .then(() => {
      socket.emit('answer', ROOM_ID, peerConnection.localDescription);
    });
}

function handleReceiveAnswer(answer) {
  peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

function handleNewICECandidateMsg(candidate) {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}

//old

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideo.srcObject = stream;

  socket.emit('join-room', ROOM_ID, socket.id);

  socket.on('user-connected', userId => {
    console.log('User connected:', userId);
    connectToNewUser(userId, stream);
  });
});

function connectToNewUser(userId, stream) {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    video.id = userId; // Unique ID for each video
    video.play();
    document.body.append(video);
}
