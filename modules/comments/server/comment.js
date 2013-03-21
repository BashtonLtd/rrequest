Meteor.startup(function (){
  // register the comment module
  Meteor.call('registerModule', {
    name: 'comments',
    callback_enable: 'enable_comments_module',
    callback_disable: 'disable_comments_module'
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