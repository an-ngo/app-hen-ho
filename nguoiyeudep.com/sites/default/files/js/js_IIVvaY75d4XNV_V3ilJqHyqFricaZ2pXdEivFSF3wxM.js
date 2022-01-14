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
