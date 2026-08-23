import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// لیست مدل‌های به‌روز برای سوییچ خودکار در زمان لیمیت یا ترافیک
const FALLBACK_MODELS = [
  "gemini-3.7-flash",        // جدیدترین مدل برای کدنویسی
  "gemini-3.6-flash",        // جدیدترین Flash
  "gemini-3.5-flash",        // Flash پایدار
  "gemini-3.5-flash-lite",   // نسخه اقتصادی 3.5
  "gemini-3.1-pro-preview",  // نسخه Pro
  "gemini-3.1-flash-lite" ,   // نسخه اقتصادی 3.1
  "gemini-3-flash-preview",   // نسخه پیشرفته 3.0 
];

async function generateWithFallback(ai: GoogleGenAI, contents: any, config: any) {
  let lastError: any = null;
  for (const model of FALLBACK_MODELS) {
    try {
      const response = await ai.models.generateContent({ model, contents, config });
      return { response, modelUsed: model };
    } catch (err: any) {
      console.warn(`Model ${model} failed/limited. Trying fallback... (${err?.message || ''})`);
      lastError = err;
    }
  }
  throw lastError || new Error("All AI fallback models exhausted.");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, mode, userData } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ۱. دریافت توکن احراز هویت از هدر درخواست
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

    // ۲. بررسی و ثبت محدودیت روزانه در سرور
    const clientToday = userData?.clientToday || userData?.targetDate || new Date().toISOString().split("T")[0];
    const targetDateStr = userData?.targetDate || clientToday;

    const dailyLimit = userPlan === "pro" ? 100 : userPlan === "team" ? 250 : 10;

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
            text: `⚠️ سقف مجاز روزانه شما برای هوش مصنوعی (${dailyLimit} درخواست در پلن ${userPlan === "free" ? "رایگان" : "پرو"}) به پایان رسیده است. برای دسترسی بیشتر پلن خود را ارتقا دهید.`,
            actionData: { action: "NONE", payload: {} },
            isLimitReached: true,
            currentUsage: currentCount,
            dailyLimit
          },
          { status: 429 }
        );
      }

      // افزایش شمارنده مصرف در دیتابیس
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

    // ۳. خواندن کلید متمرکز پلتفرم
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
        text: "⚠️ سرویس هوش مصنوعی در حال حاضر در دسترس نیست. لطفاً دقایقی دیگر تلاش کنید.",
        actionData: { action: "NONE", payload: {} }
      }, { status: 503 });
    }

    const ai = new GoogleGenAI({ apiKey: validKey });

    // ۴. حالت تحلیل سلامت (Analyze Mode)
    if (mode === "analyze") {
      let analysisText = "";
      try {
        const systemInstruction = `تو دستیار ارشد نوروساینس و روانشناسی شناختی اپلیکیشن "سایبان" هستی.
داده‌های بیومتریک و برنامه‌های امروز کاربر را در ۳ تا ۴ جمله صمیمی و علمی تحلیل کن.
قوانین:
- خواب زیر ۶ ساعت: هشدار صریح کم‌خوابی و استراحت زودهنگام (نگو کافی است!).
- خلق‌وخو ۱ یا ۲: تایید احساس و راهکار تنفس یا CBT.
- آب زیر ۱۵۰۰ml: تذکر مصرف آب. بالای ۲۰۰۰ml: تشویق هیدراتاسیون عالی.
- مجموع رویدادها و تسک‌ها بالا: تایید شلوغی روز و پیشنهاد اولویت‌بندی.
پاسخ فارسی و مستقیم باشد.`;

        const { response } = await generateWithFallback(
          ai,
          [
            { text: systemInstruction },
            { text: `وضعیت کاربر برای تاریخ (${targetDateStr}):\n${JSON.stringify(userData, null, 2)}` }
          ],
          { temperature: 0.3 }
        );
        analysisText = response.text?.trim() || "";
      } catch {
        // فال‌بک بومی اختصاصی بخش تحلیل سلامت
        const waterVal = userData?.waterToday ?? 0;
        const sleepVal = userData?.sleepHours ?? 0;
        const moodVal = userData?.moodScore ?? 3;
        const pendingT = userData?.pendingTasksToday ?? 0;
        const eventsCount = userData?.eventsToday ?? 0;

        const parts: string[] = [];
        if (sleepVal > 0 && sleepVal < 6) parts.push(`میزان خواب دیشب (${sleepVal} ساعت) پایین بوده و استراحت زودهنگام امشب برای ریکاوری مغز الزامی است.`);
        else if (sleepVal >= 6 && sleepVal <= 9) parts.push(`خواب ${sleepVal} ساعته شما ریکاوری مناسبی فراهم کرده است.`);

        if (moodVal === 1) parts.push(`تنش روحی بالایی دارید؛ ۵ دقیقه تنفس در مود Zen یا ثبت فکر در CBT پیشنهاد می‌شود.`);
        else if (moodVal >= 4) parts.push(`سطح انرژی و انگیزه شما عالی است.`);

        if (waterVal >= 2000) parts.push(`مصرف آب (${waterVal}ml) ایده‌آل است.`);
        else if (waterVal < 1200) parts.push(`مصرف آب (${waterVal}ml) کم است و نیاز به نوشیدن بیشتر دارید.`);

        if (pendingT + eventsCount >= 4) parts.push(`امروز با ${eventsCount} رویداد و ${pendingT} کار، روز شلوغی دارید؛ روی اولویت‌ها تمرکز کنید.`);

        analysisText = parts.join(" ") || "روز پرانرژی و موفقی داشته باشید!";
      }

      return NextResponse.json({
        text: analysisText,
        actionData: { action: "ANALYZE_RESPONSE" }
      });
    }

    // ۵. حالت درک فرامین متنی و صوتی (Command Mode)
    if (mode === "command") {
      const systemInstruction = `You are the structured command parser for the "Sayeban" productivity app.
Convert Persian natural language into strict JSON actions without outputting any internal reasoning.

Date Reference:
- User's Real Today Date: ${clientToday}
- Selected UI Date: ${targetDateStr}

Date Calculations (CRITICAL):
- If user says "امروز", targetDate is ${clientToday}.
- If user says "فردا", targetDate is +1 day after ${clientToday}.
- If user says "پس‌فردا" or "پسفردا", targetDate is +2 days after ${clientToday}.
- If no date is mentioned, use ${targetDateStr}.

Rules:
1. "title": Extract clean title only (e.g., "ورزش با اصغر", "جلسه با تیم"). Strip dates, times, polite words, and verbs.
2. "action": "ADD_EVENT" for meetings/workouts with times, "ADD_TASK" for to-dos, "ADD_NOTE" for notes, "NONE" for chat.
3. "time": "HH:MM" format (24h). Default "12:00" for events.`;

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
              text: { type: Type.STRING, description: "پاسخ بسیار کوتاه و مودبانه فارسی" },
              action: { type: Type.STRING, description: "ADD_TASK, ADD_EVENT, ADD_NOTE, NONE" },
              payload: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Clean title only" },
                  priority: { type: Type.STRING, description: "HIGH, MEDIUM, LOW" },
                  targetDate: { type: Type.STRING, description: "YYYY-MM-DD" },
                  time: { type: Type.STRING, description: "HH:MM" },
                  category: { type: Type.STRING, description: "work, personal, health, learning" },
                  content: { type: Type.STRING, description: "Details or note body" },
                },
                required: ["title", "targetDate"],
              },
            },
            required: ["text", "action"],
          },
          temperature: 0.1,
        }
      );

      const parsed = JSON.parse(response.text || "{}");
      return NextResponse.json({
        text: parsed.text || "درخواست شما پردازش شد.",
        actionData: parsed
      });
    }

    // ۶. چت عمومی
    const { response } = await generateWithFallback(
      ai,
      message,
      {
        systemInstruction: "تو دستیار هوشمند و روانشناس حامی 'سایبان' هستی. به زبان فارسی روان و شیوا پاسخ بده.",
        temperature: 0.7
      }
    );

    return NextResponse.json({
      text: response.text?.trim() || "همراه شما در مسیر رشد و تندرستی هستم."
    });

  } catch (error: any) {
    console.error("AI API Fatal Error:", error);
    return NextResponse.json(
      {
        text: `⚠️ خطا در پردازش: ${error?.message || "پاسخی از سرور دریافت نشد."}`,
        actionData: { action: "NONE", payload: {} }
      },
      { status: 500 }
    );
  }
}