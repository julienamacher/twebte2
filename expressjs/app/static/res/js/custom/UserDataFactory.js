/*
This factory is used to store data that is shared accross controllers
*/
tweb.factory('UserDataFactory', function () {
	
    var userData = {
        apiKey: null,
		apiToken: null,
		site: null
    };
	
    return {
		getApiKey: function() {
			return userData.apiKey;
		},
		getApiToken: function() {
			return userData.apiToken;
		},
		getSite: function() {
			return userData.site;
		},
		setApiKey: function(apiKey) {
			userData.apiKey = apiKey;
		},
		setApiToken: function(apiToken) {
			userData.apiToken = apiToken;
		},
		setSite: function(site) {
			userData.site = site;
		}
	}
});