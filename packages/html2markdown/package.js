Package.describe({
  summary: "HTML email to markdown converter"
});

Npm.depends({
  "htmlparser2": "3.1.4"
});

Package.on_use(function (api, where) {
  api.add_files('html2markdown.js', 'server');
  api.export(['html2markdown', 'text2markdown'], 'server');
});
