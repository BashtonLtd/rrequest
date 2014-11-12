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
Template.timeworked_reply_header.helpers({
  reply: function(replyId) {
    var ticket = Tickets.findOne({_id: Session.get('viewticketId')});

    var replies = [];
    ticket.replies.forEach(function(reply){
      if(reply.status == 'posted') {
        replies.push(reply);
      }
    });

    // Fetch replies from other modules
    var hooks = Hooks.find({hook:'ticket_replies'});
    hooks.forEach(function (hook) {
      var ticketreplies = window[hook.data]({ticketId: Session.get('viewticketId')});
      ticketreplies.forEach(function(ticketreply) {
        replies.push(ticketreply);
      });
    });

    var replyIndex = _.indexOf(_.pluck(replies, '_id'), replyId);
    return replies[replyIndex];
  }
});

Template.timeworked_ticket_sidebar.helpers({
  totaltimeworked: function() {

    var ticket = Tickets.findOne({_id: Session.get('viewticketId')});
    var timeworked = 0;
    if (ticket !== undefined) {
      ticket.replies.forEach(function(reply){
        if(reply !== undefined) {
          if(reply.status == 'posted') {
            if (reply.timeworked) {
              timeworked = timeworked + parseInt(reply.timeworked);
            }
          }
        }
      });

      // Fetch replies from other modules
      var hooks = Hooks.find({hook:'ticket_replies'});
      hooks.forEach(function (hook) {
        var ticketreplies = window[hook.data]({ticketId: Session.get('viewticketId')});
        ticketreplies.forEach(function(ticketreply) {
          if (ticketreply.timeworked) {
            timeworked = timeworked + parseInt(ticketreply.timeworked);
          }
        });
      });
    }
    return timeworked;
  }
});

Template.timeworked_reply_form_field.helpers({
  timeworked_initial: function() {
    var ticket = Tickets.findOne({_id: Session.get('viewticketId')});
    if (ticket !== undefined) {
      var replies = [];
      ticket.replies.forEach(function(reply){
        if(reply !== undefined) {
          if(reply.status == 'posted' && reply.type == 'event') {
            replies.push(reply);
          }
        }
      });
      replies.sort(sortByDate);

      if (replies[replies.length-1] !== undefined) {
        var last_event = moment(replies[replies.length-1].created).unix();
        var now = moment(Date.now()).unix();
        var diff = (now - last_event) / 60;
      } else {
        return '';
      }
      if (diff > 240) {
        return '';
      } else {
        return 15 * Math.ceil(diff/15);
      }
    }
  }
})

Template.timeworked_reply_form_field.events({
  'blur #timeworked': function (event, template) {
    template.find("#timeworked").value = 15 * Math.ceil(template.find("#timeworked").value/15);
  }
});

Template.timeworked_groupstatbox.events({
  'click #openoptions': function (event, template) {
    event.preventDefault();
    Session.set('showTimeworkedStatOptionsDialog', true);
  }
});

Template.timeworked_groupstatbox.helpers({
    getDateRange: function() {
        if (Session.get('timeworkedstart') === undefined) {
            var to = new Date();
            to = new Date(to.getFullYear(),
                to.getMonth(),
                to.getDate(),
                23,59,59);
            var from = new Date(to.getTime() - 1000 * 60 * 60 * 24 * 28);
            Session.set('timeworkedstart', from);
            Session.set('timeworkedend', to);
        }
        var range = moment(Session.get('timeworkedstart')).twix(Session.get('timeworkedend'), true);
        return range.format();
    },

    dateclass: function() {
        var rangelength = moment(Session.get('timeworkedstart')).twix(Session.get('timeworkedend'), true).format().length;
        if (rangelength > 16) {
            return 'statboxsubtext-small';
        } else {
            return 'statboxsubtext';
        }
    },

    getTimeworked: function() {
        var timeworked = GroupTimeworked.findOne();

        if (timeworked !== undefined) {
            var hours = parseInt(timeworked.timeworked/60, 10);
            if (hours < 10) {
                hours = '0' + hours;
            }
            var minutes = timeworked.timeworked - (hours * 60);
            if (minutes < 10) {
                minutes = '0' + minutes;
            }
            return hours + ':' + minutes;
        } else {
            return '...';
        }
    },

    showTimeworkedStatOptionsDialog: function() {
        return Session.get('showTimeworkedStatOptionsDialog');
    }
});

Template.timeworkedStatOptionsDialog.rendered = function () {
  var to = new Date();
  var from = new Date(to.getTime() - 1000 * 60 * 60 * 24 * 28);
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
  if (Session.get('timeworkedstart' === undefined)) {
    Session.set('timeworkedstart', from);
    Session.set('timeworkedend', to);
  }
};

Template.timeworkedStatOptionsDialog.events({
  'click .cancel': function () {
    Session.set('showTimeworkedStatOptionsDialog', false);
  },

  'click .update': function (event, template) {
    Session.set('timeworkedstart', Session.get('fromdate'));
    Session.set('timeworkedend', Session.get('todate'));
    Session.set('showTimeworkedStatOptionsDialog', false);
  }
});
