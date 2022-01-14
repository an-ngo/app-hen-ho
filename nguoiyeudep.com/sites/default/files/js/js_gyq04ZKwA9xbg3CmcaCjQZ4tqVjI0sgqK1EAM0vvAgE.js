/**
 * Facebook features.
 * Photos and login.
 */
var facebook_photos_ids = [];

// Events handler.
(function ($) {
  // Facebook connect.
  Drupal.behaviors.giaidieu_facebook = {
    attach: function (context) {
      // Init Facebook SDK and Init function.
      window.fbAsyncInit = function() {
        FB.init({
          appId            : Drupal.settings['giaidieu_facebook_app_id'],
          autoLogAppEvents : true,
          xfbml            : false,
          version          : 'v2.10'
        });
        FB.AppEvents.logPageView();

	      // Check and react when FB login status change.
	      FB.getLoginStatus(function(response) {
		      facebook_login_state_change_callback(response);
	      });
      };

      // Load SDK.
      (function(d, s, id){
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {return;}
        js = d.createElement(s); js.id = id;
        js.src = "//connect.facebook.net/vi_VN/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
      
      // Handle Facebook login event.
      $("ul.custom-social-list li[rel='facebook']:not('.processed'), #facebookSignin:not('.processed')").click(function() {
        FB.getLoginStatus(function(response) {
          if (response.status === 'connected') {
            FB.api('/me?fields=id,name,first_name,last_name,birthday,email,gender,picture.type(large)', function(response) {
              response['caller'] = 'facebook';
              
              response = custom_response_process(response);
              custom_social_network_login(response);
            });
          }
          else {
            FB.login(function(response) {
              if (response.authResponse) {
                FB.api('/me?fields=id,name,first_name,last_name,birthday,email,gender,picture.type(large)', function(response) {
                  response['caller'] = 'facebook';
                  
                  response = custom_response_process(response);
                  custom_social_network_login(response);
                });
              }
              else{
                //console.log('User cancelled login or did not fully authorize.');
                custom_dialog_alert('Thông báo', 'Bạn chưa hoàn thành việc đăng nhập vào tài khoản Facebook của mình.');
              }
            }, {scope: 'email,public_profile,user_birthday,user_gender,user_photos'});
          }
        });
        
        $(this).addClass('processed');
        return false;
      });
    }
  };
  
  // Facebook photo uploader.
  Drupal.behaviors.giaidieu_facebook_photos_uploader = {
    attach: function (context) {
      if (Drupal.settings['facebook_photo_is_enabled'] == undefined || !Drupal.settings['facebook_photo_is_enabled']) {
        return false;
      }
      
      // Setup default avatar if any.
      if (Drupal.settings['field_photo_default_url'] != undefined) {
        var image_wrapper = jQuery('<div class="photo-thumb-wrapper">Đang tải</div>');
        var wrapper = jQuery("#photo-avatar-files").closest('.photo-field-wrapper');
        
        wrapper.find(".photos-desc").css('display', 'none');
        wrapper.find(".photos-list").html(image_wrapper);

        var image = jQuery('<img src="' + Drupal.settings['field_photo_default_url'] + '" class="photo-thumb" alt="' + Drupal.settings['field_photo_default_filename'] + '" fid="' + Drupal.settings['field_photo_default_fid'] + '" />');
        image_wrapper.addClass('loaded').attr('fid', Drupal.settings['field_photo_default_fid']);
        image_wrapper.html(image);
      }
      
      // Setup default FB photos.
      if (Drupal.settings['field_images'] != undefined) {
        var wrapper = jQuery("#photo-canvas-files").closest('.photo-field-wrapper');
        wrapper.find(".photos-desc").css('display', 'none');
        
        for (var i = 0; i < Drupal.settings['field_images'].length; i++) {
          var file = Drupal.settings['field_images'][i];
          var image_wrapper = jQuery('<div class="photo-thumb-wrapper">Đang tải</div>');
          var image = jQuery('<img src="' + file['field_photo_default_url'] + '" class="photo-thumb" alt="' + file['field_photo_default_filename'] + '" fid="' + file['field_photo_default_fid'] + '" />');

          image_wrapper.addClass('loaded').attr('fid', file['field_photo_default_fid']);
          image_wrapper.html(image);
          image_wrapper.append('<span class="controls" onclick="giaidieu_facebook_photo_remove(this);"><i class="fa fa-times" aria-hidden="true" title="Nhấn để bỏ ảnh này"></i></span>');

          // Add draggable to this object.
          jQuery(image_wrapper).draggable({revert: true});

          wrapper.find(".photos-list").append(image_wrapper);
        }
      }
      
      // Dropable for avatar field.
      jQuery("#photo-avatar").droppable({
        drop: function(event, ui) {
          var fid = jQuery(ui.draggable).attr('fid');
          if (fid == undefined || parseInt(fid) < 1) {
            custom_dialog_alert('Thông báo', 'Lỗi chưa xác định. Vui lòng tải lại trang hoặc liên hệ chúng tôi để nhận trợ giúp.');
            return false;
          }
          
          // Send this Fid to create a new image file.
          var loading_message = _custom_dialog_ajax_loading();
          jQuery.post('/custom/fid-photo-upload', {fid: fid}, function(result) {
            loading_message.dialog('close');

            var wrapper = jQuery("#photo-avatar");
        
            // Hide desc.
            wrapper.find(".photos-desc").css('display', 'none');

            // Add to avatar field.
            var params = result.split(/\|/);
            var photo_div = '<div class="photo-thumb-wrapper loaded" fid="' + params[0] + '"><img src="' + params[1] + '" class="photo-thumb" alt="" fid="' + params[0] + '"></div>';
            
            wrapper.find(".photos-list").html(photo_div);

            // Add to fid list.
            jQuery("input[name='photo_avatar']").val(params[0]);
          });
        }
      });
      
      // Load the photo avatar uploader handler.
      giaidieu_file_handler('photo-avatar-files', {min_width: 400, min_height: 400, max_filesize: 5, url: '/custom/photo-upload'}, function(op, obj) {
        var wrapper = jQuery("#photo-avatar-files").closest('.photo-field-wrapper');
        
        // Hide desc.
        wrapper.find(".photos-desc").css('display', 'none');

        // Add to list.
        if (op == 'wrapper') {
          wrapper.find(".photos-list").html(obj);
        }
        else{
          wrapper.find(".photos-list .photo-thumb-wrapper[fid='" + jQuery(obj).attr('fid') + "']").addClass('loaded').html(obj);

          // Add to fid list.
          jQuery("input[name='photo_avatar']").val(obj.attr('fid'));
        }
      });

      giaidieu_file_handler('photo-canvas-files', {min_width: 400, min_height: 400, max_filesize: 5, url: '/custom/photo-upload'}, function(op, obj) {
        var wrapper = jQuery("#photo-canvas-files").closest('.photo-field-wrapper');
        
        // Hide desc.
        wrapper.find(".photos-desc").css('display', 'none');

        // Add to list.
        if (op == 'wrapper') {
          wrapper.find(".photos-list").append(obj);
        }
        else{
          var image_wrapper = wrapper.find(".photos-list .photo-thumb-wrapper[fid='" + jQuery(obj).attr('fid') + "']");
          image_wrapper.addClass('loaded').html(obj);

          image_wrapper.append('<span class="controls" onclick="giaidieu_facebook_photo_remove(this);"><i class="fa fa-times" aria-hidden="true" title="Nhấn để bỏ ảnh này"></i></span>');

          // Add draggable to this object.
          jQuery(image_wrapper).draggable({revert: true});

          // Add to fid list.
          giaidieu_facebook_fids_topup(obj.attr('fid'));
        }
      });

      // Detect HTML 5 DnD feature.
      if (Modernizr.draganddrop) {
        // Photo avatar.
        // Add event listener to the Photo dropable placeholder.
        var photo_avatar = document.getElementById('photo-avatar');
        if (!photo_avatar) {return false;}

        photo_avatar.addEventListener('dragover', giaidieu_file_drag_handler, false);
        photo_avatar.addEventListener('drop', function(e) {
          // Get the files.
          e.stopPropagation();
          e.preventDefault();

          var files = null;
          if (e.dataTransfer != undefined) {
            files = e.dataTransfer.files;
          }
          else{
            files = e.target.files;
          }
          
          if (files) {
            giaidieu_file_drop_handler(files, {min_width: 400, min_height: 400, max_filesize: 5, url: '/custom/photo-upload'}, function(op, obj) {
              var wrapper = jQuery("#photo-avatar-files").closest('.photo-field-wrapper');
        
              // Hide desc.
              wrapper.find(".photos-desc").css('display', 'none');

              // Add to list.
              if (op == 'wrapper') {
                wrapper.find(".photos-list").html(obj);
              }
              else{
                wrapper.find(".photos-list .photo-thumb-wrapper[fid='" + jQuery(obj).attr('fid') + "']").addClass('loaded').html(obj);

                // Add to fid list.
                jQuery("input[name='photo_avatar']").val(obj.attr('fid'));
              }
            });
          }
        }, false);

        // Photo canvas.
        // Add event listener to the Photo dropable placeholder.
        var photo_canvas = document.getElementById('photo-canvas');
        if (!photo_canvas) {return false;}

        photo_canvas.addEventListener('dragover', giaidieu_file_drag_handler, false);
        photo_canvas.addEventListener('drop', function(e) {
          // Get the files.
          e.stopPropagation();
          e.preventDefault();

          var files = null;
          if (e.dataTransfer != undefined) {
            files = e.dataTransfer.files;
          }
          else{
            files = e.target.files;
          }
          
          // Control number of files allowed.
          var total_files = jQuery("input[name='facebook_photos']").val() != '' ? parseInt(jQuery("input[name='facebook_photos']").val().split(/\,/).length) : 0;
          var total_max = 20;
          var total_uploads = parseInt(files.length);
          
          if (total_files >= total_max) {
            custom_dialog_alert('Thông báo', 'Số ảnh hiện có của bạn đã ở hạn mức là ' + total_max + '. Vui lòng bỏ bớt để tải ảnh mới.');
            return false;
          }
          else if (total_files + total_uploads > total_max) {
            var remain = total_files + total_uploads - total_max;
            custom_dialog_alert('Thông báo', "Số ảnh hiện có của bạn là " + total_files + ". Số ảnh đưa lên là " + total_uploads + " đã vượt quá hạn mức tối đa " + total_max + " ảnh.\nVui lòng bỏ bớt " + remain + " ảnh rồi thử lại.");
            return false;
          }
          
          if (files) {
            giaidieu_file_drop_handler(files, {min_width: 400, min_height: 400, max_filesize: 5, url: '/custom/photo-upload'}, function(op, obj) {
              var wrapper = jQuery("#photo-canvas-files").closest('.photo-field-wrapper');
        
              // Hide desc.
              wrapper.find(".photos-desc").css('display', 'none');

              // Add to list.
              if (op == 'wrapper') {
                wrapper.find(".photos-list").append(obj);
              }
              else{
                var photo_div = wrapper.find(".photos-list .photo-thumb-wrapper[fid='" + jQuery(obj).attr('fid') + "']");
                photo_div.addClass('loaded').html(obj);
                photo_div.append('<span class="controls" onclick="giaidieu_facebook_photo_remove(this);"><i class="fa fa-times" aria-hidden="true" title="Nhấn để bỏ ảnh này"></i></span>');
                // Add draggable to this object.
                jQuery(photo_div).draggable({revert: true});

                // Add to fid list.
                giaidieu_facebook_fids_topup(obj.attr('fid'));
              }
            });
          }
        }, false);
      }
    }
  };

  // Facebook photos loader - depend on FB object, need to load it.
  Drupal.behaviors.giaidieu_facebook_photos_loader = {
    attach: function (context) {
      if (Drupal.settings['facebook_photo_is_enabled'] == undefined || !Drupal.settings['facebook_photo_is_enabled']) {
        return false;
      }

      // Handle to load an album.
      $("#custom-facebook-photos-wrapper").on('click', '.album-item', function() {
        // Go back to top.
        //$(window).scrollTop(50);

        // Get values.
        var album_id = $(this).attr('album_id');
        var album_name = $(this).children('.album-name').html();
        var album_count = $(this).children('.album-count').html().replace(/\(|\)/g, '');

        // Create a new page with for the album.
        $("#custom-facebook-photos-wrapper").children('.popup-page').removeClass('active');

        if ($("#custom-facebook-photos-wrapper #album-" + album_id).length) {
          $("#custom-facebook-photos-wrapper #album-" + album_id).addClass('active');

          // Update breadcrumb.
 	        custom_facebook_update_breadcrumb('album-' + album_id);

          return false;
        }
        else{
          $("#custom-facebook-photos-wrapper").append('<div id="album-' + album_id + '" class="popup-page active" album_name="' + album_name + '" album_count="' + album_count + '"></div>');

          // Update breadcrumb.
 	        custom_facebook_update_breadcrumb('album-' + album_id);
        }

        // Get album photos.
        FB.api('/' + album_id + '/photos', function(photos) {
          for (var i = 0; i < photos.data.length; i++) {
		        var photo = photos.data[i];
				    var photo_div = $('<div class="photo-item" id="' + album_id + '-' + photo.id + '"></div>');

            $("#custom-facebook-photos-wrapper #album-" + album_id).append(photo_div);
          }

          // Fetch photos.
          $("#custom-facebook-photos-wrapper #album-" + album_id + " .photo-item").each(function() {
            var params = $(this).attr('id').split(/\-/);
            var id = params[1];

            // Get album cover.
            FB.api('/' + id, {fields: 'images'}, function(photo_item) {
              var photo_index = photo_item.images.length > 2 ? photo_item.images.length - 2 : photo_item.images.length - 1;

              var image = '<img src="' + photo_item.images[photo_index]['source'] + '" />';
              $("#" + album_id + '-' + id).append(image);
            });
          });
        });

        return false;
      });

      // Breadcrumb home switch.
      $("#popup-breadcrumb").on('click', '.home-switch', function() {
        $("#custom-facebook-photos-wrapper").children('.popup-page').removeClass('active');
        $("#custom-facebook-photos-wrapper #album_home").addClass('active');

        custom_facebook_update_breadcrumb('album_home');

        return false;
      });

      // Photo item selection.
      $("#custom-facebook-photos-wrapper").on('click', '.photo-item', function() {
        if ($(this).hasClass('selected')) {
          $(this).removeClass('selected');
          $(this).find('.photo-selected').remove();
        }
        else{
          $(this).addClass('selected');
          $(this).append('<span class="photo-selected">Đã chọn</span>');
        }

        return false;
      });
    }
  };

})(jQuery);

// Helper function to reprocess data for response.
function custom_response_process(response) {
  if (response['name'] != undefined) {
    response['field_full_name'] = {'value': response['name']};
    response['name'] = null;
  }

  if (response['gender'] != undefined) {
    if (response['gender'] == 'male') {
      response['field_gender'] = {'value': 1};
    }
    else if (response['gender'] == 'female') {
      response['field_gender'] = {'value': 0};
    }

    response['gender'] = null;
  }

  if (response['birthday'] != undefined) {
    var bithday_params = response['birthday'].split(/\//);
    var birthday_date = new Date(bithday_params[2], parseInt(bithday_params[0]) - 1, bithday_params[1], 1, 0, 0, 0);
    response['field_birthdate'] = {'value': Math.floor(birthday_date.getTime() / 1000)};
                
    response['birthday'] = null;
  }

  return response;
}

// Update breadcrumb.
function custom_facebook_update_breadcrumb(div_id) {
  var home_count = jQuery("#album_home").attr('count');

  if (div_id == 'album_home') {
    jQuery("#popup-breadcrumb").empty().html('<span class="name">Album ảnh</span> <span class="count">(' + home_count + ')</span>');
  }
  else{
    var div_home = '<span class="home-switch"><span class="name">Album ảnh</span> <span class="count">(' + home_count + ')</span></span>';
    var div_album = '<span class="name">' + jQuery("#" + div_id).attr('album_name') + '</span> <span class="count">(' + jQuery("#" + div_id).attr('album_count') + ')</span>';
    jQuery("#popup-breadcrumb").empty().append(div_home + ' <span class="splitter">></span> ' + div_album);
  }
}

/**
 * Handle when remove a photo.
 */
function giaidieu_facebook_photo_remove(obj) {
  custom_dialog_confirm("Xác nhận", "Bạn chắc chắn muốn bỏ ảnh này?\nẢnh sẽ bị xóa và không thể phục hồi sau khi nhấn nút 'Cập nhật hồ sơ'.", 400, 'auto', true, function() {
    var fid = parseInt(jQuery(obj).closest('div.photo-thumb-wrapper').attr('fid'));
    if (!fid) {
      custom_dialog_alert('Thông báo', 'Không tìm thấy thông tin file ảnh. Vui lòng thử lại sau.');
      return false;
    }
    
    // Close the popup.
    jQuery("#custom-dialog-confirm").dialog("close");
    
    // Remove from the list.
    jQuery(obj).closest('div.photo-thumb-wrapper').fadeOut(function() {
      jQuery(this).remove();
      giaidieu_facebook_fids_remove(fid);
    });
  });
  
  /*
  if (confirm("Bạn chắc chắn muốn bỏ ảnh này?\nẢnh sẽ bị xóa và không thể phục hồi sau khi nhấn nút 'Cập nhật hồ sơ' bên dưới.")) {
    var fid = parseInt(jQuery(obj).attr('fid'));
    if (!fid) {
      custom_dialog_alert('Thông báo', 'Không tìm thấy thông tin file ảnh. Vui lòng thử lại sau.');
      return false;
    }
    
    // Remove from the list.
    jQuery(obj).fadeOut(function() {
      giaidieu_facebook_fids_remove(fid);
    });
  }
  */
  
  return false;
}

/**
 * Trigger select photos from PC.
 */
function giaidieu_facebook_photo_pc_trigger(obj) {
  jQuery(obj).closest("div.buttons-wrapper").find("input[type='file']").trigger('click');
  return false;
}

/**
 * Trigger select photos from FB. 
 */
function giaidieu_facebook_photo_fb_trigger(obj) {
  // Check FB SDK.
  if (FB == undefined) {
    custom_dialog_alert('Thông báo', 'Chưa kết nối được tới thư viện Facebook. Vui lòng thử lại (reload trang).');
    return false;
  }
  
  // Check if already login to FB, if not, login.
  FB.getLoginStatus(function(response) {
    if (response.status != 'connected') {
      // Do login.
		  FB.login(function(response) {
				if (response.authResponse) {
			    // Fetch albums and put on a dialog.
			    giaidieu_facebook_fetch_photos();
		    }
				else{
			    custom_dialog_alert('Thông báo', 'Bạn cần đăng nhập vào tài khoản Facebook để lấy ảnh.');
		    }
		  });
    }
    else{
      // Fetch albums and put on a dialog.
      giaidieu_facebook_fetch_photos();
    }
  });

  return false;
}

// Fetch user albums / photos.
// Put on a dialog.
function giaidieu_facebook_fetch_photos() {
  // Go top to open the dialog.
  //jQuery(window).scrollTop(50);

  // Show a dialog.
  if (jQuery("#custom-facebook-photos-wrapper").hasClass('ui-dialog-content')) {
    jQuery("#custom-facebook-photos-wrapper").dialog('open');
    return false;
  }

  jQuery("#custom-facebook-photos-wrapper").dialog({
    autoOpen: true,
    height: 495,
    width: 620,
    modal: true,
    title: 'Lấy ảnh từ Facebook',
    buttons: [
      {text: 'Chọn những ảnh đã đánh dấu', class: 'custom-dialog primary', click: function() {
        // Get all the selected photos.
        var fb_photos = new Array();
        jQuery("#custom-facebook-photos-wrapper .photo-item.selected").each(function() {
          if (jQuery.inArray(jQuery(this).attr('id'), facebook_photos_ids) == -1) {
            fb_photos.push(jQuery(this).attr('id'));
            facebook_photos_ids.push(jQuery(this).attr('id'));
          }
        });
        
        // Create photo item in canvas photo list.
        for (var i = 0; i < fb_photos.length; i++) {
          var ids = fb_photos[i].split(/\-/);
          var photo_item = jQuery('<div class="photo-thumb-wrapper" rel="fb" album_id="' + ids[0] + '" photo_id="' + ids[1] + '"></div>');
          jQuery("#photo-canvas div.photos-list").append(photo_item);
          jQuery("#photo-canvas div.photos-desc").addClass('has-thumb');
          jQuery("#photo-canvas").removeClass('error');
        }

        // Fetch the photo from fb to the canvas.
        jQuery("#photo-canvas .photos-list .photo-thumb-wrapper[rel='fb']:not('.loaded')").each(function() {
          var photo_id = jQuery(this).attr('photo_id');
          var photo_div = jQuery(this);
          photo_div.html('Đang tải');

          FB.api('/' + photo_id, {fields: 'images'}, function(photo) {
            // Put to server.
            jQuery.post('/custom/fb-photo-upload', {url: photo.images[0]['source']}, function(result) {
              var params = result.split(/\|/);
              var fid = parseInt(params[0]);
              
              if (fid > 0) {
                // Hide desc.
                jQuery("#photo-canvas .photos-desc").css('display', 'none');

                // Update image to thumb placeholder.
                var img = '<img src="' + params[1] + '" class="photos-thumb" alt="' + photo_id +'" fid="' + fid + '" />';
                photo_div.empty().append(img);
                photo_div.addClass('loaded').attr('fid', fid);
                photo_div.append('<span class="controls" onclick="giaidieu_facebook_photo_remove(this);"><i class="fa fa-times" aria-hidden="true" title="Nhấn để bỏ ảnh này"></i></span>');
                
                // Add draggable to this object.
                jQuery(photo_div).draggable({revert: true});
                
                giaidieu_facebook_fids_topup(fid);
              }
            });
          });
        });

        jQuery(this).dialog('close');
      }},
      {text: 'Huỷ bỏ', class: 'custom-dialog secondary', click: function() {
        jQuery(this).dialog('close');
      }}
    ]
  });

  // Put on albums.
  FB.api('/me', {fields: 'albums.limit(500){name,count,cover_photo}'}, function(response) {
    //console.log(response);
    
    if (response.albums == undefined) {
      custom_dialog_alert('Thông báo', 'Bạn không có album ảnh nào ở chế độ công khai để tải về. Vui lòng kiểm tra rồi thử lại.');
      return false;
    }
    
    jQuery("#custom-facebook-photos-wrapper").children('.popup-page').removeClass('active');
    jQuery("#custom-facebook-photos-wrapper").append('<div id="album_home" count="' + response.albums.data.length + '" class="popup-page active"></div>');

    // Update breadcrumb.
    giaidieu_facebook_update_breadcrumb('album_home');

    for (var i = 0; i < response.albums.data.length; i++) {
      var album = response.albums.data[i];
      var album_cover = '<span class="album-cover"><img src="https://nguoiyeudep.com/sites/default/files/default_images/no_cover.png" alt="' + album.name + '" /></span>';
      
      if (album.cover_photo != undefined && album.cover_photo.id != undefined) {
        album_cover = '<span class="album-cover" id="' + album.cover_photo.id + '"></span>';
      }

      var album_div = jQuery('<div class="album-item" album_id="' + album.id + '">' + album_cover + '<span class="album-name">' + album.name + '</span> <span class="album-count">(' + album.count + ')</span>' + '</div>');

      jQuery("#custom-facebook-photos-wrapper #album_home").append(album_div);
    }

    jQuery("#custom-facebook-photos-wrapper #album_home .album-cover").each(function() {
      var id = jQuery(this).attr('id') != undefined ? jQuery(this).attr('id') : 0;
      
      if (id != 0) {
        // Get album cover.
        FB.api('/' + id, {fields: 'images'}, function(photo) {
          var image = '<img src="' + photo.images[photo.images.length - 2]['source'] + '" />';
          jQuery("#" + id).append(image);
        });
      }
    });
  });
}

/**
 * Topup fid to the list.
 */
function giaidieu_facebook_fids_topup(fid) {
  var fids = jQuery("input[name='facebook_photos']").val();
  if (fids != '') {
    fids = fids.split(/\,/);
  }
  else{
		fids = new Array();
  }

  fids.push(fid);
  
  // Make sure no duplication.
  var new_fids = new Array();
  for (var i = 0; i < fids.length; i++) {
    if (jQuery.inArray(fids[i], new_fids) == -1) {
      new_fids.push(fids[i]);
    }
  }

  jQuery("input[name='facebook_photos']").val(new_fids.join(','));
  
  // Update to display area.
  var max_files = parseInt(jQuery("#photo-canvas-wrapper .photo-canvas-desc p.report .photo-max").html());
  jQuery("#photo-canvas-wrapper .photo-canvas-desc p.report .photo-current").html(new_fids.length).css('font-size', '16px');
  jQuery("#photo-canvas-wrapper .photo-canvas-desc p.report .photo-remain").html(max_files - new_fids.length).css('font-size', '16px');
  
  jQuery("#photo-canvas-wrapper .photo-canvas-desc p.report .photo-current").animate({'fontSize': '13px'});
  jQuery("#photo-canvas-wrapper .photo-canvas-desc p.report .photo-remain").animate({'fontSize': '13px'});
}

/**
 * Revove fid to the list.
 */
function giaidieu_facebook_fids_remove(fid) {
  var fids = jQuery("input[name='facebook_photos']").val();
  if (fids != '') {
    fids = fids.split(/\,/);
  }
  else{
		fids = new Array();
  }
  
  // Remove from the list.
  var new_fids = new Array();
  for (var i = 0; i < fids.length; i++) {
    if (fids[i] != fid) {
      new_fids.push(fids[i]);
    }
  }
  
  if (!new_fids.length) {
    jQuery("input[name='facebook_photos']").val('');
  }
  else{
    jQuery("input[name='facebook_photos']").val(new_fids.join(','));
  }

  // Update to display area.
  var max_files = parseInt(jQuery("#photo-canvas-wrapper .photo-canvas-desc p.report .photo-max").html());
  jQuery("#photo-canvas-wrapper .photo-canvas-desc p.report .photo-current").html(new_fids.length).css('font-size', '16px');
  jQuery("#photo-canvas-wrapper .photo-canvas-desc p.report .photo-remain").html(max_files - new_fids.length).css('font-size', '16px');
  
  jQuery("#photo-canvas-wrapper .photo-canvas-desc p.report .photo-current").animate({'fontSize': '13px'});
  jQuery("#photo-canvas-wrapper .photo-canvas-desc p.report .photo-remain").animate({'fontSize': '13px'});
  
  // Update the photo list area if no more images.
  if (!new_fids.length) {
    jQuery("#photo-canvas").html('<div class="photos-desc"><p class="desc heading">Thư viện ảnh</p><p class="desc">Chưa có ảnh nào được tải lên!</p></div><div class="photos-list"></div>');
  }
}

// Update breadcrumb.
function giaidieu_facebook_update_breadcrumb(div_id) {
  var home_count = jQuery("#album_home").attr('count');

  if (div_id == 'album_home') {
    jQuery("#popup-breadcrumb").empty().html('<span class="name">Album ảnh</span> <span class="count">(' + home_count + ')</span>');
  }
  else{
    var div_home = '<span class="home-switch"><span class="name">Album ảnh</span> <span class="count">(' + home_count + ')</span></span>';
    var div_album = '<span class="name">' + jQuery("#" + div_id).attr('album_name') + '</span> <span class="count">(' + jQuery("#" + div_id).attr('album_count') + ')</span>';
    jQuery("#popup-breadcrumb").empty().append(div_home + ' <span class="splitter">></span> ' + div_album);
  }
}

// Handle login state change.
function facebook_login_state_change_callback(response) {
	if (response.status === 'connected') {
		// Logged into your app and Facebook.
		// Scope: public_profile,email,user_birthday,user_location,user_photos,user_about_me
		FB.api('/me', {fields: 'id,name,gender,about,birthday,email,photos.limit(10).order(reverse_chronological),location'}, function(response) {
		  if (document.getElementById('fb-tooltip') != null) {
		    document.getElementById('fb-tooltip').innerHTML = 'Bạn đang dùng tài khoản FB dưới tên: ' + response.name;
		  }

		  // Auto fill to fields.
      jQuery("#edit-field-full-name-und-0-value").val(response.name);
		  //document.getElementById('edit-title').value = response.name;

		  jQuery("#edit-field-facebook-und-0-value").val('https://www.facebook.com/' + response.id);
      //document.getElementById('edit-field-facebook-und-0-value').value = 'https://www.facebook.com/' + response.id;

		  if (response.about != undefined) {
		    jQuery("#edit-field-desc-und-0-value").val(response.about);
		    //document.getElementById('edit-field-desc-und-0-value').value = response.about;
		  }

		  if (response.gender != undefined) {
		    if (response.gender == 'male') {
		      jQuery("#edit-field-gender-und-1").prop('checked', true);
		      //document.getElementById('edit-field-gender-und-1').checked = true;
		    }
		    else{
		      jQuery("#edit-field-gender-und-0").prop('checked', true);
		      //document.getElementById('edit-field-gender-und-0').checked = true;
		    }
		  }

		  if (response.birthday != undefined) {
		    var birthday = response.birthday.split(/\//);
		    //document.getElementById('edit-field-dob-und-0-value-day').value = parseInt(birthday[1]);
		    //document.getElementById('edit-field-dob-und-0-value-month').value = parseInt(birthday[0]);
		    //document.getElementById('edit-field-dob-und-0-value-year').value = parseInt(birthday[2]);
		  }

      if (response.email != undefined) {
        jQuery("#edit-mail").val(response.email);
		    //document.getElementById('edit-field-email-und-0-value').value = response.email;
		  }

		});
	}
	else if (response.status === 'not_authorized') {
		// The person is logged into Facebook, but not your app.
		if (document.getElementById('fb-tooltip') != null) {
		  document.getElementById('fb-tooltip').innerHTML = 'Đăng nhập vào Facebook để lấy thông tin của bạn';
		}
	}
	else {
		// The person is not logged into Facebook, so we're not sure if
		// they are logged into this app or not.
		if (document.getElementById('fb-tooltip') != null) {
		  document.getElementById('fb-tooltip').innerHTML = 'Đăng nhập vào Facebook để lấy thông tin của bạn';
		}
	}
}

// Check user status after FB login.
function facebook_check_login_state() {
	FB.getLoginStatus(function(response) {
		facebook_login_state_change_callback(response);
	});
};
var gapi=window.gapi=window.gapi||{};gapi._bs=new Date().getTime();(function(){/*

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/
var aa="function"==typeof Object.defineProperties?Object.defineProperty:function(a,b,c){if(a==Array.prototype||a==Object.prototype)return a;a[b]=c.value;return a},da=function(a){a=["object"==typeof globalThis&&globalThis,a,"object"==typeof window&&window,"object"==typeof self&&self,"object"==typeof global&&global];for(var b=0;b<a.length;++b){var c=a[b];if(c&&c.Math==Math)return c}throw Error("Cannot find global object");},ea=da(this),fa=function(a,b){if(b)a:{var c=ea;a=a.split(".");for(var d=0;d<
a.length-1;d++){var e=a[d];if(!(e in c))break a;c=c[e]}a=a[a.length-1];d=c[a];b=b(d);b!=d&&null!=b&&aa(c,a,{configurable:!0,writable:!0,value:b})}},ha=function(a){var b=0;return function(){return b<a.length?{done:!1,value:a[b++]}:{done:!0}}};
fa("Symbol",function(a){if(a)return a;var b=function(e,f){this.ba=e;aa(this,"description",{configurable:!0,writable:!0,value:f})};b.prototype.toString=function(){return this.ba};var c=0,d=function(e){if(this instanceof d)throw new TypeError("Symbol is not a constructor");return new b("jscomp_symbol_"+(e||"")+"_"+c++,e)};return d});
fa("Symbol.iterator",function(a){if(a)return a;a=Symbol("Symbol.iterator");for(var b="Array Int8Array Uint8Array Uint8ClampedArray Int16Array Uint16Array Int32Array Uint32Array Float32Array Float64Array".split(" "),c=0;c<b.length;c++){var d=ea[b[c]];"function"===typeof d&&"function"!=typeof d.prototype[a]&&aa(d.prototype,a,{configurable:!0,writable:!0,value:function(){return ia(ha(this))}})}return a});
var ia=function(a){a={next:a};a[Symbol.iterator]=function(){return this};return a},ja=function(a,b){a instanceof String&&(a+="");var c=0,d=!1,e={next:function(){if(!d&&c<a.length){var f=c++;return{value:b(f,a[f]),done:!1}}d=!0;return{done:!0,value:void 0}}};e[Symbol.iterator]=function(){return e};return e};fa("Array.prototype.keys",function(a){return a?a:function(){return ja(this,function(b){return b})}});
var m=this||self,ka=function(a){var b=typeof a;return"object"!=b?b:a?Array.isArray(a)?"array":b:"null"},la=function(a,b,c){return a.call.apply(a.bind,arguments)},ma=function(a,b,c){if(!a)throw Error();if(2<arguments.length){var d=Array.prototype.slice.call(arguments,2);return function(){var e=Array.prototype.slice.call(arguments);Array.prototype.unshift.apply(e,d);return a.apply(b,e)}}return function(){return a.apply(b,arguments)}},na=function(a,b,c){na=Function.prototype.bind&&-1!=Function.prototype.bind.toString().indexOf("native code")?
la:ma;return na.apply(null,arguments)},oa=function(a,b){function c(){}c.prototype=b.prototype;a.ma=b.prototype;a.prototype=new c;a.prototype.constructor=a;a.A=function(d,e,f){for(var g=Array(arguments.length-2),h=2;h<arguments.length;h++)g[h-2]=arguments[h];return b.prototype[e].apply(d,g)}},pa=function(a){return a},qa=function(a){var b=null,c=m.trustedTypes;if(!c||!c.createPolicy)return b;try{b=c.createPolicy(a,{createHTML:pa,createScript:pa,createScriptURL:pa})}catch(d){m.console&&m.console.error(d.message)}return b};function q(a){if(Error.captureStackTrace)Error.captureStackTrace(this,q);else{var b=Error().stack;b&&(this.stack=b)}a&&(this.message=String(a))}oa(q,Error);q.prototype.name="CustomError";var ra=function(a,b){a=a.split("%s");for(var c="",d=a.length-1,e=0;e<d;e++)c+=a[e]+(e<b.length?b[e]:"%s");q.call(this,c+a[d])};oa(ra,q);ra.prototype.name="AssertionError";
var sa=function(a,b,c,d){var e="Assertion failed";if(c){e+=": "+c;var f=d}else a&&(e+=": "+a,f=b);throw new ra(""+e,f||[]);},ta=function(a,b,c){a||sa("",null,b,Array.prototype.slice.call(arguments,2));return a},ua=function(a,b){throw new ra("Failure"+(a?": "+a:""),Array.prototype.slice.call(arguments,1));},va=function(a,b,c){"string"!==typeof a&&sa("Expected string but got %s: %s.",[ka(a),a],b,Array.prototype.slice.call(arguments,2))};var xa=function(a,b){a:{try{var c=a&&a.ownerDocument,d=c&&(c.defaultView||c.parentWindow);d=d||m;if(d.Element&&d.Location){var e=d;break a}}catch(g){}e=null}if(e&&"undefined"!=typeof e[b]&&(!a||!(a instanceof e[b])&&(a instanceof e.Location||a instanceof e.Element))){e=typeof a;if("object"==e&&null!=a||"function"==e)try{var f=a.constructor.displayName||a.constructor.name||Object.prototype.toString.call(a)}catch(g){f="<object could not be stringified>"}else f=void 0===a?"undefined":null===a?"null":
typeof a;ua("Argument is not a %s (or a non-Element, non-Location mock); got: %s",b,f)}return a};var ya;var t=function(a,b){this.P=a===za&&b||"";this.ca=Aa};t.prototype.J=!0;t.prototype.H=function(){return this.P};t.prototype.toString=function(){return"Const{"+this.P+"}"};var Ba=function(a){if(a instanceof t&&a.constructor===t&&a.ca===Aa)return a.P;ua("expected object of type Const, got '"+a+"'");return"type_error:Const"},Aa={},za={};var v=function(a,b){this.N=b===Ca?a:""};v.prototype.J=!0;v.prototype.H=function(){return this.N.toString()};v.prototype.toString=function(){return"SafeUrl{"+this.N+"}"};
var Da=function(a){if(a instanceof v&&a.constructor===v)return a.N;ua("expected object of type SafeUrl, got '"+a+"' of type "+ka(a));return"type_error:SafeUrl"},Ea=/^(?:(?:https?|mailto|ftp):|[^:/?#]*(?:[/?#]|$))/i,Fa=function(a){if(a instanceof v)return a;a="object"==typeof a&&a.J?a.H():String(a);ta(Ea.test(a),"%s does not match the safe URL pattern",a)||(a="about:invalid#zClosurez");return new v(a,Ca)},Ca={};var w=function(a,b,c){this.M=c===Ga?a:""};w.prototype.J=!0;w.prototype.H=function(){return this.M.toString()};w.prototype.toString=function(){return"SafeHtml{"+this.M+"}"};var Ha=function(a){if(a instanceof w&&a.constructor===w)return a.M;ua("expected object of type SafeHtml, got '"+a+"' of type "+ka(a));return"type_error:SafeHtml"},Ga={},Ia=new w(m.trustedTypes&&m.trustedTypes.emptyHTML||"",0,Ga);var Ja={MATH:!0,SCRIPT:!0,STYLE:!0,SVG:!0,TEMPLATE:!0},Ka=function(a){var b=!1,c;return function(){b||(c=a(),b=!0);return c}}(function(){if("undefined"===typeof document)return!1;var a=document.createElement("div"),b=document.createElement("div");b.appendChild(document.createElement("div"));a.appendChild(b);if(!a.firstChild)return!1;b=a.firstChild.firstChild;a.innerHTML=Ha(Ia);return!b.parentElement});/*
 gapi.loader.OBJECT_CREATE_TEST_OVERRIDE &&*/
var x=window,z=document,La=x.location,Ma=function(){},Na=/\[native code\]/,A=function(a,b,c){return a[b]=a[b]||c},Oa=function(a){for(var b=0;b<this.length;b++)if(this[b]===a)return b;return-1},Pa=function(a){a=a.sort();for(var b=[],c=void 0,d=0;d<a.length;d++){var e=a[d];e!=c&&b.push(e);c=e}return b},Qa=/&/g,Ra=/</g,Sa=/>/g,Ua=/"/g,Va=/'/g,Wa=function(a){return String(a).replace(Qa,"&amp;").replace(Ra,"&lt;").replace(Sa,"&gt;").replace(Ua,"&quot;").replace(Va,"&#39;")},B=function(){var a;if((a=Object.create)&&
Na.test(a))a=a(null);else{a={};for(var b in a)a[b]=void 0}return a},C=function(a,b){return Object.prototype.hasOwnProperty.call(a,b)},Xa=function(a){if(Na.test(Object.keys))return Object.keys(a);var b=[],c;for(c in a)C(a,c)&&b.push(c);return b},D=function(a,b){a=a||{};for(var c in a)C(a,c)&&(b[c]=a[c])},Ya=function(a){return function(){x.setTimeout(a,0)}},E=function(a,b){if(!a)throw Error(b||"");},F=A(x,"gapi",{});var H=function(a,b,c){var d=new RegExp("([#].*&|[#])"+b+"=([^&#]*)","g");b=new RegExp("([?#].*&|[?#])"+b+"=([^&#]*)","g");if(a=a&&(d.exec(a)||b.exec(a)))try{c=decodeURIComponent(a[2])}catch(e){}return c},Za=new RegExp(/^/.source+/([a-zA-Z][-+.a-zA-Z0-9]*:)?/.source+/(\/\/[^\/?#]*)?/.source+/([^?#]*)?/.source+/(\?([^#]*))?/.source+/(#((#|[^#])*))?/.source+/$/.source),$a=/[\ud800-\udbff][\udc00-\udfff]|[^!-~]/g,ab=new RegExp(/(%([^0-9a-fA-F%]|[0-9a-fA-F]([^0-9a-fA-F%])?)?)*/.source+/%($|[^0-9a-fA-F]|[0-9a-fA-F]($|[^0-9a-fA-F]))/.source,
"g"),bb=/%([a-f]|[0-9a-fA-F][a-f])/g,cb=/^(https?|ftp|file|chrome-extension):$/i,I=function(a){a=String(a);a=a.replace($a,function(e){try{return encodeURIComponent(e)}catch(f){return encodeURIComponent(e.replace(/^[^%]+$/g,"\ufffd"))}}).replace(ab,function(e){return e.replace(/%/g,"%25")}).replace(bb,function(e){return e.toUpperCase()});a=a.match(Za)||[];var b=B(),c=function(e){return e.replace(/\\/g,"%5C").replace(/\^/g,"%5E").replace(/`/g,"%60").replace(/\{/g,"%7B").replace(/\|/g,"%7C").replace(/\}/g,
"%7D")},d=!!(a[1]||"").match(cb);b.A=c((a[1]||"")+(a[2]||"")+(a[3]||(a[2]&&d?"/":"")));d=function(e){return c(e.replace(/\?/g,"%3F").replace(/#/g,"%23"))};b.query=a[5]?[d(a[5])]:[];b.g=a[7]?[d(a[7])]:[];return b},db=function(a){return a.A+(0<a.query.length?"?"+a.query.join("&"):"")+(0<a.g.length?"#"+a.g.join("&"):"")},eb=function(a,b){var c=[];if(a)for(var d in a)if(C(a,d)&&null!=a[d]){var e=b?b(a[d]):a[d];c.push(encodeURIComponent(d)+"="+encodeURIComponent(e))}return c},fb=function(a,b,c,d){a=I(a);
a.query.push.apply(a.query,eb(b,d));a.g.push.apply(a.g,eb(c,d));return db(a)},gb=new RegExp(/\/?\??#?/.source+"("+/[\/?#]/i.source+"|"+/[\uD800-\uDBFF]/i.source+"|"+/%[c-f][0-9a-f](%[89ab][0-9a-f]){0,2}(%[89ab]?)?/i.source+"|"+/%[0-9a-f]?/i.source+")$","i"),hb=function(a,b){var c=I(b);b=c.A;c.query.length&&(b+="?"+c.query.join(""));c.g.length&&(b+="#"+c.g.join(""));var d="";2E3<b.length&&(d=b,b=b.substr(0,2E3),b=b.replace(gb,""),d=d.substr(b.length));var e=a.createElement("div");a=a.createElement("a");
c=I(b);b=c.A;c.query.length&&(b+="?"+c.query.join(""));c.g.length&&(b+="#"+c.g.join(""));b=new v(b,Ca);xa(a,"HTMLAnchorElement");b=b instanceof v?b:Fa(b);a.href=Da(b);e.appendChild(a);b=e.innerHTML;c=new t(za,"Assignment to self.");va(Ba(c),"must provide justification");ta(!/^[\s\xa0]*$/.test(Ba(c)),"must provide non-empty justification");void 0===ya&&(ya=qa("gapi#html"));b=(c=ya)?c.createHTML(b):b;b=new w(b,null,Ga);if(e.tagName&&Ja[e.tagName.toUpperCase()])throw Error("goog.dom.safe.setInnerHtml cannot be used to set content of "+
e.tagName+".");if(Ka())for(;e.lastChild;)e.removeChild(e.lastChild);e.innerHTML=Ha(b);b=String(e.firstChild.href);e.parentNode&&e.parentNode.removeChild(e);c=I(b+d);d=c.A;c.query.length&&(d+="?"+c.query.join(""));c.g.length&&(d+="#"+c.g.join(""));return d},ib=/^https?:\/\/[^\/%\\?#\s]+\/[^\s]*$/i;var jb=function(a,b,c,d){if(x[c+"EventListener"])x[c+"EventListener"](a,b,!1);else if(x[d+"tachEvent"])x[d+"tachEvent"]("on"+a,b)},kb=function(){var a=z.readyState;return"complete"===a||"interactive"===a&&-1==navigator.userAgent.indexOf("MSIE")},nb=function(a){var b=lb;if(!kb())try{b()}catch(c){}mb(a)},mb=function(a){if(kb())a();else{var b=!1,c=function(){if(!b)return b=!0,a.apply(this,arguments)};x.addEventListener?(x.addEventListener("load",c,!1),x.addEventListener("DOMContentLoaded",c,!1)):x.attachEvent&&
(x.attachEvent("onreadystatechange",function(){kb()&&c.apply(this,arguments)}),x.attachEvent("onload",c))}},ob=function(a){for(;a.firstChild;)a.removeChild(a.firstChild)},pb={button:!0,div:!0,span:!0};var K;K=A(x,"___jsl",B());A(K,"I",0);A(K,"hel",10);var qb=function(a){return K.dpo?K.h:H(a,"jsh",K.h)},rb=function(a){var b=A(K,"sws",[]);b.push.apply(b,a)},sb=function(a){return A(K,"watt",B())[a]},tb=function(a){var b=A(K,"PQ",[]);K.PQ=[];var c=b.length;if(0===c)a();else for(var d=0,e=function(){++d===c&&a()},f=0;f<c;f++)b[f](e)},ub=function(a){return A(A(K,"H",B()),a,B())};var vb=A(K,"perf",B()),wb=A(vb,"g",B()),xb=A(vb,"i",B());A(vb,"r",[]);B();B();
var yb=function(a,b,c){var d=vb.r;"function"===typeof d?d(a,b,c):d.push([a,b,c])},L=function(a,b,c){wb[a]=!b&&wb[a]||c||(new Date).getTime();yb(a)},Ab=function(a,b,c){b&&0<b.length&&(b=zb(b),c&&0<c.length&&(b+="___"+zb(c)),28<b.length&&(b=b.substr(0,28)+(b.length-28)),c=b,b=A(xb,"_p",B()),A(b,c,B())[a]=(new Date).getTime(),yb(a,"_p",c))},zb=function(a){return a.join("__").replace(/\./g,"_").replace(/\-/g,"_").replace(/,/g,"_")};var Bb=B(),N=[],O=function(a){throw Error("Bad hint"+(a?": "+a:""));};N.push(["jsl",function(a){for(var b in a)if(C(a,b)){var c=a[b];"object"==typeof c?K[b]=A(K,b,[]).concat(c):A(K,b,c)}if(b=a.u)a=A(K,"us",[]),a.push(b),(b=/^https:(.*)$/.exec(b))&&a.push("http:"+b[1])}]);var Cb=/^(\/[a-zA-Z0-9_\-]+)+$/,Db=[/\/amp\//,/\/amp$/,/^\/amp$/],Eb=/^[a-zA-Z0-9\-_\.,!]+$/,Fb=/^gapi\.loaded_[0-9]+$/,Gb=/^[a-zA-Z0-9,._-]+$/,Kb=function(a,b,c,d){var e=a.split(";"),f=e.shift(),g=Bb[f],h=null;g?h=g(e,b,c,d):O("no hint processor for: "+f);h||O("failed to generate load url");b=h;c=b.match(Hb);(d=b.match(Ib))&&1===d.length&&Jb.test(b)&&c&&1===c.length||O("failed sanity: "+a);return h},Nb=function(a,b,c,d){a=Lb(a);Fb.test(c)||O("invalid_callback");b=Mb(b);d=d&&d.length?Mb(d):null;var e=
function(f){return encodeURIComponent(f).replace(/%2C/g,",")};return[encodeURIComponent(a.pathPrefix).replace(/%2C/g,",").replace(/%2F/g,"/"),"/k=",e(a.version),"/m=",e(b),d?"/exm="+e(d):"","/rt=j/sv=1/d=1/ed=1",a.S?"/am="+e(a.S):"",a.Z?"/rs="+e(a.Z):"",a.aa?"/t="+e(a.aa):"","/cb=",e(c)].join("")},Lb=function(a){"/"!==a.charAt(0)&&O("relative path");for(var b=a.substring(1).split("/"),c=[];b.length;){a=b.shift();if(!a.length||0==a.indexOf("."))O("empty/relative directory");else if(0<a.indexOf("=")){b.unshift(a);
break}c.push(a)}a={};for(var d=0,e=b.length;d<e;++d){var f=b[d].split("="),g=decodeURIComponent(f[0]),h=decodeURIComponent(f[1]);2==f.length&&g&&h&&(a[g]=a[g]||h)}b="/"+c.join("/");Cb.test(b)||O("invalid_prefix");c=0;for(d=Db.length;c<d;++c)Db[c].test(b)&&O("invalid_prefix");c=Ob(a,"k",!0);d=Ob(a,"am");e=Ob(a,"rs");a=Ob(a,"t");return{pathPrefix:b,version:c,S:d,Z:e,aa:a}},Mb=function(a){for(var b=[],c=0,d=a.length;c<d;++c){var e=a[c].replace(/\./g,"_").replace(/-/g,"_");Gb.test(e)&&b.push(e)}return b.join(",")},
Ob=function(a,b,c){a=a[b];!a&&c&&O("missing: "+b);if(a){if(Eb.test(a))return a;O("invalid: "+b)}return null},Jb=/^https?:\/\/[a-z0-9_.-]+\.google(rs)?\.com(:\d+)?\/[a-zA-Z0-9_.,!=\-\/]+$/,Ib=/\/cb=/g,Hb=/\/\//g,Pb=function(){var a=qb(La.href);if(!a)throw Error("Bad hint");return a};Bb.m=function(a,b,c,d){(a=a[0])||O("missing_hint");return"https://apis.google.com"+Nb(a,b,c,d)};var Qb=decodeURI("%73cript"),Rb=/^[-+_0-9\/A-Za-z]+={0,2}$/,Sb=function(a,b){for(var c=[],d=0;d<a.length;++d){var e=a[d];e&&0>Oa.call(b,e)&&c.push(e)}return c},Tb=function(){var a=K.nonce;return void 0!==a?a&&a===String(a)&&a.match(Rb)?a:K.nonce=null:z.querySelector?(a=z.querySelector("script[nonce]"))?(a=a.nonce||a.getAttribute("nonce")||"",a&&a===String(a)&&a.match(Rb)?K.nonce=a:K.nonce=null):null:null},Wb=function(a){if("loading"!=z.readyState)Ub(a);else{var b=Tb(),c="";null!==b&&(c=' nonce="'+
b+'"');a="<"+Qb+' src="'+encodeURI(a)+'"'+c+"></"+Qb+">";z.write(Vb?Vb.createHTML(a):a)}},Ub=function(a){var b=z.createElement(Qb);b.setAttribute("src",Vb?Vb.createScriptURL(a):a);a=Tb();null!==a&&b.setAttribute("nonce",a);b.async="true";(a=z.getElementsByTagName(Qb)[0])?a.parentNode.insertBefore(b,a):(z.head||z.body||z.documentElement).appendChild(b)},Xb=function(a,b){var c=b&&b._c;if(c)for(var d=0;d<N.length;d++){var e=N[d][0],f=N[d][1];f&&C(c,e)&&f(c[e],a,b)}},Zb=function(a,b,c){Yb(function(){var d=
b===qb(La.href)?A(F,"_",B()):B();d=A(ub(b),"_",d);a(d)},c)},ac=function(a,b){var c=b||{};"function"==typeof b&&(c={},c.callback=b);Xb(a,c);b=a?a.split(":"):[];var d=c.h||Pb(),e=A(K,"ah",B());if(e["::"]&&b.length){a=[];for(var f=null;f=b.shift();){var g=f.split(".");g=e[f]||e[g[1]&&"ns:"+g[0]||""]||d;var h=a.length&&a[a.length-1]||null,k=h;h&&h.hint==g||(k={hint:g,V:[]},a.push(k));k.V.push(f)}var l=a.length;if(1<l){var n=c.callback;n&&(c.callback=function(){0==--l&&n()})}for(;b=a.shift();)$b(b.V,c,
b.hint)}else $b(b||[],c,d)},$b=function(a,b,c){a=Pa(a)||[];var d=b.callback,e=b.config,f=b.timeout,g=b.ontimeout,h=b.onerror,k=void 0;"function"==typeof h&&(k=h);var l=null,n=!1;if(f&&!g||!f&&g)throw"Timeout requires both the timeout parameter and ontimeout parameter to be set";h=A(ub(c),"r",[]).sort();var p=A(ub(c),"L",[]).sort(),r=[].concat(h),u=function(M,ba){if(n)return 0;x.clearTimeout(l);p.push.apply(p,y);var ca=((F||{}).config||{}).update;ca?ca(e):e&&A(K,"cu",[]).push(e);if(ba){Ab("me0",M,
r);try{Zb(ba,c,k)}finally{Ab("me1",M,r)}}return 1};0<f&&(l=x.setTimeout(function(){n=!0;g()},f));var y=Sb(a,p);if(y.length){y=Sb(a,h);var G=A(K,"CP",[]),J=G.length;G[J]=function(M){if(!M)return 0;Ab("ml1",y,r);var ba=function(wa){G[J]=null;u(y,M)&&tb(function(){d&&d();wa()})},ca=function(){var wa=G[J+1];wa&&wa()};0<J&&G[J-1]?G[J]=function(){ba(ca)}:ba(ca)};if(y.length){var Ta="loaded_"+K.I++;F[Ta]=function(M){G[J](M);F[Ta]=null};a=Kb(c,y,"gapi."+Ta,h);h.push.apply(h,y);Ab("ml0",y,r);b.sync||x.___gapisync?
Wb(a):Ub(a)}else G[J](Ma)}else u(y)&&d&&d()},Vb=qa("gapi#gapi");var Yb=function(a,b){if(K.hee&&0<K.hel)try{return a()}catch(c){b&&b(c),K.hel--,ac("debug_error",function(){try{window.___jsl.hefn(c)}catch(d){throw c;}})}else try{return a()}catch(c){throw b&&b(c),c;}};F.load=function(a,b){return Yb(function(){return ac(a,b)})};var bc=function(a){var b=window.___jsl=window.___jsl||{};b[a]=b[a]||[];return b[a]},cc=function(a){var b=window.___jsl=window.___jsl||{};b.cfg=!a&&b.cfg||{};return b.cfg},dc=function(a){return"object"===typeof a&&/\[native code\]/.test(a.push)},P=function(a,b,c){if(b&&"object"===typeof b)for(var d in b)!Object.prototype.hasOwnProperty.call(b,d)||c&&"___goc"===d&&"undefined"===typeof b[d]||(a[d]&&b[d]&&"object"===typeof a[d]&&"object"===typeof b[d]&&!dc(a[d])&&!dc(b[d])?P(a[d],b[d]):b[d]&&"object"===
typeof b[d]?(a[d]=dc(b[d])?[]:{},P(a[d],b[d])):a[d]=b[d])},ec=function(a){if(a&&!/^\s+$/.test(a)){for(;0==a.charCodeAt(a.length-1);)a=a.substring(0,a.length-1);try{var b=window.JSON.parse(a)}catch(c){}if("object"===typeof b)return b;try{b=(new Function("return ("+a+"\n)"))()}catch(c){}if("object"===typeof b)return b;try{b=(new Function("return ({"+a+"\n})"))()}catch(c){}return"object"===typeof b?b:{}}},fc=function(a,b){var c={___goc:void 0};a.length&&a[a.length-1]&&Object.hasOwnProperty.call(a[a.length-
1],"___goc")&&"undefined"===typeof a[a.length-1].___goc&&(c=a.pop());P(c,b);a.push(c)},gc=function(a){cc(!0);var b=window.___gcfg,c=bc("cu"),d=window.___gu;b&&b!==d&&(fc(c,b),window.___gu=b);b=bc("cu");var e=document.scripts||document.getElementsByTagName("script")||[];d=[];var f=[];f.push.apply(f,bc("us"));for(var g=0;g<e.length;++g)for(var h=e[g],k=0;k<f.length;++k)h.src&&0==h.src.indexOf(f[k])&&d.push(h);0==d.length&&0<e.length&&e[e.length-1].src&&d.push(e[e.length-1]);for(e=0;e<d.length;++e)d[e].getAttribute("gapi_processed")||
(d[e].setAttribute("gapi_processed",!0),(f=d[e])?(g=f.nodeType,f=3==g||4==g?f.nodeValue:f.textContent||f.innerText||f.innerHTML||""):f=void 0,(f=ec(f))&&b.push(f));a&&fc(c,a);d=bc("cd");a=0;for(b=d.length;a<b;++a)P(cc(),d[a],!0);d=bc("ci");a=0;for(b=d.length;a<b;++a)P(cc(),d[a],!0);a=0;for(b=c.length;a<b;++a)P(cc(),c[a],!0)},Q=function(a){var b=cc();if(!a)return b;a=a.split("/");for(var c=0,d=a.length;b&&"object"===typeof b&&c<d;++c)b=b[a[c]];return c===a.length&&void 0!==b?b:void 0},hc=function(a,
b){var c;if("string"===typeof a){var d=c={};a=a.split("/");for(var e=0,f=a.length;e<f-1;++e){var g={};d=d[a[e]]=g}d[a[e]]=b}else c=a;gc(c)};var ic=function(){var a=window.__GOOGLEAPIS;a&&(a.googleapis&&!a["googleapis.config"]&&(a["googleapis.config"]=a.googleapis),A(K,"ci",[]).push(a),window.__GOOGLEAPIS=void 0)};var jc={callback:1,clientid:1,cookiepolicy:1,openidrealm:-1,includegrantedscopes:-1,requestvisibleactions:1,scope:1},kc=!1,lc=B(),mc=function(){if(!kc){for(var a=document.getElementsByTagName("meta"),b=0;b<a.length;++b){var c=a[b].name.toLowerCase();if(0==c.lastIndexOf("google-signin-",0)){c=c.substring(14);var d=a[b].content;jc[c]&&d&&(lc[c]=d)}}if(window.self!==window.top){a=document.location.toString();for(var e in jc)0<jc[e]&&(b=H(a,e,""))&&(lc[e]=b)}kc=!0}e=B();D(lc,e);return e},nc=function(a){return!!(a.clientid&&
a.scope&&a.callback)};var oc=window.console,pc=function(a){oc&&oc.log&&oc.log(a)};var qc=function(){return!!K.oa},rc=function(){};var R=A(K,"rw",B()),sc=function(a){for(var b in R)a(R[b])},tc=function(a,b){(a=R[a])&&a.state<b&&(a.state=b)};var uc;var vc=/^https?:\/\/(?:\w|[\-\.])+\.google\.(?:\w|[\-:\.])+(?:\/[^\?#]*)?\/u\/(\d)\//,wc=/^https?:\/\/(?:\w|[\-\.])+\.google\.(?:\w|[\-:\.])+(?:\/[^\?#]*)?\/b\/(\d{10,21})\//,xc=function(a){var b=Q("googleapis.config/sessionIndex");"string"===typeof b&&254<b.length&&(b=null);null==b&&(b=window.__X_GOOG_AUTHUSER);"string"===typeof b&&254<b.length&&(b=null);if(null==b){var c=window.google;c&&(b=c.authuser)}"string"===typeof b&&254<b.length&&(b=null);null==b&&(a=a||window.location.href,b=H(a,"authuser")||
null,null==b&&(b=(b=a.match(vc))?b[1]:null));if(null==b)return null;b=String(b);254<b.length&&(b=null);return b},yc=function(a){var b=Q("googleapis.config/sessionDelegate");"string"===typeof b&&21<b.length&&(b=null);null==b&&(b=(a=(a||window.location.href).match(wc))?a[1]:null);if(null==b)return null;b=String(b);21<b.length&&(b=null);return b};var zc,S,T=void 0,U=function(a){try{return m.JSON.parse.call(m.JSON,a)}catch(b){return!1}},V=function(a){return Object.prototype.toString.call(a)},Ac=V(0),Bc=V(new Date(0)),Cc=V(!0),Dc=V(""),Ec=V({}),Fc=V([]),W=function(a,b){if(b)for(var c=0,d=b.length;c<d;++c)if(a===b[c])throw new TypeError("Converting circular structure to JSON");d=typeof a;if("undefined"!==d){c=Array.prototype.slice.call(b||[],0);c[c.length]=a;b=[];var e=V(a);if(null!=a&&"function"===typeof a.toJSON&&(Object.prototype.hasOwnProperty.call(a,
"toJSON")||(e!==Fc||a.constructor!==Array&&a.constructor!==Object)&&(e!==Ec||a.constructor!==Array&&a.constructor!==Object)&&e!==Dc&&e!==Ac&&e!==Cc&&e!==Bc))return W(a.toJSON.call(a),c);if(null==a)b[b.length]="null";else if(e===Ac)a=Number(a),isNaN(a)||isNaN(a-a)?a="null":-0===a&&0>1/a&&(a="-0"),b[b.length]=String(a);else if(e===Cc)b[b.length]=String(!!Number(a));else{if(e===Bc)return W(a.toISOString.call(a),c);if(e===Fc&&V(a.length)===Ac){b[b.length]="[";var f=0;for(d=Number(a.length)>>0;f<d;++f)f&&
(b[b.length]=","),b[b.length]=W(a[f],c)||"null";b[b.length]="]"}else if(e==Dc&&V(a.length)===Ac){b[b.length]='"';f=0;for(c=Number(a.length)>>0;f<c;++f)d=String.prototype.charAt.call(a,f),e=String.prototype.charCodeAt.call(a,f),b[b.length]="\b"===d?"\\b":"\f"===d?"\\f":"\n"===d?"\\n":"\r"===d?"\\r":"\t"===d?"\\t":"\\"===d||'"'===d?"\\"+d:31>=e?"\\u"+(e+65536).toString(16).substr(1):32<=e&&65535>=e?d:"\ufffd";b[b.length]='"'}else if("object"===d){b[b.length]="{";d=0;for(f in a)Object.prototype.hasOwnProperty.call(a,
f)&&(e=W(a[f],c),void 0!==e&&(d++&&(b[b.length]=","),b[b.length]=W(f),b[b.length]=":",b[b.length]=e));b[b.length]="}"}else return}return b.join("")}},Gc=/[\0-\x07\x0b\x0e-\x1f]/,Hc=/^([^"]*"([^\\"]|\\.)*")*[^"]*"([^"\\]|\\.)*[\0-\x1f]/,Ic=/^([^"]*"([^\\"]|\\.)*")*[^"]*"([^"\\]|\\.)*\\[^\\\/"bfnrtu]/,Jc=/^([^"]*"([^\\"]|\\.)*")*[^"]*"([^"\\]|\\.)*\\u([0-9a-fA-F]{0,3}[^0-9a-fA-F])/,Kc=/"([^\0-\x1f\\"]|\\[\\\/"bfnrt]|\\u[0-9a-fA-F]{4})*"/g,Lc=/-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][-+]?[0-9]+)?/g,Mc=/[ \t\n\r]+/g,
Nc=/[^"]:/,Oc=/""/g,Pc=/true|false|null/g,Qc=/00/,Rc=/[\{]([^0\}]|0[^:])/,Sc=/(^|\[)[,:]|[,:](\]|\}|[,:]|$)/,Tc=/[^\[,:][\[\{]/,Uc=/^(\{|\}|\[|\]|,|:|0)+/,Vc=/\u2028/g,Wc=/\u2029/g,Xc=function(a){a=String(a);if(Gc.test(a)||Hc.test(a)||Ic.test(a)||Jc.test(a))return!1;var b=a.replace(Kc,'""');b=b.replace(Lc,"0");b=b.replace(Mc,"");if(Nc.test(b))return!1;b=b.replace(Oc,"0");b=b.replace(Pc,"0");if(Qc.test(b)||Rc.test(b)||Sc.test(b)||Tc.test(b)||!b||(b=b.replace(Uc,"")))return!1;a=a.replace(Vc,"\\u2028").replace(Wc,
"\\u2029");b=void 0;try{b=T?[U(a)]:eval("(function (var_args) {\n  return Array.prototype.slice.call(arguments, 0);\n})(\n"+a+"\n)")}catch(c){return!1}return b&&1===b.length?b[0]:!1},Yc=function(){var a=((m.document||{}).scripts||[]).length;if((void 0===zc||void 0===T||S!==a)&&-1!==S){zc=T=!1;S=-1;try{try{T=!!m.JSON&&'{"a":[3,true,"1970-01-01T00:00:00.000Z"]}'===m.JSON.stringify.call(m.JSON,{a:[3,!0,new Date(0)],c:function(){}})&&!0===U("true")&&3===U('[{"a":3}]')[0].a}catch(b){}zc=T&&!U("[00]")&&
!U('"\u0007"')&&!U('"\\0"')&&!U('"\\v"')}finally{S=a}}},Zc=function(a){if(-1===S)return!1;Yc();return(zc?U:Xc)(a)},$c=function(a){if(-1!==S)return Yc(),T?m.JSON.stringify.call(m.JSON,a):W(a)},ad=!Date.prototype.toISOString||"function"!==typeof Date.prototype.toISOString||"1970-01-01T00:00:00.000Z"!==(new Date(0)).toISOString(),bd=function(){var a=Date.prototype.getUTCFullYear.call(this);return[0>a?"-"+String(1E6-a).substr(1):9999>=a?String(1E4+a).substr(1):"+"+String(1E6+a).substr(1),"-",String(101+
Date.prototype.getUTCMonth.call(this)).substr(1),"-",String(100+Date.prototype.getUTCDate.call(this)).substr(1),"T",String(100+Date.prototype.getUTCHours.call(this)).substr(1),":",String(100+Date.prototype.getUTCMinutes.call(this)).substr(1),":",String(100+Date.prototype.getUTCSeconds.call(this)).substr(1),".",String(1E3+Date.prototype.getUTCMilliseconds.call(this)).substr(1),"Z"].join("")};Date.prototype.toISOString=ad?bd:Date.prototype.toISOString;var cd=function(){this.j=-1};var dd=function(){this.j=64;this.b=[];this.G=[];this.da=[];this.C=[];this.C[0]=128;for(var a=1;a<this.j;++a)this.C[a]=0;this.D=this.o=0;this.reset()};oa(dd,cd);dd.prototype.reset=function(){this.b[0]=1732584193;this.b[1]=4023233417;this.b[2]=2562383102;this.b[3]=271733878;this.b[4]=3285377520;this.D=this.o=0};
var ed=function(a,b,c){c||(c=0);var d=a.da;if("string"===typeof b)for(var e=0;16>e;e++)d[e]=b.charCodeAt(c)<<24|b.charCodeAt(c+1)<<16|b.charCodeAt(c+2)<<8|b.charCodeAt(c+3),c+=4;else for(e=0;16>e;e++)d[e]=b[c]<<24|b[c+1]<<16|b[c+2]<<8|b[c+3],c+=4;for(e=16;80>e;e++){var f=d[e-3]^d[e-8]^d[e-14]^d[e-16];d[e]=(f<<1|f>>>31)&4294967295}b=a.b[0];c=a.b[1];var g=a.b[2],h=a.b[3],k=a.b[4];for(e=0;80>e;e++){if(40>e)if(20>e){f=h^c&(g^h);var l=1518500249}else f=c^g^h,l=1859775393;else 60>e?(f=c&g|h&(c|g),l=2400959708):
(f=c^g^h,l=3395469782);f=(b<<5|b>>>27)+f+k+l+d[e]&4294967295;k=h;h=g;g=(c<<30|c>>>2)&4294967295;c=b;b=f}a.b[0]=a.b[0]+b&4294967295;a.b[1]=a.b[1]+c&4294967295;a.b[2]=a.b[2]+g&4294967295;a.b[3]=a.b[3]+h&4294967295;a.b[4]=a.b[4]+k&4294967295};
dd.prototype.update=function(a,b){if(null!=a){void 0===b&&(b=a.length);for(var c=b-this.j,d=0,e=this.G,f=this.o;d<b;){if(0==f)for(;d<=c;)ed(this,a,d),d+=this.j;if("string"===typeof a)for(;d<b;){if(e[f]=a.charCodeAt(d),++f,++d,f==this.j){ed(this,e);f=0;break}}else for(;d<b;)if(e[f]=a[d],++f,++d,f==this.j){ed(this,e);f=0;break}}this.o=f;this.D+=b}};
dd.prototype.digest=function(){var a=[],b=8*this.D;56>this.o?this.update(this.C,56-this.o):this.update(this.C,this.j-(this.o-56));for(var c=this.j-1;56<=c;c--)this.G[c]=b&255,b/=256;ed(this,this.G);for(c=b=0;5>c;c++)for(var d=24;0<=d;d-=8)a[b]=this.b[c]>>d&255,++b;return a};var fd=function(){this.O=new dd};fd.prototype.reset=function(){this.O.reset()};var gd=x.crypto,hd=!1,id=0,jd=0,kd=1,ld=0,md="",nd=function(a){a=a||x.event;var b=a.screenX+a.clientX<<16;b+=a.screenY+a.clientY;b*=(new Date).getTime()%1E6;kd=kd*b%ld;0<id&&++jd==id&&jb("mousemove",nd,"remove","de")},od=function(a){var b=new fd;a=unescape(encodeURIComponent(a));for(var c=[],d=0,e=a.length;d<e;++d)c.push(a.charCodeAt(d));b.O.update(c);b=b.O.digest();a="";for(c=0;c<b.length;c++)a+="0123456789ABCDEF".charAt(Math.floor(b[c]/16))+"0123456789ABCDEF".charAt(b[c]%16);return a};
hd=!!gd&&"function"==typeof gd.getRandomValues;hd||(ld=1E6*(screen.width*screen.width+screen.height),md=od(z.cookie+"|"+z.location+"|"+(new Date).getTime()+"|"+Math.random()),id=Q("random/maxObserveMousemove")||0,0!=id&&jb("mousemove",nd,"add","at"));var pd=function(){var a=kd;a+=parseInt(md.substr(0,20),16);md=od(md);return a/(ld+Math.pow(16,20))},qd=function(){var a=new x.Uint32Array(1);gd.getRandomValues(a);return Number("0."+a[0])};var rd=function(){var a=K.onl;if(!a){a=B();K.onl=a;var b=B();a.e=function(c){var d=b[c];d&&(delete b[c],d())};a.a=function(c,d){b[c]=d};a.r=function(c){delete b[c]}}return a},sd=function(a,b){b=b.onload;return"function"===typeof b?(rd().a(a,b),b):null},td=function(a){E(/^\w+$/.test(a),"Unsupported id - "+a);rd();return'onload="window.___jsl.onl.e(&#34;'+a+'&#34;)"'},ud=function(a){rd().r(a)};var vd={allowtransparency:"true",frameborder:"0",hspace:"0",marginheight:"0",marginwidth:"0",scrolling:"no",style:"",tabindex:"0",vspace:"0",width:"100%"},wd={allowtransparency:!0,onload:!0},xd=0,yd=function(a){E(!a||ib.test(a),"Illegal url for new iframe - "+a)},zd=function(a,b,c,d,e){yd(c.src);var f,g=sd(d,c),h=g?td(d):"";try{document.all&&(f=a.createElement('<iframe frameborder="'+Wa(String(c.frameborder))+'" scrolling="'+Wa(String(c.scrolling))+'" '+h+' name="'+Wa(String(c.name))+'"/>'))}catch(l){}finally{f||
(f=a.createElement("iframe"),g&&(f.onload=function(){f.onload=null;g.call(this)},ud(d)))}f.setAttribute("ng-non-bindable","");for(var k in c)a=c[k],"style"===k&&"object"===typeof a?D(a,f.style):wd[k]||f.setAttribute(k,String(a));(k=e&&e.beforeNode||null)||e&&e.dontclear||ob(b);b.insertBefore(f,k);f=k?k.previousSibling:b.lastChild;c.allowtransparency&&(f.allowTransparency=!0);return f};var Ad=/^:[\w]+$/,Bd=/:([a-zA-Z_]+):/g,Cd=function(){var a=xc()||"0",b=yc();var c=xc(void 0)||a;var d=yc(void 0),e="";c&&(e+="u/"+encodeURIComponent(String(c))+"/");d&&(e+="b/"+encodeURIComponent(String(d))+"/");c=e||null;(e=(d=!1===Q("isLoggedIn"))?"_/im/":"")&&(c="");var f=Q("iframes/:socialhost:"),g=Q("iframes/:im_socialhost:");return uc={socialhost:f,ctx_socialhost:d?g:f,session_index:a,session_delegate:b,session_prefix:c,im_prefix:e}},Dd=function(a,b){return Cd()[b]||""},Ed=function(a){return function(b,
c){return a?Cd()[c]||a[c]||"":Cd()[c]||""}};var Fd=function(a){var b;a.match(/^https?%3A/i)&&(b=decodeURIComponent(a));return hb(document,b?b:a)},Gd=function(a){a=a||"canonical";for(var b=document.getElementsByTagName("link"),c=0,d=b.length;c<d;c++){var e=b[c],f=e.getAttribute("rel");if(f&&f.toLowerCase()==a&&(e=e.getAttribute("href"))&&(e=Fd(e))&&null!=e.match(/^https?:\/\/[\w\-_\.]+/i))return e}return window.location.href};var Hd={se:"0"},Id={post:!0},Jd={style:"position:absolute;top:-10000px;width:450px;margin:0px;border-style:none"},Kd="onPlusOne _ready _close _open _resizeMe _renderstart oncircled drefresh erefresh".split(" "),Ld=A(K,"WI",B()),Md=function(a,b,c){var d;var e={};var f=d=a;"plus"==a&&b.action&&(d=a+"_"+b.action,f=a+"/"+b.action);(d=Q("iframes/"+d+"/url"))||(d=":im_socialhost:/:session_prefix::im_prefix:_/widget/render/"+f+"?usegapi=1");for(var g in Hd)e[g]=g+"/"+(b[g]||Hd[g])+"/";e=hb(z,d.replace(Bd,
Ed(e)));g="iframes/"+a+"/params/";f={};D(b,f);(d=Q("lang")||Q("gwidget/lang"))&&(f.hl=d);Id[a]||(f.origin=window.location.origin||window.location.protocol+"//"+window.location.host);f.exp=Q(g+"exp");if(g=Q(g+"location"))for(d=0;d<g.length;d++){var h=g[d];f[h]=x.location[h]}switch(a){case "plus":case "follow":g=f.href;d=b.action?void 0:"publisher";g=(g="string"==typeof g?g:void 0)?Fd(g):Gd(d);f.url=g;delete f.href;break;case "plusone":g=(g=b.href)?Fd(g):Gd();f.url=g;g=b.db;d=Q();null==g&&d&&(g=d.db,
null==g&&(g=d.gwidget&&d.gwidget.db));f.db=g||void 0;g=b.ecp;d=Q();null==g&&d&&(g=d.ecp,null==g&&(g=d.gwidget&&d.gwidget.ecp));f.ecp=g||void 0;delete f.href;break;case "signin":f.url=Gd()}K.ILI&&(f.iloader="1");delete f["data-onload"];delete f.rd;for(var k in Hd)f[k]&&delete f[k];f.gsrc=Q("iframes/:source:");k=Q("inline/css");"undefined"!==typeof k&&0<c&&k>=c&&(f.ic="1");k=/^#|^fr-/;c={};for(var l in f)C(f,l)&&k.test(l)&&(c[l.replace(k,"")]=f[l],delete f[l]);l="q"==Q("iframes/"+a+"/params/si")?f:
c;k=mc();for(var n in k)!C(k,n)||C(f,n)||C(c,n)||(l[n]=k[n]);n=[].concat(Kd);(l=Q("iframes/"+a+"/methods"))&&"object"===typeof l&&Na.test(l.push)&&(n=n.concat(l));for(var p in b)C(b,p)&&/^on/.test(p)&&("plus"!=a||"onconnect"!=p)&&(n.push(p),delete f[p]);delete f.callback;c._methods=n.join(",");return fb(e,f,c)},Nd=["style","data-gapiscan"],Pd=function(a){for(var b=B(),c=0!=a.nodeName.toLowerCase().indexOf("g:"),d=0,e=a.attributes.length;d<e;d++){var f=a.attributes[d],g=f.name,h=f.value;0<=Oa.call(Nd,
g)||c&&0!=g.indexOf("data-")||"null"===h||"specified"in f&&!f.specified||(c&&(g=g.substr(5)),b[g.toLowerCase()]=h)}a=a.style;(c=Od(a&&a.height))&&(b.height=String(c));(a=Od(a&&a.width))&&(b.width=String(a));return b},Od=function(a){var b=void 0;"number"===typeof a?b=a:"string"===typeof a&&(b=parseInt(a,10));return b},Rd=function(){var a=K.drw;sc(function(b){if(a!==b.id&&4!=b.state&&"share"!=b.type){var c=b.id,d=b.type,e=b.url;b=b.userParams;var f=z.getElementById(c);if(f){var g=Md(d,b,0);g?(f=f.parentNode,
e.replace(/#.*/,"").replace(/(\?|&)ic=1/,"")!==g.replace(/#.*/,"").replace(/(\?|&)ic=1/,"")&&(b.dontclear=!0,b.rd=!0,b.ri=!0,b.type=d,Qd(f,b),(d=R[f.lastChild.id])&&(d.oid=c),tc(c,4))):delete R[c]}else delete R[c]}})};var Sd,Td,X,Ud,Vd,Wd=/(?:^|\s)g-((\S)*)(?:$|\s)/,Xd={plusone:!0,autocomplete:!0,profile:!0,signin:!0,signin2:!0};Sd=A(K,"SW",B());Td=A(K,"SA",B());X=A(K,"SM",B());Ud=A(K,"FW",[]);Vd=null;
var Zd=function(a,b){Yd(void 0,!1,a,b)},Yd=function(a,b,c,d){L("ps0",!0);c=("string"===typeof c?document.getElementById(c):c)||z;var e=z.documentMode;if(c.querySelectorAll&&(!e||8<e)){e=d?[d]:Xa(Sd).concat(Xa(Td)).concat(Xa(X));for(var f=[],g=0;g<e.length;g++){var h=e[g];f.push(".g-"+h,"g\\:"+h)}e=c.querySelectorAll(f.join(","))}else e=c.getElementsByTagName("*");c=B();for(f=0;f<e.length;f++){g=e[f];var k=g;h=d;var l=k.nodeName.toLowerCase(),n=void 0;if(k.getAttribute("data-gapiscan"))h=null;else{var p=
l.indexOf("g:");0==p?n=l.substr(2):(p=(p=String(k.className||k.getAttribute("class")))&&Wd.exec(p))&&(n=p[1]);h=!n||!(Sd[n]||Td[n]||X[n])||h&&n!==h?null:n}h&&(Xd[h]||0==g.nodeName.toLowerCase().indexOf("g:")||0!=Xa(Pd(g)).length)&&(g.setAttribute("data-gapiscan",!0),A(c,h,[]).push(g))}if(b)for(var r in c)for(b=c[r],d=0;d<b.length;d++)b[d].setAttribute("data-onload",!0);for(var u in c)Ud.push(u);L("ps1",!0);if((r=Ud.join(":"))||a)try{F.load(r,a)}catch(G){pc(G);return}if($d(Vd||{}))for(var y in c){a=
c[y];u=0;for(b=a.length;u<b;u++)a[u].removeAttribute("data-gapiscan");ae(y)}else{d=[];for(y in c)for(a=c[y],u=0,b=a.length;u<b;u++)e=a[u],be(y,e,Pd(e),d,b);ce(r,d)}},de=function(a){var b=A(F,a,{});b.go||(b.go=function(c){return Zd(c,a)},b.render=function(c,d){d=d||{};d.type=a;return Qd(c,d)})},ee=function(a){Sd[a]=!0},fe=function(a){Td[a]=!0},ge=function(a){X[a]=!0};var ae=function(a,b){var c=sb(a);b&&c?(c(b),(c=b.iframeNode)&&c.setAttribute("data-gapiattached",!0)):F.load(a,function(){var d=sb(a),e=b&&b.iframeNode,f=b&&b.userParams;e&&d?(d(b),e.setAttribute("data-gapiattached",!0)):(d=F[a].go,"signin2"==a?d(e,f):d(e&&e.parentNode,f))})},$d=function(){return!1},ce=function(){},be=function(a,b,c,d,e,f,g){switch(he(b,a,f)){case 0:a=X[a]?a+"_annotation":a;d={};d.iframeNode=b;d.userParams=c;ae(a,d);break;case 1:if(b.parentNode){for(var h in c){if(f=C(c,h))f=c[h],
f=!!f&&"object"===typeof f&&(!f.toString||f.toString===Object.prototype.toString||f.toString===Array.prototype.toString);if(f)try{c[h]=$c(c[h])}catch(y){delete c[h]}}f=!0;c.dontclear&&(f=!1);delete c.dontclear;rc();h=Md(a,c,e);e=g||{};e.allowPost=1;e.attributes=Jd;e.dontclear=!f;g={};g.userParams=c;g.url=h;g.type=a;if(c.rd)var k=b;else k=document.createElement("div"),b.setAttribute("data-gapistub",!0),k.style.cssText="position:absolute;width:450px;left:-10000px;",b.parentNode.insertBefore(k,b);g.siteElement=
k;k.id||(b=k,A(Ld,a,0),f="___"+a+"_"+Ld[a]++,b.id=f);b=B();b[">type"]=a;D(c,b);f=h;c=k;h=e||{};b=h.attributes||{};E(!(h.allowPost||h.forcePost)||!b.onload,"onload is not supported by post iframe (allowPost or forcePost)");e=b=f;Ad.test(b)&&(e=Q("iframes/"+e.substring(1)+"/url"),E(!!e,"Unknown iframe url config for - "+b));f=hb(z,e.replace(Bd,Dd));b=c.ownerDocument||z;k=0;do e=h.id||["I",xd++,"_",(new Date).getTime()].join("");while(b.getElementById(e)&&5>++k);E(5>k,"Error creating iframe id");k={};
var l={};b.documentMode&&9>b.documentMode&&(k.hostiemode=b.documentMode);D(h.queryParams||{},k);D(h.fragmentParams||{},l);var n=h.pfname;var p=B();Q("iframes/dropLegacyIdParam")||(p.id=e);p._gfid=e;p.parent=b.location.protocol+"//"+b.location.host;var r=H(b.location.href,"parent");n=n||"";!n&&r&&(r=H(b.location.href,"_gfid","")||H(b.location.href,"id",""),n=H(b.location.href,"pfname",""),n=r?n+"/"+r:"");n||(r=Zc(H(b.location.href,"jcp","")))&&"object"==typeof r&&(n=(n=r.id)?r.pfname+"/"+n:"");p.pfname=
n;h.connectWithJsonParam&&(r={},r.jcp=$c(p),p=r);r=H(f,"rpctoken")||k.rpctoken||l.rpctoken;r||(r=h.rpctoken||String(Math.round(1E8*(hd?qd():pd()))),p.rpctoken=r);h.rpctoken=r;D(p,h.connectWithQueryParams?k:l);r=b.location.href;p=B();(n=H(r,"_bsh",K.bsh))&&(p._bsh=n);(r=qb(r))&&(p.jsh=r);h.hintInFragment?D(p,l):D(p,k);f=fb(f,k,l,h.paramsSerializer);l=B();D(vd,l);D(h.attributes,l);l.name=l.id=e;l.src=f;h.eurl=f;k=h||{};p=!!k.allowPost;if(k.forcePost||p&&2E3<f.length){k=I(f);l.src="";h.dropDataPostorigin||
(l["data-postorigin"]=f);f=zd(b,c,l,e);if(-1!=navigator.userAgent.indexOf("WebKit")){var u=f.contentWindow.document;u.open();l=u.createElement("div");p={};r=e+"_inner";p.name=r;p.src="";p.style="display:none";zd(b,l,p,r,h)}l=(h=k.query[0])?h.split("&"):[];h=[];for(p=0;p<l.length;p++)r=l[p].split("=",2),h.push([decodeURIComponent(r[0]),decodeURIComponent(r[1])]);k.query=[];l=db(k);E(ib.test(l),"Invalid URL: "+l);k=b.createElement("form");k.method="POST";k.target=e;k.style.display="none";e=l instanceof
v?l:Fa(l);xa(k,"HTMLFormElement").action=Da(e);for(e=0;e<h.length;e++)l=b.createElement("input"),l.type="hidden",l.name=h[e][0],l.value=h[e][1],k.appendChild(l);c.appendChild(k);k.submit();k.parentNode.removeChild(k);u&&u.close();u=f}else u=zd(b,c,l,e,h);g.iframeNode=u;g.id=u.getAttribute("id");u=g.id;c=B();c.id=u;c.userParams=g.userParams;c.url=g.url;c.type=g.type;c.state=1;R[u]=c;u=g}else u=null;u&&((g=u.id)&&d.push(g),ae(a,u))}},he=function(a,b,c){if(a&&1===a.nodeType&&b){if(c)return 1;if(X[b]){if(pb[a.nodeName.toLowerCase()])return(a=
a.innerHTML)&&a.replace(/^[\s\xa0]+|[\s\xa0]+$/g,"")?0:1}else{if(Td[b])return 0;if(Sd[b])return 1}}return null},Qd=function(a,b){var c=b.type;delete b.type;var d=("string"===typeof a?document.getElementById(a):a)||void 0;if(d){a={};for(var e in b)C(b,e)&&(a[e.toLowerCase()]=b[e]);a.rd=1;(b=!!a.ri)&&delete a.ri;e=[];be(c,d,a,e,0,b,void 0);ce(c,e)}else pc("string"==="gapi."+c+".render: missing element "+typeof a?a:"")};A(F,"platform",{}).go=Zd;$d=function(a){for(var b=["_c","jsl","h"],c=0;c<b.length&&a;c++)a=a[b[c]];b=qb(La.href);return!a||0!=a.indexOf("n;")&&0!=b.indexOf("n;")&&a!==b};ce=function(a,b){ie(a,b)};var lb=function(a){Yd(a,!0)},je=function(a,b){b=b||[];for(var c=0;c<b.length;++c)a(b[c]);for(a=0;a<b.length;a++)de(b[a])};
N.push(["platform",function(a,b,c){Vd=c;b&&Ud.push(b);je(ee,a);je(fe,c._c.annotation);je(ge,c._c.bimodal);ic();gc();if("explicit"!=Q("parsetags")){rb(a);nc(mc())&&!Q("disableRealtimeCallback")&&rc();if(c&&(a=c.callback)){var d=Ya(a);delete c.callback}nb(function(){lb(d)})}}]);F._pl=!0;var ke=function(a){a=(a=R[a])?a.oid:void 0;if(a){var b=z.getElementById(a);b&&b.parentNode.removeChild(b);delete R[a];ke(a)}};var le=/^\{h:'/,me=/^!_/,ne="",ie=function(a,b){function c(){jb("message",d,"remove","de")}function d(f){var g=f.data,h=f.origin;if(oe(g,b)){var k=e;e=!1;k&&L("rqe");pe(a,function(){k&&L("rqd");c();for(var l=A(K,"RPMQ",[]),n=0;n<l.length;n++)l[n]({data:g,origin:h})})}}if(0!==b.length){ne=H(La.href,"pfname","");var e=!0;jb("message",d,"add","at");ac(a,c)}},oe=function(a,b){a=String(a);if(le.test(a))return!0;var c=!1;me.test(a)&&(c=!0,a=a.substr(2));if(!/^\{/.test(a))return!1;var d=Zc(a);if(!d)return!1;
a=d.f;if(d.s&&a&&-1!=Oa.call(b,a)){if("_renderstart"===d.s||d.s===ne+"/"+a+"::_renderstart")if(d=d.a&&d.a[c?0:1],b=z.getElementById(a),tc(a,2),d&&b&&d.width&&d.height){a:{c=b.parentNode;a=d||{};if(qc()){var e=b.id;if(e){d=(d=R[e])?d.state:void 0;if(1===d||4===d)break a;ke(e)}}(d=c.nextSibling)&&d.getAttribute&&d.getAttribute("data-gapistub")&&(c.parentNode.removeChild(d),c.style.cssText="");d=a.width;var f=a.height,g=c.style;g.textIndent="0";g.margin="0";g.padding="0";g.background="transparent";g.borderStyle=
"none";g.cssFloat="none";g.styleFloat="none";g.lineHeight="normal";g.fontSize="1px";g.verticalAlign="baseline";c=c.style;c.display="inline-block";g=b.style;g.position="static";g.left="0";g.top="0";g.visibility="visible";d&&(c.width=g.width=d+"px");f&&(c.height=g.height=f+"px");a.verticalAlign&&(c.verticalAlign=a.verticalAlign);e&&tc(e,3)}b["data-csi-wdt"]=(new Date).getTime()}return!0}return!1},pe=function(a,b){ac(a,b)};var qe=function(a,b){this.L=a;a=b||{};this.fa=Number(a.maxAge)||0;this.U=a.domain;this.X=a.path;this.ga=!!a.secure};qe.prototype.read=function(){for(var a=this.L+"=",b=document.cookie.split(/;\s*/),c=0;c<b.length;++c){var d=b[c];if(0==d.indexOf(a))return d.substr(a.length)}};
qe.prototype.write=function(a,b){if(!re.test(this.L))throw"Invalid cookie name";if(!se.test(a))throw"Invalid cookie value";a=this.L+"="+a;this.U&&(a+=";domain="+this.U);this.X&&(a+=";path="+this.X);b="number"===typeof b?b:this.fa;if(0<=b){var c=new Date;c.setSeconds(c.getSeconds()+b);a+=";expires="+c.toUTCString()}this.ga&&(a+=";secure");document.cookie=a;return!0};qe.prototype.clear=function(){this.write("",0)};var se=/^[-+/_=.:|%&a-zA-Z0-9@]*$/,re=/^[A-Z_][A-Z0-9_]{0,63}$/;
qe.iterate=function(a){for(var b=document.cookie.split(/;\s*/),c=0;c<b.length;++c){var d=b[c].split("="),e=d.shift();a(e,d.join("="))}};var te=function(a){this.B=a};te.prototype.read=function(){if(Y.hasOwnProperty(this.B))return Y[this.B]};te.prototype.write=function(a){Y[this.B]=a;return!0};te.prototype.clear=function(){delete Y[this.B]};var Y={};te.iterate=function(a){for(var b in Y)Y.hasOwnProperty(b)&&a(b,Y[b])};var ue="https:"===window.location.protocol,ve=ue||"http:"===window.location.protocol?qe:te,we=function(a){var b=a.substr(1),c="",d=window.location.hostname;if(""!==b){c=parseInt(b,10);if(isNaN(c))return null;b=d.split(".");if(b.length<c-1)return null;b.length==c-1&&(d="."+d)}else d="";return{i:"S"==a.charAt(0),domain:d,l:c}},xe=function(){var a,b=null;ve.iterate(function(c,d){0===c.indexOf("G_AUTHUSER_")&&(c=we(c.substring(11)),!a||c.i&&!a.i||c.i==a.i&&c.l>a.l)&&(a=c,b=d)});return{ea:a,F:b}};var ye=function(a){if(0!==a.indexOf("GCSC"))return null;var b={W:!1};a=a.substr(4);if(!a)return b;var c=a.charAt(0);a=a.substr(1);var d=a.lastIndexOf("_");if(-1==d)return b;var e=we(a.substr(d+1));if(null==e)return b;a=a.substring(0,d);if("_"!==a.charAt(0))return b;d="E"===c&&e.i;return!d&&("U"!==c||e.i)||d&&!ue?b:{W:!0,i:d,ja:a.substr(1),domain:e.domain,l:e.l}},ze=function(a){if(!a)return[];a=a.split("=");return a[1]?a[1].split("|"):[]},Ae=function(a){a=a.split(":");return{clientId:a[0].split("=")[1],
ia:ze(a[1]),la:ze(a[2]),ka:ze(a[3])}},Be=function(){var a=xe(),b=a.ea;a=a.F;if(null!==a){var c;ve.iterate(function(f,g){(f=ye(f))&&f.W&&f.i==b.i&&f.l==b.l&&(c=g)});if(c){var d=Ae(c),e=d&&d.ia[Number(a)];d=d&&d.clientId;if(e)return{F:a,ha:e,clientId:d}}}return null};var Z=function(){this.T=Ce};Z.prototype.$=function(){this.K||(this.v=0,this.K=!0,this.Y())};Z.prototype.Y=function(){this.K&&(this.T()?this.v=this.R:this.v=Math.min(2*(this.v||this.R),120),window.setTimeout(na(this.Y,this),1E3*this.v))};Z.prototype.v=0;Z.prototype.R=2;Z.prototype.T=null;Z.prototype.K=!1;for(var De=0;64>De;++De);var Ee=null;qc=function(){return K.oa=!0};rc=function(){K.oa=!0;var a=Be();(a=a&&a.F)&&hc("googleapis.config/sessionIndex",a);Ee||(Ee=A(K,"ss",new Z));a=Ee;a.$&&a.$()};
var Ce=function(){var a=Be(),b=a&&a.ha||null,c=a&&a.clientId;ac("auth",{callback:function(){var d=x.gapi.auth,e={client_id:c,session_state:b};d.checkSessionState(e,function(f){var g=e.session_state,h=Q("isLoggedIn");f=Q("debug/forceIm")?!1:g&&f||!g&&!f;if(h=h!=f)hc("isLoggedIn",f),rc(),Rd(),f||((f=d.signOut)?f():(f=d.setToken)&&f(null));f=mc();var k=Q("savedUserState");g=d._guss(f.cookiepolicy);k=k!=g&&"undefined"!=typeof k;hc("savedUserState",g);(h||k)&&nc(f)&&!Q("disableRealtimeCallback")&&d._pimf(f,
!0)})}});return!0};L("bs0",!0,window.gapi._bs);L("bs1",!0);delete window.gapi._bs;}).call(this);
gapi.load("",{callback:window["google_onLoadGoogleCallback"],_c:{"jsl":{"ci":{"deviceType":"desktop","oauth-flow":{"authUrl":"https://accounts.google.com/o/oauth2/auth","proxyUrl":"https://accounts.google.com/o/oauth2/postmessageRelay","disableOpt":true,"idpIframeUrl":"https://accounts.google.com/o/oauth2/iframe","usegapi":false},"debug":{"reportExceptionRate":0.05,"forceIm":false,"rethrowException":false,"host":"https://apis.google.com"},"enableMultilogin":true,"googleapis.config":{"auth":{"useFirstPartyAuthV2":false}},"isPlusUser":false,"inline":{"css":1},"disableRealtimeCallback":false,"drive_share":{"skipInitCommand":true},"csi":{"rate":0.01},"client":{"cors":false},"isLoggedIn":false,"signInDeprecation":{"rate":0.0},"include_granted_scopes":true,"llang":"en","iframes":{"youtube":{"params":{"location":["search","hash"]},"url":":socialhost:/:session_prefix:_/widget/render/youtube?usegapi\u003d1","methods":["scroll","openwindow"]},"ytsubscribe":{"url":"https://www.youtube.com/subscribe_embed?usegapi\u003d1"},"plus_circle":{"params":{"url":""},"url":":socialhost:/:session_prefix::se:_/widget/plus/circle?usegapi\u003d1"},"plus_share":{"params":{"url":""},"url":":socialhost:/:session_prefix::se:_/+1/sharebutton?plusShare\u003dtrue\u0026usegapi\u003d1"},"rbr_s":{"params":{"url":""},"url":":socialhost:/:session_prefix::se:_/widget/render/recobarsimplescroller"},":source:":"3p","playemm":{"url":"https://play.google.com/work/embedded/search?usegapi\u003d1\u0026usegapi\u003d1"},"savetoandroidpay":{"url":"https://pay.google.com/gp/v/widget/save"},"blogger":{"params":{"location":["search","hash"]},"url":":socialhost:/:session_prefix:_/widget/render/blogger?usegapi\u003d1","methods":["scroll","openwindow"]},"evwidget":{"params":{"url":""},"url":":socialhost:/:session_prefix:_/events/widget?usegapi\u003d1"},"partnersbadge":{"url":"https://www.gstatic.com/partners/badge/templates/badge.html?usegapi\u003d1"},"dataconnector":{"url":"https://dataconnector.corp.google.com/:session_prefix:ui/widgetview?usegapi\u003d1"},"surveyoptin":{"url":"https://www.google.com/shopping/customerreviews/optin?usegapi\u003d1"},":socialhost:":"https://apis.google.com","shortlists":{"url":""},"hangout":{"url":"https://talkgadget.google.com/:session_prefix:talkgadget/_/widget"},"plus_followers":{"params":{"url":""},"url":":socialhost:/_/im/_/widget/render/plus/followers?usegapi\u003d1"},"post":{"params":{"url":""},"url":":socialhost:/:session_prefix::im_prefix:_/widget/render/post?usegapi\u003d1"},":gplus_url:":"https://plus.google.com","signin":{"params":{"url":""},"url":":socialhost:/:session_prefix:_/widget/render/signin?usegapi\u003d1","methods":["onauth"]},"rbr_i":{"params":{"url":""},"url":":socialhost:/:session_prefix::se:_/widget/render/recobarinvitation"},"share":{"url":":socialhost:/:session_prefix::im_prefix:_/widget/render/share?usegapi\u003d1"},"plusone":{"params":{"count":"","size":"","url":""},"url":":socialhost:/:session_prefix::se:_/+1/fastbutton?usegapi\u003d1"},"comments":{"params":{"location":["search","hash"]},"url":":socialhost:/:session_prefix:_/widget/render/comments?usegapi\u003d1","methods":["scroll","openwindow"]},":im_socialhost:":"https://plus.googleapis.com","backdrop":{"url":"https://clients3.google.com/cast/chromecast/home/widget/backdrop?usegapi\u003d1"},"visibility":{"params":{"url":""},"url":":socialhost:/:session_prefix:_/widget/render/visibility?usegapi\u003d1"},"autocomplete":{"params":{"url":""},"url":":socialhost:/:session_prefix:_/widget/render/autocomplete"},"additnow":{"url":"https://apis.google.com/marketplace/button?usegapi\u003d1","methods":["launchurl"]},":signuphost:":"https://plus.google.com","ratingbadge":{"url":"https://www.google.com/shopping/customerreviews/badge?usegapi\u003d1"},"appcirclepicker":{"url":":socialhost:/:session_prefix:_/widget/render/appcirclepicker"},"follow":{"url":":socialhost:/:session_prefix:_/widget/render/follow?usegapi\u003d1"},"community":{"url":":ctx_socialhost:/:session_prefix::im_prefix:_/widget/render/community?usegapi\u003d1"},"sharetoclassroom":{"url":"https://www.gstatic.com/classroom/sharewidget/widget_stable.html?usegapi\u003d1"},"ytshare":{"params":{"url":""},"url":":socialhost:/:session_prefix:_/widget/render/ytshare?usegapi\u003d1"},"plus":{"url":":socialhost:/:session_prefix:_/widget/render/badge?usegapi\u003d1"},"family_creation":{"params":{"url":""},"url":"https://families.google.com/webcreation?usegapi\u003d1\u0026usegapi\u003d1"},"commentcount":{"url":":socialhost:/:session_prefix:_/widget/render/commentcount?usegapi\u003d1"},"configurator":{"url":":socialhost:/:session_prefix:_/plusbuttonconfigurator?usegapi\u003d1"},"zoomableimage":{"url":"https://ssl.gstatic.com/microscope/embed/"},"appfinder":{"url":"https://gsuite.google.com/:session_prefix:marketplace/appfinder?usegapi\u003d1"},"savetowallet":{"url":"https://pay.google.com/gp/v/widget/save"},"person":{"url":":socialhost:/:session_prefix:_/widget/render/person?usegapi\u003d1"},"savetodrive":{"url":"https://drive.google.com/savetodrivebutton?usegapi\u003d1","methods":["save"]},"page":{"url":":socialhost:/:session_prefix:_/widget/render/page?usegapi\u003d1"},"card":{"url":":socialhost:/:session_prefix:_/hovercard/card"}}},"h":"m;/_/scs/apps-static/_/js/k\u003doz.gapi.en_US.0_afc8ibZR4.O/am\u003dwQE/d\u003d1/ct\u003dzgms/rs\u003dAGLTcCOPV8Bttuu5r6907bIMhw8f2tfAew/m\u003d__features__","u":"https://apis.google.com/js/platform.js?onload\u003dgoogle_onLoadGoogleCallback","hee":true,"fp":"8ce5d92840216c7cbbc5ca875448ffb0960c9648","dpo":false},"platform":["additnow","backdrop","blogger","comments","commentcount","community","donation","family_creation","follow","hangout","health","page","partnersbadge","person","playemm","playreview","plus","plusone","post","ratingbadge","savetoandroidpay","savetodrive","savetowallet","sharetoclassroom","shortlists","signin2","surveyoptin","visibility","youtube","ytsubscribe","zoomableimage"],"fp":"8ce5d92840216c7cbbc5ca875448ffb0960c9648","annotation":["interactivepost","recobar","signin2","autocomplete","profile"],"bimodal":["signin","share"]}});;
/* Google_map functions created by giaidieu */

/**
 * Google login helper function.
 */
function google_onLoadGoogleCallback() {
  gapi.load('auth2', function() {
    auth2 = gapi.auth2.init({
      client_id: Drupal.settings['giaidieu_google_app_id'],
      cookiepolicy: 'single_host_origin',
      scope: 'profile'
    });

    auth2.attachClickHandler(element, {},
      function(googleUser) {
        var profile = googleUser.getBasicProfile();
        var id = profile.getId();
        var email = profile.getEmail() != null ? profile.getEmail() : id + '@googlemail.com';
        var name = profile.getName();
        var imageURL = profile.getImageUrl();

        var userData = {
			    email: email,
		      first_name: name,
			    last_name: '',
			    cover: {source: imageURL}
			  };
        
        userData['caller'] = 'google';
        //console.log(userData);
        
        custom_social_network_login(userData);
        
      }, function(error) {
        console.log('Sign-in error', error);
      }
    );
  });

  element = document.getElementById('googleSignIn');
}

/**
 * Set bound and center.
 */
function giaidieu_googlemap_set_bound_and_center(map, markers, to_center) {
  if (to_center == undefined) {to_center = true;}
  
  var bounds = new google.maps.LatLngBounds();
  
  for (var i = 0; i < markers.length; i++) {
    bounds.extend(markers[i].getPosition());
  }
  
  map.fitBounds(bounds);

  if (to_center) {
    map.panToBounds(bounds); // Center map.
  }
}

/**
 * Init an autocomplete address field.
 */
function google_map_autocomplete_init(dom_id, callback) {
  var google_map_place_autocomplete = new google.maps.places.Autocomplete((document.getElementById('' + dom_id)), {types: ['geocode']});
  if (typeof callback == 'function') {callback(google_map_place_autocomplete);}
}

/**
 * Remove marker from a map.
 * map: map canvas object.
 * marker: marker object to be removed.
 */
function google_map_marker_remove(marker) {
  marker.setMap(null);
}

/**
 * Add an existing marker to a map.
 * map: map canvas object.
 * marker: marker object to be added.
 */
function google_map_marker_add(map, marker) {
  marker.setMap(map);
}

/**
 * Create a marker on the map.
 * map: map canvas object.
 * position: LatLng object.
 * marker_icon: path to icon image file.
 * infowindow_title: infowindow title.
 * infowindow_content: infowindow body.
 */
function google_map_marker_set(map, position, marker_icon, title, infowindow_content) {
  if (marker_icon == undefined) {marker_icon = '';}
  if (title == undefined) {title = '';}
  if (infowindow_content == undefined) {infowindow_content = '';}
  
  title = title != '' ? title : 'Vị trí hiện tại của bạn';
  infowindow_content = infowindow_content != '' ? infowindow_content : 'Vị trí hiện tại của bạn';

  var marker = new google.maps.Marker({
        position: position,
        map: map,
        title: title,
        icon: marker_icon ? marker_icon : '',
        animation: google.maps.Animation.DROP
  });

  var infowindow = new google.maps.InfoWindow({content: infowindow_content});

  marker.addListener('click', function() {
    infowindow.open(map, marker);
    marker.setAnimation(google.maps.Animation.BOUNCE);
  });

  google.maps.event.addListener(infowindow, 'closeclick', function() {
    marker.setAnimation(null);
  });

  return marker;
}

/**
 * Google map init.
 * map: map canvas object, should be null at init.
 * map_id: canvas id.
 * lat: latitude value for init, 0 by default.
 * lon: longitude value for init, 0 by default.
 * options: map options object, leave empty will be used default map values.
 * marker_options: init marker object option. Usually use for current user.
 */
function google_map_google_init(map_id, lat, lon, options, marker_options, callback) {
  if (lat == undefined) {lat = 0;}
  if (lon == undefined) {lon = 0;}
  if (options == undefined) {options = {};}
  if (marker_options == undefined) {marker_options = {};}

  try {
    navigator.geolocation.getCurrentPosition(
      // Success.
      function(position) {
        // Set init position, if not provided, set the current user pos.
        lat = !lat ? position.coords.latitude : lat;
        lon = !lon ? position.coords.longitude : lon;

        // Build the lat lng object from the user's position.
        var myLatlng = new google.maps.LatLng(lat, lon);

        // Set the map's options.
        var mapOptions = options;
        mapOptions['center'] = myLatlng;
        mapOptions['disableDefaultUI'] = mapOptions['disableDefaultUI'] != undefined ? mapOptions['disableDefaultUI'] : true;
        mapOptions['zoom'] = mapOptions['zoom'] != undefined ? mapOptions['zoom'] : 16;
        mapOptions['mapTypeControl'] = mapOptions['mapTypeControl'] != undefined ? mapOptions['mapTypeControl'] : true;
        mapOptions['mapTypeControlOptions'] = mapOptions['mapTypeControlOptions'] != undefined ? mapOptions['mapTypeControlOptions'] : {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU};
        mapOptions['zoomControl'] = mapOptions['zoomControl'] != undefined ? mapOptions['zoomControl'] : true;
        mapOptions['zoomControlOptions'] = mapOptions['zoomControlOptions'] != undefined ? mapOptions['zoomControlOptions'] : {style: google.maps.ZoomControlStyle.SMALL};
        mapOptions['zoomControlOptions']['position'] = mapOptions['zoomControlOptions']['position'] != undefined ? mapOptions['zoomControlOptions']['position'] : google.maps.ControlPosition.RIGHT_TOP;

        // Initialize the map, and set a timeout to resize properly.
        var map = new google.maps.Map(
          document.getElementById(map_id),
          mapOptions
        );

        setTimeout(function() {
          google.maps.event.trigger(map, 'resize');
          map.setCenter(myLatlng);

          // Activate callback function in here.
          if (typeof callback == 'function') {callback(map, lat, lon);}
        }, 500);

        // Add a marker for the user's current position.
        var marker_icon = marker_options['icon'] != undefined ? marker_options['icon'] : '';
        var marker_title = marker_options['title'] != undefined ? marker_options['title'] : '';
        var marker_content = marker_options['content'] != undefined ? marker_options['content'] : '';

        google_map_marker_set(map, myLatlng, marker_icon, marker_title, marker_content);
      },

      // Error
      function(error) {
        // Provide debug information to developer and user.
        //console.log(error);
        drupalgap_alert(error.message, {title: 'Thông báo'});

        // Process error code.
        switch (error.code) {
          // PERMISSION_DENIED
          case 1:
            break;

          // POSITION_UNAVAILABLE
          case 2:
            break;

          // TIMEOUT
          case 3:
            break;
        }
      },
      // Options
      { enableHighAccuracy: true }
    );
  }
  catch (error) {
    console.log('google_map_google_init - ' + error);
  }
};
/* Custom function made by giaidieu.com */

/**
 * Smart login callback.
 */
function custom_user_smart_login(obj) {
  var name = jQuery('#edit-name').val().trim();
  var pass = jQuery('#edit-pass').val().trim();
  
  if (name == '' || pass == '') {
    custom_dialog_alert('Thông báo', 'Bạn chưa nhập đầy đủ thông tin để đăng nhập. Vui lòng kiểm tra rồi thử lại.');
    return false;
  }


  jQuery(obj).addClass('disabled');
  var message_loading = custom_dialog_ajax_loading('Đang xử lý đăng nhập...', 'Xin vui lòng chờ trong giây lát!');
  
  custom_services_request('account_smart_login', {name: name, password: pass}, function(result) {
    //console.log(result);
    
    jQuery(obj).removeClass('disabled');
    message_loading.dialog('close');
    
    if (result['is_error']) {
      custom_dialog_alert('Thông báo', result['message']);
      return false;
    }
    
    // Successful login.
    custom_dialog_alert('Thông báo', 'Bạn đã đăng nhập thành công vào Người Yêu Đẹp bằng <b>' + result['login_type'] + '</b> để sử dụng dịch vụ. Nhấn "Đồng ý" để tiếp tục.', function() {
      // Check if there is a destination, if has, go for it.
      var query_params = custom_query_params_get();
      if (query_params['destination'] != undefined && query_params['destination'] != '') {
        document.location.href = '/' + query_params['destination'];
      }
      else{
        document.location.reload();
      }
    });
  });
  
  return false;
}

/**
 * Auto login and redirect for social network account.
 */
function custom_social_network_login(response) {
  var message_loading = custom_dialog_ajax_loading('Đang xử lý đăng nhập...', 'Xin vui lòng chờ trong giây lát!');
  response['status'] = 0; // Not activate by detault -> Wait for selecting role.
              
  custom_services_request('social_login', {data: response}, function(result) {
    message_loading.dialog('close');
                
    if (result && result['uid'] > 0) {
      if (result['is_new']) {
        // For new account, ask for role and go to update profile.
        var html = '<p class="desc">Bạn đã đăng ký thành công vào Người Yêu Đẹp. Vui lòng chọn loại tài khoản để tiếp tục:</p>';
        html += '<input type="radio" name="account_type" value="5" /> Khách thuê dịch vụ<br /><input type="radio" name="account_type" value="4" /> PG/PB cung cấp dịch vụ';
                    
        custom_dialog_confirm('Chọn loại tài khoản', html, 400, 'auto', false, function() {
          var account_type = parseInt(jQuery("#custom-dialog-confirm").find('input[name="account_type"]:checked').val());
          if (account_type != 4 && account_type != 5) {
            custom_dialog_alert('Thông báo', 'Bạn chưa chọn loại tài khoản để tiếp tục.');
            return false;
          }
                      
          // Process to assign role.
          custom_dialog_confirm_close();
                      
          var account_fields = {
            status: 1,
            login: 1
          };
                      
          if (account_type == 5) {
            account_fields['roles'] = {5: 'customer'};
          }
          else{
            account_fields['roles'] = {4: 'pgpb'};
          }
                      
          var message_loading = custom_dialog_ajax_loading('Đang xử lý...', 'Xin vui lòng chờ trong giây lát!');
          custom_services_request('user_store', {uid: result['uid'], account_fields: account_fields}, function(result) {
            //console.log(result);
                        
            message_loading.dialog('close');
                        
            if (result['is_error']) {
              custom_dialog_alert('Thông báo', result['message']);
              return false;                          
            }
                        
            if (account_type == 4) {
              // PG account is not activated automatically.
              custom_dialog_alert('Thông báo', '<p>Là thành viên cung cấp dịch vụ, bạn cần điền đầy đủ thông tin trong mục <b>"Cập Nhật Hồ Sơ"</b> và thực hiện xác thực E-mail / Số điện thoại để nhận yêu cầu từ Khách hàng.</p><p>Sau khi hoàn thành, tài khoản của bạn sẽ được duyệt bởi Người Yêu Đẹp để hiện lên website.</p><p>Nhấn "Đồng ý" để tiếp tục.</p>', function() {
                document.location.href = '/user/' + result['account']['uid'] + '/edit';
              });
            }
            else{
              custom_dialog_alert('Thông báo', 'Bạn đã đăng nhập thành công vào Người Yêu Đẹp để sử dụng dịch vụ dành riêng cho tài khoản Khách hàng. Nhấn "Đồng ý" để tiếp tục.', function() {
                // Check if there is a destination, if has, go for it.
                var query_params = custom_query_params_get();
                if (query_params['destination'] != undefined && query_params['destination'] != '') {
                  document.location.href = '/' + query_params['destination'];
                }
                else{
                  document.location.href = '/user';
                }
              });
            }
          });
        });
      }
      else{
        // Check if there is a destination, if has, go for it.
        var query_params = custom_query_params_get();
        if (query_params['destination'] != undefined && query_params['destination'] != '') {
          document.location.href = '/' + query_params['destination'];
        }
        else{
          document.location.href = '/user';
        }
      }
    }
  });
}

/**
 * Remove a pg uid from the list in contact display.
 */
function custom_pg_list_remove(obj) {
  var uid = parseInt(jQuery(obj).attr('uid'));
  var name = jQuery(obj).attr('title');
  
  // Validate.
  if (isNaN(uid)) {return;}

  // Remove from the list.
  _custom_remove_from_favorite(uid, name, function() {
    // Remove from the display.
    jQuery(obj).closest('div.views-row').fadeOut(function() {
      // Remove.
      jQuery(this).remove();
      
      // Display empty text if no more.
      if (jQuery("#edit-pgpb-body").find('div.view-content').children().length == 0) {
        jQuery("#edit-pgpb-body").html('Bạn chưa chọn PG / PB Hẹn hò để đăng ký thuê dịch vụ. <a href="/thanh-vien" title="Tìm người hẹn hò">Nhấn vào đây</a> để bắt đầu tìm.');
      }
      
      // Update PG list.
      if (Drupal.settings['pg_services'] != undefined && Drupal.settings['pg_services'][uid] != undefined) {
        delete Drupal.settings['pg_services'][uid];
        
        // Update messages.
        jQuery("p.pg-validate-error[uid='" + uid + "']").remove();
        jQuery("p.pg-validate-warning[uid='" + uid + "']").remove();
        
        if (!jQuery("#appointment-duration-update").children('p.pg-validate-warning').length) {
          jQuery("#appointment-duration-update").remove();
        }
      }
    });
  });
  
  return false;
}

/**
 * Remove an item from the pg list.
 */
function _custom_remove_from_favorite(uid, name, callback) {
  custom_dialog_confirm('Xác nhận', 'Bạn chắc chắn muốn đưa ' + name + ' ra khỏi Danh sách chọn của mình?', 400, 'auto', true, function() {
    // Close the box.
    custom_dialog_confirm_close();
    
    // Get the list if existing.
    var list = custom_variable_get('nyd_pg_list', 'json');
    if (list == null) {
      list = new Array();
    }
    
    // Remove from the list.
    var list_new = new Array();
    for (var i = 0; i < list.length; i++) {
      if (parseInt(list[i]) != parseInt(uid)) {
        list_new.push(list[i]);
      }
    }
    
    custom_variable_set('nyd_pg_list', JSON.stringify(list_new));
    custom_dialog_alert('Thông báo', name + ' đã được đưa ra khỏi Danh sách chọn của bạn.');
    
    // Update the cart.
    _custom_update_favorite_cart();
    
    if (typeof callback == 'function') {
      callback();
    }
  });
}

/**
 * Check to see if a PG is in the list.
 */
function _custom_exist_in_favorite(uid) {
  // Get the list if existing.
  var list = custom_variable_get('nyd_pg_list', 'json');
  if (list == null) {
    list = new Array();
  }
  
  return jQuery.inArray(uid, list) != -1 ? true : false;
}

/**
 * Add an item to favorite list.
 */
function _custom_add_to_favorite(uid, name, callback) {
  if (_custom_exist_in_favorite(uid)) {
    custom_dialog_alert('Thông báo', name + ' đã nằm trong Danh sách chọn rồi. Bạn không cần phải làm lại.');
  }
  else{
    custom_dialog_confirm('Xác nhận', 'Bạn chắc chắn muốn đưa ' + name + ' vào Danh sách chọn của mình?', 400, 'auto', true, function() {
      // Close the box.
      custom_dialog_confirm_close();
    
      // Get the list if existing.
      var list = custom_variable_get('nyd_pg_list', 'json');
      if (list == null) {
        list = new Array();
      }
  
      // Add to the list if not existing.
      list.push(uid);
      custom_variable_set('nyd_pg_list', JSON.stringify(list));
      custom_dialog_alert('Thông báo', name + ' đã được đưa vào Danh sách chọn của bạn.');
      
      // Update the cart number.
      _custom_update_favorite_cart();
      
      // Execute callback function.
      if (typeof callback == 'function') {
        callback();
      }
    });
  }
  
  return false;
}

/**
 * Update the favorite cart items in the display.
 */
function _custom_update_favorite_cart() {
  var list = custom_variable_get('nyd_pg_list', 'json');
  var item_number = list != null ? list.length : 0;
  
  if (item_number > 0) {
    jQuery("span.cart-item-number").html(item_number);
  }
  else{
    jQuery("span.cart-item-number").html('');
  }
}

/**
 * Add to favorite list.
 */
function custom_add_to_favorite(obj) {
  var uid = parseInt(jQuery(obj).attr('uid'));
  var name = jQuery(obj).attr('title');
  if (isNaN(uid)) {return;}
  
  _custom_add_to_favorite(uid, name);
  return false;
}

/**
 * Add then go to contact us page.
 */
function custom_buy_now(obj) {
  var uid = parseInt(jQuery(obj).attr('uid'));
  var name = jQuery(obj).attr('title');
  if (isNaN(uid)) {return;}

  // Add to the list first.
  if (_custom_exist_in_favorite(uid)) {
    document.location.href = '/lien-he-thue-nguoi-yeu';
  }
  else{
    _custom_add_to_favorite(uid, name, function() {
      document.location.href = '/lien-he-thue-nguoi-yeu';
    });
  }
  
  return false;
}

/**
 * Verify mobile in mobile number field.
 */
function giaidieu_user_verify_mobile(obj) {
  var current_mobile = jQuery("input[name='current_mobile']").val().trim();
  var uid = jQuery("input[name='current_uid']").val();
  
  custom_dialog_confirm('Thông báo', 'Vui lòng nhấn "Đồng ý" để bắt đầu xác thực số điện thoại hiện tại của bạn.', 400, 'auto', true, function() {
    // Generate code and waiting for input.
    jQuery(obj).attr('disabled', true);
    var loading_message = _custom_dialog_ajax_loading();
    
    custom_services_request('verify_code_generate', {name: current_mobile}, function(result) {
      jQuery(obj).attr('disabled', false);
      loading_message.dialog('close');
            
      // Error.
      if (result['is_error']) {
        custom_dialog_alert('Thông báo', result['message']);
        return false;
      }
          
      // Display a popup for entering code.
      var message = '<p>Vui lòng kiểm tra tin nhắn SMS số điện thoại <i>' + current_mobile + '</i> để lấy mã xác thực nhập vào hộp dưới đây:</p>';
      message += '<input type="number" name="code" value="" placeholder="Mã xác thực" class="form-control" />';
        
      custom_dialog_confirm('Xác thực số điện thoại', message, 400, 'auto', false, function() {
        // Validate.
        var popup = jQuery("#custom-dialog-confirm");
        var code = popup.find('input[name="code"]').val().trim();
        if (code == '') {
          custom_dialog_alert('Thông báo', 'Vui lòng nhập mã xác thực để tiếp tục.');
          return false;
        }
          
        // Send to server for processing.
        var button = popup.find('button[name="submit"]');
        jQuery(button).attr('disabled', true);
        var loading_message2 = _custom_dialog_ajax_loading();

        custom_services_request('pass_code_verify', {uid: uid, code: code, is_activation: 0}, function(result) {
          jQuery(button).attr('disabled', false);
          loading_message2.dialog('close');

          // Error.
          if (result['is_error']) {
            custom_dialog_alert('Thông báo', result['message']);
            return false;
          }

          // Call to server for update.
          var account_fields = {
            'field_mobile_is_verified': {'value': 1}
          };
              
          jQuery(obj).attr('disabled', true);
          var loading_message3 = _custom_dialog_ajax_loading();
          
          custom_services_request('user_store', {uid: uid, account_fields: account_fields}, function(data) {
            jQuery(obj).attr('disabled', false);
            loading_message3.dialog('close');
      
            if (data['is_error']) {
              custom_dialog_alert('Thông báo', data['message']);
              return false;
            }
                
            // Verify confirmed. Close the popup.
            popup.dialog('close');
            custom_dialog_alert('Thông báo', 'Số điện thoại của bạn đã được xác thực thành công. Xin chân thành cám ơn.');

            // Change email verify hidden field value.
            jQuery("#edit-field-mobile-is-verified input").val('1');

            jQuery("span.verify-status.mobile").html('<i class="fa fa-check-circle verified" aria-hidden="true"></i> <button type="button" class="btn btn-default" onclick="giaidieu_user_change_mobile(this); return false;">Đổi số mới</button>');
            jQuery("#edit-field-mobile-number-und-0-value").attr('readonly', true);
          });
        });
      });
    });
  });
  
  return false;
}

/**
 * Change mobile in mobile number field.
 */
function giaidieu_user_change_mobile(obj) {
  // Check mode.
  var mode_is_lock = jQuery("#edit-field-mobile-number-und-0-value").attr('readonly') ? true : false;
  var current_mobile = jQuery("input[name='current_mobile']").val();
  var uid = jQuery("input[name='current_uid']").val();

  if (!mode_is_lock) {
    // Unlock mode, allow to change new email.
    var mobile = jQuery("#edit-field-mobile-number-und-0-value").val().trim().replace(/\s+/g, '');

    if (mobile == '' || !custom_validate_is_mobile_number(mobile)) {
      custom_dialog_alert('Thông báo', 'Xin vui lòng nhập Số điện thoại hợp lệ của bạn để thực hiện đổi.');
      return false;
    }
    
    if (mobile == current_mobile) {
      custom_dialog_alert('Thông báo', 'Số điện thoại mới của bạn trùng với số hiện đang dùng. Vui lòng kiểm tra.');
      return false;
    }

    var account_fields = {
      'field_mobile_number': {'value': mobile},
      'field_mobile_is_verified': {'value': 0}
    };

    // Call to server for update.
    jQuery(obj).attr('disabled', true);
    var loading_message = _custom_dialog_ajax_loading();
    
    custom_services_request('user_store', {uid: uid, account_fields: account_fields}, function(data) {
      jQuery(obj).attr('disabled', false);
      loading_message.dialog('close');
      
      if (data['is_error']) {
        custom_dialog_alert('Thông báo', data['message']);
        
        // Reset back to old number.
        jQuery("#edit-field-mobile-number-und-0-value").val(current_mobile);
      }
      else {
        // Reload the user mobile.
        jQuery("input[name='current_mobile']").val(data['account']['field_mobile_number']['und'][0]['value']);
        custom_dialog_alert('Thông báo', 'Số điện thoại mới của bạn đã được cập nhật thành công.');
        
        // Lock the field. - unverify no need to lock.
        //jQuery("#edit-field-mobile-number-und-0-value").attr('readonly', true);

        // Change status to unverified.
        jQuery("span.verify-status.mobile").html('<i class="fa fa-times unverified" aria-hidden="true"></i> <button class="btn btn-inline btn-verify" onclick="giaidieu_user_verify_mobile(this); return false;">Xác thực ngay</button> <button type="button" class="btn btn-default" onclick="giaidieu_user_change_mobile(this); return false;">Đổi số mới</button>');
      }
    });
  }
  else{
    custom_dialog_confirm('Xác nhận', 'Vui lòng nhấn "Đồng ý" để thực hiện xác thực yêu cầu đổi số điện thoại của bạn.', 400, 'auto', true, function() {
      // Generate code and waiting for input.
      jQuery(obj).attr('disabled', true);
      var loading_message = _custom_dialog_ajax_loading();
      
      custom_services_request('verify_code_generate', {name: current_mobile}, function(result) {
        jQuery(obj).attr('disabled', false);
        loading_message.dialog('close');
            
        // Error.
        if (result['is_error']) {
          custom_dialog_alert('Thông báo', result['message']);
          return false;
        }
          
        // Display a popup for entering code.
        var message = '<p>Vui lòng kiểm tra tin nhắn SMS số điện thoại <i>' + current_mobile + '</i> để lấy mã xác thực nhập vào hộp dưới đây:</p>';
        message += '<input type="number" name="code" value="" placeholder="Mã xác thực" class="form-control" />';
        
        custom_dialog_confirm('Xác thực số điện thoại', message, 400, 'auto', false, function() {
          // Validate.
          var popup = jQuery("#custom-dialog-confirm");
          var code = popup.find('input[name="code"]').val().trim();
          if (code == '') {
            custom_dialog_alert('Thông báo', 'Vui lòng nhập mã xác thực để tiếp tục.');
            return false;
          }
          
          // Send to server for processing.
          var button = popup.find('button[name="submit"]');
          jQuery(button).attr('disabled', true);
          var loading_message2 = _custom_dialog_ajax_loading();

          custom_services_request('pass_code_verify', {uid: uid, code: code, is_activation: 0}, function(result) {
            jQuery(button).attr('disabled', false);
            loading_message2.dialog('close');

            // Error.
            if (result['is_error']) {
              custom_dialog_alert('Thông báo', result['message']);
              return false;
            }
              
            // Verify confirmed. unlock the email field for changing.
            popup.dialog('close');
            custom_dialog_alert('Thông báo', 'Xác thực đã hoàn thành! Vui lòng nhấn "Đồng ý" để thực hiện đổi số trong hộp "Số di động".');
              
            jQuery("#edit-field-mobile-number-und-0-value").attr('readonly', false);
            jQuery("#edit-field-mobile-number-und-0-value").focus();
          });
        });
      });
    });
  }
  
  return false;
}

/**
 * Process to change email in email field.
 */
function giaidieu_user_change_email(obj) {
  // Check mode.
  var mode_is_lock = jQuery("#edit-mail").attr('readonly') ? true : false;
  var current_email = jQuery("input[name='current_email']").val();
  var uid = jQuery("input[name='current_uid']").val();

  if (!mode_is_lock) {
    // Unlock mode, allow to change new email.
    var email = jQuery("#edit-mail").val().trim();
    email = email.toLowerCase();

    if (email == '' || !custom_validate_is_email(email)) {
      custom_dialog_alert('Thông báo', 'Xin vui lòng nhập Địa chỉ e-mail hợp lệ của bạn để thực hiện đổi.');
      return false;
    }
    
    if (email == current_email) {
      custom_dialog_alert('Thông báo', 'Địa chỉ e-mail mới của bạn trùng với địa chỉ hiện đang dùng. Vui lòng kiểm tra.');
      return false;
    }

    var account_fields = {
      'email': email,
      'field_email_is_verified': {'value': 0}
    };

    // Call to server for update.
    jQuery(obj).attr('disabled', true);
    var loading_message = _custom_dialog_ajax_loading();
    
    custom_services_request('user_store', {uid: uid, account_fields: account_fields}, function(data) {
      jQuery(obj).attr('disabled', false);
      loading_message.dialog('close');
      
      if (data['is_error']) {
        custom_dialog_alert('Thông báo', data['message']);
        jQuery("#edit-mail").val(current_email);
      }
      else {
        // Reload the user profile.
        //console.log(data);
        
        jQuery("input[name='current_email']").val(data['account'].mail);
        custom_dialog_alert('Thông báo', 'Địa chỉ e-mail mới của bạn đã được cập nhật thành công.');
        
        // Lock the field. no locking unverified e-mail address. 
        //jQuery("#edit-mail").attr('readonly', true);
        
        // Change status to unverified.
        jQuery("span.verify-status.email").html('<i class="fa fa-times unverified" aria-hidden="true"></i> <button class="btn btn-inline btn-verify" onclick="giaidieu_user_verify_email(this); return false;">Xác thực ngay</button> <button type="button" class="btn btn-default" onclick="giaidieu_user_change_email(this); return false;">Đổi e-mail</button>');
      }
    });
  }
  else{
    custom_dialog_confirm('Xác nhận', 'Vui lòng nhấn "Đồng ý" để thực hiện xác thực yêu cầu đổi e-mail của bạn.', 400, 'auto', true, function() {
      // Generate code and waiting for input.
      jQuery(obj).attr('disabled', true);
      var loading_message = _custom_dialog_ajax_loading();
      
      custom_services_request('verify_code_generate', {name: current_email}, function(result) {
        jQuery(obj).attr('disabled', false);
        loading_message.dialog('close');

        // Error.
        if (result['is_error']) {
          custom_dialog_alert('Thông báo', result['message']);
          return false;
        }
          
        // Display a popup for entering code.
        var message = '<p>Vui lòng kiểm tra e-mail của bạn địa chỉ <i>' + current_email + '</i> để lấy mã xác thực nhập vào hộp dưới đây:</p>';
        message += '<input type="number" name="code" value="" placeholder="Mã xác thực" class="form-control" />';
        
        custom_dialog_confirm('Xác thực e-mail', message, 400, 'auto', false, function() {
          // Validate
          var popup = jQuery("#custom-dialog-confirm");

          var code = popup.find('input[name="code"]').val().trim();
          if (code == '') {
            custom_dialog_alert('Thông báo', 'Vui lòng nhập mã xác thực để tiếp tục.');
            return false;
          }
          
          // Send to server for processing.
          var button = popup.find('button[name="submit"]');
          jQuery(button).attr('disabled', true);
          var loading_message2 = _custom_dialog_ajax_loading();

          custom_services_request('pass_code_verify', {uid: uid, code: code, is_activation: 0}, function(result) {
            jQuery(button).attr('disabled', false);
            loading_message2.dialog('close');

            // Error.
            if (result['is_error']) {
              popup.find('input[name="code"]').val('');
              custom_dialog_alert('Thông báo', result['message']);
              return false;
            }
              
            // Verify confirmed. unlock the email field for changing.
            custom_dialog_alert('Thông báo', 'Xác thực đã hoàn thành! Vui lòng nhấn "Đồng ý" để thực hiện đổi e-mail trong hộp "Địa chỉ e-mail".');
            popup.dialog('close');
              
            jQuery("#edit-mail").attr('readonly', false);
            jQuery("#edit-mail").focus();
          });
        });
      });
    });
  }
  
  return false;
}

/**
 * Process to verify an email in email field.
 */
function giaidieu_user_verify_email(obj) {
  var current_email = jQuery("input[name='current_email']").val();
  var uid = jQuery("input[name='current_uid']").val();
  
  custom_dialog_confirm('Xác nhận', 'Vui lòng nhấn "Đồng ý" để bắt đầu xác thực địa chỉ e-mail hiện tại của bạn.', 400, 'auto', true, function() {
    // Generate code and waiting for input.
    jQuery(obj).attr('disabled', true);
    var loading_message = _custom_dialog_ajax_loading();
    
    custom_services_request('verify_code_generate', {name: current_email}, function(result) {
      jQuery(obj).attr('disabled', false);
      loading_message.dialog('close');
            
      // Error.
      if (result['is_error']) {
        custom_dialog_alert('Thông báo', result['message']);
        return false;
      }

      // Display a popup for entering code.
      var message = '<p>Vui lòng kiểm tra e-mail của bạn địa chỉ <i>' + current_email + '</i> để lấy mã xác thực nhập vào hộp dưới đây:</p>';
      message += '<input type="number" name="code" value="" placeholder="Mã xác thực" class="form-control" />';
        
      custom_dialog_confirm('Xác thực e-mail', message, 400, 'auto', false, function() {
        // Validate.
        var popup = jQuery("#custom-dialog-confirm");

        var code = popup.find('input[name="code"]').val().trim();
        if (code == '') {
          custom_dialog_alert('Thông báo', 'Vui lòng nhập mã xác thực để tiếp tục.');
          return false;
        }

        // Send to server for processing.
        var button = popup.find('button[name="submit"]');
        jQuery(button).attr('disabled', true);
        var loading_message2 = _custom_dialog_ajax_loading();

        custom_services_request('pass_code_verify', {uid: uid, code: code, is_activation: 0}, function(result) {
          jQuery(button).attr('disabled', false);
          loading_message2.dialog('close');

          // Error.
          if (result['is_error']) {
            popup.find('input[name="code"]').val('');
            custom_dialog_alert('Thông báo', result['message']);
            return false;
          }

          // Call to server for update.
          var account_fields = {
            'field_email_is_verified': {'value': 1}
          };

          jQuery(obj).attr('disabled', true);
          var loading_message3 = _custom_dialog_ajax_loading();
          
          custom_services_request('user_store', {uid: uid, account_fields: account_fields}, function(data) {
            jQuery(obj).attr('disabled', false);
            loading_message3.dialog('close');
      
            if (data['is_error']) {
              custom_dialog_alert('Thông báo', data['message']);
              return false;
            }
                
            // Verify confirmed. Close the popup.
            popup.dialog('close');
            custom_dialog_alert('Thông báo', 'Địa chỉ e-mail của bạn đã được xác thực thành công. Xin chân thành cám ơn.');

            // Change email verify hidden field value.
            jQuery("#edit-field-email-is-verified input").val('1');

            jQuery("span.verify-status.email").html('<i class="fa fa-check-circle verified" aria-hidden="true"></i> <button type="button" class="btn btn-default" onclick="giaidieu_user_change_email(this); return false;">Đổi e-mail</button>');
            jQuery("#edit-mail").attr('readonly', true);
          });
        });
      });
    });
  });
  
  return false;
}

/**
 * Process to validate / submit whole form of appointment.
 */
function custom_appointment_form_submit_callback(obj) {
  // Get all values.
  var customer_name = jQuery("input[name='customer_name']").val().trim();
  var customer_gender = jQuery("input[name='customer_gender']:checked").val();
  var customer_age = parseInt(jQuery("input[name='customer_age']").val().trim().replace(/\s+/g, ''));
  var customer_mobile = jQuery("input[name='customer_mobile']").val().trim().replace(/\s+/g, '');
  var customer_email = jQuery("input[name='customer_email']").val().trim().replace(/\s+/g, '');
  
  var appointment_service = parseInt(jQuery("input[name='appointment_service']:checked").val());
  var appointment_datetime = jQuery("input[name='appointment_datetime']").val().trim();
  var appointment_duration = jQuery("input[name='appointment_duration']").val().trim();
  var appointment_city = jQuery("select[name='appointment_city']").val();
  var appointment_address = jQuery("input[name='appointment_address']").val().trim();
  
  // Get pg list.
  var pg_list = new Array();
  
  var captcha = jQuery("input[name='captcha_response']").length ? jQuery("input[name='captcha_response']").val().trim() : '';
  
  var container = jQuery("#custom-contact-us-form");

  // Validate all.
  if (customer_name == '') {
    _custom_form_set_error(jQuery("input[name='customer_name']"), true, 'Vui lòng nhập tên của bạn để tiện liên hệ.');
    _custom_scroll_to(container, jQuery("input[name='customer_name']"));
    return false;
  }
  else{
    _custom_form_set_error(jQuery("input[name='customer_name']"), false, 'Vui lòng nhập tên của bạn để tiện liên hệ.');
  }
  
  if (customer_gender == undefined) {
    _custom_form_set_error(jQuery("#edit-customer-gender"), true, 'Vui lòng chọn giới tính của bạn.');
    _custom_scroll_to(container, jQuery("#edit-customer-gender"));
    return false;    
  }
  else{
    _custom_form_set_error(jQuery("#edit-customer-gender"), false, '');
  }

  if (isNaN(customer_age) || customer_age < 18 || customer_age > 65) {
    _custom_form_set_error(jQuery("input[name='customer_age']"), true, 'Số tuổi của bạn không phù hợp. Xin vui lòng kiểm tra.');
    _custom_scroll_to(container, jQuery("input[name='customer_age']"));
    return false;
  }
  else{
    _custom_form_set_error(jQuery("input[name='customer_age']"), false, 'Nhập tuổi của bạn để PG/PB tiếp đón phù hợp. Bạn phải từ 18 tuổi trở lên để có thể sử dụng dịch vụ.');
  }

  if (customer_mobile == '' || !custom_validate_is_mobile_number(customer_mobile)) {
    _custom_form_set_error(jQuery("input[name='customer_mobile']"), true, 'Số điện thoại không đúng. Xin vui lòng kiểm tra.');
    _custom_scroll_to(container, jQuery("input[name='customer_mobile']"));
    return false;
  }
  else{
    _custom_form_set_error(jQuery("input[name='customer_mobile']"), false, 'QUAN TRỌNG: Số di động đúng để nhận tin xác thực giao dịch.');
  }

  if (customer_email == '' || !custom_validate_is_email(customer_email)) {
    _custom_form_set_error(jQuery("input[name='customer_email']"), true, 'Địa chỉ e-mail không đúng. Xin vui lòng kiểm tra.');
    _custom_scroll_to(container, jQuery("input[name='customer_email']"));
    return false;
  }
  else{
    _custom_form_set_error(jQuery("input[name='customer_email']"), false, 'QUAN TRỌNG: Địa chỉ e-mail đúng để nhận tin xác thực giao dịch.');
  }

  jQuery("#edit-pgpb-body div.views-row").each(function() {
    var uid = jQuery(this).find('span.list-pg').attr('uid');
    if (uid != undefined && parseInt(uid) > 0) {
      pg_list.push(uid);
    }
  });
  
  if (!pg_list.length) {
    jQuery("#edit-pgpb").addClass('error');
    _custom_scroll_to(container, jQuery("#edit-pgpb"));
    return false;
  }
  else{  
    // Remove PG who not providing the selected service.
    var pg_list_new = new Array();
    for (var i = 0; i < pg_list.length; i++) {
      if (Drupal.settings['pg_services'][pg_list[i]][appointment_service] != undefined) {
        pg_list_new.push(pg_list[i]);
      }
    }
    
    pg_list = pg_list_new;
    
    if (!pg_list.length) {
      //jQuery("#edit-appointment-service").addClass('error');
      _custom_form_set_error(jQuery("#edit-appointment-service"), true, 'Thành viên được bạn chọn hiện không cung cấp dịch vụ <b>' + Drupal.settings['default_pricing'][appointment_service]['name'] + '</b>. Vui lòng chọn dịch vụ hoặc thành viên khác để đặt.');
      _custom_scroll_to(container, jQuery("#edit-appointment-service"));
      return false;
    }
  }
  
  if (pg_list.length > 5) {
    jQuery("#edit-pgpb").addClass('error');
    _custom_scroll_to(container, jQuery("#edit-pgpb"), function() {
      var person_left = pg_list.length - 5;
      custom_dialog_alert('Thông báo', 'Bạn đã chọn quá 5 người để gửi yêu cầu đặt lịch. Vui lòng bỏ bớt ' + person_left + ' người rồi tiếp tục.');
    });

    return false;
  }
  else{
    jQuery("#edit-pgpb").removeClass('error');
  }

  if (appointment_service == undefined || isNaN(appointment_service) || !appointment_service) {
    _custom_form_set_error(jQuery("#edit-appointment-service"), true, 'Vui lòng chọn dịch vụ bạn muốn đặt thuê.');
    _custom_scroll_to(container, jQuery("#edit-appointment-service"));
    return false;
  }
  else{
    _custom_form_set_error(jQuery("#edit-appointment-service"), false, '');
  }

  if (appointment_datetime == '') {
    _custom_form_set_error(jQuery("input[name='appointment_datetime']"), true, 'Vui lòng chọn thời gian bắt đầu thuê dịch vụ.');
    _custom_scroll_to(container, jQuery("input[name='appointment_datetime']"));
    return false;
  }
  else{
    _custom_form_set_error(jQuery("input[name='appointment_datetime']"), false, '');
  }

  if (appointment_duration == '') {
    _custom_form_set_error(jQuery("input[name='appointment_duration']"), true, 'Vui lòng chọn số giờ / ngày thuê dịch vụ.');
    _custom_scroll_to(container, jQuery("input[name='appointment_duration']"));
    return false;
  }
  else{
    appointment_duration = parseInt(appointment_duration);

    // Check for minimum requirement.
    var condition_unit_minimum = 100;
    var unit = {
      'hour': 'giờ',
      'day': 'ngày'
    };
    
    for (var uid in Drupal.settings['pg_services']) {
      if (Drupal.settings['pg_services'][uid][appointment_service] != undefined) {
        var condition_unit = parseInt(Drupal.settings['pg_services'][uid][appointment_service]['condition_unit']);
        if (condition_unit_minimum > condition_unit) {
          condition_unit_minimum = condition_unit;
        }
      }
    }
    
    if (appointment_duration < condition_unit_minimum) {
      _custom_form_set_error(jQuery("input[name='appointment_duration']"), true, 'Vui lòng chọn thời gian tối thiểu là <b>' + condition_unit_minimum + ' ' + unit[Drupal.settings['default_pricing'][appointment_service]['unit']] + '</b> thuê.');
      _custom_scroll_to(container, jQuery("input[name='appointment_duration']"));
      return false;
    }
    
    // Filter to get PG those meet the minimum time.
    var pg_list_new = new Array();
    for (var i = 0; i < pg_list.length; i++) {
      if (Drupal.settings['pg_services'][pg_list[i]][appointment_service] != undefined) {
        var condition_unit = parseInt(Drupal.settings['pg_services'][pg_list[i]][appointment_service]['condition_unit']);

        if (condition_unit <= appointment_duration) {
          pg_list_new.push(pg_list[i]);
        }
      }
    }
    
    pg_list = pg_list_new;

    _custom_form_set_error(jQuery("input[name='appointment_duration']"), false, 'Thời gian thuê dịch vụ tính từ thời điểm bắt đầu.');
  }

  if (appointment_city == '') {
    _custom_form_set_error(jQuery("#edit_appointment_city_chosen"), true, 'Vui lòng chọn Thành phố / Tỉnh thành nơi thuê dịch vụ.');
    _custom_scroll_to(container, jQuery("#edit_appointment_city_chosen"));
    return false;
  }
  else{
    _custom_form_set_error(jQuery("#edit_appointment_city_chosen"), false, '');
  }

  if (appointment_address == '') {
    _custom_form_set_error(jQuery("input[name='appointment_address']"), true, 'Vui lòng chọn địa điểm, nơi hẹn gặp.');
    _custom_scroll_to(container, jQuery("input[name='appointment_address']"));
    return false;
  }
  else{
    _custom_form_set_error(jQuery("input[name='appointment_address']"), false, 'Địa chỉ số nhà, tên đường phố, nơi hẹn gặp.');
  }
  
  if (jQuery("input[name='captcha_response']").length && captcha == '') {
    _custom_form_set_error(jQuery("input[name='captcha_response']"), true, 'Vui lòng nhập mã an ninh để tiếp tục. Ví dụ: cho 1+3, hãy nhập 4.');
    _custom_scroll_to(container, jQuery("input[name='captcha_response']"));
    return false;    
  }
  else{
    _custom_form_set_error(jQuery("input[name='captcha_response']"), false, 'Tính các phép tính đơn giản này và nhập kết quả vào. Ví dụ: cho 1+3, hãy nhập 4.');
  }
  
  // Create values to send to server.
  var params = {
    receivers: pg_list,
    customer_name: customer_name,
    customer_gender: customer_gender,
    customer_age: customer_age,
    customer_mobile: customer_mobile,
    customer_email: customer_email,
    appointment_service: appointment_service,
    appointment_datetime: appointment_datetime,
    appointment_duration: appointment_duration,
    appointment_city: appointment_city,
    appointment_address: appointment_address
  };
  
  //console.log(params);
  //return false;

  // Add disable to avoid duplicated clicks.
  jQuery(obj).attr('disabled', true);  
  var loading_message = _custom_dialog_ajax_loading();
  
  //console.log(params);  
  custom_services_request('appointments_create', {params: params}, function(result) {
    //console.log(result);
    
    jQuery(obj).attr('disabled', false);
    loading_message.dialog('close');
    
    if (result['is_error']) {
      custom_dialog_alert('Thông báo', result['message']);
      return false;
    }
    
    // Go to complete page.
    var nids = new Array();
    for (var i = 0; i < result['appointment_nids'].length; i++) {
      nids.push('nids[' + i + ']=' + result['appointment_nids'][i]);
    }
    
    document.location.href = '/lien-he-thue-nguoi-yeu-da-dang-ky?' + nids.join('&');
  });
  
  return false;
}

/**
 * Helper function to output error message to field.
 */
function _custom_form_set_error(obj, is_error, message) {
  if (!is_error) {
    jQuery(obj).removeClass('error');
    jQuery(obj).closest('.form-item').removeClass('error');
    
    if (jQuery(obj).next().length) {
      jQuery(obj).next().removeClass('error').html(message);
    }
  }
  else{
    jQuery(obj).closest('.form-item').addClass('error');
    jQuery(obj).addClass('error');
    
    if (!jQuery(obj).next().length) {
      jQuery(obj).after('<div class="help-block"></div>');
    }

    jQuery(obj).next().addClass('error').html(message);
  }
}

/**
 * Scroll to an element.
 */
function _custom_scroll_to(container, element, callback) {
  var top = element.offset().top - container.offset().top + container.scrollTop();
  
  if (typeof callback == 'function') {
    jQuery('html,body').animate({scrollTop: top}, function() {
      callback();
    });
  }
  else{
    jQuery('html,body').animate({scrollTop: top});
  }
}

/**
 * Process on the click event for apppointment services.
 */
function custom_trigger_appointment_service_callback(obj) {
  if (jQuery(obj).parent().children('span.desc').hasClass('checked')) {return false;}
  
  // Remove other active class.
  jQuery("#edit-appointment-service span.label.checked").removeClass('checked');
  jQuery("#edit-appointment-service span.desc.checked").removeClass('checked');
  
  // Add active to current.
  jQuery(obj).parent().children('span.label').addClass('checked');
  jQuery(obj).parent().children('span.desc').addClass('checked');

  _custom_form_set_error(jQuery("#edit-appointment-service"), false, '');
  
  // Change unit of time.
  var tid = jQuery(obj).val();
  if (Drupal.settings['default_pricing'] && Drupal.settings['default_pricing'][tid]) {
    if (Drupal.settings['default_pricing'][tid]['unit'] == 'day') {
      jQuery("#edit-appointment-duration").parent().find('label').html('Số ngày <span class="form-required" title="Trường dữ liệu này là bắt buộc.">*</span>');
    }
    else{
      jQuery("#edit-appointment-duration").parent().find('label').html('Số giờ <span class="form-required" title="Trường dữ liệu này là bắt buộc.">*</span>');
    }
  }
  
  // Update unit.
  var unit = {
    'hour': 'giờ',
    'day': 'ngày'
  };

  if (!jQuery("input[name='appointment_duration']").parent().find('#appointment-duration-update').length) {
    jQuery("input[name='appointment_duration']").parent().append('<div id="appointment-duration-update"></div>');
  }
  
  jQuery("#appointment-duration-update").html('');
  
  var condition_unit_minimum = 100;
  for (var uid in Drupal.settings['pg_services']) {
    if (Drupal.settings['pg_services'][uid][tid] != undefined) {
      jQuery("#appointment-duration-update").append('<p class="pg-validate-warning warning" uid="' + uid + '"><b>' + Drupal.settings['pg_services'][uid]['pg_name'] + '</b> yêu cầu tối thiểu ' + Drupal.settings['pg_services'][uid][tid]['condition_unit'] + ' ' + unit[Drupal.settings['pg_services'][uid][tid]['unit']] + ' thuê.</p>');
      
      var condition_unit = parseInt(Drupal.settings['pg_services'][uid][tid]['condition_unit']);
      if (condition_unit_minimum > condition_unit) {
        condition_unit_minimum = condition_unit;
      }
    }
  }
  
  // Update default minimum value for Time field.
  if (condition_unit_minimum != 100) {
    jQuery("input[name='appointment_duration']").val(condition_unit_minimum);
    _custom_form_set_error(jQuery("input[name='appointment_duration']"), false, 'Thời gian thuê dịch vụ tính từ thời điểm bắt đầu.');
  }
  
  // Remove if empty.
  if (!jQuery("#appointment-duration-update").children('p.pg-validate-warning').length) {
    jQuery("#appointment-duration-update").remove();
    
    // Give error message being no PG services.
    custom_dialog_alert('Thông báo', 'Thành viên được bạn chọn hiện không cung cấp dịch vụ <b>' + Drupal.settings['default_pricing'][tid]['name'] + '</b>. Vui lòng chọn dịch vụ hoặc thành viên khác để đặt.');
  }
}

/**
 * Process to validate user city.
 */
function custom_validate_user_city_callback(obj) {
  var city_tid = jQuery(obj).val();
  if (city_tid != '' && city_tid > 0) {
    jQuery("#edit_field_cities_und_chosen").removeClass('error');
    jQuery("#edit_field_cities_und_chosen").closest('.form-item').removeClass('error');
    
    if (jQuery("#edit_field_cities_und_chosen").next().length) {
      jQuery("#edit_field_cities_und_chosen").next().removeClass('error').html('');
    }
    
    return true;
  }
  else{
    jQuery("#edit_field_cities_und_chosen").closest('.form-item').addClass('error');
    jQuery("#edit_field_cities_und_chosen").addClass('error');

    if (!jQuery("#edit_field_cities_und_chosen").next().length) {
      jQuery("#edit_field_cities_und_chosen").after('<div class="help-block"></div>');
    }

    jQuery("#edit_field_cities_und_chosen").next().addClass('error').html('Vui lòng chọn Tỉnh / Thành phố nơi bạn đang cư trú.');
    
    return false;
  }
}

/**
 * Proces to validate birthday field.
 */
function custom_validate_user_birthdate_callback(obj) {
  var current_date = new Date();
  var params = jQuery(obj).val().trim().split(/\//);
  
  if (params[0] == '' || !parseInt(params[0]) || parseInt(params[0]) > 31 || !parseInt(params[1]) || parseInt(params[1]) > 12 || parseInt(params[2]) < current_date.getFullYear() - 60 || parseInt(params[2]) > current_date.getFullYear() - 14) {
    jQuery(obj).closest('.form-item').addClass('error');
    jQuery(obj).addClass('error');

    if (!jQuery(obj).next().length) {
      jQuery(obj).after('<div class="help-block"></div>');
    }

    jQuery(obj).next().addClass('error').html('Vui lòng chọn Ngày sinh của bạn.');
    
    return false;
  }
  else{
    jQuery(obj).removeClass('error');
    jQuery(obj).closest('.form-item').removeClass('error');
    
    if (jQuery(obj).next().length) {
      jQuery(obj).next().removeClass('error').html('E.g., ' + current_date.getDate() + '/' + current_date.getMonth() + '/' + current_date.getFullYear());
    }
    
    return true;
  }
}

/**
 * Validate for user pass field.
 * Only remove the error if validaed, otherwise leave it for Drupal core js.
 */
function custom_validate_user_pass_callback(obj) {
  var pass = jQuery("#edit-pass-pass1").val().trim();
  var pass_confirm = jQuery("#edit-pass-pass2").val().trim();

  if (pass == '' || pass != pass_confirm) {
    /*
    jQuery("#edit-pass-pass1").parent().addClass('has-error');
    jQuery("#edit-pass-pass2").parent().addClass('has-error');
    jQuery("div.form-type-password-confirm > div.help-block").addClass('error').html('Mật khẩu chưa nhập hoặc không trùng với Mật khẩu xác nhận. Vui lòng kiểm tra rồi thử lại.');
    */
  }
  else{
    jQuery("#edit-pass-pass1").parent().removeClass('has-error');
    jQuery("#edit-pass-pass2").parent().removeClass('has-error');
    jQuery("div.form-type-password-confirm > div.help-block").removeClass('error').html('Nhập cùng một mật khẩu cho tài khoản mới vào cả 2 trường.');
  }
}

/**
 * Validate for gender field.
 */
function custom_validate_user_gender_callback(obj) {
  jQuery("#edit-field-gender-und").children().removeClass('has-error');
}

/**
 * Proces to validate height field.
 */
function custom_validate_user_height_callback(obj) {
  var height = parseInt(jQuery(obj).val().trim());
  if (height >= 140 && height <= 250) {
    jQuery(obj).removeClass('error');
    jQuery(obj).closest('.form-item').removeClass('error');
    
    if (jQuery(obj).next().length) {
      jQuery(obj).next().removeClass('error').html('Ghi theo dạng chữ số: Ví dụ: 163 (= 1m63)');
    }
    
    return true;
  }
  else{
    jQuery(obj).closest('.form-item').addClass('error');
    jQuery(obj).addClass('error');

    if (!jQuery(obj).next().length) {
      jQuery(obj).after('<div class="help-block"></div>');
    }

    jQuery(obj).next().addClass('error').html('Vui lòng nhập Chiều cao đúng của bạn. Ví dụ: 1m63 bạn nhập 163');
    
    return false;
  }
}

/**
 * Proces to validate weight field.
 */
function custom_validate_user_weight_callback(obj) {
  var weight = parseInt(jQuery(obj).val().trim());
  if (weight >= 40 && weight <= 150) {
    jQuery(obj).removeClass('error');
    jQuery(obj).closest('.form-item').removeClass('error');
    
    if (jQuery(obj).next().length) {
      jQuery(obj).next().removeClass('error').html('Ghi theo số đã làm tròn theo kg. Ví dụ: 54 (54kg)');
    }
    
    return true;
  }
  else{
    jQuery(obj).closest('.form-item').addClass('error');
    jQuery(obj).addClass('error');

    if (!jQuery(obj).next().length) {
      jQuery(obj).after('<div class="help-block"></div>');
    }

    jQuery(obj).next().addClass('error').html('Vui lòng nhập Cân nặng đúng của bạn. Ví dụ: 54kg bạn nhập 54');
    
    return false;
  }
}

/**
 * Process to validate a full name field.
 */
function custom_validate_user_full_name_callback(obj) {
  var name = jQuery(obj).val().trim();
  if (name != '') {
    jQuery(obj).removeClass('error');
    jQuery(obj).closest('.form-item').removeClass('error');
    
    if (jQuery(obj).next().length) {
      jQuery(obj).next().removeClass('error').html('Tên đầy đủ của bạn, viết hoa chữ cái đầu, ví dụ: Trần Thu Thảo');
    }
    
    return true;
  }
  else{
    jQuery(obj).closest('.form-item').addClass('error');
    jQuery(obj).addClass('error');

    if (!jQuery(obj).next().length) {
      jQuery(obj).after('<div class="help-block"></div>');
    }

    jQuery(obj).next().addClass('error').html('Vui lòng nhập Họ và tên của bạn để tiện liên hệ.');
    
    return false;
  }
}

/**
 * Process to validate a full name field.
 */
function custom_validate_user_agreement_callback(obj) {
  var is_checked = jQuery(obj).prop('checked');
  
  if (is_checked) {
    jQuery("#edit-field-agreement-und").closest('.form-item').removeClass('has-error');
    return true;
  }
  else{
    jQuery("#edit-field-agreement-und").closest('.form-item').addClass('has-error');
    return false;
  }
}

/**
 * Process to validate customer name.
 */
function custom_validate_customer_name_callback(obj) {
  var customer_name = jQuery(obj).val().trim();
  if (customer_name != '') {
    jQuery(obj).removeClass('error');
    jQuery(obj).closest('.form-item').removeClass('error');
    
    if (jQuery(obj).next().length) {
      jQuery(obj).next().removeClass('error').html('Vui lòng nhập tên của bạn để tiện liên hệ.');
    }
    
    if (customer_default == null) {
      customer_default = {};
    }
    
    customer_default['customer_name'] = customer_name;
    custom_variable_set('customer_default', JSON.stringify(customer_default));
  }
  else{
    jQuery(obj).closest('.form-item').addClass('error');
    jQuery(obj).addClass('error');

    if (!jQuery(obj).next().length) {
      jQuery(obj).after('<div class="help-block"></div>');
    }

    jQuery(obj).next().addClass('error').html('Vui lòng nhập tên của bạn để tiện liên hệ.');
  }
}

/**
 * Process to validate customer gender.
 */
function custom_validate_customer_gender_callback(obj) {
  if (customer_default == null) {
    customer_default = {};
  }
    
  customer_default['customer_gender'] = jQuery(obj).val();
  custom_variable_set('customer_default', JSON.stringify(customer_default));

  _custom_form_set_error(jQuery("#edit-customer-gender"), false, '');
}

/**
 * Process to validate appointment datetime.
 */
function custom_validate_appointment_datetime_callback(obj) {
  var appointment_datetime = jQuery(obj).val().trim();
  if (appointment_datetime != '') {
    jQuery(obj).removeClass('error');
    jQuery(obj).closest('.form-item').removeClass('error');
    
    if (jQuery(obj).next().length) {
      jQuery(obj).next().removeClass('error').html('');
    }
  }
  else{
    jQuery(obj).closest('.form-item').addClass('error');
    jQuery(obj).addClass('error');

    if (!jQuery(obj).next().length) {
      jQuery(obj).after('<div class="help-block"></div>');
    }

    jQuery(obj).next().addClass('error').html('Vui lòng chọn thời gian bắt đầu thuê dịch vụ.');
  } 
}

/**
 * Process to validate appointment duration.
 */
function custom_validate_appointment_duration_callback(obj) {
  var appointment_duration = parseInt(jQuery(obj).val().trim());

  if (!isNaN(appointment_duration) && appointment_duration > 0) {
    // Check for minimum requirement.
    var tid = jQuery("input[name='appointment_service']:checked").val();
    var condition_unit_minimum = 24; // 24h.
    var unit = {
      'hour': 'giờ',
      'day': 'ngày'
    };
    
    for (var uid in Drupal.settings['pg_services']) {
      if (Drupal.settings['pg_services'][uid][tid] != undefined) {
        var condition_unit = parseInt(Drupal.settings['pg_services'][uid][tid]['condition_unit']);
        if (condition_unit_minimum > condition_unit) {
          condition_unit_minimum = condition_unit;
        }
      }
    }
    
    if (appointment_duration < condition_unit_minimum) {
      jQuery(obj).closest('.form-item').addClass('error');
      jQuery(obj).addClass('error');

      if (!jQuery(obj).next().length) {
        jQuery(obj).after('<div class="help-block"></div>');
      }

      jQuery(obj).next().addClass('error').html('Vui lòng chọn thời gian tối thiểu là <b>' + condition_unit_minimum + ' ' + unit[Drupal.settings['default_pricing'][tid]['unit']] + '</b> thuê.');      
    }
    else{
      jQuery(obj).removeClass('error');
      jQuery(obj).closest('.form-item').removeClass('error');
    
      if (jQuery(obj).next().length) {
        jQuery(obj).next().removeClass('error').html('Thời gian thuê dịch vụ tính từ thời điểm bắt đầu.');
      }
    
      jQuery(obj).val(appointment_duration);      
    }
  }
  else{
    jQuery(obj).closest('.form-item').addClass('error');
    jQuery(obj).addClass('error');

    if (!jQuery(obj).next().length) {
      jQuery(obj).after('<div class="help-block"></div>');
    }

    jQuery(obj).next().addClass('error').html('Vui lòng chọn số giờ / ngày thuê dịch vụ.');
  } 
}

/**
 * Process to validate appointment city.
 */
function custom_validate_appointment_city_callback(obj) {
  var appointment_city = jQuery(obj).val();
  if (appointment_city != '' && appointment_city > 0) {
    jQuery("#edit_appointment_city_chosen").removeClass('error');
    jQuery("#edit_appointment_city_chosen").closest('.form-item').removeClass('error');
    
    if (jQuery("#edit_appointment_city_chosen").next().length) {
      jQuery("#edit_appointment_city_chosen").next().removeClass('error').html('');
    }
  }
  else{
    jQuery("#edit_appointment_city_chosen").closest('.form-item').addClass('error');
    jQuery("#edit_appointment_city_chosen").addClass('error');

    if (!jQuery("#edit_appointment_city_chosen").next().length) {
      jQuery("#edit_appointment_city_chosen").after('<div class="help-block"></div>');
    }

    jQuery("#edit_appointment_city_chosen").next().addClass('error').html('Vui lòng chọn Thành phố / Tỉnh thành nơi thuê dịch vụ.');
  }
}

/**
 * Process to validate appointment address.
 */
function custom_validate_appointment_address_callback(obj) {
  var appointment_address = jQuery(obj).val().trim();
  if (appointment_address != '') {
    jQuery(obj).removeClass('error');
    jQuery(obj).closest('.form-item').removeClass('error');
    
    if (jQuery(obj).next().length) {
      jQuery(obj).next().removeClass('error').html('Địa chỉ số nhà, tên đường phố, nơi hẹn gặp.');
    }
    
    jQuery(obj).val(appointment_address);
  }
  else{
    jQuery(obj).closest('.form-item').addClass('error');
    jQuery(obj).addClass('error');

    if (!jQuery(obj).next().length) {
      jQuery(obj).after('<div class="help-block"></div>');
    }

    jQuery(obj).next().addClass('error').html('Vui lòng chọn địa điểm, nơi hẹn gặp.');
  }
}

/**
 * Process to validate age.
 */
function custom_validate_customer_age_callback(obj) {
  var age = parseInt(jQuery(obj).val().trim().replace(/\s+/g, ''));
  if (age >= 18 && age <= 65) {
    jQuery(obj).removeClass('error');
    jQuery(obj).closest('.form-item').removeClass('error');
    jQuery(obj).next().removeClass('error').html('Nhập tuổi của bạn để PG/PB tiếp đón phù hợp. Bạn phải từ 18 tuổi trở lên để có thể sử dụng dịch vụ.');
    
    jQuery(obj).val(age);

    if (customer_default == null) {
      customer_default = {};
    }
    
    customer_default['customer_age'] = age;
    custom_variable_set('customer_default', JSON.stringify(customer_default));
  }
  else{
    jQuery(obj).closest('.form-item').addClass('error');
    jQuery(obj).addClass('error');
    jQuery(obj).next().addClass('error').html('Số tuổi của bạn không phù hợp. Xin vui lòng kiểm tra.');
  }
}

/**
 * Process to validate email.
 */
function custom_validate_is_email_callback(obj) {
  var email = jQuery(obj).val().trim().replace(/\s+/g, '');
  if (custom_validate_is_email(email)) {
    jQuery(obj).removeClass('error');
    jQuery(obj).closest('.form-item').removeClass('error');
    jQuery(obj).next().removeClass('error').html('QUAN TRỌNG: Địa chỉ e-mail đúng để nhận tin xác thực giao dịch.');
    
    jQuery(obj).val(email);

    if (customer_default == null) {
      customer_default = {};
    }
    
    customer_default['customer_email'] = email;
    custom_variable_set('customer_default', JSON.stringify(customer_default));

    return true;
  }
  else{
    jQuery(obj).closest('.form-item').addClass('error');
    jQuery(obj).addClass('error');
    jQuery(obj).next().addClass('error').html('Địa chỉ e-mail không đúng. Xin vui lòng kiểm tra.');
    
    return false;
  }
}

/**
 * Process to validate mobile number.
 */
function custom_validate_is_mobile_number_callback(obj) {
  var number = jQuery(obj).val().trim().replace(/\s+/g, '');
  if (custom_validate_is_mobile_number(number)) {
    jQuery(obj).removeClass('error');
    jQuery(obj).closest('.form-item').removeClass('error');
    jQuery(obj).next().removeClass('error').html('QUAN TRỌNG: Số di động đúng để nhận tin xác thực giao dịch.');
    
    jQuery(obj).val(number);

    if (customer_default == null) {
      customer_default = {};
    }
    
    customer_default['customer_mobile'] = number;
    custom_variable_set('customer_default', JSON.stringify(customer_default));

    return true;
  }
  else{
    jQuery(obj).closest('.form-item').addClass('error');
    jQuery(obj).addClass('error');
    jQuery(obj).next().addClass('error').html('Số điện thoại không đúng. Xin vui lòng kiểm tra.');
    
    return false;
  }
}

/**
 * Switch state of service on popup.
 */
function giaidieu_service_price_status(state) {
  if (state == 1) {
    jQuery("#custom-service-price-form-wrapper #service-status").removeClass('service-status-disabled');
    jQuery("#custom-service-price-form-wrapper #service-status").addClass('service-status-enabled');
  }
  else{
    jQuery("#custom-service-price-form-wrapper #service-status").removeClass('service-status-enabled');
    jQuery("#custom-service-price-form-wrapper #service-status").addClass('service-status-disabled');
  }
}

/**
 * Wrapper function to load an ajax message.
 */
function _custom_dialog_ajax_loading() {
  return custom_dialog_ajax_loading('Đang xử lý...', 'Xin vui lòng chờ trong giây lát!');
}

/**
 * Show a popup for PG to setup custom pricing.
 */
function giaidieu_pg_set_custom_pricing(obj) {
  if (jQuery(obj).hasClass('disabled')) {return false;}
  
  var nid = parseInt(jQuery(obj).attr('nid'));
  var tid = parseInt(jQuery(obj).attr('tid'));
  if (isNaN(nid) || !nid || isNaN(tid) || !tid) {
    alert('Không tìm thấy dữ liệu. Vui lòng tải lại trang rồi thử lại.');
    return false;
  }
  
  // Get the form.
  jQuery(obj).addClass('disabled');
  var loading_message = _custom_dialog_ajax_loading();
  
  custom_services_request('custom_service_price_form', {nid: nid}, function(result) {
    jQuery(obj).removeClass('disabled');
    loading_message.dialog('close');
    
    if (result['is_error']) {
      alert(result['message']);
      return false;
    }

    // Show popup.
    custom_dialog_confirm('Điều chỉnh thông tin dịch vụ', result['form'], 600, 'auto', true, function() {
      // Collect value for updating.
      var status = jQuery("#custom-service-price-form-wrapper input[name='status']:checked").val();
      var unit = jQuery("#custom-service-price-form-wrapper select[name='unit']").val();
      var condition_unit = jQuery("#custom-service-price-form-wrapper select[name='condition_unit']").val();
      var condition_time = jQuery("#custom-service-price-form-wrapper select[name='condition_time']").val();
      
      var service_price = parseInt(jQuery("#custom-service-price-form-wrapper input[name='service_price']").val().trim().replace(/\,/g, ''));
      var add_on_1 = parseInt(jQuery("#custom-service-price-form-wrapper input[name='add_on_1']").val().trim().replace(/\,/g, ''));
      var add_on_2 = parseInt(jQuery("#custom-service-price-form-wrapper input[name='add_on_2']").val().trim().replace(/\,/g, ''));
      var add_on_3 = parseInt(jQuery("#custom-service-price-form-wrapper input[name='add_on_3']").val().trim().replace(/\,/g, ''));
      var add_on_4 = parseInt(jQuery("#custom-service-price-form-wrapper input[name='add_on_4']").val().trim().replace(/\,/g, ''));
      
      if (isNaN(service_price) || service_price < Drupal.settings['default_pricing'][tid]['price']) {
        jQuery("#custom-service-price-form-wrapper input[name='service_price']").addClass('error');
        custom_dialog_alert('Thông báo', 'Vui lòng nhập mức Phí dịch vụ hợp lệ và không thấp hơn mức sàn quy định là ' + custom_thousand_format(Drupal.settings['default_pricing'][tid]['price']) + 'đ');
        return false;
      }
      else{
        jQuery("#custom-service-price-form-wrapper input[name='service_price']").removeClass('error');
      }

      if (isNaN(add_on_1) || add_on_1 < Drupal.settings['default_pricing'][tid]['price_add_on_1']) {
        jQuery("#custom-service-price-form-wrapper input[name='add_on_1']").addClass('error');
        custom_dialog_alert('Thông báo', 'Vui lòng nhập mức Phí cộng thêm hợp lệ và không thấp hơn mức sàn quy định là ' + custom_thousand_format(Drupal.settings['default_pricing'][tid]['price_add_on_1']) + 'đ');
        return false;
      }
      else{
        jQuery("#custom-service-price-form-wrapper input[name='add_on_1']").removeClass('error');
      }

      if (isNaN(add_on_2) || add_on_2 < Drupal.settings['default_pricing'][tid]['price_add_on_2']) {
        jQuery("#custom-service-price-form-wrapper input[name='add_on_2']").addClass('error');
        custom_dialog_alert('Thông báo', 'Vui lòng nhập mức Phí cộng thêm hợp lệ và không thấp hơn mức sàn quy định là ' + custom_thousand_format(Drupal.settings['default_pricing'][tid]['price_add_on_2']) + 'đ');
        return false;
      }
      else{
        jQuery("#custom-service-price-form-wrapper input[name='add_on_2']").removeClass('error');
      }

      if (isNaN(add_on_3) || add_on_3 < Drupal.settings['default_pricing'][tid]['price_add_on_3']) {
        jQuery("#custom-service-price-form-wrapper input[name='add_on_3']").addClass('error');
        custom_dialog_alert('Thông báo', 'Vui lòng nhập mức Phí cộng thêm hợp lệ và không thấp hơn mức sàn quy định là ' + custom_thousand_format(Drupal.settings['default_pricing'][tid]['price_add_on_3']) + 'đ');
        return false;
      }
      else{
        jQuery("#custom-service-price-form-wrapper input[name='add_on_3']").removeClass('error');
      }

      if (isNaN(add_on_4) || add_on_4 < Drupal.settings['default_pricing'][tid]['price_add_on_4']) {
        jQuery("#custom-service-price-form-wrapper input[name='add_on_4']").addClass('error');
        custom_dialog_alert('Thông báo', 'Vui lòng nhập mức Phí đặc biệt hợp lệ và không thấp hơn mức sàn quy định là ' + custom_thousand_format(Drupal.settings['default_pricing'][tid]['price_add_on_4']) + '%');
        return false;
      }
      else{
        jQuery("#custom-service-price-form-wrapper input[name='add_on_4']").removeClass('error');
      }
      
      // Check if changed?
      var is_changed = false;
      if (status != Drupal.settings['pg_pricing'][tid]['status'] || unit != Drupal.settings['pg_pricing'][tid]['unit'] || condition_unit != Drupal.settings['pg_pricing'][tid]['condition_unit'] || condition_time != Drupal.settings['pg_pricing'][tid]['condition_time'] || service_price != Drupal.settings['pg_pricing'][tid]['price'] || add_on_1 != Drupal.settings['pg_pricing'][tid]['price_add_on_1'] || add_on_2 != Drupal.settings['pg_pricing'][tid]['price_add_on_2'] || add_on_3 != Drupal.settings['pg_pricing'][tid]['price_add_on_3'] || add_on_4 != Drupal.settings['pg_pricing'][tid]['price_add_on_4']) {
        is_changed = true;
      }
      
      // Update to PG service pricing.
      if (is_changed) {
        var params = {
          nid: nid,
          node_fields: {
            'status': status,
            'field_unit': {'value': unit},
            'field_condition_unit': {'value': condition_unit},
            'field_condition_time': {'value': condition_time},
            'field_service_price': {'value': service_price},
            'field_price_add_on_1': {'value': add_on_1},
            'field_price_add_on_2': {'value': add_on_2},
            'field_price_add_on_3': {'value': add_on_3},
            'field_price_add_on_4': {'value': add_on_4}
          }
        };
        
        var loading_message = _custom_dialog_ajax_loading();
        custom_services_request('node_store', params, function(result) {
          loading_message.dialog('close');
          
          if (result['is_error']) {
            custom_dialog_alert('Thông báo', result['message']);
            return false;
          }
          
          jQuery("#custom-dialog-confirm").dialog("close");
          
          // Page reload. 
          custom_dialog_confirm('Thông báo', 'Thông tin dịch vụ đã được cập nhật thành công!<br />Vui lòng nhấn "Đồng ý" để tải lại trang.', 'auto', 'auto', false, function() {
            document.location.reload();
          });
        });
      }
      else{
        // Close the popup.
        jQuery("#custom-dialog-confirm").dialog("close");
      }
    });
  });
  
  return false;
}

/**
 * Reset the pricing back to default setting.
 */
function giaidieu_pg_set_default_pricing(obj) {
  var nid = parseInt(jQuery(obj).attr('nid'));
  if (isNaN(nid) || !nid) {
    alert('Không tìm thấy dữ liệu. Vui lòng tải lại trang rồi thử lại.');
    return false;
  }

  custom_dialog_confirm('Thiết lập mặc định thông tin dịch vụ', 'Bạn chắc chắn muốn chuyển về thiết lập mặc định cho dịch vụ này?<br />Lưu ý: Thao tác này không thể đảo ngược!', 600, 'auto', true, function() {
    jQuery("#custom-dialog-confirm").dialog("close");

    var loading_message = _custom_dialog_ajax_loading();
    custom_services_request('custom_service_price_reset', {nid: nid}, function(result) {
      loading_message.dialog('close');

      if (result['is_error']) {
        alert(result['message']);
        return false;
      }
          
      jQuery("#custom-dialog-confirm").dialog("close");
          
      // Page reload. 
      custom_dialog_confirm('Thông báo', 'Thông tin dịch vụ đã được chuyển về thiết lập mặc định thành công!<br />Nhấn "Đồng ý" để tải lại trang.', 'auto', 'auto', false, function() {
        document.location.reload();
      });
    });
  });
  
  return false;
}

/**
 * Profile step 1 validation.
 */
function giaidieu_user_profile_section_step_1_validate() {
  var email = jQuery("#edit-mail").val().trim();
  var pass = jQuery("#edit-pass-pass1").val().trim();
  var pass_confirm = jQuery("#edit-pass-pass2").val().trim();

  // Validate for Step 1.
  var is_step_1_validated = true;

  if (!custom_validate_is_email_callback(jQuery("#edit-mail"))) {
    is_step_1_validated = false;
  }

  if (jQuery("#user-profile-form").length) {
    // In edit mode.
    if (pass != '') {
      if (pass != pass_confirm) {
        jQuery("#edit-pass-pass1").parent().addClass('has-error');
        jQuery("#edit-pass-pass2").parent().addClass('has-error');
        jQuery("div.form-type-password-confirm > div.help-block").addClass('error').html('Mật khẩu mới không trùng với Mật khẩu xác nhận. Vui lòng kiểm tra rồi thử lại.');
        is_step_1_validated = false;
      }
      else if (jQuery("#edit-current-pass").val().trim() == '') {
        jQuery("#edit-current-pass").parent().addClass('has-error');
        jQuery("div.form-type-password-confirm > div.help-block").addClass('error').html('Bạn chưa nhập Mật khẩu hiện tại để đổi Mật khẩu mới. Vui lòng kiểm tra rồi thử lại.');
        is_step_1_validated = false;
      }
      else{
        jQuery("#edit-pass-pass1").parent().removeClass('has-error');
        jQuery("#edit-pass-pass2").parent().removeClass('has-error');
        jQuery("#edit-current-pass").parent().removeClass('has-error');
        jQuery("div.form-type-password-confirm > div.help-block").removeClass('error').html('Để đổi mật khẩu hiện tại, vui lòng nhập mật khẩu mới vào.');        
      }
    }
    else{
      // Reset.
      jQuery("#edit-pass-pass1").val('');
      jQuery("#edit-pass-pass2").val('');
      jQuery("#edit-current-pass").val('');
      
      jQuery("#edit-pass-pass1").parent().removeClass('has-error');
      jQuery("#edit-pass-pass2").parent().removeClass('has-error');
      jQuery("#edit-current-pass").parent().removeClass('has-error');
      jQuery("div.form-type-password-confirm > div.help-block").removeClass('error').html('Để đổi mật khẩu hiện tại, vui lòng nhập mật khẩu mới vào.');        
    }
  }
  else{
    // In register mode.
    if (pass == '' || pass != pass_confirm) {
      jQuery("#edit-pass-pass1").parent().addClass('has-error');
      jQuery("#edit-pass-pass2").parent().addClass('has-error');
      jQuery("div.form-type-password-confirm > div.help-block").addClass('error').html('Mật khẩu chưa nhập hoặc không trùng với Mật khẩu xác nhận. Vui lòng kiểm tra rồi thử lại.');
    
      is_step_1_validated = false;
    }
    else{
      jQuery("#edit-pass-pass1").parent().removeClass('has-error');
      jQuery("#edit-pass-pass2").parent().removeClass('has-error');
      jQuery("div.form-type-password-confirm > div.help-block").removeClass('error').html('Nhập cùng một mật khẩu cho tài khoản mới vào cả 2 trường.');
    }
  }
  
  if (!is_step_1_validated) {
    giaidieu_user_profile_section('group-account', true);
    custom_dialog_alert('Thông báo', 'Bạn chưa hoàn thành nhập thông tin cho mục "TÀI KHOẢN". Xin vui lòng kiểm tra những trường có màu đỏ rồi thử lại.');
    return false;
  }
  
  return true;
}

/**
 * Profile step 2 validation.
 */
function giaidieu_user_profile_section_step_2_validate() {
  // Validate for Step 2.
  var nyd_role = Drupal.settings['nyd_role'];
  var gender = jQuery("#edit-field-gender-und input[type='radio']:checked").attr('value');
  var is_step_2_validated = true;
  
  if (!custom_validate_user_full_name_callback(jQuery("#edit-field-full-name-und-0-value"))) {
    is_step_2_validated = false;
  }
      
  if (gender != 0 && gender != 1) {
    jQuery("#edit-field-gender-und input[type='radio']").closest('.form-item').addClass('has-error');
    is_step_2_validated = false;
  }
  else{
    jQuery("#edit-field-gender-und input[type='radio']").closest('.form-item').removeClass('has-error');
  }
  
  //console.log(nyd_role);
  
  if (nyd_role == 'pg') {
    if (!custom_validate_user_birthdate_callback(jQuery("#edit-field-birthdate-und-0-value-datepicker-popup-0"))) {
      is_step_2_validated = false;
    }

    if (!custom_validate_user_height_callback(jQuery("#edit-field-height-und-0-value"))) {
      is_step_2_validated = false;
    }

    if (!custom_validate_user_weight_callback(jQuery("#edit-field-weight-und-0-value"))) {
      is_step_2_validated = false;
    }
  }
  
  if (!is_step_2_validated) {
    giaidieu_user_profile_section('group-basic', true);
    custom_dialog_alert('Thông báo', 'Bạn chưa hoàn thành nhập thông tin cho mục "CÁ NHÂN". Xin vui lòng kiểm tra những trường có màu đỏ rồi thử lại.');
    return false;
  }
  
  return true;
}

/**
 * Profile step 3 validation.
 */
function giaidieu_user_profile_section_step_3_validate() {
  var nyd_role = Drupal.settings['nyd_role'];
  if (nyd_role != 'pg') {return true;}
  
  if (jQuery("input[name='photo_avatar']").val().trim() == '') {
    jQuery("#photo-avatar").addClass('has-error');
    giaidieu_user_profile_section('group-photos', true);
    
    custom_dialog_alert('Thông báo', 'Bạn chưa hoàn thành nhập thông tin cho mục "HÌNH ẢNH". Vui lòng tải lên hoặc chọn từ Facebook của bạn ít nhất một ảnh để làm hình đại diện.');
    return false;
  }
  else{
    jQuery("#photo-avatar").removeClass('has-error');
  }
  
  return true;
}

/**
 * Profile step 4 validation.
 */
function giaidieu_user_profile_section_step_4_validate() {
  var is_step_4_validated = true;
  if (!custom_validate_user_city_callback(jQuery("#edit-field-cities-und"))) {
    is_step_4_validated = false;
  }
  
  if (!custom_validate_is_mobile_number_callback(jQuery("#edit-field-mobile-number-und-0-value"))) {
    is_step_4_validated = false;
  }
  
  if (!is_step_4_validated) {
    giaidieu_user_profile_section('group-contact', true);
    custom_dialog_alert('Thông báo', 'Bạn chưa hoàn thành nhập thông tin cho mục "LIÊN LẠC". Xin vui lòng kiểm tra những trường có màu đỏ rồi thử lại.');
    return false;
  }
  
  return true;
}

/**
 * Profile step 4 validation.
 */
function giaidieu_user_profile_section_step_5_validate() {
  if (!custom_validate_user_agreement_callback(jQuery("#edit-field-agreement-und"))) {
    giaidieu_user_profile_section('group-other', true);
    custom_dialog_alert('Thông báo', 'Bạn chưa hoàn thành nhập thông tin cho mục "THÔNG TIN KHÁC". Xin vui lòng kiểm tra những trường có màu đỏ rồi thử lại.');
    return false;
  }
  
  return true;
}

/**
 * Handle the user profile submit section.
 */
function giaidieu_user_profile_section_submit(obj) {
  // Return if disabled.
  if (jQuery(obj).hasClass('disabled')) {
    return false;
  }
  
  // Do a full validation here - all steps.

  // Validate for Step 1.
  if (!giaidieu_user_profile_section_step_1_validate()) {return false;}
  
  // Validate for Step 2.
  if (!giaidieu_user_profile_section_step_2_validate()) {return false;}

  // Validate for Step 3.
  if (!giaidieu_user_profile_section_step_3_validate()) {return false;}

  // Validate for Step 4.
  if (!giaidieu_user_profile_section_step_4_validate()) {return false;}
  
  // Validate for Step 5.
  if (!giaidieu_user_profile_section_step_5_validate()) {return false;}
  
  // Step 6 - Check for email and mobile existance - Async check.
  var email = jQuery("#edit-mail").val();
  var mobile = jQuery("#edit-field-mobile-number-und-0-value").val();

  if (jQuery("#user-register-form").length) {
    jQuery(obj).addClass('disabled');
    var loading_message = _custom_dialog_ajax_loading();
  
    custom_services_request('account_exists', {email: email, mobile: mobile}, function(result) {
      jQuery(obj).removeClass('disabled');
      loading_message.dialog('close');
    
      if (result['is_error']) {
        // Open the section.
        if (result['type'] == 'email') {
          jQuery("#edit-mail").closest('.form-item').addClass('error');
          jQuery("#edit-mail").addClass('error');
          jQuery("#edit-mail").next().addClass('error').html(result['message']);

          giaidieu_user_profile_section('group-account', true);
        }
        else if (result['type'] == 'mobile') {
          jQuery("#edit-field-mobile-number-und-0-value").closest('.form-item').addClass('error');
          jQuery("#edit-field-mobile-number-und-0-value").addClass('error');
          jQuery("#edit-field-mobile-number-und-0-value").next().addClass('error').html(result['message']);

          giaidieu_user_profile_section('group-contact', true);
        }
      
        // Display error.
        custom_dialog_alert('Thông báo', result['message']);
        return false;
      }
    
      // Submit the form.
      jQuery("#block-system-main form").submit();
    });
  }
  else{
    // Validate email and mobile if changed.
    var current_email = jQuery('input[name="current_email"]').val();
    var current_mobile = jQuery('input[name="current_mobile"]').val();
    
    if (email != current_email) {
      var loading_message = _custom_dialog_ajax_loading();
      custom_services_request('email_exists', {email: email}, function(result) {
        loading_message.dialog('close');
        
        if (result['is_error']) {
          custom_dialog_alert('Thông báo', result['message']);
        }
        else{
          // Check for mobile after email.
          if (mobile != current_mobile) {
            var loading_message2 = _custom_dialog_ajax_loading();
            custom_services_request('mobile_exists', {mobile: mobile}, function(result) {
              loading_message2.dialog('close');
              
              if (result['is_error']) {
                custom_dialog_alert('Thông báo', result['message']);
              }
              else{
                // Submit the form.
                jQuery("#block-system-main form").submit();
              }
            });
          }
          else{
            jQuery("#block-system-main form").submit();
          }
        }
      });
    }
    else if (mobile != current_mobile) {
      var loading_message = _custom_dialog_ajax_loading();
      custom_services_request('mobile_exists', {mobile: mobile}, function(result) {
        loading_message.dialog('close');
              
        if (result['is_error']) {
          custom_dialog_alert('Thông báo', result['message']);
        }
        else{
          // Submit the form.
          jQuery("#block-system-main form").submit();
        }
      });
    }
    else{
      // Submit the form.
      jQuery("#block-system-main form").submit();
    }
  }
}

/**
 * Handle the user profile next section.
 */
function giaidieu_user_profile_section_next(obj) {
  // Return if disabled.
  if (jQuery(obj).hasClass('disabled')) {
    return false;
  }
  
  // Get section id.
  var next_section = jQuery("#user-profile-tabs li.active").next();
  if (next_section == undefined) {return false;}
  
  if (giaidieu_user_profile_section(next_section.attr('rel'))) {
    // Enable prev button.
    jQuery("#link-button-prev").removeClass('disabled');
  }
}

/**
 * Handle the user profile prev section.
 */
function giaidieu_user_profile_section_prev(obj) {
  // Return if disabled.
  if (jQuery(obj).hasClass('disabled')) {
    return false;
  }

  // Get section id.
  var prev_section = jQuery("#user-profile-tabs li.active").prev();
  if (prev_section == undefined) {return false;}
  
  if (giaidieu_user_profile_section(prev_section.attr('rel'))) {
    // Enable next button.
    jQuery("#link-button-next").removeClass('disabled');
  }
}

/**
 * Handle the collapsible on user profile form.
 */
function giaidieu_user_profile_section(section_id, is_validated) {
  if (jQuery("#user-profile-tabs li[rel='" + section_id + "']").hasClass('active')) {
    return false;
  }
  
  if (is_validated == undefined) {
    is_validated = false;
  }
  
  // When moving between steps, validate all the field.
  // Get the current step.
  if (!is_validated) {
    var current_step = parseInt(jQuery("#user-profile-tabs li.active span.step-number").html());
    switch (current_step) {
      case 1:
        if (!giaidieu_user_profile_section_step_1_validate()) {return false;}
        break;

      case 2:
        if (!giaidieu_user_profile_section_step_2_validate()) {return false;}
        break;

      case 3:
        if (!giaidieu_user_profile_section_step_3_validate()) {return false;}
        break;

      case 4:
        if (!giaidieu_user_profile_section_step_4_validate()) {return false;}
        break;

      case 5:
        if (!giaidieu_user_profile_section_step_5_validate()) {return false;}
        break;
    }
  }
  
  // Hide current active.
  if (jQuery("#user-register-form").length) {
    jQuery("#user-register-form fieldset.panel").removeClass('active');
  }
  else if (jQuery("#user-profile-form").length) {
    jQuery("#user-profile-form fieldset.panel").removeClass('active');
  }
  
  jQuery("#user-profile-tabs li").removeClass('active');
  
  // Display new active.
  if (jQuery("#user-register-form").length) {
    jQuery("#user-register-form fieldset#" + section_id).addClass('active');
  }
  else if (jQuery("#user-profile-form").length) {
    jQuery("#user-profile-form fieldset#" + section_id).addClass('active');
  }

  jQuery("#user-profile-tabs li[rel='" + section_id + "']").addClass('active');
  
  // Disable / enable prev / next link.
  if (section_id == 'group-account') {
    jQuery("#link-button-prev").addClass('disabled');
    jQuery("#link-button-next").removeClass('disabled');
  }
  else if (section_id == 'group-other') {
    jQuery("#link-button-prev").removeClass('disabled');
    jQuery("#link-button-next").addClass('disabled');
  }
  else{
    jQuery("#link-button-prev").removeClass('disabled');
    jQuery("#link-button-next").removeClass('disabled');
  }
  
  return false;
};
