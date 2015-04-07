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

// Tests needed for tickets
//
// create by requester has requester set correctly
// don't allow staff members to be added to requesters

"use strict";
describe("core:ticket", function () {
	it("ticket should be created with all basic fields", function () {
		spyOn(Tickets, "insert").and.callFake(function(doc, callback) {
			// simulate async return of id = "1"
			callback(null, "1");
		});

		var now = new Date();
		var ticket = new Ticket(null, now, now, null, "Ticket 1", "new", ["r1234"], ["gr1234"], [], true, []);

		expect(ticket.subject).toBe("Ticket 1");
		expect(ticket.status).toBe("new");
		expect(ticket.requesters[0]).toBe("r1234");
		expect(ticket.groups[0]).toBe("gr1234");
		expect(ticket.replies.length).toBe(0);

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
		}, jasmine.any(Function));
	});

	it("ticket should be able to be deleted", function () {
		spyOn(Tickets, "insert").and.callFake(function(doc, callback) {
			// simulate async return of id = "1"
			callback(null, "1");
		});
		spyOn(Tickets, "remove");
		var now = new Date();
		var ticket = new Ticket(null, now, now, null, "Ticket 1", "new", ["r1234"], ["gr1234"], [], true, []);

		expect(ticket.subject).toBe("Ticket 1");
		expect(ticket.status).toBe("new");
		expect(ticket.requesters[0]).toBe("r1234");
		expect(ticket.groups[0]).toBe("gr1234");
		expect(ticket.replies.length).toBe(0);

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
		}, jasmine.any(Function));

		ticket.remove();

		expect(Tickets.remove).toHaveBeenCalled();
	});

	it("ticket should be created with id field if specified", function () {
		spyOn(Tickets, "insert").and.callFake(function(doc, callback) {
			// simulate async return of id = "1"
			callback(null, "1");
		});
		var now = new Date();
		var ticket = new Ticket(99, now, now, null, "Ticket 1", "new", ["r1234"], ["gr1234"], [], true, []);

		expect(ticket.id).toBe(99);
		expect(ticket.subject).toBe("Ticket 1");
		expect(ticket.status).toBe("new");
		expect(ticket.requesters[0]).toBe("r1234");
		expect(ticket.groups[0]).toBe("gr1234");
		expect(ticket.replies.length).toBe(0);

		ticket.insert();

		// id should be set
		expect(ticket.id).toEqual("1");
		expect(Tickets.insert).toHaveBeenCalledWith({
			_id: 99,
			subject: "Ticket 1",
			created: now,
			modified: now,
			resolved: null,
			status: "new",
			requesters: ["r1234"],
			groups: ["gr1234"],
			replies: [],
			isVisible: true,
		}, jasmine.any(Function));
	});

	it("ticket should be created with an additional field", function () {
		// add extra field
		Object.defineProperty(Ticket.prototype, 'extra1', {
			get: function() {
				return this._extra1;
			},
			set: function(value) {
				this._extra1 = value;
			},
			enumerable: true,
			configurable: true
		});

		spyOn(Tickets, "insert").and.callFake(function(doc, callback) {
			// simulate async return of id = "2"
			callback(null, "2");
		});

		var now = new Date();
		var ticket = new Ticket(null, now, now, null, "Ticket 2", "new", ["r1234"], ["gr1234"], [], true, [{name: 'extra1', value: 'extra1value'}]);

		expect(ticket.subject).toBe("Ticket 2");
		expect(ticket.status).toBe("new");
		expect(ticket.requesters[0]).toBe("r1234");
		expect(ticket.groups[0]).toBe("gr1234");
		expect(ticket.replies.length).toBe(0);
		expect(ticket.extra1).toBe("extra1value");

		ticket.insert();

		// id should be set
		expect(ticket.id).toEqual("2");
		expect(Tickets.insert).toHaveBeenCalledWith({
			subject: "Ticket 2",
			created: now,
			modified: now,
			resolved: null,
			status: "new",
			requesters: ["r1234"],
			groups: ["gr1234"],
			replies: [],
			isVisible: true,
			extra1: 'extra1value'
		}, jasmine.any(Function));

		delete Ticket.prototype.extra1;
	});

	it("ticket should be created with all additional fields", function () {
		// add extra fields
		Object.defineProperty(Ticket.prototype, 'extra2', {
			get: function() {
				return this._extra2;
			},
			set: function(value) {
				this._extra2 = value;
			},
			enumerable: true,
			configurable: true
		});

		Object.defineProperty(Ticket.prototype, 'extra3', {
			get: function() {
				return this._extra3;
			},
			set: function(value) {
				this._extra3 = value;
			},
			enumerable: true,
			configurable: true
		});

		spyOn(Tickets, "insert").and.callFake(function(doc, callback) {
			// simulate async return of id = "2"
			callback(null, "2");
		});

		var now = new Date();
		var ticket = new Ticket(null, now, now, null, "Ticket 2", "new", ["r1234"], ["gr1234"], [], true, [{name: 'extra2', value: 'extra2value'}, {name: 'extra3', value: 'extra3value'}]);

		expect(ticket.subject).toBe("Ticket 2");
		expect(ticket.status).toBe("new");
		expect(ticket.requesters[0]).toBe("r1234");
		expect(ticket.groups[0]).toBe("gr1234");
		expect(ticket.replies.length).toBe(0);
		expect(ticket.extra2).toBe("extra2value");
		expect(ticket.extra3).toBe("extra3value");

		ticket.insert();

		// id should be set
		expect(ticket.id).toEqual("2");
		expect(Tickets.insert).toHaveBeenCalledWith({
			subject: "Ticket 2",
			created: now,
			modified: now,
			resolved: null,
			status: "new",
			requesters: ["r1234"],
			groups: ["gr1234"],
			replies: [],
			isVisible: true,
			extra2: 'extra2value',
			extra3: 'extra3value'
		}, jasmine.any(Function));
		delete Ticket.prototype.extra2;
		delete Ticket.prototype.extra3;
	});

	it("ticket should be saved properly after editting", function () {
		spyOn(Tickets, "insert").and.callFake(function(doc, callback) {
			// simulate async return of id = "1"
			callback(null, "1");
		});
		spyOn(Tickets, "update");

		var now = new Date();
		var ticket = new Ticket(null, now, now, null, "Ticket 1", "new", ["r1234"], ["gr1234"], [], true, []);

		expect(ticket.subject).toBe("Ticket 1");
		expect(ticket.status).toBe("new");
		expect(ticket.requesters[0]).toBe("r1234");
		expect(ticket.groups[0]).toBe("gr1234");
		expect(ticket.replies.length).toBe(0);

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
		}, jasmine.any(Function));

		ticket.subject = "New name";
		ticket.save();

		expect(ticket.subject).toBe("New name");
		expect(Tickets.update).toHaveBeenCalledWith(
			'1',
			{ $set: {
				created : now,
				modified : now,
				resolved: null,
				subject : 'New name',
				status : 'new',
				requesters : ['r1234'],
				groups : ['gr1234'],
				replies : [],
				isVisible : true
			}}
		);

	});

	it("ticket should set resolved date when ticket status set to closed", function () {
		spyOn(Tickets, "insert").and.callFake(function(doc, callback) {
			// simulate async return of id = "2"
			callback(null, "2");
		});

		var now = new Date();
		var ticket = new Ticket(null, now, now, null, "Ticket 2", "new", ["r1234"], ["gr1234"], [], true, []);

		expect(ticket.subject).toBe("Ticket 2");
		expect(ticket.status).toBe("new");
		expect(ticket.requesters[0]).toBe("r1234");
		expect(ticket.groups[0]).toBe("gr1234");
		expect(ticket.replies.length).toBe(0);

		ticket.insert();

		var resolved_before = ticket.resolved;
		ticket.status = 'closed';
		expect(ticket.resolved).not.toBe(resolved_before);

		delete Ticket.prototype.extra1;
});


	it("ticket.insert_event should add event to the ticket", function () {
		spyOn(Tickets, "insert").and.callFake(function(doc, callback) {
			// simulate async return of id = "1"
			callback(null, "1");
		});
		spyOn(Tickets, "update");
		spyOn(Random, 'id').and.returnValue('1234ABCD');

		var now = new Date();
		var ticket = new Ticket(null, now, now, null, "Ticket 1", "new", ["r1234"], ["gr1234"], [], true, []);
		ticket.insert();

		var event_reply = ticket.insert_event({
			created: now,
			user: {id:'u1234', email:'Test User'},
			body: 'This is the event body',
			update: true
		});

		expect(Tickets.update).toHaveBeenCalledWith(
			'1',
			{ $set: {
				created : now,
				modified : now,
				resolved: null,
				subject : 'Ticket 1',
				status : 'new',
				requesters : ['r1234'],
				groups : ['gr1234'],
				replies : [{
					_id : '1234ABCD',
					posted_by : { id : 'u1234', email : 'Test User' },
					status : 'posted',
					type : 'event',
					body : 'This is the event body',
					level : 'system',
					created : now
				}],
				isVisible : true
			}}
		);

		expect(ticket.replies[0].body).toEqual("This is the event body");
		expect(ticket.replies[0].status).toEqual("posted");
		expect(ticket.replies[0].level).toEqual("system");

	});

	it("ticket.insert_event should set posted_by to system if not supplied", function () {
		spyOn(Tickets, "insert").and.callFake(function(doc, callback) {
			// simulate async return of id = "1"
			callback(null, "1");
		});
		spyOn(Tickets, "update");
		spyOn(Random, 'id').and.returnValue('1234ABCD');

		var now = new Date();
		var ticket = new Ticket(null, now, now, null, "Ticket 1", "new", ["r1234"], ["gr1234"], [], true, []);
		ticket.insert();

		var event_reply = ticket.insert_event({
			created: now,
			body: 'This is the event body',
			update: true
		});

		expect(ticket.replies[0].body).toEqual("This is the event body");
		expect(ticket.replies[0].created).toEqual(now);
		expect(ticket.replies[0].posted_by).toEqual({ id : '', email : 'System' });
		expect(ticket.replies[0].status).toEqual("posted");
		expect(ticket.replies[0].level).toEqual("system");

	});

	it("ticket.insert_event should set created to if not supplied", function () {
		spyOn(Tickets, "insert").and.callFake(function(doc, callback) {
			// simulate async return of id = "1"
			callback(null, "1");
		});
		spyOn(Tickets, "update");
		spyOn(Random, 'id').and.returnValue('1234ABCD');

		var now = new Date();
		var ticket = new Ticket(null, now, now, null, "Ticket 1", "new", ["r1234"], ["gr1234"], [], true, []);
		ticket.insert();

		var event_reply = ticket.insert_event({
			body: 'This is the event body',
			update: true
		});

		expect(ticket.replies[0].body).toEqual("This is the event body");
		expect(ticket.replies[0].created).not.toBe(undefined);
		expect(ticket.replies[0].posted_by).toEqual({ id : '', email : 'System' });
		expect(ticket.replies[0].status).toEqual("posted");
		expect(ticket.replies[0].level).toEqual("system");

	});

	it("ticket.insert_event only return reply if update is false", function () {
		spyOn(Tickets, "insert").and.callFake(function(doc, callback) {
			// simulate async return of id = "1"
			callback(null, "1");
		});
		spyOn(Tickets, "update");
		spyOn(Random, 'id').and.returnValue('1234ABCD');

		var now = new Date();
		var ticket = new Ticket(null, now, now, null, "Ticket 1", "new", ["r1234"], ["gr1234"], [], true, []);
		ticket.insert();

		var event_reply = ticket.insert_event({
			body: 'This is the event body',
			update: false
		});

		expect(event_reply.body).toEqual("This is the event body");
		expect(event_reply.created).not.toBe(undefined);
		expect(event_reply.posted_by).toEqual({ id : '', email : 'System' });
		expect(event_reply.status).toEqual("posted");
		expect(event_reply.level).toEqual("system");

		expect(Tickets.update).not.toHaveBeenCalled();
	});

	it("ticket.create_reply should add reply to ticket as staff", function () {
		spyOn(Tickets, "insert").and.callFake(function(doc, callback) {
			// simulate async return of id = "1"
			callback(null, "1");
		});
		spyOn(Tickets, "update");
		spyOn(Random, 'id').and.returnValue('1234ABCD');

		var now = new Date();
		var ticket = new Ticket(null, now, now, null, "Ticket 1", "new", ["r1234"], ["gr1234"], [], true, []);
		ticket.insert();

		// Stub user
		var user = {
			_id: "STUB1234",
			profile: {
				email : "stubuser@email.address",
				isStaff: true
			}
		};

		var replyId = ticket.create_reply({
			user: user,
			reply: {
				body: "This is the reply body.",
				status: 'posted'
			}
		});

		expect(ticket.replies[0].body).toEqual("This is the reply body.");
		expect(ticket.replies[0].created).not.toBe(undefined);
		expect(ticket.replies[0].posted_by).toEqual({ id : 'STUB1234', email : 'stubuser@email.address' });
		expect(ticket.replies[0].status).toEqual("posted");
		expect(ticket.replies[0].level).toEqual("staff");

		expect(Tickets.update).toHaveBeenCalled();
	});

	it("ticket.create_reply should add reply to ticket as a requester", function () {
		spyOn(Tickets, "insert").and.callFake(function(doc, callback) {
			// simulate async return of id = "1"
			callback(null, "1");
		});
		spyOn(Tickets, "update");
		spyOn(Random, 'id').and.returnValue('1234ABCD');

		var now = new Date();
		var ticket = new Ticket(null, now, now, null, "Ticket 1", "new", ["r1234"], ["gr1234"], [], true, []);
		ticket.insert();

		// Stub user
		var user = {
			_id: "STUB1234",
			profile: {
				email : "stubuser@email.address",
				isStaff: false
			}
		};

		var replyId = ticket.create_reply({
			user: user,
			reply: {
				body: "This is the reply body.",
				status: 'posted'
			}
		});

		expect(ticket.replies[0].body).toEqual("This is the reply body.");
		expect(ticket.replies[0].created).not.toBe(undefined);
		expect(ticket.replies[0].posted_by).toEqual({ id : 'STUB1234', email : 'stubuser@email.address' });
		expect(ticket.replies[0].status).toEqual("posted");
		expect(ticket.replies[0].level).toEqual("requester");

		expect(Tickets.update).toHaveBeenCalled();
	});

	it("ticket.create_reply should set created if passed in", function () {
		spyOn(Tickets, "insert").and.callFake(function(doc, callback) {
			// simulate async return of id = "1"
			callback(null, "1");
		});
		spyOn(Tickets, "update");
		spyOn(Random, 'id').and.returnValue('1234ABCD');

		var now = new Date();
		var ticket = new Ticket(null, now, now, null, "Ticket 1", "new", ["r1234"], ["gr1234"], [], true, []);
		ticket.insert();

		// Stub user
		var user = {
			_id: "STUB1234",
			profile: {
				email : "stubuser@email.address",
				isStaff: true
			}
		};

		var replyId = ticket.create_reply({
			user: user,
			created: now,
			reply: {
				body: "This is the reply body.",
				status: 'posted'
			}
		});

		expect(ticket.replies[0].body).toEqual("This is the reply body.");
		expect(ticket.replies[0].created).toBe(now);
		expect(ticket.replies[0].posted_by).toEqual({ id : 'STUB1234', email : 'stubuser@email.address' });
		expect(ticket.replies[0].status).toEqual("posted");
		expect(ticket.replies[0].level).toEqual("staff");

		expect(Tickets.update).toHaveBeenCalled();
	});

	it("ticket.create_reply should increase reply count", function () {
		spyOn(Tickets, "insert").and.callFake(function(doc, callback) {
			// simulate async return of id = "1"
			callback(null, "1");
		});
		spyOn(Tickets, "update");
		spyOn(Random, 'id').and.returnValue('1234ABCD');

		var now = new Date();
		var ticket = new Ticket(null, now, now, null, "Ticket 1", "new", ["r1234"], ["gr1234"], [], true, []);
		ticket.insert();

		// Stub user
		var user = {
			_id: "STUB1234",
			profile: {
				email : "stubuser@email.address",
				isStaff: true
			}
		};

		var replyId = ticket.create_reply({
			user: user,
			created: now,
			reply: {
				body: "This is the reply body.",
				status: 'posted'
			}
		});

		replyId = ticket.create_reply({
			user: user,
			created: now,
			reply: {
				body: "This is the reply body.",
				status: 'posted'
			}
		});

		expect(ticket.replies.length).toEqual(2);

		expect(Tickets.update).toHaveBeenCalled();
	});

	it("ticket.create_reply should updated the modified time of the ticket", function () {
		spyOn(Tickets, "insert").and.callFake(function(doc, callback) {
			// simulate async return of id = "1"
			callback(null, "1");
		});
		spyOn(Tickets, "update");
		spyOn(Random, 'id').and.returnValue('1234ABCD');

		var now = new Date();
		var createtime = new Date(2015, 0, 1, 0, 0, 0, 0);
		var ticket = new Ticket(null, createtime, createtime, null, "Ticket 1", "new", ["r1234"], ["gr1234"], [], true, []);
		ticket.insert();

		// Stub user
		var user = {
			_id: "STUB1234",
			profile: {
				email : "stubuser@email.address",
				isStaff: true
			}
		};

		var replyId = ticket.create_reply({
			user: user,
			created: now,
			reply: {
				body: "This is the reply body.",
				status: 'posted'
			}
		});

		replyId = ticket.create_reply({
			user: user,
			created: now,
			reply: {
				body: "This is the reply body.",
				status: 'posted'
			}
		});

		expect(ticket.modified).toEqual(now);

		expect(Tickets.update).toHaveBeenCalled();
	});

	it("ticket.create_reply should updated the modified time of the ticket", function () {
		spyOn(Tickets, "insert").and.callFake(function(doc, callback) {
			// simulate async return of id = "1"
			callback(null, "1");
		});
		spyOn(Tickets, "update");
		spyOn(Random, 'id').and.returnValue('1234ABCD');

		var now = new Date();
		var createtime = new Date(2015, 0, 1, 0, 0, 0, 0);
		var ticket = new Ticket(null, createtime, createtime, null, "Ticket 1", "new", ["r1234"], ["gr1234"], [], true, []);
		ticket.insert();

		// Stub user
		var user = {
			_id: "STUB1234",
			profile: {
				email : "stubuser@email.address",
				isStaff: true
			}
		};

		var replyId = ticket.create_reply({
			user: user,
			created: now,
			reply: {
				body: "This is the reply body.",
				status: 'posted'
			}
		});

		replyId = ticket.create_reply({
			user: user,
			created: now,
			reply: {
				body: "This is the reply body.",
				status: 'posted'
			}
		});

		expect(ticket.modified).toEqual(now);

		expect(Tickets.update).toHaveBeenCalled();
	});

	it("ticket.create_reply should call create_event_log", function () {
		spyOn(Tickets, "insert").and.callFake(function(doc, callback) {
			// simulate async return of id = "1"
			callback(null, "1");
		});
		spyOn(Tickets, "update");
		spyOn(Random, 'id').and.returnValue('1234ABCD');
		create_event_log = jasmine.createSpy('create_event_log() spy').and.callFake(function(args) {
			return true;
		});

		var now = new Date();
		var createtime = new Date(2015, 0, 1, 0, 0, 0, 0);
		var ticket = new Ticket(null, createtime, createtime, null, "Ticket 1", "new", ["r1234"], ["gr1234"], [], true, []);
		ticket.insert();

		// Stub user
		var user = {
			_id: "STUB1234",
			profile: {
				email : "stubuser@email.address",
				isStaff: true
			}
		};

		var replyId = ticket.create_reply({
			user: user,
			created: now,
			reply: {
				body: "This is the reply body.",
				status: 'posted'
			}
		});

		expect(create_event_log).toHaveBeenCalled();
		expect(Tickets.update).toHaveBeenCalled();
	});

	it("ticket.create_reply should not change status to new if staff reply", function () {
		spyOn(Tickets, "insert").and.callFake(function(doc, callback) {
			// simulate async return of id = "1"
			callback(null, "1");
		});
		spyOn(Tickets, "update");
		spyOn(Random, 'id').and.returnValue('1234ABCD');

		var now = new Date();
		var ticket = new Ticket(null, now, now, null, "Ticket 1", "in progress", ["r1234"], ["gr1234"], [], true, []);
		ticket.insert();

		// Stub user
		var user = {
			_id: "STUB1234",
			profile: {
				email : "stubuser@email.address",
				isStaff: true
			}
		};

		var replyId = ticket.create_reply({
			user: user,
			reply: {
				body: "This is the reply body.",
				status: 'posted'
			}
		});

		expect(ticket.status).toEqual("in progress");

		expect(Tickets.update).toHaveBeenCalled();
	});

	it("ticket.create_reply should change status to new if requester reply", function () {
		spyOn(Tickets, "insert").and.callFake(function(doc, callback) {
			// simulate async return of id = "1"
			callback(null, "1");
		});
		spyOn(Tickets, "update");
		spyOn(Random, 'id').and.returnValue('1234ABCD');

		var now = new Date();
		var ticket = new Ticket(null, now, now, null, "Ticket 1", "new", ["r1234"], ["gr1234"], [], true, []);
		ticket.insert();

		// Stub user
		var user = {
			_id: "STUB1234",
			profile: {
				email : "stubuser@email.address",
				isStaff: false
			}
		};

		var replyId = ticket.create_reply({
			user: user,
			reply: {
				body: "This is the reply body.",
				status: 'posted'
			}
		});

		expect(ticket.status).toEqual("new");

		expect(Tickets.update).toHaveBeenCalled();
	});

	it("ticket.add_requester should not add duplicates", function () {
		spyOn(Tickets, "insert").and.callFake(function(doc, callback) {
			// simulate async return of id = "1"
			callback(null, "1");
		});
		spyOn(Tickets, "update");

		var now = new Date();
		var ticket = new Ticket(null, now, now, null, "Ticket 1", "new", ["r1234"], ["gr1234"], [], true, []);
		ticket.insert();

		// Stub user
		var user = {
			_id: "STUB1234",
			profile: {
				email : "stubuser@email.address",
				isStaff: false
			}
		};

		ticket.add_requester(user, false);
		expect(ticket.requesters.length).toEqual(2);

		ticket.add_requester(user, false);
		expect(ticket.requesters.length).toEqual(2);
	});

});

// separated due to is_staff_by_id spy
describe("core:ticket", function () {
	it("ticket should not allow staff members to be added as requesters", function () {
		spyOn(Tickets, "insert").and.callFake(function(doc, callback) {
			// simulate async return of id = "1"
			callback(null, "1");
		});

		is_staff_by_id = jasmine.createSpy('is_staff_by_id() spy').and.callFake(function(userId) {
			return true;
		});

		var now = new Date();
		var ticket = new Ticket(null, now, now, null, "Ticket 1", "new", ["r1234"], ["gr1234"], [], true, []);
		expect(ticket.requesters.length).toBe(0);

		ticket.insert();

		// id should be set
		expect(ticket.id).toEqual("1");
		expect(Tickets.insert).toHaveBeenCalledWith({
			subject: "Ticket 1",
			created: now,
			modified: now,
			resolved: null,
			status: "new",
			requesters: [],
			groups: ["gr1234"],
			replies: [],
			isVisible: true,
		}, jasmine.any(Function));
	});
});
