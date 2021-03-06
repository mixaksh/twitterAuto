var T = require('./index'),
  utils = require('./utils'),
  fs = require('fs'),
  async = require('async'),
  cron = require('cron'),
  argv = require('minimist')(process.argv.slice(2)),
  followList,
  keywords,
  whitelistedWords;

var posted_tweets = 0
var refused_tweets = 0

//followList = ["842392197827842048"];
followList = ["1076406170", "129845242", "127245578", "3121649873", "22256645", "519196613", "2895951606", "355784391", "2964412118", "3042967388", "278682576"]; // @EnterQuotes, @Inspire_Us, @wordstionary, @mindsconsole1, @GreatestQuotes, @MotivatedLiving, @HealingMB, @911well, @fearlessmotivat, @iamfearlesssoul, @thesecret
keywords = ['happy', 'happiness', 'motivation', 'mind', 'love', 'life', 'focus', 'start', 'understand', 'simpl', 'advice', 'thinking', 'mindfulness', 'kindness', 'success', 'patience', 'enthusiasm', 'dream', 'plan', 'doing', 'right', 'true', 'faith'];

var statusStream = T.stream('statuses/filter', {
  follow: followList
});

// follow other users' tweets and if some of them matches with keywords, repost it.
statusStream.on('tweet', function(tweet) {
  if (followList.indexOf(tweet.user.id_str) > -1 && !tweet.retweeted_status) {
    console.log('@' + tweet.user.screen_name + ' tweeted.');
    console.log(tweet.text);	
	var lowercaseTweet = tweet.text.toLowerCase();
	var keyword_not_found = true;
	var arrayLength = keywords.length;
	var i = 0;
	while (keyword_not_found && i<arrayLength) {
		keyword_not_found = keyword_not_found && (lowercaseTweet.indexOf(keywords[i]) === -1);
		i++;
	}
    if (keyword_not_found){
	  refused_tweets += 1
      console.log('No status update. Did not pass sanity check.')
	  console.log('Posted: '+ posted_tweets + ', Refused: '+refused_tweets)
      console.log('-----');
      return;
    }
    
	if (tweet.text.length + tweet.user.screen_name.length > 135){
		  var post_text = tweet.text
	}
	else{
		  var post_text = tweet.text + '\n-by ' + tweet.user.screen_name
	}
    setTimeout(function(){T.post('statuses/update', {
      status: post_text
    }, function(err, data, response) {
      if (err) {
        console.log('Error updating status')
		console.log(response)
        console.log('-----');
        return;
      }
	  posted_tweets += 1
      console.log('Status updated successfully. ' + new Date())
	  console.log('Posted: '+ posted_tweets + ', Refused: '+refused_tweets)
	  console.log('-----');
    })},getRandomIntInclusive(1000, 10000));
  }
});

var ownerScreenName = 'lilyabner97'
var favoriteStream = T.stream('user');


// follow users who favorited your tweet, if you are not following them already.
favoriteStream.on('favorite', function(tweet) {
  if (ownerScreenName !== tweet.source.screen_name) {
	//console.log(tweet.source);
	setTimeout(function(){T.get('friendships/show', {
		source_screen_name: ownerScreenName,
		target_screen_name: tweet.source.screen_name
	}, function(err, data, response){
		if (err){
			console.log(err);
			return;
		}
		if (!data.relationship.source.following){
			console.log('Favorite received. Following @' + tweet.source.screen_name + ' ' + new Date());
			T.post('friendships/create', {
				screen_name: tweet.source.screen_name
			}, function(err, data, response) {
				if (err) {
					console.log(err);
				}
			});
		}
	})},getRandomIntInclusive(20000, 60000*7));
  }
});

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var qWriteFollowed = async.queue(function(task, callback){
	if (fs.existsSync('followedUsers.json')) {
		fs.readFile('followedUsers.json', 'utf8', function readFileCallback(err, data){
			if (err){
				console.log(err);
			}
			else{
				obj = JSON.parse(data); //now it is an object
				obj.records.push(task); //add some data
				json = JSON.stringify(obj); //convert it back to json
				fs.writeFile('followedUsers.json', json, 'utf8'); // write it back
			}
			});
	}
	else{
		var obj = {
			records: []
		};
		obj.records.push(task);
		var json = JSON.stringify(obj);
		fs.writeFile('followedUsers.json', json, 'utf8');
	}
		callback();
}, 1);

