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
Template.group.groupname = function () {
  var group = Groups.findOne({_id: Session.get('viewgroupId')});
  if (group !== undefined) {
    return group.name;
  }
};

Template.groupstatboxes.boxes = function (groupId) {
  var statboxes = [];
  var hooks = Hooks.find({hook:'groupstatboxes'});
  hooks.forEach(function (hook) {
    statboxes.push({template: Template[hook.template]({groupId:groupId})});
  });
  return statboxes;
};

Template.groupstatboxes.ticketscreated = function (days) {
  var sessionvar = Session.get('viewgroupId') + days;
  var count = Session.get(sessionvar);

  if (count !== undefined) {
    return count;
  } else {
    Meteor.call('getGroupTicketCount',
      {group: Session.get('viewgroupId'), days: days},
      function (error, ticketcount) {
        Session.set(sessionvar, ticketcount);
      }
    );
  }
};

Template.group.created = function () {
  if (Session.get('sortorder-groupsTickets') === undefined) {
    Session.set('sortorder-groupsTickets', -1);
  }
  if (Session.get('sortfield-groupsTickets') === undefined) {
    Session.set('sortfield-groupsTickets', 'modified');
  }
};

Template.group.rendered = function () {
  // var statelist = [];
  // states = TicketStatus.find({}, {sort: {'name': 1}});
  // states.forEach(function(state) {
  //   statelist.push(state);
  // });
  
  // Session.set('groupsTicketsFilterChoices', statelist);
  // Session.set('groupsTicketsSortFields', [
  //   {field: 'modified', direction: -1, name: 'Newest First'},
  //   {field: 'modified', direction: 1, name: 'Oldest First'},
  //   {field: 'priority', direction: 1, name: 'Priority'}
  //   ]);
};

Template.groupsTicketsSortFields.events({
  'click .cancel': function () {
    Session.set('showSortOrderDialog', false);
  },

  'click .sortrow': function (event, template) {
    Session.set('sortfield-groupsTickets', 'modified');
    if ($(event.target).context.id == 'sortnewest') {
      Session.set('sortorder-groupsTickets', -1);
    } else {
      Session.set('sortorder-groupsTickets', 1);
    }
  }
});

Template.groupsTicketsFilterChoices.events({
  'click .filterrow': function (event, template) {
    var state = TicketStatus.findOne({_id: $(event.target).context.id});
    if (state !== undefined) {
      var current_selection = Session.get('selectedfilterchoices-groupsTickets');
      if (_.indexOf(current_selection, state.name) == -1) {
        // Item is not selected, add it
        current_selection = _.extend([], current_selection);
        current_selection.unshift(state.name);
      } else {
        current_selection = _.extend([], current_selection);
        current_selection = _.reject(current_selection, function(el) {return el == state.name;});
      }
      Session.set('selectedfilterchoices-groupsTickets', current_selection);
    }
  }
});

Handlebars.registerHelper('sort_selected', function (field, order) {
  if (order == Session.get('sortorder-groupsTickets') && field == Session.get('sortfield-groupsTickets')) {
    return 'sortselected';
  } else {
    return 'sortunselected';
  }
});


Template.groupsTicketsFilterChoices.states = function() {
  var statelist = [];
  states = TicketStatus.find({}, {sort: {'name': 1}});
  states.forEach(function(state) {
  var idx = _.indexOf(Session.get('selectedfilterchoices-groupsTickets'), state.name);
    if (idx != -1) {
      statelist.push(_.extend(state, {selected: 'filterunselected'}));
    } else {
      statelist.push(_.extend(state, {selected: 'filterselected'}));
    }
  });
  return statelist;
};

Template.groupsTicketsFilterChoices.events({
  'click .cancel': function () {
    Session.set('showFilterDialog', false);
  }
});









Handlebars.registerHelper('collectionList', function(args) {
  return new Handlebars.SafeString(Template._collectionList(args.hash));
});

