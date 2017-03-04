(function() {
  var currentMarker;
  var currentMap;

  window.initMap = function initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
    });
    currentMap = map;
    let infowindow = new google.maps.InfoWindow({
      content: document.getElementById('infoBox')
    });
    google.maps.event.addListener(map, 'click', function(event) {
      let marker = new google.maps.Marker({
        position: event.latLng,
        map: map
      });
      google.maps.event.addListener(marker, 'click', function() {
        currentMarker = marker;
        infowindow.open(map, marker);
      });
    });
  };

  $(function(){
    $('#infoForm').submit(function(event) {
      event.preventDefault();
      let $map = $('#map');
      let $data = $map.data();
      const $form = $(this);
      const $title = $('.locationTitle').val();
      const $desc = $('.locationDesc').val();
      const $image = $('.locationImage').val();
      $.ajax({
        method: 'POST',
        url: `/locations/${$data.mapid}`,
        data: {
          title: $title,
          description: $desc,
          image: $image,
          latitude: currentMarker.getPosition().lat(),
          longitude: currentMarker.getPosition().lng()
        }
      }).then();
    });

    let addMarkerCenterMap = function(data){
      var newBoundary = new google.maps.LatLngBounds();
      for (let i = 0; i < data.length; i++){
        var latLng = new google.maps.LatLng(data[i].latitude, data[i].longitude);
        var marker = new google.maps.Marker({
          position: latLng,
          map: currentMap
        });
        newBoundary.extend(marker.position);
      }
      currentMap.fitBounds(newBoundary);
    };
    let $map = $('#map');
    let $data = $map.data();
    $.getJSON(`/locations/?show=maps&mapId=${$data.mapid}`).then(addMarkerCenterMap);
  });
})();