qWriteFollowed.drain = function() {
    console.log('qWriteFollowed - All items have been processed');
};

var qWriteUnfollowed = async.queue(function(task, callback){
	if (fs.existsSync('unfollowedUsers.json')) {
		fs.readFile('unfollowedUsers.json', 'utf8', function readFileCallback(err, dataUJSON){
			if (err){
				console.log(err);
			} else {
				unfollowed_list = JSON.parse(dataUJSON); //now it is an object
				if (unfollowed_list.indexOf(task) === -1){
					console.log("I am inside and writing to file");
					unfollowed_list.push(task);
					var json = JSON.stringify(unfollowed_list);
					fs.writeFile('unfollowedUsers.json', json, 'utf8');
				}
				else{
					console.log("I never reached inside writing unfollowed");
				}
		}});
	}
	else{
		var unfollowed_list = [];					
		unfollowed_list.push(task);
		var json = JSON.stringify(unfollowed_list);
		fs.writeFile('unfollowedUsers.json', json, 'utf8');													
	}
		callback();
}, 1);

qWriteUnfollowed.drain = function() {
    console.log('qWriteUnfollowed - All items have been processed');
};

var qDelUnfollowed = async.queue(function(task, callback){
	if (fs.existsSync('delFollowedUsers.json')) {
		fs.readFile('delFollowedUsers.json', 'utf8', function readFileCallback(err, dataUJSON){
			if (err){
				console.log(err);
			} else {
				newObj = JSON.parse(dataUJSON);
				newObj.push(task);
				jsonObj = JSON.stringify(newObj); //convert it back to json
				fs.writeFile('delFollowedUsers.json', jsonObj, 'utf8'); // write it back
			}
		});
	}
	else{
		newObj = []
		newObj.push(task);
		jsonObj = JSON.stringify(newObj); //convert it back to json
		fs.writeFile('delFollowedUsers.json', jsonObj, 'utf8'); // write it back
	}
		callback();
}, 1);

qDelUnfollowed.drain = function() {
    console.log('qDelUnfollowed - All items have been processed');
};

var qWriteCursor = async.queue(function(task, callback){
	fs.writeFile('cursorPosition.txt', task, 'utf8');
		callback();
}, 1);

qWriteCursor.drain = function() {
    console.log('qWriteCursor - All items have been processed');
};

// follow users who followed you, if you are not following them already.
// send direct message to the user, who just followed you.
// favorite 2 last posts from the user you just followed and retweet last post from that user. 
favoriteStream.on('follow', function(tweet) {
  if (ownerScreenName !== tweet.source.screen_name) {
	setTimeout(function(){
	console.log('Follow received. Sending DM to @' + tweet.source.screen_name + ' ' + new Date());
	T.post('direct_messages/new', {
	screen_name: tweet.source.screen_name,
	text: 'Hello!\n\nThank you very much for following me! Have a great day!\n\nBest,\nLily'
	}, function(err, data, response) {
		if (err) {
			console.log(err);
		}
	})}, getRandomIntInclusive(8000, 60000*4));
	  
	T.get('friendships/show', {
		source_screen_name: ownerScreenName,
		target_screen_name: tweet.source.screen_name
	}, function(err, data, response){
			if (err){
				console.log(err);
				return;
			}
			if (!data.relationship.source.following){
				setTimeout(function(){
				console.log('Following @' + tweet.source.screen_name + ' ' + new Date());
				T.post('friendships/create', {
				  screen_name: tweet.source.screen_name
				}, function(err, data, response) {
				  if (err) {
					console.log(err);
				  }
				})}, getRandomIntInclusive(5000, 60000*5));
			}
	});
  }
  else{
	qWriteFollowed.push({id: tweet.target.id_str, screen_name: tweet.target.screen_name, date: new Date()});
	/*
	T.get('statuses/user_timeline', {
		screen_name: tweet.target.screen_name,
		count: getRandomIntInclusive(1,3),
		exclude_replies: true,
		include_rts: false  
	}, function(err, data, response){
		if(err){
			console.log(err);
			return;
		}
		if(data.length > 0){
			favorIndex = 0;
			T.post('favorites/create', {
				id: data[favorIndex].id_str
			}, function favorMore(err){
				if(err){
					console.log(err);
				}
				else{
					favorIndex++;
					if(favorIndex<data.length){
						setTimeout(function(){T.post('favorites/create', {
							id: data[favorIndex].id_str
						}, favorMore)}, getRandomIntInclusive(1000, 10000));
					}
				}
			});
		}
	
		
		T.post('statuses/retweet/:id', {
			id: data[0].id_str
		}, function(err){
			if(err){
				console.log(err);
			}
		});
		
	}); */
  }
});


