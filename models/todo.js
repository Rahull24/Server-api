const mongoose = require('mongoose');

var Todo = mongoose.model('Todo', {
  text: {
    type: String,
    required: true,
    trim: true,
    minLength: 1
  },
  completed: {
    type: Boolean,
    default: false
  },
  completeAt: {
    type: Number,
    default: null
  },
  _creator : {
    type: mongoose.Types.ObjectId,
    require: true
  }
});


module.exports = {Todo};
