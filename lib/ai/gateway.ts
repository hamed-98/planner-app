import { GoogleGenAI } from "@google/genai";

export interface AiProviderConfig {
  id: string;
  name: string;
  providerType: "openai_compatible" | "gemini_native";
  baseUrl?: string;
  apiKey: string;
  model: string;
  priority: number;
  isActive: boolean;
  timeoutMs?: number;
}

export interface GatewayRequestOptions {
  systemInstruction: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  temperature?: number;
  jsonMode?: boolean;
}

export interface GatewayResponse {
  text: string;
  actionData: {
    action: string;
    payload?: any;
    text?: string;
  };
  providerUsed: string;
}

// تابع کمکی برای استخراج و تمیز کردن JSON از خروجی تمام مدل‌ها
// تابع کمکی برای باز کردن بازگشتی متن از درون هر نوع آبجکت یا JSON تو در تو
function sanitizeExtractedText(val: any): string {
  if (typeof val === "string") {
    const trimmed = val.trim();
    // اگر داخل رشته یک JSON پنهان شده باشد
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const inner = JSON.parse(trimmed);
        return sanitizeExtractedText(inner.text || inner.message || inner);
      } catch {}
    }
    return trimmed;
  }
  if (typeof val === "object" && val !== null) {
    if (val.text) return sanitizeExtractedText(val.text);
    if (val.message) return sanitizeExtractedText(val.message);
  }
  return "";
}

function extractJsonFromText(rawText: string): any {
  if (!rawText || !rawText.trim()) {
    return { text: "در خدمت شما هستم، چه کمکی از دستم برمی‌آید؟", action: "NONE", payload: {} };
  }

  // حذف تگ‌های تفکر و مارک‌داون
  let clean = rawText
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  // تلاش ۱: پارس مستقیم
  try {
    const parsed = JSON.parse(clean);
    if (typeof parsed === "object" && parsed !== null) {
      const finalText = sanitizeExtractedText(parsed.text || parsed.message || parsed);
      return {
        text: finalText || clean,
        action: parsed.action || "NONE",
        payload: parsed.payload || {}
      };
    }
  } catch {}

  // تلاش ۲: یافتن اولین و آخرین براکت JSON در متن
  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      const parsed = JSON.parse(clean.substring(firstBrace, lastBrace + 1));
      if (typeof parsed === "object" && parsed !== null) {
        const finalText = sanitizeExtractedText(parsed.text || parsed.message || parsed);
        return {
          text: finalText || clean,
          action: parsed.action || "NONE",
          payload: parsed.payload || {}
        };
      }
    } catch {}
  }

  // تلاش ۳: اگر مدل کلاً JSON تولید نکرد و متن معمولی فرستاد
  return { text: clean, action: "NONE", payload: {} };
}
// فراخوانی پرووایدرهای سازگار با پروتکل استاندارد OpenAI (ZenMux / DeepSeek / OpenRouter / Qwen)
async function callOpenAiCompatible(
  provider: AiProviderConfig,
  options: GatewayRequestOptions
): Promise<GatewayResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), provider.timeoutMs || 15000);

  const baseUrl = (provider.baseUrl || "https://api.openai.com/v1").replace(/\/+$/, "");
  const endpoint = `${baseUrl}/chat/completions`;

  const payloadMessages = [
    { role: "system", content: options.systemInstruction },
    ...options.messages
  ];

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${provider.apiKey.trim()}`,
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "Sayeban App"
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: provider.model,
        messages: payloadMessages,
        temperature: options.temperature ?? 0.3,
        ...(options.jsonMode ? { response_format: { type: "json_object" } } : {})
      })
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Provider [${provider.name}] HTTP ${res.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0]?.message;

    // استخراج پاسخ از فیلد content یا reasoning_content (مخصوص مدلهای Nemotron و DeepSeek R1)
    let rawContent = choice?.content || choice?.text || choice?.reasoning_content || choice?.reasoning || "";

    // حذف تگ‌های تفکر داخلی مدل‌های استدلالی
    if (typeof rawContent === 'string') {
      rawContent = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    }

    if (options.jsonMode) {
      const parsed = extractJsonFromText(rawContent);
      return {
        text: parsed.text || "در خدمت شما هستم.",
        actionData: parsed,
        providerUsed: provider.name
      };
    }

    return {
      text: rawContent.trim(),
      actionData: { action: "NONE", payload: {} },
      providerUsed: provider.name
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

// فراخوانی موتور Gemini Native
// فراخوانی موتور Gemini Native بدون خطای ۴۰۰
async function callGeminiNative(
  provider: AiProviderConfig,
  options: GatewayRequestOptions
): Promise<GatewayResponse> {
  const ai = new GoogleGenAI({ apiKey: provider.apiKey.trim() });

  // فرمت استاندارد پیام‌ها در SDK جدید گوگل (فقط نقش‌های user و model معتبرند)
  const contents: any[] = options.messages
    .filter(m => m.content && m.content.trim())
    .map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

  if (contents.length === 0) {
    contents.push({ role: "user", parts: [{ text: "سلام" }] });
  }

  const config: any = {
    systemInstruction: options.systemInstruction,
    temperature: options.temperature ?? 0.3,
  };

  if (options.jsonMode) {
    config.responseMimeType = "application/json";
  }

  const response = await ai.models.generateContent({
    model: provider.model || "gemini-3.6-flash",
    contents,
    config
  });

  const rawText = response.text || "";

  if (options.jsonMode) {
    const parsed = extractJsonFromText(rawText);
    return {
      text: parsed.text || "درخواست شما پردازش شد.",
      actionData: parsed,
      providerUsed: provider.name
    };
  }

  return {
    text: rawText.trim(),
    actionData: { action: "NONE", payload: {} },
    providerUsed: provider.name
  };
}

// تابع اصلی اجرای هوشمند و آبشاری (Failover Cascade)
export async function executeAiGateway(
  providers: AiProviderConfig[],
  options: GatewayRequestOptions
): Promise<GatewayResponse> {
  const activeProviders = providers
    .filter(p => p.isActive && p.apiKey && p.apiKey.length > 5)
    .sort((a, b) => a.priority - b.priority);

  if (activeProviders.length === 0) {
    throw new Error("هیچ ارائه‌دهنده فعال هوش مصنوعی با کلید معتبر یافت نشد.");
  }

  let lastError: any = null;

  for (const provider of activeProviders) {
    try {
      if (provider.providerType === "gemini_native") {
        return await callGeminiNative(provider, options);
      } else {
        return await callOpenAiCompatible(provider, options);
      }
    } catch (err: any) {
      console.warn(`[AI Gateway] Provider "${provider.name}" failed: ${err?.message || err}. Trying next in cascade...`);
      lastError = err;
    }
  }

  throw lastError || new Error("تمامی سرویس‌های متصل هوش مصنوعی با خطا مواجه شدند.");
}