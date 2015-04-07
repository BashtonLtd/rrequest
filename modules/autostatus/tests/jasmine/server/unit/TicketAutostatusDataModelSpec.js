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
"use strict";
describe("module:autostatus", function () {
	it("ticket should be created with original_status field", function () {
		spyOn(Tickets, "insert").and.callFake(function(doc, callback) {
			// simulate async return of id = "1"
			callback(null, "1");
		});
		var now = new Date();
		var ticket = new Ticket(null, now, now, null, "Ticket 1", "new", ["r1234"], ["gr1234"], [], true, [{name: 'original_status', value: 'new'}]);

		expect(ticket.original_status).toBe('new');
		ticket.insert();

		// id should be set
		expect(ticket.id).toEqual("1");
		expect(Tickets.insert).toHaveBeenCalledWith({
			subject: "Ticket 1",
			created: now,
			modified: now,
			resolved: null,
			status: "new",
			requesters: ["r1234"],
			groups: ["gr1234"],
			replies: [],
			isVisible: true,
			original_status: 'new'
		}, jasmine.any(Function));
	});
});
