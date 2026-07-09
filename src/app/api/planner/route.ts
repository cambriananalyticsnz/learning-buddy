import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, level, durationWeeks } = body;

    if (!subject || !level) {
      return NextResponse.json(
        { error: "Missing required fields: subject, level" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a Cambridge CIE curriculum expert. Generate a structured study plan.`;

    const userPrompt = `Create a ${durationWeeks || 8}-week study plan for Cambridge CIE ${subject} at the ${level} level.

The plan should be structured as a JSON array of weeks. Each week has:
- weekNumber: number
- title: string (overall theme for the week)
- topics: array of objects with:
  - name: string (topic name)
  - subtopics: string[] (2-4 specific subtopics)
  - estimatedMinutes: number (estimated study time in minutes)
  - isCompleted: boolean (always false initially)

Cover the ENTIRE ${subject} ${level} syllabus comprehensively across the ${durationWeeks || 8} weeks.
Each week should have 3-5 topics with 2-4 subtopics each.
Total study time should be realistic: roughly 5-10 hours per week.

Return ONLY valid JSON — no markdown code blocks, no additional text.`;

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 4000,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("DeepSeek planner error:", error);
      return NextResponse.json(
        { error: "Failed to generate study plan" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    // Try to parse the JSON from the response
    let planData;
    try {
      // Remove any markdown code block markers if present
      const cleaned = content
        .replace(/```json\s*/gi, "")
        .replace(/```\s*$/g, "")
        .trim();
      planData = JSON.parse(cleaned);
    } catch {
      // If JSON parse fails, return the raw content for client-side handling
      return NextResponse.json({ rawContent: content, parseError: true });
    }

    return NextResponse.json({ planData, weeks: Array.isArray(planData) ? planData.length : 0 });
  } catch (error) {
    console.error("Planner API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
