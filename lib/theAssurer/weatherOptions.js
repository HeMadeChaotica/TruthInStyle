export const DEFAULT_WEATHER_CITY = 'HOUSTON, TX';

export const WEATHER_CITY_OPTIONS = [
  'HOUSTON, TX',
  'LOS ANGELES, CA',
  'DALLAS, TX',
  'AUSTIN, TX',
  'SAN ANTONIO, TX',
  'NEW ORLEANS, LA',
  'ATLANTA, GA',
  'MIAMI, FL',
  'NEW YORK, NY',
  'CHICAGO, IL',
];

export const WEATHER_CITY_COORDINATES = {
  'HOUSTON, TX': { latitude: 29.7604, longitude: -95.3698 },
  'LOS ANGELES, CA': { latitude: 34.0522, longitude: -118.2437 },
  'DALLAS, TX': { latitude: 32.7767, longitude: -96.7970 },
  'AUSTIN, TX': { latitude: 30.2672, longitude: -97.7431 },
  'SAN ANTONIO, TX': { latitude: 29.4241, longitude: -98.4936 },
  'NEW ORLEANS, LA': { latitude: 29.9511, longitude: -90.0715 },
  'ATLANTA, GA': { latitude: 33.7490, longitude: -84.3880 },
  'MIAMI, FL': { latitude: 25.7617, longitude: -80.1918 },
  'NEW YORK, NY': { latitude: 40.7128, longitude: -74.0060 },
  'CHICAGO, IL': { latitude: 41.8781, longitude: -87.6298 },
};

const WEATHER_CODE_LABELS = {
  0: 'CLEAR',
  1: 'MAINLY CLEAR',
  2: 'PARTLY CLOUDY',
  3: 'MOSTLY CLOUDY',
  45: 'FOG',
  48: 'FOG',
  51: 'LIGHT DRIZZLE',
  53: 'DRIZZLE',
  55: 'HEAVY DRIZZLE',
  61: 'LIGHT RAIN',
  63: 'RAIN',
  65: 'HEAVY RAIN',
  71: 'LIGHT SNOW',
  73: 'SNOW',
  75: 'HEAVY SNOW',
  80: 'LIGHT SHOWERS',
  81: 'SHOWERS',
  82: 'HEAVY SHOWERS',
  95: 'THUNDERSTORM',
  96: 'THUNDERSTORM',
  99: 'THUNDERSTORM',
};

function buildWeatherUrl({ latitude, longitude }) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,wind_speed_10m',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    timezone: 'auto',
  });

  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

function roundWeatherNumber(value) {
  return Number.isFinite(value) ? Math.round(value) : null;
}

export function getWeatherCodeLabel(weatherCode) {
  return WEATHER_CODE_LABELS[weatherCode] || 'WEATHER MOVING STRANGE';
}

export async function fetchAssurerWeather(coordinates) {
  const response = await fetch(buildWeatherUrl(coordinates));

  if (!response.ok) {
    throw new Error('Weather request failed');
  }

  const forecast = await response.json();
  const current = forecast?.current;

  if (!current) {
    throw new Error('Weather response missing current conditions');
  }

  return {
    temperature: roundWeatherNumber(current.temperature_2m),
    feelsLike: roundWeatherNumber(current.apparent_temperature),
    humidity: roundWeatherNumber(current.relative_humidity_2m),
    wind: roundWeatherNumber(current.wind_speed_10m),
    condition: getWeatherCodeLabel(current.weather_code),
  };
}
