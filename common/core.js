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
Meteor.methods({
  registerModule: function(args) {
    args = args || {};

    var module = Modules.findOne({name: args.name});
    if (module === undefined) {
      // Add module document
      Modules.insert({
        name: args.name,
        enabled: false,
        callback_enable: args.callback_enable,
        callback_disable: args.callback_disable,
        description: args.description,
        depends: args.depends,
        conflicts: args.conflicts
      });
    } else {
      // update module document
      Modules.update({name: args.name},
        {$set: {
          callback_enable: args.callback_enable,
          callback_disable: args.callback_disable,
          description: args.description,
          depends: args.depends,
          conflicts: args.conflicts
        }}
      );
    }
  },

  enableModule: function(args) {
    args = args || {};

    var module = Modules.findOne({_id: args.module_id});
    if (module !== undefined) {
      if(!module.enabled) {
        Meteor.call(module.callback_enable, {
          module_id: module._id
        }, function(error, module_id) {
          if(!error) {
            Modules.update({_id: module._id},
              {$set: {enabled: true}}
            );
          }
        });
      }
    }
  },

  disableModule: function(args) {
    args = args || {};

    var module = Modules.findOne({_id: args.module_id});
    if (module !== undefined) {
      Meteor.call(module.callback_disable, {
        module_id: module._id
      }, function(error, module_id) {
        if(!error) {
          Modules.update({_id: module._id},
            {$set: {enabled: false}}
          );
        } else {
          console.log(error);
        }
      });
    }
  },

  add_navbar_item: function(args) {
    if (this.isSimulation) {
      var nav = Session.get('navbar');
      nav = _.extend([], nav);
      nav.push({
        name: args.name,
        pageurl: '/' + args.url,
        display_name: args.title,
        user_level: args.user_level
      });
      Session.set('navbar', nav);
    }
  }
});
