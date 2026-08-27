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

    // Documented "Current Weather Data" endpoint (2.5) — works on the free tier
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;
    const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${key}`;

    const [weatherRes, aqiRes] = await Promise.all([
      fetch(weatherUrl, { cache: "no-store" }),
      fetch(aqiUrl, { cache: "no-store" }),
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

    const aqi = aqiData.list?.[0]?.main?.aqi ?? null;
    const aqiLabels = { 1: "Good", 2: "Fair", 3: "Moderate", 4: "Poor", 5: "Very Poor" };

    // Fields below map 1:1 to the "Current Weather Data" (2.5/weather) JSON response shape
    const summary = {
      location: {
        name: weatherData.name,
        country: weatherData.sys?.country,
        lat: weatherData.coord?.lat,
        lon: weatherData.coord?.lon,
        timezoneOffset: weatherData.timezone, // seconds from UTC
      },
      temperature: weatherData.main?.temp,
      feelsLike: weatherData.main?.feels_like,
      humidity: weatherData.main?.humidity,
      pressure: weatherData.main?.pressure,
      windSpeed: weatherData.wind?.speed, // m/s (metric units)
      windDeg: weatherData.wind?.deg,
      sunrise: weatherData.sys?.sunrise, // unix UTC
      sunset: weatherData.sys?.sunset,   // unix UTC
      condition: weatherData.weather?.[0]?.description,
      icon: weatherData.weather?.[0]?.icon,
      aqi,
      aqiLabel: aqi ? aqiLabels[aqi] : "Unknown",
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Weather API error:", error);
    return NextResponse.json({ error: "Failed to fetch weather information" }, { status: 500 });
  }
}