import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, mode, userData, customApiKey } = body;

    let rawKey = customApiKey || process.env.GEMINI_API_KEY;
    let aiDailyLimit = 20;

    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder"
      );
      const { data: keysData } = await supabaseAdmin
        .from("global_settings")
        .select("value")
        .eq("id", "api_keys")
        .maybeSingle();

      if (keysData?.value?.gemini) {
        rawKey = keysData.value.gemini;
      }

      const { data: flagsData } = await supabaseAdmin
        .from("global_settings")
        .select("value")
        .eq("id", "feature_flags")
        .maybeSingle();

      if (flagsData?.value?.ai_daily_limit !== undefined) {
        aiDailyLimit = flagsData.value.ai_daily_limit;
      }
    } catch (e) {
      console.log("Could not fetch global settings key, using env fallback");
    }

    const isValidKey = typeof rawKey === "string" && rawKey.trim().length > 10 && !rawKey.includes("MY_GEMINI");

    let responseText = "";
    let actionData: any = null;
    let usingDemoFallback = false;

    if (isValidKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey: rawKey!.trim(),
        });

        if (mode === "analyze") {
          const targetDateStr = userData?.targetDate || new Date().toISOString().split("T")[0];

          const systemInstruction = `تو دستیار ارشد نوروساینس، تندرستی و روانشناسی شناختی اپلیکیشن "سایبان" هستی.
وظیفه: تحلیل داده‌های بیومتریک و رویدادهای امروز کاربر با لحنی صمیمی، دلسوز، علمی و واقع‌بینانه در حداکثر ۳ تا ۴ جمله.

قوانین تحلیلی مهم:
۱. خلق‌وخو (moodScore از ۱ تا ۵):
   - اگر ۱ (عصبی/بحرانی) یا ۲ (خسته/بی‌حوصله) است، حتماً احساس کاربر را تایید کن و راهکار تخلیه بار هیجانی آمیگدال (مانند ۵ دقیقه تنفس Zen یا بازسازی فکر در CBT) پیشنهاد بده.
   - اگر ۴ یا ۵ است، شادابی و انگیزه او را تبریک بگو.
۲. خواب (sleepHours):
   - اگر زیر ۶ ساعت است، هشدار بده و راهکار چرت عصرگاهی یا خواب زودهنگام امشب را مطرح کن (هرگز نگو خواب کافی دارید!).
۳. آب (waterToday):
   - اگر زیر ۱۵۰۰ml است، ضرورت هیدراتاسیون برای جلوگیری از خستگی ذهنی را گوشزد کن.
۴. برنامه‌ها و رویدادها (eventsToday و pendingTasksToday):
   - اگر مجموع رویدادها و تسک‌ها بالا است، شلوغ بودن روز را تصدیق کن و پیشنهاد مسدودسازی زمانی (Time-Blocking) بده.

پاسخ بدون سلام و احوال‌پرسی طولانی و بدون تاریخ تکراری باشد.`;

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
              { text: systemInstruction },
              {
                text: `داده‌های وضعیت کاربر برای روز (${targetDateStr}):\n${JSON.stringify(userData, null, 2)}`,
              },
            ],
            config: {
              temperature: 0.3,
            },
          });

          responseText = response.text?.trim() || "امروز فرصتی عالی برای متمرکز ماندن و هدایت انرژی است!";
          actionData = { action: "ANALYZE_RESPONSE" };
        } else if (mode === "command") {
          const targetDateStr = userData?.targetDate || new Date().toISOString().split("T")[0];
          const realToday = new Date().toISOString().split("T")[0];

          const systemInstruction = `تو دستیار متنی هوشمند اپلیکیشن سایبان هستی. وظیفه تو تبدیل جملات کاربر به یک خروجی JSON ساختاریافته است.

انواع اکشن‌ها:
- "ADD_TASK": برای کارهایی که ددلاین دارند، اولویت دارند یا لیست کارهاست.
- "ADD_EVENT": برای قرار ملاقات‌ها، رویدادها، زمان‌بندی‌های تقویم.
- "ADD_NOTE": برای یادداشت موارد عمومی، پروژه‌ها و چک‌نویس‌ها.
- "NONE": چت عمومی یا در صورتی که دستوری وجود نداشت.

راهنمای تاریخ:
- تاریخ واقعی امروز: ${realToday}
- تاریخ انتخابی کاربر در UI: ${targetDateStr}
- اگر کاربر گفت "امروز"، تاریخ را ${realToday} و اگر گفت "فردا"، تاریخ را دقیقا یک روز بعد بگذار.
- عبارات زمانی را درون title یا content قرار نده.

پاسخ را در قالب JSON معتبر تحویل بده.`;

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: message,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  text: {
                    type: Type.STRING,
                    description: "پاسخ دوستانه و مودبانه به کاربر به فارسی",
                  },
                  action: {
                    type: Type.STRING,
                    description: "ADD_TASK, ADD_EVENT, ADD_NOTE, NONE",
                  },
                  payload: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING, description: "عنوان مورد ایجاد شده" },
                      priority: { type: Type.STRING, description: "HIGH, MEDIUM, LOW" },
                      dueDate: { type: Type.STRING, description: "YYYY-MM-DD" },
                      time: { type: Type.STRING, description: "HH:MM" },
                      date: { type: Type.STRING, description: "YYYY-MM-DD" },
                      content: { type: Type.STRING, description: "متن یادداشت یا توضیحات" },
                    },
                  },
                },
                required: ["text", "action"],
              },
              temperature: 0.2,
            },
          });

          const textOutput = response.text || "{}";
          const parsed = JSON.parse(textOutput);
          responseText = parsed.text;
          actionData = parsed;
        } else {
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: message,
            config: {
              systemInstruction:
                "تو دستیار هوشمند و روانشناس حامی 'سایبان' هستی. به زبان فارسی روان، شیوا و علمی در رابطه با مدیریت استرس، خواب، بهره‌وری و حال خوب پاسخ بده.",
              temperature: 0.6,
            },
          });
          responseText = response.text || "من اینجام تا در سازماندهی ذهن و کارهایت همراهت باشم.";
        }
      } catch (geminiError: any) {
        console.log("Gemini API issue. Activating local fallback:", geminiError?.message || geminiError);
        usingDemoFallback = true;
      }
    } else {
      usingDemoFallback = true;
    }

    // موتور فال‌بک بومی در صورت قطعی یا عدم اتصال به سرور هوش مصنوعی
    if (usingDemoFallback) {
      if (mode === "analyze") {
        const waterVal = userData?.waterToday ?? 0;
        const sleepVal = userData?.sleepHours ?? 0;
        const moodVal = userData?.moodScore ?? 3;
        const pendingT = userData?.pendingTasksToday ?? userData?.pendingTasks ?? 0;
        const eventsCount = userData?.eventsToday ?? 0;

        const parts: string[] = [];

        // تحلیل خواب
        if (sleepVal > 0 && sleepVal < 6) {
          parts.push(`میزان خواب دیشب شما (${sleepVal} ساعت) پایین بوده و برای جلوگیری از خستگی مفرط کورتکس، استراحت زودهنگام امشب ضروری است.`);
        } else if (sleepVal >= 6 && sleepVal <= 9) {
          parts.push(`خواب ${sleepVal} ساعته شما ریکاوری مناسبی را برای پردازش‌های ذهنی فراهم کرده است.`);
        } else if (sleepVal > 9) {
          parts.push(`میزان خواب شما بیش از حد معمول ثبت شده؛ تنظیم ریتم خواب به شادابی بیشتر کمک می‌کند.`);
        }

        // تحلیل خلق‌وخو
        if (moodVal === 1) {
          parts.push(`حس عصبانیت و تنش بالایی تجربه می‌کنید؛ پیشنهاد می‌کنم ۵ دقیقه در مود Zen کایزن تنفس عمیق داشته باشید یا افکارتان را در بخش CBT ثبت کنید.`);
        } else if (moodVal === 2) {
          parts.push(`انرژی روحی پایینی دارید؛ فشار کاری را کاهش دهید و کارهای غیرضروری را به تعویق بیندازید.`);
        } else if (moodVal >= 4) {
          parts.push(`سطح نشاط و انگیزه شما عالی است؛ زمان مناسبی برای پیشبرد چالش‌برانگیزترین کارهای روز است.`);
        }

        // تحلیل آب
        if (waterVal < 1200) {
          parts.push(`مصرف آب (${waterVal}ml) بسیار کم است؛ نوشیدن آب کافی تمرکز حافظه کاری را تا ۲۰٪ بالا می‌برد.`);
        }

        // تحلیل رویدادها و تسک‌ها
        const totalItems = pendingT + eventsCount;
        if (totalItems >= 4) {
          parts.push(`امروز با داشتن ${eventsCount} رویداد در تقویم و ${pendingT} وظیفه، روز پرمشغله‌ای پیش رو دارید؛ روی اولویت‌های اصلی تمرکز کنید.`);
        } else if (totalItems > 0) {
          parts.push(`برنامه‌های امروز شما در تعادل مناسبی است.`);
        } else {
          parts.push(`برنامه کاری امروز خلوت است؛ فرصتی عالی برای تمرین در باشگاه مغز.`);
        }

        responseText = parts.join(" ") || "روز خوبی را برای شما آرزومندم!";
        actionData = { action: "ANALYZE_RESPONSE" };
      } else if (mode === "command") {
        let msg = message.toLowerCase();
        const persianNumbers = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
        for (let i = 0; i < 10; i++) {
          msg = msg.replace(persianNumbers[i], String(i));
        }

        let action = "NONE";
        let title = "مورد جدید";
        let priority = "MEDIUM";
        let content = "ثبت شده توسط دستیار آفلاین سایبان";
        const targetDateStr = userData?.targetDate || new Date().toISOString().split("T")[0];
        let dueDate = targetDateStr;
        let time = "12:00";
        let date = targetDateStr;

        if (msg.includes("فردا")) {
          const tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
          const tomorrowStr = tomorrow.toISOString().split("T")[0];
          dueDate = tomorrowStr;
          date = tomorrowStr;
        }

        const timeMatch = msg.match(/ساعت\s*(\d{1,2})(?::(\d{2}))?|(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          const hr = timeMatch[1] || timeMatch[3];
          const mn = timeMatch[2] || timeMatch[4] || "00";
          time = `${hr.padStart(2, "0")}:${mn}`;
        }

        if (msg.includes("کار") || msg.includes("وظیفه") || msg.includes("تسک") || msg.includes("todo")) {
          action = "ADD_TASK";
          title = message.replace(/(کار|اضافه کن|فردا|امروز|وظیفه|تکمیل|لطفا|ساعت\s*\S+)/gi, "").trim() || "وظیفه جدید";
          if (msg.includes("فوری") || msg.includes("مهم")) priority = "HIGH";
        } else if (msg.includes("جلسه") || msg.includes("رویداد") || msg.includes("قرار") || msg.includes("تقویم")) {
          action = "ADD_EVENT";
          title = message.replace(/(جلسه|قرار|رویداد|اضافه کن|فردا|امروز|تقویم|لطفا|ساعت\s*\S+)/gi, "").trim() || "رویداد جدید";
        } else if (msg.includes("یادداشت") || msg.includes("بنویس") || msg.includes("ایده")) {
          action = "ADD_NOTE";
          title = message.replace(/(یادداشت|بنویس|ثبت|ایده|جدید|لطفا)/gi, "").trim() || "ایده جدید";
        }

        let labelText = "";
        if (action === "ADD_TASK") labelText = `وظیفه "${title}" در لیست کارهای روز ثبت گردید.`;
        else if (action === "ADD_EVENT") labelText = `رویداد "${title}" برای ساعت ${time} در تقویم ثبت شد.`;
        else if (action === "ADD_NOTE") labelText = `یادداشت جدید با عنوان "${title}" ایجاد شد.`;
        else labelText = "پیام شما دریافت شد.";

        responseText = labelText;
        actionData = {
          text: responseText,
          action,
          payload: { title, priority, dueDate, time, date, content },
        };
      }
    }

    return NextResponse.json({
      text: responseText,
      actionData,
      isDemo: usingDemoFallback,
      hasValidKey: isValidKey,
      aiDailyLimit,
    });
  } catch (error: any) {
    console.error("Gemini API Route Error:", error);
    return NextResponse.json(
      {
        text: "دستیار در حال حاضر با داده‌های محلی پاسخگوی شماست.",
        isDemo: true,
        aiDailyLimit: 5,
      },
      { status: 200 }
    );
  }
}