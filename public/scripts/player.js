function Player (_player, context, socket) {
  this.context  = context;
  this.socket   = socket;

  this.x  = _player.x;
  this.y  = _player.y;
  this.id = _player.id;

  this.direction = {
    left  : 0,
    up    : 0,
    right : 0,
    down  : 0
  };

  this.speed    = 3;
  this.delta    = { x: 0, y: 0 };
  this.velocity = { x: 0, y: 0 };
  this.radius   = 16;

  this.isPlayer = false;
  this.isIt     = false;
  this.itOut    = false;

  this.tagCount    = 0;
  this.taggedCount = 0;
};

_.extend(Player, {
  direction: function (code) {
    return {
      37: 'left',
      38: 'up',
      39: 'right',
      40: 'down'
    }[code];
  }
});

_.extend(Player.prototype, {
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
    this.delta = {
      x: -this.direction.left + this.direction.right,
      y: -this.direction.up + this.direction.down
    };
  },

  setVelocity: function () {
    if (
      (this.delta.x == 0 && this.delta.y == 0) ||
       this.isOut
    ) {
      this.velocity.x = 0;
      this.velocity.y = 0;
    } else {
      var x = this.delta.x, y = this.delta.y;
      var l = Math.sqrt(x * x + y * y);
      this.velocity.x = this.delta.x * (this.speed / l);
      this.velocity.y = this.delta.y * (this.speed / l);
    };
  },

  tick: function () {
    this.x += this.velocity.x;
    this.y += this.velocity.y;

    this.x = Math.max(20, Math.min(this.x, 780));
    this.y = Math.max(20, Math.min(this.y, 480));
  },

  toSocket: function () {
    return {
      id: this.id,

      x: this.x,
      y: this.y,

      delta: {
        x: this.delta.x,
        y: this.delta.y
      },

      velocity: {
        x: this.velocity.x,
        y: this.velocity.y
      }
    };
  },

  setDirection: function (code) {
    this.direction[Player.direction(code)] = 1;
    this.setDelta();
    this.setVelocity();

    this.socket.emit('player updated', this.toSocket());
  },

  unsetDirection: function (code) {
    this.direction[Player.direction(code)] = 0;
    this.setDelta();
    this.setVelocity();

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
