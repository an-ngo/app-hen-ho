/* Script for nguoiyeudep.com */
(function($){
  Drupal.behaviors.nguoiyeudep = {
    attach: function (context, settings) {
      // Change value label.
      $('div#edit-field-birthdate-value-min-wrapper label').html('tới');
      $('div#edit-field-birthdate-value-max-wrapper label').html('Tuổi từ');

      // Change value select option birthday.
      var options_start = $('div#edit-field-birthdate-value-wrapper div#edit-field-birthdate-value-max-wrapper select option');
      for (let i = 1; i < options_start.length; i++) {
        var age = new Date().getFullYear() - options_start[i].value;
        options_start[i].innerHTML = age;
      }
      
      var options_end = $('div#edit-field-birthdate-value-wrapper div#edit-field-birthdate-value-min-wrapper select option');
      for (let i = 1; i < options_end.length; i++) {
        var age1 = new Date().getFullYear() - options_end[i].value;
        options_end[i].innerHTML = age1;
      }
      
      // Add elm.
      $("<div id='gender'> <label> Tôi là </label><div><select class='form-control form-select'><option value='1'>Người Nam</option><option value='2' >Người nữ</option></select> </div></div>" ).insertBefore( "form#views-exposed-form-frontpage-members-page-1 div#edit-field-gender-value-wrapper" );
      
      $("<div id='edit-tid-wrapper'><label>Để mời </label> <div><select class='form-control form-select'><option value='1'>Cùng đi chơi / đi ăn / cafe / xem phim </option><option value='2' selected='selected'>Dự sinh nhật / dự tiệc</option><option value='3'>Thăm gia đình, ra mắt bố mẹ</option><option value='4'>Đi du lịch, chơi dã ngoại / picnic</option><option value='5'>Hướng dẫn viên địa phương</option></select></div></div>" ).insertBefore( "div#edit-field-cities-tid-wrapper");
      
      // Change value button submit home page.
      $('.home-banner button#edit-submit-frontpage-members').html('Thực hiện');

    }
  };
 
})(jQuery);
;
