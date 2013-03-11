Accounts.onCreateUser(function(options, user){
  user.profile = options.profile || {};

  console.log(options);
  console.log(user);

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