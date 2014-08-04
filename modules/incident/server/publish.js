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
Meteor.publish('incidents', function(sort, filter, limit) {
    var user = Meteor.users.findOne({_id: this.userId});
    var usergroups = Groups.find({members: {$in: [this.userId]}});
    var groupids = [];
    usergroups.forEach(function(group){
        groupids.push(group._id);
    });
    if (user && user.profile.isStaff) {
        return Incidents.find(filter, {sort: sort, limit: limit});
    } else {
        if (filter['$or'] !== undefined) {
            var newfilter = {
                $and: [
                    {group: {$in: groupids}},
                    {$or: filter['$or']}
                ]
            };
        } else {
            var newfilter = {group: {$in: groupids}}
        }
        return Incidents.find(newfilter, {sort: sort, limit: limit});
    }
});

Meteor.publish('singleIncident', function(id) {
    var user = Meteor.users.findOne({_id: this.userId});
    var usergroups = Groups.find({members: {$in: [this.userId]}});
    var groupids = [];
    usergroups.forEach(function(group){
        groupids.push(group._id);
    });
    if (user && user.profile.isStaff) {
        return Incidents.find({_id: id});
    } else {
        return Incidents.find({_id: id, group: {$in: groupids}});
    }
});

Meteor.startup(function(){
  Incidents.allow({
    insert: function(userId, doc) {
      if (doc.owner == userId) {
        return true;
      }
      return false;
    },
    update: function(userId, doc, fieldNames, modifier) {
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

Meteor.publish('incidentsettings', function() {
  var user = Meteor.users.findOne({_id: this.userId});
  if (user && user.profile.isStaff) {
    return IncidentSettings.find();
  }
});

Meteor.startup(function(){
  IncidentSettings.allow({
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