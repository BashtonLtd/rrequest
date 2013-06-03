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
URLROOT = 'http://127.0.0.1:3000/';

//EMAIL_FROM = 'rrequest@rrequest.com';
EMAIL_FROM = 'david@section19.co.uk';
process.env.MAIL_URL = 'smtp://127.0.0.1/';

Meteor.startup(function (){
  // Initialise status collection
  var status_new = TicketStatus.findOne({name: 'new'});
  if (status_new === undefined) {
    TicketStatus.insert({
      name: 'new'
    });
  }

  var status_closed = TicketStatus.findOne({name: 'closed'});
  if (status_closed === undefined) {
    TicketStatus.insert({
      name: 'closed'
    });
  }
});
