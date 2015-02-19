var Promise = require('bluebird');
var _ = require('lodash');

var idolController = Promise.promisifyAll(require('../server/util/idolController'));
var sentimentController = require('../server/sentiment/sentimentController');
var config = require('config');
var request = Promise.promisify(require('request'));

var itemController = Promise.promisifyAll(require('../server/item/itemController'));

var mongoose = require('mongoose');
mongoose.connect(config.get('mongo'));

var chunkSize = 20;
var source = "Hacker News";
var count = 0;
var limit = 100;
var topStoriesUrl = 'https://hacker-news.firebaseio.com/v0/topstories.json';
var maxItemUrl = 'https://hacker-news.firebaseio.com/v0/maxitem.json';

function populateDBWithStories(n) {

  request(maxItemUrl)
    .spread(function(response, body) {
      var topID = JSON.parse(body);

      getChunk(topID);
    });
}

function getChunk(n) {
  count++;
  itemController.getAllItemIds()
    .then(function(itemIds) {
      console.log('step 1');
      var requestsForItems = [];
      for (var i = n - chunkSize; i < n; i++) {
        if (itemIds.indexOf(i) < 0) {
          var temp = request('https://hacker-news.firebaseio.com/v0/item/' +i +'.json')
            .spread(function(response, body) {
              return JSON.parse(body);
            });
            console.log('temp', temp);
          requestsForItems.push(temp);
        }
      }
      console.log('requestsForItems', requestsForItems);
      return Promise.all(requestsForItems);
    })
    // saves all items from hacker news
    .then(function(hackerNewsItems) {
      console.log('hackerNewsItems', hackerNewsItems);
      console.log('step 2');
      var items = [];
      for (var i = 0; i < hackerNewsItems.length; i++) {
        var item = hackerNewsItems[i];
        if (item && !item.deleted) {
          items.push(itemController.addItem(item, source));
        }
      }

      return Promise.all(items);
    })
    // get update all comments with text
    .then(function(items) {
      var commentRequests = [];
      console.log('step 3');

      for (var i = 0; i < items.length; i++) {
        // some stories have no comments
        if (items[i] && items[i].type === 'comment' && items[i].parent) {
          commentRequests.push(itemController.updateTitle(items[i].id, source));
        }
      }

      return Promise.all(commentRequests);
    })
    .then(function(comments) {
      comments = _.flattenDeep(comments);
        // console.log('comments', comments);

      var sentimentsFromComments = [];
      for (var i = 0; i < comments.length; i++) {
        if (comments[i] && comments[i].text) {
          sentimentsFromComments.push(idolController.getSentimentsSync(comments[i]));
        }
        else {
          console.log('skipped');
        }
      }

      return Promise.all(sentimentsFromComments);
    })
    .then(function() {
      console.log('done', count);
      if (count < limit) {
        getChunk(n-chunkSize);
      }
    })
    .then(null, function(err) {
      console.log('error getting new comments', err);
    });
}

function updateSentiments() {

  Promise.join(itemController.getComments(), sentimentController.getCommentIdsFromSavedSentiments(),
    function(comments, commentIds) {

      comments = _.flattenDeep(comments);
      var sentimentsFromComments = [];
      for (var i = 0; i < comments.length; i++) {
        // console.log(comments[i]);
        if (comments[i] && comments[i].text && commentIds.indexOf(comments[i].id) < 0) {
          sentimentsFromComments.push(idolController.getSentimentsSync(comments[i]));
        }
        else {
          console.log('skipped');
        }
      }

      return Promise.all(sentimentsFromComments);
    })
    .then(function() {
      console.log('done');
    })
    .then(null, function(err) {
      console.log('error getting new comments', err);
    });

}

populateDBWithStories();