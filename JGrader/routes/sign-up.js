// Created by Brian Singer and Greg Carlin in 2015.
// Copyright (c) 2015 JGrader. All rights reserved.

require('./common');
var router = express.Router();
var crypto  = require('crypto');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('sign-up', {error: req.query.error});
});

// checks if a user exists in a given database. calls finish() iff user doesn't exist.
var exists = function(user, db, res, finish) {
  connection.query("SELECT `id` FROM `" + db + "` WHERE `user` = ?", [user.email], function(err, rows) {
    if(err) {
      res.render('sign-up', { error: 'An unknown error has occurred. Please try again later.', user: user });
    } else if(rows.length > 0) {
      res.render('sign-up', { error: 'An account with that email already exists.', user: user });
    } else {
      finish();
    }
  });
}

router.post('/', function(req, res) {
  var user = {};
  user.fname = req.param('fname');
  user.lname = req.param('lname');
  user.email = req.param('email');
  user.pass  = req.param('password');
  user.role  = req.param('role');
  if(user.fname && user.lname && user.email && user.pass && user.role && (user.role == 'student' || user.role == 'teacher' || user.role == 'assistant')) {
    exists(user, 'students', res, function() {
      exists(user, 'teachers', res, function() {
        exists(user, 'assistants', res, function() {
          connection.query("INSERT INTO `" + user.role + "s` VALUES(NULL, ?, AES_ENCRYPT(?, '" + creds.aes_key + "'), ?, ?)", [user.email, user.pass, user.fname, user.lname], function(err, rows) {
            if(err) {
              res.render('sign-up', { error: 'An unknown error has occurred. Please try again later.', user: user });
            } else {
              connection.query("SELECT `id` FROM `" + user.role + "s` WHERE `user` = ?", [user.email], function(err, rows) {
                if(err || rows.length <= 0) {
                  res.render('sign-up', { error: 'An unknown error has occurred. Please try again later.', user: user });
                } else {
                  var hash = crypto.randomBytes(20).toString('hex'); // http://stackoverflow.com/a/14869745/720889
                  res.cookie('hash', hash);
                  connection.query('INSERT INTO `sessions-' + user.role + 's` VALUES(?, ?)', [rows[0].id, hash], function(err, rows) {
                    if(err) {
                      res.render('sign-up', { error: 'An unknown error has occurred. Please try again later.', user: user });
                    } else {
                      res.redirect('/' + user.role);
                    }
                  });
                }
              });
            }
          });
        });
      });
    });
  } else {
    res.render('sign-up', { error: 'All fields are required.', user: user });
  }
});

module.exports = router;

