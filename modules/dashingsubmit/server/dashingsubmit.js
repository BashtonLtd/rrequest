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
var http = Npm.require('http');
var module;
var handles = [];

Meteor.startup(function() {
    // register the dashing submit module
    Meteor.call('registerModule', {
        name: 'dashingsubmit',
        callback_enable: 'enable_dashingsubmit_module',
        callback_disable: 'disable_dashingsubmit_module',
        description: 'Submits ticket state counts to dashing.',
        depends: []
    }, function(error, module_id) {
        if (!error) {

        }
    });

    var settings = DashingSubmitSettings.findOne();
    if (settings === undefined) {
        DashingSubmitSettings.insert({
            auth_token: '',
            host: '',
            port: '',
            path: ''
        });
    }   

    module = Modules.findOne({name: 'dashingsubmit'});

    if (module.enabled) {
      start_submitting();
    }
});

var submit_count = function(state, count) {
  var settings = DashingSubmitSettings.findOne();
  var post_data = '{"auth_token":"'+settings.auth_token+'","current":' + count + '}';
  var options = {
    host: settings.host,
    port: settings.port,
    path: settings.path + state.replace(new RegExp(' ', 'g'), '_'),
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': post_data.length
    }
  };

  try {
    var req = http.request(options, function(res) {
      res.setEncoding('utf8');
    });
    req.write(post_data);
    req.end();
  } catch (e) {
    bound_create_event_log({level:'ERROR', tags:['dashingsubmit'], message:'Failed to submit dashing stats.'});
  }
};

var start_submitting = function() {
  var status = TicketStatus.find({});
  
  status.forEach(function(state) {
    var count = 0;
    var initializing = true;
    var handle = Tickets.find({status: state.name, isVisible: {$ne: false}}, {fields: {_id: 1, status: 1}}).observeChanges({
      added: function (id) {
        count++;
        if (!initializing) {
          submit_count(state.name, count);
        }
      },
      removed: function (id) {
        count--;
        submit_count(state.name, count);
      }
    });
    initializing = false;
    handles.push({name: state.name, handle: handle});
  });
};

Meteor.methods({
    enable_dashingsubmit_module: function(args) {
        args = args || {};

        Hooks.insert({
            hook: 'settings_page',
            module_id: args.module_id,
            data: 'dashingsubmit_settings_page'
        });

        start_submitting();

    },

    disable_dashingsubmit_module: function(args) {
        args = args || {};

        Hooks.remove({
            module_id: args.module_id
        });
        handles.forEach(function(handle) {
            try {
                handle.handle.stop();
            } catch(error) {
                
            }
        })
    },

    updateDashingSubmitSettings: function(args) {
    args = args || {};

    DashingSubmitSettings.update({},
      {$set: {
        auth_token: args.auth_token,
        host: args.host,
        port: args.port,
        path: args.path
      }},
      {multi: true}
    );
  }
});