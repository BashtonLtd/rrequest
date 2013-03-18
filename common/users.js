is_admin_by_id=function(userId){
  var user = Meteor.users.findOne(userId);
  return user && is_admin(user);
};

is_admin=function(user){
  if(!user || typeof user === 'undefined') {
    return false;
  }
  return !!user.isAdmin;
};

is_staff_by_id=function(userId){
  var user = Meteor.users.findOne(userId);
  return user && is_staff(user);
};

is_staff=function(user){
  if(!user || typeof user == 'undefined') {
    return false;
  }
  return user.profile.isStaff;
};

in_multiple_groups=function(user) {
  if(!user || typeof user == 'undefined') {
    return false;
  }
  groups = Groups.find({members: {$in: [user._id]}});
  if (groups.count() > 1 ) {
    return true;
  } else {
    return false;
  }
};

useremail=function(requesterId) {
  var user = Meteor.users.findOne(requesterId);
  if (user !== undefined) {
    return user.profile.email;
  } else {
    return 'Unknown';
  }
};