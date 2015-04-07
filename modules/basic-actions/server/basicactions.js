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
    // register the basicactions module
    Meteor.call('registerModule', {
        name: 'basic-actions',
        callback_enable: 'enable_basicactions_module',
        callback_disable: 'disable_basicactions_module',
        description: 'Includes basic actions for tickets.',
        depends: ['ticket-actions'],
    }, function(error, module_id) {
        if (!error) {

        }
    });
});

Meteor.methods({
    enable_basicactions_module: function(args) {
        args = args || {};
        Hooks.insert({
            hook: 'ticketactions',
            module_id: args.module_id,
            name: 'Edit Groups',
            type: 'ticket',
            staff_only: true,
            callback: 'action_editgroups',
            template: 'action_editgroups'
        });

        Hooks.insert({
            hook: 'ticketactions',
            module_id: args.module_id,
            name: 'Close Tickets',
            type: 'ticketlist',
            staff_only: false,
            callback: 'action_resolvetickets',
            template: 'action_resolvetickets'
        });

        Hooks.insert({
            hook: 'ticketactions',
            module_id: args.module_id,
            name: 'Close Ticket',
            type: 'ticket',
            staff_only: false,
            callback: 'action_resolvetickets',
            template: 'action_resolvetickets'
        });

    },

    disable_basicactions_module: function(args) {
        args = args || {};

        Hooks.remove({
            module_id: args.module_id
        });
    },

    editgroups_action: function(userId, target, groups) {
        return editgroups_action(userId, target, groups);
    },

    resolvetickets_action: function(userId, targets) {
        return resolvetickets_action(userId, targets);
    }
});

editgroups_action = function (userId, target, groups) {
    var user = Meteor.users.findOne({_id: userId});
    var target_ticket = Tickets.findOne({_id: target});

    if (target_ticket !== undefined) {
        target_ticket.groups = groups;
        target_ticket.save();
    }

};

resolvetickets_action = function (userId, targets) {
    var user = Meteor.users.findOne({_id: userId});
    targets.forEach(function (ticket) {
        ticket.status = 'closed';

        ticket.insert_event({
            body: 'Ticket status changed to "closed" by ' + useremail(user._id) + '.',
            update: false
        });

        ticket.save();
    });

};
