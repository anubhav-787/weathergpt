import React, { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { useUser } from "@clerk/nextjs";
import {
    Mic,
    Thermometer,
    Wind,
    Sunrise,
    Sunset,
    Leaf,
    CalendarDays,
    TrendingUp,
    TrendingDown,
    Minus,
    CloudRain,
    Loader2,
    History,
    BellRing,
} from "lucide-react";
import {
    listenForForegroundMessages,
    requestNotificationPermission,
} from "../lib/firebaseClient";

// ---------------------------------------------------------
// LANGUAGE NAMES
// Stored values remain: en, hi, ml, ma, ur
// ---------------------------------------------------------

const LANG_NAMES = {
    en: "English",
    hi: "Hindi",
    ml: "Malayalam",
    ma: "Marathi",
    ur: "Urdu",
};

// ---------------------------------------------------------
// LOCALES
// Used for date/time formatting
// ---------------------------------------------------------

const LOCALES = {
    en: "en-IN",
    hi: "hi-IN",
    ml: "ml-IN",
    ma: "mr-IN",
    ur: "ur-IN",
};

// ---------------------------------------------------------
// TRANSLATIONS
// ---------------------------------------------------------

const TRANSLATIONS = {
    en: {
        chooseLanguage: "Choose Language",
        whatDoYouDo: "What do you do?",
        continue: "Continue",

        farmer: "Farmer",
        businessOwner: "Business Owner",
        aviation: "Aviation",
        fisherman: "Fisherman",
        generalCitizen: "General Citizen",
        disasterManagement: "Disaster Management",

        currentWeather: "Current Weather",
        loadingWeather: "Loading current weather...",
        locationRequired:
            "Location permission is required to show local weather.",
        geolocationUnsupported:
            "Geolocation is not supported by this browser.",
        unableWeather: "Unable to load weather.",

        temperature: "Temperature",
        feels: "Feels",
        wind: "Wind",
        sunrise: "Sunrise",
        sunset: "Sunset",
        airQuality: "Air Quality",
        openWeatherAQI: "OpenWeather AQI",

        extremeAlerts: "Extreme Weather Alerts",
        extremeDescription:
            "Get a push notification if a significant earthquake happens near your location, or if heavy rainfall is forecast for today.",
        enableLiveAlerts: "Enable live alerts",
        liveAlertsOn: "Live alerts are on ✅",

        alertEnabled:
            "🔔 Earthquake & heavy-rain alerts enabled for your location.",
        locationSaved:
            "📍 Location saved. Enable notifications for live alerts.",
        notificationDenied:
            "Notification permission was not granted, so live alerts are off.",
        alertRetry:
            "Couldn't set up alerts right now — will retry next visit.",

        climateTrend: "Climate Trend & Historical Analysis",
        startDate: "Start date",
        endDate: "End date",
        loading: "Loading...",
        analyze: "Analyze",

        last14Days: "Last 14 days",
        last30Days: "Last 30 days",
        last90Days: "Last 90 days",
        last12Months: "Last 12 months",

        latitudeLongitudeRequired:
            "Latitude, longitude, start date and end date are all required.",

        avgTemp: "Avg Temp",
        max: "max",
        min: "min",
        precipitation: "Precipitation",
        rainyDays: "rainy day(s)",
        maxWind: "Max Wind",
        gust: "gust",

        hottestDay: "Hottest day",
        coldestDay: "Coldest day",
        meanTemperatureTrend: "Mean temperature trend",

        firstHalfSecondHalf: "1st half vs 2nd half of period",
        includeTrend:
            "Include this trend summary when I ask the assistant a question",

        personalizedFor: "Personalized for",
        trendDataIncluded: "Trend data included",

        listening: "Listening...",
        askSomething: "Ask something...",
        stop: "stop",
        send: "Send",
        sending: "Sending...",

        speechNotSupported:
            "Speech Recognition not supported in this browser",

        you: "You",

        businessPlaceholder:
            "e.g. Agri supplies, Logistics",

        warming: "Warming",
        cooling: "Cooling",
        stable: "Stable",
    },

    hi: {
        chooseLanguage: "भाषा चुनें",
        whatDoYouDo: "आप क्या करते हैं?",
        continue: "जारी रखें",

        farmer: "किसान",
        businessOwner: "व्यवसायी",
        aviation: "विमानन",
        fisherman: "मछुआरा",
        generalCitizen: "सामान्य नागरिक",
        disasterManagement: "आपदा प्रबंधन",

        currentWeather: "वर्तमान मौसम",
        loadingWeather: "वर्तमान मौसम लोड हो रहा है...",
        locationRequired:
            "स्थानीय मौसम दिखाने के लिए स्थान की अनुमति आवश्यक है।",
        geolocationUnsupported:
            "इस ब्राउज़र में स्थान सुविधा उपलब्ध नहीं है।",
        unableWeather: "मौसम लोड नहीं हो सका।",

        temperature: "तापमान",
        feels: "महसूस होता है",
        wind: "हवा",
        sunrise: "सूर्योदय",
        sunset: "सूर्यास्त",
        airQuality: "वायु गुणवत्ता",
        openWeatherAQI: "OpenWeather AQI",

        extremeAlerts: "गंभीर मौसम चेतावनी",
        extremeDescription:
            "यदि आपके स्थान के पास कोई बड़ा भूकंप आता है या आज भारी बारिश का अनुमान है, तो आपको पुश नोटिफिकेशन मिलेगा।",
        enableLiveAlerts: "लाइव अलर्ट चालू करें",
        liveAlertsOn: "लाइव अलर्ट चालू हैं ✅",

        alertEnabled:
            "🔔 आपके स्थान के लिए भूकंप और भारी बारिश के अलर्ट चालू हैं।",
        locationSaved:
            "📍 स्थान सुरक्षित है। लाइव अलर्ट के लिए नोटिफिकेशन चालू करें।",
        notificationDenied:
            "नोटिफिकेशन की अनुमति नहीं मिली, इसलिए लाइव अलर्ट बंद हैं।",
        alertRetry:
            "अभी अलर्ट सेट नहीं हो सके — अगली बार फिर प्रयास किया जाएगा।",

        climateTrend: "जलवायु रुझान और ऐतिहासिक विश्लेषण",
        startDate: "प्रारंभ तिथि",
        endDate: "अंतिम तिथि",
        loading: "लोड हो रहा है...",
        analyze: "विश्लेषण करें",

        last14Days: "पिछले 14 दिन",
        last30Days: "पिछले 30 दिन",
        last90Days: "पिछले 90 दिन",
        last12Months: "पिछले 12 महीने",

        latitudeLongitudeRequired:
            "अक्षांश, देशांतर, प्रारंभ तिथि और अंतिम तिथि आवश्यक हैं।",

        avgTemp: "औसत तापमान",
        max: "अधिकतम",
        min: "न्यूनतम",
        precipitation: "वर्षा",
        rainyDays: "बारिश वाले दिन",
        maxWind: "अधिकतम हवा",
        gust: "झोंका",

        hottestDay: "सबसे गर्म दिन",
        coldestDay: "सबसे ठंडा दिन",
        meanTemperatureTrend: "औसत तापमान का रुझान",

        firstHalfSecondHalf:
            "अवधि के पहले और दूसरे भाग की तुलना",
        includeTrend:
            "सहायक से प्रश्न पूछते समय इस रुझान को शामिल करें",

        personalizedFor: "व्यक्तिगत जानकारी",
        trendDataIncluded: "रुझान डेटा शामिल है",

        listening: "सुन रहा है...",
        askSomething: "कुछ पूछें...",
        stop: "रोकें",
        send: "भेजें",
        sending: "भेजा जा रहा है...",

        speechNotSupported:
            "इस ब्राउज़र में वाक् पहचान उपलब्ध नहीं है",

        you: "आप",

        businessPlaceholder:
            "जैसे कृषि सामग्री, लॉजिस्टिक्स",

        warming: "तापमान बढ़ रहा है",
        cooling: "तापमान घट रहा है",
        stable: "स्थिर",
    },

    ml: {
        chooseLanguage: "ഭാഷ തിരഞ്ഞെടുക്കുക",
        whatDoYouDo: "നിങ്ങൾ എന്താണ് ചെയ്യുന്നത്?",
        continue: "തുടരുക",

        farmer: "കർഷകൻ",
        businessOwner: "ബിസിനസ് ഉടമ",
        aviation: "വ്യോമയാനം",
        fisherman: "മത്സ്യത്തൊഴിലാളി",
        generalCitizen: "സാധാരണ പൗരൻ",
        disasterManagement: "ദുരന്തനിവാരണം",

        currentWeather: "നിലവിലെ കാലാവസ്ഥ",
        loadingWeather: "നിലവിലെ കാലാവസ്ഥ ലോഡ് ചെയ്യുന്നു...",
        locationRequired:
            "പ്രാദേശിക കാലാവസ്ഥ കാണാൻ ലൊക്കേഷൻ അനുമതി ആവശ്യമാണ്.",
        geolocationUnsupported:
            "ഈ ബ്രൗസറിൽ ലൊക്കേഷൻ സൗകര്യം ലഭ്യമല്ല.",
        unableWeather: "കാലാവസ്ഥ ലോഡ് ചെയ്യാനായില്ല.",

        temperature: "താപനില",
        feels: "അനുഭവപ്പെടുന്നത്",
        wind: "കാറ്റ്",
        sunrise: "സൂര്യോദയം",
        sunset: "സൂര്യാസ്തമയം",
        airQuality: "വായു ഗുണനിലവാരം",
        openWeatherAQI: "OpenWeather AQI",

        extremeAlerts: "തീവ്ര കാലാവസ്ഥാ മുന്നറിയിപ്പുകൾ",
        extremeDescription:
            "നിങ്ങളുടെ പ്രദേശത്തിന് സമീപം ശക്തമായ ഭൂകമ്പം ഉണ്ടായാലോ ഇന്ന് കനത്ത മഴ പ്രതീക്ഷിച്ചാലോ നിങ്ങൾക്ക് പുഷ് അറിയിപ്പ് ലഭിക്കും.",
        enableLiveAlerts: "ലൈവ് അലർട്ടുകൾ പ്രവർത്തനക്ഷമമാക്കുക",
        liveAlertsOn: "ലൈവ് അലർട്ടുകൾ പ്രവർത്തനക്ഷമമാണ് ✅",

        alertEnabled:
            "🔔 നിങ്ങളുടെ പ്രദേശത്തിനുള്ള ഭൂകമ്പ, കനത്ത മഴ അലർട്ടുകൾ പ്രവർത്തനക്ഷമമാണ്.",
        locationSaved:
            "📍 ലൊക്കേഷൻ സംരക്ഷിച്ചു. ലൈവ് അലർട്ടുകൾക്കായി അറിയിപ്പുകൾ പ്രവർത്തനക്ഷമമാക്കുക.",
        notificationDenied:
            "അറിയിപ്പ് അനുമതി ലഭിച്ചില്ല, അതിനാൽ ലൈവ് അലർട്ടുകൾ ഓഫാണ്.",
        alertRetry:
            "ഇപ്പോൾ അലർട്ടുകൾ സജ്ജീകരിക്കാനായില്ല — അടുത്ത സന്ദർശനത്തിൽ വീണ്ടും ശ്രമിക്കും.",

        climateTrend: "കാലാവസ്ഥാ പ്രവണതയും ചരിത്രപരമായ വിശകലനവും",
        startDate: "ആരംഭ തീയതി",
        endDate: "അവസാന തീയതി",
        loading: "ലോഡ് ചെയ്യുന്നു...",
        analyze: "വിശകലനം ചെയ്യുക",

        last14Days: "കഴിഞ്ഞ 14 ദിവസം",
        last30Days: "കഴിഞ്ഞ 30 ദിവസം",
        last90Days: "കഴിഞ്ഞ 90 ദിവസം",
        last12Months: "കഴിഞ്ഞ 12 മാസം",

        latitudeLongitudeRequired:
            "അക്ഷാംശം, രേഖാംശം, ആരംഭ തീയതി, അവസാന തീയതി എന്നിവ ആവശ്യമാണ്.",

        avgTemp: "ശരാശരി താപനില",
        max: "പരമാവധി",
        min: "കുറഞ്ഞത്",
        precipitation: "മഴ",
        rainyDays: "മഴയുള്ള ദിവസങ്ങൾ",
        maxWind: "പരമാവധി കാറ്റ്",
        gust: "കാറ്റിന്റെ വേഗത",

        hottestDay: "ഏറ്റവും ചൂടുള്ള ദിവസം",
        coldestDay: "ഏറ്റവും തണുത്ത ദിവസം",
        meanTemperatureTrend: "ശരാശരി താപനില പ്രവണത",

        firstHalfSecondHalf:
            "കാലയളവിന്റെ ആദ്യ പകുതി vs രണ്ടാം പകുതി",
        includeTrend:
            "സഹായിയോട് ചോദിക്കുമ്പോൾ ഈ പ്രവണത ഉൾപ്പെടുത്തുക",

        personalizedFor: "വ്യക്തിഗതമാക്കിയത്",
        trendDataIncluded: "പ്രവണത ഡാറ്റ ഉൾപ്പെടുത്തിയിരിക്കുന്നു",

        listening: "ശ്രദ്ധിക്കുന്നു...",
        askSomething: "എന്തെങ്കിലും ചോദിക്കുക...",
        stop: "നിർത്തുക",
        send: "അയയ്ക്കുക",
        sending: "അയയ്ക്കുന്നു...",

        speechNotSupported:
            "ഈ ബ്രൗസറിൽ വാക്ക് തിരിച്ചറിയൽ ലഭ്യമല്ല",

        you: "നിങ്ങൾ",

        businessPlaceholder:
            "ഉദാ. കാർഷിക സാമഗ്രികൾ, ലോജിസ്റ്റിക്സ്",

        warming: "താപനില ഉയരുന്നു",
        cooling: "താപനില കുറയുന്നു",
        stable: "സ്ഥിരം",
    },

    ma: {
        chooseLanguage: "भाषा निवडा",
        whatDoYouDo: "तुम्ही काय करता?",
        continue: "पुढे चला",

        farmer: "शेतकरी",
        businessOwner: "व्यवसाय मालक",
        aviation: "विमान वाहतूक",
        fisherman: "मच्छीमार",
        generalCitizen: "सामान्य नागरिक",
        disasterManagement: "आपत्ती व्यवस्थापन",

        currentWeather: "सध्याचे हवामान",
        loadingWeather: "सध्याचे हवामान लोड होत आहे...",
        locationRequired:
            "स्थानिक हवामान पाहण्यासाठी स्थानाची परवानगी आवश्यक आहे.",
        geolocationUnsupported:
            "या ब्राउझरमध्ये स्थान सुविधा उपलब्ध नाही.",
        unableWeather: "हवामान लोड करता आले नाही.",

        temperature: "तापमान",
        feels: "जाणवते",
        wind: "वारा",
        sunrise: "सूर्योदय",
        sunset: "सूर्यास्त",
        airQuality: "हवेची गुणवत्ता",
        openWeatherAQI: "OpenWeather AQI",

        extremeAlerts: "तीव्र हवामान सूचना",
        extremeDescription:
            "तुमच्या परिसरात मोठा भूकंप झाल्यास किंवा आज मुसळधार पावसाचा अंदाज असल्यास तुम्हाला पुश सूचना मिळेल.",
        enableLiveAlerts: "लाइव्ह अलर्ट सुरू करा",
        liveAlertsOn: "लाइव्ह अलर्ट सुरू आहेत ✅",

        alertEnabled:
            "🔔 तुमच्या स्थानासाठी भूकंप आणि मुसळधार पावसाचे अलर्ट सुरू आहेत.",
        locationSaved:
            "📍 स्थान जतन केले आहे. लाइव्ह अलर्टसाठी सूचना सुरू करा.",
        notificationDenied:
            "सूचनांची परवानगी मिळाली नाही, त्यामुळे लाइव्ह अलर्ट बंद आहेत.",
        alertRetry:
            "आत्ता अलर्ट सेट करता आले नाहीत — पुढील भेटीत पुन्हा प्रयत्न केला जाईल.",

        climateTrend: "हवामानाचा कल आणि ऐतिहासिक विश्लेषण",
        startDate: "सुरुवातीची तारीख",
        endDate: "शेवटची तारीख",
        loading: "लोड होत आहे...",
        analyze: "विश्लेषण करा",

        last14Days: "मागील 14 दिवस",
        last30Days: "मागील 30 दिवस",
        last90Days: "मागील 90 दिवस",
        last12Months: "मागील 12 महिने",

        latitudeLongitudeRequired:
            "अक्षांश, रेखांश, सुरुवातीची तारीख आणि शेवटची तारीख आवश्यक आहेत.",

        avgTemp: "सरासरी तापमान",
        max: "कमाल",
        min: "किमान",
        precipitation: "पर्जन्य",
        rainyDays: "पावसाचे दिवस",
        maxWind: "कमाल वारा",
        gust: "वाऱ्याचा झोत",

        hottestDay: "सर्वात उष्ण दिवस",
        coldestDay: "सर्वात थंड दिवस",
        meanTemperatureTrend: "सरासरी तापमानाचा कल",

        firstHalfSecondHalf:
            "कालावधीचा पहिला भाग विरुद्ध दुसरा भाग",
        includeTrend:
            "सहाय्यकाला प्रश्न विचारताना हा कल समाविष्ट करा",

        personalizedFor: "यासाठी वैयक्तिकृत",
        trendDataIncluded: "कल डेटा समाविष्ट आहे",

        listening: "ऐकत आहे...",
        askSomething: "काहीतरी विचारा...",
        stop: "थांबवा",
        send: "पाठवा",
        sending: "पाठवत आहे...",

        speechNotSupported:
            "या ब्राउझरमध्ये वाणी ओळख उपलब्ध नाही",

        you: "तुम्ही",

        businessPlaceholder:
            "उदा. कृषी साहित्य, लॉजिस्टिक्स",

        warming: "तापमान वाढत आहे",
        cooling: "तापमान कमी होत आहे",
        stable: "स्थिर",
    },

    ur: {
        chooseLanguage: "زبان منتخب کریں",
        whatDoYouDo: "آپ کیا کرتے ہیں؟",
        continue: "جاری رکھیں",

        farmer: "کسان",
        businessOwner: "کاروباری مالک",
        aviation: "ہوابازی",
        fisherman: "ماہی گیر",
        generalCitizen: "عام شہری",
        disasterManagement: "آفات کا انتظام",

        currentWeather: "موجودہ موسم",
        loadingWeather: "موجودہ موسم لوڈ ہو رہا ہے...",
        locationRequired:
            "مقامی موسم دکھانے کے لیے مقام کی اجازت ضروری ہے۔",
        geolocationUnsupported:
            "اس براؤزر میں مقام کی سہولت دستیاب نہیں ہے۔",
        unableWeather: "موسم لوڈ نہیں ہو سکا۔",

        temperature: "درجہ حرارت",
        feels: "محسوس ہوتا ہے",
        wind: "ہوا",
        sunrise: "طلوع آفتاب",
        sunset: "غروب آفتاب",
        airQuality: "ہوا کا معیار",
        openWeatherAQI: "OpenWeather AQI",

        extremeAlerts: "شدید موسمی انتباہات",
        extremeDescription:
            "اگر آپ کے علاقے کے قریب شدید زلزلہ آئے یا آج شدید بارش کی پیش گوئی ہو تو آپ کو پش اطلاع ملے گی۔",
        enableLiveAlerts: "لائیو الرٹس فعال کریں",
        liveAlertsOn: "لائیو الرٹس فعال ہیں ✅",

        alertEnabled:
            "🔔 آپ کے مقام کے لیے زلزلہ اور شدید بارش کے الرٹس فعال ہیں۔",
        locationSaved:
            "📍 مقام محفوظ کر لیا گیا ہے۔ لائیو الرٹس کے لیے اطلاعات فعال کریں۔",
        notificationDenied:
            "اطلاعات کی اجازت نہیں ملی، اس لیے لائیو الرٹس بند ہیں۔",
        alertRetry:
            "ابھی الرٹس ترتیب نہیں دیے جا سکے — اگلی بار دوبارہ کوشش کی جائے گی۔",

        climateTrend: "موسمی رجحان اور تاریخی تجزیہ",
        startDate: "شروع کی تاریخ",
        endDate: "اختتام کی تاریخ",
        loading: "لوڈ ہو رہا ہے...",
        analyze: "تجزیہ کریں",

        last14Days: "گزشتہ 14 دن",
        last30Days: "گزشتہ 30 دن",
        last90Days: "گزشتہ 90 دن",
        last12Months: "گزشتہ 12 ماہ",

        latitudeLongitudeRequired:
            "عرض البلد، طول البلد، شروع کی تاریخ اور اختتام کی تاریخ ضروری ہیں۔",

        avgTemp: "اوسط درجہ حرارت",
        max: "زیادہ سے زیادہ",
        min: "کم سے کم",
        precipitation: "بارش",
        rainyDays: "بارش والے دن",
        maxWind: "زیادہ سے زیادہ ہوا",
        gust: "ہوا کا جھونکا",

        hottestDay: "سب سے گرم دن",
        coldestDay: "سب سے سرد دن",
        meanTemperatureTrend: "اوسط درجہ حرارت کا رجحان",

        firstHalfSecondHalf:
            "مدت کا پہلا حصہ بمقابلہ دوسرا حصہ",
        includeTrend:
            "اسسٹنٹ سے سوال پوچھتے وقت یہ رجحان شامل کریں",

        personalizedFor: "ذاتی نوعیت",
        trendDataIncluded: "رجحان کا ڈیٹا شامل ہے",

        listening: "سن رہا ہے...",
        askSomething: "کچھ پوچھیں...",
        stop: "روکیں",
        send: "بھیجیں",
        sending: "بھیجا جا رہا ہے...",

        speechNotSupported:
            "اس براؤزر میں تقریر کی شناخت دستیاب نہیں ہے",

        you: "آپ",

        businessPlaceholder:
            "مثلاً زرعی سامان، لاجسٹکس",

        warming: "درجہ حرارت بڑھ رہا ہے",
        cooling: "درجہ حرارت کم ہو رہا ہے",
        stable: "مستحکم",
    },
};

// ---------------------------------------------------------
// TRANSLATION HELPER
// ---------------------------------------------------------

const getTranslation = (lang, key) => {
    return (
        TRANSLATIONS[lang]?.[key] ||
        TRANSLATIONS.en[key] ||
        key
    );
};

// ---------------------------------------------------------
// OCCUPATIONS
// Keep these English internally for backend/database.
// Only display translated text on frontend.
// ---------------------------------------------------------

const OCCUPATIONS = [
    "Farmer",
    "Business Owner",
    "Aviation",
    "Fisherman",
    "General Citizen",
    "Disaster Management",
];

const OCCUPATION_KEYS = {
    "Farmer": "farmer",
    "Business Owner": "businessOwner",
    "Aviation": "aviation",
    "Fisherman": "fisherman",
    "General Citizen": "generalCitizen",
    "Disaster Management": "disasterManagement",
};

// ---------------------------------------------------------
// DATE / TIME FORMATTERS
// ---------------------------------------------------------

const formatTime = (unixTime, lang = "en") => {
    if (!unixTime) return "--";

    return new Date(unixTime * 1000).toLocaleTimeString(
        LOCALES[lang] || "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit",
        }
    );
};

