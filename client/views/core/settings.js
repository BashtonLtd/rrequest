Template.settings.created = function () {
  Session.set('activeSettingsPage', "");
};

Template.settings.pagecontent = function() {
  var page = Session.get('activeSettingsPage');
  if(page !== "") {
    return Template[Session.get('activeSettingsPage')]();
  }
};


Template.settings.helpers({
  is_active: function(pagename) {
    return Session.get('activeSettingsPage') == pagename;
  }
});

Template.settings.events({
  'click .settings-menu': function (event, template) {
    Session.set("activeSettingsPage", event.toElement.id);
  }
});

Template.moduleactivation.availablemodules = function() {
  return Modules.find();
};

Template.moduleactivation.events({
  'click .disable-module': function (event, template) {
    Meteor.call('disableModule', {
      module_id: this._id
    });
  },

  'click .enable-module': function () {
    Meteor.call('enableModule', {
      module_id: this._id
    });
  }
});