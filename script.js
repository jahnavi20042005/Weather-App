const WEATHER_API_KEY = "b76023d35ed31c94d5a0d7225fd646ab"; 
const UNSPLASH_KEY = "X5dLxgtd3K5g1J8TV4pKpuoO8aRvJYAw_SuqcaTC7F8";

const weatherResult = document.getElementById("weatherResult");
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const forecastResult = document.getElementById("forecastResult");
const citySuggestions = document.getElementById("citySuggestions");

// Weather condition → Emoji mapping
const weatherIcons = {
  Clear: "☀️",
  Clouds: "☁️",
  Rain: "🌧️",
  Drizzle: "🌦️",
  Thunderstorm: "⛈️",
  Snow: "❄️",
  Mist: "🌫️",
  Smoke: "💨",
  Haze: "🌁",
  Dust: "🌪️",
  Fog: "🌫️",
  Sand: "🏜️",
  Ash: "🌋",
  Squall: "💨",
  Tornado: "🌪️"
};

// === EVENT LISTENERS ===
// Autocomplete input listener
cityInput.addEventListener("input", debounce(async (e) => {
  const query = e.target.value.trim();
  if (query.length > 2) await fetchCitySuggestions(query);
  else citySuggestions.innerHTML = "";
}, 300));

// Click on suggestion
citySuggestions.addEventListener("click", (e) => {
  if (e.target.tagName === 'LI') {
    cityInput.value = e.target.dataset.cityName;
    citySuggestions.innerHTML = "";
    triggerWeatherSearch(e.target.dataset.cityName);
  }
});

searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) {
    citySuggestions.innerHTML = "";
    triggerWeatherSearch(city);
  }
});

locationBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    weatherResult.innerHTML = `<p>Loading...</p>`;
    forecastResult.innerHTML = "";
    citySuggestions.innerHTML = "";

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        getWeatherByCoords(lat, lon);
        getForecastByCoords(lat, lon); 
      },
      () => {
        weatherResult.innerHTML = `<p class="error">❌ Location access denied.</p>`;
        document.body.style.backgroundImage = "";
      }
    );
  } else {
    weatherResult.innerHTML = `<p class="error">❌ Geolocation not supported.</p>`;
    document.body.style.backgroundImage = "";
  }
});

// === WEATHER FETCH HELPERS ===

function triggerWeatherSearch(city) {
  weatherResult.innerHTML = `<p>Loading...</p>`;
  forecastResult.innerHTML = "";
  getWeatherByCity(city);
  getForecastByCity(city);
}

async function getWeatherByCity(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric`;
  fetchWeather(url);
}

async function getWeatherByCoords(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;
  fetchWeather(url);
}

async function fetchWeather(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Weather not found");
    const data = await response.json();
    const { name, main, weather, wind, sys } = data;
    const condition = weather[0].main;
    const icon = weatherIcons[condition] || "🌍";
    updateBackground(condition);
    const formatTime = (timestamp) =>
      new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    weatherResult.innerHTML = `
      <div class="card">
        <h2>${icon} ${name}</h2>
        <p style="text-transform: capitalize;">${weather[0].description}</p>
        <p><strong>🌡 Temp:</strong> ${main.temp.toFixed(1)}°C | <strong>💧 Humidity:</strong> ${main.humidity}%</p>
        <p><strong>🤔 Feels Like:</strong> ${main.feels_like.toFixed(1)}°C | <strong>💨 Wind:</strong> ${wind.speed.toFixed(1)} m/s</p>
        <p><strong>☀️ Sunrise:</strong> ${formatTime(sys.sunrise)} | <strong>🌙 Sunset:</strong> ${formatTime(sys.sunset)}</p>
      </div>
    `;
  } catch (err) {
    weatherResult.innerHTML = `<p class="error">❌ Unable to fetch weather.</p>`;
    document.body.style.backgroundImage = "";
  }
}

// === FORECAST FUNCTIONS ===

async function getForecastByCity(city) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${WEATHER_API_KEY}&units=metric`;
  fetchForecast(url);
}

async function getForecastByCoords(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;
  fetchForecast(url);
}

async function fetchForecast(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Forecast not found");
    const data = await response.json();
    const dailyForecasts = data.list.filter(item => item.dt_txt.includes("12:00:00"));
    forecastResult.innerHTML = "";

    const getDayName = (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    };

    for (const day of dailyForecasts) {
      const { main, weather, dt_txt } = day;
      const condition = weather[0].main;
      const icon = weatherIcons[condition] || "🌍";

      const forecastCard = document.createElement('div');
      forecastCard.className = 'forecast-card';
      forecastCard.innerHTML = `
        <p class="day">${getDayName(dt_txt)}</p>
        <p class="icon">${icon}</p>
        <p class="temp">${Math.round(main.temp)}°C</p>
        <p>${condition}</p>
      `;
      forecastResult.appendChild(forecastCard);
    }

  } catch (err) {
    console.error("Failed to fetch forecast:", err);
    forecastResult.innerHTML = `<p class="error" style="font-size: 0.9rem;">Forecast unavailable.</p>`;
  }
}

// === UNSPLASH BACKGROUND ===

async function updateBackground(condition) {
  let query = "weather";
  switch (condition) {
    case "Clear": query = "sunny"; break;
    case "Clouds": query = "cloudy"; break;
    case "Rain": query = "rain"; break;
    case "Drizzle": query = "drizzle"; break;
    case "Thunderstorm": query = "thunderstorm"; break;
    case "Snow": query = "snow"; break;
    case "Mist":
    case "Fog":
    case "Haze":
    case "Smoke": query = "mist"; break;
    default: query = "weather"; break;
  }

  try {
    const res = await fetch(`https://api.unsplash.com/photos/random?query=${query}&orientation=landscape&client_id=${UNSPLASH_KEY}`);
    const data = await res.json();
    const imgUrl = data.urls.full;
    document.body.style.backgroundImage = `url('${imgUrl}')`;
  } catch (err) {
    console.error("Unsplash fetch failed", err);
    document.body.style.backgroundImage = "";
  }
}

// === AUTOCOMPLETE FUNCTIONS ===

async function fetchCitySuggestions(query) {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${WEATHER_API_KEY}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch city suggestions");
    const cities = await response.json();
    displayCitySuggestions(cities);
  } catch (error) {
    console.error("Error fetching city suggestions:", error);
    citySuggestions.innerHTML = "";
  }
}

function displayCitySuggestions(cities) {
  citySuggestions.innerHTML = "";
  if (cities.length === 0) return;

  cities.forEach(city => {
    const li = document.createElement("li");
    let displayName = city.name;
    if (city.state) displayName += `, ${city.state}`;
    if (city.country) displayName += ` (${city.country})`;
    li.textContent = displayName;
    li.dataset.cityName = city.name;
    citySuggestions.appendChild(li);
  });
}

// === DEBOUNCE FUNCTION ===

function debounce(func, delay) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}
