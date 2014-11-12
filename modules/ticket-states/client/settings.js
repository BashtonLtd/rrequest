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
var format = function(state) {
  return "<i class='" + state.text + "'></i> " + state.text;
};

var formatSelection = function(state) {
  return state.text;
};

Template.createStateDialog.helpers({
    editStateName: function(state_id) {
        return Session.get('editStateName');
    },

    editStateIcon: function() {
        return Session.get('editStateIcon');
    },

    editStateColour: function() {
        return Session.get('editStateColour');
    },

    error: function() {
        return Session.get('error');
    },

    usercreated: function() {
        return Session.get("selectedStateUserCreated");
    }
});

Template.ticketstatesettings.helpers({
    states: function() {
        return TicketStatus.find({}, {sort: {'name': 1}});
    },

    showCreateStateDialog: function() {
        return Session.get("showCreateStateDialog");
    },

    showDeleteStateDialog: function() {
        return Session.get("showDeleteStateDialog");
    }
});

Template.createStateDialog.rendered = function () {
  $(".iconselect").select2({
    placeholder: 'Select icon',
    data: get_icons,
    formatResult: format,
    formatSelection: formatSelection
  });

  $('#colourpalette').colorPalette()
  .on('selectColor', function(e) {
    $('#iconcolour').val(e.color.replace('#',''));
  });
};

Template.createStateDialog.events({
  'click .cancel': function () {
    Session.set("showCreateStateDialog", false);
  }
});

get_icons = function (query_opts) {
  var iconlist = TicketStateSettings.findOne({});
  var icons = [];
  iconlist.icons.forEach(function(icon) {
    icons.push({id:icon, text:icon});
  })

  return {results: icons.sort()};
};

var openCreateStateDialog = function (state_id) {
  Session.set("selectedStateUserCreated", false);
  Session.set("selectedState", state_id);
  Session.set("editState", false);
  if (state_id) {
    Session.set("editState", true);
    var state = TicketStatus.findOne({_id: state_id})
    if (state.usercreated !== undefined && state.usercreated == true) {
      Session.set("selectedStateUserCreated", true);
    } else {
      Session.set("selectedStateUserCreated", false);
    }
  }
  Session.set("showCreateStateDialog", true);
};

var openDeleteStateDialog = function (state_id) {
  Session.set("selectedState", state_id);
  Session.set("showDeleteStateDialog", true);
};

Template.ticketstatesettings.events({
  'click .save': function (event, template) {

    Session.set("error", false);

    var name = template.find(".name").value;
    var icon = $(".iconselect").select2('val');
    var colour = template.find("#iconcolour").value;

    var proceed = true;
    var errors = [];
    // Check values
    if (name == '') {
      proceed = false;
    } else {
      if (Session.get('editState')) {

      } else {
        name = name.toLowerCase();
        var status = TicketStatus.findOne({name: name});
        if (status !== undefined) {
          proceed = false;
          errors.push("Another state with that name already exists.");
        }
      }
    }
    if (icon == '') {
      proceed = false;
      errors.push("Select an icon.");
    }

    if (colour == '') {
      proceed = false;
    } else {
      var isValid = /^[0-9A-F]{6}$/i.test(colour);
      if (!isValid) {
        proceed = false;
        errors.push("Select or enter a valid colour.");
      }
    }

    if (proceed) {
      if (Session.get('editState')) {
        if (Session.get("selectedStateUserCreated")) {
          TicketStatus.update(
            {_id: Session.get("selectedState")},
            { $set: {
              name: name,
              icon: icon,
              colour: colour
              }
            }
          );
        } else {
          TicketStatus.update(
            {_id: Session.get("selectedState")},
            { $set: {
              icon: icon,
              colour: colour
              }
            }
          );
        }
      } else {
        TicketStatus.insert({
          name: name,
          icon: icon,
          colour: colour,
          usercreated: true
        });
      }
      Session.set('editState', false);
      Session.set("showCreateStateDialog", false);

    } else {
      Session.set("error", errors);
    }
  },

  'click .new-state': function (event, template) {
    // Clear fields session data
    Session.set("editStateName", false);
    Session.set("editStateIcon", false);
    Session.set("editStateColour", false);
    openCreateStateDialog(false);
  },

  'click .edit-state': function (event, template) {
    var ticketstatus = TicketStatus.findOne({_id: this._id});
    if (ticketstatus !== undefined) {
      Session.set("editStateName", ticketstatus.name);
      Session.set("editStateIcon", ticketstatus.icon);
      Session.set("editStateColour", ticketstatus.colour);
    }

    openCreateStateDialog(this._id);
  },

  'click .delete-state': function (evt) {
    openDeleteStateDialog(this._id);
  }
});

ticketstate_settings_page = function(args) {
  args = args || {};

  return {
    name: 'Ticket States',
    template: 'ticketstatesettings'
  };
};

Template.deleteStateDialog.helpers({
    statename: function() {
        var state_id = Session.get("selectedState");
        var state = TicketStatus.findOne({_id:state_id});
        return state !== undefined ? state.name : '';
    }
});

Template.deleteStateDialog.events({
  'click .delete': function (event, template) {
    TicketStatus.remove(Session.get("selectedState"));
    Session.set("showDeleteStateDialog", false);
  },

  'click .cancel': function () {
    Session.set("showDeleteStateDialog", false);
  }
});
