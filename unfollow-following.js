var T = require('./index.js'),
  argv = require('minimist')(process.argv.slice(2)),
  stopId = argv['stopId'] || -1; //348336389 = omgisarcasm

T.get('friends/ids', {
  screen_name: 'geekykaran',
  count: 2000
}, function(err, data, response) {
  var idList = data.ids,
    i = 0,
    error = false;
  while (idList[i] !== stopId && !error) {
    var id = idList[i];
    console.log('Unfollowing');
    T.post('friendships/destroy', {
      user_id: id
    }, function(err, data, response) {
      if (err) {
        console.log(err);
        error = true;
      }
      console.log('Unfollowed');
    });
    i++;
  }
});
