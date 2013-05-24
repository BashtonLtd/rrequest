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
EventHorizon.on('ticketreply', function(){
  module_enabled = Modules.findOne({name:'email-gateway'}).enabled;
  if (module_enabled) {
    var postedBy = Meteor.users.findOne({_id: this.postedBy});
    if (postedBy !== undefined) {
      if (postedBy.profile.isStaff) {
        Meteor.call('emailgateway_send_ticket_updated_email', {
          ticketId: this.ticketId,
          replyId: this.replyId
        });
      }
    }

  }
});
