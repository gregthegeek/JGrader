var express = require('express');
var router  = express.Router();
var creds   = require('./credentials');

var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : creds.mysql_host,
  port     : creds.mysql_port,
  database : creds.mysql_db,
  user     : creds.mysql_user,
  password : creds.mysql_pass
});
connection.connect(); // we should probably close this at some point [connection.end()]

/* GET home page. */
router.get('/', function(req, res) {
  res.redirect('/teacher/section');
});

router.get('/section', function(req, res) {
  express().render('teacher/sectionList.ejs', function(err, html) {
    if(err) {
      console.log(err);
    } else {
      res.render('teacher/genericDashboard', { page: 0, content: html });
    }
  });
});

router.get('/section/create', function(req, res) {
  express().render('teacher/sectionCreate.ejs', function(err, html) {
    if(err) {
      console.log(err);
    } else {
      res.render('teacher/genericDashboard', { page: 0, content: html });
    }
  });
});

router.get('/section/:id', function(req, res) {
  // todo design page for specific section. also will this work? <req.params.id> if so do this for assignment and student too
});

// Creates class/section
router.post('/section/create', function(req, res) {
  // todo implement creation of class
  console.log(req.cookie);
  var cname = req.param('cname');

  var id = findID(req.cookie.hash);

  if(cname){
    exists(cname, req.cookie.hash, res, function() {
        connection.query("INSERT INTO 'sections' VALUES(null, ?, ?)", [cname, id], function(err, rows) {
          if(err) {
            res.render('teacher/sectionCreate', { error: 'An unknown error has occurred. Please try again later.'});
          }
        });
    });
  }
});

router.get('/assignment', function(req, res) {
  // todo design assignment list
});

router.get('/assignment/create', function(req, res) {
  express().render('teacher/createAssignment.ejs', function(err, html) { // todo design assignment creation page
    if(err) {
      console.log(err);
    } else {
      res.render('teacher/genericDashboard', { page: 1, content: html });
    }
  });
});

router.post('/assignment/create', function(req,res) {
  // todo implement creation of assignment
});

router.get('/student', function(req, res) {
  // todo design student list
});

module.exports = router;

var exists = function(cname, hash, res, finish) {
  // Get ID
  var id;
  connection.query("SELECT `id` FROM `sessions` WHERE `hash` = ?", [hash], function(err, rows) {
    if(err) {
      res.render('teacher/sectionCreate', { error: 'An unknown error has occurred. Please try again later.'});
    } else {
      id = rows[0].id;
    }
  });

  connection.query("SELECT `id` FROM `sections` WHERE `name` = ? AND 'teacher_id' = ?", [cname, id], function(err, rows) {
    if(err) {
      res.render('teacher/sectionCreate', { error: 'An unknown error has occurred. Please try again later.'});
    } else if(rows.length > 0) {
      res.render('sign-up', { error: 'A class with that name already exists.'});
    } else {
      finish();
    }
  });
}

var findID = function(hash){
  var id;
  connection.query("SELECT `id` FROM `sessions` WHERE `hash` = ?", [hash], function(err, rows) {
    if(err) {
      res.render('teacher/sectionCreate', { error: 'An unknown error has occurred. Please try again later.'});
    } else {
      id = rows[0].id;
    }
  });
  return id;
}
