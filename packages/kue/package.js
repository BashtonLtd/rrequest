Package.describe({
  summary: "Meteor smart package for kue",
  version: "0.8.6",
  name: "dwatson:kue"
});

Npm.depends({
  "kue": "0.8.6"
});

Package.on_use(function (api) {
  api.export('kue', 'server');

  api.addFiles('kue.js', 'server');
});
