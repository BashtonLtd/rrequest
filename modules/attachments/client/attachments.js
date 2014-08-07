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
Template.attachments.items = function(replyId) {
  return Attachments.find({'metadata.replyId':replyId});
};

Template.attachments.helpers({
  hasAttachments: function(replyId){
    var attachments = Attachments.find({'metadata.replyId':replyId});
    if (attachments.count() > 0) {
      return true;
    } else {
      return false;
    }
  },

  niceSize: function() {
    return niceSize(this);
  }
});

Template.attachments.events({
  'click .download-attachment': function(event, template) {
    event.preventDefault();
    window.location = '/filedownload/'+this._id;
  }
});


Template.replyentry_attachments.events({
  'change .fileUploader': function (event, template) {
    var ticketId = template.find(".replyentry_ticketId").value;
    var replyId = template.find(".replyentry_replyId").value;
    var requester = template.find(".replyentry_requester").value;
    var group = template.find(".replyentry_group").value;

    var files = event.target.files;
    for (var i = 0, f; f=files[i]; i++) {
      Attachments.storeFile(f, {ticketId:ticketId, replyId:replyId, requester:requester, group:group});
    }
    template.find(".fileUploader").value = "";
  },

  'click .close': function (event, template) {
    Meteor.call('removeAttachment', {
      id: this._id
    }, function(error, attachmentId) {

    });
  }
});

Template.replyentry_attachments.helpers({
  Files: function(replyId) {
    return Attachments.find({'metadata.replyId':replyId});
  },

  progress : function() {
    var filesProgress = Math.round(this.currentChunk / (this.countChunks - 1) * 100);

    if (this.complete) {
      return { barstyle: 'progress-success', fileprogress: 100 };
    } else {
      return { barstyle: 'progress-info progress-striped active', fileprogress: filesProgress };
    }
  },

  niceSize: function() {
    return niceSize(this);
  }
});

niceSize = function(item) {
  var fileSize = (item.length || item.len)
  var cGb = Math.floor(fileSize / 1000000000);
  if (cGb > 0) return (Math.floor(fileSize / 10000000)/100) + 'Gb';
  var cMb = Math.floor(fileSize / 1000000);
  if (cMb > 0) return (Math.floor(fileSize / 10000)/100) + 'Mb';
  var cKb = Math.floor(fileSize / 1000);
  if (cKb > 0) return (Math.floor(fileSize / 10)/100) + 'Kb';
  return fileSize + 'bytes';
};
