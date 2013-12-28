worker_url = ( () ->
    scripts = document.getElementsByTagName 'script'
    index = scripts.length - 1
    myScript = scripts[index]
    src = myScript.src
    arr = src.split '/'
    arr = arr.splice 0, arr.length - 1
    arr.push "metro-worker.js"
    return arr.join("/")
)()


rand = (arr) ->
  arr[Math.floor(Math.random() * arr.length)]


class Metronome

  constructor: (@opts) ->

    @audioContext = new AudioContext()
    #https://code.google.com/p/chromium/issues/detail?id=159359
    @audioContext.createGainNode()
    @is_playing = false
    @lookahead = @opts.lookahead or 25.0
    @schedule_ahead_time = @opts.schedule_ahead_time or 0.1
    @tempo = @opts.tempo or 120
    @seconds_per_tick = 60 / @tempo / 24
    @next_tick_time = @audioContext.currentTime
    @current_tick = 0
    @players = []

    @scheduler = new Worker worker_url
    @scheduler.addEventListener "message", @schedule

  advance: () ->
    # grab current tempo
    @seconds_per_tick = 60 / @tempo / 24
    @next_tick_time += @seconds_per_tick
    @current_tick++

  schedule: () =>
    if not @is_playing
      return
    while @next_tick_time < @audioContext.currentTime + @schedule_ahead_time
        for player in @players
          player.play @current_tick, @next_tick_time, @tempo, this
        @advance()

  start: () ->
    @next_tick_time = @audioContext.currentTime + @schedule_ahead_time
    @is_playing = true
    @scheduler.postMessage "start"

  stop: () ->
    @is_playing = false
    @scheduler.postMessage "stop"


class EighthEveryQuarterPlayer

  play: (current_tick, time, tempo, metronome) ->
    ac = metronome.audioContext
    if not (current_tick % 32)  # quarter notes
      osc = ac.createOscillator()
      osc.connect ac.destination
      osc.frequency.value = 990.0
      osc.start time
      osc.stop time + 60 / tempo / 2


class Random440HarmonyPlayer

  HARMS: [
    55, 110, 220, 330, 440, 550, 660, 770, 880,
  ]

  SUSS: [
    .25, .5, 1, 1.25,
  ]

  play: (current_tick, time, tempo, metronome) ->
    ac = metronome.audioContext
    if not (current_tick % 8)  # sixteenth notes
      suss = (60 / tempo * rand(@SUSS))
      osc = ac.createOscillator()
      osc.connect ac.destination
      osc.frequency.value = rand @HARMS
      osc.start time
      osc.stop time + suss


main = () ->
  window.m = new Metronome {
    tempo: 60
  }
  m.players = [
    new EighthEveryQuarterPlayer(),
    new Random440HarmonyPlayer(),
  ]
  m.start()

window.Metronome = Metronome