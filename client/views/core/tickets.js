Template.ticketlist.tickets = function () {
  return Tickets.find({}, {sort: {'replies.created': -1}});
};

Template.tickets.showCreateTicketDialog = function () {
 return Session.get("showCreateTicketDialog");
};

Template.tickets.events({
 'click .new-ticket': function (evt) {
    openCreateTicketDialog();
  }
});

var openCreateTicketDialog = function () {
  Session.set('currentScroll',$('body').scrollTop());
  Session.set("showCreateTicketDialog", true);
};

Template.createTicketDialog.created = function () {
  Session.set('ticketRequesterSearchTerm', "");
};

Template.createTicketDialog.rendered = function () {
  selectedrequester = this.find(".ticketrequester").value;
  Session.set('selectedRequester', selectedrequester);
};

Template.createTicketDialog.events({
  'click .save': function (event, template) {
    var subject = template.find(".subject").value;
    var requester = template.find(".ticketrequester").value;
    var group = template.find(".ticketgroup").value;

    Meteor.call('createTicket', {
      subject: subject,
      requester: requester,
      group: group,
      status: 'creating'
    }, function (error, ticket_id) {
      if (! error) {
        Meteor.Router.to('/ticket/'+ticket_id);
      }
    });
    Session.set("showCreateTicketDialog", false);
  },

  'click .cancel': function () {
    Session.set("showCreateTicketDialog", false);
  },

  'input .ticketrequestersearch': function (event, template) {
    var searchterm = template.find(".ticketrequestersearch").value;
    Session.set('ticketRequesterSearchTerm', searchterm);
  }
});

Template.createTicketDialog.ticketRequesters = function () {
  var searchterm = Session.get("ticketRequesterSearchTerm");
  return Meteor.users.find({$and: [{"profile.name": {$regex: ".*"+ searchterm +".*", $options: 'i'}}, {"profile.isStaff": false}]});

};

Template.createTicketDialog.ticketRequesterGroups = function () {
  return Groups.find({members: Session.get("selectedRequester")});
};

Template.ticketlist.helpers({
  requester_email: function () {
    var ticket = Tickets.findOne({_id:this._id});
    var user = Meteor.users.findOne({_id:ticket.requester});
    if (user !== undefined) {
      return user.profile.email;
    }
  },

  age: function(time){
    return moment(time).fromNow();
  },

  ticketstatus: function(){
    var ticket = Tickets.findOne({_id:this._id});
    if (ticket !== undefined) {
      return ticket.status;
    }
  },

  ticketready: function(){
    var ticket = Tickets.findOne({_id:this._id});
    if (ticket !== undefined) {
      if (ticket.status == 'creating') {
        return false;
      } else {
        return true;
      }
    }
  }
});