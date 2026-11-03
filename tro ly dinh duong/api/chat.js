export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5-5",
        max_tokens: 1000,
        system: "Bạn là trợ lý thực đơn nhà hàng.",
        messages: [{ role: "user", content: message }],
      }),
    });

    const data = await response.json();
    res.status(200).json({ reply: data.content?.[0]?.text ?? "" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}
