const MODEL = "gemini-2.5-flash";

const SYSTEM = `Bạn là trợ lý dinh dưỡng cho người Việt. Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu.
Dựa vào danh sách bệnh và thông tin thêm của người dùng để chia món ăn thành 3 nhóm:
- nen_an: món nên ăn
- han_che: món ăn được nhưng không nhiều (kèm luong: lượng gợi ý)
- khong_nen: món không nên ăn
Mỗi nhóm tối đa 6 món. Không chẩn đoán bệnh, không kê thuốc.
Đặt gap_bac_si = true nếu người dùng có dấu hiệu nặng, đang mang thai, dùng thuốc cần lưu ý, hoặc có nhiều bệnh cùng lúc.`;

const item = (extra = {}) => ({
  type: "OBJECT",
  properties: {
    mon: { type: "STRING" },
    ly_do: { type: "STRING" },
    ...extra,
  },
  required: ["mon"],
});

const SCHEMA = {
  type: "OBJECT",
  properties: {
    tom_tat: { type: "STRING" },
    nen_an: { type: "ARRAY", items: item() },
    han_che: { type: "ARRAY", items: item({ luong: { type: "STRING" } }) },
    khong_nen: { type: "ARRAY", items: item() },
    luu_y: { type: "STRING" },
    gap_bac_si: { type: "BOOLEAN" },
  },
  required: ["tom_tat", "nen_an", "han_che", "khong_nen"],
};

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, healthContext } = req.body || {};
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Thiếu câu hỏi" });
  }

  const ref = String(healthContext?.ref ?? "(chưa chọn bệnh nào)").slice(0, 3000);
  const extra = String(healthContext?.extra ?? "(không có)").slice(0, 500);

  const prompt = `Bệnh người dùng đang có và gợi ý tham khảo:\n${ref}\n\nThông tin thêm: ${extra}\n\nCâu hỏi: ${message.slice(0, 300)}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: SCHEMA,
          },
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error("Gemini error:", data);
      return res.status(502).json({ error: data.error?.message || "Gemini error" });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    return res.status(200).json(JSON.parse(text));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
