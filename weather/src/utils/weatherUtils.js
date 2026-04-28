export const processForecastData = (forecastData) => {
  const dailyForecasts = {};
  
  forecastData.list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const dateKey = date.toDateString();
    
    if (!dailyForecasts[dateKey]) {
      dailyForecasts[dateKey] = {
        date,
        temps: [],
        weatherConditions: [],
        humidity: [],
        windSpeed: []
      };
    }
    
    dailyForecasts[dateKey].temps.push(item.main.temp);
    dailyForecasts[dateKey].weatherConditions.push(item.weather[0]);
    dailyForecasts[dateKey].humidity.push(item.main.humidity);
    dailyForecasts[dateKey].windSpeed.push(item.wind.speed);
  });
  
  return Object.values(dailyForecasts).map(day => ({
    date: day.date,
    dayOfWeek: day.date.toLocaleDateString('en-US', { weekday: 'short' }),
    dateStr: day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    tempMax: Math.max(...day.temps),
    tempMin: Math.min(...day.temps),
    weather: getMostCommonWeather(day.weatherConditions),
    avgHumidity: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
    avgWindSpeed: (day.windSpeed.reduce((a, b) => a + b, 0) / day.windSpeed.length).toFixed(1)
  }));
};

const getMostCommonWeather = (conditions) => {
  const weatherCounts = {};
  conditions.forEach(condition => {
    const main = condition.main;
    weatherCounts[main] = (weatherCounts[main] || 0) + 1;
  });
  
  let maxCount = 0;
  let mostCommon = conditions[0];
  Object.entries(weatherCounts).forEach(([main, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = conditions.find(c => c.main === main);
    }
  });
  
  return mostCommon;
};

export const getWeatherIconUrl = (iconCode) => {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
};

export const formatTemperature = (temp) => {
  return `${Math.round(temp)}°`;
};

export const formatWindSpeed = (speed) => {
  return `${speed} m/s`;
};

export const formatHumidity = (humidity) => {
  return `${humidity}%`;
};