const formatDateShort = (iso, lang = "en") => {
    if (!iso) return "--";

    return new Date(iso).toLocaleDateString(
        LOCALES[lang] || "en-IN",
        {
            day: "2-digit",
            month: "short",
        }
    );
};

const round1 = (n) =>
    n == null ? "--" : Math.round(n * 10) / 10;

// ---------------------------------------------------------
// DEFAULT HISTORY DATES
// ---------------------------------------------------------

const getDefaultDates = () => {
    const end = new Date();

    end.setDate(end.getDate() - 6);

    const start = new Date(end);

    start.setDate(start.getDate() - 13);

    const fmt = (d) => d.toISOString().split("T")[0];

    return {
        start: fmt(start),
        end: fmt(end),
    };
};

// ---------------------------------------------------------
// ASSISTANT
// ---------------------------------------------------------

const Assistant = () => {
    const { user } = useUser();

    const clerkId = user?.id || null;

    // -----------------------------------------------------
    // CHAT STATE
    // -----------------------------------------------------

    const [message, setmessage] = useState("");
    const [sendstatus, setsendstatus] = useState("false");
    const [chat, setchat] = useState([]);
    const [mic, setmic] = useState(false);

    // -----------------------------------------------------
    // ONBOARDING
    // -----------------------------------------------------

    const [showOnboarding, setShowOnboarding] = useState(false);
    const [onboardingStep, setOnboardingStep] = useState(1);

    const [langPref, setLangPref] = useState("en");

    const [occupation, setOccupation] = useState("");

    const [businessType, setBusinessType] = useState("");

    // -----------------------------------------------------
    // WEATHER
    // -----------------------------------------------------

    const [weather, setWeather] = useState(null);

    const [weatherLoading, setWeatherLoading] = useState(true);

    const [weatherError, setWeatherError] = useState("");

    // -----------------------------------------------------
    // ALERTS
    // -----------------------------------------------------

    const [alertsEnabled, setAlertsEnabled] = useState(false);

    const [alertsStatus, setAlertsStatus] = useState("");

    const userCoordsRef = useRef({
        lat: null,
        lon: null,
    });

    // -----------------------------------------------------
    // HISTORY
    // -----------------------------------------------------

    const defaultDates = getDefaultDates();

    const [histLat, setHistLat] = useState("");

    const [histLon, setHistLon] = useState("");

    const [startDate, setStartDate] = useState(
        defaultDates.start
    );

    const [endDate, setEndDate] = useState(
        defaultDates.end
    );

    const [history, setHistory] = useState(null);

    const [historyLoading, setHistoryLoading] =
        useState(false);

    const [historyError, setHistoryError] = useState("");

    const [includeTrendInChat, setIncludeTrendInChat] =
        useState(false);

    // -----------------------------------------------------
    // SPEECH
    // -----------------------------------------------------

    const [text, setText] = useState("");

    const [voices, setVoices] = useState([]);

    const [selectedVoice, setSelectedVoice] =
        useState(null);

    const [rate, setRate] = useState(1);

    const [speaker, setspeaker] = useState(false);

    const [pitch, setPitch] = useState(1);

    const [isListening, setIsListening] =
        useState(false);

    const recognitionRef = useRef(null);

    // -----------------------------------------------------
    // SHORT TRANSLATION FUNCTION
    // -----------------------------------------------------

    const t = (key) => getTranslation(langPref, key);

    useEffect(() => {
        let cancelled = false;

        listenForForegroundMessages((payload) => {
            if (cancelled) return;

            const title = payload.notification?.title || "Weather Alert";
            const body = payload.notification?.body || "";
            const icon = payload.notification?.icon || "/icons/rain-192.png.png";

            if (Notification.permission === "granted") {
                new Notification(title, { body, icon });
            }
        });

        return () => {
            cancelled = true;
        };
    }, []);

    // -----------------------------------------------------
    // LOAD ONBOARDING
    // -----------------------------------------------------

    useEffect(() => {
        const done =
            localStorage.getItem("onboardingDone");

        if (!done) {
            setShowOnboarding(true);
        } else {
            setLangPref(
                localStorage.getItem("langPref") || "en"
            );

            setOccupation(
                localStorage.getItem("occupation") || ""
            );

            setBusinessType(
                localStorage.getItem("businessType") || ""
            );
        }
    }, []);

    // -----------------------------------------------------
    // SELECT LANGUAGE
    // -----------------------------------------------------

    const selectLanguage = (lang) => {
        setLangPref(lang);

        setOnboardingStep(2);
    };

    // -----------------------------------------------------
    // FINISH ONBOARDING
    // -----------------------------------------------------

    const finishOnboarding = () => {
        if (!occupation) return;

        localStorage.setItem("langPref", langPref);

        localStorage.setItem(
            "occupation",
            occupation
        );

        localStorage.setItem(
            "businessType",
            businessType
        );

        localStorage.setItem(
            "onboardingDone",
            "true"
        );

        setShowOnboarding(false);
    };

    // -----------------------------------------------------
    // SYNC ALERT PROFILE
    // -----------------------------------------------------

    const syncAlertProfile = async ({ fcmToken } = {}) => {
        const {
            lat,
            lon,
        } = userCoordsRef.current;

        if (
            !clerkId ||
            lat == null ||
            lon == null
        ) {
            return;
        }

        try {
            const res = await fetch(
                "/api/user/location",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        clerkId,

                        latitude: lat,

                        longitude: lon,

                        fcmToken:
                            fcmToken || undefined,
                    }),
                }
            );

            if (!res.ok) {
                const data = await res.json();

                throw new Error(
                    data.error ||
                        "Failed to sync alert profile"
                );
            }

            setAlertsStatus(
                fcmToken
                    ? t("alertEnabled")
                    : t("locationSaved")
            );
        } catch (err) {
            console.error(
                "Alert profile sync error:",
                err
            );

            setAlertsStatus(
                t("alertRetry")
            );
        }
    };

    // -----------------------------------------------------
    // ENABLE ALERTS
    // -----------------------------------------------------

    const enableAlerts = async () => {
        const token =
            await requestNotificationPermission();

        if (!token) {
            setAlertsStatus(
                t("notificationDenied")
            );

            return;
        }

        setAlertsEnabled(true);

        await syncAlertProfile({
            fcmToken: token,
        });
    };

    // -----------------------------------------------------
    // FETCH WEATHER
    // -----------------------------------------------------

    useEffect(() => {
        if (!navigator.geolocation) {
            setWeatherError(
                t("geolocationUnsupported")
            );

            setWeatherLoading(false);

            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const {
                        latitude,
                        longitude,
                    } = position.coords;

                    userCoordsRef.current = {
                        lat: latitude,
                        lon: longitude,
                    };

                    setHistLat(
                        latitude.toFixed(4)
                    );

                    setHistLon(
                        longitude.toFixed(4)
                    );

                    const res = await fetch(
                        `/api/weather?lat=${latitude}&lon=${longitude}`
                    );

                    const data = await res.json();

                    if (!res.ok) {
                        throw new Error(
                            data.error ||
                                "Failed to fetch weather"
                        );
                    }

                    setWeather(data);

                    setWeatherError("");

                    syncAlertProfile();
                } catch (error) {
                    console.error(
                        "Weather error:",
                        error
                    );

                    setWeatherError(
                        t("unableWeather")
                    );
                } finally {
                    setWeatherLoading(false);
                }
            },
            (error) => {
                console.error(
                    "Location error:",
                    error
                );

                setWeatherError(
                    t("locationRequired")
                );

                setWeatherLoading(false);
            }
        );

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clerkId]);

    // -----------------------------------------------------
    // QUICK DATE RANGE
    // -----------------------------------------------------

    const applyQuickRange = (preset) => {
        const end = new Date();

        end.setDate(
            end.getDate() - 6
        );

        let start = new Date(end);

        if (preset === "14d") {
            start.setDate(
                end.getDate() - 13
            );
        }

        if (preset === "30d") {
            start.setDate(
                end.getDate() - 29
            );
        }

        if (preset === "90d") {
            start.setDate(
                end.getDate() - 89
            );
        }

        if (preset === "1y") {
            start.setFullYear(
                end.getFullYear() - 1
            );
        }

        const fmt = (d) =>
            d.toISOString().split("T")[0];

        setStartDate(fmt(start));

        setEndDate(fmt(end));
    };

    // -----------------------------------------------------
    // FETCH HISTORY
    // -----------------------------------------------------

    const fetchHistory = async () => {
        if (
            !histLat ||
            !histLon ||
            !startDate ||
            !endDate
        ) {
            setHistoryError(
                t("latitudeLongitudeRequired")
            );

            return;
        }

        setHistoryLoading(true);

        setHistoryError("");

        try {
            const res = await fetch(
                `/api/history?lat=${histLat}&lon=${histLon}&start_date=${startDate}&end_date=${endDate}`
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(
                    data.error ||
                        "Failed to fetch historical data"
                );
            }

            setHistory(data);
        } catch (err) {
            console.error(
                "History error:",
                err
            );

            setHistoryError(
                err.message ||
                    "Unable to load historical weather data."
            );

            setHistory(null);
        } finally {
            setHistoryLoading(false);
        }
    };

    // -----------------------------------------------------
    // TREND CONTEXT
    // -----------------------------------------------------

    const buildTrendContext = () => {
        if (!history?.summary) {
            return null;
        }

        const s = history.summary;

        return {
            location: `${s.location.latitude}, ${s.location.longitude}`,

            period: `${s.period.start} to ${s.period.end} (${s.period.days} days)`,

            avgTemperature: `${round1(
                s.avgMeanTemp
            )}°C (max avg ${round1(
                s.avgMaxTemp
            )}°C, min avg ${round1(
                s.avgMinTemp
            )}°C)`,

            hottestDay: `${formatDateShort(
                s.hottestDay.date,
                langPref
            )} at ${round1(
                s.hottestDay.temp
            )}°C`,

            coldestDay: `${formatDateShort(
                s.coldestDay.date,
                langPref
            )} at ${round1(
                s.coldestDay.temp
            )}°C`,

            totalPrecipitation: `${round1(
                s.totalPrecipitation
            )} mm over ${
                s.rainyDays
            } rainy day(s)`,

            maxWind: `${round1(
                s.maxWindSpeed
            )} km/h`,

            trend: `${s.trend.direction} (Δ${round1(
                s.trend.deltaC
            )}°C between first and second half of the period)`,
        };
    };

    // -----------------------------------------------------
    // SEND MESSAGE
    // -----------------------------------------------------

    const sendmessage = async () => {
        try {
            if (!message.trim()) {
                return;
            }

            const weatherContext = weather
                ? {
                      location:
                          weather.location?.name
                              ? `${weather.location.name}${
                                    weather.location
                                        .country
                                        ? ", " +
                                          weather
                                              .location
                                              .country
                                        : ""
                                }`
                              : "your location",

                      temperature:
                          weather.temperature !=
                          null
                              ? `${weather.temperature}°C (feels like ${weather.feelsLike}°C)`
                              : "N/A",

                      windSpeed:
                          weather.windSpeed !=
                          null
                              ? `${weather.windSpeed} m/s`
                              : "N/A",

                      humidity:
                          weather.humidity !=
                          null
                              ? `${weather.humidity}%`
                              : "N/A",

                      sunrise: formatTime(
                          weather.sunrise,
                          langPref
                      ),

                      sunset: formatTime(
                          weather.sunset,
                          langPref
                      ),

                      condition:
                          weather.condition ||
                          "N/A",

                      aqi:
                          weather.aqi != null
                              ? `${weather.aqi} (${weather.aqiLabel})`
                              : "N/A",
                  }
                : null;

            const climateTrend =
                includeTrendInChat
                    ? buildTrendContext()
                    : null;

            const res = await fetch(
                "/api/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        message,

                        // IMPORTANT:
                        // Backend receives full language name.
                        langPref:
                            LANG_NAMES[langPref] ||
                            langPref,

                        occupation,

                        businessType,

                        weather:
                            weatherContext,

                        climateTrend,
                    }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(
                    data.error ||
                        "Failed to send message"
                );
            }

            setchat((prev) => [
                ...prev,

                {
                    user: message,

                    bot: data.reply,
                },
            ]);

            setmessage("");
        } catch (err) {
            console.error(
                "Error Sending Message : ",
                err
            );
        } finally {
            setsendstatus("false");
        }
    };

    // -----------------------------------------------------
    // SPEECH RECOGNITION
    // -----------------------------------------------------

    const startListening = () => {
        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert(
                t("speechNotSupported")
            );

            return;
        }

        const recognition =
            new SpeechRecognition();

        recognition.continuous = true;

        recognition.interimResults = true;

        if (langPref === "en") {
            recognition.lang = "en-US";
        } else if (langPref === "hi") {
            recognition.lang = "hi-IN";
        } else if (langPref === "ml") {
            recognition.lang = "ml-IN";
        } else if (langPref === "ma") {
            recognition.lang = "mr-IN";
        } else if (langPref === "ur") {
            recognition.lang = "ur-IN";
        }

        recognition.start();

        setIsListening(true);

        recognition.onresult = (event) => {
            let finalText = "";

            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {
                if (
                    event.results[i].isFinal
                ) {
                    finalText +=
                        event.results[i][0]
                            .transcript + " ";
                }
            }

            if (finalText) {
                setmessage(
                    (prev) =>
                        prev + finalText
                );
            }
        };

        recognition.onerror = (event) =>
            console.error(
                "Error:",
                event.error
            );

        recognition.onend = () =>
            setIsListening(false);

        recognitionRef.current =
            recognition;
    };

    const stopListening = () => {
        recognitionRef.current?.stop();

        setIsListening(false);
    };

    // -----------------------------------------------------
    // SPEECH SYNTHESIS
    // -----------------------------------------------------

    useEffect(() => {
        const loadVoices = () => {
            const voicesList =
                window.speechSynthesis.getVoices();

            setVoices(voicesList);

            setSelectedVoice(
                voicesList[0]
            );
        };

        loadVoices();

        window.speechSynthesis.onvoiceschanged =
            loadVoices;
    }, []);

    const speakText = () => {
        if (!text) {
            return;
        }

        const utterance =
            new SpeechSynthesisUtterance(
                text
            );

        if (selectedVoice) {
            utterance.voice =
                selectedVoice;
        }

        utterance.rate = rate;

        utterance.pitch = pitch;

        window.speechSynthesis.speak(
            utterance
        );
    };

    const stopSpeech = () =>
        window.speechSynthesis.cancel();

    // -----------------------------------------------------
    // CHART
    // -----------------------------------------------------

    const getChartSamples = () => {
        if (!history?.daily) {
            return [];
        }

        const {
            time,
            temperature_2m_mean,
        } = history.daily;

        const n = time.length;

        const maxBars = 30;

        const step = Math.max(
            1,
            Math.ceil(n / maxBars)
        );

        const samples = [];

        for (
            let i = 0;
            i < n;
            i += step
        ) {
            samples.push({
                date: time[i],

                temp:
                    temperature_2m_mean[i],
            });
        }

        return samples;
    };

    const chartSamples =
        getChartSamples();

    const chartTemps =
        chartSamples
            .map((d) => d.temp)
            .filter(
                (v) => v != null
            );

    const chartMin =
        chartTemps.length
            ? Math.min(...chartTemps)
            : 0;

    const chartMax =
        chartTemps.length
            ? Math.max(...chartTemps)
            : 1;

    const chartRange =
        chartMax - chartMin || 1;

    // -----------------------------------------------------
    // TREND ICON
    // -----------------------------------------------------

    const trendDirection =
        history?.summary?.trend
            ?.direction;

    const TrendIcon =
        trendDirection === "warming"
            ? TrendingUp
            : trendDirection === "cooling"
            ? TrendingDown
            : Minus;

    const trendColor =
        trendDirection === "warming"
            ? "text-red-600 bg-red-50"
            : trendDirection === "cooling"
            ? "text-blue-600 bg-blue-50"
            : "text-gray-600 bg-gray-50";

    const translatedTrend =
        trendDirection === "warming"
            ? t("warming")
            : trendDirection === "cooling"
            ? t("cooling")
            : t("stable");

    // -----------------------------------------------------
    // JSX
    // -----------------------------------------------------

    return (
        <div
            className="bg-green-100 min-h-screen"
            dir={langPref === "ur" ? "rtl" : "ltr"}
        >
            {/* =================================================
                ONBOARDING
            ================================================= */}

            {showOnboarding && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-5 rounded-2xl w-[40vw] mx-4 text-center">

                        {/* LANGUAGE */}
                        {onboardingStep === 1 && (
                            <>
                                <h3 className="text-2xl font-bold mt-0.5 text-blue-800">
                                    {t("chooseLanguage")}
                                </h3>

                                <div className="space-y-2 flex flex-col mt-4">

                                    <button
                                        onClick={() =>
                                            selectLanguage(
                                                "en"
                                            )
                                        }
                                        className="bg-blue-500 p-1 w-1/2 mx-auto rounded-2xl text-white"
                                    >
                                        English
                                    </button>

                                    <button
                                        onClick={() =>
                                            selectLanguage(
                                                "hi"
                                            )
                                        }
                                        className="bg-blue-500 p-1 w-1/2 mx-auto rounded-2xl text-white"
                                    >
                                        Hindi
                                    </button>

                                    <button
                                        onClick={() =>
                                            selectLanguage(
                                                "ml"
                                            )
                                        }
                                        className="bg-blue-500 p-1 w-1/2 mx-auto rounded-2xl text-white"
                                    >
                                        Malayalam
                                    </button>

                                    <button
                                        onClick={() =>
                                            selectLanguage(
                                                "ma"
                                            )
                                        }
                                        className="bg-blue-500 p-1 w-1/2 mx-auto rounded-2xl text-white"
                                    >
                                        Marathi
                                    </button>

                                    <button
                                        onClick={() =>
                                            selectLanguage(
                                                "ur"
                                            )
                                        }
                                        className="bg-blue-500 p-1 w-1/2 mx-auto rounded-2xl text-white"
                                    >
                                        Urdu
                                    </button>

                                </div>
                            </>
                        )}

                        {/* OCCUPATION */}
                        {onboardingStep === 2 && (
                            <>
                                <h3 className="text-2xl font-bold mt-0.5 text-blue-800">
                                    {t("whatDoYouDo")}
                                </h3>

                                <div className="space-y-2 flex flex-col mt-4">

                                    {OCCUPATIONS.map(
                                        (opt) => (
                                            <button
                                                key={
                                                    opt
                                                }
                                                onClick={() =>
                                                    setOccupation(
                                                        opt
                                                    )
                                                }
                                                className={`p-1 w-3/4 mx-auto rounded-2xl border ${
                                                    occupation ===
                                                    opt
                                                        ? "bg-green-500 text-white"
                                                        : "bg-gray-100 text-black"
                                                }`}
                                            >
                                                {t(
                                                    OCCUPATION_KEYS[
                                                        opt
                                                    ]
                                                )}
                                            </button>
                                        )
                                    )}

                                </div>

                                {occupation ===
                                    "Business Owner" && (
                                    <input
                                        value={
                                            businessType
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setBusinessType(
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder={t(
                                            "businessPlaceholder"
                                        )}
                                        className="mt-3 border rounded-xl p-2 w-3/4 text-black"
                                    />
                                )}

                                <button
                                    onClick={
                                        finishOnboarding
                                    }
                                    disabled={
                                        !occupation
                                    }
                                    className="mt-4 bg-orange-500 disabled:opacity-40 text-white px-6 py-2 rounded-2xl"
                                >
                                    {t("continue")}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* =================================================
                MAIN WEATHER CONTAINER
            ================================================= */}

            <div className="mx-6 mt-2 p-4 rounded-2xl bg-white shadow">

                {/* =================================================
                    WEATHER LOADING
                ================================================= */}

                {weatherLoading && (
                    <div className="mx-6 mt-4 p-4 rounded-2xl bg-white shadow">
                        <p className="text-gray-600 text-center">
                            {t("loadingWeather")}
                        </p>
                    </div>
                )}

                {/* =================================================
                    WEATHER ERROR
                ================================================= */}

                {weatherError && (
                    <div className="mx-6 mt-4 p-4 rounded-2xl bg-red-100 text-red-700 text-center">
                        {weatherError}
                    </div>
                )}

                {/* =================================================
                    CURRENT WEATHER
                ================================================= */}

                {weather && (
                    <div className="mx-6 mt-4 p-4 rounded-2xl bg-white shadow-lg">

                        <div className="flex items-center justify-between mb-4">

                            <div>

                                <h3 className="text-xl font-bold text-gray-800">
                                    {t(
                                        "currentWeather"
                                    )}

                                    {weather
                                        .location
                                        ?.name
                                        ? ` · ${weather.location.name}`
                                        : ""}
                                </h3>

                                <p className="text-gray-500 capitalize">
                                    {
                                        weather.condition
                                    }
                                </p>

                            </div>
                        </div>

                        {/* WEATHER CARDS */}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

                            {/* TEMPERATURE */}

                            <div className="bg-orange-50 p-3 rounded-xl">

                                <div className="flex items-center gap-2 text-orange-600">

                                    <Thermometer
                                        size={
                                            20
                                        }
                                    />

                                    <span className="font-semibold">
                                        {t(
                                            "temperature"
                                        )}
                                    </span>

                                </div>

                                <p className="text-xl font-bold text-gray-800 mt-1">
                                    {
                                        weather.temperature
                                    }
                                    °C
                                </p>

                                <p className="text-sm text-gray-500">
                                    {t(
                                        "feels"
                                    )}{" "}
                                    {
                                        weather.feelsLike
                                    }
                                    °C
                                </p>

                            </div>

                            {/* WIND */}

                            <div className="bg-blue-50 p-3 rounded-xl">

                                <div className="flex items-center gap-2 text-blue-600">

                                    <Wind
                                        size={
                                            20
                                        }
                                    />

                                    <span className="font-semibold">
                                        {t("wind")}
                                    </span>

                                </div>

                                <p className="text-xl font-bold text-gray-800 mt-1">
                                    {
                                        weather.windSpeed
                                    }{" "}
                                    m/s
                                </p>

                            </div>

                            {/* SUNRISE */}

                            <div className="bg-yellow-50 p-3 rounded-xl">

                                <div className="flex items-center gap-2 text-yellow-600">

                                    <Sunrise
                                        size={
                                            20
                                        }
                                    />

                                    <span className="font-semibold">
                                        {t(
                                            "sunrise"
                                        )}
                                    </span>

                                </div>

                                <p className="text-xl font-bold text-gray-800 mt-1">
                                    {formatTime(
                                        weather.sunrise,
                                        langPref
                                    )}
                                </p>

                            </div>

                            {/* SUNSET */}

                            <div className="bg-purple-50 p-3 rounded-xl">

                                <div className="flex items-center gap-2 text-purple-600">

                                    <Sunset
                                        size={
                                            20
                                        }
                                    />

                                    <span className="font-semibold">
                                        {t(
                                            "sunset"
                                        )}
                                    </span>

                                </div>

                                <p className="text-xl font-bold text-gray-800 mt-1">
                                    {formatTime(
                                        weather.sunset,
                                        langPref
                                    )}
                                </p>

                            </div>

                        </div>

                        {/* AIR QUALITY */}

                        <div className="mt-3 bg-gray-50 p-3 rounded-xl flex items-center justify-between">

                            <div className="flex items-center gap-2">

                                <Leaf
                                    size={20}
                                    className="text-green-600"
                                />

                                <div>

                                    <p className="font-semibold text-gray-800">
                                        {t(
                                            "airQuality"
                                        )}
                                    </p>

                                    <p className="text-sm text-gray-500">
                                        {t(
                                            "openWeatherAQI"
                                        )}
                                    </p>

                                </div>

                                <p className="text-xl font-bold text-gray-800 p-9">
                                    {
                                        weather.aqiLabel
                                    }
                                </p>

                            </div>
                        </div>

                    </div>
                )}

                {/* =================================================
                    EXTREME WEATHER ALERTS
                ================================================= */}

                <div className="mx-6 mt-4 p-4 rounded-2xl bg-white shadow-lg">

                    <div className="flex items-center gap-2 mb-2">

                        <BellRing
                            size={22}
                            className="text-red-600"
                        />

                        <h3 className="text-xl font-bold text-gray-800">
                            {t(
                                "extremeAlerts"
                            )}
                        </h3>

                    </div>

                    <p className="text-sm text-gray-500 mb-3">
                        {t(
                            "extremeDescription"
                        )}
                    </p>

                    {!alertsEnabled ? (
                        <button
                            onClick={
                                enableAlerts
                            }
                            className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-full"
                        >
                            {t(
                                "enableLiveAlerts"
                            )}
                        </button>
                    ) : (
                        <p className="text-sm text-emerald-700 font-medium">
                            {t(
                                "liveAlertsOn"
                            )}
                        </p>
                    )}

                    {alertsStatus && (
                        <p className="text-xs text-gray-500 mt-2">
                            {
                                alertsStatus
                            }
                        </p>
                    )}

                </div>

                {/* =================================================
                    CLIMATE TREND
                ================================================= */}

                <div className="mx-6 mt-4 p-4 rounded-2xl bg-white shadow-lg">

                    <div className="flex items-center gap-2 mb-3">

                        <History
                            size={22}
                            className="text-emerald-700"
                        />

                        <h3 className="text-xl font-bold text-gray-800">
                            {t(
                                "climateTrend"
                            )}
                        </h3>

                    </div>

                    {/* DATE INPUTS */}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

                        <div>

                            <label className="text-xs font-semibold text-gray-500">
                                {t(
                                    "startDate"
                                )}
                            </label>

                            <input
                                type="date"
                                value={
                                    startDate
                                }
                                onChange={(e) =>
                                    setStartDate(
                                        e.target
                                            .value
                                    )
                                }
                                className="border rounded-xl p-2 w-full text-black mt-1"
                            />

                        </div>

                        <div>

                            <label className="text-xs font-semibold text-gray-500">
                                {t(
                                    "endDate"
                                )}
                            </label>

                            <input
                                type="date"
                                value={
                                    endDate
                                }
                                onChange={(e) =>
                                    setEndDate(
                                        e.target
                                            .value
                                    )
                                }
                                className="border rounded-xl p-2 w-full text-black mt-1"
                            />

                        </div>

                        <button
                            onClick={
                                fetchHistory
                            }
                            disabled={
                                historyLoading
                            }
                            className="ml-auto flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xl font-semibold px-5 py-0.2 rounded-3xl mr-2"
                        >

                            {historyLoading ? (
                                <Loader2
                                    size={16}
                                    className="animate-spin"
                                />
                            ) : (
                                <CalendarDays
                                    size={16}
                                />
                            )}

                            {historyLoading
                                ? t(
                                      "loading"
                                  )
                                : t(
                                      "analyze"
                                  )}

                        </button>

                    </div>

                    {/* QUICK RANGES */}

                    <div className="flex flex-wrap gap-2 mt-3">

                        {[
                            {
                                key: "14d",
                                label: t(
                                    "last14Days"
                                ),
                            },
                            {
                                key: "30d",
                                label: t(
                                    "last30Days"
                                ),
                            },
                            {
                                key: "90d",
                                label: t(
                                    "last90Days"
                                ),
                            },
                            {
                                key: "1y",
                                label: t(
                                    "last12Months"
                                ),
                            },
                        ].map(
                            (preset) => (
                                <button
                                    key={
                                        preset.key
                                    }
                                    onClick={() =>
                                        applyQuickRange(
                                            preset.key
                                        )
                                    }
                                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full"
                                >
                                    {
                                        preset.label
                                    }
                                </button>
                            )
                        )}

                    </div>

                    {/* HISTORY ERROR */}

                    {historyError && (
                        <p className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded-xl">
                            {
                                historyError
                            }
                        </p>
                    )}

                    {/* HISTORY RESULTS */}

                    {history?.summary && (
                        <div className="mt-4">

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

                                {/* AVG TEMP */}

                                <div className="bg-orange-50 p-3 rounded-xl">

                                    <div className="flex items-center gap-2 text-orange-600">

                                        <Thermometer
                                            size={18}
                                        />

                                        <span className="font-semibold text-sm">
                                            {t(
                                                "avgTemp"
                                            )}
                                        </span>

                                    </div>

                                    <p className="text-xl font-bold text-gray-800 mt-1">
                                        {round1(
                                            history
                                                .summary
                                                .avgMeanTemp
                                        )}
                                        °C
                                    </p>

                                    <p className="text-xs text-gray-500">

                                        {t(
                                            "max"
                                        )}{" "}
                                        {round1(
                                            history
                                                .summary
                                                .avgMaxTemp
                                        )}°
                                        {" / "}
                                        {t(
                                            "min"
                                        )}{" "}
                                        {round1(
                                            history
                                                .summary
                                                .avgMinTemp
                                        )}°

                                    </p>

                                </div>

                                {/* TREND */}

                                <div
                                    className={`p-3 rounded-xl ${trendColor}`}
                                >

                                    <div className="flex items-center gap-2">

                                        <TrendIcon
                                            size={18}
                                        />

                                        <span className="font-semibold text-sm">
                                            {
                                                translatedTrend
                                            }
                                        </span>

                                    </div>

                                    <p className="text-xl font-bold mt-1">

                                        {history
                                            .summary
                                            .trend
                                            .deltaC >
                                        0
                                            ? "+"
                                            : ""}

                                        {round1(
                                            history
                                                .summary
                                                .trend
                                                .deltaC
                                        )}
                                        °C

                                    </p>

                                    <p className="text-xs opacity-75">
                                        {t(
                                            "firstHalfSecondHalf"
                                        )}
                                    </p>

                                </div>

                                {/* PRECIPITATION */}

                                <div className="bg-blue-50 p-3 rounded-xl">

                                    <div className="flex items-center gap-2 text-blue-600">

                                        <CloudRain
                                            size={18}
                                        />

                                        <span className="font-semibold text-sm">
                                            {t(
                                                "precipitation"
                                            )}
                                        </span>

                                    </div>

                                    <p className="text-xl font-bold text-gray-800 mt-1">

                                        {round1(
                                            history
                                                .summary
                                                .totalPrecipitation
                                        )}{" "}
                                        mm

                                    </p>

                                    <p className="text-xs text-gray-500">

                                        {
                                            history
                                                .summary
                                                .rainyDays
                                        }{" "}
                                        {t(
                                            "rainyDays"
                                        )}

                                    </p>

                                </div>

                                {/* WIND */}

                                <div className="bg-purple-50 p-3 rounded-xl">

                                    <div className="flex items-center gap-2 text-purple-600">

                                        <Wind
                                            size={18}
                                        />

                                        <span className="font-semibold text-sm">
                                            {t(
                                                "maxWind"
                                            )}
                                        </span>

                                    </div>

                                    <p className="text-xl font-bold text-gray-800 mt-1">

                                        {round1(
                                            history
                                                .summary
                                                .maxWindSpeed
                                        )}{" "}
                                        km/h

                                    </p>

                                    <p className="text-xs text-gray-500">

                                        {t(
                                            "gust"
                                        )}{" "}
                                        {round1(
                                            history
                                                .summary
                                                .maxWindGust
                                        )}{" "}
                                        km/h

                                    </p>

                                </div>

                            </div>

                            {/* HOTTEST / COLDEST */}

                            <div className="grid grid-cols-2 gap-3 mt-3">

                                <div className="bg-red-50 p-3 rounded-xl">

                                    <p className="text-sm font-semibold text-red-700">
                                        {t(
                                            "hottestDay"
                                        )}
                                    </p>

                                    <p className="text-gray-800">

                                        {formatDateShort(
                                            history
                                                .summary
                                                .hottestDay
                                                .date,
                                            langPref
                                        )}

                                        {" · "}

                                        {round1(
                                            history
                                                .summary
                                                .hottestDay
                                                .temp
                                        )}
                                        °C

                                    </p>

                                </div>

                                <div className="bg-sky-50 p-3 rounded-xl">

                                    <p className="text-sm font-semibold text-sky-700">
                                        {t(
                                            "coldestDay"
                                        )}
                                    </p>

                                    <p className="text-gray-800">

                                        {formatDateShort(
                                            history
                                                .summary
                                                .coldestDay
                                                .date,
                                            langPref
                                        )}

                                        {" · "}

                                        {round1(
                                            history
                                                .summary
                                                .coldestDay
                                                .temp
                                        )}
                                        °C

                                    </p>

                                </div>

                            </div>

                            {/* CHART */}

                            <div className="mt-4">

                                <p className="text-sm font-semibold text-gray-700 mb-2">
                                    {t(
                                        "meanTemperatureTrend"
                                    )}
                                </p>

                                <div className="flex items-end gap-1 h-32 bg-gray-50 rounded-xl p-2 overflow-x-auto">

                                    {chartSamples.map(
                                        (
                                            d,
                                            i
                                        ) => {

                                            const heightPct =
                                                d.temp !=
                                                null
                                                    ? 10 +
                                                      ((d.temp -
                                                          chartMin) /
                                                          chartRange) *
                                                          90
                                                    : 2;

                                            return (
                                                <div
                                                    key={
                                                        i
                                                    }
                                                    className="flex flex-col items-center justify-end h-full min-w-[10px]"
                                                >

                                                    <div
                                                        title={`${formatDateShort(
                                                            d.date,
                                                            langPref
                                                        )}: ${round1(
                                                            d.temp
                                                        )}°C`}
                                                        className="w-2 rounded-t bg-emerald-500"
                                                        style={{
                                                            height: `${heightPct}%`,
                                                        }}
                                                    />

                                                </div>
                                            );
                                        }
                                    )}

                                </div>

                                <div className="flex justify-between text-xs text-gray-400 mt-1">

                                    <span>
                                        {formatDateShort(
                                            chartSamples[
                                                0
                                            ]?.date,
                                            langPref
                                        )}
                                    </span>

                                    <span>
                                        {formatDateShort(
                                            chartSamples[
                                                chartSamples.length -
                                                    1
                                            ]?.date,
                                            langPref
                                        )}
                                    </span>

                                </div>

                            </div>

                            {/* INCLUDE TREND */}

                            <label className="flex items-center gap-2 mt-4 text-sm text-gray-600">

                                <input
                                    type="checkbox"
                                    checked={
                                        includeTrendInChat
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setIncludeTrendInChat(
                                            e
                                                .target
                                                .checked
                                        )
                                    }
                                />

                                {t(
                                    "includeTrend"
                                )}

                            </label>

                        </div>
                    )}

                </div>
            </div>

            {/* =================================================
                PERSONALIZED INFO
            ================================================= */}

            {!showOnboarding &&
                occupation && (
                    <p className="text-center text-black text-xs mt-2 opacity-70">

                        {t(
                            "personalizedFor"
                        )}
                        :{" "}

                        {t(
                            OCCUPATION_KEYS[
                                occupation
                            ]
                        )}

                        {businessType
                            ? ` (${businessType})`
                            : ""}

                        {" · "}

                        {LANG_NAMES[
                            langPref
                        ] || langPref}

                        {includeTrendInChat &&
                        history?.summary
                            ? ` · ${t(
                                  "trendDataIncluded"
                              )}`
                            : ""}

                    </p>
                )}

            {/* =================================================
                CHAT
            ================================================= */}

            <div className="m-6">

                {chat.map(
                    (c, i) => (
                        <div
                            key={i}
                            className="chat-box py-2"
                        >

                            <p className="ml-2 bg-blue-500 w-fit p-2 rounded-xl text-white">

                                <b>
                                    {t(
                                        "you"
                                    )}
                                    :
                                </b>{" "}

                                {
                                    c.user
                                }

                            </p>

                            <div className="bot ml-4 mt-5 bg-emerald-600 p-2 text-white rounded-lg text-left">

                                <button
                                    className="p-2"
                                    onClick={() => {

                                        if (
                                            !speaker
                                        ) {
                                            setText(
                                                c.bot
                                            );

                                            speakText();

                                            setspeaker(
                                                true
                                            );
                                        } else {
                                            stopSpeech();

                                            setspeaker(
                                                false
                                            );
                                        }

                                    }}
                                >
                                    🔊
                                </button>

                                <ReactMarkdown>
                                    {
                                        c.bot
                                    }
                                </ReactMarkdown>

                            </div>

                            <hr />

                        </div>
                    )
                )}

            </div>

            {/* =================================================
                CHAT INPUT
            ================================================= */}

            <div className="flex justify-center p-4 w-full">

                <input
                    value={message}
                    onChange={(e) =>
                        setmessage(
                            e.target.value
                        )
                    }
                    placeholder={
                        mic
                            ? t(
                                  "listening"
                              )
                            : t(
                                  "askSomething"
                              )
                    }
                    className="border text-black bg-blue-200 rounded-2xl text-lg p-1 h-[7vh] w-[45vw]"
                />

                <div className="bg-green-100 p-2.5 gap-2 flex">

                    {/* MIC */}

                    <button
                        onClick={() => {

                            if (
                                isListening
                            ) {
                                stopListening();

                                setmic(
                                    false
                                );
                            } else {
                                startListening();

                                setmic(
                                    true
                                );
                            }

                        }}
                    >

                        {isListening ? (
                            t("stop")
                        ) : (
                            <Mic className="text-black" />
                        )}

                    </button>

                    {/* SEND */}

                    <button
                        onClick={() => {

                            if (
                                sendstatus ===
                                "false"
                            ) {
                                sendmessage();

                                setsendstatus(
                                    "true"
                                );
                            }

                        }}
                        className={`bg-orange-400 ml-3.5 p-2.5 px-3 rounded-2xl ${
                            sendstatus ===
                            "true"
                                ? "bg-orange-300"
                                : "hover:bg-orange-400"
                        } hover:pointer text-black font-bold`}
                    >

                        {sendstatus ===
                        "true"
                            ? t(
                                  "sending"
                              )
                            : t("send")}

                    </button>

                </div>

            </div>
        </div>
    );
};

export default Assistant;