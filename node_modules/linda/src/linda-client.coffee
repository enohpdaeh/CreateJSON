## linda client for webbrowser

class LindaClient
  connect: (@io) ->
    return @

  tuplespace: (name) ->
    return new TupleSpace @, name

  requestKeepalive: (url) ->
    @tuplespace('__linda').write {type: 'keepalive', to: url}

class TupleSpace

  constructor: (@linda, @name) ->
    @watch_callback_ids = {}
    @io_callbacks = []
    @linda.io.on 'disconnect', =>
      @remove_io_callbacks()

  create_callback_id: ->
    return Date.now() - Math.random()

  create_watch_callback_id: (tuple) ->
    key = JSON.stringify tuple
    return @watch_callback_ids[key] or
      @watch_callback_ids[key] = @create_callback_id()

  remove_io_callbacks: ->
    for c in @io_callbacks
      @linda.io.removeListener c.name, c.listener
    @io_callbacks = []

  write: (tuple, options={expire: null}) ->
    data = { tuplespace: @name, tuple: tuple, options: options }
    @linda.io.emit '__linda_write', data

  take: (tuple, callback) ->
    return if typeof callback isnt 'function'
    id = @create_callback_id()
    name = "__linda_take_#{id}"
    listener = (err, tuple) ->
      callback err, tuple
    @io_callbacks.push {name: name, listener: listener}
    @linda.io.once name, listener
    @linda.io.emit '__linda_take', {tuplespace: @name, tuple: tuple, id: id}
    return id

  read: (tuple, callback) ->
    return if typeof callback isnt 'function'
    id = @create_callback_id()
    name = "__linda_read_#{id}"
    listener = (err, tuple) ->
      callback err, tuple
    @io_callbacks.push {name: name, listener: listener}
    @linda.io.once name, listener
    @linda.io.emit '__linda_read', {tuplespace: @name, tuple: tuple, id: id}
    return id

  watch: (tuple, callback) ->
    return if typeof callback isnt 'function'
    id = @create_watch_callback_id tuple
    name = "__linda_watch_#{id}"
    listener = (err, tuple) ->
      callback err, tuple
    @io_callbacks.push {name: name, listener: listener}
    @linda.io.on name, listener
    @linda.io.emit '__linda_watch', {tuplespace: @name, tuple: tuple, id: id}
    return id

  cancel: (id) ->
    if @linda.io.connected
      @linda.io.emit '__linda_cancel', {tuplespace: @name, id: id}
    setTimeout =>
      for i in [(@io_callbacks.length-1)..0]
        c = @io_callbacks[i]
        if c.name.match(new RegExp "_#{id}$")
          @linda.io.removeListener c.name, c.listener
          @io_callbacks.splice i, 1
    , 100


if window?
  window.Linda = LindaClient
else if module?.exports?
  module.exports = LindaClient
