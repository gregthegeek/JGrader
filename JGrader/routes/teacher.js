require('./common');
var router = express.Router();

// main teacher page, redirects to section list
router.get('/', function(req, res) {
  res.redirect('/teacher/section'); // redirect to section list
});

// page for listing sections
router.get('/section', function(req, res) {
  authTeacher(req.cookies.hash, res, function(id) {
    connection.query("SELECT `sections`.`name`,`sections`.`id`,COUNT(`enrollment`.`student_id`) AS `count` FROM `sections` LEFT JOIN `enrollment` ON `sections`.`id` = `enrollment`.`section_id` WHERE `sections`.`teacher_id` = ? GROUP BY `sections`.`name`", [id], function(err, rows) {
      if(err) {
        throw err; // #yolo
      } else {
        renderGenericTeacher('sectionList', { page: 0, rows: rows }, res);
      }
    });
  });
});

// page for creating a new section
router.get('/section/create', function(req, res) {
  authTeacher(req.cookies.hash, res, function(id) {
    renderGenericTeacher('sectionCreate', { page: 0 }, res);
  });
});

// handles request to create a section
router.post('/section/create', function(req, res) {
  authTeacher(req.cookies.hash, res, function(id) {
    var name = req.param('name');
    if(name.length <= 0) {
      renderGenericTeacher('sectionCreate', { page: 0, error: 'Name cannot be blank.', name: name }, res);
    } else {
      connection.query("INSERT INTO `sections` VALUES(NULL, ?, ?); SELECT LAST_INSERT_ID()", [id, name], function(err, rows) {
        if(err || rows.length <= 0) {
          renderGenericTeacher('sectionCreate', { page: 0, error: 'An unknown error has occurred. Please try again later.', name: name }, res);
        } else {
          res.redirect('/teacher/section/' + rows[1][0]["LAST_INSERT_ID()"]); // redirect teacher to page of newly created section
        }
      });
    }
  });
});

// page providing info on a specific section
router.get('/section/:id', function(req, res) {
  authTeacher(req.cookies.hash, res, function(teacherID) {
    var sectionID = req.params.id;
    if(sectionID && sectionID.length > 0) {
      connection.query("SELECT * FROM `sections` WHERE `id` = ? AND `teacher_id` = ?", [sectionID, teacherID], function(err, rows) {
        if(err || rows.length <= 0) {
          renderGenericTeacher('notFound', { page: 0, type: 'section' }, res);
        } else {
          renderGenericTeacher('section', { page: 0, sectionName: rows[0].name }, res);
        }
      });
    } else {
      renderGenericTeacher('notFound', { page: 0, type: 'section' }, res);
    }
    });
});

// page that lists assignments
router.get('/assignment', function(req, res) {
  authTeacher(req.cookies.hash, res, function(id) {
    connection.query("SELECT `assignments`.`id` AS `aid`,`assignments`.`name` AS `aname`,`sections`.`id` AS `sid`,`sections`.`name` AS `sname` FROM `sections`,`assignments` WHERE `sections`.`id` = `assignments`.`section_id` AND `sections`.`teacher_id` = ? ORDER BY `assignments`.`due` DESC", [id], function(err, rows) {
      if(err) {
        throw err; // #yolt
      } else {
        renderGenericTeacher('assignmentList', { page: 1, rows: rows }, res);
      }
    });
  });
});

// page for creating a new assignment
router.get('/assignment/create', function(req, res) {
  renderGenericTeacher('assignmentCreate', { js: ['jquery.datetimepicker', 'datepicker'], css: ['jquery.datetimepicker'], page: 1 }, res);
});

// handles request to create an assignment
router.post('/assignment/create', function(req,res) {
  // todo implement creation of assignment
});

router.get('/assignment/:id', function(req, res) {
  // todo assignment page
});

// todo all student stuff
router.get('/student', function(req, res) {
  renderGenericTeacher('studentList', { page: 2 }, res);
});

module.exports = router;