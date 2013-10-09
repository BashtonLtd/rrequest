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
Fiber = Npm.require('fibers');
var module;

Meteor.startup(function() {
	// register the tasks module
	Meteor.call('registerModule', {
		name: 'autoclose',
		callback_enable: 'enable_autoclose_module',
		callback_disable: 'disable_autoclose_module',
		description: 'Automatically close tickets after inactivity.',
		depends: ['tasks']
	}, function(error, module_id) {
		if (!error) {

		}
	});

	var settings = AutocloseSettings.findOne();
  	if (settings === undefined) {
    	AutocloseSettings.insert({
    		inactivity_warning: 6,
      		close_period: 1
      	});
  	}	

	module = Modules.findOne({name: 'autoclose'});

	if (module.enabled) {
		job_exists('check autoclose', function() {
		   	tasks.create('tasks', {
	       	    title: 'check autoclose'
	       	  , args: { age_warning: settings.inactivity_warning, age_close: settings.close_period }
	       	  , callback: 'autoclose'
	       	}).save();
	    });
    }
});

Meteor.methods({
	enable_autoclose_module: function(args) {
		args = args || {};

		Hooks.insert({
      		hook: 'settings_page',
      		module_id: args.module_id,
      		data: 'autoclose_settings_page'
    	});

		var settings = AutocloseSettings.findOne();

		job_exists('check autoclose', function() {
		   	tasks.create('tasks', {
	       	    title: 'check autoclose'
	       	  , args: { age_warning: settings.inactivity_warning, age_close: settings.close_period }
	       	  , callback: 'autoclose'
	       	}).save();
	    });
	},

	disable_autoclose_module: function(args) {
		args = args || {};

		Hooks.remove({
      		module_id: args.module_id
    	});
	},

	updateAutocloseSettings: function(args) {
    args = args || {};

    AutocloseSettings.update({},
      {$set: {
        inactivity_warning: args.inactivity_warning,
        close_period: args.close_period
      }},
      {multi: true}
    );
  }
});

autoclose = function(data) {
	Fiber(function() {
		var settings = AutocloseSettings.findOne();
		warnedtickets = Tickets.find({status: {$ne: 'closed'}, close_warning: {$exists:true}});

		warnedtickets.forEach(function (ticket) {
			// if more than 'age_close' days after close_warning date then close
			// if there is newer activity on the ticket remove close_warning field

			var warned = moment(ticket.close_warning).valueOf();
			var modified = moment(ticket.modified).valueOf();


			if (warned > modified) {

				var target = moment(ticket.close_warning).add('days', data.age_close).valueOf();
				var now = moment().valueOf();

				if ( target <= now) {
					console.log('Closing: ' + ticket._id);
					update_status({ticketId: ticket._id, status: 'closed'});
				

					insert_event({
						ticketId: ticket._id,
						body: 'Ticket automatically closed due to inactivity.'
					});

					// Email about closed ticket
					var subject = '[' + ticket._id + '] ' + ticket.subject;
					var ticketurl = Meteor.absoluteUrl('ticket/' + ticket._id, {});

					var body = 'This ticket has had no activity for ' + data.age_warning + ' days, and has ';
					body += 'now been closed.  You can reopen this ticket by replying to this email or visiting ';
      				body +=  ticketurl + '.  ';

      				var text = body;
      				var html = marked(body);

      				var requesteremails = '';
      				for (var i = 0, l = ticket.requesters.length; i < l; i++) {
        				requesteremails += useremail(ticket.requesters[i]);
        				if (i < ticket.requesters.length -1) {
          					requesteremails += ', ';
        				}
      				}

      				Email.send({
        				text: text,
        				from: EMAIL_FROM,
        				to: requesteremails,
        				subject: subject,
        				headers: {
          					'in-reply-to': get_requester_message_id(ticket._id)
        				}
        			});
				}
			} else {
				//remove close_warning field
				Tickets.update(
					{_id: ticket._id},
					{
						$unset: {close_warning: ""}
					}
				)
			}

		});

		opentickets = Tickets.find({status: {$ne: 'closed'}, isVisible: {$ne: false}});

		opentickets.forEach(function (ticket) {
			// warning if no activity for 'age_warning' days

			if (ticket.close_warning == null || ticket.close_warning == undefined) {

				// if modified id more that 'age_warning' days ago
				var target = moment(ticket.modified).add('days', data.age_warning).valueOf();
				var now = moment().valueOf();

				if ( target <= now) {
					console.log('Old: ' + ticket._id);

					insert_event({
						ticketId: ticket._id,
						body: 'Ticket to be closed due to inactivity.'
					});

					// Set close_warning on the ticket
					Tickets.update(
						{_id: ticket._id},
						{
							$set: {close_warning: moment().valueOf()}
						}
					);

					// Email close warning here
					var subject = '[' + ticket._id + '] ' + ticket.subject;
					var ticketurl = Meteor.absoluteUrl('ticket/' + ticket._id, {});

					var body = 'This ticket has had no activity for ' + data.age_warning + ' days, and will ';
					body += 'soon be automatically closed.  To prevent this reply to this email or visit ';
      				body +=  ticketurl + '.  ';

      				var text = body;
      				var html = marked(body);

      				var requesteremails = '';
      				for (var i = 0, l = ticket.requesters.length; i < l; i++) {
        				requesteremails += useremail(ticket.requesters[i]);
        				if (i < ticket.requesters.length -1) {
          					requesteremails += ', ';
        				}
      				}

      				Email.send({
        				text: text,
        				from: EMAIL_FROM,
        				to: requesteremails,
        				subject: subject,
        				headers: {
          					'in-reply-to': get_requester_message_id(ticket._id)
        				}
        			});
				}
			}
		});

		if (module.enabled) {
			// if enabled create delayed task

			//var delay = 300000; // 5 minutes
	    	var delay = 45000;
	    	tasks.create('tasks', {
				title: 'check autoclose'
		  	  , args: { age_warning: settings.inactivity_warning, age_close: settings.close_period }
              , callback: 'autoclose'
	    	}).delay(delay).save();

		}	
	}).run();

	return true;
};