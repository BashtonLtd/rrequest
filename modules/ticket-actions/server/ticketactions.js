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
	// register the ticketactions module
	Meteor.call('registerModule', {
		name: 'ticket-actions',
		callback_enable: 'enable_ticketactions_module',
		callback_disable: 'disable_ticketactions_module',
		description: 'Allows users to perform actions on multiple or single tickets.'
	}, function(error, module_id) {
		if (!error) {

		}
	});
});

Meteor.methods({
	enable_ticketactions_module: function(args) {
		args = args || {};
		// Add hooks to display actions
		Hooks.insert({
      		hook: 'ticketlistfooter_items',
      		module_id: args.module_id,
      		template: 'ticketlistactionlist'
	    });

	    Hooks.insert({
      		hook: 'ticketfooter_items',
      		module_id: args.module_id,
      		template: 'ticketactionlist'
	     });
	},

	disable_ticketactions_module: function(args) {
		args = args || {};

    	Hooks.remove({
      		module_id: args.module_id
    	});
	}
});