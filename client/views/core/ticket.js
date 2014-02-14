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
Handlebars.registerHelper('ticketfooter_items', function() {
  var footer_items = [];
  var hooks = Hooks.find({hook:'ticketfooter_items'});
  hooks.forEach(function (hook) {
    footer_items.push({template: Template[hook.template]()});
  });
  return footer_items;
});

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
    if (Session.get('unpostedRepliesReady') == true) {
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
  var sidebar_items = [];
  var hooks = Hooks.find({hook:'ticket_sidebar'});
  hooks.forEach(function (hook) {
    sidebar_items.push({template: Template[hook.template]()});
  });
  return sidebar_items;
};

Handlebars.registerHelper('tickettopright', function(ticketId) {
  var items = [];
  var hooks = Hooks.find({hook:'tickettopright'});
  hooks.forEach(function (hook) {
    items.push({template: Template[hook.template]({ticketId:ticketId})});
  });
  return items;
});

Handlebars.registerHelper('reply_header_items', function(replyId) {
  var header_items = [];
  var hooks = Hooks.find({hook:'reply_header'});
  hooks.forEach(function (hook) {
    header_items.push({template: Template[hook.template]({replyId:replyId})});
  });
  return header_items;
});

Handlebars.registerHelper('footer_items', function(replyId) {
  var footer_items = [];
  var hooks = Hooks.find({hook:'reply_footer'}, {reactive: false});
  hooks.forEach(function (hook) {
    footer_items.push({template: Template[hook.template]({replyId:replyId})});
  });
  return footer_items;
});

Handlebars.registerHelper('ticket', function() {
  var ticket = Tickets.findOne({_id: Session.get('viewticketId')}, {fields: {unpostedstaffreply: 0, unpostedrequesterreply: 0}});
  if (ticket === undefined && Session.get('viewticketId') != null) {
    Meteor.call('getTicket', Session.get('viewticketId'), function(error, ticket) {
      if (ticket !== undefined) {
        Session.set('viewticketId', ticket._id);
        Meteor.Router.to('/ticket/'+ticket._id);
      }
    });
  }
  return ticket;
});

Handlebars.registerHelper('getGroups', function() {
  var ticket = Tickets.findOne({_id: Session.get('viewticketId')}, {fields: {unpostedstaffreply: 0, unpostedrequesterreply: 0}});
  var groups = [];
  if (ticket.group !== null) {
    ticket.group.forEach(function (group) {
      groups.push(groupname(group));
    });
    return groups.join(', ');
  }
  return '';
});

Handlebars.registerHelper('displayreply', function(replytype) {
  var user = Meteor.users.findOne({_id: Meteor.userId()});
  if(user.profile.isStaff) {
    return true;
  } else {
    if (replytype == 'reply' || replytype == 'event') {
      return true;
    }
  }
  return false;
});

Handlebars.registerHelper('displayname', function(replytype) {
  if (replytype != 'event') {
    return true;
  }
  return false;
});

Handlebars.registerHelper('isMuted', function(replytype) {
  if (replytype == 'event') {
    return 'muted';
  }
});

Template.ticketreplybox.replyentryformfields = function(replyId) {
  var extraformfields = [];
  var hooks = Hooks.find({hook:'ticket_reply_form_field'});
  hooks.forEach(function (hook) {
    extraformfields.push({
      template: Template[hook.template]({
        ticketId: Session.get('viewticketId'),
        replyId:replyId
      })
    });
  });
  return extraformfields;
};

