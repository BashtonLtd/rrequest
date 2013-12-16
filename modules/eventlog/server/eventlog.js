/*
 * rrequest
 * http://www.rrequest.com/
 * (C) Copyright Bashton Ltd, 2013
 *
 * This file is part of rrequest.
 *
 * rrequest is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * rrequest is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with rrequest.  If not, see <http://www.gnu.org/licenses/>.
 *
*/
Meteor.startup(function (){
  // register the eventlog module
  Meteor.call('registerModule', {
    name: 'eventlog',
    callback_enable: 'enable_eventlog_module',
    callback_disable: 'disable_eventlog_module',
    description: 'Central logging module.'
  }, function(error, module_id) {
    if (!error) {

    }
  });

  var module = Modules.findOne({name: 'eventlog'});
  if (module !== undefined && module.enabled) {
    Meteor.call('enable_eventlog_module', {}, function(error, module_id) {
      if (!error) {}
    });
  }
});

Meteor.methods({
  createEventLog: function(args) {
    return create_event_log(args);
  }
});

create_event_log = function(args) {
  args = args || {};

  var module = Modules.findOne({name: 'eventlog'});
  if (module !== undefined && module.enabled) {
    return Eventlog.insert({
      created: new Date(),
      level: args.level,
      tags: args.tags,
      message: args.message
    });
  } else {
    console.log(new Date() + ' ['+args.level+'] ' + '[' + args.tags + '] ' + args.message);
  }
};

bound_create_event_log = Meteor.bindEnvironment(create_event_log, function(e) {
    console.log("exception! " + e);
});