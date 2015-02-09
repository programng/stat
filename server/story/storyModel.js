var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

// define message schema
var storySchema = new Schema({
  storyId: { type: Number, unique: true, required: true },
  title: String,
  kids: [Number]
});

// compile message schema into a message model
module.exports = mongoose.model('Story', storySchema);