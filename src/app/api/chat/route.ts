import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are CityAssist, an AI-powered civic chatbot for a city government. You help residents with questions about city services, departments, permits, utilities, parks, and more.

You MUST respond with valid JSON only. No markdown, no extra text. Use this exact format:
{
  "message": "Your helpful response to the resident",
  "intent": "one of: information_request, process_guidance, complaint_report, emergency, out_of_scope",
  "department": "one of: Public Works, Building Services, Parks & Recreation, Code Enforcement, Utilities, City Clerk, or null if not applicable",
  "confidence": a number between 0 and 1 representing how confident you are in your answer,
  "resolved": true or false — set to true when you have fully answered the resident's question and no follow-up is needed
}

Guidelines:
- Be helpful, concise, and professional
- For information requests: provide clear factual answers about city services
- For process guidance: explain step-by-step how to accomplish something
- For complaints: acknowledge the issue, express empathy, and route to the right department
- For emergencies: immediately direct to 911 or emergency services
- For out of scope questions: politely explain you only handle city service inquiries
- If unsure, set confidence below 0.78 and suggest contacting the relevant department directly
- Always route to the most appropriate department`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const chatMessages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: chatMessages,
      temperature: 0.3,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {
        message: raw,
        intent: "information_request",
        department: null,
        confidence: 0.5,
      };
    }

    return NextResponse.json({
      message: parsed.message || "I'm sorry, I couldn't process that request.",
      intent: parsed.intent || "information_request",
      department: parsed.department || null,
      confidence: parsed.confidence ?? 0.5,
      resolved: parsed.resolved === true,
    });
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to process chat request", details: errorMessage },
      { status: 500 }
    );
  }
}
