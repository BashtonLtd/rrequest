/*
 * rrequest
 * http://www.rrequest.com/
 * (C) Copyright Bashton Ltd, 2013
 *
 * This file is part of rrequest.
 *
 * rrequest is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * rrequest is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with rrequest.  If not, see <http://www.gnu.org/licenses/>.
 *
*/
Template.ticketheader.ticketfooter_items = function() {
  var hooks = Hooks.find({hook:'ticketfooter_items'});
  return hooks;
};

Template.ticketheader.ticketfooter_items_template = function () {
  return Template[this.template];
};

Template.ticketreplybox.documentId = function () {
    var user = Meteor.users.findOne({_id: Meteor.userId()});
    var user_level = 'requester';
    if (user !== undefined) {
      if(user.profile.isStaff) {
        user_level = 'staff';
      }
    }
    return Session.get('viewticketId') + '-' + user_level;
};

Template.ticketreplybox.unposted_reply = function () {
  var user = Meteor.users.findOne({_id: Meteor.userId()});
  var user_level = 'requester';
  if (user !== undefined) {
    if(user.profile.isStaff) {
      user_level = 'staff';
    }
  }
  var reply = UnpostedReplies.findOne({ticket_id: Session.get('viewticketId'), level: user_level}, {sort: {created: 1}});
  if (reply !== undefined) {
    return reply;
  } else {
    var replydata = {ticket_id: Session.get('viewticketId'), level: user_level, body:'', created: new Date().getTime()};
    if (Session.get('unpostedRepliesReady') === true) {
      var count = UnpostedReplies.find({ticket_id: Session.get('viewticketId'), level: user_level}).count();
      if (count === 0) {
        return UnpostedReplies.insert(replydata);
      }
    }
  }
};

Template.ticketreplybox.ticket_reply_button = function () {
  var hooks = Hooks.find({hook:'ticket_reply_button'});
  var buttons = [];
  var user_id = Meteor.userId();
  hooks.forEach(function (hook) {
    if(window[hook.render]({userId:user_id})) {
      buttons.push(hook);
    }
  });
  return buttons;
};

Template.ticket.sidebaritems = function() {
  var hooks = Hooks.find({hook:'ticket_sidebar'});
  return hooks;
};

Template.ticket.sidebaritems_template = function () {
  return Template[this.template];
};

Template.ticketheader.tickettopright = function(ticketId) {
  var items = [];
  var hooks = Hooks.find({hook:'tickettopright'});
  hooks.forEach(function (hook) {
    hook.ticketId = ticketId;
    items.push(hook);
  });
  return items;
};

Template.ticketheader.tickettopright_template = function () {
  return Template[this.template];
};

Template.ticketheader.tickettopright_data = function () {
  return {ticketId: this.ticketId, template: this.template};
};

UI.registerHelper('reply_header_items', function(replyId) {
  var header_items = [];
  var hooks = Hooks.find({hook:'reply_header'});
  hooks.forEach(function (hook) {
    hook.replyId = replyId;
    header_items.push(hook);
  });
  return header_items;
});

UI.registerHelper('reply_header_items_template', function() {
  return Template[this.template];
});

UI.registerHelper('reply_header_items_data', function() {
  return this;
});

UI.registerHelper('footer_items', function(replyId) {
  var footer_items = [];
  var hooks = Hooks.find({hook:'reply_footer'}, {reactive: false});
  hooks.forEach(function (hook) {
    hook.replyId = replyId;
    footer_items.push(hook);
  });
  return footer_items;
});

UI.registerHelper('footer_items_template', function() {
  return Template[this.template];
});

UI.registerHelper('footer_items_data', function() {
  return this;
});

UI.registerHelper('ticket', function() {
  var ticket = Tickets.findOne({_id: Session.get('viewticketId')}, {fields: {unpostedstaffreply: 0, unpostedrequesterreply: 0}});
  if (ticket === undefined && Session.get('viewticketId') !== null) {
    Meteor.call('getTicket', Session.get('viewticketId'), function(error, ticket) {
      if (ticket !== undefined) {
        Session.set('viewticketId', ticket._id);
        Router.go('ticket', {_id: ticket._id});
      }
    });
  }
  return ticket;
});

UI.registerHelper('getGroups', function() {
  var ticket = Tickets.findOne({_id: Session.get('viewticketId')}, {fields: {unpostedstaffreply: 0, unpostedrequesterreply: 0}});
  var groups = [];
  if (ticket.group !== null) {
    ticket.group.forEach(function (group) {
      groups.push('<a href="/group/' + group + '">'+groupname(group)+'</a>');
    });
    return groups.join(', ');
  }
  return '';
});

