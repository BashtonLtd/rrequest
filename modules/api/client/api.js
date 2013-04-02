Template.apisettings.events({
  'click .generate-auth-token': function (event, template) {
    event.preventDefault();
    var forminput = template.find(".api-settings-authtoken");
    forminput.value = generate_auth_token();
  },

  'click .api-settings-save': function (event, template) {
    var authtoken = template.find(".api-settings-authtoken").value;
    Meteor.call('api_settings_save', {
      authtoken: authtoken
    });

  }
});

Template.apisettings.authtoken = function() {
  var settings = APISettings.findOne({});
  if (settings !== undefined) {
    return settings.authtoken;
  }
};

var api_settings_page = function(args) {
  args = args || {};

  return {
    name: 'API',
    content_page: 'apisettings'
  };
};

var generate_auth_token = function () {
  var authtoken = "";
  var chars = "abcdef0123456789";

  for( var i=0; i < 32; i++ )
    authtoken += chars.charAt(Math.floor(Math.random() * chars.length));

  return authtoken;
};