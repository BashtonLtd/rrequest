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
UI.registerHelper('ticketlistfooter_items', function() {
  var hooks = Hooks.find({hook:'ticketlistfooter_items'});
  return hooks;
});

UI.registerHelper('ticketlistfooter_template', function () {
  return Template[this.template];
});

Template.ticketrow.ticketlistitemfooter_items = function () {
  var ticketId = this._id;
  var footerhooks = [];
  var hooks = Hooks.find({hook:'ticketlistitemfooter_items'});
  hooks.forEach(function(hook) {
    hook.ticketId = ticketId;
    footerhooks.push(hook);
  });
  return footerhooks;
};

Template.ticketrow.ticketlistitemfooter_template = function () {
  return Template[this.template];
};

Template.ticketrow.ticketlistitemfooter_data = function () {
  return {ticketId: this.ticketId, template: this.template};
};

UI.registerHelper('ticketlist_sort_filter', function () {
  var hooks = Hooks.find({hook:'ticketlist_sort_filter'});
  return hooks;
});

UI.registerHelper('ticketlist_sort_filter_template', function () {
  return Template[this.template];
});

UI.registerHelper('ticketlist_sort_selected', function(field, order) {
  if (order == Session.get('selected_sort_order') && field == Session.get('selected_sort_field')) {
    return 'sortselected';
  } else {
    return 'sortunselected';
  }
});

Template.ticketlist.tickets = function () {
  var searchfilter = Session.get('ticketsSearchfilter');
  var selected_filter_states = Session.get('selected_filter_states');
  var sortorder = Session.get('selected_sort_order');
  var sortfield = Session.get('selected_sort_field');
  var tickets;
  if (Session.get('selected_sort_order') == 1) {
    sortorder = 'asc';
  } else {
    sortorder = 'desc';
  }
  if (searchfilter == '' || searchfilter == undefined || searchfilter.length < 3) {
    tickets = Tickets.find(
      {
        status: {$nin: selected_filter_states}
      },
      {sort: [[Session.get('selected_sort_field'), sortorder]], limit: ticketListSub.limit()}
    );
  } else {
    if (selected_filter_states.length === 0) {
      tickets = Tickets.find(
        {
          $or:
          [
            {_id: {$regex: ".*"+ searchfilter+".*", $options: 'i'}},
            {subject: {$regex: ".*"+ searchfilter +".*", $options: 'i'}},
            {'requesters.email': {$regex: ".*"+ searchfilter +".*", $options: 'i'}}
          ]
        },
        {sort: [[Session.get('selected_sort_field'), sortorder]], limit: ticketListSub.limit()}
      );
    } else {
      tickets = Tickets.find(
        {
          status: {$nin: selected_filter_states},
          $or:
          [
            {_id: {$regex: ".*"+ searchfilter+".*", $options: 'i'}},
            {subject: {$regex: ".*"+ searchfilter +".*", $options: 'i'}},
            {'requesters.email': {$regex: ".*"+ searchfilter +".*", $options: 'i'}}
          ]
        },
        {sort: [[Session.get('selected_sort_field'), sortorder]], limit: ticketListSub.limit()}
      );
    }
  }
  return tickets;
};

Template.tickets.created = function() {
  Session.set('ticketsSearchfilter', '');
  if (Session.get('selected_filter_states') === undefined) {
    Session.set('selected_filter_states', []);
  }
  if (Session.get('selected_sort_order') === undefined) {
    Session.set('selected_sort_order', -1);
  }
  if (Session.get('selected_sort_field') === undefined) {
    Session.set('selected_sort_field', 'modified');
  }
  ticketListSub = Meteor.subscribeWithPagination(
    'sortedTickets',
    getModified,
    getFilter,
    10);
};

var getModified = function() {
  var filter_field = {};
  filter_field[Session.get('selected_sort_field')] = Session.get('selected_sort_order');
  return filter_field;
};

