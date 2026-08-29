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

    // OpenWeather's 5-day forecast contains precipitation probability and 3-hour rain totals,
    // which are needed for today's rain chance and expected rainfall.
    const rainUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;

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

    // Rain forecast is best-effort — don't fail the whole response if this one errors
    let rainChanceToday = null;
    let rainSumToday = null;
    try {
      const rainData = await rainRes.json();
      if (rainRes.ok && Array.isArray(rainData.list)) {
        const todayKey = new Date().toISOString().slice(0, 10);
        const todayEntries = rainData.list.filter((item) => {
          const itemDateKey = new Date(item.dt * 1000).toISOString().slice(0, 10);
          return itemDateKey === todayKey;
        });

        if (todayEntries.length > 0) {
          rainChanceToday = Math.max(...todayEntries.map((item) => Number(item.pop ?? 0) * 100), 0);
          rainSumToday = todayEntries.reduce((sum, item) => sum + Number(item.rain?.["3h"] ?? 0), 0);
        }
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
      rainChanceToday,
      rainSumToday,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Weather API error:", error);
    return NextResponse.json({ error: "Failed to fetch weather information" }, { status: 500 });
  }
}
