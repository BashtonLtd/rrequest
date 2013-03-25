EventHorizon.on('ticketreply',function(){
  module_enabled = Modules.findOne({name:'email-notifier'}).enabled;
  if (module_enabled) {
    var postedBy = Meteor.users.findOne({_id: this.postedBy});
    if (postedBy !== undefined) {
      if (postedBy.profile.isStaff) {
        Meteor.call('send_ticket_updated_email', {
          ticketId: this.ticketId
        });
      }
    }

  }
});