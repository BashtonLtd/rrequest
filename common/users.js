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
