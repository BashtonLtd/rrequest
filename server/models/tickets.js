Meteor.methods({
  createTicket: function (options) {
    options = options || {};

    return Tickets.insert({
      subject: options.subject,
      created: new Date(),
      status: options.status,
      requester: options.requester,
      group: options.group,
      replies: []
    });
  }

});