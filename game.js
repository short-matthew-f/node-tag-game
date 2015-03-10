var players = {};
var currentItID;

var express = require('express');
var app = express();

app.set('port', (process.env.port || 3000));
app.use(express.static(__dirname + '/public'));

var io = require('socket.io')(http);

io.configure(function () {
  io.set("transports", ["xhr-polling"]);
  io.set("polling duration", 20);
});

io.on('connection', function(socket) {
  socket.on('player list', function () {
    socket.emit('player list', players);
  });

  socket.on('player enroll', function () {
    var _player = makePlayer(socket.id);
    players[socket.id] = _player;
    io.sockets.emit('player enroll', _player);
  });

  socket.on('player updated', function (_player) {
    var player = players[socket.id]

    player.x = _player.x;
    player.y = _player.y;
    player.delta = _player.delta;
    player.velocity = _player.velocity;

    io.sockets.emit('tag update', _player);
  });

  socket.on('player isout', function (_id) {
    io.sockets.emit('player isout', _id);
  });

  socket.on('disconnect', function () {
    delete players[socket.id];
    io.sockets.emit('player unenroll', socket.id);
  });
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});

setInterval(updateIt, 10000);

function updateIt () {
  if (currentItID) {
    io.sockets.emit('player isnotit', currentItID);
  };

  currentItID = chooseNextItID();
  io.sockets.emit('player isit', currentItID);
  io.sockets.emit('tag newit');
}

function chooseNextItID () {
  var keys = Object.keys(players);

  if (keys.length == 1) { return keys[0]; };

  var nextItID = currentItID;

  while (nextItID == currentItID) {
    nextItID = keys[Math.floor(Math.random() * keys.length)];
  };

  return nextItID;
};

function randomGridPos () {
  return [
    20 + Math.floor( Math.random() * 760 ),
    20 + Math.floor( Math.random() * 460 )
  ];
};

function dist (posOne, posTwo) {
  var dx = posOne[0] - posTwo[0],
      dy = posOne[1] - posTwo[1];

  return Math.sqrt( (dx * dx) + (dy * dy) );
};

function makePlayer (id) {
  if (Object.keys(players).length == 0) {
    var pos = randomGridPos();
  } else {
    var pos = nonInterferingPos();
  };

  var _player = {
    id: id,
    x: pos[0],
    y: pos[1],
    delta: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 }
  };

  return _player;
};

function nonInterferingPos () {
  var _players = [];
  var _keys = Object.keys(players);

  for (var i = 0; i < _keys.length; i += 1) {
    _players.push( players[_keys[i]] );
  };

  var intersecting = true;
  while (intersecting) {
    var pos = randomGridPos();

    intersecting = false;
    for (var i = 0; i < _players.length; i += 1) {
      var p = _players[i]

      if ( dist( pos, [p.x, p.y] ) <= 16 ) {
        intersecting = true;
        i = _players.length;
      };
    };
  };

  return pos;
};
