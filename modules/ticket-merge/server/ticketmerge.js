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
		if (!error) {

		}
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
      		callback: 'ticketmerge',
      		template: 'ticketmerge'
	    });

	    Hooks.insert({
      		hook: 'ticketactions',
      		module_id: args.module_id,
      		name: 'Unmerge Ticket',
      		type: 'ticket',
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

	source.forEach(function(source_id) {
		var source_ticket = Tickets.findOne({_id: source_id});
		if (source_ticket !== undefined) {
			var replies_to_keep = [];
			source_ticket.replies.forEach(function(reply){
				if (reply.status == 'posted' && reply.type != 'event') {
					reply.original_ticket = source_id;
					Tickets.update(
	          			{_id: target},
          				{
	            			$push: { replies: reply}
          				}
	        		);
				} else {
					replies_to_keep.push(reply);
				}
			});

			if (source_ticket.group === null) {
				source_ticket.group = [];
			}

			var original_requesters = target_ticket.requesters;
			var original_group = target_ticket.group;

			Tickets.update(
				{_id: target},
				{
					$addToSet: {
						requesters: {$each: source_ticket.requesters},
					},
					$set: {
						original_requesters: original_requesters,
						original_group: original_group
					}
				}
			)

      if (source_ticket.group.length != 0) {
        if (target_ticket.group == null || target_ticket.group == undefined || target_ticket.group.length == 0) {
          Tickets.update(
            {_id: target},
            {
              $set: {group: source_ticket.group}
            }
          )
        } else if (target_ticket.group.length == 1) {
          if (target_ticket.group[0] == null) {
            Tickets.update(
              {_id: target},
              {
                $set: {group: source_ticket.group}
              }
            )
          }
        } else {
          Tickets.update(
            {_id: target},
            {
              $addToSet: {
                group: {$each: source_ticket.group}
              }
            }
          )
        }
      }

			Tickets.update(
				{_id: source_id},
				{
					$set: { replies: replies_to_keep, isVisible: false, mergedInto: target, status: 'closed'}
				}
			)

			var comments = Comments.find({ticketId: source_id});
			comments.forEach(function(comment) {
				var id = comment._id;
				var original_ticket = comment.ticketId;
				Comments.update(
					{_id: id},
					{
						$set: {original_ticket: original_ticket, ticketId: target}
					}
				)
			});

			var user = Meteor.users.findOne({_id: userId});
			insert_event({
				ticketId: target,
				user: user._id,
				body: 'Ticket ' + source_id + ' merged by ' + user.profile.email
			});
		}
	});
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
				// add back to original ticket
				var new_reply = _.omit(reply, 'original_ticket');
				new_reply.original_ticket
				Tickets.update(
	    			{_id: reply.original_ticket},
        			{
	           			$push: { replies: new_reply},
	           			$set: {isVisible: true},
	           			$unset: {mergedInto: ''}
        			}
	       		);
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
	)

	unmerged_tickets = _.uniq(unmerged_tickets);
	unmerged_tickets.forEach(function(ticket) {
		insert_event({
			ticketId: ticket,
			user: user._id,
			body: 'Ticket unmerged from ' + target + ' by ' + user.profile.email
		});
		insert_event({
			ticketId: target,
			user: user._id,
			body: 'Ticket ' + ticket + ' unmerged by ' + user.profile.email
		});
	})
};