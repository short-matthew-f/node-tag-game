function Tag (context, socket) {
  this.context = context;
  this.socket  = socket;

  this.players = {};
  this.player;

  this.width   = this.context.canvas.width;
  this.height  = this.context.canvas.height;

  this.setSockets();
  this.setListeners();
};

$.extend(Tag.prototype, {
  startUpdating: function () {
    var thisTag = this;

    setInterval(function () {
      thisTag.update();
    }, 30);
  },

  setSockets: function () {
    var thisTag = this;

    this.socket.on('player list', function (_players) {
      var ids = Object.keys(_players);

      if (ids.length > 0) {
        $(ids).each(function (index, id) {
          if (thisTag.player == undefined) {
            if (thisTag.players[id]) {
              thisTag.updatePlayer( _players[id] )
            } else {
              var player = new Player(_players[id], thisTag.context, thisTag.socket);

              thisTag.add( player );
            }
          } else {
            if (thisTag.players[id]) {
              if (id != thisTag.player.id) {
                thisTag.updatePlayer( _players[id] )
              }
            } else {
              if (id == thisTag.player.id) {
                thisTag.add( thisTag.player );
              } else {
                thisTag.add( new Player(_players[id], thisTag.context, thisTag.socket) );
              }
            }
          };
        });
      };
    });

    this.socket.on('tag update', function (_player) {
      thisTag.updatePlayer(_player);
    });

    this.socket.on('tag newit', function () {
      var ids = Object.keys(thisTag.players);

      $(ids).each(function (i, id) {
        thisTag.players[id].setOut(false);
      });
    })

    this.socket.on('player enroll', function (_player) {
      // if the player that enrolled is me, set extra stuff
      if (thisTag.socket.id == _player.id) {
        thisTag.player = new Player( _player, thisTag.context, thisTag.socket );
        thisTag.player.setPlayer( true );
        thisTag.startUpdating();
      };

      thisTag.socket.emit('player list');
    });

    this.socket.on('player unenroll', function (_id) {
      if (thisTag.players[_id]) {
        delete thisTag.players[_id];
      };
    });

    this.socket.on('player isit', function (_id) {
      if (thisTag.players[_id]) {
        thisTag.players[_id].setIt(true);
      };
    });

    this.socket.on('player isnotit', function (_id) {
      if (thisTag.players[_id]) {
        thisTag.players[_id].setIt(false);
      };
    });

    this.socket.on('player isout', function (_id) {
      if (thisTag.players[_id]) {
        thisTag.players[_id].setOut(true);
      };
    });
  },

  setListeners: function () {
    var thisTag = this;

    var moveDirs = {
      37: true,
      38: true,
      39: true,
      40: true
    }

    $(window).on("keydown", function (event) {
      var code = event.keyCode;

      if (moveDirs[code]) {
        event.preventDefault();
        thisTag.player.setDirection( code );
      }
    });

    $(window).on("keyup", function (event) {
      var code = event.keyCode;

      if (moveDirs[code]) {
        event.preventDefault();
        thisTag.player.unsetDirection( code );
      }
    });
  },

  enroll: function () {
    socket.emit('player enroll');
  },

  updatePlayer: function (_player) {
    var player = this.players[_player.id];

    player.x  = _player.x;
    player.y  = _player.y;
    player.dx = _player.dx;
    player.dy = _player.dy;
  },

  add: function (player) {
    this.players[player.id] = player;
  },

  render: function () {
    var thisTag = this;
    var keys = Object.keys(this.players);

    $(keys).each(function (index, key) {
      thisTag.players[key].render();
    });

    thisTag.showScore();
  },

  showScore: function () {
    var c = this.context;

    c.font = "24px sans-serif";
    c.fillStyle = 'navy';
    c.fillText("Score: up - " + this.player.tagCount + " down - " + this.player.taggedCount, 8, 490);
  },

  clear: function () {
    this.context.clearRect(0, 0, this.width, this.height);
  },

  update: function () {
    var thisTag = this;
    var player = thisTag.player;

    var ids = Object.keys(this.players);

    $(ids).each(function (index, id) {
      thisTag.players[id].tick();
    });

    if (player.isIt) {
      $(ids).each(function (index, id) {
        if (player.id != id) {
          var other = thisTag.players[id];
          if (!other.isOut && player.collide(other)) {
            other.setOut(true);
            player.tagCount += 1;
            thisTag.socket.emit('player isout', other.id);
          };
        }
      });
    } else if (!player.isOut) {
      $(ids).each(function (index, id) {
        if (player.id != id) {
          var other = thisTag.players[id];
          if (other.isIt && player.collide(other)) {
            player.setOut(true);
            player.taggedCount += 1;
            thisTag.socket.emit('player isout', player.id);
          };
        }
      });
    }

    this.clear();
    this.render();
  }
});
