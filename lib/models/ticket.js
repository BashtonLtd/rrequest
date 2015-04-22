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
Ticket = function (id, created, modified, resolved, subject, status, requesters, groups, replies, isVisible, extradata) {
	this._id = id;
	this._created = created;
	this.modified = modified;
	this.resolved = resolved;
	this.subject = subject;
	this.status = status;
	this.requesters = requesters;
	this.groups = groups;
	this.replies = replies;
	this.isVisible = isVisible;

	// expand extradata into individual fields
	var that = this;
	if (extradata !== undefined) {
		extradata.forEach(function(item) {
			that['_'+item.name] = item.value;
		});
	}
}

// ***
// Model fields
// ***

Object.defineProperty(Ticket.prototype, 'id', {
	get: function() {
		return this._id;
	},
	enumerable: false
});

Object.defineProperty(Ticket.prototype, 'created', {
	get: function() {
		return this._created;
	},
	enumerable: true
});

Object.defineProperty(Ticket.prototype, 'modified', {
	get: function() {
		return this._modified;
	},
	set: function(value) {
		this._modified = value;
	},
	enumerable: true
});

Object.defineProperty(Ticket.prototype, 'resolved', {
	get: function() {
		return this._resolved;
	},
	set: function(value) {
		this._resolved = value;
	},
	enumerable: true
});

Object.defineProperty(Ticket.prototype, 'subject', {
	get: function() {
		return this._subject;
	},
	set: function(value) {
		this._subject = value;
	},
	enumerable: true
});

Object.defineProperty(Ticket.prototype, 'status', {
	get: function() {
		return this._status;
	},
	set: function(value) {
		this._status = value;
		if (value == 'closed') {
			this._resolved = new Date();
		}
	},
	enumerable: true
});

Object.defineProperty(Ticket.prototype, 'requesters', {
	get: function() {
		return this._requesters;
	},
	set: function(value) {
		var filtered_requesters = [];
		if (value !== undefined) {
			value.forEach(function(requester) {
				if (!is_staff_by_id(requester)) {
					filtered_requesters.push(requester);
				}
			})
		}

		this._requesters = filtered_requesters;
	},
	enumerable: true
});

Object.defineProperty(Ticket.prototype, 'groups', {
	get: function() {
		if (this._groups === null) {
			return [];
		}
		if (Array.isArray(this._groups) == true && this._groups[0] === null){
			return [];
		}
		return this._groups;
	},
	set: function(value) {
		if (value !== null) {
			if (Array.isArray(value) == true && value[0] == null) {
				this._groups = [];
			}
			this._groups = value;
		} else {
			this._groups = [];
		}
	},
	enumerable: true
});

Object.defineProperty(Ticket.prototype, 'replies', {
	get: function() {
		return this._replies;
	},
	set: function(value) {
		this._replies = value;
	},
	enumerable: true
});

Object.defineProperty(Ticket.prototype, 'isVisible', {
	get: function() {
		return this._isVisible;
	},
	set: function(value) {
		this._isVisible = value;
	},
	enumerable: true
});

// ***
// Model methods
// ***

Object.defineProperty(Ticket.prototype, 'insert', {
	enumerable: false,
	writable: false,
	value: function() {
		var keys = Object.keys(Ticket.prototype);
		var that = this;
		var doc = {};
		if (this._id !== null && this._id !== undefined) {
			doc['_id'] = this._id;
		} else {
			doc['_id'] = Random.id();
		}

		keys.forEach(function(key) {
			if (that['_'+key] !== undefined) {
				doc[key] = that['_'+key];
			}
		});
		Tickets.insert(doc);
		that._id = doc._id;
	}
});

Object.defineProperty(Ticket.prototype, 'save', {
	enumerble: false,
	writable: false,
	value: function() {
		var keys = Object.keys(Ticket.prototype);
		var that = this;
		var doc = {};

		keys.forEach(function(key) {
			if (that['_'+key] !== undefined) {
				doc[key]= that['_'+key];
			}
		});

		Tickets.update(that._id, {$set: doc});
	}
});

