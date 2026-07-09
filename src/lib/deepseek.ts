export type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type ChatRequest = {
  messages: Message[];
  subject: string;
  difficulty: "simple" | "complex";
  mistakeContext?: string;
};

export type ChatResponse = {
  content: string;
  earnedCoins: number;
  luckySprint?: {
    active: boolean;
    multiplier: number;
    questionsRemaining: number;
  };
};

const MODEL_FLASH = "deepseek-chat"; // v4 Flash
const MODEL_PRO = "deepseek-reasoner"; // v4 Pro

export async function chat(request: ChatRequest): Promise<ChatResponse> {
  const { messages, subject, difficulty, mistakeContext } = request;

  const model = difficulty === "complex" ? MODEL_PRO : MODEL_FLASH;

  let systemPrompt = `You are a friendly AI tutor for Cambridge CIE ${subject}.
You help a Year 10-13 student understand concepts.
- Explain clearly and conversationally, like a supportive older sibling
- Use examples and simple language first, then layer in technical terms
- If the student has a misconception, gently correct them without making them feel bad
- Suggest related topics they might want to explore next
- Keep answers concise but thorough enough for learning
- Use the Socratic method when appropriate — guide them to discover answers themselves`;

  // Append mistake context if available
  if (mistakeContext) {
    systemPrompt += `\n\n${mistakeContext}`;
  }

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.slice(-10), // keep last 10 messages for context
      ],
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("DeepSeek API error:", error);
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "";

  // Simple coin calculation: hard questions earn more
  const baseCoins = difficulty === "complex" ? 25 : 10;
  const earnedCoins = baseCoins;

  return {
    content,
    earnedCoins,
  };
}
