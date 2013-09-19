start_import = function () {
	Meteor.call('import_tickets');
};

convert_emails = function () {
    Meteor.call('convert_emails');
};