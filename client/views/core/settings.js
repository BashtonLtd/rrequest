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
Template.settings.created = function () {
  var activepage = Session.get('activeSettingsPage');
  if (activepage === undefined) {
    Session.set('activeSettingsPage', "");
  }
};

Template.settings.pagecontent = function() {
  var page = Session.get('activeSettingsPage');
  if(page !== "") {
    return Template[Session.get('activeSettingsPage')]();
  }
};

Template.settings.module_settings_pages = function() {
  var hooks = Hooks.find({hook:'settings_page'});
  var pages = [];

  hooks.forEach(function (hook) {
    var settingspage = window[hook.data]();
    pages.push(settingspage);
  });
  return pages.sort(sortByName);
};

Template.settings.helpers({
  is_active: function(pagename) {
    return Session.get('activeSettingsPage') == pagename;
  }
});

Template.settings.events({
  'click .settings-menu': function (event, template) {
    Session.set("activeSettingsPage", event.toElement.id);
  }
});

Template.moduleactivation.helpers({
  has_depends: function(moduleId) {
    var module = Modules.findOne({_id: moduleId});
    var depends = module.depends;
    var conflicts = module.conflicts;

    if (module !== undefined) {
      var required_depends = get_depends(moduleId);
      var required_conflicts = get_conflicts(moduleId);

      if (required_depends.length > 0 || required_conflicts.length > 0) {
        return true;
      } else {
        // check if this is a depends of another module
        if (get_reverse_depends(moduleId).length > 0) {
          return true;
        } else {
          return false;
        }
      }
    } else {
      return true;
    }
  }
});

var get_reverse_depends = function(moduleId) {
  var module = Modules.findOne({_id: moduleId});
  var all_modules = Modules.find();
  var module_list = {};
  var reverse_depends = [];
  if (module !== undefined) {
    all_modules.forEach(function(mod){
      if (mod.depends !== null) {
        mod.depends.forEach(function(elem, index){
          if (elem == module.name && mod.enabled) {
            reverse_depends.push({name: mod.name});
          }
        });
      }
    });
  }
  return reverse_depends;
};

var get_depends = function(moduleId) {
  var module = Modules.findOne({_id: moduleId});
  var all_modules = Modules.find();
  var module_list = {};
  all_modules.forEach(function(mod){
    module_list[mod.name] = mod.enabled;
  });
  var depends_list = [];
  if (module !== undefined) {
    if (module.depends !== null) {
      module.depends.forEach(function(elem, index){
        if (module_list[elem] === false){
          depends_list.push({name: elem});
        }
      });
    }
  }
  return depends_list;
};

var get_conflicts = function(moduleId) {
  var module = Modules.findOne({_id: moduleId});
  var all_modules = Modules.find();
  var module_list = {};
  all_modules.forEach(function(mod){
    module_list[mod.name] = mod.enabled;
  });
  var conflicts_list = [];
  if (module !== undefined) {
    if (module.conflicts !== null) {
      module.conflicts.forEach(function(elem, index){
        if (module_list[elem] === true){
          conflicts_list.push({name: elem});
        }
      });
    }
  }
  return conflicts_list;
};

Template.moduleactivation.module_depends = function(moduleId) {
  return get_depends(moduleId);
};

Template.moduleactivation.module_conflicts = function(moduleId) {
  return get_conflicts(moduleId);
};

Template.moduleactivation.module_reverse_depends = function(moduleId) {
  return get_reverse_depends(moduleId);
};

Template.moduleactivation.availablemodules = function() {
  return Modules.find({}, {sort: {'name': 1}});
};

Template.moduleactivation.events({
  'click .disable-module': function (event, template) {
    Meteor.call('disableModule', {
      module_id: this._id
    });
  },

  'click .enable-module': function () {
    Meteor.call('enableModule', {
      module_id: this._id
    });
  }
});

Template.general.events({
  'click .general-settings-save': function (event, template) {
    var site_name = template.find(".site_name").value;
    var support_email = template.find(".support_email").value;

    var settings = [
      {name: 'site_name', value: site_name},
      {name: 'support_email', value: support_email}
    ];

    settings.forEach(function(setting) {
      var setting_record = Settings.findOne({name: setting.name});
      if (setting_record === undefined) {
        Settings.insert({
          name: setting.name,
          value: setting.value
        });
      } else {
        Settings.update(
          {_id: setting_record._id},
          {$set: {
            name: setting.name,
            value: setting.value
          }}
        );
      }
    });
  }
});

Template.general.site_name = function() {
  var setting = Settings.findOne({name: 'site_name'});
  if (setting !== undefined) {
    return setting.value;
  }
};

Template.general.support_email = function() {
  var setting = Settings.findOne({name: 'support_email'});
  if (setting !== undefined) {
    return setting.value;
  }
};