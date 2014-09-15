Package.describe({
  summary: "Filesystem for Meteor, collectionFS",
  version: "0.2.3",
  name: "dwatson:collectionfs"
});

Package.on_use(function(api) {
  api.use(['deps', 'underscore', 'templating', 'handlebars', 'mongo-livedata']);

  if (typeof api.export !== "undefined") {
    api.export(['CollectionFS', 'CFSErrorType']);
  }

  api.addFiles('myConsole.js', [ 'client', 'server' ]);

  api.addFiles([
            'FileSaver.js',
          'collectionFS_templates.html',
          'collectionFS_client.js',
          'collectionFS_client.api.js',
          'collectionFS_handlebars.js'], 'client');

  api.addFiles([
  				'collectionFS_filesystem.js',
  				'collectionFS_server.js',
  				'collectionFS_filehandlers.js',
          'collectionFS_server.api.js'], 'server');

  api.addFiles([
          'collectionFS_common.js',
          'numeral.js'], ['client', 'server']);

});
