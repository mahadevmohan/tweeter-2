import { NextRequest } from "next/server";
import { groq, type ChatMessage } from "../../../lib/ai";

export const runtime = "nodejs"; 

export async function POST(req: NextRequest) {
  const { messages, temperature = 0.7 } = (await req.json()) as {
    messages: ChatMessage[];
    temperature?: number;
  };

  if (!messages?.length) {
    return new Response("Missing messages", { status: 400 });
  }

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages,
    temperature,
    max_completion_tokens: 1024,
    top_p: 1,
    stream: true,
  });

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of completion) {
          const token = chunk.choices[0]?.delta?.content ?? "";
          controller.enqueue(new TextEncoder().encode(token));
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}