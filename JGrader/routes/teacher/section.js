// Created by Brian Singer and Greg Carlin in 2015.
// Copyright (c) 2015 JGrader. All rights reserved.

require('../common');
var router = express.Router();

var render = function(page, options, res) {
  options.page = 0;
  switch(page) {
    case 'notFound':
      options.title = 'Section Not Found';
      options.type = 'section';
      break;
    case 'sectionList':
      options.title = 'Your Sections';
      options.js = ['tooltip', 'teacher/sectionList'];
      options.css = ['font-awesome.min'];
      break;
    case 'sectionCreate':
      options.title = 'Create a Section';
      break;
    case 'section':
      // title must be set already
      options.js = ['tooltip', 'teacher/edit'];
      options.css = ['font-awesome.min'];
      options.strftime = strftime;
      break;
  }
  renderGenericTeacher(page, options, res);
}

// page for listing sections
router.get('/', function(req, res) {
  connection.query("SELECT \
                      `sections`.`name`,\
                      `sections`.`id`,\
                      COUNT(`enrollment`.`student_id`) AS `count`,\
                      `assignments`.`name` AS `aname`,\
                      `assignments`.`id` AS `aid`\
                    FROM `sections` \
                    LEFT JOIN `enrollment` ON `sections`.`id` = `enrollment`.`section_id` \
                    LEFT JOIN `assignments` ON `assignments`.`section_id` = `sections`.`id` \
                    AND `assignments`.`due` = \
                      (SELECT MIN(`due`) FROM `assignments` WHERE `section_id` = `sections`.`id` AND `due` > NOW()) \
                    WHERE `sections`.`teacher_id` = ? \
                    GROUP BY `sections`.`id` \
                    ORDER BY `sections`.`name` ASC", [req.user.id], function(err, rows) {
    if(err) {
      render('sectionList', {rows: [], error: 'An unexpected error has occurred.'}, res);
      throw err;
    } else {
      render('sectionList', {rows: rows}, res);
    }
  });
});

// page for creating a new section
router.get('/create', function(req, res) {
  render('sectionCreate', {}, res);
});

// handles request to create a section
router.post('/create', function(req, res) {
  var name = req.param('name');
  if(!name || name.length <= 0) {
    render('sectionCreate', {error: 'Name cannot be blank.', name: name}, res);
  } else {
    connection.query("INSERT INTO `sections` VALUES(NULL, ?, ?, LEFT(UUID(), 5)); SELECT LAST_INSERT_ID()", [req.user.id, name], function(err, rows) {
      if(err || rows.length <= 0) {
        render('sectionCreate', {error: 'An unknown error has occurred. Please try again later.', name: name}, res);
      } else {
        res.redirect('/teacher/section/' + rows[1][0]["LAST_INSERT_ID()"]); // redirect teacher to page of newly created section
      }
    });
  }
});

// page providing info on a specific section
router.get('/:id', function(req, res) {
  var sectionID = req.params.id;
  if(sectionID && sectionID.length > 0) {
    connection.query("SELECT * FROM `sections` WHERE `id` = ? AND `teacher_id` = ?", [sectionID, req.user.id], function(err, rows) {
      if(err || rows.length <= 0) {
        render('notFound', {}, res);
      } else {
        connection.query("SELECT \
                            `assignments`.`id` AS `aid`,\
                            `assignments`.`name` AS `aname`,\
                            `assignments`.`due`,\
                            COUNT(DISTINCT(`enrollment`.`student_id`)) AS `total`,\
                            COUNT(DISTINCT(`submissions`.`student_id`)) AS `complete`,\
                            COUNT(DISTINCT(`submissions`.`grade`)) AS `graded`\
                          FROM `assignments` \
                          LEFT JOIN `enrollment` ON `enrollment`.`section_id` = ? \
                          LEFT JOIN `submissions` ON `submissions`.`assignment_id` = `assignments`.`id` \
                          WHERE `assignments`.`section_id` = ? \
                          GROUP BY `assignments`.`id` \
                          ORDER BY \
                            `assignments`.`due` DESC, \
                            `assignments`.`name` ASC", [sectionID, sectionID], function(err, results) {
          if(err) {
            render('notFound', {error: 'Error getting section'}, res);
            throw err;
          } else {
            render('section', {title: rows[0].name, sectionName: rows[0].name, sectionID: sectionID, sectionCode: rows[0].code, rows: results}, res);
          }
        });
      }
    });
  } else {
    render('notFound', {}, res);
  }
});

// POST request to update name of section
router.post('/:id/updatename/:name', function(req, res) {
  connection.query("UPDATE `sections` SET `name` = ? WHERE `id` = ? AND `teacher_id` = ?", [req.params.name, req.params.id, req.user.id], function(err, rows) {
    if(err) {
      res.json({code: -1}); // unknown error
      throw err;
    } else if(rows.affectedRows <= 0) {
      res.json({code: 2}); // no permission
    } else {
      res.json({code: 0, newValue: req.params.name});
    }
  });
});

// request for deleting a section
router.get('/:id/delete', function(req, res) {
  connection.query('DELETE FROM `sections` WHERE `id` = ? AND `teacher_id` = ? LIMIT 1', [req.params.id, req.user.id], function(err, rows) {
    if(err) {
      render('notFound', {error: 'Unable to delete class. Please go back and try again.'}, res);
      throw err;
    } else if(rows.affectedRows <= 0) {
      render('notFound', {error: 'You are not allowed to delete that class.'}, res);
    } else {
      connection.query("DELETE FROM `enrollment` WHERE `section_id` = ?; DELETE `assignments`,`submissions`,`files` FROM `assignments` LEFT JOIN `submissions` ON `submissions`.`assignment_id` = `assignments`.`id` LEFT JOIN `files` ON `files`.`submission_id` = `submissions`.`id` WHERE `assignments`.`section_id` = ?", [req.params.id, req.params.id], function(err) {
        if(err) {
          render('notFound', {error: 'Unable to delete class. Please go back and try again.'}, res);
          throw err;
        } else {
          res.redirect('/teacher/section');
        }
      });
    }
  });
});

module.exports = router;