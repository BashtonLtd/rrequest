Meteor.startup(function (){
  // register the api module
  Meteor.call('registerModule', {
    name: 'api',
    callback_enable: 'enable_api_module',
    callback_disable: 'disable_api_module',
    description: 'Exposes collections via a http REST API.'
  }, function(error, module_id) {
    if(!error) {

    }
  });

  var settings = APISettings.findOne();
  if (settings === undefined) {
    APISettings.insert({authtoken: ''});
  }

  collectionApi = new CollectionAPI({});
  collectionApi.addCollection(Tickets, 'tickets');

  var module = Modules.findOne({name: 'api'});
  if (module.enabled) {
    collectionApi.start();
  }

});

Meteor.methods({
  enable_api_module: function(args) {
    args = args || {};

    collectionApi.start();
    Hooks.insert({
      hook: 'settings_page',
      module_id: args.module_id,
      data: 'api_settings_page'
    });

  },

  disable_api_module: function(args) {
    args = args || {};

    Hooks.remove({
      module_id: args.module_id
    });
  },

  api_settings_save: function(args) {
    args = args || {};

    APISettings.update({},
      {$set: {authtoken: args.authtoken}},
      {multi: true}
    );
  }
});
