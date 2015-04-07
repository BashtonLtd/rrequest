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
Object.defineProperty(Ticket.prototype, 'set_reply_notified', {
	enumerable: false,
	writable: false,
	value: function(reply_id) {
		var that = this;
		var now = new Date();
		var replies = that.replies;
		var reply_index = _.indexOf(_.pluck(replies, '_id'), reply_id);

		replies[reply_index].notified = now;

		that.replies = replies;
		that.save();
	}
});