var cronJobUnfollowing = cron.job("0 0 1,7,17 * * *",function(){
	setTimeout(function(){
			console.log("Started unfollowing cron job");
			T.get('account/verify_credentials', 
			function(err, data, response){
				if(err){
					console.log(err);
					console.log("Reached twitter's get credentials limit.");
				}
				else{
					var followers_count = data.followers_count;
					var following_count = data.friends_count;
					var unfollowingLimit = following_count - followers_count;
					unfollowingLimit = Math.round(unfollowingLimit/12);
					unfollowingLimit = 100;
					console.log("Unfollowing limit is: "+unfollowingLimit);
					if(unfollowingLimit > 0){
						if (fs.existsSync('followedUsers.json')) {
							fs.readFile('followedUsers.json', 'utf8', function readFileCallback(err, dataJSON){
							if (err){
								console.log(err);
								console.log("Cannot read file followedUsers.json");
							} else {
								var all_user_ids = [];
								var myCursor = -1;

								T.get('followers/ids', {
									screen_name: 'lilyabner97',
									stringify_ids: 'true',
									cursor: myCursor
								}, function getFollowerIds(err, data, response){
									if(err){
										console.log(err);
										console.log("Cannot get followersIds");
									}
									else{
										all_user_ids.push.apply(all_user_ids, data.ids);
										if(data.next_cursor_str != '0'){
											T.get('followers/ids', {
												screen_name: 'lilyabner97',
												stringify_ids: 'true',
												cursor: data.next_cursor_str
											}, getFollowerIds);
										}
										else{
												obj = JSON.parse(dataJSON); //now it is an object
												recordsArrayLenght = obj.records.length;
												var unfollowed_count = 0;
												unfollowIndex = -1;
												for (var i=0; i < recordsArrayLenght; i++){
													var timeDiff = Math.abs(new Date() - Date.parse(obj.records[i].date));
													var diffDays = Math.floor(timeDiff / (1000 * 3600 * 24));
													if (diffDays >= 5 && all_user_ids.indexOf(obj.records[i].id) === -1){
														unfollowIndex = i;
														break;
													}
												}
												if (unfollowIndex != -1){
													console.log("Unfollowing @"+obj.records[unfollowIndex].screen_name);
													T.post('friendships/destroy', {
														screen_name: obj.records[unfollowIndex].screen_name
													}, function destroyMore(err){
														if(err){
															console.log(err);
															console.log("Cannot destroy friendship");
														}
														else{
															unfollowed_count++;
															unfollowingLimit--;
															
															qWriteUnfollowed.push(obj.records[unfollowIndex].id);
															qDelUnfollowed.push(obj.records[unfollowIndex]);
														}
															startIndex = unfollowIndex+1;
															unfollowIndex = -1;
															if (unfollowingLimit > 0){
																if (startIndex < recordsArrayLenght){
																	for (var i=startIndex; i < recordsArrayLenght; i++){
																		var timeDiff = Math.abs(new Date() - Date.parse(obj.records[i].date));
																		var diffDays = Math.floor(timeDiff / (1000 * 3600 * 24));
																		if (diffDays >= 5 && all_user_ids.indexOf(obj.records[i].id) === -1){
																			unfollowIndex = i;
																			break;
																		}
																	}
																
																	
																	if (unfollowIndex != -1){
																		console.log("Unfollowing @"+obj.records[unfollowIndex].screen_name);
																		setTimeout(function(){T.post('friendships/destroy', {
																		screen_name: obj.records[unfollowIndex].screen_name
																		}, destroyMore)}, getRandomIntInclusive(1000, 15000));
																	}
																	else{
																		console.log("No more people to unfollow.");
																	}
																}
																else{
																	console.log("No more people to unfollow.");
																}
															}
															else{
																console.log("Reached unfollowing limit.");
															}
														
													});
												}
												else{
													console.log("No more people to unfollow.");
												}												
											}
										}
							});			
						}});
					}
				}
				else{
					console.log("Reached unfollowing limit");
				}
	}});
	setTimeout(cleanFollowing, 60000*15);
	},getRandomIntInclusive(60000, 49000*60*4));	
});
cronJobUnfollowing.start();


