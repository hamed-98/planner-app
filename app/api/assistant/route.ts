import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// لیست مدل‌های به‌روز برای سوییچ خودکار در زمان ترافیک
const FALLBACK_MODELS = [
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-pro-preview",
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview",
  "gemini-2.5-flash"
];

async function generateWithFallback(ai: GoogleGenAI, contents: any, config: any) {
  let lastError: any = null;
  for (const model of FALLBACK_MODELS) {
    try {
      const response = await ai.models.generateContent({ model, contents, config });
      return { response, modelUsed: model };
    } catch (err: any) {
      console.warn(`Model ${model} failed/limited. Trying fallback...`);
      lastError = err;
    }
  }
  throw lastError || new Error("All AI models exhausted.");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, mode, userData, history = [] } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ۱. بررسی احراز هویت و پلن کاربر
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    let userPlan: "free" | "pro" | "team" = "free";

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.plan) userPlan = profile.plan;
      }
    }

    // محاسبه دقیق و ریاضی تاریخ‌های میلادی بر اساس تاریخ کاربر
    const clientToday = userData?.clientToday || new Date().toISOString().split("T")[0];
    const targetDateStr = userData?.targetDate || clientToday;

    const clientTodayObj = new Date(clientToday + "T12:00:00Z");
    const tomorrowObj = new Date(clientTodayObj.getTime() + 24 * 60 * 60 * 1000);
    const dayAfterObj = new Date(clientTodayObj.getTime() + 48 * 60 * 60 * 1000);
    const clientTomorrow = tomorrowObj.toISOString().split("T")[0];
    const clientDayAfter = dayAfterObj.toISOString().split("T")[0];

    const dailyLimit = userPlan === "pro" ? 100 : userPlan === "team" ? 250 : 15;

    // ۲. بررسی سهمیه در دیتابیس
    if (userId) {
      const { data: usageRecord } = await supabase
        .from("user_ai_usage")
        .select("request_count")
        .eq("user_id", userId)
        .eq("usage_date", clientToday)
        .maybeSingle();

      const currentCount = usageRecord?.request_count || 0;

      if (currentCount >= dailyLimit) {
        return NextResponse.json(
          {
            text: `⚠️ سقف مجاز روزانه شما برای هوش مصنوعی (${dailyLimit} پیام در پلن ${userPlan === "free" ? "رایگان" : "پرو"}) به پایان رسیده است.`,
            actionData: { action: "NONE", payload: {} },
            isLimitReached: true,
            currentUsage: currentCount,
            dailyLimit
          },
          { status: 429 }
        );
      }

      await supabase.from("user_ai_usage").upsert(
        {
          user_id: userId,
          usage_date: clientToday,
          request_count: currentCount + 1,
          created_at: new Date().toISOString()
        },
        { onConflict: "user_id,usage_date" }
      );
    }

    // ۳. خواندن کلید پلتفرم
    let platformKey = process.env.GEMINI_API_KEY || "";
    try {
      const { data: keysData } = await supabase
        .from("global_settings")
        .select("value")
        .eq("id", "api_keys")
        .maybeSingle();
      if (keysData?.value?.gemini) platformKey = keysData.value.gemini;
    } catch {}

    const validKey = platformKey.split(",").map(k => k.trim()).find(k => k.length > 10 && !k.includes("MY_GEMINI"));
    if (!validKey) {
      return NextResponse.json({
        text: "⚠️ سرویس هوش مصنوعی در دسترس نیست.",
        actionData: { action: "NONE", payload: {} }
      }, { status: 503 });
    }

    const ai = new GoogleGenAI({ apiKey: validKey });

    const contextPrompt = `اطلاعات زنده کاربر (${userData?.userName || 'کاربر'}):
- تاریخ امروز سیستم: ${clientToday}
- فردا: ${clientTomorrow}
- پس‌فردا: ${clientDayAfter}
- وضعیت خواب دیشب: ${userData?.sleepHours ? `${userData.sleepHours} ساعت (کیفیت: ${userData.sleepQuality || 'خوب'})` : 'هنوز ثبت نشده'}
- مصرف آب امروز: ${userData?.waterToday || 0}ml از ۲۵۰۰ml
- خلق‌وخو: ${userData?.moodScore ? `${userData.moodScore} از ۵` : 'هنوز ثبت نشده'}
- کارهای مانده امروز: ${userData?.pendingTasksToday || 0} مورد
- رویدادهای تقویم امروز: ${userData?.eventsToday || 0} مورد
- وضعیت باشگاه مغز: حافظه کاری (${userData?.brainMemory ?? 0} از ۱۰۰)، انعطاف استروپ (${userData?.brainFlexibility ?? 0} از ۱۰۰)، زمان واکنش (${userData?.brainReaction ? `${userData.brainReaction}ms` : 'بدون آزمون'})`;

    // ----------------------------------------------------
    // حالت ۱: تحلیل روزانه پیشخوان (Analyze Mode)
    // ----------------------------------------------------
    if (mode === "analyze") {
      let analysisText = "";
      try {
        const systemInstruction = `تو دستیار هوشمند و مشاور تندرستی و روانشناسی شناختی اپلیکیشن "سایبان" هستی.
وظیفه: تحلیل دقیق داده‌های امروز کاربر در حداکثر ۳ تا ۴ جمله کوتاه و کاربردی.
قوانین:
- هرگز خودت را «کورتکس» صدا نزن؛ تو «دستیار هوشمند سایبان» هستی.
- اگر خواب ثبت نشده یا صفر است بگو خواب ثبت نشده، اگر زیر ۶ ساعت است هشدار کم‌خوابی بده.
- اگر خلق‌وخو ۱ یا ۲ است تایید احساس و راهکار تنفس بده.
- اگر آب کم است تذکر بده. اگر بالای ۲۰۰۰ml است تشویق کن.
پاسخ فارسی، مستقیم و بدون سلام و احوال‌پرسی طولانی باشد.`;

        const { response } = await generateWithFallback(
          ai,
          [{ text: systemInstruction }, { text: `داده‌های کاربر:\n${contextPrompt}` }],
          { temperature: 0.3 }
        );
        analysisText = response.text?.trim() || "";
      } catch (err) {
        console.warn("AI analyze failed, running guaranteed local logic:", err);
      }

      // فال‌بک پایدار محلی
      if (!analysisText) {
        const waterVal = userData?.waterToday ?? 0;
        const sleepVal = userData?.sleepHours ?? 0;
        const moodVal = userData?.moodScore ?? 3;
        const pendingT = userData?.pendingTasksToday ?? 0;
        const eventsCount = userData?.eventsToday ?? 0;

        const parts: string[] = [];
        if (sleepVal > 0 && sleepVal < 6) parts.push(`میزان خواب دیشب (${sleepVal} ساعت) کم بوده و استراحت زودهنگام امشب توصیه می‌شود.`);
        else if (sleepVal >= 6) parts.push(`خواب ${sleepVal} ساعته شما ریکاوری مناسبی را فراهم کرده است.`);
        else parts.push(`هنوز ساعات خواب دیشب را ثبت نکرده‌اید.`);

        if (moodVal === 1) parts.push(`تنش و استرس بالایی ثبت کرده‌اید؛ چند دقیقه تنفس آرامش‌بخش در حالت Zen را امتحان کنید.`);
        else if (moodVal === 2) parts.push(`انرژی روحی شما پایین است؛ کارهای سنگین را کاهش دهید.`);
        else if (moodVal >= 4) parts.push(`سطح نشاط و انگیزه شما عالی است.`);

        if (waterVal >= 2000) parts.push(`مصرف آب (${waterVal}ml) در وضعیت ایده‌آل است.`);
        else if (waterVal < 1200) parts.push(`مصرف آب (${waterVal}ml) کم است؛ نوشیدن آب بیشتر به تمرکز کمک می‌کند.`);

        if (pendingT + eventsCount >= 4) parts.push(`امروز با ${eventsCount} رویداد و ${pendingT} وظیفه، روز پرمشغله‌ای دارید.`);
        else parts.push(`برنامه‌های امروز در تعادل مناسبی قرار دارد.`);

        analysisText = parts.join(" ");
      }

      return NextResponse.json({
        text: analysisText,
        actionData: { action: "ANALYZE_RESPONSE" }
      });
    }

    // ----------------------------------------------------
    // حالت ۲: چت در فضای اختصاصی Workspace
    // ----------------------------------------------------
    if (mode === "workspace_chat") {
      const isOngoingConversation = history && history.length > 0;
      const systemInstruction = `تو دستیار هوشمند و برنامه‌ریز شخصی اپلیکیشن «سایبان» هستی.
قوانین بسیار حیاتی و دقیق:
۱. نام تو «دستیار سایبان» است (هرگز از واژه "کورتکس" استفاده نکن).
۱. به هیچ عنوان در میان گفتگو عبارت کلیشه‌ای «سلام، من دستیار سایبان هستم» یا معرفی مجدد خودت را تکرار نکن.
۲. ${isOngoingConversation 
      ? 'این یک گفتگوی ادامه‌دار است؛ نیازی به سلام مجدد و مقدمه‌چینی نیست، مستقیماً، دوستانه و روان به پیام کاربر پاسخ بده.' 
      : 'اگر کاربر سلام کرد، یک سلام گرم و کوتاه بده و مستقیم به اصل موضوع بپرداز.'}
۳. در متن پاسخ هرگز از ماه‌های میلادی (آگوست، سپتامبر و...) استفاده نکن. تاریخ‌ها را به صورت شمسی یا عبارات نسبی (امروز، فردا، پس‌فردا) بیان کن.

۳. جدول قطعی تاریخ‌ها برای فیلد targetDate در خروجی JSON:
   - "امروز" => "${clientToday}"
   - "فردا" => "${clientTomorrow}"
   - "پس‌فردا" یا "پسفردا" => "${clientDayAfter}"
   - در صورت عدم ذکر تاریخ => "${targetDateStr}"

۴. ساخت اکشن‌ها:
   - اگر کاربر گفت جلسه‌ای، ورزشی یا قراری ست شود => action: "ADD_EVENT"
   - اگر کاربر خواست تسکی یا کاری اضافه شود => action: "ADD_TASK"
   - در پیشنهادات عمومی و مشاوره‌ها (مانند Time-Blocking) => action: "NONE"
   - فیلد payload.targetDate حتماً باید بر اساس جدول بالا با تاریخ دقیق YYYY-MM-DD پر شود.`;

      const contents: any[] = [
        { text: systemInstruction },
        { text: contextPrompt }
      ];

      history.slice(-6).forEach((h: any) => {
        contents.push({ text: `${h.sender === 'user' ? 'کاربر' : 'دستیار'}: ${h.content}` });
      });

      contents.push({ text: `پیام جدید کاربر: ${message}` });

      const { response } = await generateWithFallback(
        ai,
        contents,
        {
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: "پاسخ کامل، مستدل و ساختاریافته به زبان فارسی" },
              action: { type: Type.STRING, description: "ADD_TASK, ADD_EVENT, ADD_NOTE, NONE" },
              payload: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "عنوان تمیز بدون تاریخ و کلمات اضافه" },
                  priority: { type: Type.STRING },
                  targetDate: { type: Type.STRING, description: "YYYY-MM-DD دقیق" },
                  time: { type: Type.STRING, description: "HH:MM" },
                  content: { type: Type.STRING }
                },
                required: ["title", "targetDate"]
              }
            },
            required: ["text", "action"]
          },
          temperature: 0.2
        }
      );

      const parsed = JSON.parse(response.text || "{}");

      // لایه ایمنی سرور: اعتبارسنجی قطعی تاریخ در صورت خطای احتمالی مدل
      if (parsed.action && parsed.action !== 'NONE') {
        if (!parsed.payload) parsed.payload = {};
        const lowerMsg = message.toLowerCase();
        
        if (lowerMsg.includes('پس‌فردا') || lowerMsg.includes('پسفردا') || lowerMsg.includes('۲ روز بعد')) {
          parsed.payload.targetDate = clientDayAfter;
        } else if (lowerMsg.includes('فردا')) {
          parsed.payload.targetDate = clientTomorrow;
        } else if (!parsed.payload.targetDate) {
          parsed.payload.targetDate = targetDateStr;
        }

        if (!parsed.payload.title) {
          parsed.payload.title = "مورد جدید";
        }
      }

      return NextResponse.json({
        text: parsed.text || "درخواست شما پردازش شد.",
        actionData: parsed
      });
    }

    // ----------------------------------------------------
    // حالت ۳: فرامین مستقیم (Command Mode)
    // ----------------------------------------------------
    if (mode === "command") {
      const systemInstruction = `You are the structured command parser for "Sayeban". Convert Persian text into clean JSON actions.
Exact Date Reference:
- "امروز" => ${clientToday}
- "فردا" => ${clientTomorrow}
- "پس‌فردا" or "پسفردا" => ${clientDayAfter}
- default => ${targetDateStr}`;

      const { response } = await generateWithFallback(
        ai,
        message,
        {
          systemInstruction,
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              action: { type: Type.STRING },
              payload: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  priority: { type: Type.STRING },
                  targetDate: { type: Type.STRING },
                  time: { type: Type.STRING },
                  content: { type: Type.STRING }
                },
                required: ["title", "targetDate"]
              }
            },
            required: ["text", "action"]
          },
          temperature: 0.1
        }
      );

      const parsed = JSON.parse(response.text || "{}");

      if (parsed.action && parsed.action !== 'NONE') {
        if (!parsed.payload) parsed.payload = {};
        const lowerMsg = message.toLowerCase();
        if (lowerMsg.includes('پس‌فردا') || lowerMsg.includes('پسفردا')) {
          parsed.payload.targetDate = clientDayAfter;
        } else if (lowerMsg.includes('فردا')) {
          parsed.payload.targetDate = clientTomorrow;
        } else if (!parsed.payload.targetDate) {
          parsed.payload.targetDate = targetDateStr;
        }
      }

      return NextResponse.json({
        text: parsed.text || "ثبت گردید.",
        actionData: parsed
      });
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (error: any) {
    console.error("AI Route Error:", error);
    return NextResponse.json(
      { text: `⚠️ خطا در پردازش: ${error?.message || "پاسخی دریافت نشد."}`, actionData: { action: "NONE" } },
      { status: 500 }
    );
  }
}