Meteor.methods({
  createGroup: function (options) {
    options = options || {};

    return Groups.insert({
      name: options.name,
      members: []
    });
  },

  updateGroup: function (options) {
    options = options || {};

    return Groups.update({_id: options._id},
      {$set: {name: options.name}}
    );
  }
});