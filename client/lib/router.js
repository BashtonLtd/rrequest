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

BeforeHooks = {
  resetScroll: function () {
    Session.set('currentScroll', null);
    this.next();
  },
  requireAdmin: function() {
    if (Meteor.user()) {
      if (is_admin(Meteor.user())) {
        this.render(this.route.name);
      } else {
        this.render('not_allowed');
      }
    } else if (Meteor.loggingIn()) {
      this.render('loading');
    } else {
      this.render('not_allowed');
    }
    this.next();
  },
  requireStaff: function() {
    if (Meteor.user()) {
      if (is_staff(Meteor.user())) {
        this.render(this.route.name);
      } else {
        this.render('not_allowed');
      }
    } else if (Meteor.loggingIn()) {
      this.render('loading');
    } else {
      this.render('not_allowed');
    }
    this.next();
  },
  redirectToTickets: function() {
    if (Meteor.user()) {
      if (is_staff(Meteor.user())) {
        this.render(this.route.name);
      } else {
        var multiple_groups = in_multiple_groups(Meteor.user());
        if (multiple_groups) {
          Router.go('tickets');
        } else {
          var group = get_user_group(Meteor.user());
          if (group === null) {
            this.render('tickets');
          } else {
            Session.set('viewgroupId', this.params._id);
            Router.go('group', {_id: group});
          }
        }
      }
    } else if (Meteor.loggingIn()) {
      this.render('loading');
    } else {
      this.render('home');
    }
    this.next();
  },
  globalSubscriptions: function() {
      Meteor.subscribe('currentUser');
      //Meteor.subscribe('allUsers');
      Meteor.subscribe('staffUsers');
      Meteor.subscribe('groupUsers');
      Meteor.subscribe('groups');
      Meteor.subscribe('hooks');
      Meteor.subscribe('settings');
      Meteor.subscribe('modules', function() {
        EventHorizon.fire('modulescollectionready');
      });
      this.next();
  },
  ticketsSubscriptions: function() {
      Meteor.subscribe('ticketstatus');
      this.next();
  }
};

Router.configure({
  layoutTemplate: 'base',
  notFoundTemplate: 'not_found',
  loadingTemplate: 'loading'
});

// hooks that are shared across several routes, should call this.next() and be listed first
Router.onBeforeAction(BeforeHooks.resetScroll);
Router.onBeforeAction(BeforeHooks.globalSubscriptions, {except: []});
Router.onBeforeAction(BeforeHooks.ticketsSubscriptions, {only: ['tickets', 'ticket', 'group']});

Router.onBeforeAction(BeforeHooks.requireAdmin, {only: ['users', 'settings']});
Router.onBeforeAction(BeforeHooks.requireStaff, {only: ['groups']});
Router.onBeforeAction(BeforeHooks.redirectToTickets, {only: ['home']});

get_sitename = function () {
  site_name_setting = Settings.findOne({name: 'site_name'});
  var site_name;
  if (site_name_setting !== undefined) {
    site_name = site_name_setting.value;
  }
  return site_name;
};

Router.map(function() {
  this.route('home', {
    path: '/',
    onAfterAction: function() {
      var site_name = get_sitename();
      if (site_name !== undefined) {
        document.title = site_name;
      } else {
        document.title = this.route.name;
      }
    }
  });

  this.route('tickets', {
    path: '/tickets',
    onAfterAction: function() {
      var site_name = get_sitename();
      if (site_name !== undefined) {
        document.title = site_name + ': ' + this.route.name;
      } else {
        document.title = this.route.name;
      }
    }
  });

  this.route('ticket', {
    path: '/ticket/:_id',
    onRun: function () {
      Session.set('viewticketId', this.params._id);
      this.next();
    },
    onAfterAction: function() {
      var site_name = get_sitename();
      var ticket = Tickets.findOne({_id: Session.get('viewticketId')}, {reactive: false});
      if (ticket !== undefined) {
        document.title = ticket._id + ' - ' + ticket.subject;
      } else {
        document.title = site_name + ': ' + this.route.name;
      }
    },
    waitOn: function () {
        return [
            Meteor.subscribe('singleTicket', Session.get('viewticketId')),
            Meteor.subscribe('attachments', Session.get('viewticketId'))
        ];
    },
    onStop: function () {
        Session.set('viewticketId', null);
    }
  });

    this.route('groups', {
        path: '/groups',
        onAfterAction: function() {
            var site_name = get_sitename();
            if (site_name !== undefined) {
              document.title = site_name + ': ' + this.route.name;
            } else {
              document.title = this.route.name;
            }
        },
        waitOn: function () {
            return Meteor.subscribe('singleGroup', Session.get("selectedGroup"));
        }
  });

  this.route('group', {
    path: '/group/:_id',
    onRun: function () {
      Session.set('viewgroupId', this.params._id);
      this.next();
    },
    waitOn: function () {
      return Meteor.subscribe("counts-by-group", this.params._id);
    },
    onAfterAction: function() {
      var site_name = get_sitename();
      var group = Groups.findOne({_id: Session.get('viewgroupId')}, {reactive: false});
      if (group !== undefined) {
        document.title = group.name;
      } else {
        document.title = site_name + ': ' + this.route.name;
      }
    }
  });

  this.route('users', {
    path: '/users',
    onAfterAction: function() {
      var site_name = get_sitename();
      if (site_name !== undefined) {
        document.title = site_name + ': ' + this.route.name;
      } else {
        document.title = this.route.name;
      }
    }
  });

  this.route('settings', {
    path: '/settings',
    onAfterAction: function() {
      var site_name = get_sitename();
      if (site_name !== undefined) {
        document.title = site_name + ': ' + this.route.name;
      } else {
        document.title = this.route.name;
      }
    }
  });
});
