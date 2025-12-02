import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "ai";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { withAdminAuth } from "@/lib/auth/admin";
import { normalizeHours } from "@/lib/resource-normalizer";

const parseSchema = z.object({
  text: z.string().min(1),
});

export const POST = async (req: NextRequest) => {
  return withAdminAuth(req, async () => {
    try {
      const body = await req.json();
      const validation = parseSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json({ error: "Invalid text" }, { status: 400 });
      }

      const { text } = validation.data;
      const apiKey = process.env.OPENROUTER_API_KEY;
      
      if (!apiKey) {
        return NextResponse.json({ error: "AI configuration missing" }, { status: 500 });
      }

      const modelName = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
      
      const { text: jsonString } = await generateText({
        model: openrouter(modelName),
        prompt: `
          You are a helper that extracts opening hours from text into JSON.
          
          Output ONLY valid JSON. Do not include markdown formatting like \`\`\`json.
          
          Target Schema:
          {
            "hours": {
              "monday": { "open": "HH:MM", "close": "HH:MM", "closed": boolean } | null,
              "tuesday": ...
              ...
            }
          }

          Rules:
          1. Use 24-hour format (e.g. "14:00", "07:30").
          2. Explicitly map every day (monday, tuesday, wednesday, thursday, friday, saturday, sunday).
          3. If a day is not mentioned, set it to null.
          4. If a day is "closed", set { "closed": true, "open": "00:00", "close": "00:00" }.
          5. Handle AM/PM context: "7:30" usually means 07:30. "7" in evening means 19:00.
          6. If ONLY a start time is given (e.g. "Mondays at 7:30 AM"), assume it closes 2 hours later (09:30) unless context implies standard business day.
          
          Input text: "${text}"
        `,
      });

      // Clean up potential markdown code blocks
      const cleanedJson = jsonString.replace(/```json\n?|\n?```/g, "").trim();
      
      try {
        const data = JSON.parse(cleanedJson);
        const normalized = normalizeHours(data.hours ?? null).hours;
        return NextResponse.json({ hours: normalized });
      } catch (e) {
        console.error("JSON parse error", e, cleanedJson);
        return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
      }
    } catch (error) {
      console.error("Parse hours error:", error);
      return NextResponse.json(
        { error: "Failed to parse schedule" },
        { status: 500 }
      );
    }
  });
};
