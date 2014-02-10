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
Meteor.publish('eventlog', function(sort, filter, limit) {
  var user = Meteor.users.findOne({_id: this.userId});
  if (user && user.profile.isStaff) {
    return Eventlog.find(filter, {sort: sort, limit: limit});
  }
});

Meteor.startup(function(){
  Eventlog.allow({
    insert: function(userId, doc) {
      if (doc.owner == userId) {
        return true;
      }
      return false;
    },
    update: function(userId, doc, fieldNames, modifier) {
      if (userId !== doc.owner)
        return false; // not the owner
      return true;
    },
    remove: function(userId, docs) {
      return ! _.any(docs, function (doc) {
        if (doc.owner == userId) {
          return true;
        }
        return false;
      });
    }
  });
});

Meteor.publish('eventlogsettings', function() {
  var user = Meteor.users.findOne({_id: this.userId});
  if (user && user.profile.isStaff) {
    return EventlogSettings.find();
  }
});

Meteor.startup(function(){
  EventlogSettings.allow({
    insert: function(userId, doc) {
      if (is_staff_by_id(userId)) {
        return true;
      }
      return false;
    },
    update: function(userId, doc, fieldNames, modifier) {
      if (is_staff_by_id(userId)) {
        return true;
      }
      return false;
    },
    remove: function(userId, docs) {
      if (is_staff_by_id(userId)) {
        return true;
      }
      return false;
    }
  });
});