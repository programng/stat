var Sentiment = require('./sentimentModel');
var sentimentController = {};
sentimentController.addSentiment = addSentiment;
sentimentController.getSentimentsFromKeyword = getSentimentsFromKeyword;
sentimentController.getSentimentById = getSentimentById;
sentimentController.getCommentIdsFromSavedSentiments = getCommentIdsFromSavedSentiments;
sentimentController.deleteSentiments = deleteSentiments;

function addSentiment(sentiment) {

  return Sentiment.create(sentiment)
    .then(null, function(err) {
      console.log('error with adding sentiment', err);
    });
}

function getSentimentsFromKeyword(keyword, callback) {
  var days = 30;
  var time = Date.now()/1000 - days * 24 * 60 * 60;
  console.log('getting sentiments');
  Sentiment.find({title: { $regex: new RegExp(keyword, 'i')} , time: { $gte: time }}, callback);
}

function getSentimentById(id, callback) {
  Sentiment.findById(JSON.parse(id), callback);
}

function getAllSentiments(callback) {
  Sentiment.find({}, callback);
}

function getCommentIdsFromSavedSentiments() {
  return Sentiment.find({}).exec()
    .then(function(foundSentiments) {
      var commentIds = [];
      for (var i = 0; i < foundSentiments.length; i++) {
        commentIds.push(foundSentiments[i].id);
      }

      return commentIds;
    })
    .then(null, function(err) {
      console.log('error getting commentIds from saved sentiments', err);
    });
}

function deleteSentiments() {
  return Sentiment.remove({})
    .exec();
}

module.exports = sentimentController;