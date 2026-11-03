export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Chỉ nhận POST' });
  
  const { message, healthContext } = req.body;
  const prompt = `Đây là câu hỏi của người dùng: "${message}". 
    Dữ liệu y khoa ẩn danh: ${healthContext.ref}. Thông tin thêm: ${healthContext.extra}.
    Trả lời bằng JSON với cấu trúc: 
    { "tom_tat": "string", "nen_an": [{"mon":"Tên", "luong":"định lượng", "ly_do":"lý do"}], "han_che": [...], "khong_nen": [...], "luu_y": "string", "gap_bac_si": boolean }`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });

  const rawData = await response.json();
  const text = rawData.candidates[0].content.parts[0].text;
  
  // Tách JSON ra khỏi chuỗi markdown của Gemini và trả về web
  const cleanJson = text.replace(/```json|```/g, '').trim(); 
  res.status(200).json(JSON.parse(cleanJson));
}
