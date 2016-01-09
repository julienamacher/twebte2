tweb.controller('home', function($scope, $http, $window, $location, UserDataFactory) {
	var siteUrl = "https://salty-mountain-1788.herokuapp.com/#/home/?";
	var applicationClientId = "6237";
	
	$scope.sites = [];
	
	// API key to use. Will give extra query quotas
	$scope.apiKey = "7uZYShQ4Jvdd35x4x6Eocw((";
	$scope.apiToken = "";
	$scope.siteToUse = null;
	
	$scope.setSiteToUse = function(siteToUse) {
		$scope.siteToUse = siteToUse;
	};
	
	$scope.redirectToStackFormOAuthLogin = function() {
		$window.location.href = "https://stackexchange.com/oauth/dialog?client_id=" + applicationClientId + "&redirect_uri=" + encodeURIComponent(siteUrl);
	};
	
	$scope.onSubmit = function() {
		var errors = [];
		
		if ($scope.apiKey.length < 1) {
			errors.push("No API Key specified");
		}
		
		if ($scope.apiToken.length < 1) {
			errors.push("No API Token specified");
		}
		
		if ($scope.siteToUse == null) {
			errors.push("No site chosen");
		}
		
		if (errors.length == 0) {
			UserDataFactory.setApiKey($scope.apiKey);
			UserDataFactory.setApiToken($scope.apiToken);
			UserDataFactory.setSite($scope.siteToUse);
			
			$location.path("/events");
		} else {
			Lobibox.alert("error",
			{
				"msg": errors.join("<br />")
			});
		}
	};

	$scope.$on('$viewContentLoaded', function() {
		
		var codeFromOAuth = null;
		
		var loc = $window.location.href;
		var start = loc.indexOf("access_token=");
		if (start != -1) {
			start = start + 13;
			
			var end = loc.indexOf("))");
			
			if (end != -1) {
				codeFromOAuth = loc.substring(start, end + 2);
			}
		}

		if (codeFromOAuth !== null) {
			$scope.apiToken = codeFromOAuth
		}

		$http({
			method: 'GET',
			url: "https://api.stackexchange.com/2.2/sites?((&filter=default",
			cache: false
		})
		.success(function(data, status, headers, config) {
			if (status == 200) {
				var numberOsSites = data.items.length;
				
				var sites = [];
				var currentSite;
				for (var i = 0; i < numberOsSites; i++) {
					currentSite = data.items[i];

					sites.push({"name": currentSite.name, "img": currentSite.logo_url, "nameInApi": currentSite.api_site_parameter});
				}
				
				$scope.sites = sites;
			} else  {
				Lobibox.alert("error",
				{
					"msg": "Could not retrieve sites: HTTP code " + status
				});
			}
		}).error(function(data, status, headers, config) {
			Lobibox.alert("error",
			{
				"msg": "Could not retrieve sites: http error"
			});
		});
	});
});