Template.nav.helpers({
  is_active: function(page) {
    return Meteor.Router.page() == page;
  }
});