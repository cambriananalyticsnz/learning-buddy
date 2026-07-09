import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/deepseek";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, subject, difficulty = "simple", mistakeContext } = body;

    if (!messages || !subject) {
      return NextResponse.json(
        { error: "Missing required fields: messages, subject" },
        { status: 400 }
      );
    }

    const result = await chat({ messages, subject, difficulty, mistakeContext });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