function cleanFollowing(){
	console.log("Started cleaning cron job.");
	if (fs.existsSync('delFollowedUsers.json')) {
		fs.readFile('delFollowedUsers.json', 'utf8', function readFileCallback(err, datadJSON){
			if (err){
				console.log(err);
				console.log("Cannot read file delFollowedUsers.json.");
			} else {
				newObj = JSON.parse(datadJSON);
				if (newObj.length > 0){
					if (fs.existsSync('followedUsers.json')) {
						fs.readFile('followedUsers.json', 'utf8', function readFileCallback(err, dataJSON){
							if (err){
								console.log(err);
								console.log("Cannot read file followedUsers.json.");
							} else {
								followedData = JSON.parse(dataJSON);
								var noLenght = newObj.length;
								for (var i=0; i<noLenght; i++){
									dIndex = -1;
									fdLength = followedData.records.length;
									for (var j=0; j<fdLength; j++){
										if(followedData.records[j].id == newObj[i].id){
											dIndex = j;
											break;
										}
									}
									if (dIndex > -1){
										followedData.records.splice(dIndex,1);
									}
								}
								if (followedData.records.length > 0){
									jsonObj = JSON.stringify(followedData); //convert it back to json
									fs.writeFile('followedUsers.json', jsonObj, 'utf8'); // write it back
								}
								else{
									console.log("Followed data empty!");
								}
							}
						});
					}
					else{
						console.log("File followedUsers.json does not exist.");
					}
				}
				else{
					console.log("NewObj length is 0.");
				}
				fs.writeFile('delFollowedUsers.json', "[]", 'utf8');
			}
		});
	}
	else{
		console.log("File delFollowedUsers.json does not exist.");
	}
}


