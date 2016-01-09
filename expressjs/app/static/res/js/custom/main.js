var tweb = angular.module('tweb', ['ngRoute', 'chart.js']);

tweb.config(['$routeProvider',
	function($routeProvider) {
		$routeProvider.
			when('/', {
				templateUrl: 'res/partials/home.html',
				controller: 'home'
			}).
			when('/events', {
				templateUrl: 'res/partials/events.html',
				controller: 'events'
			}).
			otherwise({
				redirectTo: '/'
			});
}]);
