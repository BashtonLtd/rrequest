EventHorizon = {}

_.extend EventHorizon,
  listeners: {}
  handlers: {}
  on: (eventName, func) ->
    self = this
    if not self.handlers[eventName]
      self.handlers[eventName] = []

    self.handlers[eventName].push func

  fire: (eventName, eventData) ->
    self = this
    _.each self.handlers[eventName], (handler) ->
      handler.call eventData

    return !! self.handlers[eventName]?.length

  _ensureListener: (eventName, listener) ->
    self = this
    if not self.listeners[eventName]
      self.listeners[eventName] = []

    self.listeners[eventName].push listener

  fireOnChange: (eventName, func) ->
    self = this

    listener = Tracker.autorun (computation) ->
      result = Tracker.isolate func

      if not computation.firstRun
        self.fire eventName, result: result

    self._ensureListener eventName, listener

  fireWhenEqual: (eventName, value, func) ->
    self = this

    listener = Tracker.autorun (computation) ->
      result = Tracker.isolate func
      if EJSON.equals result, value
        self.fire eventName

    self._ensureListener eventName, listener

  fireWhenTrue: (eventName, func) ->
    self = this
    self.fireWhenEqual eventName, true, func

  removeListeners: (eventName) ->
    self = this
    _.invoke self.listeners[eventName], 'stop'
    delete self.listeners[eventName]

  removeHandlers: (eventName) ->
    self = this
    delete self.handlers[eventName]

  removeEvent: (eventName) ->
    self = this
    self.removeListeners eventName
    self.removeHandlers eventName
