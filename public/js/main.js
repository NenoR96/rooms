$(document).ready(function(){
  $('.delete-user').on('click', function(e){
    $target = $(e.target);
    const id = $target.attr('data-id');
    $.ajax({
      type:'DELETE',
      url: '/user/'+id,
      success: function(response){
        alert('deleting user');
        window.location.href='/';
      },
      error: function(err){
        console.log(err);
      }
    });
  });
});
