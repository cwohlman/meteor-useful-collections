Package.describe({
  name: 'cwohlman:useful-collections',
  summary: 'Useful Collections for Meteor',
  version: '0.1.0',
  git: ' /* Fill me in! */ '
});

Package.onUse(function(api) {
  api.versionsFrom('1.0.2.1');

  api.use('mongo');
  api.use('underscore');

  api.addFiles('lib/usefulCollections.js');

  api.export('UsefulCollection');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('mongo');
  api.use('cwohlman:useful-collections');

  api.addFiles('tests/init.js');

  api.addFiles('tests/helpers.js');
  api.addFiles('tests/mock.js');
  api.addFiles('tests/where.js');

});
