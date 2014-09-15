Package.describe({
	summary: "reactive event system for Meteor",
	version: "0.1.2",
	name: "dwatson:eventhorizon"
});

Package.onUse(function (api) {
	api.export(['EventHorizon'],['client','server']);

	api.use('coffeescript','client');
	api.use('underscore', ['client', 'server']);
	api.addFiles([
		'eventHorizon.coffee'
	],['client','server']);
});
