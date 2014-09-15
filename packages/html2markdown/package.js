Package.describe({
  summary: "HTML email to markdown converter",
  version: "0.2.0",
  name: "dwatson:html2markdown"
});

Npm.depends({
  "htmlparser2": "3.1.4"
});

Package.onUse(function (api, where) {
  api.addFiles('html2markdown.js', 'server');
  api.export(['html2markdown', 'text2markdown'], 'server');
});
