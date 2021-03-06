// Created by Brian Singer and Greg Carlin in 2015.
// Copyright (c) 2015 JGrader. All rights reserved.

var URL = function() {
  var base = location.protocol + '//' + location.host + location.pathname;
  if (base.substring(base.length - 1) != '/') base += '/';
  return base;
};

$('#input-expand').click(function() {
  var inputExpand = $('#input-expand');
  inputExpand.toggleClass('fa-caret-square-o-right');
  inputExpand.toggleClass('fa-caret-square-o-down');
  $('#input-text').toggle();
});

var disabled = false;
$('#execute').click(function() {
  if (!disabled) {
    $('#output-text').html('<span class="fa fa-refresh fa-spin"></span>');
    var fileID = $('.tab-content .active').attr('id');
    $.post(URL() + 'run/' + fileID, {
      stdin: $('#input-text').val()
    }, function(data, textStatus, jqXHR) {
      if (data.code == 0) {
        $('#output-text').html(
          data.out + '\n\n<span class="stderr">' + data.err + '</span>');
      } else {
        alert('An error has occurred, please reload the page and try again.');
      }
    });
  }
});

$('#download').click(function() {
  var fileID = $('.tab-content .active').attr('id');
  var win = window.open(URL() + 'download/' + fileID, '_blank');
  win.focus();
});

$('#test').click(function() {
  if (!disabled) {
    $('#output-text').html('<span class="fa fa-refresh fa-spin"></span>');
    var fileID = $('.tab-content .active').attr('id');
    $.get(URL() + 'test/' + fileID, {}, function(data, textStatus, jqXHR) {
      switch (data.code) {
        case -1:
        case 1:
        default:
          alert('An unknown error has occurred. ' +
                'Please reload the page and try again.');
          break;
        case 2:
          alert('Error: The code is taking too long to execute.');
          break;
        case 0:
          var output = '';
          var passes = 0;
          var fails = 0;
          for (var i in data.results) {
            output += 'Input: ' + data.results[i].input + ', Expected: ' +
                   data.results[i].expected + ', Actual: ' +
                   data.results[i].result + ' ';
            if (data.results[i].result == data.results[i].expected) {
              passes++;
              output += '[PASS] <span class="fa fa-check';
            } else {
              fails++;
              output += '[FAIL] <span class="fa fa-times';
            }
            output += '-circle"></span><br />';
          }
          output += '-------------------------------------------------<br />';
          output += passes + ' of ' + (passes + fails) + ' tests passed.';
          $('#output-text').html(output);
          break;
      }
    });
  }
});

$('.nav-tabs a[data-toggle="tab"]').click(function() {
  if ($(this).attr('data-canrun') == 'true') {
    $('#execute').tooltip();
    $('#execute').removeClass('disabled');
    $('#test').tooltip();
    $('#test').removeClass('disabled');
    disabled = false;
  } else {
    $('#execute').tooltip('destroy');
    $('#execute').addClass('disabled');
    $('#test').tooltip('destroy');
    $('#test').addClass('disabled');
    disabled = true;
  }
});

$(window).load(function() {
  if ($('.nav-tabs .active a[data-toggle="tab"]')
      .attr('data-canrun') == 'false') {
    $('#execute').tooltip('destroy');
    $('#execute').addClass('disabled');
    $('#test').tooltip('destroy');
    $('#test').addClass('disabled');
    disabled = true;
  }
});

