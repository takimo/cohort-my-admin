
/**
 * Module dependencies.
 */

var express = require('express')
, routes = require('./routes');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);

app.get('/cohort', routes.cohort_index);
app.all('/cohort/create', routes.cohort_create);
app.all('/cohort/:id/setting', routes.cohort_setting);
app.all('/cohort/:id/add/:date?', routes.cohort_add);
app.all('/cohort/:id/fill', routes.cohort_fill);
app.get('/cohort/:id/:date?', routes.cohort_view);

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
