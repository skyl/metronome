running = false

lookahead = 25

interval = null

cb = (e) ->
  switch e.data
    when 'start'
      if not running
        running = true
        interval = setInterval () ->
          self.postMessage 'schedule'
        , lookahead
    when 'stop'
      clearInterval interval
      running = false

self.addEventListener 'message', cb, false
