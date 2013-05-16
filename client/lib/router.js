/*
 * rrequest
 * http://www.rrequest.com/
 * (C) Copyright Bashton Ltd, 2013
 *
 * This file is part of rrequest.
 *
 * rrequest is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * rrequest is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with rrequest.  If not, see <http://www.gnu.org/licenses/>.
 *
*/
Meteor.Router.add({
  '/': 'home',

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
