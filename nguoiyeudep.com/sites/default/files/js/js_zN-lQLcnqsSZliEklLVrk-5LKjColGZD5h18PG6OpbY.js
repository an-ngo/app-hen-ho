(function ($) {

/**
 * Attach handlers to evaluate the strength of any password fields and to check
 * that its confirmation is correct.
 */
Drupal.behaviors.password = {
  attach: function (context, settings) {
    var translate = settings.password;
    $('input.password-field', context).once('password', function () {
      var passwordInput = $(this);
      var innerWrapper = $(this).parent();
      var outerWrapper = $(this).parent().parent();

      // Add identifying class to password element parent.
      innerWrapper.addClass('password-parent');

      // Add the password confirmation layer.
      $('input.password-confirm', outerWrapper).parent().prepend('<div class="password-confirm">' + translate['confirmTitle'] + ' <span></span></div>').addClass('confirm-parent');
      var confirmInput = $('input.password-confirm', outerWrapper);
      var confirmResult = $('div.password-confirm', outerWrapper);
      var confirmChild = $('span', confirmResult);

      // Add the description box.
      var passwordMeter = '<div class="password-strength"><div class="password-strength-text" aria-live="assertive"></div><div class="password-strength-title">' + translate['strengthTitle'] + '</div><div class="password-indicator"><div class="indicator"></div></div></div>';
      $(confirmInput).parent().after('<div class="password-suggestions description"></div>');
      $(innerWrapper).prepend(passwordMeter);
      var passwordDescription = $('div.password-suggestions', outerWrapper).hide();

      // Check the password strength.
      var passwordCheck = function () {

        // Evaluate the password strength.
        var result = Drupal.evaluatePasswordStrength(passwordInput.val(), settings.password);

        // Update the suggestions for how to improve the password.
        if (passwordDescription.html() != result.message) {
          passwordDescription.html(result.message);
        }

        // Only show the description box if there is a weakness in the password.
        if (result.strength == 100) {
          passwordDescription.hide();
        }
        else {
          passwordDescription.show();
        }

        // Adjust the length of the strength indicator.
        $(innerWrapper).find('.indicator').css('width', result.strength + '%');

        // Update the strength indication text.
        $(innerWrapper).find('.password-strength-text').html(result.indicatorText);

        passwordCheckMatch();
      };

      // Check that password and confirmation inputs match.
      var passwordCheckMatch = function () {

        if (confirmInput.val()) {
          var success = passwordInput.val() === confirmInput.val();

          // Show the confirm result.
          confirmResult.css({ visibility: 'visible' });

          // Remove the previous styling if any exists.
          if (this.confirmClass) {
            confirmChild.removeClass(this.confirmClass);
          }

          // Fill in the success message and set the class accordingly.
          var confirmClass = success ? 'ok' : 'error';
          confirmChild.html(translate['confirm' + (success ? 'Success' : 'Failure')]).addClass(confirmClass);
          this.confirmClass = confirmClass;
        }
        else {
          confirmResult.css({ visibility: 'hidden' });
        }
      };

      // Monitor keyup and blur events.
      // Blur must be used because a mouse paste does not trigger keyup.
      passwordInput.keyup(passwordCheck).focus(passwordCheck).blur(passwordCheck);
      confirmInput.keyup(passwordCheckMatch).blur(passwordCheckMatch);
    });
  }
};

/**
 * Evaluate the strength of a user's password.
 *
 * Returns the estimated strength and the relevant output message.
 */
Drupal.evaluatePasswordStrength = function (password, translate) {
  password = $.trim(password);

  var weaknesses = 0, strength = 100, msg = [];

  var hasLowercase = /[a-z]+/.test(password);
  var hasUppercase = /[A-Z]+/.test(password);
  var hasNumbers = /[0-9]+/.test(password);
  var hasPunctuation = /[^a-zA-Z0-9]+/.test(password);

  // If there is a username edit box on the page, compare password to that, otherwise
  // use value from the database.
  var usernameBox = $('input.username');
  var username = (usernameBox.length > 0) ? usernameBox.val() : translate.username;

  // Lose 5 points for every character less than 6, plus a 30 point penalty.
  if (password.length < 6) {
    msg.push(translate.tooShort);
    strength -= ((6 - password.length) * 5) + 30;
  }

  // Count weaknesses.
  if (!hasLowercase) {
    msg.push(translate.addLowerCase);
    weaknesses++;
  }
  if (!hasUppercase) {
    msg.push(translate.addUpperCase);
    weaknesses++;
  }
  if (!hasNumbers) {
    msg.push(translate.addNumbers);
    weaknesses++;
  }
  if (!hasPunctuation) {
    msg.push(translate.addPunctuation);
    weaknesses++;
  }

  // Apply penalty for each weakness (balanced against length penalty).
  switch (weaknesses) {
    case 1:
      strength -= 12.5;
      break;

    case 2:
      strength -= 25;
      break;

    case 3:
      strength -= 40;
      break;

    case 4:
      strength -= 40;
      break;
  }

  // Check if password is the same as the username.
  if (password !== '' && password.toLowerCase() === username.toLowerCase()) {
    msg.push(translate.sameAsUsername);
    // Passwords the same as username are always very weak.
    strength = 5;
  }

  // Based on the strength, work out what text should be shown by the password strength meter.
  if (strength < 60) {
    indicatorText = translate.weak;
  } else if (strength < 70) {
    indicatorText = translate.fair;
  } else if (strength < 80) {
    indicatorText = translate.good;
  } else if (strength <= 100) {
    indicatorText = translate.strong;
  }

  // Assemble the final message.
  msg = translate.hasWeaknesses + '<ul><li>' + msg.join('</li><li>') + '</li></ul>';
  return { strength: strength, message: msg, indicatorText: indicatorText };

};

/**
 * Field instance settings screen: force the 'Display on registration form'
 * checkbox checked whenever 'Required' is checked.
 */
Drupal.behaviors.fieldUserRegistration = {
  attach: function (context, settings) {
    var $checkbox = $('form#field-ui-field-edit-form input#edit-instance-settings-user-register-form');

    if ($checkbox.length) {
      $('input#edit-instance-required', context).once('user-register-form-checkbox', function () {
        $(this).bind('change', function (e) {
          if ($(this).attr('checked')) {
            $checkbox.attr('checked', true);
          }
        });
      });

    }
  }
};

})(jQuery);
;
(function ($) {

Drupal.behaviors.textarea = {
  attach: function (context, settings) {
    $('.form-textarea-wrapper.resizable', context).once('textarea', function () {
      var staticOffset = null;
      var textarea = $(this).addClass('resizable-textarea').find('textarea');
      var grippie = $('<div class="grippie"></div>').mousedown(startDrag);

      grippie.insertAfter(textarea);

      function startDrag(e) {
        staticOffset = textarea.height() - e.pageY;
        textarea.css('opacity', 0.25);
        $(document).mousemove(performDrag).mouseup(endDrag);
        return false;
      }

      function performDrag(e) {
        textarea.height(Math.max(32, staticOffset + e.pageY) + 'px');
        return false;
      }

      function endDrag(e) {
        $(document).unbind('mousemove', performDrag).unbind('mouseup', endDrag);
        textarea.css('opacity', 1);
      }
    });
  }
};

})(jQuery);
;
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
                custom_dialog_alert('Th??ng b??o', 'B???n ch??a ho??n th??nh vi???c ????ng nh???p v??o t??i kho???n Facebook c???a m??nh.');
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
        var image_wrapper = jQuery('<div class="photo-thumb-wrapper">??ang t???i</div>');
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
          var image_wrapper = jQuery('<div class="photo-thumb-wrapper">??ang t???i</div>');
          var image = jQuery('<img src="' + file['field_photo_default_url'] + '" class="photo-thumb" alt="' + file['field_photo_default_filename'] + '" fid="' + file['field_photo_default_fid'] + '" />');

          image_wrapper.addClass('loaded').attr('fid', file['field_photo_default_fid']);
          image_wrapper.html(image);
          image_wrapper.append('<span class="controls" onclick="giaidieu_facebook_photo_remove(this);"><i class="fa fa-times" aria-hidden="true" title="Nh???n ????? b??? ???nh n??y"></i></span>');

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
            custom_dialog_alert('Th??ng b??o', 'L???i ch??a x??c ?????nh. Vui l??ng t???i l???i trang ho???c li??n h??? ch??ng t??i ????? nh???n tr??? gi??p.');
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

          image_wrapper.append('<span class="controls" onclick="giaidieu_facebook_photo_remove(this);"><i class="fa fa-times" aria-hidden="true" title="Nh???n ????? b??? ???nh n??y"></i></span>');

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
            custom_dialog_alert('Th??ng b??o', 'S??? ???nh hi???n c?? c???a b???n ???? ??? h???n m???c l?? ' + total_max + '. Vui l??ng b??? b???t ????? t???i ???nh m???i.');
            return false;
          }
          else if (total_files + total_uploads > total_max) {
            var remain = total_files + total_uploads - total_max;
            custom_dialog_alert('Th??ng b??o', "S??? ???nh hi???n c?? c???a b???n l?? " + total_files + ". S??? ???nh ????a l??n l?? " + total_uploads + " ???? v?????t qu?? h???n m???c t???i ??a " + total_max + " ???nh.\nVui l??ng b??? b???t " + remain + " ???nh r???i th??? l???i.");
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
                photo_div.append('<span class="controls" onclick="giaidieu_facebook_photo_remove(this);"><i class="fa fa-times" aria-hidden="true" title="Nh???n ????? b??? ???nh n??y"></i></span>');
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
          $(this).append('<span class="photo-selected">???? ch???n</span>');
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
    jQuery("#popup-breadcrumb").empty().html('<span class="name">Album ???nh</span> <span class="count">(' + home_count + ')</span>');
  }
  else{
    var div_home = '<span class="home-switch"><span class="name">Album ???nh</span> <span class="count">(' + home_count + ')</span></span>';
    var div_album = '<span class="name">' + jQuery("#" + div_id).attr('album_name') + '</span> <span class="count">(' + jQuery("#" + div_id).attr('album_count') + ')</span>';
    jQuery("#popup-breadcrumb").empty().append(div_home + ' <span class="splitter">></span> ' + div_album);
  }
}

