import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const MODELS = [
  "gemini-3.1-flash-lite-preview",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-live-preview",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
];

export async function POST(req) {
  try {
    const { message, langPref, occupation, businessType, weather, climateTrend } = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is missing" }, { status: 500 });
    }

    const weatherContext = weather
      ? `
Current Weather Information:
Location: ${weather.location ?? "unknown"}
Temperature: ${weather.temperature ?? "unknown"}
Wind Speed: ${weather.windSpeed ?? "unknown"}
Humidity: ${weather.humidity ?? "unknown"}
Weather Condition: ${weather.condition ?? "unknown"}
Sunrise: ${weather.sunrise ?? "unknown"}
Sunset: ${weather.sunset ?? "unknown"}
Air Quality Index: ${weather.aqi ?? "unknown"}
Rain Chance Today: ${weather.rainChanceToday != null ? `${weather.rainChanceToday}%` : "unknown"}
Rain Amount Expected Today: ${weather.rainSumToday != null ? `${weather.rainSumToday} mm` : "unknown"}
`
      : "Weather information is currently unavailable.";

    const trendContext = climateTrend
      ? `
Historical Climate Trend (separate from current weather above — use only for questions about patterns over time):
Location: ${climateTrend.location}
Period: ${climateTrend.period}
Average Temperature: ${climateTrend.avgTemperature}
Hottest Day: ${climateTrend.hottestDay}
Coldest Day: ${climateTrend.coldestDay}
Total Precipitation: ${climateTrend.totalPrecipitation}
Max Wind: ${climateTrend.maxWind}
Trend: ${climateTrend.trend}
`
      : "";

    const prompt = `
You are WeatherGPT, an intelligent weather assistant.

User language: ${langPref}
User occupation: ${occupation}
Business type: ${businessType || "Not applicable"}

${weatherContext}
${trendContext}

User Question:
${message}

Instructions:
1. Answer according to the current weather information provided above.
2. If the user asks about rain today, use "Rain Chance Today" and "Rain Amount Expected Today" above as the authoritative answer — do not guess from the weather condition text alone.
3. If a Historical Climate Trend section is present, use it only for questions about past patterns/trends — do not mix it up with current conditions.
4. Consider the user's occupation when giving practical advice.
5. Do not invent weather values not given above.
6. If weather information is unavailable, clearly say so.
7. Keep the answer practical and easy to understand.
8. Answer in the user's selected language.
`;

    const genAI = new GoogleGenerativeAI(apiKey);

    let reply = null;
    let usedModel = null;

    for (const modelName of MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        reply = result.response.text();
        usedModel = modelName;
        break;
      } catch (err) {
        console.warn(`Model "${modelName}" failed:`, err.message);
      }
    }

    if (!reply) {
      return NextResponse.json({ error: "All models failed. Please try again later." }, { status: 500 });
    }

    console.log(`Responded using model: ${usedModel}`);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}
