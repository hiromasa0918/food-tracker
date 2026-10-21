const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://dkdktlvesejghzcbeime.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  "sb_publishable_mW6AckOxRivaj1yGiGGosQ_hgP4jtBt";

const nutritionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    found: { type: "boolean" },
    name: { type: "string" },
    basisMode: { enum: ["amount", "serving", null] },
    basisAmount: { type: ["number", "null"] },
    basisUnit: { enum: ["g", "ml", null] },
    kcal: { type: ["number", "null"] },
    protein: { type: ["number", "null"] },
    carbs: { type: ["number", "null"] },
    fat: { type: ["number", "null"] },
    confidence: { enum: ["high", "medium", "low"] },
    notes: { type: "string" },
  },
  required: [
    "found",
    "name",
    "basisMode",
    "basisAmount",
    "basisUnit",
    "kcal",
    "protein",
    "carbs",
    "fat",
    "confidence",
    "notes",
  ],
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

async function verifyUser(authorization) {
  if (!authorization?.startsWith("Bearer ")) return false;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: authorization,
    },
  });
  return response.ok;
}

function outputText(response) {
  for (const item of response.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) return content.text;
      if (content.type === "refusal" && content.refusal)
        throw Error("图片内容无法处理");
    }
  }
  throw Error("识别服务没有返回结果");
}

function validNutrition(result) {
  if (!result || typeof result.found !== "boolean") return false;
  if (!result.found) return true;
  if (!["amount", "serving"].includes(result.basisMode)) return false;
  if (result.basisMode === "amount") {
    if (!(result.basisAmount > 0)) return false;
    if (!["g", "ml"].includes(result.basisUnit)) return false;
  }
  return ["kcal", "protein", "carbs", "fat"].every(
    (key) =>
      result[key] === null ||
      (Number.isFinite(result[key]) && result[key] >= 0),
  );
}

export async function handler(event) {
  if (event.httpMethod !== "POST")
    return json(405, { error: "只支持 POST 请求" });

  try {
    const authorization =
      event.headers.authorization || event.headers.Authorization;
    if (!(await verifyUser(authorization)))
      return json(401, { error: "登录已失效，请重新登录" });

    if (!process.env.OPENAI_API_KEY)
      return json(503, { error: "网站尚未配置图片识别密钥" });

    const body = JSON.parse(event.body || "{}");
    if (
      typeof body.image !== "string" ||
      !/^data:image\/(?:jpeg|png|webp);base64,/.test(body.image)
    )
      return json(400, { error: "图片格式不正确" });
    if (body.image.length > 5_000_000)
      return json(413, { error: "压缩后的图片仍然过大，请裁剪后重试" });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
        store: false,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: [
                  "Read the nutrition facts label in this image.",
                  "The label may be in Japanese, Chinese, or English.",
                  "Copy values exactly as printed; do not estimate missing nutrients.",
                  "Use total carbohydrate for carbs. Ignore salt, sodium, fiber, and sugar unless needed to understand the table.",
                  "If nutrition is given for a gram or milliliter quantity, return basisMode=amount with that exact quantity and unit.",
                  "If it is only per serving and no physical quantity is shown, return basisMode=serving, basisAmount=1, and basisUnit=null.",
                  "For missing nutrient values return null. If no readable nutrition table exists, return found=false and explain briefly in notes.",
                ].join(" "),
              },
              { type: "input_image", image_url: body.image, detail: "high" },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "nutrition_label",
            strict: true,
            schema: nutritionSchema,
          },
        },
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      console.error(
        "OpenAI response error",
        response.status,
        payload?.error?.code,
      );
      return json(502, { error: "图片识别服务暂时不可用，请稍后重试" });
    }

    const result = JSON.parse(outputText(payload));
    if (!validNutrition(result)) throw Error("识别结果格式不完整");
    return json(200, result);
  } catch (error) {
    console.error("Nutrition analysis failed", error?.message);
    return json(500, { error: "无法读取营养成分表，请换一张清晰照片重试" });
  }
}

export { outputText, validNutrition };