Template.ticketreplybox.replyentryfooter_items = function(replyId) {
  var replyentryfooter_items = [];
  var ticket = Tickets.findOne({_id: Session.get('viewticketId')});

  if (ticket !== undefined) {
    var hooks = Hooks.find({hook:'replyentry_footer'});
    hooks.forEach(function (hook) {
      replyentryfooter_items.push({
        template: Template[hook.template]({
          ticketId: Session.get('viewticketId'),
          replyId:replyId,
          groups:ticket.group,
          requester:Meteor.userId()
        })
      });
    });
  }
  return replyentryfooter_items;
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
          reply.template = Template["ticketreply-"+reply.type]({reply:reply});
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
        ticketreply.template = Template["ticketreply-"+ticketreply.type]({reply:ticketreply});
        replies.push(ticketreply);
      });
    });

    // Sort array into date order
    replies.sort(sortByDate);
    return replies;
  }
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
  'keyup .ticketreplybody': function (event, template) {
    if (this.count === undefined) {
      this.count = 5;
    }

    var replyId = template.find(".ticketreplyId").value;
    var level = template.find(".ticketreplylevel").value;
    var body = template.find(".ticketreplybody").value;

    // KeyCodes:
    // 32 - Space
    // 13 - Return
    // 190 - Fullstop
    if (event.keyCode == 32 || event.keyCode == 13 || event.keyCode == 190) {
      //space, return or fullstop  pressed
      if (Session.get('lastkeypresswasspace')) {

      } else {
        if (this.count > 4) {

          // remove save timer here
          Meteor.clearTimeout(this.timer);
          // Save reply
          update_ticket_unpostedreply({
            ticketId: Session.get('viewticketId'),
            replyId: replyId,
            userId: Meteor.userId(),
            level: level,
            replyfields: [
              {name: 'body', value: body},
              {name: 'status', value: 'unposted'}
            ]
          });

          EventHorizon.fire('typingticketreply',{
            ticketId: Session.get('viewticketId'),
            postedBy: Meteor.userId()
          });

          Session.set('lastkeypresswasspace', true);
          this.count = 0;
        } else {
          if (event.keyCode == 13) {
            // if return is pressed save now
            Meteor.clearTimeout(this.timer);
            update_ticket_unpostedreply({
              ticketId: Session.get('viewticketId'),
              replyId: replyId,
              userId: Meteor.userId(),
              level: level,
              replyfields: [
                {name: 'body', value: body},
                {name: 'status', value: 'unposted'}
              ]
            });
            Session.set('lastkeypresswasspace', true);
            this.count = 0;
          } else {
            // start timer here to save, if timer already exists remove it
            Meteor.clearTimeout(this.timer);
            this.timer = Meteor.setTimeout(function() {
              update_ticket_unpostedreply({
                ticketId: Session.get('viewticketId'),
                replyId: replyId,
                userId: Meteor.userId(),
                level: level,
                replyfields: [
                  {name: 'body', value: body},
                  {name: 'status', value: 'unposted'}
                ]
              })
            }, 5000);
            Session.set('replytimerid', this.timer);
            this.count += 1;
          }
        }
      }
    } else {
      Session.set('lastkeypresswasspace', false);
    }
  },

  'click .post-reply': function (event, template) {
    var ticket = Tickets.findOne({_id: Session.get('viewticketId')});
    var original_status = ticket.status;
    var replyId = template.find(".ticketreplyId").value;
    var level = template.find(".ticketreplylevel").value;
    var body = template.find(".ticketreplybody").value;

    if (body.trim() != '') {
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
      promote_ticket_reply(args);

      EventHorizon.fire('ticketreply',{
        ticketId: Session.get('viewticketId'),
        replyId: replyId,
        postedBy: Meteor.userId()
      });

      $("#ticketreplyextrafields input").not(':button, :submit, :reset, :hidden').val('');
      template.find(".ticketreplybody").value = '';
    }
  },

  'click .clearreply': function (event, template) {
    var replyId = template.find(".ticketreplyId").value;
    var level = template.find(".ticketreplylevel").value;
    var body = template.find(".ticketreplybody").value;

    if (body.trim() != '') {
      template.find(".ticketreplybody").value = '';

      var args = {
        ticketId: Session.get('viewticketId'),
        replyId: replyId,
        userId: Meteor.userId(),
        level: level,
        replyfields: [
          {name: 'type', value: 'reply'},
          {name: 'body', value: ''},
          {name: 'status', value: 'unposted'}
        ]
      };
      update_ticket_unpostedreply(args);
    }
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
  };

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
        if (requester == options.userId) {
          addToRequesters = false;
        }
      })
      if (addToRequesters == true) {
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
  });

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
  };

  if (options.userId !== undefined) {
    modifier.$set["posted_by"] = options.userId;
    modifier.$set["level"] = options.level;
  }

  return UnpostedReplies.update(
    {_id: options.replyId},
    modifier
  );
}

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
}

var openEditTicketDialog = function () {
  Session.set('currentScroll',$(document).scrollTop());
  Session.set("showEditTicketDialog", true);
};

Template.ticket.showEditTicketDialog = function () {
 return Session.get("showEditTicketDialog");
};

Template.editTicketDialog.ticketstatus = function() {
  return TicketStatus.find({}, {sort: {'name': 1}});
};

