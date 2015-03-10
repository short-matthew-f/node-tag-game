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

_.extend(Tag.prototype, {
  startUpdating: function () {
    var thisTag = this;

    setInterval(function () {
      thisTag.update();
    }, 30);
  },

  setSockets: function () {
    var thisTag = this;

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
      var player = new Player( _player, thisTag.context, thisTag.socket );

      // if the player that enrolled is me, set extra stuff
      if (thisTag.socket.id == player.id) {
        thisTag.player = player;
        player.setPlayer( true );
        thisTag.startUpdating();
      };

      thisTag.add( player );
      $(thisTag).trigger('change');
    });

    this.socket.on('player unenroll', function (_id) {
      delete thisTag.players[_id];
      $(thisTag).trigger('change');
    });

    this.socket.on('player isit', function (_id) {
      thisTag.players[_id].setIt(true);
    });

    this.socket.on('player isnotit', function (_id) {
      console.log(_id);
      console.log(thisTag.players);

      thisTag.players[_id].setIt(false);
    });

    this.socket.on('player isout', function (_id) {
      thisTag.players[_id].setOut(true);
      thisTag.players[_id].taggedCount += 1;
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

    $(thisTag).on('change', function () {
      thisTag.clear();
      thisTag.render();
    });

    $('body').on("keydown", function (event) {
      var code = event.keyCode;

      if (moveDirs[code]) {
        event.preventDefault();
        thisTag.player.setDirection( code );
      }
    });

    $('body').on("keyup", function (event) {
      var code = event.keyCode;

      if (moveDirs[code]) {
        event.preventDefault();
        thisTag.player.unsetDirection( code );
      }
    });
  },

  enroll: function () {
    var thisTag = this;

    socket.emit('player list');

    socket.on('player list', function (_players) {
      var keys = Object.keys(_players);

      if (keys.length > 0) {
        $(keys).each(function (index, id) {
          var player = new Player(_players[id], thisTag.context, thisTag.socket);

          thisTag.add( player );
        });
      };

      socket.emit('player enroll');
    })
  },

  updatePlayer: function (_player) {
    var player = this.players[_player.id];

    player.x = _player.x;
    player.y = _player.y;
    player.delta = _player.delta;
    player.velocity = _player.velocity;
  },

  add: function (player) {
    this.players[player.id] = player;
  },

  remove: function (player) {
    delete this.players[player.id];
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

    c.font = "16px sans-serif";
    c.fillStyle = 'black';
    c.fillText("Score: up - " + this.player.tagCount + " down - " + this.player.taggedCount, 8, 486);
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
        var other = thisTag.players[id];

        if (
          player.id != id &&
          !other.isOut &&
          player.collide(other)
        ) {
          player.tagCount += 1;
          thisTag.socket.emit('player isout', other.id);
        };
      });
    };

    this.clear();
    this.render();
  }
});
