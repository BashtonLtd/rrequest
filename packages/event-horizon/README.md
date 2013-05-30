meteor-event-horizon
====================

A basic reactive event system for Meteor.  I've found that I often want to have one or more callbacks run when the application's reactive state reaches a particular point (such as logged in).  This framework allows you to do that with a (hopefully) simple event system.  You can fire an event when a function's return value changes with `EventHorizon.fireOnChange`, when it becomes true (`EventHorizon.fireWhenTrue`) or equal to a particular EJSON value (`EventHorizon.fireWhenEqual`), or manually with `EventHorizon.fire`.  You can then set up one or more event handler functions with `EventHorizon.on`.  Here is some example usage:

```javascript
EventHorizon.fireWhenTrue('loggedIn',function(){
  return Meteor.userId() !== null;
});

EventHorizon.on('loggedIn',function(){
  console.log('The user just logged in.');
});

EventHorizon.on('loggedIn',function(){
  console.log('This function will also run when the event is fired.');
});

// Session.truthTester(key) returns a function that returns Session.isTrue(key).
// Those helpers are defined in the session-extras library.
EventHorizon.fireWhenTrue('loadedFacebook',Session.truthTester('loadedFacebook'));

EventHorizon.on('loadedFacebook',function(){
  $('.modal.facebook-dialog').open();
});

EventHorizon.fire('manual-event');

EventHorizon.on('manual-event',function(){
  console.log('Events can also be triggered manually');
});

// the event name is not directly tied to the Session key, just
EventHorizon.fireOnChange('change',Session.getter('changeMe'));

EventHorizon.on('change',function(){
  // the return value of the trigger function is made available in this.result for fireOnChange.
  console.log('new value of Session.get("changeMe"): '+this.result);
});

// will fire the 'change' event since we're changing the value here.
Session.set('changeMe','could you spare some change?');

// you can also fire events manually with data:
EventHorizon.fire('change',{result: 'change that you can believe in'});
```

The triggers and handlers for a particular event can all be stopped by running `EventHorizon.removeEvent(eventName)`. \

__NOTE:__ currently, if you remove an event from inside a handler for that event, then you must have run `EventHorizon.fireWhenTrue` or `EventHorizon.fireWhenEqual` __before__ `EventHorizon.on` for that event; otherwise the event will not be properly removed.

This library works well with the [session-extras](https://github.com/belisarius222/meteor-session-extras) library, which provides some closures like `Session.getter` that are useful for associating changes to Session variables with events.
