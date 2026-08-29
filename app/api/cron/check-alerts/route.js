import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma"; // adjust relative path to match your project structure
import { sendPushToToken } from "../../../../lib/firebaseAdmin";

const USGS_BASE = "https://earthquake.usgs.gov/fdsnws/event/1/query";
const OPENWEATHER_FORECAST_BASE = "https://api.openweathermap.org/data/2.5/forecast";

const MIN_MAGNITUDE = Number(process.env.EARTHQUAKE_MIN_MAGNITUDE || 4.0);
const POLL_WINDOW_MINUTES = 16; // slightly wider than the 15-min cron interval, avoids gaps
const RAIN_PROBABILITY_THRESHOLD = Number(process.env.RAIN_PROBABILITY_THRESHOLD || 70); // %
const RAIN_SUM_THRESHOLD_MM = Number(process.env.RAIN_SUM_THRESHOLD_MM || 10); // mm/day

async function getOpenWeatherRainForecast(lat, lon) {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) {
    throw new Error("OPENWEATHER_API_KEY is missing");
  }

  const url = `${OPENWEATHER_FORECAST_BASE}?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`OpenWeather forecast returned HTTP ${res.status}`);
  }

  const data = await res.json();
  const list = Array.isArray(data.list) ? data.list : [];
  const todayKey = new Date().toISOString().slice(0, 10);

  const dayEntries = list.filter((item) => {
    const dateKey = new Date(item.dt * 1000).toISOString().slice(0, 10);
    return dateKey === todayKey;
  });

  if (dayEntries.length === 0) {
    return { probability: 0, sumMm: 0 };
  }

  const probability = Math.max(...dayEntries.map((item) => Number(item.pop ?? 0) * 100), 0);
  const sumMm = dayEntries.reduce((total, item) => total + Number(item.rain?.["3h"] ?? 0), 0);

  return {
    probability: Number(probability.toFixed(0)),
    sumMm: Number(sumMm.toFixed(1)),
  };
}

// Great-circle distance between two lat/lon points, in km
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Rough "felt radius" heuristic scaled by magnitude — not a scientific model,
// just a reasonable proxy so a M4 doesn't alert someone 500km away.
function feltRadiusKm(magnitude) {
  return magnitude * 40;
}

export async function GET(req) {
  const requestUrl = new URL(req.url);
  const isLocalDebug = process.env.NODE_ENV !== "production" && !process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  // Protect the endpoint in production, but allow manual local debugging when no secret is configured.
  if (!isLocalDebug && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const testMode = requestUrl.searchParams.get("test") === "1";
  const testClerkId = requestUrl.searchParams.get("clerkId");
  const results = {
    usersChecked: 0,
    earthquakeAlertsSent: 0,
    rainfallAlertsSent: 0,
    testAlertsSent: 0,
    rainfallDebug: [],
    errors: [],
  };

  try {
    const users = await prisma.userAlert.findMany({
      where: {
        fcmToken: { not: null },
        ...(testClerkId ? { clerkId: testClerkId } : {}),
      }, // no point checking users who can't receive a push
    });
    results.usersChecked = users.length;
    if (users.length === 0) return NextResponse.json(results);

    if (testMode) {
      for (const user of users) {
        const pushResult = await sendPushToToken(user.fcmToken, {
          title: "WeatherGPT Alert Test",
          body: "Live alerts are connected and ready to notify you.",
          data: { type: "test" },
          icon: "/icons/rain-192.png",
        });

        if (pushResult.ok) {
          results.testAlertsSent++;
        } else if (pushResult.error?.includes("registration-token-not-registered")) {
          await prisma.userAlert.update({ where: { id: user.id }, data: { fcmToken: null } });
        } else {
          results.errors.push(`test push failed for ${user.clerkId}: ${pushResult.error}`);
        }
      }

      return NextResponse.json(results);
    }

    // ---- 1. Earthquake check (USGS FDSN Event Web Service) ----
    let quakes = [];
    try {
      const endtime = new Date().toISOString();
      const starttime = new Date(Date.now() - POLL_WINDOW_MINUTES * 60 * 1000).toISOString();
      const url =
        `${USGS_BASE}?format=geojson&starttime=${starttime}&endtime=${endtime}` +
        `&minmagnitude=${MIN_MAGNITUDE}&eventtype=earthquake&orderby=time`;

      const quakeRes = await fetch(url, { cache: "no-store" });
      if (!quakeRes.ok) throw new Error(`USGS returned HTTP ${quakeRes.status}`);
      const quakeJson = await quakeRes.json();
      quakes = (quakeJson.features || []).map((f) => ({
        id: f.id,
        mag: f.properties.mag,
        place: f.properties.place,
        time: f.properties.time, // unix ms
        lon: f.geometry.coordinates[0],
        lat: f.geometry.coordinates[1],
      }));
    } catch (e) {
      results.errors.push(`earthquake fetch failed: ${e.message}`);
    }

    if (quakes.length > 0) {
      for (const user of users) {
        const lastAlertedMs = user.lastEarthquakeAlertedAt ? user.lastEarthquakeAlertedAt.getTime() : 0;

        const relevantQuakes = quakes.filter((q) => {
          if (q.time <= lastAlertedMs) return false; // already considered in a previous run
          const distance = haversineKm(user.latitude, user.longitude, q.lat, q.lon);
          return distance <= feltRadiusKm(q.mag);
        });

        if (relevantQuakes.length === 0) continue;

        // Alert on the strongest new quake in range; still advance the dedup
        // marker past all of them so weaker ones in the same batch don't repeat later.
        const strongest = relevantQuakes.reduce((a, b) => (b.mag > a.mag ? b : a));
        const newestTime = Math.max(...relevantQuakes.map((q) => q.time));

        const pushResult = await sendPushToToken(user.fcmToken, {
          title: "🌍 Earthquake Alert",
          body: `M${strongest.mag.toFixed(1)} earthquake near ${strongest.place}. Check on your safety and surroundings.`,
          data: { type: "earthquake", magnitude: String(strongest.mag), place: strongest.place },
          icon: "/icons/earthquake-192.png",
        });

        if (pushResult.ok) {
          results.earthquakeAlertsSent++;
          await prisma.userAlert.update({
            where: { id: user.id },
            data: { lastEarthquakeAlertedAt: new Date(newestTime) },
          });
        } else if (pushResult.error?.includes("registration-token-not-registered")) {
          await prisma.userAlert.update({ where: { id: user.id }, data: { fcmToken: null } });
        }
      }
    }

    // ---- 2. Heavy rainfall check (OpenWeather 5-day forecast) ----
    try {
      for (const user of users) {
        try {
          const forecast = await getOpenWeatherRainForecast(user.latitude, user.longitude);
          const probMax = forecast.probability;
          const sumMm = forecast.sumMm;
          const date = new Date().toISOString().slice(0, 10);

          const isHeavy = probMax >= RAIN_PROBABILITY_THRESHOLD && sumMm >= RAIN_SUM_THRESHOLD_MM;
          if (!isHeavy) {
            results.rainfallDebug.push({
              clerkId: user.clerkId,
              reason: "below_threshold",
              probability: probMax,
              sumMm,
              thresholdProbability: RAIN_PROBABILITY_THRESHOLD,
              thresholdSumMm: RAIN_SUM_THRESHOLD_MM,
            });
            continue;
          }
          if (user.lastRainfallAlertDate === date) {
            results.rainfallDebug.push({ clerkId: user.clerkId, reason: "already_alerted_today", date });
            continue;
          }

          const pushResult = await sendPushToToken(user.fcmToken, {
            title: "🌧️ Heavy Rainfall Alert",
            body: `Heavy rain forecast today (${sumMm}mm, ${probMax}% chance). Flood risk may be elevated — stay alert.`,
            data: { type: "rainfall", precipitation_sum: String(sumMm), probability: String(probMax) },
            icon: "/icons/rain-192.png",
          });

          if (pushResult.ok) {
            results.rainfallAlertsSent++;
            await prisma.userAlert.update({
              where: { id: user.id },
              data: { lastRainfallAlertDate: date },
            });
          } else if (pushResult.error?.includes("registration-token-not-registered")) {
            await prisma.userAlert.update({ where: { id: user.id }, data: { fcmToken: null } });
          }
        } catch (forecastError) {
          results.rainfallDebug.push({ clerkId: user.clerkId, reason: "forecast_error", error: forecastError.message });
        }
      }
    } catch (e) {
      results.errors.push(`rainfall fetch failed: ${e.message}`);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Alert check cron error:", error);
    return NextResponse.json({ error: "Alert check failed", details: error.message }, { status: 500 });
  }
}
