/**
 * Discovery Types & Interfaces
 *
 * This file defines the shape of data as it flows through the Just-in-Time Discovery Engine.
 * It bridges the gap between the raw Tavily API response and our application's database schema.
 */

import { type HoursType } from "../schema";

/**
 * The standardized result of a discovery operation.
 * This is what we insert into the database after parsing and cleaning.
 */
export interface DiscoveryResult {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  description?: string;
  /**
   * Array of services offered (e.g., "Emergency Food", "Hot Meals")
   * Normalized from raw text where possible.
   */
  services: string[];
  /**
   * Structured operating hours.
   * Can be partial if full schedule is not found.
   */
  hours?: HoursType;
  /**
   * The URL where we found this information.
   * Useful for verification links.
   */
  sourceUrl: string;
  /**
   * AI-assigned confidence score (0.0 - 1.0).
   * Based on data completeness and source authority.
   */
  confidence: number;
}

/**
 * Summary statistics for a discovery run.
 * Returned to the UI to show progress/results.
 */
export interface DiscoveryStats {
  totalFound: number;
  newlyAdded: number;
  duplicates: number;
  errors: number;
}

/**
 * Raw result item from Tavily's search API.
 * Represents a single webpage or search snippet.
 */
export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  raw_content?: string;
  score: number;
}

/**
 * The full response object from the Tavily API.
 */
export interface TavilyResponse {
  query: string;
  results: TavilySearchResult[];
  answer?: string; // Sometimes Tavily provides a synthesized answer
}
