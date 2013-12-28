// Generated by CoffeeScript 1.6.3
(function() {
  var EighthEveryQuarterPlayer, Metronome, Random440HarmonyPlayer, main, rand, worker_url,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  worker_url = (function() {
    var arr, index, myScript, scripts, src;
    scripts = document.getElementsByTagName('script');
    index = scripts.length - 1;
    myScript = scripts[index];
    src = myScript.src;
    arr = src.split('/');
    arr = arr.splice(0, arr.length - 1);
    arr.push("metro-worker.js");
    return arr.join("/");
  })();

  rand = function(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  };

  Metronome = (function() {
    function Metronome(opts) {
      this.opts = opts;
      this.schedule = __bind(this.schedule, this);
      this.audioContext = new AudioContext();
      this.audioContext.createGainNode();
      this.is_playing = false;
      this.lookahead = this.opts.lookahead || 25.0;
      this.schedule_ahead_time = this.opts.schedule_ahead_time || 0.1;
      this.tempo = this.opts.tempo || 120;
      this.seconds_per_tick = 60 / this.tempo / 24;
      this.next_tick_time = this.audioContext.currentTime;
      this.current_tick = 0;
      this.players = [];
      this.scheduler = new Worker(worker_url);
      this.scheduler.addEventListener("message", this.schedule);
    }

    Metronome.prototype.advance = function() {
      this.seconds_per_tick = 60 / this.tempo / 24;
      this.next_tick_time += this.seconds_per_tick;
      return this.current_tick++;
    };

    Metronome.prototype.schedule = function() {
      var player, _i, _len, _ref, _results;
      if (!this.is_playing) {
        return;
      }
      _results = [];
      while (this.next_tick_time < this.audioContext.currentTime + this.schedule_ahead_time) {
        _ref = this.players;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          player = _ref[_i];
          player.play(this.current_tick, this.next_tick_time, this.tempo, this);
        }
        _results.push(this.advance());
      }
      return _results;
    };

    Metronome.prototype.start = function() {
      this.next_tick_time = this.audioContext.currentTime + this.schedule_ahead_time;
      this.is_playing = true;
      return this.scheduler.postMessage("start");
    };

    Metronome.prototype.stop = function() {
      this.is_playing = false;
      return this.scheduler.postMessage("stop");
    };

    return Metronome;

  })();

  EighthEveryQuarterPlayer = (function() {
    function EighthEveryQuarterPlayer() {}

    EighthEveryQuarterPlayer.prototype.play = function(current_tick, time, tempo, metronome) {
      var ac, osc;
      ac = metronome.audioContext;
      if (!(current_tick % 32)) {
        osc = ac.createOscillator();
        osc.connect(ac.destination);
        osc.frequency.value = 990.0;
        osc.start(time);
        return osc.stop(time + 60 / tempo / 2);
      }
    };

    return EighthEveryQuarterPlayer;

  })();

  Random440HarmonyPlayer = (function() {
    function Random440HarmonyPlayer() {}

    Random440HarmonyPlayer.prototype.HARMS = [55, 110, 220, 330, 440, 550, 660, 770, 880];

    Random440HarmonyPlayer.prototype.SUSS = [.25, .5, 1, 1.25];

    Random440HarmonyPlayer.prototype.play = function(current_tick, time, tempo, metronome) {
      var ac, osc, suss;
      ac = metronome.audioContext;
      if (!(current_tick % 8)) {
        suss = 60 / tempo * rand(this.SUSS);
        osc = ac.createOscillator();
        osc.connect(ac.destination);
        osc.frequency.value = rand(this.HARMS);
        osc.start(time);
        return osc.stop(time + suss);
      }
    };

    return Random440HarmonyPlayer;

  })();

  main = function() {
    window.m = new Metronome({
      tempo: 60
    });
    m.players = [new EighthEveryQuarterPlayer(), new Random440HarmonyPlayer()];
    return m.start();
  };

  window.Metronome = Metronome;

}).call(this);
