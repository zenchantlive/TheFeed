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
    // Generic coercion to normalize common CopilotKit/LLM quirks before validation
    const coerceValue = (value: JSONValue): JSONValue => {
        if (typeof value === "string") {
            const trimmed = value.trim();

            // Boolean-like strings
            if (trimmed.toLowerCase() === "true") return true;
            if (trimmed.toLowerCase() === "false") return false;

            // Numeric-like strings
            if (!Number.isNaN(Number(trimmed)) && trimmed !== "") {
                return Number(trimmed);
            }

            // JSON-like strings (objects/arrays/quoted primitives)
            if ((trimmed.startsWith("{") && trimmed.endsWith("}")) ||
                (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
                (trimmed.startsWith("\"") && trimmed.endsWith("\""))) {
                try {
                    return JSON.parse(trimmed);
                } catch {
                    // fall through if JSON.parse fails
                }
            }

            return trimmed;
        }

        if (Array.isArray(value)) {
            return value.map(coerceValue);
        }

        if (value && typeof value === "object") {
            return Object.fromEntries(
                Object.entries(value).map(([k, v]) => [k, coerceValue(v as JSONValue)])
            );
        }

        return value;
    };

    const unwrapZodType = (zodType: z.ZodTypeAny): { base: z.ZodTypeAny; optional: boolean } => {
        let current = zodType;
        let optional = false;

        while (
            current instanceof z.ZodOptional ||
            current instanceof z.ZodNullable ||
            current instanceof z.ZodDefault ||
            current instanceof z.ZodEffects
        ) {
            if (current instanceof z.ZodOptional || current instanceof z.ZodNullable) {
                optional = true;
            }

            // ZodEffects keeps _def.schema
            // ZodDefault keeps innerType
            // ZodOptional/ZodNullable keeps _def.innerType
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const inner: any = (current as { _def: { innerType?: z.ZodTypeAny; schema?: z.ZodTypeAny; type?: z.ZodTypeAny } })._def;
            current = inner.innerType || inner.schema || inner.type || current;
            if (current === zodType) break; // safety against infinite loop
        }

        return { base: current, optional };
    };

    const mapZodToTypeString = (zodType: z.ZodTypeAny): { type: string; required: boolean } => {
        const { base, optional } = unwrapZodType(zodType);
        let typeString = "string";

        if (base instanceof z.ZodString) typeString = "string";
        else if (base instanceof z.ZodNumber) typeString = "number";
        else if (base instanceof z.ZodBoolean) typeString = "boolean";
        else if (base instanceof z.ZodArray) {
            const inner = (base as z.ZodArray<z.ZodTypeAny>)._def.type;
            const innerType = unwrapZodType(inner).base;
            const innerString = innerType instanceof z.ZodNumber
                ? "number"
                : innerType instanceof z.ZodBoolean
                    ? "boolean"
                    : "string";
            typeString = `${innerString}[]`;
        } else if (base instanceof z.ZodEnum || base instanceof z.ZodNativeEnum) {
            typeString = "string";
        } else if (base instanceof z.ZodObject) {
            typeString = "object";
        }

        return { type: typeString, required: !optional };
    };

    return Object.entries(tools).map(([name, tool]) => {
        const parameters: CopilotActionParameter[] = [];

        // Safe access to tool internals via defined interface
        const actualTool = tool as ExtendedTool;
        const schema = actualTool.inputSchema || actualTool.parameters;

        if (schema && schema instanceof z.ZodObject) {
            const shape = schema.shape;
            for (const [key, value] of Object.entries(shape)) {
                const zodType = value as z.ZodTypeAny;
                const { type, required } = mapZodToTypeString(zodType);
                parameters.push({
                    name: key,
                    type,
                    description: zodType.description,
                    required,
                });
            }
        }

        return {
            name,
            description: actualTool.description,
            parameters,
            handler: async (args: JSONObject) => {
                // Normalize common mis-typed inputs then validate against schema if present.
                const coercedArgs = coerceValue(args) as JSONObject;

                if (schema && schema instanceof z.ZodObject) {
                    const parsed = schema.safeParse(coercedArgs);
                    if (!parsed.success) {
                        return {
                            error: "Invalid input",
                            issues: parsed.error.issues.map(issue => ({
                                path: issue.path.join("."),
                                message: issue.message,
                            })),
                        };
                    }

                    // Use validated/coerced data
                    Object.assign(coercedArgs, parsed.data);
                }

                if (!actualTool.execute) {
                    throw new Error(`Tool ${name} does not have an execute function.`);
                }

                // Execute the Vercel tool
                return await actualTool.execute(coercedArgs, {
                    toolCallId: "copilot-adapter",
                    messages: []
                });
            },
        };
    });
}

