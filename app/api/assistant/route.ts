// app/api/assistant/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db/prisma";
import { executeAiGateway, AiProviderConfig } from "@/lib/ai/gateway";

// تابع تبدیل خطاهای خام به پیام‌های شفاف فارسی
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
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        {
          text: "⚠️ لطفاً ابتدا وارد حساب کاربری خود شوید.",
          actionData: { action: "NONE", payload: {} },
        },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { message, mode, userData, history = [] } = body;

    // ۱. اعتبارسنجی طول پیام ورودی
    if (typeof message === "string" && message.trim().length > 1200) {
      return NextResponse.json(
        {
          text: "⚠️ طول پیام بیش از حد مجاز است. لطفاً در حداکثر ۱۰۰۰ کاراکتر خلاصه فرمایید.",
          actionData: { action: "NONE", payload: {} },
        },
        { status: 400 },
      );
    }

    // ۲. خواندن تنظیمات سراسری سیستم (Feature Flags) از دیتابیس پریزما
    let featureFlags: any = {
      enable_ai_assistant: true,
      free_tier_daily_limit: 15,
      enable_gemini_fallback: true,
    };

    try {
      const flagRecord = await prisma.globalSetting.findUnique({
        where: { id: "feature_flags" },
      });
      if (flagRecord?.value && typeof flagRecord.value === "object") {
        featureFlags = {
          ...featureFlags,
          ...(flagRecord.value as Record<string, any>),
        };
      }
    } catch {}

    // ۳. بررسی فعال بودن سرویس دستیار هوش مصنوعی
    if (!featureFlags.enable_ai_assistant) {
      return NextResponse.json(
        {
          text: "⚠️ سرویس دستیار هوش مصنوعی در حال حاضر توسط مدیریت سامانه موقتاً غیرفعال شده است.",
          actionData: { action: "NONE", payload: {} },
        },
        { status: 503 },
      );
    }

    // ۴. بررسی پروفایل و محاسبه سهمیه روزانه
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
    });
    const userPlan = profile?.plan || "free";

    const clientToday =
      userData?.clientToday || new Date().toISOString().split("T")[0];
    const targetDateStr = userData?.targetDate || clientToday;

    const clientTodayObj = new Date(clientToday + "T12:00:00Z");
    const clientTomorrow = new Date(
      clientTodayObj.getTime() + 24 * 60 * 60 * 1000,
    )
      .toISOString()
      .split("T")[0];
    const clientDayAfter = new Date(
      clientTodayObj.getTime() + 48 * 60 * 60 * 1000,
    )
      .toISOString()
      .split("T")[0];

    const freeDailyLimit = Number(featureFlags.free_tier_daily_limit) || 15;
    const dailyLimit =
      userPlan === "pro" ? 100 : userPlan === "team" ? 250 : freeDailyLimit;

    const usageRecord = await prisma.userAiUsage.findUnique({
      where: {
        userId_usageDate: {
          userId: user.id,
          usageDate: clientToday,
        },
      },
    });

    let currentUsage = usageRecord?.requestCount || 0;

    if (currentUsage >= dailyLimit) {
      return NextResponse.json(
        {
          text: `⚠️ سقف مجاز روزانه شما برای هوش مصنوعی (${dailyLimit} پیام در پلن ${userPlan === "free" ? "رایگان" : "پرو"}) به پایان رسیده است.`,
          actionData: { action: "NONE", payload: {} },
          isLimitReached: true,
          currentUsage,
          dailyLimit,
        },
        { status: 429 },
      );
    }

    // ۵. واکشی ارائه‌دهندگان از پنل ادمین (اولویت اول)
    let providers: AiProviderConfig[] = [];
    try {
      const dbSettings = await prisma.globalSetting.findUnique({
        where: { id: "ai_providers" },
      });
      if (dbSettings?.value && Array.isArray(dbSettings.value)) {
        // فقط مدل‌های فعال پنل ادمین دریافت می‌شوند
        providers = (dbSettings.value as unknown as AiProviderConfig[]).filter(
          (p) => p.isActive !== false,
        );
      }
    } catch (e) {
      console.error("Failed to load admin AI providers:", e);
    }

    // ۶. بررسی سوئیچ فال‌بک جمینای از پنل ادمین
    // اگر در پنل ادمین سوئیچ خاموش شده باشد (false)، جمینای به هیچ عنوان لود نمی‌شود
    const isGeminiFallbackAllowed =
      featureFlags.enable_gemini_fallback === true;

    if (isGeminiFallbackAllowed) {
      const geminiKeys = (process.env.GEMINI_API_KEY || "")
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 10 && !k.includes("MY_GEMINI"));

      geminiKeys.forEach((k, idx) => {
        if (!providers.some((p) => p.apiKey === k)) {
          providers.push({
            id: `env-gemini-fallback-${idx}`,
            name: `Google Gemini 3.7 Flash (${idx + 1})`,
            providerType: "gemini_native",
            apiKey: k,
            model: "gemini-3.7-flash",
            priority: 9000 + idx, // انتهای صف؛ بعد از تمام مدل‌های پنل ادمین
            isActive: true,
          });
        }
      });
    }

    // ۷. مرتب‌سازی قطعی صف بر اساس Priority (اولویت ۱ زودتر از همه اجرا می‌شود)
    providers.sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));

    if (providers.length === 0) {
      return NextResponse.json({
        text: "⚠️ هیچ ارائه‌دهنده فعالی برای هوش مصنوعی یافت نشد. لطفاً از پنل مدیریت یک مدل تعریف فرمایید.",
        actionData: { action: "NONE", payload: {} },
      });
    }

    // ساخت گزارش تحلیلی و تفکیکی از باشگاه مغز برای پرامپت سیستم
    let brainContextReport = "اطلاعاتی از آزمون‌های شناختی ثبت نشده است.";
    if (userData?.brainMetrics || userData?.brainProfile) {
      const bm = userData.brainMetrics;
      const bp = userData.brainProfile;

      const spatialToday =
        bm?.spatialMemory?.todayAttempts > 0
          ? `${bm.spatialMemory.todayAttempts} تمرین (میانگین نمره: ${bm.spatialMemory.todayScore})`
          : "امروز آزمونی داده نشده";

      const stroopToday =
        bm?.stroopFlexibility?.todayAttempts > 0
          ? `${bm.stroopFlexibility.todayAttempts} تمرین (میانگین نمره: ${bm.stroopFlexibility.todayScore})`
          : "امروز آزمونی داده نشده";

      const mathToday =
        bm?.mathSpeed?.todayAttempts > 0
          ? `${bm.mathSpeed.todayAttempts} تمرین (میانگین نمره: ${bm.mathSpeed.todayScore})`
          : "امروز آزمونی داده نشده";

      const totalAttemptsToday =
        (bm?.spatialMemory?.todayAttempts || 0) +
        (bm?.stroopFlexibility?.todayAttempts || 0) +
        (bm?.mathSpeed?.todayAttempts || 0);

      const memBase =
        typeof bm?.spatialMemory?.score === "number" &&
        !bm?.spatialMemory?.isCalibrating
          ? `${bm.spatialMemory.score} از ۱۰۰`
          : "در حال کالیبراسیون";

      const strBase =
        typeof bm?.stroopFlexibility?.score === "number" &&
        !bm?.stroopFlexibility?.isCalibrating
          ? `${bm.stroopFlexibility.score} از ۱۰۰`
          : "در حال کالیبراسیون";

      const mathBase =
        typeof bm?.mathSpeed?.score === "number" &&
        !bm?.mathSpeed?.isCalibrating
          ? `${bm.mathSpeed.score} از ۱۰۰`
          : "در حال کالیبراسیون";

      const rxTime = bm?.avgReactionTimeMs
        ? `${bm.avgReactionTimeMs}ms`
        : userData.brainReaction
          ? `${userData.brainReaction}ms`
          : "نامشخص";

      const acc =
        bm?.accuracyRate !== null && bm?.accuracyRate !== undefined
          ? `${bm.accuracyRate}٪`
          : "نامشخص";

      const overall =
        bm?.overallIndex ??
        (bp?.memoryScore
          ? Math.round(
              (bp.memoryScore + bp.flexibilityScore + bp.processingSpeed) / 3,
            )
          : null);

      brainContextReport = `  * شاخص کل توانمندی کورتکس: ${overall ? `${overall} از ۱۰۰` : "در حال کالیبراسیون"}
  * حافظه کاری: خط مبنا (${memBase}) | وضعیت امروز: ${spatialToday}
  * انعطاف‌پذیری استروپ: خط مبنا (${strBase}) | وضعیت امروز: ${stroopToday}
  * سرعت محاسبات ذهنی: خط مبنا (${mathBase}) | وضعیت امروز: ${mathToday}
  * میانگین سرعت واکنش عصبی: ${rxTime} | درصد دقت شناختی: ${acc}
  * تلاش‌های شناختی امروز: ${totalAttemptsToday} آزمون (${totalAttemptsToday > 0 ? "قابل استناد و ربط‌دادن به خواب دیشب" : "هشدار: کاربر امروز آزمونی نداده، وضعیت خواب را به نمرات روزهای قبل ربط ندهید"})`;
    }

    const neuroHabitsText =
      userData?.neuroHabitsCompleted !== undefined
        ? `- عادات نورون‌سازی امروز: ${userData.neuroHabitsCompleted} از ${userData.neuroHabitsTotal || 5} ماموریت انجام شده`
        : "";

    const cbtSummaryText = userData?.recentCbtDistortion
      ? `- آخرین بازسازی شناختی (CBT): کار بر روی تحریف «${userData.recentCbtDistortion}»`
      : "";

    const contextPrompt = `داده‌های وضعیت کاربر (${userData?.userName || "کاربر"}):
- تاریخ امروز سیستم: ${clientToday}
- فردا: ${clientTomorrow}
- پس‌فردا: ${clientDayAfter}
- وضعیت خواب دیشب: ${userData?.sleepHours !== null && userData?.sleepHours !== undefined ? `${userData.sleepHours} ساعت (کیفیت: ${userData.sleepQuality || "خوب"})` : "هنوز ثبت نشده"}
- وضعیت مصرف آب امروز: ${userData?.waterToday !== null && userData?.waterToday !== undefined ? `${userData.waterToday} لیوان از هدف ۸ لیوان` : "هنوز ثبت نشده"}
- خلق‌وخو: ${userData?.moodScore ? `${userData.moodScore} از ۵` : "هنوز ثبت نشده"}
- کارهای مانده امروز: ${userData?.pendingTasksToday || 0} مورد
- رویدادهای تقویم امروز: ${userData?.eventsToday || 0} مورد
${neuroHabitsText}
${cbtSummaryText}
- کارنامه شناختی باشگاه مغز:
${brainContextReport}`;

    // تابع کمکی برای افزایش مصرف در پریزما
    const incrementDailyUsage = async () => {
      const updated = await prisma.userAiUsage.upsert({
        where: {
          userId_usageDate: {
            userId: user.id,
            usageDate: clientToday,
          },
        },
        create: {
          id: crypto.randomUUID(),
          userId: user.id,
          usageDate: clientToday,
          requestCount: 1,
        },
        update: {
          requestCount: { increment: 1 },
        },
      });
      return updated.requestCount;
    };

    // ----------------------------------------------------
    // حالت ۱: تحلیل سلامت و انگیزش روزانه (analyze)
    // ----------------------------------------------------
    if (mode === "analyze") {
      let analysisText = "";

      const waterStatus =
        userData?.waterToday === null || userData?.waterToday === undefined
          ? "ثبت‌نشده"
          : `${userData.waterToday} لیوان از هدف ۸ لیوان`;

      const sleepStatus =
        userData?.sleepHours === null || userData?.sleepHours === undefined
          ? "ثبت‌نشده"
          : `${userData.sleepHours} ساعت (کیفیت: ${userData.sleepQuality || "معمولی"})`;

      const analyzePrompt = `وضعیت بیولوژیک و کاری کاربر (${userData?.userName || "کاربر"}) در تاریخ ${userData?.targetDate || "امروز"}:
- هیدراتاسیون: ${waterStatus}
- خواب دیشب: ${sleepStatus}
- سطح انرژی و خلق‌وخو: ${userData?.moodScore ? `${userData.moodScore} از ۵` : "ثبت‌نشده"}
- وزن ثبت‌شده: ${userData?.weight && userData.weight > 0 ? `${userData.weight} کیلوگرم` : "ثبت‌نشده"}
- وظایف باز امروز: ${userData?.pendingTasksToday ?? 0} مورد
- رویدادهای تقویم: ${userData?.eventsToday ?? 0} برنامه
- تسک‌های انجام‌شده: ${userData?.completedTasksToday ?? 0}`;

      try {
        const systemInstruction = `تو یک کوچ ارشد سلامت، نوروساینس و مربی سبک زندگی در اپلیکیشن «سایبان» هستی.
وظیفه تو ارائه تحلیلی گرم، پرانرژی، علمی و ترغیب‌کننده در ۳ تا ۴ جمله منسجم است.

اصول نگارش و لحن:
۱. علم پشت عادات: تأثیر فیزیولوژی روی ذهن را ساده بیان کن؛ مثلاً «کاهش ۲ درصدی آب بدن تا ۲۰ درصد تمرکز و حافظه کاری را کند می‌کند» یا «خواب ناکافی کنترل تکانه و سرعت واکنش مغز را کاهش می‌دهد».
۲. پیوند هوشمند به ابزارهای سایبان (Feature Cross-Promotion):
   - اگر کارها زیاد یا کاربر مضطرب است: او را به «حالت ذن (تایمر تمرکز)» دعوت کن.
   - اگر انرژی یا نشاط بالاست: پیشنهاد کن مغز خود را در «باشگاه مغز (تست استروپ یا حافظه فضایی)» به چالش بکشد.
   - اگر مود پایین یا افکار منفی دارد: یادآوری کن چند خط در «دفترچه بازسازی افکار (CBT)» بنویسد.
   - اگر وضعیت آب یا خواب ثبت نشده: با لحنی مشوق (نه سرزنشگر) بخواه داده‌ها را وارد کند تا نقشه شناختی دقیق‌تری بگیرد.
۳. پرهیز از الگوهای ماشینی: از گفتن کلیشه‌هایی مثل «سلام، من بررسی کردم»، بولت‌پوینت، تیتر یا مقدمه‌چینی رباتیک اکیداً خودداری کن؛ مستقیماً به پیام انگیزاننده و تحلیل روز بپرداز».`;

        const result = await executeAiGateway(providers, {
          systemInstruction,
          messages: [{ role: "user", content: analyzePrompt }],
          temperature: 0.45,
          jsonMode: false,
        });
        analysisText = result.text;
      } catch {}

      // فال‌بک دینامیک، انگیزشی و متصل به فیچرهای برنامه در زمان آفلاین بودن هوش مصنوعی
      if (!analysisText) {
        const waterVal = userData?.waterToday;
        const sleepVal = userData?.sleepHours;
        const moodVal = userData?.moodScore;
        const pendingCount = (userData?.pendingTasksToday ?? 0) + (userData?.eventsToday ?? 0);

        const insights: string[] = [];

        // سناریوی کم‌آبی یا ثبت‌نشده
        if (waterVal === null || waterVal === undefined) {
          insights.push(`ثبت نوشیدن آب را با یک لیوان تازه شروع کن؛ هیدراته ماندن خون‌رسانی به کورتکس مغز را تقویت می‌کند.`);
        } else if (waterVal < 4) {
          insights.push(`هنوز تا سوخت‌گیری کامل فاصله داری! افت آب یعنی افت فوکوس؛ یک لیوان آب بردار تا تمرکزت شارژ شود.`);
        } else if (waterVal >= 8) {
          insights.push(`هدف هیدراتاسیون امروز فتح شد؛ مغزت در بالاترین سطح هدایت عصبی قرار دارد.`);
        }

        // سناریوی خواب و ابزار متناظر
        if (sleepVal !== null && sleepVal !== undefined) {
          if (sleepVal < 6) {
            insights.push(`با خواب ${sleepVal} ساعته، انرژی محدودی در دسترس است؛ کارهای سنگین را خرد کن و تایمرهای کوتاه «حالت ذن» را فعال کن.`);
          } else {
            insights.push(`ریکاوری شبانه خوبی داشتی؛ وقت مناسبی است تا در «باشگاه مغز» رکورد چابکی ذهنی خود را محک بزنی.`);
          }
        }

        // سناریوی مود و CBT
        if (moodVal === 1 || moodVal === 2) {
          insights.push(`اگر بار ذهنی امروز بالاست، پنج دقیقه در بخش CBT افکارت را مکتوب کن تا تخلیه شناختی صورت گیرد.`);
        }

        // بار کاری و تسک‌ها
        if (pendingCount >= 4) {
          insights.push(`${pendingCount} ماموریت کاری در انتظارت است؛ برای جلوگیری از حواس‌پرتی، تمرکز تک‌تسک با صدای امبینت ذن را امتحان کن.`);
        } else {
          insights.push(`ریتم امروز در دستان توست؛ با قدم‌های حساب‌شده روز را بساز.`);
        }

        analysisText = insights.slice(0, 3).join(" ");
      }

      currentUsage = await incrementDailyUsage();

      return NextResponse.json({
        text: analysisText,
        actionData: { action: "ANALYZE_RESPONSE" },
        currentUsage,
        dailyLimit,
      });
    }

    // ----------------------------------------------------
    // حالت ۲: چت در فضای Workspace
    // ----------------------------------------------------
    if (mode === "workspace_chat") {
      const isOngoing = history && history.length > 0;

      const systemInstruction = `تو «دستیار سایبان»، مشاور و همراه هوشمند، دلسوز و بااحساس کاربر هستی.
وظیفه: راهنمایی، برنامه‌ریزی، تحلیل وضعیت شناختی و همراهی کاربر با لحنی پخته، صمیمی و همدلانه.

فرمت خروجی الزامی:
یک JSON معتبر با ساختار:
{"text": "متن کامل، گرم و تحلیلی پاسخ شما به زبان فارسی", "action": "NONE"|"ADD_TASK"|"ADD_EVENT"|"ADD_NOTE", "payload": {"title": "عنوان کوتاه", "targetDate": "YYYY-MM-DD", "time": "HH:MM", "priority": "HIGH"|"MEDIUM"|"LOW"}}

قوانین حیاتی تعامل:
۱. موضوعات سیاسی، اجتماعی، اعتراضات، وقایع حساس و نقد حاکمیت/دولت‌ها:
   -فارسی رو خوب حرف بزن
   - اکیداً از ورود به تحلیل‌های سیاسی، جانبداری، تایید یا رد رویدادهای اعتراضی، نقد مسئولان و تحلیل وقایع سیاسی پرهیز کن.
   - فشار روانی و دغدغه کاربر را در یک جمله محترمانه درک کن، اما بلافاصله مسیر گفتگو را به مراقبت از خود، سلامت روان و مدیریت زندگی هدایت کن:
     (مثلاً: «فشارها و دغدغه‌های روزمره واقعاً سنگین هستند، اما تمرکز من در سایبان بر حفظ آرامش، نظم ذهنی و برنامه‌های فردی شماست. چطور می‌توانم در مدیریت کارهای امروز یا کاهش استرس به شما کمک کنم؟»).
۲. احساسات و درددل‌های فردی (خستگی کار، تنش‌های شخصی، افت انگیزه):
   - کاملاً همدل، صمیمی، گوش‌شنوا و بدون قضاوت باش.
۳. برای احوال‌پرسی، چت خودمانی یا سوالات غیرتحلیلی:
   - پاسخی گرم، طبیعی و دوستانه بده و نیازی نیست حتماً بحث را به آمار خواب و آب وصل کنی.
۴. برای سوالات تحلیلی و وضعیت روز:
   - داده‌های سلامت (خواب، آب، باشگاه مغز) را مشفقانه و علمی تحلیل کن.
   - هرگز مقادیر «هنوز ثبت نشده» را معادل صفر یا کم‌کاری ندان و نگو مصرف آب صفر است؛ بلکه بگو هنوز ثبت نشده یا مشوقانه بخواه که آن را ثبت کند.
   - در صورت ثبت بودن آب، فقط از واحد «لیوان آب» (از هدف ۸ لیوان) صحبت کن.
   - متن درون فیلد "text" هرگز نباید رباتیک، خشک یا تک‌خطی باشد.
۵. ${isOngoing ? "این گفتگوی ادامه‌دار است؛ نیازی به سلام و معرفی مجدد خودت نیست." : "در پیام اول یک سلام کوتاه بده و سپس به اصل مطلب بپرداز."}
۶. تاریخ‌ها را به صورت نسبی (امروز، فردا، پس‌فردا) یا شمسی بیان کن (نام ماه‌های میلادی نگو).
۷. ساخت اکشن:
   - رویداد، قرار، جلسه یا ورزش با ساعت معین => action: "ADD_EVENT"
   - وظیفه و کارهای مشخص => action: "ADD_TASK"
   - گفتگوهای عمومی، سوالات، مشاوره‌ها و توصیه‌ها => action: "NONE"
۸. فیلد targetDate در payload باید تاریخ دقیق میلادی باشد:
   - امروز: ${clientToday}
   - فردا: ${clientTomorrow}
   - پس‌فردا: ${clientDayAfter}
   - نامشخص: ${targetDateStr}`;

      const formattedMessages: {
        role: "system" | "user" | "assistant";
        content: string;
      }[] = [];
      formattedMessages.push({ role: "system", content: contextPrompt });

      history.slice(-6).forEach((h: any) => {
        formattedMessages.push({
          role: h.sender === "user" ? "user" : "assistant",
          content: h.content,
        });
      });

      formattedMessages.push({ role: "user", content: message });

      const result = await executeAiGateway(providers, {
        systemInstruction,
        messages: formattedMessages,
        temperature: 0.35,
        jsonMode: true,
      });

      const parsed = result.actionData || { action: "NONE" };

      if (parsed.action && parsed.action !== "NONE") {
        if (!parsed.payload) parsed.payload = {};
        const lowerMsg = (message || "").toLowerCase();
        if (
          lowerMsg.includes("پس‌فردا") ||
          lowerMsg.includes("پسفردا") ||
          lowerMsg.includes("۲ روز بعد")
        ) {
          parsed.payload.targetDate = clientDayAfter;
        } else if (lowerMsg.includes("فردا")) {
          parsed.payload.targetDate = clientTomorrow;
        } else if (!parsed.payload.targetDate) {
          parsed.payload.targetDate = targetDateStr;
        }
      }

      currentUsage = await incrementDailyUsage();

      return NextResponse.json({
        text: parsed.text || result.text || "درخواست شما بررسی شد.",
        actionData: {
          ...parsed,
          provider: result.providerUsed,
        },
        providerUsed: result.providerUsed,
        currentUsage,
        dailyLimit,
      });
    }

    // ----------------------------------------------------
    // حالت ۳: فرامین مستقیم (command)
    // ----------------------------------------------------
    if (mode === "command") {
      const systemInstruction = `تو موتور پردازش فرامین سریع «سایبان» هستی.
وظیفه: تبدیل دستورات متنی کاربر به عملیات ساخت کار (ADD_TASK)، ساخت رویداد تقویم (ADD_EVENT) یا یادداشت (ADD_NOTE).

قوانین پردازش:
۱. اگر ورودی یک دستور واضح برای ثبت تسک، جلسه یا یادداشت است:
   - اکشن مناسب را با فیلدهای payload پر کن.
   - تاریخ‌های مرجع: امروز=${clientToday} | فردا=${clientTomorrow} | پس‌فردا=${clientDayAfter}
   - فیلد text: یک تاییدیه کوتاه و روان فارسی (مثلاً: «رویداد با موفقیت در تقویم ثبت شد.»).
۲. اگر ورودی یک دستور عملیاتی نیست (مثلاً چت معمولی، درددل، شوخی، سلام یا متن نامرتبط):
   - مقدار action را "NONE" بگذار.
   - فیلد text: بنویس: «من برای ثبت سریع کارها، رویدادها و یادداشت‌ها طراحی شده‌ام. برای مثال بنویسید: «فردا ساعت ۱۸ جلسه کاری اضافه کن» یا «وظیفه خرید کتاب»».`;

      const result = await executeAiGateway(providers, {
        systemInstruction,
        messages: [{ role: "user", content: message }],
        temperature: 0.1,
        jsonMode: true,
      });

      const parsed = result.actionData || { action: "NONE" };
      if (parsed.action && parsed.action !== "NONE") {
        if (!parsed.payload) parsed.payload = {};
        const lowerMsg = (message || "").toLowerCase();
        if (lowerMsg.includes("پس‌فردا") || lowerMsg.includes("پسفردا")) {
          parsed.payload.targetDate = clientDayAfter;
        } else if (lowerMsg.includes("فردا")) {
          parsed.payload.targetDate = clientTomorrow;
        } else if (!parsed.payload.targetDate) {
          parsed.payload.targetDate = targetDateStr;
        }
      }

      currentUsage = await incrementDailyUsage();

      return NextResponse.json({
        text: parsed.text || result.text || "ثبت گردید.",
        actionData: parsed,
        currentUsage,
        dailyLimit,
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
      { status: 200 }
    );
  }
}