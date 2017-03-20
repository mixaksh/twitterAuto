var T = require('./index'),
  utils = require('./utils'),
  notifier = require('node-notifier'),
  argv = require('minimist')(process.argv.slice(2)),
  ownerUserId = argv['userId'] || -1;

var favoriteStream = T.stream('user');

favoriteStream.on('favorite', function(tweet) {
  if (ownerUserId !== tweet.source.id) {
    console.log('Favorite received. Following @' + tweet.source.screen_name + ' ' + new Date());
    T.post('friendships/create', {
      user_id: tweet.source.id
    }, function(err, data, response) {
      if (err) {
        console.log(err);
      }
    });
  }
});

favoriteStream.on('follow', function(tweet) {
  if (ownerUserId !== tweet.source.id) {
    console.log('Follow received. Following @' + tweet.source.screen_name + ' ' + new Date());
    T.post('friendships/create', {
      user_id: tweet.source.id
    }, function(err, data, response) {
      if (err) {
        console.log(err);
      }
    });
  }
});

