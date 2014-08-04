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
Template.incidents.events({
  'click .new-incident': function (event) {
    openCreateIncidentDialog();
  },
});

Template.incidentrow.isResolved = function(_id) {
    var incident = Incidents.findOne({_id: _id});
    if (incident !== undefined) {
        if (incident.resolved !== undefined) {
            return true;
        }
    }
    return false;
};

Template.incidents.showCreateIncidentDialog = function () {
  return Session.get("showCreateIncidentDialog");
};

var openCreateIncidentDialog = function () {
  Session.set('currentScroll',$(document).scrollTop());
  Session.set("showCreateIncidentDialog", true);
};

Template.createIncidentDialog.rendered = function () {

  $(".incidentgroup").select2({
    placeholder: 'Select groups',
    data: get_groups,
    multiple: true
  });

  if (get_groups().results.length == 1) {
    $(".incidentgroup").val(get_groups().results[0].id).trigger("change");
  }

};

var get_groups = function (query_opts) {
  grouplist = Groups.find({}, {sort: {'name': 1}});
  var groups = [];
  grouplist.forEach(function (group) {
    groups.push({id:group._id, text:group.name});
  });
  return {results: groups};
};

Template.createIncidentDialog.events({
  'click .save': function (event, template) {
    var currentuser = Meteor.users.findOne({_id:Meteor.userId()});
    var subject = template.find(".subject").value;
    var groups = $(".incidentgroup").select2('val');
    // Tickets selector here, or maybe just forward to the incident page and add tickets from there.


    var args = {
      subject: subject,
      groups: groups,
      status: 'open'
    };

    Meteor.call('createIncident', args, function (error, incidentId) {
      if (! error) {
        Router.go('incident', {_id: incidentId});
      } else {
        console.log('CreateIncident Error: ' + error);
      }
    });
    Session.set("showCreateIncidentDialog", false);
  },

  'click .cancel': function () {
    Session.set("showCreateIncidentDialog", false);
  }
});

Template.incidents.incidents_data = function () {
  return {
    listLabel: "Incidents",
    name: 'incidents',
    collection: Incidents,
    collectionFilterKey: '',
    collectionFilterValue: '',
    publication: 'incidents',
    rowtemplate: 'incidentrow',
    perpage: 10,
    searchfields: '_id,subject',
    sorttemplate: 'incidentSortFields',
    filterrow: 'status',
    filtertemplate: 'incidentFilterChoices',
    footerhooks: 'incidentfooter_items'
  };
};

var incident_states = function() {
    states = [
      {
        _id: 'idopen',
        name: 'open',
        icon: 'icon-arrow-down',
        colour: 'bd2c00'
      },
      {
        _id: 'idresolved',
        name: 'resolved',
        icon: 'icon-ok',
        colour: '60b044'
      }
    ];
    return states;
};

Template.incidentFilterChoices.states = function() {
  var statelist = [];
  var states = incident_states();
  states.forEach(function(state) {
    var idx = _.indexOf(Session.get('selectedfilterchoices-incidents'), state.name);
      if (idx != -1) {
        statelist.push(_.extend(state, {selected: 'filterunselected'}));
      } else {
        statelist.push(_.extend(state, {selected: 'filterselected'}));
      }
    });
  return statelist;
};

Template.incidentFilterChoices.events({
  'click .cancel': function () {
    Session.set('showFilterDialog', false);
  },

  'click .filterrow': function (event, template) {
    var states = incident_states();
    var state = _.find(states, function(s) {return s._id == $(event.target).context.id});
    if (state !== undefined) {
      var current_selection = Session.get('selectedfilterchoices-incidents');
      if (_.indexOf(current_selection, state.name) == -1) {
        // Item is not selected, add it
        current_selection = _.extend([], current_selection);
        current_selection.unshift(state.name);
      } else {
        current_selection = _.extend([], current_selection);
        current_selection = _.reject(current_selection, function(el) {return el == state.name;});
      }
      Session.set('selectedfilterchoices-incidents', current_selection);
    }
  }
});

Template.incidentSortFields.events({
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
