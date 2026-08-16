import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, mode, userData, customApiKey } = body;

    let rawKey = process.env.GEMINI_API_KEY;
    let aiDailyLimit = 5;
    
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
      );
      const { data: keysData } = await supabaseAdmin.from('global_settings').select('value').eq('id', 'api_keys').single();
      if (keysData?.value?.gemini) {
        rawKey = keysData.value.gemini;
      }
      const { data: flagsData } = await supabaseAdmin.from('global_settings').select('value').eq('id', 'feature_flags').single();
      if (flagsData?.value?.ai_daily_limit !== undefined) {
        aiDailyLimit = flagsData.value.ai_daily_limit;
      }
    } catch (e) {
      console.log('Could not fetch global settings key, using env fallback');
    }
    
    // Check if the key is a valid Gemini key structure (usually starts with AIzaSy)
    const isValidKey = typeof rawKey === "string" && rawKey.trim().length > 10 && !rawKey.includes("MY_GEMINI");

    let responseText = "";
    let actionData: any = null;
    let usingDemoFallback = false;

    if (isValidKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey: rawKey!.trim(),
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        if (mode === "analyze") {
          // Proactive advice based on water logs, sleep, tasks completed/pending, mood, and habits/medicines
          const targetDateStr = userData?.targetDate || new Date().toISOString().split('T')[0];
          
          const systemInstruction = `تو دستیار تندرستی و روانشناس هوشمند "سایبان" هستی. اطلاعات سلامت و اهداف کاربر را تحلیل کن و یک تحلیل کوتاه، بسیار متمرکز، انگیزاننده و کاربردی ارائه بده.
مقررات پاسخ:
۱. در اولین خط، تاریخ را به صورت شمسی بنویس (مثلا: "روز شما بخیر؛ امروز دوشنبه، ۹ تیر ۱۴۰۵...").
۲. با لحن آرامش‌بخش، محترم، مربی‌منش و کاملاً دلسوزانه صحبت کن.
۳. در حد ۱ یا ۲ پاراگراف کوتاه (حداکثر ۱۲۰ کلمه) پاسخ بده تا مصرف توکن به حداقل برسد.
۴. آمار ارسالی (شامل آب مصرفی، ساعت و کیفیت خواب، امتیاز خلق‌و‌خو، وضعیت تسک‌ها، مکمل‌ها و عادت‌ها) را با هم تلفیق کن و یک راهکار علمی کوچک و کاملاً ملموس برای ادامه‌ی روز پیشنهاد بده. از گزافه‌گویی، کلمات کلیشه‌ای و تکراری خودداری کن.`;

          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: [
              { text: systemInstruction },
              { text: `اطلاعات سلامت کاربر برای امروز (${targetDateStr}):\n${JSON.stringify(userData)}` }
            ],
            config: {
              temperature: 0.4,
            }
          });
          responseText = response.text || "امروز فرصتی عالی برای بهینه‌سازی عادات سالم و پیشبرد اهداف است!";
          actionData = { action: "ANALYZE_RESPONSE" };
        } else if (mode === "command") {
          // Natural language command parsing
          const targetDateStr = userData?.targetDate || new Date().toISOString().split('T')[0];
          const realToday = new Date().toISOString().split('T')[0];
          const systemInstruction = `تو دستیار متنی هوشمند اپلیکیشن سایبان هستی. وظیفه تو تبدیل جملات کاربر به یک خروجی JSON ساختاریافته است.

انواع اکشن‌ها:
- "ADD_TASK": برای کارهایی که ددلاین دارند، اولویت دارند یا لیست کارهاست. مانند: "کار طراحی پروپوزال با اولویت بالا تا فردا اضافه کن"
- "ADD_EVENT": برای قرار ملاقات‌ها، رویدادها، زمان‌بندی‌های تقویم. مانند: "جلسه با مدیر ساعت ۱۵ فردا هماهنگ شه"
- "ADD_NOTE": برای یادداشت موارد عمومی، پروژه‌ها و چک‌نویس‌ها. مانند: "یک یادداشت جدید به عنوان خریدهای خانه ایجاد کن"
- "NONE": چت عمومی یا در صورتی که نتوانستی هیچ یک از دستورات بالا را متوجه بشی.

راهنمای مقداردهی تاریخ و زمان (بسیار مهم):
- تاریخ واقعی امروز: ${realToday}
- تاریخی که کاربر هم‌اکنون در رابط‌کاربری روی آن قرار دارد: ${targetDateStr}
- اگر کاربر به کلماتی مانند "امروز" اشاره کرد، تاریخ dueDate یا date را برابر ${realToday} تنظیم کن.
- اگر کاربر به کلماتی مانند "فردا" اشاره کرد، دقیقا یک روز به تاریخ واقعی امروز (${realToday}) اضافه کن. (مثلا اگر امروز 19ام است، فردا میشود 20ام).
- اگر کاربر اصلا در مورد تاریخ صحبتی نکرد، از تاریخی که کاربر هم‌اکنون در رابط کاربری است (${targetDateStr}) استفاده کن.
- به هیچ عنوان عبارات زمانی، تاریخ میلادی یا شمسی را درون فیلدهای title یا content قرار نده! (مثلا نگو "ورزش با اکبر 2026-06-20" بلکه فقط بنویس "ورزش با اکبر").
- اگر کاربر به ساعت خاصی اشاره نکرد، برای وظایف (Task) فیلد time را پر نکن و برای رویدادها (Event) یک ساعت پیش‌فرض استراحت یا آزاد را در نظر بگیر یا خالی بگذار.

حتماً پاسخ را در ساختار JSON معتبر تحویل بده بدون هیچ مارک‌داون یا توضیح اضافه.`;

          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: message,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING, description: "پاسخ دوستانه و مودبانه به کاربر به فارسی" },
                  action: { type: Type.STRING, description: "ADD_TASK, ADD_EVENT, ADD_NOTE, NONE" },
                  payload: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING, description: "عنوان مورد ایجاد شده" },
                      priority: { type: Type.STRING, description: "HIGH, MEDIUM, LOW" },
                      dueDate: { type: Type.STRING, description: "YYYY-MM-DD" },
                      time: { type: Type.STRING, description: "HH:MM format" },
                      date: { type: Type.STRING, description: "YYYY-MM-DD format" },
                      content: { type: Type.STRING, description: "Default note content or item description" }
                    }
                  }
                },
                required: ["text", "action"]
              },
              temperature: 0.2,
            }
          });
          
          const textOutput = response.text || "{}";
          const parsed = JSON.parse(textOutput);
          responseText = parsed.text;
          actionData = parsed;
        } else {
          // General supportive smart advice conversation
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: message,
            config: {
              systemInstruction: "تو دستیار هوشمند و ردیاب زندگی سالم 'سایبان' هستی. حامی مهربان، متین، خردمند و خوش‌بیان. به زبان فارسی روان، شیوا و تأثیرگذار در رابطه با بهره‌وری، مدیریت زمان، کاهش استرس و ارتقای سلامت پاسخ بده.",
              temperature: 0.7,
            }
          });
          responseText = response.text || "من اینجا هستم تا با هم قدم به قدم روزهای آرام و پرباری بسازیم.";
        }
      } catch (geminiError: any) {
        // Fallback to demo mode gracefully without logging a fatal error object
        console.log("Gemini rate limit or error encountered. Activating local fallback mode.");
        usingDemoFallback = true;
      }
    } else {
      usingDemoFallback = true;
    }

    // High fidelity Persian local rule-based heuristic engine fallback
    if (usingDemoFallback) {
      if (mode === "analyze") {
        const waterVal = userData?.waterToday || 0;
        const sleepVal = userData?.sleepHours || 0;
        const pendingT = userData?.pendingTasks || 0;

        let sleepStatus = "خواب کافی دارید.";
        if (sleepVal < 6) sleepStatus = "میزان خواب دیشب شما اندک بوده است؛ لطفاً امشب زودتر استراحت کنید.";
        else if (sleepVal > 9) sleepStatus = "خواب شما بیش از حد نرمال بوده است، تلاش کنید ریتم منظم‌تری داشته باشید.";

        let waterStatus = "نوشیدن آب عالی است.";
        if (waterVal < 1000) waterStatus = "امروز آب بسیار کمی نوشیده‌اید؛ نوشیدن حداقل ۸ لیوان آب برای سلامت کورتکس و شادابی سلولی الزامی است.";

        let taskStatus = "امروز روز خلوتی دارید.";
        if (pendingT > 0) taskStatus = `شما ${pendingT} پرونده کاری در نوبت اقدام دارید با برنامه‌ریزی گام به گام جلو بروید.`;

        responseText = `تحلیل سبک زندگی امروز: ${waterStatus} ${sleepStatus} ${taskStatus} شاد و پرانرژی باشید! (💡 حالت دمو فعال است: ثبت کلید API در تنظیمات، هوش خلاق جمینای را کاملاً فعال می‌کند)`;
        actionData = { action: "ANALYZE_RESPONSE" };
      } else if (mode === "command") {
        // Local parsing logic to detect task, events or notes
        let msg = message.toLowerCase();

        // Convert Persian/Arabic numbers to English numbers
        const persianNumbers = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
        const arabicNumbers  = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
        for(let i=0; i<10; i++) {
          msg = msg.replace(persianNumbers[i], String(i)).replace(arabicNumbers[i], String(i));
        }

        let action = "NONE";
        let title = "مورد جدید";
        let priority = "MEDIUM";
        let content = "توضیحات پیش‌فرض ایجاد شده توسط هسته محلی دستیار سایبان";
        const targetDateStr = userData?.targetDate || new Date().toISOString().split('T')[0];
        let dueDate = targetDateStr;
        let time = "12:00";
        let date = targetDateStr;

        if (msg.includes("فردا")) {
          const tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
          const tomorrowStr = tomorrow.toISOString().split('T')[0];
          dueDate = tomorrowStr;
          date = tomorrowStr;
        }

        // Global time extraction like "ساعت 18", "18:30" or "ساعت 18:30"
        const timeMatch = msg.match(/ساعت\s*(\d{1,2})(?::(\d{2}))?|(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          const hr = timeMatch[1] || timeMatch[3];
          const mn = timeMatch[2] || timeMatch[4] || "00";
          time = `${hr.padStart(2, '0')}:${mn}`;
        }

        if (msg.includes("کار") || msg.includes("وظیفه") || msg.includes("todo") || msg.includes("تکمیل") || msg.includes("ورزش")) {
          action = "ADD_TASK";
          title = message.replace(/(کار|اضافه کن|فردا|امروز|وظیفه|تکمیل|لطفا|ساعت\s*\S+)/gi, "").trim() || "وظیفه جدید پایش کورتکس";
          if (msg.includes("فوری") || msg.includes("مهم") || msg.includes("ضروری")) priority = "HIGH";
          if (msg.includes("کم") || msg.includes("ساده")) priority = "LOW";
        } else if (msg.includes("جلسه") || msg.includes("رویداد") || msg.includes("قرار") || msg.includes("تقویم") || msg.includes("کلاس") || msg.includes("ملاقات")) {
          action = "ADD_EVENT";
          title = message.replace(/(جلسه|قرار|رویداد|اضافه کن|فردا|امروز|تقویم|لطفا|ساعت\s*\S+)/gi, "").trim() || "رویداد جدید";
        } else if (msg.includes("یادداشت") || msg.includes("بنویس") || msg.includes("ثبت") || msg.includes("ایده")) {
          action = "ADD_NOTE";
          title = message.replace(/(یادداشت|بنویس|ثبت|ایده|جدید|لطفا)/gi, "").trim() || "ایده تازه مکتوب";
          content = `# یادداشت خودکار دستیار لوکال\n\n- ثبت شده بر اساس دستور شما: "${message}"\n- لطفا کلید API جمینای را متصل کنید تا متن‌های غنی‌تری ایجاد شود.`;
        }

        let labelText = "";
        if (action === "ADD_TASK") labelText = `وظیفه "${title}" با اولویت ${priority} در کارهای امروز ثبت گردید.`;
        else if (action === "ADD_EVENT") labelText = `رویداد روزانه "${title}" برای ساعت ${time} بر روی تقویم سایبان متصل شد.`;
        else if (action === "ADD_NOTE") labelText = `یک یادداشت هوشمند با عنوان "${title}" مکتوب گردید.`;
        else labelText = "من یک هوش مصنوعی شبیه‌ساز آفلاین هستم. از حضور ارزشمند شما صمیمانه خوشحالم! با اتصال کلید API در پیشخوان، همه‌چیز چندین برابر جذاب‌تر می‌شود.";

        responseText = `${labelText} (💡 در حال کار در وضعیت دمو)`;
        actionData = {
          text: responseText,
          action,
          payload: { title, priority, dueDate, time, date, content }
        };
      } else {
        responseText = `دستیار آفلاین سایبان در خدمت شماست! برای فعال‌سازی کامل خدمات روان‌شناسی، تحلیل عمیق‌تر خواب و تندرستی لطفا کلید API معتبر گوگل (GEMINI_API_KEY) را در تب پیکربندی سامانه ذخیره نمایید. بدین ترتیب سامانه مستقیماً به مدل‌های جمینای ۳.۵ متصل می‌شود.`;
      }
    }

    return NextResponse.json({ 
      text: responseText, 
      actionData, 
      isDemo: usingDemoFallback,
      hasValidKey: isValidKey,
      aiDailyLimit
    });
  } catch (error: any) {
    console.log("Gemini route handling fallback:", error.message);
    return NextResponse.json({ 
      text: "ارتباط موقت قطع شده است؛ اما دستیار لوکال کماکان در خدمت شماست تا کارهایتان را ثبت کند!",
      isDemo: true,
      aiDailyLimit: 5
    }, { status: 200 });
  }
}
