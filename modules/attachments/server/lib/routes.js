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
fs = Npm.require('fs');

Router.map(function() {
  this.route('filebownload', {
    path: '/filedownload/:_id',
    where: 'server',
    action: function() {
      var request = this.request;
      var response = this.response;
      var attachment = Attachments.files.findOne({_id: this.params._id});
      var filename = attachment.filename.replace(/,/g, '');
      var headers = {
        'Content-type': attachment.contentType,
        'Content-Disposition': "attachment; filename=" + filename
      };
      this.response.writeHead(200, headers);

      if (attachment.metadata.ondisk === undefined) {
        var file = Attachments.retrieveBuffer(this.params._id);
        return this.response.end(file);
      } else {
        var file = fs.readFileSync(attachment.metadata.ondisk);
        return this.response.end(file);
      }
    }
  });
});