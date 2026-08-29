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

// Shown when Gemini itself declines an off-topic question — one per supported language,
// so the refusal still feels native rather than dropping into English unexpectedly.
const OFF_TOPIC_REPLIES = {
  English: "I'm WeatherGPT — I can only help with weather, climate, and related safety questions. Please ask me something about the weather, forecast, air quality, or climate trends.",
  Hindi: "मैं WeatherGPT हूँ — मैं केवल मौसम, जलवायु और संबंधित सुरक्षा से जुड़े सवालों में मदद कर सकता हूँ। कृपया मुझसे मौसम, पूर्वानुमान, वायु गुणवत्ता या जलवायु रुझान के बारे में कुछ पूछें।",
  Malayalam: "ഞാൻ WeatherGPT ആണ് — എനിക്ക് കാലാവസ്ഥ, ജലവായു, ബന്ധപ്പെട്ട സുരക്ഷാ ചോദ്യങ്ങൾക്ക് മാത്രമേ സഹായിക്കാൻ കഴിയൂ. ദയവായി കാലാവസ്ഥ, പ്രവചനം, വായു ഗുണനിലവാരം അല്ലെങ്കിൽ കാലാവസ്ഥാ പ്രവണതകളെക്കുറിച്ച് എന്തെങ്കിലും ചോദിക്കുക.",
  Marathi: "मी WeatherGPT आहे — मी फक्त हवामान, हवामान बदल आणि संबंधित सुरक्षिततेच्या प्रश्नांमध्ये मदत करू शकतो. कृपया हवामान, अंदाज, हवेची गुणवत्ता किंवा हवामान कलाबद्दल काहीतरी विचारा.",
  Urdu: "میں WeatherGPT ہوں — میں صرف موسم، آب و ہوا اور متعلقہ حفاظتی سوالات میں مدد کر سکتا ہوں۔ براہ کرم موسم، پیش گوئی، ہوا کے معیار یا موسمی رجحان کے بارے میں کچھ پوچھیں۔",
};

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

    const offTopicReply = OFF_TOPIC_REPLIES[langPref] || OFF_TOPIC_REPLIES.English;

    const prompt = `
You are WeatherGPT, a specialized assistant that ONLY answers questions about weather, climate, and directly related safety/planning topics.

SCOPE RULE — READ CAREFULLY:
Before answering, decide if the user's question is about ANY of the following:
- Current or forecasted weather (temperature, rain, wind, humidity, sunrise/sunset, storms, etc.)
- Air quality / AQI
- Climate trends or historical weather patterns
- Weather-driven safety or planning advice relevant to the user's stated occupation
  (e.g. a farmer asking about irrigation timing given rain forecast, a fisherman asking if it's safe to go out today,
  a pilot asking about visibility/wind for flying, general advice like "should I carry an umbrella")
- Natural hazards tied to weather/climate (cyclones, floods, heatwaves, earthquakes if relevant to safety)

If the question is about ANY of the above, answer normally and helpfully using the data provided below.

If the question is NOT about any of the above (e.g. general knowledge, coding, entertainment, politics, math,
personal advice unrelated to weather, or anything else outside this scope), do NOT answer it.
Instead, reply with EXACTLY this message and nothing else:
"${offTopicReply}"

Do not explain why you are declining beyond that message. Do not apologize repeatedly. Just return that exact message for off-topic questions.

User language: ${langPref}
User occupation: ${occupation}
Business type: ${businessType || "Not applicable"}

${weatherContext}
${trendContext}

User Question:
${message}

Instructions for on-topic answers:
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
