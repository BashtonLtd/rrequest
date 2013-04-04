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
Meteor.startup(function (){
  // register the comment module
  Meteor.call('registerModule', {
    name: 'comments',
    callback_enable: 'enable_comments_module',
    callback_disable: 'disable_comments_module',
    description: 'Allows staff to make comments in tickets that are not visible to requesters.'
  }, function(error, module_id) {
    if(!error) {

    }
  });
});

Meteor.methods({
  enable_comments_module: function(args) {
    args = args || {};

    // Add hook for comment submit button
    Hooks.insert({
      hook: 'ticket_reply_button',
      module_id: args.module_id,
      html: '<button class="btn post-ticket-comment"><i class="icon-comment"></i> Comment</button>',
      render: 'ticket_comment_button'
    });

    Hooks.insert({
      hook: 'ticket_replies',
      module_id: args.module_id,
      data: 'comment_replies'
    });
  },

  disable_comments_module: function(args) {
    args = args || {};

    Hooks.remove({
      module_id: args.module_id
    });
  }
});