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
function extractJsonFromText(rawText: string): any {
  if (!rawText) return { action: "NONE", payload: {} };
  try {
    const clean = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(clean);
  } catch {
    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(rawText.substring(firstBrace, lastBrace + 1));
      } catch {}
    }
    return { text: rawText, action: "NONE", payload: {} };
  }
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
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000", // 👈 الزامی برای OpenRouter
        "X-Title": "Sayeban App"                                       // 👈 الزامی برای OpenRouter
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
    const rawContent = data.choices?.[0]?.message?.content || "";

    if (options.jsonMode) {
      const parsed = extractJsonFromText(rawContent);
      return {
        text: parsed.text || "درخواست شما پردازش شد.",
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
async function callGeminiNative(
  provider: AiProviderConfig,
  options: GatewayRequestOptions
): Promise<GatewayResponse> {
  const ai = new GoogleGenAI({ apiKey: provider.apiKey.trim() });

  const contents = options.messages.map(m => ({
    text: `${m.role === "user" ? "کاربر" : "دستیار"}: ${m.content}`
  }));

  const response = await ai.models.generateContent({
    model: provider.model || "gemini-3.7-flash",
    contents,
    config: {
      systemInstruction: options.systemInstruction,
      temperature: options.temperature ?? 0.3,
      ...(options.jsonMode
        ? {
            thinkingConfig: { thinkingBudget: 0 },
            responseMimeType: "application/json"
          }
        : {})
    }
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