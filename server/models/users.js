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
Accounts.onCreateUser(function(options, user){
  user.profile = options.profile || {};

  if (options.email) {
    user.profile.email = options.email;
  }

  if (user.services.google) {
    user.profile.email = user.services.google.email;
  }


  if (!user.profile.name)
    user.profile.name = user.profile.email;


  // make the first logged in user an admin
  if ( !Meteor.users.find().count() ) {
    user.isAdmin = true;
    user.profile.isStaff = true;
  } else {
    user.profile.isStaff = false;
  }

  return user;
});

Meteor.methods({
  updateUser: function (options) {
    options = options || {};

    var query = '';
    if (options.userlevel == 'admin') {
      query = {"profile.name": options.name, isAdmin: true, "profile.isStaff": true};
    } else if (options.userlevel == 'staff') {
      query = {"profile.name": options.name, isAdmin: false, "profile.isStaff": true};
    } else if (options.userlevel == 'requester') {
      query = {"profile.name": options.name, isAdmin: false, "profile.isStaff": false};
    }

    return Meteor.users.update({_id: options._id},
      {$set: query}
    );
  }
});