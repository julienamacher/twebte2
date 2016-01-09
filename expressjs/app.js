var express = require('express');
var https = require('https');
var fs = require('fs');

// Listening port
var appListenOnPortConfig = process.env.PORT || 8080;

var app = express();

var server = app.listen(appListenOnPortConfig, function () {
	console.log('Express server listening on port ' + appListenOnPortConfig);
});
	
// Static pages are statically served on /
app.use('/', express.static(__dirname + '/app/static'));
