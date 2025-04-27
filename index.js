const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/room/:roomId', (req, res) => {
  res.render('room', { roomId: req.params.roomId });
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    console.log(`${userId} joined room: ${roomId}`);
    socket.to(roomId).emit('user-connected', userId);

    // When a user leaves the room
    socket.on('disconnect', () => {
      console.log(`${userId} disconnected`);
      socket.to(roomId).emit('user-disconnected', userId);
    });

    // Forwarding offer/answer/ICE candidates
    socket.on('offer', (roomId, offer) => {
      socket.to(roomId).emit('offer', offer);
    });
    socket.on('answer', (roomId, answer) => {
      socket.to(roomId).emit('answer', answer);
    });
    socket.on('ice-candidate', (roomId, candidate) => {
      socket.to(roomId).emit('ice-candidate', candidate);
    });
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