/**
 * Handle when remove a photo.
 */
function giaidieu_facebook_photo_remove(obj) {
  custom_dialog_confirm("X??c nh???n", "B???n ch???c ch???n mu???n b??? ???nh n??y?\n???nh s??? b??? x??a v?? kh??ng th??? ph???c h???i sau khi nh???n n??t 'C???p nh???t h??? s??'.", 400, 'auto', true, function() {
    var fid = parseInt(jQuery(obj).closest('div.photo-thumb-wrapper').attr('fid'));
    if (!fid) {
      custom_dialog_alert('Th??ng b??o', 'Kh??ng t??m th???y th??ng tin file ???nh. Vui l??ng th??? l???i sau.');
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
  if (confirm("B???n ch???c ch???n mu???n b??? ???nh n??y?\n???nh s??? b??? x??a v?? kh??ng th??? ph???c h???i sau khi nh???n n??t 'C???p nh???t h??? s??' b??n d?????i.")) {
    var fid = parseInt(jQuery(obj).attr('fid'));
    if (!fid) {
      custom_dialog_alert('Th??ng b??o', 'Kh??ng t??m th???y th??ng tin file ???nh. Vui l??ng th??? l???i sau.');
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
    custom_dialog_alert('Th??ng b??o', 'Ch??a k???t n???i ???????c t???i th?? vi???n Facebook. Vui l??ng th??? l???i (reload trang).');
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
			    custom_dialog_alert('Th??ng b??o', 'B???n c???n ????ng nh???p v??o t??i kho???n Facebook ????? l???y ???nh.');
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
    title: 'L???y ???nh t??? Facebook',
    buttons: [
      {text: 'Ch???n nh???ng ???nh ???? ????nh d???u', class: 'custom-dialog primary', click: function() {
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
          photo_div.html('??ang t???i');

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
                photo_div.append('<span class="controls" onclick="giaidieu_facebook_photo_remove(this);"><i class="fa fa-times" aria-hidden="true" title="Nh???n ????? b??? ???nh n??y"></i></span>');
                
                // Add draggable to this object.
                jQuery(photo_div).draggable({revert: true});
                
                giaidieu_facebook_fids_topup(fid);
              }
            });
          });
        });

        jQuery(this).dialog('close');
      }},
      {text: 'Hu??? b???', class: 'custom-dialog secondary', click: function() {
        jQuery(this).dialog('close');
      }}
    ]
  });

  // Put on albums.
  FB.api('/me', {fields: 'albums.limit(500){name,count,cover_photo}'}, function(response) {
    //console.log(response);
    
    if (response.albums == undefined) {
      custom_dialog_alert('Th??ng b??o', 'B???n kh??ng c?? album ???nh n??o ??? ch??? ????? c??ng khai ????? t???i v???. Vui l??ng ki???m tra r???i th??? l???i.');
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
    jQuery("#photo-canvas").html('<div class="photos-desc"><p class="desc heading">Th?? vi???n ???nh</p><p class="desc">Ch??a c?? ???nh n??o ???????c t???i l??n!</p></div><div class="photos-list"></div>');
  }
}

// Update breadcrumb.
function giaidieu_facebook_update_breadcrumb(div_id) {
  var home_count = jQuery("#album_home").attr('count');

  if (div_id == 'album_home') {
    jQuery("#popup-breadcrumb").empty().html('<span class="name">Album ???nh</span> <span class="count">(' + home_count + ')</span>');
  }
  else{
    var div_home = '<span class="home-switch"><span class="name">Album ???nh</span> <span class="count">(' + home_count + ')</span></span>';
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
		    document.getElementById('fb-tooltip').innerHTML = 'B???n ??ang d??ng t??i kho???n FB d?????i t??n: ' + response.name;
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
		  document.getElementById('fb-tooltip').innerHTML = '????ng nh???p v??o Facebook ????? l???y th??ng tin c???a b???n';
		}
	}
	else {
		// The person is not logged into Facebook, so we're not sure if
		// they are logged into this app or not.
		if (document.getElementById('fb-tooltip') != null) {
		  document.getElementById('fb-tooltip').innerHTML = '????ng nh???p v??o Facebook ????? l???y th??ng tin c???a b???n';
		}
	}
}

// Check user status after FB login.
function facebook_check_login_state() {
	FB.getLoginStatus(function(response) {
		facebook_login_state_change_callback(response);
	});
};
