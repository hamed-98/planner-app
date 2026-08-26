import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { executeAiGateway, AiProviderConfig } from "@/lib/ai/gateway";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, mode, userData, history = [] } = body;

    // اعتبارسنجی طول پیام ورودی
    if (typeof message === "string" && message.trim().length > 1200) {
      return NextResponse.json(
        {
          text: "⚠️ طول پیام شما بیش از حد مجاز است. لطفاً درخواست خود را در حداکثر ۱۰۰۰ کاراکتر خلاصه فرمایید.",
          actionData: { action: "NONE", payload: {} }
        },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ۱. بررسی احراز هویت و سهمیه مصرف روزانه در سرور
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    let userPlan: "free" | "pro" | "team" = "free";
    let token = "";

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "");
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

    const clientToday = userData?.clientToday || new Date().toISOString().split("T")[0];
    const targetDateStr = userData?.targetDate || clientToday;

    const clientTodayObj = new Date(clientToday + "T12:00:00Z");
    const clientTomorrow = new Date(clientTodayObj.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const clientDayAfter = new Date(clientTodayObj.getTime() + 48 * 60 * 60 * 1000).toISOString().split("T")[0];

    const dailyLimit = userPlan === "pro" ? 100 : userPlan === "team" ? 250 : 15;
    let newUsageCount = 1;

    const authenticatedSupabase = token
      ? createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "", {
          global: { headers: { Authorization: `Bearer ${token}` } }
        })
      : supabase;

    if (userId) {
      const { data: usageRecord } = await authenticatedSupabase
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

      newUsageCount = currentCount + 1;
      await authenticatedSupabase.from("user_ai_usage").upsert(
        {
          user_id: userId,
          usage_date: clientToday,
          request_count: newUsageCount,
          created_at: new Date().toISOString()
        },
        { onConflict: "user_id,usage_date" }
      );
    }

    // ۲. دریافت لیست پویا از پرووایدرها (ابتدا از دیتابیس، در غیر این صورت از .env)
    let providers: AiProviderConfig[] = [];

    try {
      const { data: dbSettings } = await supabase
        .from("global_settings")
        .select("value")
        .eq("id", "ai_providers")
        .maybeSingle();

      if (dbSettings?.value && Array.isArray(dbSettings.value) && dbSettings.value.length > 0) {
        providers = dbSettings.value;
      }
    } catch {}

    // فال‌بک پیش‌فرض در صورت نبود تنظیمات در دیتابیس
    const geminiKeys = (process.env.GEMINI_API_KEY || "")
      .split(",")
      .map(k => k.trim())
      .filter(k => k.length > 10 && !k.includes("MY_GEMINI"));

    geminiKeys.forEach((k, idx) => {
      if (!providers.some(p => p.apiKey === k)) {
        providers.push({
          id: `env-gemini-fallback-${idx}`,
          name: `Google Gemini Native (Fallback ${idx + 1})`,
          providerType: "gemini_native",
          apiKey: k,
          model: "gemini-3.7-flash",
          priority: 999 + idx,
          isActive: true
        });
      }
    });

    // ۳. آماده‌سازی کانتکست مشترک داده‌های سلامت بر حسب واحد لیوان
    const contextPrompt = `داده‌های وضعیت کاربر (${userData?.userName || "کاربر"}):
- تاریخ امروز سیستم: ${clientToday}
- فردا: ${clientTomorrow}
- پس‌فردا: ${clientDayAfter}
- وضعیت خواب دیشب: ${userData?.sleepHours ? `${userData.sleepHours} ساعت (کیفیت: ${userData.sleepQuality || "خوب"})` : "هنوز ثبت نشده"}
- وضعیت مصرف آب امروز: ${userData?.waterToday || 0} لیوان از هدف ۸ لیوان
- خلق‌وخو: ${userData?.moodScore ? `${userData.moodScore} از ۵` : "هنوز ثبت نشده"}
- کارهای مانده امروز: ${userData?.pendingTasksToday || 0} مورد
- رویدادهای تقویم امروز: ${userData?.eventsToday || 0} مورد
- وضعیت باشگاه مغز: حافظه کاری (${userData?.brainMemory ?? 0} از ۱۰۰)، انعطاف استروپ (${userData?.brainFlexibility ?? 0} از ۱۰۰)، زمان واکنش (${userData?.brainReaction ? `${userData.brainReaction}ms` : "بدون آزمون"})`;

    // ----------------------------------------------------
    // حالت ۱: تحلیل سلامت پیشخوان (Analyze Mode)
    // ----------------------------------------------------
    if (mode === "analyze") {
      let analysisText = "";
      try {
        const systemInstruction = `تو مشاور سلامت و تندرستی شناختی اپلیکیشن "سایبان" هستی.
وظیفه: تحلیل داده‌های امروز کاربر در ۳ تا ۴ جمله کوتاه، مستقیم و علمی.
قوانین:
- در مورد آب فقط از واحد «تعداد لیوان آب» نسبت به هدف ۸ لیوان صحبت کن و هرگز میلی‌لیتر نگو.
- اگر خواب زیر ۶ ساعت است هشدار کم‌خوابی بده.
- پاسخ مستقیم، صمیمی و بدون سلام و احوال‌پرسی طولانی باشد.`;

        console.log(`[AI Gateway] Active Providers Loaded: ${providers.map(p => p.name).join(' -> ')}`);
        const result = await executeAiGateway(providers, {
          systemInstruction,
          messages: [{ role: "user", content: contextPrompt }],
          temperature: 0.3,
          jsonMode: false
        });

        analysisText = result.text;
      } catch {}

      // فال‌بک بومی در صورت قطعی کامل
      if (!analysisText) {
        const waterGlasses = userData?.waterToday ?? 0;
        const sleepVal = userData?.sleepHours ?? 0;
        const moodVal = userData?.moodScore ?? 3;
        const pendingT = userData?.pendingTasksToday ?? 0;
        const eventsCount = userData?.eventsToday ?? 0;

        const parts: string[] = [];
        if (sleepVal > 0 && sleepVal < 6) {
          parts.push(`میزان خواب دیشب (${sleepVal} ساعت) کم بوده و استراحت زودهنگام امشب توصیه می‌شود.`);
        } else if (sleepVal >= 6) {
          parts.push(`خواب ${sleepVal} ساعته شما ریکاوری مناسبی فراهم کرده است.`);
        } else {
          parts.push(`ساعات خواب دیشب هنوز ثبت نشده است.`);
        }

        if (moodVal === 1) parts.push(`تنش بالایی ثبت کرده‌اید؛ چند دقیقه تمرین تنفس آرام را پیشنهاد می‌کنم.`);
        else if (moodVal >= 4) parts.push(`سطح انگیزه و نشاط شما عالی است.`);

        if (waterGlasses >= 8) parts.push(`مصرف آب شما (${waterGlasses} لیوان) کامل و در وضعیت ایده‌آل است.`);
        else if (waterGlasses < 4) parts.push(`مصرف آب (${waterGlasses} لیوان) پایین است و تا هدف ۸ لیوان فاصله دارید.`);

        if (pendingT + eventsCount >= 4) parts.push(`امروز با ${eventsCount} رویداد و ${pendingT} وظیفه، روز پرمشغله‌ای دارید.`);
        else parts.push(`برنامه‌های امروز در تعادل است.`);

        analysisText = parts.join(" ");
      }

      return NextResponse.json({
        text: analysisText,
        actionData: { action: "ANALYZE_RESPONSE" },
        currentUsage: newUsageCount,
        dailyLimit
      });
    }

    // ----------------------------------------------------
    // حالت ۲: چت در فضای Workspace
    // ----------------------------------------------------
    if (mode === "workspace_chat") {
      const isOngoing = history && history.length > 0;

      const systemInstruction = `You are the intelligent cognitive assistant for the "Sayeban" productivity app.
Respond strictly in natural Persian with a structured JSON format containing {"text": "...", "action": "...", "payload": {...}}.

Tone and Rules:
1. ${isOngoing ? "This is an ongoing conversation; respond directly without repeating introductions or greetings." : "If the user greets, give a warm, brief greeting and answer directly."}
2. Water intake must strictly use "لیوان" (glasses of water out of 8), never milliliters.
3. In text, always refer to dates relatively (امروز, فردا, پس‌فردا) or in Jalali/Solar Hijri. Never use Gregorian month names (August, etc.).

Action Generation Rules:
- "ADD_EVENT": For workouts, meetings, doctor visits, appointments with specific times.
- "ADD_TASK": For to-dos, checklists, chores.
- "NONE": For normal conversational questions, time-blocking recommendations, or advice.
- When action is NOT "NONE", fill payload: {"title": "Clean short title", "targetDate": "YYYY-MM-DD", "time": "HH:MM", "priority": "HIGH"|"MEDIUM"|"LOW"}.

Exact Gregorian Date Reference for targetDate:
- "امروز" => "${clientToday}"
- "فردا" => "${clientTomorrow}"
- "پس‌فردا" or "پسفردا" => "${clientDayAfter}"
- default => "${targetDateStr}"`;

      const formattedMessages: { role: "system" | "user" | "assistant"; content: string }[] = [];
      formattedMessages.push({ role: "system", content: contextPrompt });

      history.slice(-6).forEach((h: any) => {
        formattedMessages.push({
          role: h.sender === "user" ? "user" : "assistant",
          content: h.content
        });
      });

      formattedMessages.push({ role: "user", content: message });
      console.log(`[AI Gateway] Active Providers Loaded: ${providers.map(p => p.name).join(' -> ')}`);
      const result = await executeAiGateway(providers, {
        systemInstruction,
        messages: formattedMessages,
        temperature: 0.2,
        jsonMode: true
      });

      const parsed = result.actionData || { action: "NONE" };

      // اعتبارسنجی قطعی تاریخ روی سرور
      if (parsed.action && parsed.action !== "NONE") {
        if (!parsed.payload) parsed.payload = {};
        const lowerMsg = message.toLowerCase();
        if (lowerMsg.includes("پس‌فردا") || lowerMsg.includes("پسفردا") || lowerMsg.includes("۲ روز بعد")) {
          parsed.payload.targetDate = clientDayAfter;
        } else if (lowerMsg.includes("فردا")) {
          parsed.payload.targetDate = clientTomorrow;
        } else if (!parsed.payload.targetDate) {
          parsed.payload.targetDate = targetDateStr;
        }
      }

      return NextResponse.json({
        text: result.text || parsed.text || "درخواست شما پردازش شد.",
        actionData: parsed,
        currentUsage: newUsageCount,
        dailyLimit
      });
    }

    // ----------------------------------------------------
    // حالت ۳: فرامین مستقیم (Command Mode)
    // ----------------------------------------------------
    if (mode === "command") {
      const systemInstruction = `You are the structured command parser for "Sayeban". Convert Persian input into a clean JSON action.
Exact Date Reference:
- "امروز" => ${clientToday}
- "فردا" => ${clientTomorrow}
- "پس‌فردا" or "پسفردا" => ${clientDayAfter}
- default => ${targetDateStr}

Schema: {"text": "پاسخ کوتاه فارسی", "action": "ADD_TASK"|"ADD_EVENT"|"NONE", "payload": {"title": "...", "targetDate": "YYYY-MM-DD", "time": "HH:MM"}}`;

      const result = await executeAiGateway(providers, {
        systemInstruction,
        messages: [{ role: "user", content: message }],
        temperature: 0.1,
        jsonMode: true
      });

      const parsed = result.actionData || { action: "NONE" };
      if (parsed.action && parsed.action !== "NONE") {
        if (!parsed.payload) parsed.payload = {};
        const lowerMsg = message.toLowerCase();
        if (lowerMsg.includes("پس‌فردا") || lowerMsg.includes("پسفردا")) {
          parsed.payload.targetDate = clientDayAfter;
        } else if (lowerMsg.includes("فردا")) {
          parsed.payload.targetDate = clientTomorrow;
        } else if (!parsed.payload.targetDate) {
          parsed.payload.targetDate = targetDateStr;
        }
      }

      return NextResponse.json({
        text: result.text || parsed.text || "ثبت گردید.",
        actionData: parsed,
        currentUsage: newUsageCount,
        dailyLimit
      });
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (error: any) {
    console.error("AI API Error:", error);
    return NextResponse.json(
      {
        text: `⚠️ خطا در پردازش هوش مصنوعی: ${error?.message || "پاسخی دریافت نشد."}`,
        actionData: { action: "NONE", payload: {} }
      },
      { status: 500 }
    );
  }
}