Template._collectionList.created = function() {
  rowTemplate = this.data.rowtemplate;
  sortTemplate = this.data.sorttemplate;
  filterTemplate = this.data.filtertemplate;
  listname = this.data.name;

  // set session variables
  Session.set('search-' + this.data.name, '');
  Session.set('key-' + this.data.name, this.data.collectionFilterKey);
  Session.set('value-' + this.data.name, this.data.collectionFilterValue);
  Session.set('publication-' + this.data.name, this.data.publication);
  Session.set('searchfields-' + this.data.name, this.data.searchfields);
  // Session.set('sortfields-' + this.data.name, this.data.sortfields);

  // Session.set('sortfield-' + this.data.name, '');
  // Session.set('sortorder-' + this.data.name, '');
  
  Session.set('filterrow-' + this.data.name, this.data.filterrow);
  Session.set('filterchoices-' + this.data.name, this.data.filterchoices);

  Session.set('selectedfilterchoices-' + this.data.name, []);

  collectionSub = Meteor.subscribeWithPagination(
    this.data.publication,
    getsort,
    getfilter,
    this.data.perpage
  );
};

var get_filterchoices = function (query_opts) {
  var choices = [];
  if (Session.get(Session.get('filterchoices-'+listname)) !== undefined) {
    Session.get(Session.get('filterchoices-'+listname)).forEach(function(choice) {
      choices.push({id: choice.name, text: choice.name});
    });
  }
  return {results: choices};
};

var getfilter = function() {
  var collectionFilter = {};
  var searchfilter = Session.get('search-' + listname);
  if (Session.get('key-'+listname) !== undefined) {
    collectionFilter[Session.get('key-'+listname)] = Session.get(Session.get('value-'+listname));
  }

  if (Session.get('filterrow-'+listname) !== undefined) {
    collectionFilter[Session.get('filterrow-'+listname)] = {$nin: Session.get('selectedfilterchoices-' + listname)};
  }

  var searchfields = [];
  var searchFilter = {};
  if (searchfilter.length >= 3) {
    Session.get('searchfields-' + listname).split(',').forEach(function(item) {
      var field = {};
      field[item] = {$regex: ".*"+ searchfilter +".*", $options: 'i'};
      searchfields.push(field);
    });
    searchFilter['$or'] = searchfields;
  }
  return _.extend(collectionFilter, searchFilter);
};

var getsort = function() {
  var sortorder = 'sortorder-' + listname;
  var sortfield = 'sortfield-' + listname;
  sort = {};
  if (Session.get(sortfield) !== '' && Session.get(sortfield) !== undefined) {
    sort[Session.get(sortfield)] = Session.get(sortorder);
  }
  return sort;
};

Template._collectionList.collection = function () {
  var searchfilter = Session.get('search-' + this.name);
  var collectionFilter = {};
  collectionFilter[Session.get('key-'+this.name)] = Session.get(Session.get('value-'+this.name));

  collectionFilter[Session.get('filterrow-'+listname)] = {$nin: Session.get('selectedfilterchoices-' + listname)};

  var searchfields = [];
  if (searchfilter.length >= 3) {
    this.searchfields.split(',').forEach(function(item) {
      var field = {};
      field[item] = {$regex: ".*"+ searchfilter +".*", $options: 'i'};
      searchfields.push(field);
    });
    collectionFilter['$or'] = searchfields;
  }
  sort = {};
  if (Session.get('sortfield-' + this.name) !== '' && Session.get('sortfield-' + this.name) !== undefined) {
    sort[Session.get('sortfield-' + this.name)] = Session.get('sortorder-' + this.name);
  }
  var results = this.collection.find(collectionFilter, sort);
  if (results.count() > 0) {
    return results;
  }
};

Template._collectionList.rowTemplate = function () {
  return Template[rowTemplate](this);
};

Template._collectionList.showSortOrderDialog = function () {
  return Session.get('showSortOrderDialog');
};

Template._collectionList.sortTemplate = function () {
  return Template[sortTemplate](this);
};

Template._collectionList.showFilterDialog = function () {
  return Session.get('showFilterDialog');
};

Template._collectionList.filterTemplate = function () {
  return Template[filterTemplate](this);
};

Template._collectionList.collectionReady = function() {
  return ! collectionSub.loading();
};

Template._collectionList.events({
  'click .load-more': function(event) {
    event.preventDefault();
    collectionSub.loadNextPage();
  },

  'input .searchfilter': function (event, template) {
    var searchterm = template.find(".searchfilter").value;
    Session.set('search-'+listname, searchterm);
  },

  'click .sortorder': function (event, template) {
    Session.set('showSortOrderDialog', true);
  },

  'click .filter': function (event, tempate) {
    Session.set('showFilterDialog', true);
  }
});