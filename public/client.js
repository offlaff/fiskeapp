let pins = [];
let map = null;
let templocation = 0;
const zoomLevel = 15.5;
let markers = [];
let user = null;
const clusterGroup = new L.MarkerClusterGroup({
  zoomToBoundsOnClick: true,
  showCoverageOnHover: false,
  maxClusterRadius: 80,
});

function initMap() {
  const northEast = L.latLng(59.462346, 6.40663);
  const southWest = L.latLng(59.451664, 6.360802);
  map = L.map("map", {
    zoomControl: false,
    maxBounds: L.latLngBounds(southWest, northEast),
    minZoom: 14,
  }).setView([59.456599116158394, 6.3862352690536195], zoomLevel);

  // map.touchZoom.disable(); disable for telefonbrukerar?
  map.doubleClickZoom.disable();
  // map.scrollWheelZoom.disable();
  map.boxZoom.disable();
  map.keyboard.disable();
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  executeSearch();
  map.on("click", onMapClick);
}
initMap();

async function getMe() {
  const response = await fetch("/users/me", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  const data = await response.json();
  console.log(data);
  if (data.username) {
    user = data;
  } else {
    console.log("is not logged in");
  }
}
getMe();
function getPins() {
  fetch("/pins")
    .then((a) => {
      return a.json();
    })
    .then((result) => {
      pins = result;
      onGotPins();
    });
}

function onGotPins() {
  pins.forEach((pin) => {
    // addMarker(pin);
    addTableRow(pin);
  });
}

function addTableRow(pin) {
  console.log(pin);

  const table = document.getElementById("salmon-table-body");
  const editButton = `<a href="/edit/${pin.id}" class="btn btn-warning btn-sm edit-btn loggedIn" data-id="${pin.id}">Rediger</a>`;
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${pin.name}</td>
    <td>${pin.weight}</td>
    <td>${pin.length}</td>
    <td>${pin.bait}</td>
    <td>${pin.date}</td>
    <td>
  ${
    pin.image
      ? `<a href="/images/${pin.image}" target="_blank">
           <img style="width: 75px; height: 75px; object-fit: contain;" src="/images/${pin.image}">
         </a>`
      : "Ingen bilde"
  }
</td>
    <td class="loggedIn">${editButton}</td>
  `;
  table.appendChild(row);
}

document.getElementById("salmon-table-body").addEventListener("click", (e) => {
  const clickedEle = e.target;
  if (clickedEle.matches("button.edit-btn")) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    const pinId = clickedEle.dataset.id;
    window.location.href = `/edit/${pinId}`;
  }
});

function addMarker(pin) {
  const marker = L.marker([pin.latitude, pin.longitude]);
  const markerIcon = marker.options.icon;
  const iconSize = 20;
  markerIcon.options.shadowSize = [0, 0];
  markerIcon.options.iconAnchor = [9, 20];
  markerIcon.options.iconSize = [iconSize * 0.7, iconSize];
  marker.setIcon(markerIcon);
  console.log(marker);
  markers.push(marker);
  marker.bindPopup(
    `🐟 <br>Lengde: ${pin.length} <br> Vekt: ${pin.weight}
     <br> Agn: ${pin.bait} 
     <br> Fisker: ${pin.name} 
     <br> Dato: ${pin.date}
     <br> <a href ="/images/${pin.image}" target="_blank">
     <td>
  ${
    pin.image
      ? `<a href="/images/${pin.image}" target="_blank">
           <img style="width: 75px; height: 75px; object-fit: contain;" src="/images/${pin.image}">
         </a>`
      : ""
  }
</td>
     </a>`
  );
}

let tempLocation = null;

function onMapClick(location) {
  if (!user) {
    return;
  }
  tempLocation = location.latlng;

  const modalElement = document.querySelector(".modal");
  // modalElement.style.display = "block";
}
document.getElementById("saveBtn").addEventListener("click", () => {
  if (!tempLocation) return;

  const image = document.getElementById("image").files[0];

  const createdMarker = {
    latitude: tempLocation.lat,
    longitude: tempLocation.lng,
    name: document.getElementById("name").value,
    weight: document.getElementById("weight").value,
    length: document.getElementById("length").value,
    bait: document.getElementById("bait").value,
    date: document.getElementById("date").value,
    image: image,
    baitInfo: document.getElementById("baitInfo").value,
  };

  savePinToDatabase(createdMarker);

  document.querySelector(".modal").style.display = "none";
  tempLocation = null;
});

async function savePinToDatabase({
  latitude,
  longitude,
  length,
  weight,
  bait,
  name,
  date,
  image,
  baitInfo,
}) {
  try {
    const formData = new FormData();
    formData.append("lat", latitude);
    formData.append("lng", longitude);
    formData.append("length", length);
    formData.append("weight", weight);
    formData.append("bait", bait);
    formData.append("name", name);
    formData.append("date", date);
    formData.append("baitInfo", baitInfo);
    if (image) {
      formData.append("image", image);
    }
    const response = await fetch("/pins/add-pins", {
      method: "POST",
      credentials: "same-origin",
      mode: "cors",
      cache: "no-cache",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Pin saved successfully:", formData);
    return formData;
  } catch (error) {
    console.error("Failed to save pin:", error);
  }
}

const closeBtn1 = document.querySelector(".close");
const closeBtn2 = document.querySelector(".closebtn");

function closeBtnClick() {
  const modalElement = document.querySelector(".modal");
  modalElement.style.display = "none";
}
closeBtn1.addEventListener("click", closeBtnClick);
closeBtn2.addEventListener("click", closeBtnClick);

async function executeSearch() {
  const searchInput = document.getElementById("searchInput").value;
  const token = localStorage.getItem("token");
  const input2024 = document.querySelector("#input2024");
  const input2025 = document.querySelector("#input2025");
  const years = [];
  if (input2024.checked) {
    years.push(2024);
  }
  if (input2025.checked) {
    years.push(2025);
  }
  console.log(years);
  const response = await fetch("/pins/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ search: searchInput, year: years }),
  });

  const data = await response.json();
  const results = data.results;

  const tableBody = document.getElementById("salmon-table-body");
  tableBody.innerHTML = "";
  markers.forEach((marker) => {
    clusterGroup.removeLayer(marker);
  });
  map.removeLayer(clusterGroup);
  markers = [];
  if (results.length === 0) {
    tableBody.innerHTML = `<tr><td>Ingen resultat</td></tr>`;
  } else {
    results
      .sort((a, b) => b.weight - a.weight)
      .forEach((pin) => {
        addTableRow(pin);
        addMarker(pin);
      });
    markers.forEach((clusterItem) => {
      clusterGroup.addLayer(clusterItem);
    });
    map.addLayer(clusterGroup);
    hideLoggedInElements();
  }
}

document
  .getElementById("searchButton")
  .addEventListener("click", executeSearch);