Template.editTicketDialog.rendered = function () {
  $(".ticketrequester").select2({
    placeholder: 'Select requesters',
    data: get_requesters,
    multiple: true,
    tokenSeparators: [" "],

    createSearchChoice:function(term, data) {
      if ($(data).filter(function() {
        return this.text.localeCompare(term) === 0;
      }).length === 0) {
        return {id:term, text: term, isNew: true};
      }
    },

    formatResult: function(term) {
      if (term.isNew) {
        return '<span class="label label-important">New</span> ' + term.text;
      } else {
        return term.text;
      }
    } 
  });
  
  $(".ticketgroup").select2({
    placeholder: 'Select groups',
    data: get_groups,
    multiple: true
  });
  
  var ticket = Tickets.findOne({_id:Session.get('viewticketId')}, {fields: {requesters: 1, group: 1}});
  $(".ticketrequester").val(_.pluck(ticket.requesters, 'id')).trigger('change');
  $(".ticketgroup").val(ticket.group, 'id').trigger('change');
};

get_requesters = function (query_opts) {
  var users = Meteor.users.find({"profile.isStaff": false});
  var requesters = [];
  users.forEach(function (user) {
    requesters.push({id:user._id, text:user.profile.email});
  });
  return {results: requesters};
};

var get_groups = function (query_opts) {
  var user = Meteor.users.findOne({_id:Meteor.userId()});
  var requesters = $(".ticketrequester").select2('val');
  var grouplist = Groups.find({members: {$in: requesters}});
  if (grouplist.count() < 1 && is_staff(user)) {
    grouplist = Groups.find({}, {sort: {'name': 1}});
  }
  var groups = [];
  grouplist.forEach(function (group) {
    groups.push({id:group._id, text:group.name});
  });
  return {results: groups};
};

Template.editTicketDialog.helpers({
  selectedstatus: function(statusname){
    var ticket = Tickets.findOne({_id:Session.get('viewticketId')}, {fields: {status: 1}});
    if (ticket !== undefined) {
      if (ticket.status == statusname) {
        return 'selected';
      }
    }
  }
});

Template.editTicketDialog.ticketeditformfields = function() {
  var extraformfields = [];
  var hooks = Hooks.find({hook:'ticket_edit_form_field'});
  hooks.forEach(function (hook) {
    extraformfields.push({
      template: Template[hook.template]
    });
  });
  return extraformfields;
};

Template.editTicketDialog.events({
  'click .cancel': function () {
    Session.set("showEditTicketDialog", false);
  },

  'click .save': function (event, template) {
    var subject = template.find(".subject").value;
    var requesters = $(".ticketrequester").select2('val');
    var groups = $(".ticketgroup").select2('val');
    var status = template.find(".ticketstatus").value;
    var ticket = Tickets.findOne({_id:Session.get('viewticketId')}, {fields: {status: 1}});
    var original_status = ticket.status;

    var existing_users = [];
    var new_users = [];
    requesters.forEach(function (requester){
      var user = Meteor.users.findOne({_id:requester});
      if (user !== undefined) {
        // User already exists in the system
        existing_users.push({id:user._id, email:user.profile.email});
      } else {
        // User not found, check for valid email address
        var emailMatcher = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (emailMatcher.test(requester)) {
          new_users.push(requester);
        }
      }
    });

    var extras = $('#ticketeditextrafields').serializeArray();

    var extrafields = [];
    $.each(extras, function() {
      extrafields.push({name: this.name, value: this.value || ''});
    });
 
    var args = {
      _id: ticket._id,
      subject: subject,
      requesters: existing_users,
      groups: groups,
      status: status,
      extrafields: extrafields
    };

    Meteor.call('updateTicket', args, function (error, ticketId) {
      if (! error) {
        // create new users
        new_users.forEach(function (email_address) {
          Meteor.call('createAutoUser', email_address, function (error, userId) {
            if (!error) {
              // Add user to the ticket
              Meteor.call('addTicketRequester', {
                ticketId: ticketId,
                requesterId: userId
              }, function (error, ticket_id) {

              });
            }
          });
        });
      }
    });

    if (status !== original_status) {
      Meteor.call('insertEvent', {
        ticketId: Session.get('viewticketId'),
        user: Meteor.user()._id,
        body: 'Ticket status changed to "' + status + '" by ' + useremail(Meteor.userId()) + '.'
      }, function(error, ticketId) {

      });
    }
    Session.set("showEditTicketDialog", false);
  }
});