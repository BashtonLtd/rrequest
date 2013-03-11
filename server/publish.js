Meteor.publish('currentUser', function() {
  return Meteor.users.find(this.userId);
});

Meteor.publish('allUsers', function() {
  var user = Meteor.users.findOne({_id: this.userId});
  if (user && user.isAdmin) {
    return Meteor.users.find();
  } else {
    return false;
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