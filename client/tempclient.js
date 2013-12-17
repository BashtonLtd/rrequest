timeworked = function(groupname, start, end) {
  Meteor.call('getTotalTimeworked', {groupname: groupname, start: start, end: end}, function(error, total) {
    console.log(total + ' minutes.');
  });
}