var T = require('./index'),
  utils = require('./utils'),
  argv = require('minimist')(process.argv.slice(2)),
  userId = argv['userId'] || -1,
  count  = argv['count'];

var fetchStatusesAndFavorite = function(userId, count) {
  count = count || 10;
  T.get('statuses/user_timeline', {
    user_id: userId,
    count: count,
    exclude_replies: true,
    include_rts: false
  }, function(err, statuses) {
    if (err) {
      console.log(err);
      return;
    }
    var i = 0;
    while (i < statuses.length) {
      console.log('Favoriting status of ', userId);
      utils.doFavorite(statuses[i]['id_str']);
      i++;
    }

  });
}

module.exports = fetchStatusesAndFavorite;
