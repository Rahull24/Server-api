const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
//const {ObjectId} = require('mongodb');

var {mongoose} = require('./db/mongoose');
var {Todo} = require('./models/todo');
var {User} =  require('./models/user');
var {authenticate} = require('./middleware/authenticate');

var app = express();

app.use(bodyParser.json());

app.post('/todos', authenticate, (req, res) => {

  var newTodo = new Todo({
    text: req.body.text,
    _creator: req.user.id
  });

  newTodo.save().then((doc) => {
    res.send(doc);
  }, (err) => {
    res.status(400).send(err);
  });
});

//mongoose.Types.ObjectId.isValid('7cc43d7475037a1fc0aeb18e');

app.get('/todos', authenticate, (req, res) => {
  Todo.find({
    _creator : req.user.id
  }).then((docs) => {
    res.send({docs});
  }).catch((err) => {
    res.status(400).send();
  });
});


app.get('/todos/:id', authenticate, (req, res) => {
  var id = req.params.id;

  if(!(mongoose.Types.ObjectId.isValid(id))) {
      return res.status(404).send();
  }
  
  Todo.findById({
    _id: id,
    _creator: req.user.id
  }).then((doc) => {
    if(!doc) {
      return res.status(404).send();
    }
    res.send(doc);
  }, (err) => {
    res.send(err);
  }).catch((err) => {
    res.status(400).send();
  })
});

app.delete('/todos/:id',authenticate, (req, res) => {
  var id = req.params.id;

  if(!(mongoose.Types.ObjectId.isValid(id))) {
      return res.status(404).send();
  }

Todo.findOneAndDelete({
  _id : id,
  _creator : req.user.id
}).then((doc) => {
  if(!doc) {
    return res.status(404).send();
  }
  res.send(doc);
}).catch((err) => {
  return res.status(400).send();
});
});

app.patch('/todos/:id',authenticate, (req, res) => {
  var id = req.params.id;
  var body = _.pick(req.body, ['text', 'completed']);

  if (!(mongoose.Types.ObjectId.isValid(id))) {
    return res.status(404).send();
  }

  if ((_.isBoolean(body.completed)) && (body.completed)) {
    body.completeAt = new Date().getTime();
  } else {
    body.completed = false;
    body.completeAt = null;
  }

  Todo.findOneAndUpdate({
    _id: id,
    _creator : req.user.id
  }, {$set: body}, {new: true}).then((todo) => {
    if (!todo) {
      return res.status(404).send();
    }

    res.send({todo});
  }).catch((e) => {
    res.status(400).send();
  });
});

/* 'User' Resquest */

app.post('/users', (req, res) => {
  var body = _.pick(req.body, ['email', 'password']);
  var newUser = new User(body);

  newUser.save().then(() => {
    return newUser.generateAuthToken();
  }).then((token) => {
    res.header('x-auth', token).send(newUser);
  }).catch((err) => {
      res.status(400).send(err);
  });

});

app.get('/users', (req, res) => {
  User.find().then((users) => { 
    if(!users) {
      return res.status(404).send();
    }
    res.send({users});
  }).catch((err) => {
    return res.status(400).send();
  });
});

app.post('/users/login', (req, res) => {
  var body = _.pick(req.body, ['email', 'password']);

  User.findByCredentials(body.email, body.password).then(user => {
    return user.generateAuthToken().then((token) => {
      res.header('x-auth', token).send(user);
  }).catch((err) => {
    res.sendStatus(400).send();
  });
});
});

app.get('/users/me', authenticate, (req, res) => {
  res.send(req.user);
});

app.delete('/users/me/token', authenticate, (req, res) => {
  req.user.removeToken(req.token).then(() => {
    res.send('Logged Out');
  }, (err) => {
    res.sendStatus(400).send();
  });
});

app.listen(3000, () => console.log('listening on port 3000...'));
