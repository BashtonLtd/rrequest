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
  // register the dashboard module
  Meteor.call('registerModule', {
    name: 'dashboard',
    callback_enable: 'enable_dashboard_module',
    callback_disable: 'disable_dashboard_module',
    description: 'Displays dashboard widgets.'
  }, function(error, module_id) {
    if(!error) {

    }
  });

  var module = Modules.findOne({name: 'dashboard'});
  if (module !== undefined && module.enabled) {
    Meteor.call('enable_dashboard_module', {}, function(error, module_id) {
      if(!error) {}
    });
  }
});

Meteor.methods({
  createUserDashboard: function(args) {
    return create_userdashboard(args);
  },

  removeUserDashboard: function (args) {
    args = args || {};

    return UserDashboard.remove({_id: args.id});
  }
});

create_userdashboard = function(args) {
  args = args || {};

  return UserDashboard.insert({
    owner: args.owner,
    col: args.col,
    row: args.row,
    label: args.label,
    sizex: args.sizex,
    sizey: args.sizey,
    template: args.template,
    extradata: args.extradata
  });
};
