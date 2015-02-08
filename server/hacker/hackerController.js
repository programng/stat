var request = require('request');
var idolController = require('../idol/idolController');
var aggregatorController = require('../aggregator/aggregatorController');

var hackerController = {};
var total = 0;
var count = 0;
var commentsArray = [];

hackerController.getCommentsFromStoryID = getCommentsFromStoryID;
hackerController.getComment = getComment;
hackerController.gatherComments = gatherComments;
hackerController.clear = clear;
hackerController.getCommentFromSentiment = getCommentFromSentiment;

function gatherComments(req, res, next) {
  var keyword = req.params.term;
  goThroughTitles(keyword, function(err, sentiment) {
    if (!err) {
      aggregatorController.add(sentiment);
    }
    if (count < total) {
      count++;
    }
    if (count >= total) {
      next();
    }
  });
}

function goThroughTitles(keyword, callback) {
  count = 0;
  total = 0;
  request
    .get('https://hacker-news.firebaseio.com/v0/topstories.json', function(err, response, body) {
      var topIDs = JSON.parse(body);
      topIDs.slice(0,50).forEach(function(ID) {
        getCommentsFromStoryID(ID, keyword, callback);
      });
    });
}


function getCommentsFromStoryID(id, keyword, callback) {
  request
    .get('https://hacker-news.firebaseio.com/v0/item/' +id +'.json', function(err, response, body) {

      if (!err) {
        var commentsArray = JSON.parse(body).kids;
        var title = JSON.parse(body).title;
        if (checkTitleForKeyword(keyword, title)) {
          commentsArray.forEach(function(commentId) {
            total++;
            getComment(commentId, callback);
          });
        }
      }
    });
}

//returns comment from
function getComment(id, callback) {
  request
    .get('https://hacker-news.firebaseio.com/v0/item/' +id +'.json', function(err, response, body) {
      if (!err) {
        var comment = JSON.parse(body).text;
        commentsArray.push(comment);
        idolController.getSentimentsSync(comment, callback);
      }
    });
}

function checkTitleForKeyword(keyword, title) {
  return Boolean(title.toLowerCase().match(keyword.toLowerCase()));
}

function clear() {
  commentsArray = [];
}

function getCommentFromSentiment(sentiment) {
  for (var i = 0; i < commentsArray; i++) {
    if (commentsArray[i].toLowerCase().match(sentiment.toLowerCase())) {
      return commentsArray[i];
    }
  }
}

module.exports = hackerController;