UI.registerHelper('displayname', function(replytype) {
  if (replytype != 'event') {
    return true;
  }
  return false;
});

UI.registerHelper('isMuted', function(replytype) {
  if (replytype == 'event') {
    return 'muted';
  }
});

Template.ticketreplybox.replyentryformfields = function(replyId) {
  var extraformfields = [];
  var ticketId = Session.get('viewticketId');
  var hooks = Hooks.find({hook:'ticket_reply_form_field'});
  hooks.forEach(function (hook) {
    hook.ticketId = ticketId;
    hook.replyId = replyId;
    extraformfields.push(hook);
  });
  return extraformfields;
};

Template.ticketreplybox.replyentryformfields_template = function () {
  return Template[this.data.template];
};

Template.ticketreplybox.replyentryformfields_data = function () {
  return {data: this};
};

Template.ticketreplybox.replyentryfooter_items = function(replyId) {
  var replyentryfooter_items = [];
  var ticket = Tickets.findOne({_id: Session.get('viewticketId')});

  if (ticket !== undefined) {
    var hooks = Hooks.find({hook:'replyentry_footer'});
    hooks.forEach(function (hook) {
      hook.ticketId = Session.get('viewticketId');
      hook.replyId = replyId;
      hook.groups = ticket.group;
      hook.requester = Meteor.userId();
      replyentryfooter_items.push(hook);
    });
  }
  return replyentryfooter_items;
};

Template.ticketreplybox.replyentryfooter_items_template = function () {
  return Template[this.template];
};

Template.ticketreplybox.replyentryfooter_items_data = function () {
  return this;
};

var displayreply = function(replytype) {
  var user = Meteor.users.findOne({_id: Meteor.userId()});
  if(user.profile.isStaff) {
    return true;
  } else {
    if (replytype == 'reply' || replytype == 'event') {
      return true;
    }
  }
  return false;
};

Template.ticketreplies.posted_replies = function () {
  var user = Meteor.users.findOne({_id: Meteor.userId()});
  var ticket = Tickets.findOne({_id: Session.get('viewticketId')}, {fields: {unpostedstaffreply: 0, unpostedrequesterreply: 0}});
  if (ticket !== undefined) {
    var replies = [];
    ticket.replies.forEach(function(reply){
      if(reply !== undefined) {
        if(reply.status == 'posted') {
          reply.body = marked(reply.body);
          reply.ticketId = ticket._id;
          replies.push(reply);
        }
      }
    });

    // Fetch replies from modules
    var hooks = Hooks.find({hook:'ticket_replies'});
    hooks.forEach(function (hook) {
      var ticketreplies = window[hook.data]({ticketId: Session.get('viewticketId')});
      ticketreplies.forEach(function(ticketreply) {
        ticketreply.body = marked(ticketreply.body);
        ticketreply.ticketId = ticket._id;
        replies.push(ticketreply);
      });
    });

    // Sort array into date order
    replies.sort(sortByDate);
    return replies;
  }
};

Template.ticketreplies.posted_reply_template = function () {
  return Template['ticketreply-'+this.reply.type];
};

Template.ticketreplies.posted_reply_data = function () {
  return {reply: this};
};

Template.ticketheader.ticketcreated = function () {
  var ticket = Tickets.findOne({_id: Session.get('viewticketId')}, {fields: {unpostedstaffreply: 0, unpostedrequesterreply: 0}});
  if (ticket !== undefined) {
    return ticket.created;
  }
};

Template.ticket.created = function () {
  Session.set('lastkeypresswasspace', false);
};

