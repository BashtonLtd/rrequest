Package.describe({
  summary: "Meteor smart package for kue"
});

Npm.depends({
  "kue": "0.6.2"
});

Package.on_use(function (api, where) {
  api.export(['kue'], 'server');

  api.add_files('kue.js', 'server');
});