var cronJobFollowing = cron.job("0 0 0,4,8,12,16,20 * * *", function(){
	setTimeout(function(){
		console.log("Started following cron job.");
		T.get('account/verify_credentials', 
		function(err, data, response){
			if(err){
				console.log(err);
				console.log("Reached twitter's get credentials limit.");
			}
			else{
				var followers_count = data.followers_count;
				var following_count = data.friends_count;
				var following_limit = Math.round(Math.max(50, followers_count * 3));
				var following_left = following_limit - following_count;
				var api_calls_left = 14;
				
				if (following_count < 150 && followers_count < 50){
					following_left = 50;
				}
				
				following_left = Math.round(following_left/12);
				console.log("Following limit is: "+following_left);
				if(following_left > 0){
					api_calls_left--;
					
					if (fs.existsSync('cursorPosition.txt')) {
						cursorPos = fs.readFileSync('cursorPosition.txt', 'utf8');
					}
					else{
						cursorPos = -1;
					}
					T.get('followers/list', {
						screen_name: 'iownjd',
						count: 200,
						cursor: cursorPos
					}, function getFollowersList(err, dataList, response){
						if(err){
							console.log(err);
							console.log("Reached twitters get followers list limit.");
							api_calls_left = 0;
						}
						else{
							qWriteCursor.push(dataList.next_cursor_str);
							var unfollowed_list = [];
							if (fs.existsSync('unfollowedUsers.json')) {
										datajson = fs.readFileSync('unfollowedUsers.json', 'utf8');
										unfollowed_list = JSON.parse(datajson); //now it is an object
							}						
							users_sample = dataList.users;
							users_array_length = users_sample.length;
							goodIndex = -1;
							for(var i=0; i<users_array_length; i++){
								current_user = users_sample[i];
								if(unfollowed_list.indexOf(current_user.id_str) === -1 && !current_user.following && !current_user.follow_request_sent && !current_user.default_profile_image && current_user.lang == "en" && current_user.followers_count > 49 && current_user.friends_count / current_user.followers_count > 2 && current_user.statuses_count > 50){
									goodIndex = i;
									break;
								}
							}
							if (goodIndex != -1 && users_sample[goodIndex].screen_name != "lilyabner97"){
								console.log('Following @' + users_sample[goodIndex].screen_name + ' ' + new Date());
								T.post('friendships/create', {
								  screen_name: users_sample[goodIndex].screen_name
								}, function followMore(err, dataCre, response) {
								  if (err) {
									  if(err.code != 162){
										console.log(err);
										if(err.code == 88 || err.code == 161){
											following_left = 0;
											console.log("Reached twitters following limit.");
										}
										return;
									  }
								  }
									  following_left--;
									  startIndex = goodIndex+1;
									  goodIndex = -1;
									  if (following_left > 0){
										  if (startIndex < users_array_length){
											  for(var j=startIndex; j<users_array_length; j++){
												current_user = users_sample[j];
												if(unfollowed_list.indexOf(current_user.id_str) === -1 && !current_user.following && !current_user.follow_request_sent && !current_user.default_profile_image && current_user.lang == "en" && current_user.followers_count > 49 && current_user.friends_count / current_user.followers_count > 2 && current_user.statuses_count > 50){
													goodIndex = j;
													break;
												}
											  }
											if(goodIndex != -1 && users_sample[goodIndex].screen_name != "lilyabner97"){
												console.log('Following @' + users_sample[goodIndex].screen_name + ' ' + new Date());
												setTimeout(function(){T.post('friendships/create', {
													screen_name: users_sample[goodIndex].screen_name
												}, followMore)},getRandomIntInclusive(1000, 15000));
											}
											else{
												if(dataList.next_cursor_str != '0' && api_calls_left > 0){
													console.log("Following_left: "+following_left);
													T.get('followers/list', {
														screen_name: 'JohnMcGrathMB',
														count: 200,
														cursor: dataList.next_cursor_str
													}, getFollowersList);
												}
											}
										  }
										  else{
											if(dataList.next_cursor_str != '0' && api_calls_left > 0){
												console.log("Following_left: "+following_left);
												T.get('followers/list', {
													screen_name: 'JohnMcGrathMB',
													count: 200,
													cursor: dataList.next_cursor_str
												}, getFollowersList);
											}
										  }
										}
										else{
											console.log("No followings left.");
										}
								});
							}
							else{
								if (following_left > 0){
									if(dataList.next_cursor_str != '0' && api_calls_left > 0){
										console.log("Following_left: "+following_left);
										T.get('followers/list', {
											screen_name: 'JohnMcGrathMB',
											count: 200,
											cursor: dataList.next_cursor_str
										}, getFollowersList);
									}
								}
								else{
									console.log("No followings left.");
								}
							}
						}
					});	
			}
			else{
				console.log("No followings left.");
			}
			}
		})	
	},getRandomIntInclusive(60000, 49000*60));
});
cronJobFollowing.start();

