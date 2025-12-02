import { searchResourcesInArea } from "../tavily-search";
import { generateObject } from "ai";

// Mock the 'ai' module
jest.mock("ai", () => ({
  generateObject: jest.fn(),
}));

// Mock environment variables
const ORIGINAL_ENV = process.env;

describe("tavily-search", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...ORIGINAL_ENV, TAVILY_API_KEY: "test-key" };
    global.fetch = jest.fn();
    global.console.error = jest.fn(); // Silence errors during tests
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("should throw error if API key is missing", async () => {
    delete process.env.TAVILY_API_KEY;
    await expect(searchResourcesInArea("City", "State")).rejects.toThrow(
      "TAVILY_API_KEY is not set"
    );
  });

  it("should return cleaned results on successful API and LLM call", async () => {
    // Mock Tavily API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            title: "Test Food Bank",
            url: "http://test.com",
            content: "Open Mon-Fri 9am-5pm. Located at 123 Main St.",
          },
        ],
      }),
    });

    // Mock LLM response
    (generateObject as jest.Mock).mockResolvedValueOnce({
      object: {
        resources: [
          {
            name: "Test Food Bank",
            address: "123 Main St",
            zipCode: "90210",
            services: ["Pantry"],
            sourceUrl: "http://test.com",
            hours: { monday: { open: "09:00", close: "17:00" } },
          },
        ],
      },
    });

    const results = await searchResourcesInArea("Beverly Hills", "CA");

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Test Food Bank");
    expect(results[0].city).toBe("Beverly Hills"); // Added by wrapper
    expect(results[0].confidence).toBe(0.8); // Default confidence
    expect(results[0].hours?.monday?.open).toBe("09:00");
    expect(generateObject).toHaveBeenCalledTimes(1);
  });

  it("should return empty array if Tavily fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    });

    const results = await searchResourcesInArea("City", "State");
    expect(results).toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });

  it("should return empty array if LLM fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [{ title: "Test" }] }),
    });

    (generateObject as jest.Mock).mockRejectedValueOnce(new Error("LLM Error"));

    const results = await searchResourcesInArea("City", "State");
    expect(results).toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });
});
