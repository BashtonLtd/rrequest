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

Meteor.publish('tickets', function() {
  var user = Meteor.users.findOne({_id: this.userId});
  var usergroups = Groups.find({members: {$in: [this.userId]}});
  var groupids = [];
  usergroups.forEach(function(group){
    groupids.push(group._id);
  });
  if (user && user.profile.isStaff) {
    return Tickets.find();
  } else {
    return Tickets.find({$or: [{group: {$in: groupids}}, {requester: this.userId}]});
  }
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