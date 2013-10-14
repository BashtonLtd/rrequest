timeworked = function(groupname) {
  Meteor.call('getTotalTimeworked', groupname, function(error, total) {
    console.log(total + ' minutes.');
  });
}