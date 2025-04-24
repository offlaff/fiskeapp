let map;
let pins = [];

async function initMap() {
  const { Map } = await google.maps.importLibrary("maps");

  map = new Map(document.getElementById("map"), {
    center: { lat: 59.45682691867532, lng: 6.381019482012794 },
    zoom: 15.5,
  });
  const icon = {
    url: "/balkong.jpg",
    scaledSize: new google.maps.Size(20, 20),
  };
  const kleivaholen = new google.maps.Marker({
    position: new google.maps.LatLng(59.45516506545786, 6.397122390604384),
    map: map,
    draggable: false,
    icon: icon,
  });
  console.log(window.location.href);
  if (window.location.href.endsWith("/add-pins")) {
    map.addListener("click", (event) => {
      console.log(event);
      addPin(event.latLng);
    });
  }

  fetch("/pins")
    .then((a) => {
      return a.json();
    })
    .then((result) => {
      result.forEach((pin) => {
        const marker = new google.maps.Marker({
          position: new google.maps.LatLng(pin.latitude, pin.longitude),
          map: map,
          draggable: true,
        });
      });
    });
}

function addPin(location) {
  const length = parseFloat(prompt("Lengde på fisk:"));
  const weight = parseFloat(prompt("Vekt på fisk:"));
  if (Number.isNaN(length) || Number.isNaN(weight)) return;

  // lag alerts hvis input er feil

  if (length === null || weight === null) return;
  const marker = new google.maps.Marker({
    position: location,
    map: map,
    draggable: true,
  });
  const infoWindow = new google.maps.InfoWindow();
  marker.addListener("click", () => {
    infoWindow.close();
    infoWindow.setContent(marker.getTitle());
    infoWindow.open(marker.getMap(), marker);
  });
  marker.addListener("click", () => {
    infoWindow.open(map, marker);
  });
  savePinToDatabase(location.lat(), location.lng(), length, weight);
}
//
async function savePinToDatabase(lat, lng, length, weight) {
  try {
    const response = await fetch("http://localhost:3000/add-pins", {
      method: "POST",
      credentials: "same-origin",
      mode: "cors",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lat, lng, length, weight }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Pin saved successfully:", data);
  } catch (error) {
    console.error("Failed to save pin:", error);
  }
}

//
