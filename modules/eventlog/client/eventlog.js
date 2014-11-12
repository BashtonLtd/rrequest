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
var levels = ['ERROR', 'WARNING', 'INFO', 'DEBUG'];

Template.eventlog.events({
  'click .load-more': function (event) {
    event.preventDefault();
    eventListSub.loadNextPage();
  }
});

Template.eventlog.helpers({
  eventsReady: function() {
    return ! eventListSub.loading();
  }
});

Template.eventlog.created = function() {
  eventListSub = Meteor.subscribeWithPagination(
  'eventlog',
  {'created': -1},
  getFilter,
  25);

  Session.set('selected_filter_levels', []);
  Session.set('event_search_filter', '');
};

var getFilter = function() {
  var start = new Date(Session.get('fromdate'));
  var end = new Date(Session.get('todate'));
  var searchfilter = Session.get('event_search_filter');

  if (searchfilter === '' || searchfilter === undefined) {
    return {
      created: {"$gte": start, "$lt": end},
      level: {$nin: Session.get('selected_filter_levels')}
    }
  } else {
    return {
      created: {"$gte": start, "$lt": end},
      level: {$nin: Session.get('selected_filter_levels')},
      $or: [
        {message: {$regex: ".*"+ Session.get('event_search_filter') +".*", $options: 'i'}}
      ]
    }
  }
};

Template.eventfilter.helpers({
    levels: function() {
        var levellist = [];
        levels.forEach(function(level) {
            var idx = _.indexOf(Session.get('selected_filter_levels'), level);
            if (idx != -1) {
                levellist.push({name: level, selected: 'filterunselected'});
            } else {
                levellist.push({name: level, selected: 'filterselected'});
            }
        });
        return levellist;
    }
});

Template.eventfilter.events({
  'click .filterrow': function (event, template) {
    var level = $(event.target).html();
    if (level != '') {
      var current_selection = Session.get('selected_filter_levels');
      if (_.indexOf(current_selection, level) == -1) {
        // Item is not selected
        current_selection = _.extend([], current_selection);
        current_selection.unshift(level);
      } else {
        current_selection = _.extend([], current_selection);
        current_selection = _(current_selection).reject(function(el) {return el == level;});
      }
      Session.set('selected_filter_levels', current_selection);
    }
  },

  'input .searchfilter': function (event, template) {
    var searchterm = template.find(".searchfilter").value;
    Session.set('event_search_filter', searchterm);
  }
});

Template.eventcalendarfilter.rendered = function () {
  if (Session.get('todate') === undefined) {
    var to = new Date();
  } else {
    var to = new Date(Session.get('todate'));
  }
  if (Session.get('fromdate') === undefined) {
    var from = new Date(to.getTime() - 1000 * 60 * 60 * 24);
  } else {
    var from = new Date(Session.get('fromdate'));
  }

  Session.set('fromdate', from);
  Session.set('todate', to);

  var self = this;
  $('#multi-calendar').DatePicker({
    mode: 'range',
    inline: true,
    calendars: 2,
    lastSel: this.lastSel,
    date: [from, to],
    onChange: function(dates,el) {
      // update the range session variables

      self.lastSel = $('#multi-calendar').DatePickerGetOptions().lastSel;

      if (Session.get('fromdate') != dates[0]) {
        Session.set('fromdate', dates[0]);
      }
      if (Session.get('todate') != dates[1]) {
        Session.set('todate', dates[1]);
      }
    }
  });

  this.lastSel = $('#multi-calendar').DatePickerGetOptions().lastSel;
};

Template.eventlist.helpers({
    eventitems: function() {
        var events = Eventlog.find(
            {},
            {sort: {'created': -1}, limit: eventListSub.limit()}
        );
        return events;
    },

    getLabel: function(level) {
        if(levels.indexOf(level) != -1) {
            return level;
        } else {
            return 'INFO';
        }
    },

    getLabelClass: function(level) {
        if (level == 'ERROR') {
            return 'label-important';
        } else if (level == 'WARNING') {
            return 'label-warning';
        } else if (level == 'INFO') {
            return 'label-info';
        } else if (level == 'DEBUG') {
            return 'label-inverse'
        } else {
            return ''
        }
    },

    getTag: function() {
        return this;
    },

    getTagClass: function() {
        return '';
    }
});
