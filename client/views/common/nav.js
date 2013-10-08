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
Template.nav.site_name = function() {
  site_name_setting = Settings.findOne({name: 'site_name'});
  if (site_name_setting !== undefined) {
    return site_name_setting.value;
  }
  return '';
};

Template.nav.helpers({
  navbar: function() {
    return Session.get('navbar');
  },

  is_active: function(page) {
    return Meteor.Router.page() == page;
  },

  user_visible: function(user_level) {
    var user = Meteor.user();
    if (user == null) {
      // User not logged in
      if (user_level == 'all') {
        return true;
      } else {
        return false;
      }
    } else {
      var current_user_level = 'requester';
      if (is_staff(user)) {
        if (is_admin(user)) {
          current_user_level = 'admin';
        } else {
          current_user_level = 'staff';
        }
      }
      switch (current_user_level) {
        case 'requester':
          if (user_level == 'all' || user_level == 'loggedin') {
            return true;
          } else {
            return false;
          }
        case 'staff':
          if (user_level == 'all' || user_level == 'loggedin' || user_level == 'staff') {
            return true;
          } else {
            return false;
          }
        case 'admin':
          return true;
      }
    }
  }
});

is_staff=function(user){
  if(!user || typeof user == 'undefined') {
    return false;
  }
  return user.profile.isStaff;
};

is_admin=function(user){
  if(!user || typeof user === 'undefined') {
    return false;
  }
  return !!user.isAdmin;
};
