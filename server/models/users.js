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
Accounts.validateNewUser(function (user) {
  var existing_user = Meteor.users.findOne({'profile.email':user.profile.email});
  if (existing_user !== undefined) {
    throw new Meteor.Error(403, "Email address already in use");
  }
  return true;
});

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
    user.isAdmin = false;
    user.profile.isStaff = false;
  }

  if (options.profile && options.profile.email) {
    // Check for existing user
    var existing_user = Meteor.users.findOne({'profile.email':options.profile.email});
    if (existing_user !== undefined) {
      // User with email address already exist
      user.profile.isStaff = existing_user.profile.isStaff;
      user.isAdmin = existing_user.isAdmin;
      user._id = existing_user._id;
      user.services = _.extend(existing_user.services, user.services);
      Meteor.users.remove({_id:existing_user._id});
    }
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
  },

  createAutoUser: function (email_address) {
    return createAutoUser(email_address);
  } 
});

createAutoUser = function (email_address) {
  user = Accounts.createUser({
    username: email_address,
    email: email_address,
    profile: {email: email_address, name: email_address, isStaff: false}
  });
  Accounts.sendEnrollmentEmail(user);
  return user;
};
