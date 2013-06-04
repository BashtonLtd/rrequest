rrequest example module
=======================

For this example we will create a module that will display a 'staff' badge on all ticket replies made by staff members or admins.

# Getting started

The first thing to do is to create a folder within the modules folder to contain the module code called staffbadge. Once create we can get started.

# Register the module

We need to register the module with rrequest, to do this create a server directory within the staffbadge module.

Now create a file within this directory called `staffbadge-server.js` with the following content.

```javascript
Meteor.startup(function (){
  // register the staffbadge module
  Meteor.call('registerModule', {
    name: 'staffbadge',
    callback_enable: 'enable_staffbadge_module',
    callback_disable: 'disable_staffbadge_module',
    description: 'Displays a staff badge on ticket replies.'
  }, function(error, module_id) {
    if(!error) {

    }
  });
});
```

This code will call the registerModule method when meteor starts, it calls the method with a name, description, and the methods to run when this module is enabled and disabled.

Now we need to create the `enable_staffbadge_module` and `disable_staffbadge_module` methods.

# Enable and disable methods

Add the following code to `staffbadge-server.js`

```javascript
Meteor.methods({
  enable_staffbadge_module: function(args) {
    args = args || {};

    Hooks.insert({
      hook: 'reply_header',
      module_id: args.module_id,
      template: 'staffbadge_reply_header'
    });
  },

  disable_staffbadge_module: function(args) {
    args = args || {};

    Hooks.remove({
      module_id: args.module_id
    });
  }
});
```

### enable_staffbadge_module

This method should complete any actions needed to enable this module, as this module only needs to add some content to the header of each ticket reply we only need to register a template to be inserted when the header is generated.

The hook needed for this id `reply_header`, which is called when generating the header of each ticket reply.  We insert an entry into the Hooks collection with the hook name, this modules id and the template to use (`staffbadge_reply_header`).

### disable_staffbadge

This method should clean up anything that `enable_staffbadge_module` did.  For this module that means removing the hook that was inserted.

# Template

When the hook was registered earlier we gave the name of a template to insert, to define this template create a folder called `client` in the `modules/staffbadge` folder.  Inside this folder create a file called `staffbadge.html` with the following content.

```html
<template name="staffbadge_reply_header">
  {{#if is_staff_by_id this.posted_by}}
  <span class="label label-success">staff</span>
  {{/if}}
</template>
```

This template simply calls `is_staff_by_id` with the id of the reply author, if the author is a member of staff then it adds a bootstrap label to the header.

# Try it out

Now it should be possible to enable this module in the module activation section of the settings, and then each ticket reply posted by a staff member should be labeled 'staff'.