var getFilter = function() {
  var searchfilter = Session.get('ticketsSearchfilter');
  var selected_filter_states = Session.get('selected_filter_states');
  if (searchfilter === '' || searchfilter === undefined || searchfilter.length < 3) {
    return {
      status: {$nin: selected_filter_states}
    };
  } else {
    return {
      status: {$nin: selected_filter_states},
      $or:
      [
        {_id: {$regex: ".*"+ searchfilter +".*", $options: 'i'}},
        {subject: {$regex: ".*"+ searchfilter +".*", $options: 'i'}},
        {'requesters.email': {$regex: ".*"+ searchfilter +".*", $options: 'i'}}
      ]
    };
  }
};

Template.statefilter.states = function() {
  var statelist = [];
  states = TicketStatus.find({}, {sort: {'name': 1}});
  states.forEach(function(state) {
  var idx = _.indexOf(Session.get('selected_filter_states'), state.name);
    if (idx != -1) {
      statelist.push(_.extend(state, {selected: 'filterunselected'}));
    } else {
      statelist.push(_.extend(state, {selected: 'filterselected'}));
    }
  });
  return statelist;
};

Template.statefilter.events({
  'click .filterrow': function (event, template) {
    var state = TicketStatus.findOne({_id: $(event.target).context.id});
    if (state !== undefined) {
      var current_selection = Session.get('selected_filter_states');
      if (_.indexOf(current_selection, state.name) == -1) {
        // Item is not selected, add it
        current_selection = _.extend([], current_selection);
        current_selection.unshift(state.name);
      } else {
        current_selection = _.extend([], current_selection);
        current_selection = _(current_selection).reject(function(el) {return el == state.name;});
      }
      Session.set('selected_filter_states', current_selection);
    }
  }
});

Template.ticketsortorder.events({
  'click .sortrow': function (event, template) {
    Session.set('selected_sort_field', 'modified');
    if ($(event.target).context.id == 'sortnewest') {
      Session.set('selected_sort_order', -1);
    } else {
      Session.set('selected_sort_order', 1);
    }
  }
});

Template.tickets.showCreateTicketDialog = function () {
  return Session.get("showCreateTicketDialog");
};

Template.tickets.helpers({
  ticketsReady: function() {
    return ! ticketListSub.loading();
  }
});

Template.tickets.events({
  'click .new-ticket': function (event) {
    openCreateTicketDialog();
  },
  
  'click .load-more': function(event) {
    event.preventDefault();
    ticketListSub.loadNextPage();
  },

  'input .searchfilter': function (event, template) {
    var searchterm = template.find(".searchfilter").value;
    Session.set('ticketsSearchfilter', searchterm);
  }
});

var openCreateTicketDialog = function () {
  Session.set('currentScroll',$(document).scrollTop());
  Session.set("showCreateTicketDialog", true);
};

Template.createTicketDialog.created = function () {
  Session.set('ticketRequesterSearchTerm', "");
};

Template.createTicketDialog.rendered = function () {
  var hooks = Hooks.find({hook:'ticket_create_form_field'});
  hooks.forEach(function (hook) {
    UI.insert(UI.render
      (Template[hook.template]),
      $('#ticketcreateextrafields').get(0)
    );
  });

  Session.set('selectedRequesters', []);
  var user = Meteor.users.findOne({_id:Meteor.userId()});
  $(".ticketrequester").select2({
    placeholder: 'Select requesters',
    data: get_requesters,
    multiple: true,
    tokenSeparators: [" "],

    createSearchChoice:function(term, data) {
      if ($(data).filter(function() {
        return this.text.localeCompare(term) === 0;
      }).length === 0) {
        return {id:term, text: term, isNew: true};
      }
    },

    formatResult: function(term) {
      if (term.isNew) {
        return '<span class="label label-important">New</span> ' + term.text;
      } else {
        return term.text;
      }
    }
  });
  if (!user.profile.isStaff) {
    $(".ticketrequester").val([user._id]).trigger("change");
  }

  $(".ticketgroup").select2({
    placeholder: 'Select groups',
    data: get_groups,
    multiple: true
  });

  if (get_groups().results.length == 1) {
    $(".ticketgroup").val(get_groups().results[0].id).trigger("change");
  }

};

