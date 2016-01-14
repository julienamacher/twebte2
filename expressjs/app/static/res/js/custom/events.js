tweb.controller('events', function($scope, $http, $location, $interval, UserDataFactory) {
	$scope.apiKey = UserDataFactory.getApiKey();
	$scope.apiToken = UserDataFactory.getApiToken();
	$scope.site = UserDataFactory.getSite();
	
	// Obtained from https://api.stackexchange.com/docs/events
	// Used to retrieve the excerpt and url attributes
	var filterId = "!9YdnSFEOX"; 

	// Resets events items before being populated with fresh ones, just retrieved from the API
	var resetLastActivity = function() {
		$scope.lastActivity = [[], [], [], [], []];
	};
	
	resetLastActivity();

	// Handle on the interval instance used to periodically retrieve data
	var waitBeforeNextRetrieval = null;
	
	// Latest event timestamp retrieved during the current or last retrieved
	var maxTimestampThisRound;
	
	// Unix timestamp when the last retrieval occured (-1 if never retrieved)
	var timestampLastReceived = -1;
	
	// Maximum number of records to display (for instance if the interval is set
	// to 60 seconds and maxRecords is set to 30, the last 30 minutes of records are kept)
	var maxRecords = 30;
	
	// Seconds between each retrieval interval
	var secondsToWait = 60;
	
	// Counter that decrements. Once at zero, new stats are retrieved.
	$scope.currentWaitCounter = -1;

	// Used to graph the aggregated data (all events on the same graph)
	$scope.graphData = {
		graphOptions: { animationSteps: 5 },
		labels: [],
		series: [ "Posting a question",
				  "Posting an answer",
				  "Posting a comment",
				  "Editing a post",
				  "Creating a user" ],
		data: [[],
			   [],
			   [],
			   [],
			   []]
	};
	
	// Used to display single graphs
	$scope.graphData2 = {
		graphOptions: { animationSteps: 5 },
		labels: [],
		series: [[ [$scope.graphData.series[0]] ],
		         [ [$scope.graphData.series[1]] ],
		         [ [$scope.graphData.series[2]] ],
		         [ [$scope.graphData.series[3]] ],
				 [ [$scope.graphData.series[4]] ]],
				  
				  data: [[[]],[[]],[[]],[[]],[[]]]
	};

	

	$scope.goBack = function() {
		$location.path("/");
	};
	
	// Starts the timer which will decrement the number of seconds remaining before the next retrieval
	var startCount = function() {
		$scope.currentWaitCounter = secondsToWait;
		waitBeforeNextRetrieval = $interval(function() {
			$scope.currentWaitCounter--;
			
			if ($scope.currentWaitCounter <= 0) {
				$scope.currentWaitCounter = -1;
				$interval.cancel(waitBeforeNextRetrieval);
				waitBeforeNextRetrieval = null;
				
				getRound();
			}
		}, 1000);
	};
	
	/*
	Retrieve events from the API
	apiKey: api key to use
	accessToken: authentication token to use (obtained from OAuth)
	siteNameInApi: name of the site to retrieve data from
	page: starts at 1
	recordsPerPage: maximum records per page to retrieve, max is 100
	sinceTimestamp: only events that happened at a Unix timestamp greater than this will be retrieved
	*/
	var retrieveEvents = function(apiKey, accessToken, siteNameInApi, page, recordsPerPage, sinceTimestamp) {
		$http({
			method: 'GET',
			url: "https://api.stackexchange.com/2.2/events?key=" + apiKey + "&site=" + siteNameInApi + "&page=" + page + "&pagesize=" + recordsPerPage + "&since=" + sinceTimestamp + "&access_token=" + accessToken + "&filter=" + filterId,
			cache: false,
			headers: {
				'Authorization': $scope.userSession
			}
		})
		.success(function(data, status, headers, config) {
			if (status == 200) {
				var numberOfItems = data.items.length;
				
				var currentItem;
				for (var i = 0; i < numberOfItems; i++) {
					currentItem = data.items[i];
					
					var index;
					switch (currentItem.event_type) {
						case "question_posted":
							index = 0;
						break;
						
						case "answer_posted":
							index = 1;
						break;
						
						case "comment_posted":
							index = 2;
						break;
						
						case "post_edited":
							index = 3;
						break;
						
						case "user_created":
							index = 4;
						break;
					}

					// Remembering the maximal timestamp value we encountered during the retrieval
					if (currentItem.creation_date > maxTimestampThisRound) {
						maxTimestampThisRound = currentItem.creation_date;
					}
	
					// The API might sometimes return a non-integer Unix timestamp. We round it
					currentItem.creation_date = new Date(Math.floor(currentItem.creation_date * 1000));
					
					// Saving the event to display its excerpt and link
					$scope.lastActivity[index].push(currentItem);
					$scope.graphData.data[index][maxRecords - 1]++;
				}
				
				// Is there more to retrieve ? If yes then we get the next page
				if (data.has_more) {
					retrieveEvents(apiKey, accessToken, siteNameInApi, page + 1, recordsPerPage, sinceTimestamp);
				} else {
					
					// Copying for specialized graphs
					$scope.graphData2.data[0][0] = $scope.graphData.data[0];
					$scope.graphData2.data[1][0] = $scope.graphData.data[1];
					$scope.graphData2.data[2][0] = $scope.graphData.data[2];
					$scope.graphData2.data[3][0] = $scope.graphData.data[3];
					$scope.graphData2.data[4][0] = $scope.graphData.data[4];

					timestampLastReceived = (maxTimestampThisRound == 0) ? Math.floor((new Date()).getTime()/1000) : maxTimestampThisRound;
					startCount();
					
					var totalEventsRetrieved = 0;
					
					for (var i =0; i < 5; i++)
						totalEventsRetrieved += $scope.lastActivity[i].length;
					
					Lobibox.notify("success", {
						"soundPath": "res/sounds/lobibox/",
						"soundExt": ".ogg",
						"delay": 10000,
						"title": 'Events retrieved',
						"msg": totalEventsRetrieved + " events retrieved"
					});
				}
			} else {
				Lobibox.alert("error",
				{
					"msg": "Could not retrieve events: HTTP code " + status
				});
			}
		}).error(function(data, status, headers, config) {
			Lobibox.alert("error",
			{
				"msg": "Could not retrieve events: HTTP error"
			});
		});
		
	};

	// Will shift graph data on the left. This will discard the oldest record and make room for the next one on the right.
	var prepareData = function() {
		for (var record = 0; record < maxRecords - 1; record++) {
			for (var i =0; i < 5; i++) {
				$scope.graphData.data[i][record] = $scope.graphData.data[i][record + 1];
			}
		}
		
		for (var i =0; i < 5; i++) {
			$scope.graphData.data[i][record] = 0;
		}
	};

	// Wrapper for the retrieveEvents function. This will take care of setting round variables before retrieving data from the API
	var getRound = function() {
		valuesRetrieved = {};
		prepareData();
		resetLastActivity();
		maxTimestampThisRound = 0;
		
		// It's the first time we retrieve data. We are only interested in retrieving events that are not older than the interval set.
		if (timestampLastReceived == -1) {
			timestampLastReceived = Math.floor(Date.now() / 1000) - secondsToWait;
		}

		retrieveEvents($scope.apiKey, $scope.apiToken, $scope.site.nameInApi, 1, 100, timestampLastReceived);
	};


	$scope.$on('$viewContentLoaded', function() {
		
		// On controller load, we create the labels for the x last minutes
		$scope.graphData.labels = [];
		for (var record = 0; record < maxRecords; record++) {
			
			$scope.graphData.labels.push(maxRecords - record);
			
			for (var i =0; i < 5; i++) {
				$scope.graphData.data[i][record] = 0;
			}
		}
		
		$scope.graphData2.labels = $scope.graphData.labels;

		// Then we start retrieving stats from the server
		getRound();
	});
	
	$scope.$on(
		"$destroy",
		function(event) {
			if (waitBeforeNextRetrieval !== null) {
				$scope.currentWaitCounter = -1;
				$interval.cancel(waitBeforeNextRetrieval);
				waitBeforeNextRetrieval = null;
			}
		}
	);

});