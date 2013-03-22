Meteor.Router.add({
  '/': 'dashboard',

  '/tickets': 'tickets',
  '/ticket/:id': function(id) {
    Session.set('viewticketId', id);
    return 'ticket';
  },

  '/groups': 'groups',
  '/group/:id': function(id) {
    Session.set('viewgroupId', id);
    return 'group';
  },

  '/users': 'users',
  'user/:id': function(id) {
    Session.set('viewuserId', id);
    return 'user';
  },

  '/settings': 'settings'

});

Meteor.Router.filters({
  requireAdmin: function(page) {
    return is_admin(Meteor.user()) ? page : "not_allowed";
  },
  requireStaff: function(page) {
    return is_staff(Meteor.user()) ? page : "not_allowed";
  }
});

Meteor.Router.filter('requireAdmin', {only: ['users']});
Meteor.Router.filter('requireStaff', {only: ['groups']});


Meteor.startup(function() {
  Meteor.autorun(function() {
    // grab the current page from the router, so this re-runs every time it changes
    Meteor.Router.page();
     if(Meteor.Router.page() !== "loading"){
      console.log('------ '+Meteor.Router.page()+' ------');
    }

    document.title = 'rrequest: ' + Meteor.Router.page();

    Session.set('currentScroll', null);
  });
});