import { NextResponse } from "next/server";

const DAILY_VARS = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "temperature_2m_mean",
  "apparent_temperature_max",
  "apparent_temperature_min",
  "precipitation_sum",
  "rain_sum",
  "snowfall_sum",
  "wind_speed_10m_max",
  "wind_gusts_10m_max",
  "sunshine_duration",
].join(",");

const mean = (arr) => {
  const valid = arr.filter((v) => v != null);
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
};
const sum = (arr) => arr.filter((v) => v != null).reduce((a, b) => a + b, 0);
const safeMax = (arr) => {
  const valid = arr.filter((v) => v != null);
  return valid.length ? Math.max(...valid) : null;
};

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");

    if (!lat || !lon || !start_date || !end_date) {
      return NextResponse.json(
        { error: "lat, lon, start_date, and end_date are required" },
        { status: 400 }
      );
    }

    // Documented /v1/archive endpoint — reanalysis data (ERA5 family), no API key required
    const url =
      `https://archive-api.open-meteo.com/v1/archive` +
      `?latitude=${lat}&longitude=${lon}` +
      `&start_date=${start_date}&end_date=${end_date}` +
      `&daily=${DAILY_VARS}` +
      `&timezone=auto&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm`;

    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();

    if (!res.ok || data.error) {
      return NextResponse.json(
        { error: data.reason || "Failed to fetch historical weather data" },
        { status: res.status && res.status !== 200 ? res.status : 500 }
      );
    }

    const daily = data.daily;
    const n = daily.time.length;

    if (!n) {
      return NextResponse.json({ error: "No data returned for this range" }, { status: 404 });
    }

    // Hottest / coldest day within the range
    let hottestIdx = 0;
    let coldestIdx = 0;
    daily.temperature_2m_max.forEach((v, i) => {
      if (v != null && (daily.temperature_2m_max[hottestIdx] == null || v > daily.temperature_2m_max[hottestIdx])) {
        hottestIdx = i;
      }
    });
    daily.temperature_2m_min.forEach((v, i) => {
      if (v != null && (daily.temperature_2m_min[coldestIdx] == null || v < daily.temperature_2m_min[coldestIdx])) {
        coldestIdx = i;
      }
    });

    // Simple trend: average temp in first half of range vs second half
    const half = Math.floor(n / 2);
    const firstHalfAvg = mean(daily.temperature_2m_mean.slice(0, half));
    const secondHalfAvg = mean(daily.temperature_2m_mean.slice(half));
    const deltaC = firstHalfAvg != null && secondHalfAvg != null ? secondHalfAvg - firstHalfAvg : null;
    const direction =
      deltaC == null ? "unknown" : deltaC > 0.3 ? "warming" : deltaC < -0.3 ? "cooling" : "stable";

    const rainyDays = daily.precipitation_sum.filter((v) => v != null && v > 0.1).length;

    const summary = {
      location: {
        latitude: data.latitude,
        longitude: data.longitude,
        elevation: data.elevation,
        timezone: data.timezone,
      },
      period: { start: start_date, end: end_date, days: n },
      avgMeanTemp: mean(daily.temperature_2m_mean),
      avgMaxTemp: mean(daily.temperature_2m_max),
      avgMinTemp: mean(daily.temperature_2m_min),
      hottestDay: { date: daily.time[hottestIdx], temp: daily.temperature_2m_max[hottestIdx] },
      coldestDay: { date: daily.time[coldestIdx], temp: daily.temperature_2m_min[coldestIdx] },
      totalPrecipitation: sum(daily.precipitation_sum),
      totalRain: sum(daily.rain_sum),
      totalSnowfall: sum(daily.snowfall_sum),
      rainyDays,
      maxWindSpeed: safeMax(daily.wind_speed_10m_max),
      maxWindGust: safeMax(daily.wind_gusts_10m_max),
      totalSunshineHours: sum(daily.sunshine_duration) / 3600,
      trend: { firstHalfAvgTemp: firstHalfAvg, secondHalfAvgTemp: secondHalfAvg, deltaC, direction },
    };

    return NextResponse.json({
      summary,
      daily: {
        time: daily.time,
        temperature_2m_max: daily.temperature_2m_max,
        temperature_2m_min: daily.temperature_2m_min,
        temperature_2m_mean: daily.temperature_2m_mean,
        precipitation_sum: daily.precipitation_sum,
      },
      units: data.daily_units,
    });
  } catch (error) {
    console.error("History API error:", error);
    return NextResponse.json({ error: "Failed to fetch historical weather data" }, { status: 500 });
  }
}