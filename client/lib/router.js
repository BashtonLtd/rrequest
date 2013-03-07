Meteor.Router.add({
  '/': 'dashboard',

  '/tickets': 'tickets',
  '/ticket/:id': function(id) {
    Session.set('ticketId', id);
    return 'ticket';
  },

  '/groups': 'groups',
  '/group/:id': function(id) {
    Session.set('groupId', id);
    return 'group';
  }
});

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