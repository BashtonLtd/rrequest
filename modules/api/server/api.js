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
  // register the api module
  Meteor.call('registerModule', {
    name: 'api',
    callback_enable: 'enable_api_module',
    callback_disable: 'disable_api_module',
    description: 'Exposes collections via a http REST API.'
  }, function(error, module_id) {
    if(!error) {

    }
  });

  var settings = APISettings.findOne();
  if (settings === undefined) {
    APISettings.insert({authtoken: ''});
  }

  collectionApi = new CollectionAPI({});
  collectionApi.addCollection(Tickets, 'tickets');

  var module = Modules.findOne({name: 'api'});
  if (module.enabled) {
    collectionApi.start();
  }

});

Meteor.methods({
  enable_api_module: function(args) {
    args = args || {};

    collectionApi.start();
    Hooks.insert({
      hook: 'settings_page',
      module_id: args.module_id,
      data: 'api_settings_page'
    });

  },

  disable_api_module: function(args) {
    args = args || {};

    Hooks.remove({
      module_id: args.module_id
    });
  },

  api_settings_save: function(args) {
    args = args || {};

    APISettings.update({},
      {$set: {authtoken: args.authtoken}},
      {multi: true}
    );
  }
});
