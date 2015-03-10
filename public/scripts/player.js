function Player (_player, context, socket) {
  this.context  = context;
  this.socket   = socket;

  this.x           = _player.x;
  this.y           = _player.y;
  this.id          = _player.id;
  this.tagCount    = _player.tagCount || 0;
  this.taggedCount = _player.taggedCount || 0;

  this.direction = {
    left  : 0,
    up    : 0,
    right : 0,
    down  : 0
  };

  this.speed    = 5;
  this.dx       = 0;
  this.dy       = 0;
  this.radius   = 16;

  this.isPlayer = false;
  this.isIt     = false;
  this.isOut    = false;
};

$.extend(Player, {
  direction: function (code) {
    return {
      37: 'left',
      38: 'up',
      39: 'right',
      40: 'down'
    }[code];
  }
});

$.extend(Player.prototype, {
  setIt: function (val) {
    this.isIt = val;
    return this;
  },

  setOut: function (val) {
    this.isOut = val;
    return this;
  },

  setPlayer: function (val) {
    this.isPlayer = val;
    return this;
  },

  setDelta: function () {
    this.dx = this.direction.right - this.direction.left;
    this.dy = this.direction.down - this.direction.up;
  },

  tick: function () {
    var base, diag;

    if (this.isIt) {
      base = 7;
      diag = 5;
    } else {
      base = 5;
      diag = 3;
    };

    if (!this.isOut) {
      if (this.dx != 0 || this.dy != 0) {
        if (this.dx != 0 && this.dy != 0) {
          this.x += diag * this.dx;
          this.y += diag * this.dy;
        } else {
          this.x += base * this.dx;
          this.y += base * this.dy;
        }
      };

      this.x = Math.max(20, Math.min(this.x, 780));
      this.y = Math.max(20, Math.min(this.y, 480));

      if (this.id == this.socket.id) {
        this.socket.emit('player updated', this.toSocket());
      };
    };
  },

  toSocket: function () {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      dx: this.dx,
      dy: this.dy
    };
  },

  setDirection: function (code) {
    this.direction[Player.direction(code)] = 1;
    this.setDelta();
    this.socket.emit('player updated', this.toSocket());
  },

  unsetAllDirections: function () {
    this.direction.up = 0;
    this.direction.down = 0;
    this.direction.left = 0;
    this.direction.right = 0;
    this.setDelta();
    this.socket.emit('player updated', this.toSocket());
  },

  unsetDirection: function (code) {
    this.direction[Player.direction(code)] = 0;
    this.setDelta();
    this.socket.emit('player updated', this.toSocket());
  },

  render: function () {
    var c = this.context;

    c.beginPath();
    this.setStyles();
    c.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
    c.stroke();
    c.fill();
  },

  setStyles: function () {
    var c = this.context;
    c.lineWidth = 4;

    if (this.isPlayer) {
      c.strokeStyle = "gold";
      c.fillStyle = "blue";
    } else {
      c.strokeStyle = "grey";
      c.fillStyle = "white";
    };

    if (this.isIt) {
      c.fillStyle = "red";
    } else if (this.isOut) {
      c.fillStyle = "black";
    };
  },

  collide: function (other) {
    var dx     = this.x - other.x,
        dy     = this.y - other.y,
        radius = this.radius + other.radius;

    // is the distance between bodies less than the radius?
    return (dx * dx + dy * dy < radius * radius);
  }
});
