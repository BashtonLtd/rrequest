Meteor.publish('apisettings', function() {
  var user = Meteor.users.findOne({_id: this.userId});

  if (user && user.profile.isStaff) {
    return APISettings.find();
  }
});

Meteor.startup(function(){
  APISettings.allow({
    insert: function(userId, doc) {
      if (is_staff_by_id(userId)) {
        return true;
      }
      return false;
    },
    update: function(userId, docs, fieldNames, modifier) {
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