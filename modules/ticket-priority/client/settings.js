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
//var settings = TicketPrioritySettings.findOne();

Template.ticketprioritysettings.priorities = function () {
  var priorities = TicketPrioritySettings.findOne().priorities;
  return priorities;
};

Template.ticketprioritysettings.max_response_time = function () {
  var settings = TicketPrioritySettings.findOne();
  var timevalue = settings.max_response_time;
  if (settings.time_unit == 'days') {
    timevalue = timevalue / 24 / 60;
  } else if (settings.time_unit == 'hours') {
    timevalue = timevalue / 60;
  }
  return timevalue;
};

Template.ticketprioritysettings.selectedtimeunit = function (unit) {
  var settings = TicketPrioritySettings.findOne();
  if (unit == settings.time_unit) {
    return 'selected';
  }
};

Template.priorityrow.isDefault = function() {
  var settings = TicketPrioritySettings.findOne();
  if (settings.default_priority == this.priority) {
    return 'highlight';
  }
};

Template.priorityrow.isLast = function(priority) {
  var settings = TicketPrioritySettings.findOne();
  if (priority == settings.priorities.length) {
    return true;
  }
};

Template.ticketprioritysettings.events({
  'click .prioritytimeunit': function (event, template) {
    event.preventDefault();
    var timevalue = template.find(".maxtime").value;
    var timeunit = template.find(".timeunits").value;
    
    if (timeunit == 'days') {
      timevalue = timevalue * 24 * 60;
    } else if (timeunit == 'hours') {
      timevalue = timevalue * 60;
    }
    var settings = TicketPrioritySettings.findOne();
    TicketPrioritySettings.update(
      {_id: settings._id},
      {
        $set: {max_response_time: timevalue, time_unit: timeunit}
      }
    );
  },

  'click .set-default': function (event, template) {
    var settings = TicketPrioritySettings.findOne();
    TicketPrioritySettings.update(
      {_id: settings._id},
      {
        $set: {default_priority: this.priority}
      }
    );
  },

  'click .delete-priority': function (event, template) {
    var settings = TicketPrioritySettings.findOne();
    var new_priorities = settings.priorities;
    new_priorities.splice(-1, 1);

    if (settings.default_priority > settings.priorities.length) {
      TicketPrioritySettings.update(
      {_id: settings._id},
      {
        $set: {priorities: new_priorities, default_priority: settings.priorities.length}
      }
    );
    } else {
      TicketPrioritySettings.update(
      {_id: settings._id},
      {
        $set: {priorities: new_priorities}
      }
    );
    }
  }
});

Template.priorityrow.rendered = function() {
  var settings = TicketPrioritySettings.findOne();
  var priorities = settings.priorities;

  priorities.forEach(function(item) {
    if ($('#slider' + item.priority + '-slider').length === 0) {
      $('#slider' + item.priority).unbind();
      $('#output' + item.priority).html(format_time_span(item.time));

      $('#slider' + item.priority).simpleSlider({
        range: [5,settings.max_response_time],
        step: 5,
        highlight: 'true'
      });
      $('#slider' + item.priority).simpleSlider('setValue', item.time);
      $('#slider' + item.priority).bind("slider:release", function (event, data) {
        // save state here
        priorities[item.priority - 1].time = data.value;
        TicketPrioritySettings.update(
          {_id: settings._id},
          {
            $set: {priorities: priorities}
          }
        );
      });

      $('#slider' + item.priority).bind("slider:checkposition", function (event, data) {
        if (priorities[item.priority] !== undefined || priorities[item.priority-2] !== undefined) {
          if (priorities[item.priority] !== undefined && data.value >= priorities[item.priority].time) {
            $('#slider' + item.priority).data('shouldmove', false);
            $('#slider' + item.priority).data('targetvalue', +priorities[item.priority].time - 5);
            $('#slider' + item.priority).simpleSlider('setValue', +priorities[item.priority].time - 5);
          } else if (priorities[item.priority-2] !== undefined && data.value <= priorities[item.priority-2].time) {
            $('#slider' + item.priority).data('shouldmove', false);
            $('#slider' + item.priority).data('targetvalue', +priorities[item.priority-2].time + 5);
            $('#slider' + item.priority).simpleSlider('setValue', +priorities[item.priority-2].time + 5);
          } else {
            $('#slider' + item.priority).data('shouldmove', true);
          }
        } else {
          $('#slider' + item.priority).data('shouldmove', true);
        }
      });

      $('#slider' + item.priority).bind("slider:ready slider:changed", function (event, data) {
        $('#output' + item.priority).html(format_time_span(data.value));
        priorities[item.priority - 1].time = data.value;
      });
    }
  });
};

format_time_span = function(totalminutes) {
  var days = 0;
  var hours = 0;
  var minutes = 0;
  totalminutes = parseInt(totalminutes, 10);

  days = parseInt(moment.duration(totalminutes, 'minutes').asDays(), 10);
  totalminutes = totalminutes - (days * 24 * 60);
  hours = parseInt(moment.duration(totalminutes, 'minutes').asHours(), 10);
  totalminutes = totalminutes - (hours * 60);
  minutes = parseInt(totalminutes, 10);

  var output = '';
  if (days > 0) {
    if (days == 1) {
      output = output + days + ' day';
    } else {
      output = output + days + ' days';
    }
  }
  if (hours > 0) {
    if (hours == 1) {
      output = output + ' ' + hours + ' hour';
    } else {
      output = output + ' ' + hours + ' hours';
    }
  }
  if (minutes > 0) {
    output = output + ' ' + minutes + ' minutes';
  }
  return output;
};


Template.ticketprioritysettings.events({
  'click .new-priority': function (event, template) {
    var settings = TicketPrioritySettings.findOne();
    var priorities = settings.priorities;

    var last_priority = priorities[priorities.length-1].priority;
    var last_time = priorities[priorities.length-1].time;
    var max_time = settings.max_response_time;

    if (last_time >= max_time) {

    } else {
      var new_time = parseInt(((+max_time-+last_time)/2) + (+last_time), 10);
      TicketPrioritySettings.update(
        {_id: settings._id},
        {
          $push: {priorities: {priority:+last_priority+1, time: new_time}}
        }
      );
    }
  },

  'click .delete-priority': function (evt) {
    //openDeleteStateDialog(this._id);
  }
});

ticketpriority_settings_page = function(args) {
  args = args || {};

  return {
    name: 'Ticket Priorities',
    template: 'ticketprioritysettings'
  };
};