var confirmDelete = function(id) {
  $('.modal .btn-danger').click(function() {
    document.location = '/teacher/section/' + id + '/delete';
  });

  $('.modal').modal({}); // show modal
  $('.modal-dialog').css('z-index', '1500'); // move above backdrop
};