var T = require('./index'),
  utils = require('./utils'),
  notifier = require('node-notifier'),
  argv = require('minimist')(process.argv.slice(2)),
  followList,
  whitelistedWords;
  
var posted_tweets = 0
var refused_tweets = 0

followList = [1076406170, 129845242, 127245578, 3121649873, 22256645, 519196613, 2895951606, 355784391, 2964412118, 3042967388, 278682576]; // @EnterQuotes, @Inspire_Us, @wordstionary, @mindsconsole1, @GreatestQuotes, @MotivatedLiving, @HealingMB, @911well, @fearlessmotivat, @iamfearlesssoul, @thesecret

console.log("Worker is running...");

var statusStream = T.stream('statuses/filter', {
  follow: followList
});

statusStream.on('tweet', function(tweet) {
  if (followList.indexOf(tweet.user.id) > -1 && !tweet.retweeted_status) {
    console.log('@' + tweet.user.screen_name + ' tweeted.');
    console.log(tweet.text);
    var lowercaseTweet = tweet.text.toLowerCase();
    if 
      (lowercaseTweet.indexOf('happy') === -1 &&
      lowercaseTweet.indexOf('happiness') === -1 &&
      lowercaseTweet.indexOf('motivation') === -1 &&
      lowercaseTweet.indexOf('mind') === -1 &&
      lowercaseTweet.indexOf('love') === -1 &&
      lowercaseTweet.indexOf('life') === -1 &&
      lowercaseTweet.indexOf('focus') === -1 &&
      lowercaseTweet.indexOf('start') === -1 &&
      lowercaseTweet.indexOf('understand') === -1 &&
      lowercaseTweet.indexOf('simpl') === -1 &&
      lowercaseTweet.indexOf('advice') === -1 &&
      lowercaseTweet.indexOf('thinking') === -1 &&
	  lowercaseTweet.indexOf('mindfulness') === -1 &&
	  lowercaseTweet.indexOf('kindness') === -1 &&
	  lowercaseTweet.indexOf('success') === -1 &&
	  lowercaseTweet.indexOf('patience') === -1 &&
	  lowercaseTweet.indexOf('enthusiasm') === -1 &&
	  lowercaseTweet.indexOf('dream') === -1 &&
	  lowercaseTweet.indexOf('plan') === -1 &&
	  lowercaseTweet.indexOf('doing') === -1 &&
	  lowercaseTweet.indexOf('right') === -1 &&
      lowercaseTweet.indexOf('true') === -1 //&&
      //tweet.user.id !== 2246032237 && //iamjtsuccess
      //tweet.user.id !== 25458378 //AskAaronLee
    ) {
	  refused_tweets += 1
      console.log('No status update. Did not pass sanity check.')
	  console.log('Posted: '+ posted_tweets + ', Refused: '+refused_tweets)
      console.log('-----');
      return;
    }
	if (tweet.text.length + 5 + tweet.user.screen_name.length > 140){
		  var post_text = tweet.text
	}
	else{
		  var post_text = tweet.text + '\n-by ' + tweet.user.screen_name
	}
    T.post('statuses/update', {
      status: post_text
    }, function(err, data, response) {
      if (err) {
        console.log('Error updating status')
		console.log(response)
		console.log(data)
		console.log('Posted: '+ posted_tweets + ', Refused: '+refused_tweets)
        console.log('-----');
        return;
      }
      notifier.notify({
        'title': '@' + tweet.user.screen_name + ' tweeted.',
        'message': post_text+"."
      });
	  posted_tweets += 1
      console.log('Status updated successfully. ' + new Date())
	  console.log('Posted: '+ posted_tweets + ', Refused: '+refused_tweets)
	  console.log('-----');
    });
  }
});
