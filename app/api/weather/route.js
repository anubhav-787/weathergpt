import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    if (!lat || !lon) {
      return NextResponse.json({ error: "lat/lon required" }, { status: 400 });
    }

    const key = process.env.OPENWEATHER_API_KEY;
    if (!key) {
      return NextResponse.json({ error: "OPENWEATHER_API_KEY is missing" }, { status: 500 });
    }

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;
    const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${key}`;

    // NEW: Open-Meteo forecast — free, no key, gives today's rain probability & expected mm
    // (OpenWeather's 2.5/weather "current conditions" endpoint has no rain-probability field)
    const rainUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_probability_max,precipitation_sum&forecast_days=1&timezone=auto`;

    const [weatherRes, aqiRes, rainRes] = await Promise.all([
      fetch(weatherUrl, { cache: "no-store" }),
      fetch(aqiUrl, { cache: "no-store" }),
      fetch(rainUrl, { cache: "no-store" }),
    ]);

    const weatherData = await weatherRes.json();
    const aqiData = await aqiRes.json();

    if (!weatherRes.ok) {
      return NextResponse.json(
        { error: "Weather API failed", details: weatherData },
        { status: weatherRes.status }
      );
    }
    if (!aqiRes.ok) {
      return NextResponse.json(
        { error: "Air Pollution API failed", details: aqiData },
        { status: aqiRes.status }
      );
    }

    // Rain forecast is best-effort — don't fail the whole response if it errors
    let rainChanceToday = null;
    let rainSumToday = null;
    try {
      const rainData = await rainRes.json();
      if (rainRes.ok) {
        rainChanceToday = rainData.daily?.precipitation_probability_max?.[0] ?? null;
        rainSumToday = rainData.daily?.precipitation_sum?.[0] ?? null;
      }
    } catch (e) {
      console.error("Rain forecast fetch failed (non-fatal):", e);
    }

    const aqi = aqiData.list?.[0]?.main?.aqi ?? null;
    const aqiLabels = { 1: "Good", 2: "Fair", 3: "Moderate", 4: "Poor", 5: "Very Poor" };

    const summary = {
      location: {
        name: weatherData.name,
        country: weatherData.sys?.country,
        lat: weatherData.coord?.lat,
        lon: weatherData.coord?.lon,
        timezoneOffset: weatherData.timezone,
      },
      temperature: weatherData.main?.temp,
      feelsLike: weatherData.main?.feels_like,
      humidity: weatherData.main?.humidity,
      pressure: weatherData.main?.pressure,
      windSpeed: weatherData.wind?.speed,
      windDeg: weatherData.wind?.deg,
      sunrise: weatherData.sys?.sunrise,
      sunset: weatherData.sys?.sunset,
      condition: weatherData.weather?.[0]?.description,
      icon: weatherData.weather?.[0]?.icon,
      aqi,
      aqiLabel: aqi ? aqiLabels[aqi] : "Unknown",
      rainChanceToday, // NEW — percentage, e.g. 68
      rainSumToday,    // NEW — mm expected today, e.g. 12.4
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Weather API error:", error);
    return NextResponse.json({ error: "Failed to fetch weather information" }, { status: 500 });
  }
}
