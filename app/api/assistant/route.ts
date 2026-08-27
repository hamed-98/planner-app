import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { executeAiGateway, AiProviderConfig } from "@/lib/ai/gateway";

function formatFriendlyErrorMessage(error: any): string {
  const errStr = typeof error === "string" ? error : (error?.message || JSON.stringify(error) || "");

  if (errStr.includes("429") || errStr.includes("rate-limited") || errStr.includes("RESOURCE_EXHAUSTED")) {
    return "⚠️ ترافیک مدل موقتاً پر است یا به سقف مجاز رسیده‌اید (خطای ۴۲۹). لطفاً لحظاتی دیگر تلاش کنید.";
  }
  if (errStr.includes("403") || errStr.includes("Forbidden") || errStr.includes("location is not supported")) {
    return "⚠️ دسترسی به ارائه‌دهنده هوش مصنوعی به دلیل محدودیت جغرافیایی یا تحریم IP مسدود است (خطای ۴۰۳).";
  }
  if (errStr.includes("401") || errStr.includes("API key not valid") || errStr.includes("Unauthorized")) {
    return "⚠️ کلید API ارائه‌دهنده نامعتبر یا منقضی است (خطای ۴۰۱).";
  }
  if (errStr.includes("fetch failed") || errStr.includes("ENOTFOUND") || errStr.includes("ETIMEDOUT") || errStr.includes("AbortError")) {
    return "⚠️ برقراری ارتباط با ارائه‌دهنده هوش مصنوعی با تاخیر یا قطعی مواجه شد. لطفاً اتصال اینترنت را بررسی فرمایید.";
  }

  return `⚠️ پردازش با مشکل مواجه شد: ${error?.message?.slice(0, 140) || "پاسخی از مدل دریافت نشد."}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, mode, userData, history = [] } = body;

    if (typeof message === "string" && message.trim().length > 1200) {
      return NextResponse.json(
        {
          text: "⚠️ طول پیام بیش از حد مجاز است. لطفاً در حداکثر ۱۰۰۰ کاراکتر خلاصه فرمایید.",
          actionData: { action: "NONE", payload: {} }
        },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    let currentUsage = 0;

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

      currentUsage = usageRecord?.request_count || 0;

      if (currentUsage >= dailyLimit) {
        return NextResponse.json(
          {
            text: `⚠️ سقف مجاز روزانه شما برای هوش مصنوعی (${dailyLimit} پیام در پلن ${userPlan === "free" ? "رایگان" : "پرو"}) به پایان رسیده است.`,
            actionData: { action: "NONE", payload: {} },
            isLimitReached: true,
            currentUsage,
            dailyLimit
          },
          { status: 429 }
        );
      }
    }

    // واکشی لیست ارائه‌دهندگان
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

    // افزودن کلیدهای جمینای سرور به انتهای صف فال‌بک
    const geminiKeys = (process.env.GEMINI_API_KEY || "")
      .split(",")
      .map(k => k.trim())
      .filter(k => k.length > 10 && !k.includes("MY_GEMINI"));

    geminiKeys.forEach((k, idx) => {
      if (!providers.some(p => p.apiKey === k)) {
        providers.push({
          id: `env-gemini-fallback-${idx}`,
          name: `Google Gemini 3.7 Flash (${idx + 1})`,
          providerType: "gemini_native",
          apiKey: k,
          model: "gemini-3.6-flash",
          priority: 999 + idx,
          isActive: true
        });
      }
    });

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
    // حالت ۱: تحلیل روزانه پیشخوان
    // ----------------------------------------------------
    if (mode === "analyze") {
      let analysisText = "";
      try {
        const systemInstruction = `تو دستیار تندرستی و مشاور هوشمند اپلیکیشن «سایبان» هستی.
داده‌های کاربر را با لحنی صمیمی، دلسوزانه و تحلیل‌گرانه در ۳ تا ۴ جمله پیوسته بررسی کن.
قوانین:
۱. برای آب فقط از واحد «لیوان» نسبت به هدف ۸ لیوان صحبت کن.
۲. ارتباط میان کم‌خوابی، کم‌آبی و عملکرد شناختی را در صورت وجود داده گوشزد کن.
۳. پاسخ بدون مقدمه‌چینی طولانی و مستقیماً به موضوع بپردازد.`;

        const result = await executeAiGateway(providers, {
          systemInstruction,
          messages: [{ role: "user", content: contextPrompt }],
          temperature: 0.3,
          jsonMode: false
        });
        analysisText = result.text;
      } catch {}

      if (!analysisText) {
        const waterGlasses = userData?.waterToday ?? 0;
        const sleepVal = userData?.sleepHours ?? 0;
        const moodVal = userData?.moodScore ?? 3;
        const pendingT = userData?.pendingTasksToday ?? 0;
        const eventsCount = userData?.eventsToday ?? 0;

        const parts: string[] = [];
        if (sleepVal > 0 && sleepVal < 6) parts.push(`میزان خواب دیشب (${sleepVal} ساعت) کم بوده و استراحت زودهنگام امشب توصیه می‌شود.`);
        else if (sleepVal >= 6) parts.push(`خواب ${sleepVal} ساعته شما ریکاوری مناسبی فراهم کرده است.`);
        else parts.push(`ساعات خواب دیشب هنوز ثبت نشده است.`);

        if (moodVal === 1) parts.push(`تنش بالایی ثبت کرده‌اید؛ چند دقیقه تمرین تنفس آرام را پیشنهاد می‌کنم.`);
        else if (moodVal >= 4) parts.push(`سطح انگیزه و نشاط شما عالی است.`);

        if (waterGlasses >= 8) parts.push(`مصرف آب شما (${waterGlasses} لیوان) کامل و در وضعیت ایده‌آل است.`);
        else if (waterGlasses < 4) parts.push(`مصرف آب (${waterGlasses} لیوان) پایین است و تا هدف ۸ لیوان فاصله دارید.`);

        if (pendingT + eventsCount >= 4) parts.push(`امروز با ${eventsCount} رویداد و ${pendingT} وظیفه، روز پرمشغله‌ای دارید.`);
        else parts.push(`برنامه‌های امروز در تعادل است.`);

        analysisText = parts.join(" ");
      }

      // ثبت مصرف فقط در صورت موفقیت
      if (userId) {
        currentUsage += 1;
        await authenticatedSupabase.from("user_ai_usage").upsert(
          { user_id: userId, usage_date: clientToday, request_count: currentUsage, created_at: new Date().toISOString() },
          { onConflict: "user_id,usage_date" }
        );
      }

      return NextResponse.json({
        text: analysisText,
        actionData: { action: "ANALYZE_RESPONSE" },
        currentUsage,
        dailyLimit
      });
    }

    // ----------------------------------------------------
    // حالت ۲: چت در فضای Workspace
    // ----------------------------------------------------
    if (mode === "workspace_chat") {
      const isOngoing = history && history.length > 0;

      const systemInstruction = `تو «دستیار سایبان»، مشاور و برنامه‌ریز شخصی هوشمند، دلسوز و متفکر هستی.
وظیفه: راهنمایی، برنامه‌ریزی، تحلیل وضعیت شناختی و همراهی کاربر با لحنی پخته، صمیمی و همدلانه.

فرمت خروجی الزامی:
یک JSON معتبر با ساختار:
{"text": "متن کامل، گرم و تحلیلی پاسخ شما به زبان فارسی", "action": "NONE"|"ADD_TASK"|"ADD_EVENT"|"ADD_NOTE", "payload": {"title": "عنوان کوتاه", "targetDate": "YYYY-MM-DD", "time": "HH:MM", "priority": "HIGH"|"MEDIUM"|"LOW"}}

قوانین حیاتی:
۱. متن درون فیلد "text" هرگز نباید رباتیک، خشک یا تک‌خطی باشد. مثل یک مشاور کاربلد توضیح بده و به پیوند داده‌های سلامت (خواب، آب، خستگی) با عملکرد ذهنی توجه کن.
۲. ${isOngoing ? "این گفتگوی ادامه‌دار است؛ نیازی به سلام و معرفی مجدد خودت نیست." : "در پیام اول یک سلام کوتاه بده و سپس به اصل مطلب بپرداز."}
۳. در مورد آب فقط از واحد «لیوان آب» (از هدف ۸ لیوان) صحبت کن.
۴. تاریخ‌ها را به صورت نسبی (امروز، فردا، پس‌فردا) یا شمسی بیان کن (نام ماه‌های میلادی نگو).
۵. ساخت اکشن:
   - رویداد، قرار، جلسه یا ورزش با ساعت معین => action: "ADD_EVENT"
   - وظیفه و کارهای مشخص => action: "ADD_TASK"
   - گفتگوهای عمومی، سوالات، مشاوره‌ها و توصیه‌ها => action: "NONE"
۶. فیلد targetDate در payload باید تاریخ دقیق میلادی باشد:
   - امروز: ${clientToday}
   - فردا: ${clientTomorrow}
   - پس‌فردا: ${clientDayAfter}
   - نامشخص: ${targetDateStr}`;

      const formattedMessages: { role: "system" | "user" | "assistant"; content: string }[] = [];
      formattedMessages.push({ role: "system", content: contextPrompt });

      history.slice(-6).forEach((h: any) => {
        formattedMessages.push({
          role: h.sender === "user" ? "user" : "assistant",
          content: h.content
        });
      });

      formattedMessages.push({ role: "user", content: message });

      const result = await executeAiGateway(providers, {
        systemInstruction,
        messages: formattedMessages,
        temperature: 0.35,
        jsonMode: true
      });

      const parsed = result.actionData || { action: "NONE" };

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

      // ثبت مصرف موفق
      if (userId) {
        currentUsage += 1;
        await authenticatedSupabase.from("user_ai_usage").upsert(
          { user_id: userId, usage_date: clientToday, request_count: currentUsage, created_at: new Date().toISOString() },
          { onConflict: "user_id,usage_date" }
        );
      }

      return NextResponse.json({
        text: parsed.text || result.text || "درخواست شما بررسی شد.",
        actionData: {
          ...parsed,
          provider: result.providerUsed // 👈 ارسال نام مدل فعال
        },
        currentUsage,
        dailyLimit
      });
    }

    // ----------------------------------------------------
    // حالت ۳: فرامین صوتی/مستقیم
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

      if (userId) {
        currentUsage += 1;
        await authenticatedSupabase.from("user_ai_usage").upsert(
          { user_id: userId, usage_date: clientToday, request_count: currentUsage, created_at: new Date().toISOString() },
          { onConflict: "user_id,usage_date" }
        );
      }

      return NextResponse.json({
        text: parsed.text || result.text || "ثبت گردید.",
        actionData: parsed,
        currentUsage,
        dailyLimit
      });
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (error: any) {
    console.error("AI API Execution Error:", error);
    const friendlyError = formatFriendlyErrorMessage(error);

    return NextResponse.json(
      {
        text: friendlyError,
        actionData: { action: "NONE", payload: {} }
      },
      { status: 500 }
    );
  }
}