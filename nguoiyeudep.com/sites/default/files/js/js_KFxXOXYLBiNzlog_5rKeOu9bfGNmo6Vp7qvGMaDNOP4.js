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
var mobile_data = [{"name":"mobifone","prefix":"090","length":"10"},{"name":"mobifone","prefix":"093","length":"10"},{"name":"mobifone","prefix":"089","length":"10"},{"name":"mobifone","prefix":"070","length":"10"},{"name":"mobifone","prefix":"079","length":"10"},{"name":"mobifone","prefix":"077","length":"10"},{"name":"mobifone","prefix":"076","length":"10"},{"name":"mobifone","prefix":"078","length":"10"},{"name":"vinaphone","prefix":"091","length":"10"},{"name":"vinaphone","prefix":"094","length":"10"},{"name":"vinaphone","prefix":"088","length":"10"},{"name":"vinaphone","prefix":"083","length":"10"},{"name":"vinaphone","prefix":"084","length":"10"},{"name":"vinaphone","prefix":"085","length":"10"},{"name":"vinaphone","prefix":"081","length":"10"},{"name":"vinaphone","prefix":"082","length":"10"},{"name":"viettel","prefix":"096","length":"10"},{"name":"viettel","prefix":"097","length":"10"},{"name":"viettel","prefix":"098","length":"10"},{"name":"viettel","prefix":"086","length":"10"},{"name":"viettel","prefix":"032","length":"10"},{"name":"viettel","prefix":"033","length":"10"},{"name":"viettel","prefix":"034","length":"10"},{"name":"viettel","prefix":"035","length":"10"},{"name":"viettel","prefix":"036","length":"10"},{"name":"viettel","prefix":"037","length":"10"},{"name":"viettel","prefix":"038","length":"10"},{"name":"viettel","prefix":"039","length":"10"},{"name":"vietnamobile","prefix":"092","length":"10"},{"name":"vietnamobile","prefix":"058","length":"10"},{"name":"vietnamobile","prefix":"056","length":"10"},{"name":"gmobile","prefix":"099","length":"10"},{"name":"gmobile","prefix":"059","length":"10"},{"name":"vsat","prefix":"0996","length":"10"},{"name":"vietnamobile","prefix":"052","length":"10"}];;
/* Modernizr 2.6.2 (Custom Build) | MIT & BSD
 * Build: http://modernizr.com/download/#-fontface-backgroundsize-borderimage-borderradius-boxshadow-flexbox-flexboxlegacy-hsla-multiplebgs-opacity-rgba-textshadow-cssanimations-csscolumns-generatedcontent-cssgradients-cssreflections-csstransforms-csstransforms3d-csstransitions-canvas-canvastext-draganddrop-teststyles-testprop-testallprops-hasevent-prefixes-domprefixes
 */
