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
Meteor.startup(function (){
  // Setup email values
  var site_name = Settings.findOne({name: 'site_name'});
  if (site_name === undefined) {
    site_name = {name: 'site_name', value: 'Rrequest Support'};
  }

  var support_email = Settings.findOne({name: 'support_email'});
  if (support_email === undefined) {
    support_email = {name: 'support_email', value: 'rrequest@invalid.com'};
  }

  EMAIL_FROM = support_email.value;
  Accounts.emailTemplates.siteName = site_name.value;
  Accounts.emailTemplates.from = site_name.value + ' <' + support_email.value + '>';

  // Initialise status collection
  var status_new = TicketStatus.findOne({name: 'new'});
  if (status_new === undefined) {
    TicketStatus.insert({
      name: 'new',
      icon: 'icon-ok-sign',
      colour: '51B948'
    });
  }

  var status_closed = TicketStatus.findOne({name: 'closed'});
  if (status_closed === undefined) {
    TicketStatus.insert({
      name: 'closed',
      icon: 'icon-remove-sign',
      colour: 'B94A48'
    });
  }
});
