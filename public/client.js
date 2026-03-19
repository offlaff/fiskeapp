let pins = [];
let map = null;
let templocation = 0;
const zoomLevel = 15.5;
let markers = [];
let user = null;
const site = window.location.pathname.split("/")[2];

const myFetch = (url, config) => {
  const modifiedUrl = `/s/${site}${url}`;
  return fetch(modifiedUrl, config);
};

const clusterGroupOptions = {
  zoomToBoundsOnClick: true,
  showCoverageOnHover: false,
  maxClusterRadius: 80,
};

const clusterGroup = new L.MarkerClusterGroup({
  ...clusterGroupOptions,
});

function initMap() {
  const northEast = L.latLng(...window.coords.northeast);
  const southWest = L.latLng(...window.coords.southwest);
  map = L.map("map", {
    zoomControl: false,
    maxBounds: L.latLngBounds(southWest, northEast),
    minZoom: 14,
  }).setView(window.coords.center, zoomLevel);

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
  map.on("click", onMapClick);
}
async function start() {
  initMap();
  await getMe();
  await executeSearch();
}
start();

async function getMe() {
  const response = await myFetch("/users/me", {
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

function getPins() {
  myFetch("/pins")
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

function capitalizeFirstLetter(str) {
  if (str.length === 0) {
    return ""; // Handle empty strings
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function addTableRow(pin) {
  console.log(pin);

  const table = document.getElementById("salmon-table-body");
  const editButton =
    user && user.role === "admin"
      ? `<a href="/s/${site}/edit/${pin.id}" class="btn btn-warning btn-sm edit-btn loggedIn" data-id="${pin.id}">Rediger</a>`
      : "";
  const row = document.createElement("tr");
  const date = new Date(pin.date);
  const isSmallScreen = window.innerWidth < 700;
  const formatted = new Intl.DateTimeFormat(
    "no-NB",
    isSmallScreen
      ? {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        }
      : {
          dateStyle: "full",
        },
  ).format(date);
  row.innerHTML = `
    <td>${pin.name}</td>
    <td>${pin.weight}</td>
    <td>${pin.length}</td>

    <td><div style="display: flex; flex-direction: column;"><span>${capitalizeFirstLetter(pin.bait)}</span> ${pin.baitInfo ? `<span class="text-muted">${capitalizeFirstLetter(pin.baitInfo)}</span>` : ""}</div></td>
    
    <td class="date">${capitalizeFirstLetter(formatted)}</td>
    <td>
  ${
    pin.image
      ? `<a href="${pin.image}" target="_blank">
           <img style="width: 75px; height: 75px; object-fit: cover;" src="${pin.image}">
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
  if (clickedEle.matches(".edit-btn")) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = `/s/${site}/login`;
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
  const date = new Date(pin.date);
  const formatted = new Intl.DateTimeFormat("no-NB", {
    dateStyle: "full",
  }).format(date);
  marker.bindPopup(
    `<div style="display: flex; gap: 1rem; "> ${
      pin.image
        ? `<a href="${pin.image}" target="_blank">
           <img style="width: 75px; height: 75px; object-fit: contain; margin: auto;" src="${pin.image}">
         </a>`
        : ""
    }
    <table class="popupTable"> 
     <tr>
        <td class="light-text">Vekt:</td>
        <td><strong>${pin.weight}kg</strong></td>
        </tr>
        <tr>
        <td class="light-text">Lengde:</td>
        <td>${pin.length}cm</td>
        </tr>
       
        <tr>
        <td class="light-text">Agn:</td>
        <td>${capitalizeFirstLetter(pin.bait)}</td>
        </tr>
        <tr>
        <td class="light-text">Fisker:</td>
        <td>${pin.name}</td>
        </tr>
        <tr>
        <td class="light-text">Dato:</td>
        <td>${capitalizeFirstLetter(formatted)}</td>
        </tr>
    </table>
    </div>
    `,
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
document.getElementById("saveBtn").addEventListener("click", async () => {
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

  await savePinToDatabase(createdMarker);
  await executeSearch();

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
    const response = await myFetch("/pins/add-pins", {
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
  const input2026 = document.querySelector("#input2026");
  const years = [];
  if (input2024.checked) {
    years.push(2024);
  }
  if (input2025.checked) {
    years.push(2025);
  }
  if (input2026.checked) {
    years.push(2026);
  }

  const response = await myFetch("/pins/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ search: searchInput, year: years }),
  });
  const data = await response.json();
  if (!response.ok) {
    console.error("Search failed:", data);
    return;
  }

  const results = data.results || [];
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
    getAvgWeight(results);
    hideLoggedInElements();
  }
}

function getAvgWeight(pinsList) {
  let avgEl = document.getElementById("avgWeight");
  const numbers = pinsList
    .map((pin) => Number(pin.weight))
    .filter((num) => Number.isFinite(num));

  if (numbers.length === 0) {
    avgEl.textContent = "Snittvekt: —";
    return;
  }

  const sum = numbers.reduce((a, b) => a + b, 0);
  const avg = sum / numbers.length;

  avgEl.textContent = `Snittvekt: ${avg.toFixed(2)}kg`;
}

document
  .getElementById("searchButton")
  .addEventListener("click", executeSearch);
