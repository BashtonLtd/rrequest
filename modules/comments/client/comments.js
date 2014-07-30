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
Template.ticket.events({
  'click .post-ticket-comment': function (event, template) {
    var ticket = Tickets.findOne({_id: Session.get('viewticketId')});
    var body = template.find("#ticketreply-editor").value;

    if (body.trim() !== '') {
      var extras = $('#ticketreplyextrafields').serializeArray();
      var extrafields = {};

      $.each(extras, function() {
        if (extrafields[this.name] !== undefined) {
          if (!extrafields[this.name].push) {
            extrafields[this.name] = [extrafields[this.name]];
          }
            extrafields[this.name].push(this.value || '');
        } else {
          extrafields[this.name] = this.value || '';
        }
      });
      
      var created = new Date();
      var args = {
        status: 'posted',
        body: body,
        ticketId: ticket._id,
        type: 'comment',
        posted_by: Meteor.userId(),
        created: created
      };

      args = _.extend(args, extrafields);

      Comments.insert(args);

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
          }
      )
      template.find("#ticketreply-editor").value = '';
      Tickets.update({_id: ticket._id}, {$set: {commentmodified: created}});
    }
  }
});

comment_replies = function(args) {
  args = args || {};
  return Comments.find({ticketId: args.ticketId});
};

ticket_comment_button = function(args) {
  args = args || {};
  var user = Meteor.users.findOne({_id: args.userId});
  if(user !== undefined) {
    if(user.profile.isStaff) {
      return true;
    } else {
      return false;
    }
  }
  return false;
};