get_requesters = function (query_opts) {
  var currentuser = Meteor.users.findOne({_id:Meteor.userId()});
  var users = Meteor.users.find({"profile.isStaff": false});
  var requesters = [];
  if (currentuser.profile.isStaff) {
    users.forEach(function (user) {
      requesters.push({id:user._id, text:user.profile.email});
    });
  } else {
    users.forEach(function (user) {
      if (user._id == currentuser._id) {
        requesters.push({id:user._id, text:user.profile.email, locked: true});
      } else {
        requesters.push({id:user._id, text:user.profile.email});
      }
    });
  }
  return {results: requesters};
};

var get_groups = function (query_opts) {
  var user = Meteor.users.findOne({_id:Meteor.userId()});
  var requesters = $(".ticketrequester").select2('val');
  var grouplist = Groups.find({members: {$in: requesters}}, {sort: {'name': 1}});
  if (grouplist.count() < 1 && is_staff(user)) {
    grouplist = Groups.find({}, {sort: {'name': 1}});
  }
  var groups = [];
  grouplist.forEach(function (group) {
    groups.push({id:group._id, text:group.name});
  });
  return {results: groups};
};

Template.createTicketDialog.events({
  'click .save': function (event, template) {
    var currentuser = Meteor.users.findOne({_id:Meteor.userId()});
    var subject = template.find(".subject").value;
    var requesters = $(".ticketrequester").select2('val');

    var groups = [];
    if (currentuser.profile.isStaff) {
      groups = $(".ticketgroup").select2('val');
    } else {
      var grouplist = Groups.find({members: {$in: [currentuser._id]}}, {sort: {'name': 1}});
      if (grouplist.count() == 1) {
        grouplist.forEach(function(group) {
          groups.push(group._id);
        });
      }
    }
    
    var existing_users = [];
    var new_users = [];
    requesters.forEach(function (requester){
      var user = Meteor.users.findOne({_id:requester});
      if (user !== undefined) {
        // User already exists in the system
        existing_users.push({id:user._id, email:user.profile.email});
      } else {
        // User not found, check for valid email address
        var emailMatcher = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (emailMatcher.test(requester)) {
          new_users.push(requester);
        }
      }
    });

    var extras = $('#ticketcreateextrafields').serializeArray();

    var extrafields = [];
    $.each(extras, function() {
      extrafields.push({name: this.name, value: this.value || ''});
    });
 
    var args = {
      subject: subject,
      requesters: existing_users,
      groups: groups,
      status: 'creating',
      extrafields: extrafields
    };

    Meteor.call('createTicket', args, function (error, ticketId) {
      if (! error) {
        // create new users
        new_users.forEach(function (email_address) {
          Meteor.call('createAutoUser', email_address, function (error, userId) {
            if (!error) {
              // Add user to the ticket
              Meteor.call('addTicketRequester', {
                ticketId: ticketId,
                requesterId: userId
              }, function (error, ticket_id) {

              });
            }
          });
        });

        Router.go('ticket', {_id: ticketId});
      } else {
        console.log('CreateTicket Error: ' + error);
      }
    });
    Session.set("showCreateTicketDialog", false);
  },

  'click .cancel': function () {
    Session.set("showCreateTicketDialog", false);
  }
});

Template.createTicketDialog.ticketRequesters = function () {
  return Meteor.users.find({"profile.isStaff": false});
};

Template.createTicketDialog.ticketRequesterGroups = function () {
  if (Session.get('selectedRequesters') === undefined) {
    Session.set('selectedRequesters', []);
  }
  return Groups.find({members: {$in: Session.get("selectedRequesters")}});
};

Template.createTicketDialog.helpers({
  displayGroups: function () {
    var user = Meteor.users.findOne({_id: Meteor.userId()});
    if (user !== undefined) {
      if (is_staff(user)) {
        return true;
      }
      if (in_multiple_groups(user)) {
        return true;
      } else {
        return false;
      }
    }
  }
});

Template.ticketlist.helpers({
  ticketready: function(){
    var ticket = Tickets.findOne({_id:this._id});
    if (ticket !== undefined) {
      if (ticket.status == 'creating') {
        return false;
      } else {
        return true;
      }
    }
  }
});