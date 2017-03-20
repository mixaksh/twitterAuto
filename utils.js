var T = require('./index');

module.exports = {
  isPresentInUserMention: function(userMentionArray, userId) {
    var isPresent = false;
    if (userMentionArray.length === 0) {
      return isPresent;
    }

    userMentionArray.some(function(item) {
      if (item.id === userId) {
        isPresent = true;
        return isPresent;
      }
    });

    return isPresent;
  },

  doFavorite: function(id) {
    T.post('favorites/create', {
      id: id
    }, function(err, data, response) {
      if (err && err.code !== 139) { //Error codes: {139: Already favorited status}
        console.log(err);
      }
    });
  },

  doTweet: function(text, callback) {
    T.post('statuses/update', {
      status: text
    }, function(err, data, response) {
      callback(err, data);
    });
  },

  getUsername: function(idList, callback) {
    T.get('users/lookup', {
      user_id: idList
    }, function(err, data, response) {
      callback(err, data);
    });
  },

  doFollow: function(id, callback) {
    T.post('friendships/create', {
      user_id: id
    }, function(err, data, response) {
      if (err) {
        console.log(err);
      }
    });
  }
}
