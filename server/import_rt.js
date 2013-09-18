var fs = Npm.require('fs');
var Fiber = Npm.require('fibers');

Meteor.methods({
	import_tickets: function() {
		import_tickets();
	}
});


var import_tickets = function () {
	console.log('Starting');
	var dir = '/opt/rrequest/rrequest/rt4tickets';
    

	// open each file id dir
	fs.readdir(dir, function (err, list) {
    	// Return the error if something went wrong
    	if (err)
      	return console.log(err);

        var count = 0;

  		list.forEach(function (file) {
            if (count < 1) {
                //console.log(count);
                count = count + 1;
    	  		var path = dir + "/" + file;
      			fs.stat(path, function (err, stat) {
      				if (stat && stat.isDirectory()) {
    	  				console.log('');
      				} else {
    	  				handle_ticket(path);
                        //console.log(count);
                        //count = count + 1;
      				}
      			});
            }
  		});
	});
};

var cleanup = function(text) {
    text = text.replace(/%21/g, "!");
    text = text.replace(/%23/g, "#");
    text = text.replace(/%24/g, "$");
    text = text.replace(/%25/g, "%");
    text = text.replace(/%26/g, "&");
    text = text.replace(/%2B/g, "+");
    text = text.replace(/%2C/g, ",");
    text = text.replace(/%2F/g, "/");
    text = text.replace(/%3A/g, ":");
    text = text.replace(/%3B/g, ";");
    text = text.replace(/%3D/g, "=");
    text = text.replace(/%3F/g, "?");
    text = text.replace(/%40/g, "@");

    return text;
};

