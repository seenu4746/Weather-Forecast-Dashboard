const API_KEY = "363f4a36112f54b1be084d0fc08165e1";

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const recentCities = document.getElementById("recentCities");
const errorMsg = document.getElementById("errorMsg");

const cityHeader = document.getElementById("cityHeader");
const fiveColumns = document.getElementById("fiveColumns");

const cityNameEl = document.getElementById("cityName");
const dateEl = document.getElementById("date");
const tempEl = document.getElementById("temp");
const feelsLikeEl = document.getElementById("feelsLike");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const iconEl = document.getElementById("icon");
const forecastEl = document.getElementById("forecast");
const unitToggle = document.getElementById("unitToggle");

let isCelsius = true;
let currentTemp = 0;

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove("hidden");
}

function clearError() {
  errorMsg.classList.add("hidden");
}

function saveCity(city) {
  let cities = JSON.parse(localStorage.getItem("cities")) || [];
  if (!cities.includes(city)) {
    cities.unshift(city);
    localStorage.setItem("cities", JSON.stringify(cities.slice(0, 5)));
  }
  loadCities();
}

function loadCities() {
  const cities = JSON.parse(localStorage.getItem("cities")) || [];
  if (cities.length === 0) return;

  recentCities.innerHTML = "";
  recentCities.classList.remove("hidden");

  cities.forEach(c => {
    const option = document.createElement("option");
    option.value = c;
    option.textContent = c;
    recentCities.appendChild(option);
  });
}

async function fetchWeather(url) {
  try {
    clearError();
    const res = await fetch(url);
    if (!res.ok) throw new Error("Invalid city name");
    const data = await res.json();
    displayCurrent(data);
    fetchForecast(data.coord.lat, data.coord.lon);
    saveCity(data.name);
  } catch (err) {
    showError(err.message);
  }
}

function displayCurrent(data) {
  cityHeader.classList.remove("hidden");
  fiveColumns.classList.remove("hidden");

  cityNameEl.textContent = data.name;
  dateEl.textContent = new Date().toDateString();

  currentTemp = data.main.temp;
  tempEl.textContent = `${currentTemp} °C`;
  feelsLikeEl.textContent = `${data.main.feels_like} °C`;
  humidityEl.textContent = `${data.main.humidity}%`;
  windEl.textContent = `${data.wind.speed} m/s`;

  iconEl.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

  if (currentTemp > 40) {
    showError("⚠ Extreme heat alert!");
  }

  changeBackground(data.weather[0].main);
}

async function fetchForecast(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
  const res = await fetch(url);
  const data = await res.json();

  forecastEl.innerHTML = "";
  const days = data.list.filter((_, i) => i % 8 === 0).slice(0, 5);

  days.forEach(day => {
    const card = document.createElement("div");
    card.className = "bg-gray-100 p-3 rounded text-center";
    card.innerHTML = `
      <p>${new Date(day.dt_txt).toDateString()}</p>
      <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" class="mx-auto"/>
      <p>Temp: ${day.main.temp} °C</p>
      <p>Wind: ${day.wind.speed}</p>
      <p>Humidity: ${day.main.humidity}%</p>
    `;
    forecastEl.appendChild(card);
  });
}

function changeBackground(condition) {
  document.body.className = "";
  if (condition === "Rain") document.body.classList.add("rain");
  else if (condition === "Clouds") document.body.classList.add("clouds");
  else document.body.classList.add("clear");
}

searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (!city) {
    showError("Please enter a city name");
    return;
  }
  fetchWeather(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
  );
});

locationBtn.addEventListener("click", () => {
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    fetchWeather(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
    );
  });
});

recentCities.addEventListener("change", e => {
  fetchWeather(
    `https://api.openweathermap.org/data/2.5/weather?q=${e.target.value}&appid=${API_KEY}&units=metric`
  );
});

unitToggle.addEventListener("click", () => {
  if (isCelsius) {
    tempEl.textContent = `${(currentTemp * 9) / 5 + 32} °F`;
    unitToggle.textContent = "°C";
  } else {
    tempEl.textContent = `${currentTemp} °C`;
    unitToggle.textContent = "°F";
  }
  isCelsius = !isCelsius;
});

loadCities();
