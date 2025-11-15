import { openrouter } from "@openrouter/ai-sdk-provider";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { sousChefTools } from "@/lib/ai-tools";
import { buildSousChefSystemPrompt, locationSchema } from "@/lib/prompts/chat-system";
import { validateSession } from "@/lib/auth-middleware";

const DEFAULT_RADIUS_MILES = 10;

const messagePartSchema = z
  .object({
    type: z.string(),
  })
  .catchall(z.unknown());

type RawMessageForNormalization = {
  parts?: z.infer<typeof messagePartSchema>[] | undefined;
  content?: string | z.infer<typeof messagePartSchema>[] | undefined;
  text?: string | undefined;
};

function normalizeMessageParts(
  value: RawMessageForNormalization
): z.infer<typeof messagePartSchema>[] {
  if (Array.isArray(value.parts)) {
    return value.parts;
  }

  if (Array.isArray(value.content)) {
    return value.content;
  }

  const fallbackText =
    typeof value.content === "string"
      ? value.content
      : typeof value.text === "string"
      ? value.text
      : undefined;

  if (typeof fallbackText === "string") {
    const trimmed = fallbackText.trim();
    if (trimmed.length > 0) {
      return [{ type: "text", text: trimmed }];
    }
  }

  return [];
}

const messageSchema = z
  .object({
    id: z.string(),
    role: z.enum(["system", "user", "assistant"]),
    metadata: z.unknown().optional(),
    parts: z.array(messagePartSchema).optional(),
    content: z
      .union([z.string(), z.array(messagePartSchema)])
      .optional(),
    text: z.string().optional(),
  })
  .transform((value) => ({
    ...value,
    parts: normalizeMessageParts(value),
  }));

const chatRequestSchema = z.object({
  messages: z.array(messageSchema),
  location: locationSchema(z).optional(),
  radiusMiles: z.number().min(0.1).max(100).optional(),
  userId: z.string().optional(),
});

type ChatRequest = z.infer<typeof chatRequestSchema>;

/**
 * Next.js POST handler for /api/chat. Streams model output using the shared sousChefTools set.
 */
export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body. Expecting application/json." },
      { status: 400 }
    );
  }

  const parsed = chatRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request body.",
        details: parsed.error.format(),
      },
      { status: 400 }
    );
  }

  const payload: ChatRequest = parsed.data;

  // Validate session server-side instead of trusting client headers
  const sessionData = await validateSession(req);
  if (!sessionData) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const effectiveUserId = sessionData.userId;
  const effectiveRadius = payload.radiusMiles ?? DEFAULT_RADIUS_MILES;

  const normalizedMessages: UIMessage[] = payload.messages.map((message) => ({
    id: message.id,
    role: message.role,
    metadata: message.metadata,
    parts: message.parts as UIMessage["parts"],
  }));

  const systemPrompt = buildSousChefSystemPrompt({
    location: payload.location,
    radiusMiles: effectiveRadius,
    userId: effectiveUserId,
  });

  const result = streamText({
    model: openrouter(process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4.5"),
    system: systemPrompt,
    messages: convertToModelMessages(normalizedMessages),
    tools: sousChefTools,
    toolChoice: "auto",
  });

  return (
    result as unknown as { toUIMessageStreamResponse: () => Response }
  ).toUIMessageStreamResponse();
}
