
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
Meteor.startup(function() {
  // register the ticketmerge module
  Meteor.call('registerModule', {
    name: 'ticket-merge',
    callback_enable: 'enable_ticketmerge_module',
    callback_disable: 'disable_ticketmerge_module',
    description: 'Allows tickets to be merged ( and unmerged ).',
    depends: ['ticket-actions'],
  }, function(error, module_id) {
    if (!error) {}
  });
});

Meteor.methods({
  enable_ticketmerge_module: function(args) {
    args = args || {};
    Hooks.insert({
      hook: 'ticketactions',
      module_id: args.module_id,
      name: 'Merge Tickets',
      type: 'ticketlist',
      staff_only: true,
      callback: 'ticketmerge',
      template: 'ticketmerge'
    });

    Hooks.insert({
      hook: 'ticketactions',
      module_id: args.module_id,
      name: 'Unmerge Ticket',
      type: 'ticket',
      staff_only: true,
      callback: 'ticketunmerge',
      template: 'ticketunmerge'
    });
  },

  disable_ticketmerge_module: function(args) {
    args = args || {};

    Hooks.remove({
      module_id: args.module_id
    });
  },

  mergeTickets: function(userId, target, source) {
    return merge_tickets(userId, target, source);
  },

  unmergeTickets: function(userId, target) {
    return unmerge_tickets(userId, target);
  }
});

merge_tickets = function (userId, target, source) {
  // target must be a single ticket, source must be a list

  var user = Meteor.users.findOne({_id: userId});
  // Get target ticket
  var target_ticket = Tickets.findOne({_id: target});
  if (target_ticket === undefined) {
    return false;
  }

  if (target_ticket.group === null) {
    Tickets.update(
      {_id: target},
      {
        $set: { group: []}
      }
    );
  }

  Tickets.update(
    {_id: {$in: source}},
    {$set: {isVisible: false}},
    {multi: true}
  );

  var source_tickets = Tickets.find({_id: {$in: source}});

  var replies_to_merge = [];
  var groups_to_merge = [];
  var original_requesters = target_ticket.requesters;
  var original_group = target_ticket.group;
  var source_ticket_requesters = [];
  source_tickets.forEach(function(source_ticket) {
    source_ticket.replies.forEach(function(reply){
      if (reply.status == 'posted' && reply.type != 'event') {
        reply.original_ticket = source_ticket._id;
        replies_to_merge.push(reply);
      }
    });

    if (source_ticket.requesters instanceof Array) {
      source_ticket.requesters.forEach(function(requester) {
        source_ticket_requesters.push(requester);
      });
    } else {
      source_ticket_requesters.push(source_ticket.requesters);
    }

    if (source_ticket.group === null) {
      source_ticket.group = [];
    }
    if (source_ticket.group.length !== 0) {
      // this should be a loop over the entries if it is array
      if (source_ticket.group instanceof Array) {
        // loop and add
        source_ticket.group.forEach(function(group) {
          groups_to_merge.push(group);
        });
      } else {
        groups_to_merge.push(source_ticket.group);
      }
    }

    var comments = Comments.find({ticketId: source_ticket._id});
    comments.forEach(function(comment) {
      var id = comment._id;
      var original_ticket = comment.ticketId;
      Comments.update(
        {_id: id},
        {
          $set: {original_ticket: original_ticket, ticketId: target}
        }
      );
    });
  });
  
  Tickets.update(
    {_id: {$in: source}},
    {
      $set: { isVisible: false, mergedInto: target, status: 'closed'}
    }
  );

  insert_event({
    ticketId: target,
    user: user._id,
    body: 'Tickets merged by ' + user.profile.email + ' ' + source.join(', ')
  });

  var modifier = {
    $pushAll: {},
    $addToSet: {},
    $set: {}
  };

  var group_list = _.union(target_ticket.group, groups_to_merge);
  var final_group_list = _.reject(group_list, function(item){ return item === '' || item === null;});

  modifier.$pushAll['replies'] = replies_to_merge;
  modifier.$addToSet['requesters'] = {$each: source_ticket_requesters};
  modifier.$set['original_requester'] = original_requesters;
  modifier.$set['original_group'] = original_group;
  modifier.$set['group'] = final_group_list;

  Tickets.update(
    {_id: target},
    modifier
  );
};

unmerge_tickets = function (userId, target) {
  var user = Meteor.users.findOne({_id: userId});
  target = target[0];
  var target_ticket = Tickets.findOne({_id: target});
  if (target_ticket === undefined) {
    return false;
  }
  var replies = target_ticket.replies;
  var unmerged_tickets = [];

  replies.forEach(function(reply){
    if (reply.status == 'posted') {
      if (reply.original_ticket !== undefined) {
        replies = _(replies).reject(function(el) { return el._id === reply._id; });

        var comments = Comments.find({original_ticket: reply.original_ticket});
        comments.forEach(function(comment) {
          var id = comment._id;
          Comments.update(
            {_id: id},
            {
              $set: {ticketId: reply.original_ticket},
              $unset: {original_ticket: ""}
            }
          )
        });
        unmerged_tickets.push(reply.original_ticket);
      }
    }
  });

  Tickets.update(
    {_id: target},
    {
      $set: {replies: replies, requesters: target_ticket.original_requesters, group: target_ticket.original_group}
    }
  );

  unmerged_tickets = _.uniq(unmerged_tickets);
  Tickets.update(
    {_id: {$in: unmerged_tickets}},
    {
      $set: {isVisible: true},
      $unset: {mergedInto: ''}
    }
  );
  unmerged_tickets.forEach(function(ticket) {
    insert_event({
      ticketId: ticket,
      user: user._id,
      body: 'Ticket unmerged from ' + target + ' by ' + user.profile.email
    });
  });

  insert_event({
    ticketId: target,
    user: user._id,
    body: 'Tickets unmerged by ' + user.profile.email + ' ' + unmerged_tickets.join(', ')
  });
};