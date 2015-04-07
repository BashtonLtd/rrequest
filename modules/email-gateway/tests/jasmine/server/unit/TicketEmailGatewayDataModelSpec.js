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
describe("module:email-gateway", function () {
	it("ticket.set_reply_notified should set date on the correct reply", function () {
		spyOn(Tickets, "insert").and.callFake(function(doc, callback) {
			// simulate async return of id = "1"
			callback(null, "1");
		});
		spyOn(Tickets, "update");
		spyOn(Random, 'id').and.returnValue('1234ABCD');

		var now = new Date();

		// Stub user
		var user = {
			_id: "STUB1234",
			profile: {
				email : "stubuser@email.address",
				isStaff: true
			}
		};

		var ticket = new Ticket(
			null,
			now,
			now,
			null,
			"Ticket 1",
			"new",
			["r1234"],
			["gr1234"],
			[
				{
					_id: "reply0",
					body: "test",
					created: now,
					level: "requester",
					posted_by: "r1234",
					status: "posted",
					type: "reply"
				},
				{
					_id: "reply1",
					body: "test",
					created: now,
					level: "requester",
					posted_by: "r1234",
					status: "posted",
					type: "reply"
				},
				{
					_id: "reply2",
					body: "test",
					created: now,
					level: "requester",
					posted_by: "r1234",
					status: "posted",
					type: "reply"
				}
			],
			true,
			[]
		);
		ticket.insert();

		expect(ticket.replies.length).toEqual(3);
		ticket.set_reply_notified('reply1');
		expect(ticket.replies[0].notified).toEqual(undefined);
		expect(ticket.replies[1].notified).not.toEqual(undefined);
		expect(ticket.replies[2].notified).toEqual(undefined);
		expect(Tickets.update).toHaveBeenCalled();
	});

});
