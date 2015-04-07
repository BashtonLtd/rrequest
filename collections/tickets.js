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
Tickets = new Meteor.Collection("tickets", {
    transform: function(doc) {
        var defaultFields = Ticket.defaultFields();
        var extrafields = [];

        _.difference(Object.keys(doc), defaultFields).forEach(function(extra) {
            extrafields.push({name:extra, value:doc[extra]});
        });


        // This should be removed when group field has been renamed to group, new Ticket call should use doc.groups and defaultFields method should remove group
        if (doc.groups !== undefined) {
            doc.group = doc.groups;
        }

        return new Ticket(doc._id, doc.created, doc.modified, doc.resolved, doc.subject, doc.status, doc.requesters, doc.group, doc.replies, doc.isVisible, extrafields);
    }
});

TicketStatus = new Meteor.Collection("ticketstatus");