Object.defineProperty(Ticket.prototype, 'remove', {
	enumerble: false,
	writable: false,
	value: function() {
		var that = this;
		Tickets.remove(that._id);
	}
});

Object.defineProperty(Ticket.prototype, 'create_reply', {
	enumerable: false,
	writable: false,
	value: function(fields) {
		fields = fields || {};
		var that = this;
		var original_status = that.status;

		var now = new Date();
		if (fields.created !== undefined) {
			now = fields.created;
		}

		var reply = fields.reply;
		reply['_id'] = Random.id();
		reply['type'] = 'reply';

		var user_level = 'requester';
		if (fields.reply.level === undefined) {
			if(fields.user.profile.isStaff) {
				user_level = 'staff';
			}
		} else {
			user_level = fields.reply.level;
		}
		reply['level'] = user_level;

		if (fields.reply.posted_by === undefined) {
			reply['posted_by'] = {id:fields.user._id, email:fields.user.profile.email};
		}
		reply['created'] = now;

		// Once replies have their own data model, we can ensure this field is modified properly
		// for now clear it here
		that.close_warning = null;

		// add reply to replies
		var replies = that.replies;
		that.modified = now;
		if (user_level == 'requester') {
			that.status = 'new';
		}
		replies.push(reply);

		if (original_status !== 'new' && user_level == 'requester') {
			var event_reply = that.insert_event({
				created: now,
				user: fields.user._id,
				body: 'Status automatically set to "new" by requester reply.',
				update: false
			});
			replies.push(event_reply);
		}

		that.replies = replies;
		that.save();

		var log_email = fields.user.profile.email;
		var log_subject = that.subject;
		var log_ticket_url = Meteor.absoluteUrl('ticket/' + that.id, {secure: true});

		Meteor.call('createEventLog',{
			level:'INFO',
			tags:['replycreated'],
			message: log_email + ' replied to ' + log_subject + ' ' + log_ticket_url
		});

		return reply._id;
	}
});

Object.defineProperty(Ticket.prototype, 'insert_event', {
	enumerable: false,
	writable: false,
	value: function(options) {
		options = options || {};
		var that = this;
		var now = new Date();
		if (options.created !== undefined) {
			now = options.created;
		}
		var user = {id:'', email:'System'};
		if (options.user !== undefined) {
			user = options.user;
		}
		var level = 'system';
		if (options.level !== undefined) {
			level = options.level;
		}

		var reply = {
			_id: Random.id(),
			posted_by: user,
			status: 'posted',
			type: 'event',
			body: options.body,
			level: level,
			created: now
		};

		if (options.update !== undefined && options.update == false) {
			return reply;
		}

		var replies = that.replies;
		that.modified = now;
		replies.push(reply);

		that.save();
		return reply._id;
	}
});

Object.defineProperty(Ticket.prototype, 'add_requester', {
	enumerable: false,
	writable: false,
	value: function(user, update) {
		var that = this;

		if (user !== undefined) {
			// Staff should not be added to requesters
			if (is_staff_by_id(user._id)) {
				return false;
			}

			// Don't duplicate requesters
			if (_.findWhere(that.requesters, {id: user._id}) !== undefined) {
				return true;
			}

			var requesters = that.requesters;
			requesters.push({id:user._id, email:user.profile.email})

			if (update == true) {
				that.save();
			}
			return true;
		}
		return false;
	}
});






// ***
// Model manager methods
// ***

Object.defineProperty(Ticket, 'defaultFields', {
	enmunerable: false,
	writable: false,
	value: function() {
		return [
			'_id',
			'created',
			'modified',
			'resolved',
			'subject',
			'status',
			'requesters',
			'groups',
			'replies',
			'isVisible'
		];
	}
});