;window.Modernizr=function(a,b,c){function A(a){i.cssText=a}function B(a,b){return A(m.join(a+";")+(b||""))}function C(a,b){return typeof a===b}function D(a,b){return!!~(""+a).indexOf(b)}function E(a,b){for(var d in a){var e=a[d];if(!D(e,"-")&&i[e]!==c)return b=="pfx"?e:!0}return!1}function F(a,b,d){for(var e in a){var f=b[a[e]];if(f!==c)return d===!1?a[e]:C(f,"function")?f.bind(d||b):f}return!1}function G(a,b,c){var d=a.charAt(0).toUpperCase()+a.slice(1),e=(a+" "+o.join(d+" ")+d).split(" ");return C(b,"string")||C(b,"undefined")?E(e,b):(e=(a+" "+p.join(d+" ")+d).split(" "),F(e,b,c))}var d="2.6.2",e={},f=b.documentElement,g="modernizr",h=b.createElement(g),i=h.style,j,k=":)",l={}.toString,m=" -webkit- -moz- -o- -ms- ".split(" "),n="Webkit Moz O ms",o=n.split(" "),p=n.toLowerCase().split(" "),q={},r={},s={},t=[],u=t.slice,v,w=function(a,c,d,e){var h,i,j,k,l=b.createElement("div"),m=b.body,n=m||b.createElement("body");if(parseInt(d,10))while(d--)j=b.createElement("div"),j.id=e?e[d]:g+(d+1),l.appendChild(j);return h=["&#173;",'<style id="s',g,'">',a,"</style>"].join(""),l.id=g,(m?l:n).innerHTML+=h,n.appendChild(l),m||(n.style.background="",n.style.overflow="hidden",k=f.style.overflow,f.style.overflow="hidden",f.appendChild(n)),i=c(l,a),m?l.parentNode.removeChild(l):(n.parentNode.removeChild(n),f.style.overflow=k),!!i},x=function(){function d(d,e){e=e||b.createElement(a[d]||"div"),d="on"+d;var f=d in e;return f||(e.setAttribute||(e=b.createElement("div")),e.setAttribute&&e.removeAttribute&&(e.setAttribute(d,""),f=C(e[d],"function"),C(e[d],"undefined")||(e[d]=c),e.removeAttribute(d))),e=null,f}var a={select:"input",change:"input",submit:"form",reset:"form",error:"img",load:"img",abort:"img"};return d}(),y={}.hasOwnProperty,z;!C(y,"undefined")&&!C(y.call,"undefined")?z=function(a,b){return y.call(a,b)}:z=function(a,b){return b in a&&C(a.constructor.prototype[b],"undefined")},Function.prototype.bind||(Function.prototype.bind=function(b){var c=this;if(typeof c!="function")throw new TypeError;var d=u.call(arguments,1),e=function(){if(this instanceof e){var a=function(){};a.prototype=c.prototype;var f=new a,g=c.apply(f,d.concat(u.call(arguments)));return Object(g)===g?g:f}return c.apply(b,d.concat(u.call(arguments)))};return e}),q.flexbox=function(){return G("flexWrap")},q.flexboxlegacy=function(){return G("boxDirection")},q.canvas=function(){var a=b.createElement("canvas");return!!a.getContext&&!!a.getContext("2d")},q.canvastext=function(){return!!e.canvas&&!!C(b.createElement("canvas").getContext("2d").fillText,"function")},q.draganddrop=function(){var a=b.createElement("div");return"draggable"in a||"ondragstart"in a&&"ondrop"in a},q.rgba=function(){return A("background-color:rgba(150,255,150,.5)"),D(i.backgroundColor,"rgba")},q.hsla=function(){return A("background-color:hsla(120,40%,100%,.5)"),D(i.backgroundColor,"rgba")||D(i.backgroundColor,"hsla")},q.multiplebgs=function(){return A("background:url(https://),url(https://),red url(https://)"),/(url\s*\(.*?){3}/.test(i.background)},q.backgroundsize=function(){return G("backgroundSize")},q.borderimage=function(){return G("borderImage")},q.borderradius=function(){return G("borderRadius")},q.boxshadow=function(){return G("boxShadow")},q.textshadow=function(){return b.createElement("div").style.textShadow===""},q.opacity=function(){return B("opacity:.55"),/^0.55$/.test(i.opacity)},q.cssanimations=function(){return G("animationName")},q.csscolumns=function(){return G("columnCount")},q.cssgradients=function(){var a="background-image:",b="gradient(linear,left top,right bottom,from(#9f9),to(white));",c="linear-gradient(left top,#9f9, white);";return A((a+"-webkit- ".split(" ").join(b+a)+m.join(c+a)).slice(0,-a.length)),D(i.backgroundImage,"gradient")},q.cssreflections=function(){return G("boxReflect")},q.csstransforms=function(){return!!G("transform")},q.csstransforms3d=function(){var a=!!G("perspective");return a&&"webkitPerspective"in f.style&&w("@media (transform-3d),(-webkit-transform-3d){#modernizr{left:9px;position:absolute;height:3px;}}",function(b,c){a=b.offsetLeft===9&&b.offsetHeight===3}),a},q.csstransitions=function(){return G("transition")},q.fontface=function(){var a;return w('@font-face {font-family:"font";src:url("https://")}',function(c,d){var e=b.getElementById("smodernizr"),f=e.sheet||e.styleSheet,g=f?f.cssRules&&f.cssRules[0]?f.cssRules[0].cssText:f.cssText||"":"";a=/src/i.test(g)&&g.indexOf(d.split(" ")[0])===0}),a},q.generatedcontent=function(){var a;return w(["#",g,"{font:0/0 a}#",g,':after{content:"',k,'";visibility:hidden;font:3px/1 a}'].join(""),function(b){a=b.offsetHeight>=3}),a};for(var H in q)z(q,H)&&(v=H.toLowerCase(),e[v]=q[H](),t.push((e[v]?"":"no-")+v));return e.addTest=function(a,b){if(typeof a=="object")for(var d in a)z(a,d)&&e.addTest(d,a[d]);else{a=a.toLowerCase();if(e[a]!==c)return e;b=typeof b=="function"?b():b,typeof enableClasses!="undefined"&&enableClasses&&(f.className+=" "+(b?"":"no-")+a),e[a]=b}return e},A(""),h=j=null,e._version=d,e._prefixes=m,e._domPrefixes=p,e._cssomPrefixes=o,e.hasEvent=x,e.testProp=function(a){return E([a])},e.testAllProps=G,e.testStyles=w,e}(this,this.document);;
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
/* giaidieu.file.js created by giaidieu */

// File drag handler.
function giaidieu_file_drag_handler(e) {
  e.stopPropagation();
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
}

/**
 * File drop handler.
 * file_id: id of the file field.
 * options: {
 *   max_filesize: 5,
 *   min_width: 300,
 *   min_height: 300,
 *   url: '/custom/photo-upload' - This URL will return fid if success.
 * }
 * callback: use to output result and process.
 */
function giaidieu_file_drop_handler(files, options, callback) {
  // Setup default value.
  options.max_filesize = options.max_filesize == undefined ? 5 : options.max_filesize; // in MB.
  options.min_width = options.min_width == undefined ? 300 : options.min_width; // in pixels.
  options.min_height = options.min_height == undefined ? 300 : options.min_height;
  options.url = options.url == undefined ? '/custom/photo-upload' : options.url;

  for (var i = 0, f; f = files[i]; i++) {
		// Validate the input:
		// Must be images.
		if (!f.type.match('image.*')) {
		  alert('File ' + f.name.toUpperCase() + ' không phải là định dạng ảnh.');
		  continue;
		}

    // Must less than options.max_filesize * 1024 * 1024 MB.
    if (f.size > options.max_filesize * 1024 * 1024) {
      alert('File ' + f.name.toUpperCase() + ' có kích thước lớn hơn ' + options.max_filesize + 'MB.');
 			continue;
    }

    // Read the file for checking dimension.
    var reader = new FileReader();

    // Closure to capture the file information.
    reader.onload = (function(theFile) {
      return function(e) {
				var image = new Image();
				var file = e;

        image.onload = function(e) {
          var width = this.width;
          var height = this.height;
					var is_error = false;

					if (width < options.min_width) {
						alert('File ' + theFile.name.toUpperCase() + ' có chiều rộng nhỏ hơn ' + options.min_width + 'px.');
						is_error = true;
					}

					if (height < options.min_height) {
						alert('File ' + theFile.name.toUpperCase() + ' có chiều cao nhỏ hơn ' + options.min_height + 'px.');
						is_error = true;
					}

					// Show the image in the list.
					if (!is_error) {
            var image_wrapper = jQuery('<div class="photo-thumb-wrapper">Đang tải</div>');
            callback('wrapper', image_wrapper);

						// Build files form submit.
						var formData = new FormData();
						formData.append('file', theFile);

						var xhr = new XMLHttpRequest();
						xhr.open('POST', options.url);
						xhr.onload = function () {
							if (xhr.status === 200) {
								// Done, success.
								// Update and close popup.
                var params = xhr.response.split(/\|/);
								var fid = parseInt(params[0]);
                var image = jQuery('<img src="' + params[1] + '" class="photo-thumb" alt="' + theFile.name + '" />');

								if (fid > 0) {
								  // Output or process the result.
								  if (typeof callback == 'function') {
								    image.attr('fid', fid);
                    image_wrapper.attr('fid', fid);
								    callback('image', image);
								  }
								}
                else{
                  alert('Có lỗi trong quá trình tải ảnh. Xin vui lòng thử lại.');
                }
						  }
							else {
								alert('Không kết nối được tới máy chủ. Xin vui lòng thử lại.');
							}
						};

						xhr.send(formData);

					}
					else{
						// Error.
						// To-do.
             console.log('Validation error. Not uploading file.');
					}
				};

				image.src = e.target.result;
			};
		})(f);

		// Read in the image file as a data URL.
		reader.readAsDataURL(f);
	}
  
  return false;
}

/**
 * Process showing thumbnail and store to server, return fid.
 */
function giaidieu_file_image_data_process(img_selector, imagedata, callback) {
  var img = $(img_selector);
  if (!img.length) {return false;}

	// Show image in preview section.
	img.attr('src', 'data:image/jpeg;base64,' + imagedata);

	// Send to server for fid returning.
	var filename = Drupal.user.name + '_' + Date.now() + '.jpg';
	giaidieu_services_call('photo_data_upload', {filename: filename, imagedata: imagedata}, function(result) {
		if (parseInt(result) > 0) {
			img.attr('fid', result);

			if (typeof callback == 'function') {callback(img);}
		}
		else{
			alert('Có lỗi trong lúc xử lý file. Xin vui lòng thử lại.');
		}
	});
}

/**
 * File handler.
 * file_id: id of the file field.
 * options: {
 *   max_filesize: 5,
 *   max_files: 20,
 *   min_width: 300,
 *   min_height: 300,
 *   url: '/image-process' - This URL will return fid if success.
 * }
 * callback: use to output result and process.
 */
function giaidieu_file_handler(file_id, options, callback) {
  //var file = document.getElementById(file_id);
  var file = jQuery("#" + file_id);

  if (!file.length) {return false;}

  file.change(function(e) {
		e.stopPropagation();
		e.preventDefault();

		// Setup default value.
		options.max_filesize = options.max_filesize == undefined ? 5 : options.max_filesize; // in MB.
    options.max_files = options.max_files == undefined ? 20 : options.max_files; // Number of files to be uploaded.
		options.min_width = options.min_width == undefined ? 300 : options.min_width; // in pixels.
		options.min_height = options.min_height == undefined ? 300 : options.min_height;
		options.url = options.url == undefined ? '/image-process' : options.url;

		var files = null;
		if (e.dataTransfer != undefined) {
			files = e.dataTransfer.files;
		}
		else{
			files = e.target.files;
		}

    // Control number of files allowed.
    if (file_id == 'photo-canvas-files') {
      var total_files = jQuery("input[name='facebook_photos']").val() != '' ? parseInt(jQuery("input[name='facebook_photos']").val().split(/\,/).length) : 0;
      var total_uploads = parseInt(files.length);
          
      if (total_files >= options.max_files) {
        custom_dialog_alert('Thông báo', 'Số ảnh hiện có của bạn đã ở hạn mức là ' + options.max_files + '. Vui lòng bỏ bớt để tải ảnh mới.');
        return false;
      }
      else if (total_files + total_uploads > options.max_files) {
        var remain = total_files + total_uploads - options.max_files;
        custom_dialog_alert('Thông báo', "Số ảnh hiện có của bạn là " + total_files + ". Số ảnh đưa lên là " + total_uploads + " đã vượt quá hạn mức tối đa " + options.max_files + " ảnh.\nVui lòng bỏ bớt " + remain + " ảnh rồi thử lại.");
        return false;
      }

      // Limit number of files to be uploaded.
      if (files.length > options.max_files) {
        custom_dialog_alert('Thông báo', 'Số lượng file đưa lên vượt quá ' + options.max_files + ' ảnh cho phép.');
        return false;
      }
    }

		for (var i = 0, f; f = files[i]; i++) {
			// Validate the input:
			// Must be images.
			if (!f.type.match('image.*')) {
				custom_dialog_alert('Thông báo', 'File ' + f.name.toUpperCase() + ' không phải là định dạng ảnh.');
				continue;
			}

			// Must less than options.max_filesize * 1024 * 1024 MB.
			if (f.size > options.max_filesize * 1024 * 1024) {
				custom_dialog_alert('Thông báo', 'File ' + f.name.toUpperCase() + ' có kích thước lớn hơn ' + options.max_filesize + 'MB.');
				continue;
			}

			// Read the file for checking dimension.
			var reader = new FileReader();

			// Closure to capture the file information.
			reader.onload = (function(theFile) {
				return function(e) {
					var image = new Image();
					var file = e;

					image.onload = function(e) {
						var width = this.width;
						var height = this.height;
						var is_error = false;

						if (width < options.min_width) {
							custom_dialog_alert('Thông báo', 'File ' + theFile.name.toUpperCase() + ' có chiều rộng nhỏ hơn ' + options.min_width + 'px.');
							is_error = true;
						}

						if (height < options.min_height) {
							custom_dialog_alert('Thông báo', 'File ' + theFile.name.toUpperCase() + ' có chiều cao nhỏ hơn ' + options.min_height + 'px.');
							is_error = true;
						}

						// Show the image in the list.
						if (!is_error) {
              var image_wrapper = jQuery('<div class="photo-thumb-wrapper">Đang tải</div>');
              callback('wrapper', image_wrapper);

							// Build files form submit.
							var formData = new FormData();
							formData.append('file', theFile);

							var xhr = new XMLHttpRequest();
							xhr.open('POST', options.url);
							xhr.onload = function () {
								if (xhr.status === 200) {
									// Done, success.
									// Update and close popup.
                  var params = xhr.response.split(/\|/);
									var fid = parseInt(params[0]);
                  var image = jQuery('<img src="' + params[1] + '" class="photo-thumb" alt="' + theFile.name + '" />');
                  
									if (fid > 0) {
									  // Output or process the result.
									  if (typeof callback == 'function') {
									    image.attr('fid', fid);
                      image_wrapper.attr('fid', fid);
									    callback('image', image);
									  }
									}
                  else{
                    custom_dialog_alert('Thông báo', 'Có lỗi trong quá trình tải ảnh. Xin vui lòng thử lại.');
                  }
								}
								else {
									custom_dialog_alert('Thông báo', 'Không kết nối được tới máy chủ. Xin vui lòng thử lại.');
								}
							};

							xhr.send(formData);

						}
						else{
							// Error.
							// To-do.
              console.log('Validation error. Not uploading file.');
						}
					};

					image.src = e.target.result;
				};
			})(f);

			// Read in the image file as a data URL.
			reader.readAsDataURL(f);
		}

    return false;
	});
}

/**
 * File handler.
 * file_id: id of the file field.
 * options: {
 *   max_filesize: 5,
 *   url: '/custom/video-upload' - This URL will return fid if success.
 * }
 * callback: use to output result and process.
 */
function giaidieu_file_video_handler(file_id, options, callback) {
  //var file = document.getElementById(file_id);
  var file = jQuery("#" + file_id);

  if (!file.length || file.hasClass('disabled')) {return false;}

  file.change(function(e) {
		e.stopPropagation();
		e.preventDefault();

		// Setup default value.
		options.max_filesize = options.max_filesize == undefined ? 250 : options.max_filesize; // in MB
		options.url = options.url == undefined ? '/video-process' : options.url;

		var files = null;
		if (e.dataTransfer != undefined) {
			files = e.dataTransfer.files;
		}
		else{
			files = e.target.files;
		}

		for (var i = 0, f; f = files[i]; i++) {
			// Validate the input:
			// Must be video.
			//if (!f.type.match('image.*')) {
				//alert('File ' + f.name.toUpperCase() + ' không phải là định dạng ảnh.');
				//continue;
			//}

			// Must less than options.max_filesize * 1024 * 1024 MB.
			if (f.size > options.max_filesize * 1024 * 1024) {
				alert('File ' + f.name.toUpperCase() + ' có kích thước lớn hơn ' + options.max_filesize + 'MB.');
				continue;
			}
      
      // Disable the file field waiting for upload.
      file.addClass('disabled');
      
      // Show ajax loader.
      file.parent().children('.video-add-wrapper').addClass('is-uploading').prepend('<img src="/sites/all/themes/giaidieu/images/ajax-loader.gif" class="ajax-loader" />');

			// Read the file for checking dimension.
			var reader = new FileReader();

			// Closure to capture the file information.
			reader.onload = (function(theFile) {
				return function(e) {
					//var file = e;

          // Build files form submit.
          var formData = new FormData();
          formData.append('file', theFile);

          var xhr = new XMLHttpRequest();
          xhr.open('POST', options.url);
          xhr.onload = function() {
            // Enable field field back.
            file.removeClass('disabled');
            file.parent().children('.video-add-wrapper').removeClass('is-uploading').find('img.ajax-loader').remove();
            
            if (xhr.status === 200) {
              // Done, success.
		          // Output or process the result.
              if (typeof callback == 'function') {
				        callback(xhr.response);
              }
              else{
                alert('Có lỗi trong quá trình tải file. Xin vui lòng thử lại.');
              }
            }
            else{
              alert('Không kết nối được tới máy chủ. Xin vui lòng thử lại.');
            }
          };

          xhr.send(formData);
				};
			})(f);

			// Read in the image file as a data URL.
			reader.readAsDataURL(f);
		}

    return false;
	});
}

/**
 * File handler.
 * file_id: id of the file field.
 * options: {
 *   max_filesize: 5,
 *   url: '/custom/media-upload' - This URL will return fid if success.
 * }
 * callback: use to output result and process.
 */
function giaidieu_file_media_handler(file_id, options, callback) {
  var file = jQuery("#" + file_id);

  if (!file.length || file.hasClass('disabled')) {return false;}

  file.change(function(e) {
		e.stopPropagation();
		e.preventDefault();

		// Setup default value.
		options.max_image_filesize = 5; // in Mb.
		options.max_video_filesize = 1024; // in Mb.
		options.url = options.url == undefined ? '/media-process' : options.url;
    
    var list = jQuery(options.list);

		var files = null;
		if (e.dataTransfer != undefined) {
			files = e.dataTransfer.files;
		}
		else{
			files = e.target.files;
		}

		for (var i = 0, f; f = files[i]; i++) {
			// Validate the input:
			if (!f.type.match('image.*') && !f.type.match('video.*')) {
				alert('File ' + f.name.toUpperCase() + ' không phải là định dạng media.');
				continue;
			}

      if (f.type.match('image.*') && f.size > options.max_image_filesize * 1024 * 1024) {
				alert('File ' + f.name.toUpperCase() + ' có kích thước lớn hơn ' + options.max_image_filesize + 'MB.');
				continue;
      }
      else if (f.type.match('video.*') && f.size > options.max_video_filesize * 1024 * 1024) {
				alert('File ' + f.name.toUpperCase() + ' có kích thước lớn hơn ' + options.max_video_filesize + 'MB.');
				continue;
			}
      
      // Get the file type URL uploader.
      if (f.type.match('image.*')) {
        options.url = '/custom/photo-upload2';
        options.media_type = 'image';
        
        list.append(jQuery('<div class="photo-thumb-wrapper"><img src="/sites/all/themes/giaidieu/images/ajax-loader.gif" class="ajax-loader" /><img src="/sites/default/files/styles/media_thumbnail/public/default_images/no_photo.png" class="no-photo" alt="Image thumbnail" /></div>'));
      }
      else if (f.type.match('video.*')) {
        options.url = '/custom/video-upload';
        options.media_type = 'video';
        
        list.append(jQuery('<div class="photo-thumb-wrapper"><img src="/sites/all/themes/giaidieu/images/ajax-loader.gif" class="ajax-loader" /><img src="/sites/default/files/styles/media_thumbnail/public/default_images/video-x-generic.png" class="no-photo" alt="Video thumbnail" /></div>'));
      }
      
			// Read the file for checking dimension.
			var reader = new FileReader();

			// Closure to capture the file information.
			reader.onload = (function(theFile) {
				return function(e) {
          // Build files form submit.
          var formData = new FormData();
          formData.append('file', theFile);

          var xhr = new XMLHttpRequest();
          xhr.open('POST', options.url);
          xhr.onload = function() {
            if (xhr.status === 200) {
              // Done, success.
		          // Output or process the result.
              if (typeof callback == 'function') {
                if (options.media_type == 'image') {
                  var params = xhr.response.split(/\|/);
                  //thumbnail.find('img.ajax-loader').remove();
                  callback(params[1]);
                }
                else{
                  var params = xhr.response.split(/\|/);
                  //thumbnail.find('img.ajax-loader').remove();
                  callback(params[2]);
                }
              }
              else{
                alert('Có lỗi trong quá trình tải file. Xin vui lòng thử lại.');
              }
            }
            else{
              alert('Không kết nối được tới máy chủ. Xin vui lòng thử lại.');
            }
          };

          xhr.send(formData);
				};
			})(f);

			// Read in the image file as a data URL.
			reader.readAsDataURL(f);
		}

    return false;
	});
};

(function($) {

/**
 * Drupal FieldGroup object.
 */
Drupal.FieldGroup = Drupal.FieldGroup || {};
Drupal.FieldGroup.Effects = Drupal.FieldGroup.Effects || {};
Drupal.FieldGroup.groupWithfocus = null;

Drupal.FieldGroup.setGroupWithfocus = function(element) {
  element.css({display: 'block'});
  Drupal.FieldGroup.groupWithfocus = element;
}

/**
 * Implements Drupal.FieldGroup.processHook().
 */
Drupal.FieldGroup.Effects.processFieldset = {
  execute: function (context, settings, type) {
    if (type == 'form') {
      // Add required fields mark to any fieldsets containing required fields
      $('fieldset.fieldset', context).once('fieldgroup-effects', function(i) {
        if ($(this).is('.required-fields') && $(this).find('.form-required').length > 0) {
          $('legend span.fieldset-legend', $(this)).eq(0).append(' ').append($('.form-required').eq(0).clone());
        }
        if ($('.error', $(this)).length) {
          $('legend span.fieldset-legend', $(this)).eq(0).addClass('error');
          Drupal.FieldGroup.setGroupWithfocus($(this));
        }
      });
    }
  }
}

/**
 * Implements Drupal.FieldGroup.processHook().
 */
Drupal.FieldGroup.Effects.processAccordion = {
  execute: function (context, settings, type) {
    $('div.field-group-accordion-wrapper', context).once('fieldgroup-effects', function () {
      var wrapper = $(this);

      // Get the index to set active.
      var active_index = false;
      wrapper.find('.accordion-item').each(function(i) {
        if ($(this).hasClass('field-group-accordion-active')) {
          active_index = i;
        }
      });

      wrapper.accordion({
        heightStyle: "content",
        active: active_index,
        collapsible: true,
        changestart: function(event, ui) {
          if ($(this).hasClass('effect-none')) {
            ui.options.animated = false;
          }
          else {
            ui.options.animated = 'slide';
          }
        }
      });

      if (type == 'form') {

        var $firstErrorItem = false;

        // Add required fields mark to any element containing required fields
        wrapper.find('div.field-group-accordion-item').each(function(i) {

          if ($(this).is('.required-fields') && $(this).find('.form-required').length > 0) {
            $('h3.ui-accordion-header a').eq(i).append(' ').append($('.form-required').eq(0).clone());
          }
          if ($('.error', $(this)).length) {
            // Save first error item, for focussing it.
            if (!$firstErrorItem) {
              $firstErrorItem = $(this).parent().accordion("activate" , i);
            }
            $('h3.ui-accordion-header').eq(i).addClass('error');
          }
        });

        // Save first error item, for focussing it.
        if (!$firstErrorItem) {
          $('.ui-accordion-content-active', $firstErrorItem).css({height: 'auto', width: 'auto', display: 'block'});
        }

      }
    });
  }
}

/**
 * Implements Drupal.FieldGroup.processHook().
 */
Drupal.FieldGroup.Effects.processHtabs = {
  execute: function (context, settings, type) {
    if (type == 'form') {
      // Add required fields mark to any element containing required fields
      $('fieldset.horizontal-tabs-pane', context).once('fieldgroup-effects', function(i) {
        if ($(this).is('.required-fields') && $(this).find('.form-required').length > 0) {
          $(this).data('horizontalTab').link.find('strong:first').after($('.form-required').eq(0).clone()).after(' ');
        }
        if ($('.error', $(this)).length) {
          $(this).data('horizontalTab').link.parent().addClass('error');
          Drupal.FieldGroup.setGroupWithfocus($(this));
          $(this).data('horizontalTab').focus();
        }
      });
    }
  }
}

/**
 * Implements Drupal.FieldGroup.processHook().
 */
Drupal.FieldGroup.Effects.processTabs = {
  execute: function (context, settings, type) {
    if (type == 'form') {

      var errorFocussed = false;

      // Add required fields mark to any fieldsets containing required fields
      $('fieldset.vertical-tabs-pane', context).once('fieldgroup-effects', function(i) {
        if ($(this).is('.required-fields') && $(this).find('.form-required').length > 0) {
          $(this).data('verticalTab').link.find('strong:first').after($('.form-required').eq(0).clone()).after(' ');
        }
        if ($('.error', $(this)).length) {
          $(this).data('verticalTab').link.parent().addClass('error');
          // Focus the first tab with error.
          if (!errorFocussed) {
            Drupal.FieldGroup.setGroupWithfocus($(this));
            $(this).data('verticalTab').focus();
            errorFocussed = true;
          }
        }
      });
    }
  }
}

/**
 * Implements Drupal.FieldGroup.processHook().
 *
 * TODO clean this up meaning check if this is really
 *      necessary.
 */
Drupal.FieldGroup.Effects.processDiv = {
  execute: function (context, settings, type) {

    $('div.collapsible', context).once('fieldgroup-effects', function() {
      var $wrapper = $(this);

      // Turn the legend into a clickable link, but retain span.field-group-format-toggler
      // for CSS positioning.

      var $toggler = $('span.field-group-format-toggler:first', $wrapper);
      var $link = $('<a class="field-group-format-title" href="#"></a>');
      $link.prepend($toggler.contents());

      // Add required field markers if needed
      if ($(this).is('.required-fields') && $(this).find('.form-required').length > 0) {
        $link.append(' ').append($('.form-required').eq(0).clone());
      }

      $link.appendTo($toggler);

      // .wrapInner() does not retain bound events.
      $link.click(function () {
        var wrapper = $wrapper.get(0);
        // Don't animate multiple times.
        if (!wrapper.animating) {
          wrapper.animating = true;
          var speed = $wrapper.hasClass('speed-fast') ? 300 : 1000;
          if ($wrapper.hasClass('effect-none') && $wrapper.hasClass('speed-none')) {
            $('> .field-group-format-wrapper', wrapper).toggle();
          }
          else if ($wrapper.hasClass('effect-blind')) {
            $('> .field-group-format-wrapper', wrapper).toggle('blind', {}, speed);
          }
          else {
            $('> .field-group-format-wrapper', wrapper).toggle(speed);
          }
          wrapper.animating = false;
        }
        $wrapper.toggleClass('collapsed');
        return false;
      });

    });
  }
};

/**
 * Behaviors.
 */
Drupal.behaviors.fieldGroup = {
  attach: function (context, settings) {
    settings.field_group = settings.field_group || Drupal.settings.field_group;
    if (settings.field_group == undefined) {
      return;
    }

    // Execute all of them.
    $.each(Drupal.FieldGroup.Effects, function (func) {
      // We check for a wrapper function in Drupal.field_group as
      // alternative for dynamic string function calls.
      var type = func.toLowerCase().replace("process", "");
      if (settings.field_group[type] != undefined && $.isFunction(this.execute)) {
        this.execute(context, settings, settings.field_group[type]);
      }
    });

    // Fixes css for fieldgroups under vertical tabs.
    $('.fieldset-wrapper .fieldset > legend').css({display: 'block'});
    $('.vertical-tabs fieldset.fieldset').addClass('default-fallback');

    // Add a new ID to each fieldset.
    $('.group-wrapper .horizontal-tabs-panes > fieldset', context).once('group-wrapper-panes-processed', function() {
      // Tats bad, but we have to keep the actual id to prevent layouts to break.
      var fieldgroupID = 'field_group-' + $(this).attr('id');
      $(this).attr('id', fieldgroupID);
    });
    // Set the hash in url to remember last userselection.
    $('.group-wrapper ul li').once('group-wrapper-ul-processed', function() {
      var fieldGroupNavigationListIndex = $(this).index();
      $(this).children('a').click(function() {
        var fieldset = $('.group-wrapper fieldset').get(fieldGroupNavigationListIndex);
        // Grab the first id, holding the wanted hashurl.
        var hashUrl = $(fieldset).attr('id').replace(/^field_group-/, '').split(' ')[0];
        window.location.hash = hashUrl;
      });
    });

  }
};

})(jQuery);
;
/**
 * @file
 * Attaches behaviors for the Chosen module.
 */

(function($) {
  Drupal.behaviors.chosen = {
    attach: function(context, settings) {
      settings.chosen = settings.chosen || Drupal.settings.chosen;

      // Prepare selector and add unwantend selectors.
      var selector = settings.chosen.selector;

      // Function to prepare all the options together for the chosen() call.
      var getElementOptions = function (element) {
        var options = $.extend({}, settings.chosen.options);

        // The width default option is considered the minimum width, so this
        // must be evaluated for every option.
        if (settings.chosen.minimum_width > 0) {
          if ($(element).width() < settings.chosen.minimum_width) {
            options.width = settings.chosen.minimum_width + 'px';
          }
          else {
            options.width = $(element).width() + 'px';
          }
        }

        // Some field widgets have cardinality, so we must respect that.
        // @see chosen_pre_render_select()
        if ($(element).attr('multiple') && $(element).data('cardinality')) {
          options.max_selected_options = $(element).data('cardinality');
        }

        return options;
      };

      // Process elements that have opted-in for Chosen.
      // @todo Remove support for the deprecated chosen-widget class.
      $('select.chosen-enable, select.chosen-widget', context).once('chosen', function() {
        options = getElementOptions(this);
        $(this).chosen(options);
      });

      $(selector, context)
        // Disabled on:
        // - Field UI
        // - WYSIWYG elements
        // - Tabledrag weights
        // - Elements that have opted-out of Chosen
        // - Elements already processed by Chosen.
        .not('#field-ui-field-overview-form select, #field-ui-display-overview-form select, .wysiwyg, .draggable select[name$="[weight]"], .draggable select[name$="[position]"], .chosen-disable, .chosen-processed')
        .filter(function() {
          // Filter out select widgets that do not meet the minimum number of
          // options.
          var minOptions = $(this).attr('multiple') ? settings.chosen.minimum_multiple : settings.chosen.minimum_single;
          if (!minOptions) {
            // Zero value means no minimum.
            return true;
          }
          else {
            return $(this).find('option').length >= minOptions;
          }
        })
        .once('chosen', function() {
          options = getElementOptions(this);
          $(this).chosen(options);
        });
    }
  };
})(jQuery);
;