var handle_ticket = function (path) {
    
	//console.log('Importing ' + path);
	// open file
	var ticket_data;
	var data = fs.readFileSync(path, 'utf8');
	console.log(path);

	ticket_data = JSON.parse(data);
	//console.log(ticket_data);

    Fiber(function() {

		var ticketcreated = decodeURI(ticket_data.Date.replace(/%3A/g, ":"));
        var from = decodeURI(ticket_data.From.replace(/%40/g, "@"));
        from = cleanup(from);
        from = from.replace(/\n/g, "");
        var idstr = decodeURI(ticket_data.ID.replace(/%2F/g, "/"));
        var id = idstr.split("/")[1];
        var subject = decodeURI(ticket_data.Subject);
        var subject = cleanup(subject);


        console.log('starting ' + id);

        // check if ticket already exists with ticket ID
        var ticket = Tickets.findOne({_id: id});
        if (ticket === undefined) {
            var existing_users = [];
            var new_users = [];

            var requesters = from.split(',');
            requesters.forEach(function (requester){
                requester = requester.trim();
                var user = Meteor.users.findOne({'profile.email':requester});
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


            var groups = [];

            Meteor.call('createTicket', {
                _id: id,
                subject: subject,
                requesters: existing_users,
                groups: groups,
                status: 'closed'
            }, function (error, ticketId) {
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

                    // Set ticket data
                    Tickets.update({_id: ticketId},
                        {$set: {
                            created: moment(ticketcreated)._d,
                            modified: moment(ticketcreated)._d
                        }}
                    );

                    // add each reply and event - setting the date on each
                    ticket_data.Replies.forEach(function (reply){
                        // Get date and content
                        var replycreated = decodeURI(reply.Date.replace(/%3A/g, ":"));
                        var replycontent = decodeURI(reply.Content);
                        replycontent = cleanup(replycontent);
                        var replydescription = decodeURI(reply.Description);
                        replydescription = cleanup(replydescription);

                        // check description
                        var descriptionparts = replydescription.split(' ');

                        if (descriptionparts[0] == 'Ticket' || descriptionparts[0] == 'Correspondence') {
                            // Ticket created or reply

                            if (replycontent == "") {

                            } else {

                                // get user
                                var emailMatcher = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                                if (descriptionparts[3] == "") {
                                    var user = get_or_create_user('unknown@bashton.com');
                                } else {
                                    if (emailMatcher.test(descriptionparts[3])) {
                                        var user = Meteor.users.findOne({'profile.email':descriptionparts[3]});

                                        if (user === undefined) {
                                            var user = get_or_create_user(descriptionparts[3]);
                                        }
                                    } else if (['samba'].indexOf(descriptionparts[3]) !== -1) {
                                        var user = get_or_create_user('unknown@bashton.com');
                                    } else if (['sam', 'david', 'tron', 'marcin', 'andy'].indexOf(descriptionparts[3]) !== -1) {
                                        // bashton user
                                        var user = get_or_create_user(descriptionparts[3] + '@bashton.com');
                                    } else {
                                        var user = get_or_create_user('unknown@bashton.com');
                                    }
                                }

                                create_reply({
                                    ticketId: ticketId,
                                    created: moment(replycreated)._d,
                                    user: user,
                                    reply: {
                                        body: replycontent,
                                        status: 'posted'
                                    }
                                });
                            }

                        } else if (descriptionparts[0] == 'Outgoing') {
                            // Email sent
                        } else if (descriptionparts[0] == 'Status') {
                            // Status changed
                            insert_event({
                                ticketId: ticketId,
                                created: moment(replycreated)._d,
                                body: replydescription
                            });
                        } else if (descriptionparts[0] == 'Taken') {
                            insert_event({
                                ticketId: ticketId,
                                created: moment(replycreated)._d,
                                body: replydescription
                            });
                        }
                    });
                }
            });

        } else {
            // ticket already exists, could check replies and add new ones
            ticket_data.Replies.forEach(function (reply){
                var replycreated = decodeURI(reply.Date.replace(/%3A/g, ":"));
                var replycontent = decodeURI(reply.Content);
                replycontent = cleanup(replycontent);
                var replydescription = decodeURI(reply.Description);
                replydescription = cleanup(replydescription);

                // check description
                var descriptionparts = replydescription.split(' ');

                if (descriptionparts[0] == 'Ticket' || descriptionparts[0] == 'Correspondence') {
                    // Ticket created or reply

                    if (replycontent == "") {

                    } else {

                        // get user
                        var emailMatcher = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                        if (descriptionparts[3] == "") {
                            var user = get_or_create_user('unknown@bashton.com');
                        } else {
                            if (emailMatcher.test(descriptionparts[3])) {
                                var user = Meteor.users.findOne({'profile.email':descriptionparts[3]});

                                if (user === undefined) {
                                    var user = get_or_create_user(descriptionparts[3]);
                                }
                            } else if (['samba'].indexOf(descriptionparts[3]) !== -1) {
                                var user = get_or_create_user('unknown@bashton.com');
                            } else if (['sam', 'david', 'tron', 'marcin', 'andy'].indexOf(descriptionparts[3]) !== -1) {
                                // bashton user
                                var user = get_or_create_user(descriptionparts[3] + '@bashton.com');
                            } else {
                                var user = get_or_create_user('unknown@bashton.com');
                            }
                        }

                        // if reply exists - ignore

                        var replies = [];
                        var createreply = true;
                        ticket.replies.forEach(function(reply){

                            if (reply.posted_by !== undefined) {
                                if (reply.created == replycreated && user._id == reply.posted_by.id) {
                                    // already exists - ignore
                                    createreply = false;
                                }
                            }
                        });
                        if (createreply) {
                            create_reply({
                                ticketId: id,
                                created: moment(replycreated)._d,
                                user: user,
                                reply: {
                                    body: replycontent,
                                    status: 'posted'
                                }
                            });
                        }
                    }

                }
            });
        }

        var outputdir = '/opt/rrequest/rrequest/rt4tickets-done';
        fs.rename(path, outputdir + '/' + id + '.json', function(err) {
            if (err) {
                console.log(err);
            } else {
                console.log(path + ' archived');
                setTimeout(import_tickets, 1500);
            }
        });

    }).run();

};
