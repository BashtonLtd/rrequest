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
Session.set('showEditor', false);

Template.ticketheader.helpers({
    ticketfooter_items: function() {
        var hooks = Hooks.find({hook:'ticketfooter_items'});
        return hooks;
    },

    ticketfooter_items_template: function() {
        return Template[this.template];
    },

    tickettopright: function(ticketId) {
        var items = [];
        var hooks = Hooks.find({hook:'tickettopright'});
        hooks.forEach(function (hook) {
            hook.ticketId = ticketId;
            items.push(hook);
        });
        return items;
    },

    tickettopright_template: function() {
        return Template[this.template];
    },

    tickettopright_data: function() {
        return {ticketId: this.ticketId, template: this.template};
    }
});

var documentId = function() {
    var user = Meteor.users.findOne({_id: Meteor.userId()});
    var user_level = 'requester';
    if (user !== undefined) {
        if(user.profile.isStaff) {
            user_level = 'staff';
        }
    }
    return Session.get('viewticketId') + '-' + user_level;
};

Template.ticketreplybox.helpers({
    documentId: function () {
        return documentId();
    },

    ticket_reply_button: function() {
        var hooks = Hooks.find({hook:'ticket_reply_button'});
        var buttons = [];
        var user_id = Meteor.userId();
        hooks.forEach(function (hook) {
            if(window[hook.render]({userId:user_id})) {
                buttons.push(hook);
            }
        });
        return buttons;
    },

    replyentryformfields: function(replyId) {
        var extraformfields = [];
        var ticketId = Session.get('viewticketId');
        var hooks = Hooks.find({hook:'ticket_reply_form_field'});
        hooks.forEach(function (hook) {
            hook.ticketId = ticketId;
            hook.replyId = replyId;
            extraformfields.push(hook);
        });
        return extraformfields;
    },

    replyentryformfields_template: function() {
        return Template[this.data.template];
    },

    replyentryformfields_data: function() {
        return {data: this};
    },

    replyentryfooter_items: function(replyId) {
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
    },

    replyentryfooter_items_template: function() {
        return Template[this.template];
    },

    replyentryfooter_items_data: function() {
        return this;
    },

    showEditor: function() {
        return Session.get('showEditor');
    }
});

Template.ticketreplybox.rendered = function () {
    // Initially render the editor after a quick delay
    Session.set('showEditor', false);
    window.setTimeout(function() {
        Session.set('showEditor', true);
    }, 250);

    // Continue checking every second, keep reloading until "Loading..." goes away :(
    var interval = window.setInterval(function() {
        if ($("#ticketreply-editor").is(":disabled")) {
            Session.set('showEditor', false);
            window.setTimeout(function() {
                Session.set('showEditor', true);
            }, 10);
        } else {
            window.clearInterval(interval);
        }
  }, 4000);
};

Template.ticket.helpers({
    sidebaritems: function() {
        var hooks = Hooks.find({hook:'ticket_sidebar'});
        return hooks;
    },

    sidebaritems_template: function() {
        return Template[this.template];
    }
});

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
  if (ticket.group !== null && ticket.group != undefined) {
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

Template.ticketreplies.helpers({
    posted_replies: function() {
        var user = Meteor.users.findOne({_id: Meteor.userId()});
        var ticket = Tickets.findOne({_id: Session.get('viewticketId')}, {fields: {unpostedstaffreply: 0, unpostedrequesterreply: 0}});
        if (ticket !== undefined) {
            var replies = [];
            var existingReplies = [];
            var existingReplyIds = [];
            var updateReplies = false;
            ticket.replies.forEach(function(reply){
                if(reply !== undefined) {
                    if(reply.status == 'posted') {
                        var workingReply = JSON.parse( JSON.stringify( reply ) );
                        if (_.contains(existingReplyIds, workingReply._id)) {
                            workingReply._id = Random.id();
                            existingReplies.push(workingReply);
                            updateReplies = true;
                        } else {
                            existingReplyIds.push(workingReply._id);
                            existingReplies.push(workingReply);
                        }

                        reply.body = marked(reply.body);
                        reply.ticketId = ticket._id;
                        replies.push(reply);
                    }
                }
            });
            if (updateReplies == true) {
                Tickets.update(
                    {_id:ticket._id},
                    {
                        $set: {replies: existingReplies}
                    }
                );
            }

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
    },

    posted_reply_template: function() {
        return Template['ticketreply-'+this.reply.type];
    },

    posted_reply_data: function() {
        return {reply: this};
    }

});



Template.ticketheader.ticketcreated = function () {
  var ticket = Tickets.findOne({_id: Session.get('viewticketId')});
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
        // Check the textarea is enabled
        if (!$("#ticketreply-editor").is(":disabled")) {
            var ticket = Tickets.findOne({_id: Session.get('viewticketId')});
            var original_status = ticket.status;
            var replyId = Random.id();
            var level = current_user_level();
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

    // any attachments with the current documentId should be updated with the reply id
    var attachments = Attachments.find({'metadata.replyId':documentId()});

    attachments.forEach(function(attachment) {
        Attachments.update({_id: attachment._id}, {$set: {'metadata.replyId': options.replyId}});
    });

    // This should be a Ticket object with a call to save.
    return Tickets.update(
        {_id: options.ticketId},
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
