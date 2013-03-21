Meteor.methods({
  registerModule: function(args) {
    args = args || {};

    var module = Modules.findOne({name: args.name});
    if (module === undefined) {
      Modules.insert({
        name: args.name,
        enabled: false,
        callback_enable: args.callback_enable,
        callback_disable: args.callback_disable
      });
    }
  },

  enableModule: function(args) {
    args = args || {};

    var module = Modules.findOne({_id: args.module_id});
    if (module !== undefined) {
      if(!module.enabled) {
        Meteor.call(module.callback_enable, {
          module_id: module._id
        }, function(error, module_id) {
          if(!error) {
            Modules.update({_id: module._id},
              {$set: {enabled: true}}
            );
          }
        });
      }
    }
  },

  disableModule: function(args) {
    args = args || {};

    var module = Modules.findOne({_id: args.module_id});
    if (module !== undefined) {
      if(module.enabled) {
        Meteor.call(module.callback_disable, {
          module_id: module._id
        }, function(error, module_id) {
          if(!error) {
            Modules.update({_id: module._id},
              {$set: {enabled: false}}
            );
          }
        });
      }
    }
  }
});