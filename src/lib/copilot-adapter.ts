import { Tool } from "ai";
import { z } from "zod";

// Strict JSON Types for Handler Arguments
type JSONPrimitive = string | number | boolean | null;
type JSONValue = JSONPrimitive | JSONObject | JSONArray;
interface JSONObject { [key: string]: JSONValue | undefined }
type JSONArray = Array<JSONValue>;

// Interface for Vercel AI SDK Tool with Schema access
// We define the shape we expect for the tool object we are inspecting
interface ExtendedTool {
    description?: string;
    inputSchema?: z.ZodTypeAny;
    parameters?: z.ZodTypeAny;
    execute?: (input: unknown, options?: unknown) => Promise<unknown>;
}

// Type for CopilotKit Action Parameter
export interface CopilotActionParameter {
    name: string;
    type: string;
    description?: string;
    required?: boolean;
}

// Type for CopilotKit Action
export interface CopilotAction {
    name: string;
    description?: string;
    parameters?: CopilotActionParameter[];
    handler: (args: JSONObject) => Promise<unknown>;
}

/**
 * Converts a set of Vercel AI SDK tools (zod schema based) to CopilotKit actions.
 * 
 * @param tools Record<string, Tool>
 * @returns any[] - Returning strict internal types to satisfy CopilotKit's runtime args
 */
export function convertVercelToolsToCopilotActions(
    tools: Record<string, Tool>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
    return Object.entries(tools).map(([name, tool]) => {
        const parameters: CopilotActionParameter[] = [];

        // Safe access to tool internals via defined interface
        const actualTool = tool as ExtendedTool;
        const schema = actualTool.inputSchema || actualTool.parameters;

        if (schema && schema instanceof z.ZodObject) {
            const shape = schema.shape;
            for (const [key, value] of Object.entries(shape)) {
                const zodType = value as z.ZodTypeAny;
                let typeString = "string"; // default

                if (zodType instanceof z.ZodString) typeString = "string";
                else if (zodType instanceof z.ZodNumber) typeString = "number";
                else if (zodType instanceof z.ZodBoolean) typeString = "boolean";
                else if (zodType instanceof z.ZodArray) typeString = "string[]"; // simplified
                else if (zodType instanceof z.ZodEnum) typeString = "string";

                const isOptional = zodType.isOptional();

                parameters.push({
                    name: key,
                    type: typeString,
                    description: zodType.description,
                    required: !isOptional,
                });
            }
        }

        return {
            name,
            description: actualTool.description,
            parameters,
            handler: async (args: JSONObject) => {
                // ROBUSTNESS PATCHES
                // 1. Safe parsing of itemsNeeded if it comes as a string (CopilotKit/LLM quirk)
                if (name === "create_draft_event" && "itemsNeeded" in args) {
                    const items = args.itemsNeeded;
                    if (typeof items === "string") {
                        try {
                            args.itemsNeeded = JSON.parse(items);
                        } catch (e) {
                            console.error("Failed to parse itemsNeeded string to array:", e);
                            args.itemsNeeded = []; // Fallback
                        }
                    }
                }

                if (!actualTool.execute) {
                    throw new Error(`Tool ${name} does not have an execute function.`);
                }

                // Execute the Vercel tool
                return await actualTool.execute(args, {
                    toolCallId: "copilot-adapter",
                    messages: []
                });
            },
        };
    });
}