Template.ticket.events({
    'keyup #ticketreply-editor': function (event, template) {
        if (this.triggered === undefined) {
            EventHorizon.fire('typingticketreply',{
                ticketId: Session.get('viewticketId'),
                postedBy: Meteor.userId()
            });
            this.triggered = true;
        }
    },

  'click .post-reply': function (event, template) {
    var ticket = Tickets.findOne({_id: Session.get('viewticketId')});
    var original_status = ticket.status;
    var replyId = template.find(".ticketreplyId").value;
    var level = template.find(".ticketreplylevel").value;
    var body = template.find("#ticketreply-editor").value;

    if (body.trim() !== '') {
      var extras = $('#ticketreplyextrafields').serializeArray();
      var extrafields = [];
      $.each(extras, function() {
        extrafields.push({name: this.name, value: this.value || ''});
      });

      var args = {
        ticketId: Session.get('viewticketId'),
        replyId: replyId,
        userId: Meteor.userId(),
        level: level,
        replyfields: [
          {name: 'type', value: 'reply'},
          {name: 'body', value: body},
          {name: 'status', value: 'posted'}
        ]
      };
      args.replyfields = args.replyfields.concat(extrafields);

      Meteor.clearTimeout(Session.get('replytimerid'));

      // clear document
      var user = Meteor.users.findOne({_id: Meteor.userId()});
      var user_level = 'requester';
      if (user !== undefined) {
        if(user.profile.isStaff) {
          user_level = 'staff';
        }
      }
      sharejs.open(
          Session.get('viewticketId') + '-' + user_level,
          'text',
          {origin: '//' + window.location.host + '/channel', authentication: Meteor.userId()},
          function (error, doc) {
              if (error) {
                  return
              }
              doc.del(0, body.length);
              doc.close();
          }
      )

      template.find("#ticketreply-editor").value = '';
      promote_ticket_reply(args);

      EventHorizon.fire('ticketreply',{
        ticketId: Session.get('viewticketId'),
        replyId: replyId,
        postedBy: Meteor.userId()
      });

      $("#ticketreplyextrafields input").not(':button, :submit, :reset, :hidden').val('');
    }
  },

  'click .clearreply': function (event, template) {
      var user = Meteor.users.findOne({_id: Meteor.userId()});
      var user_level = 'requester';
      if (user !== undefined) {
        if(user.profile.isStaff) {
          user_level = 'staff';
        }
      }
      var body = template.find("#ticketreply-editor").value;
      sharejs.open(
        Session.get('viewticketId') + '-' + user_level,
        'text',
        {origin: '//' + window.location.host + '/channel', authentication: Meteor.userId()},
        function (error, doc) {
          if (error) {
            return
          }
          doc.del(0, body.length);
          doc.close();
        }
      )
      template.find("#ticketreply-editor").value = '';
  },

  'click .edit-ticket': function () {
    openEditTicketDialog();
  }
});

var promote_ticket_reply = function(options) {
  // Create reply in ticket
  var now = new Date();
  var modifier = {$set: {}, $unset: {}, $push: {}};

  if (!is_staff_by_id(options.userId)) {
    modifier.$set['status'] = 'new';
  }
  modifier.$set["modified"] = now;
  // This should be in the autoclose module, can't use the ticket reply event as that is client side
  modifier.$unset["close_warning"] = "";

  var replydata = {};
  for (var i = 0, l = _.size(options.replyfields); i < l; i++) {
    replydata[options.replyfields[i].name] = options.replyfields[i].value;
  }

  var ticket = Tickets.findOne({_id: options.ticketId});

  if (options.userId !== undefined) {
    replydata._id = options.replyId;
    replydata.posted_by = options.userId;
    replydata.level = options.level;
    replydata.created = now;
    replydata.notified = false;
    if (!is_staff_by_id(options.userId)) {
      var addToRequesters = true;
      ticket.requesters.forEach(function(requester) {
        if (requester.id !== undefined) {
          if (requester.id == options.userId) {
            addToRequesters = false;
          }
        } else {
          if (requester == options.userId) {
            addToRequesters = false;
          }
        }

      });
      if (addToRequesters === true) {
        add_ticket_requesters(options.ticketId, options.userId);
      }
    }
  }
  modifier.$push['replies'] = replydata;

  var log_email = useremail(options.userId);
  var log_subject = ticket.subject;
  var log_ticket_url = Meteor.absoluteUrl('ticket/' + ticket._id, {secure: true});

  Meteor.call('createEventLog',{
    level:'INFO',
    tags:['replycreated'],
    message: log_email + ' replied to ' + log_subject + ' ' + log_ticket_url
  }, function(error, result){});

  UnpostedReplies.remove({_id: options.replyId});

  return Tickets.update(
    {_id: options.ticketId},
    modifier
  );
};

var update_ticket_unpostedreply = function(options) {
  var modifier = {$set: {}};

  for (var i = 0, l = _.size(options.replyfields); i < l; i++) {
    modifier.$set[options.replyfields[i].name] = options.replyfields[i].value;
  }

  if (options.userId !== undefined) {
    modifier.$set["posted_by"] = options.userId;
    modifier.$set["level"] = options.level;
  }

  return UnpostedReplies.update(
    {_id: options.replyId},
    modifier
  );
};

var add_ticket_requesters = function(ticketId, requesterId) {
  var user = Meteor.users.findOne({_id:requesterId});
  if (user !== undefined) {
    return Tickets.update(
      {_id:ticketId},
      {
        $push: {requesters: {id:requesterId, email:user.profile.email}}
      }
    );
  }
};
