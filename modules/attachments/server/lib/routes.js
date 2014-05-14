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

      if (attachment.metadata.ondisk === undefined) {
        response.setHeader('Content-disposition', 'attachment; filename=' + attachment.filename);
        response.setHeader('Content-type', attachment.contentType);
        var file = Attachments.retrieveBuffer(this.params._id);
        response.write(file);
      } else {
        return [200,
        {
            'Content-type': attachment.contentType,
            'Content-Disposition': "attachment; filename=" + attachment.filename
        }, fs.readFileSync(attachment.metadata.ondisk)];
      }
    }
  });
});