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
Meteor.publish('currentUser', function() {
  return Meteor.users.find(this.userId);
});

Meteor.publish('allUsers', function() {
  var user = Meteor.users.findOne({_id: this.userId});
  if (user && user.isAdmin) {
    return Meteor.users.find();
  } else {
    var usergroups = Groups.find({members: {$in: [this.userId]}});
    var groupids = [];
    var userids = [];
    usergroups.forEach(function(group){
      groupids.push(group._id);
      group.members.forEach(function(groupuser){
        userids.push(groupuser);
      });
    });
    return Meteor.users.find({$or: [{"profile.isStaff": true}, {_id: {$in: userids}}]}, {fields: {
      secret_id: false,
      isAdmin: false,
      emails: false,
      notifications: false,
      'services.password': false,
      'services.resume': false,
      'services.google.accessToken': false,
      'services.google.expiresAt': false,
      'services.google.family_name': false,
      'services.google.gender': false,
      'services.google.given_name': false,
      'services.google.id': false,
      'services.google.locale': false,
      'services.google.verified_email': false
    }});
  }

});

Meteor.startup(function(){
  Meteor.users.allow({
    insert: function(userId, doc) {
      return true;
    },
    update: function(userId, docs, fieldNames, modifier) {
      return _.all(docs, function (doc) {
        if (is_admin_by_id(userId)) {
          return true;
        }
        return false;
      });
    },
    remove: function (userId, docs) {
      return ! _.any(docs, function (doc) {
        if (is_admin_by_id(userId)) {
          return true;
        }
        return false;
      });
    }
  });
});

Meteor.publish('singleTicket', function(id) {
  var user = Meteor.users.findOne({_id: this.userId});
  var usergroups = Groups.find({members: {$in: [this.userId]}});
  var groupids = [];
  usergroups.forEach(function(group){
    groupids.push(group._id);
  });
  if (user && user.profile.isStaff) {
    return Tickets.find({_id: id, isVisible: {$ne: false}});
  } else {
    return Tickets.find({_id: id, isVisible: {$ne: false}, $or: [{group: {$in: groupids}}, {'requesters.id': {$in: [this.userId]}}]});
  }
});

Meteor.publish('sortedTickets', function(sort, filter, limit) {
  var user = Meteor.users.findOne({_id: this.userId});
  var usergroups = Groups.find({members: {$in: [this.userId]}});
  var groupids = [];
  usergroups.forEach(function(group){
    groupids.push(group._id);
  });
  if (user !== undefined) {
    if (user.profile.isStaff) {
      filter.isVisible = {$ne: false};
      return Tickets.find(filter, {sort: sort, limit: limit});
    } else {
      var newfilter = {
        isVisible: {$ne: false},
        status: filter.status,
        $and: [
          {$or: [
            {group: {$in: groupids}},
            {'requesters.id': {$in: [this.userId]}}
          ]},
          {$or: filter['$or']}
        ]
      }
      return Tickets.find(newfilter, {sort: sort, limit:limit});
    }
  }
});

Meteor.publish("counts-by-ticketstate", function (state) {
  var self = this;
  var count = 0;
  var initializing = true;
  var handle = Tickets.find({status: state, isVisible: {$ne: false}}, {fields: {_id: 1, status: 1}}).observeChanges({
    added: function (id) {
      count++;
      if (!initializing)
        self.changed("ticketstatecounts", state, {count: count});
    },
    removed: function (id) {
      count--;
      self.changed("ticketstatecounts", state, {count: count});
    }
  });

  initializing = false;
  self.added("ticketstatecounts", state, {count: count});
  self.ready();

  self.onStop(function () {
    handle.stop();
  });
});


//TODO: set permissions for tickets
Meteor.startup(function(){
  Tickets.allow({
    insert: function(userId, doc) {
      return true;
    },
    update: function(userId, docs, fieldNames, modifier) {
      return true;
    },
    remove: function(userId, docs) {
      return true;
    }
  });
});

Meteor.publish('ticketstatus', function() {
  return TicketStatus.find();
});

Meteor.startup(function(){
  TicketStatus.allow({
    insert: function(userId, doc) {
      if (is_staff_by_id(userId)) {
        return true;
      } else {
        return false;
      }
    },
    update: function(userId, docs, fieldNames, modifier) {
      if (is_staff_by_id(userId)) {
        return true;
      } else {
        return false;
      }
    },
    remove: function(userId, docs) {
      if (is_staff_by_id(userId)) {
        return true;
      } else {
        return false;
      }
    }
  });
});


//TODO: set publish and permissions for groups
Meteor.publish('groups', function() {
  return Groups.find();
});

Meteor.startup(function(){
  Groups.allow({
    insert: function(userId, doc) {
      return true;
    },
    update: function(userId, docs, fieldNames, modifier) {
      return true;
    },
    remove: function(userId, docs) {
      return true;
    }
  });
});

//TODO: set publish and permissions for hooks
Meteor.publish('hooks', function() {
  return Hooks.find();
});

Meteor.startup(function(){
  Hooks.allow({
    insert: function(userId, doc) {
      return true;
    },
    update: function(userId, docs, fieldNames, modifier) {
      return true;
    },
    remove: function(userId, docs) {
      return true;
    }
  });
});

//TODO: set publish and permissions for modules
Meteor.publish('modules', function() {
  return Modules.find();
});

Meteor.startup(function(){
  Modules.allow({
    insert: function(userId, doc) {
      return true;
    },
    update: function(userId, docs, fieldNames, modifier) {
      return true;
    },
    remove: function(userId, docs) {
      return true;
    }
  });
});
