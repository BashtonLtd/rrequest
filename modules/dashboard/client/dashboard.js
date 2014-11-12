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

var gridster;

init_gridster = function () {
  $(".gridster ul").gridster({
    widget_margins: [6, 6],
    widget_base_dimensions: [80, 82],
    max_size_x: 12,
    max_size_y: 10,
    min_cols: 12,
    max_cols: 12,
    min_rows: 6,
    serialize_params: function(elem, grid) {
      return {id: elem.attr('id'), position: grid};
    },
    draggable: {
      stop: function(event, ui){
        store_positions(gridster.serialize_changed());
      }
    }
  });

  gridster = $(".gridster ul").gridster().data('gridster');
};

Template.dashboard.helpers({
    showSelectWidgetDialog: function() {
        return Session.get('showSelectWidgetDialog');
    }
});

var openSelectWidgetDialog = function() {
  Session.set('showSelectWidgetDialog', true);
};

Template.dashboard.events({
  'click .add_widget': function(event, template) {
    openSelectWidgetDialog();
  }
});

Template.gridster.events({
  'click .widgetremove': function (event, template) {
    event.preventDefault();
    Meteor.call('removeUserDashboard', {
      id: this._id
    }, function(error, widgetId) {

    });
  }
});

Template.gridster.helpers({
  widgets: function() {
    var widgets = UserDashboard.find({}, {sort: {row: 1}});
    var display_widgets = [];
    widgets.forEach(function(widget) {
      display_widgets.push({
        _id: widget._id,
        row: widget.row,
        col: widget.col,
        sizex: widget.sizex,
        sizey: widget.sizey,
        template_name: widget.template,
      });
    });
    return display_widgets;
  }
});

Template.widget.helpers({
    widget_template: function() {
        return Template[this.template_name];
    },

    widget_data: function() {
        return this;
    }
});

store_positions = function(data) {
  data.forEach(function(widget) {
    UserDashboard.update({_id: widget.id}, {$set: {col: widget.position.col, row: widget.position.row}});
  });
};

Template.selectWidgetDialog.events({
  'click .selectWidgetCancel': function(event, template) {
    Session.set('showSelectWidgetDialog', false);
    Session.set('selected_widget', null);
  },

  'change .widgetlist': function(event, template) {
    console.log(event);
    Session.set('selected_widget', event.target[event.target.selectedIndex].value);
  },

  'click .save': function(event, template) {
    // Get selected widget
    var selected_widget_name = Session.get('selected_widget');
    var selected_widget = _.find(dashboard_widgets, function(item) {
      return item.config_template === selected_widget_name;
    });
    selected_widget.save(event, template);
  }
});

Template.selectWidgetDialog.helpers({
  availablewidgets: function() {
    return dashboard_widgets;
  },

  widget_selected: function(widget) {
    if (Session.get('selected_widget') == widget) {
      return 'selected';
    }
  },

  widget_config: function() {
    if (Session.get('selected_widget') !== undefined && Session.get('selected_widget') != '' && Session.get('selected_widget') !== null) {
      return Template[Session.get('selected_widget')];
    }
    return null;
  }
});
