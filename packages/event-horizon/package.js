Package.describe({
	summary: "reactive event system for Meteor"
});

Package.on_use(function (api) {
	api.export(['EventHorizon'],['client','server']);

	api.use('coffeescript','client');
	api.use('underscore', ['client', 'server']);
	api.add_files([
		'eventHorizon.coffee'
	],['client','server']);
});
