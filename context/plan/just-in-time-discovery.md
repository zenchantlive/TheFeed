# Just-in-Time Resource Discovery Engine

<metadata>
  <status>Approved</status>
  <date>2025-11-18</date>
  <author>Claude (via User Collaboration)</author>
  <philosophy>Lazy Loading + Community Verification</philosophy>
</metadata>

## <section_executive_summary>
Instead of pre-seeding the database with potentially stale data for the entire country, TheFeed will discover resources **on-demand**. When users enter a new area, the system triggers a targeted, intelligent search using **Tavily**, cleans the data with an **LLM**, checks for duplicates, and invites the community to verify them. This ensures data is always relevant, cost-efficient, and community-owned.
</section_executive_summary>

---

## <section_architecture>

### The "Lazy Loading" Loop

```mermaid
graph TD
    A[User Joins / Opens App] --> B{Check Local Resources}
    B -- "Count > 5" --> C[Show Dashboard]
    B -- "Count < 5" --> D{Check Discovery Log}
    D -- "Searched < 30 days ago" --> E[Show "Desert State" UI]
    D -- "No recent search" --> F[Trigger Discovery Engine]
    F --> G[Tavily Search API]
    G --> H[LLM Cleaning (OpenRouter)]
    H --> I{Fuzzy Duplicate Check}
    I -- "Duplicate" --> J[Log & Discard]
    I -- "Unique" --> K[Insert as 'Unverified']
    K --> L[Notify User: "12 New Resources Found"]
    L --> M[Community Verification Flow]
```
</section_architecture>

---

## <section_implementation_phases>

### <phase id="1">
<title>Phase 1: Foundation & Schema</title>
<objective>Prepare the database to distinguish between verified, unverified, and rejected data, and track where we've already looked.</objective>
<status>Complete</status>
</phase>

### <phase id="2">
<title>Phase 2: The Discovery Engine</title>
<objective>Build the backend logic that safely searches, filters, and ingests data using the Tavily API.</objective>
<status>Complete</status>
<details>
  - Tavily Search Wrapper implemented.
  - Circuit Breaker (30-day cooldown) implemented.
  - Duplicate Guard (Geo+Name check) implemented.
  - **Refinement**: Added LLM Cleaning step to sanitize raw search results.
</details>
</phase>

### <phase id="3">
<title>Phase 3: User Experience (The "Scanner")</title>
<objective>Communicate the discovery process transparently without blocking the user.</objective>
<status>Complete</status>
<details>
  - `ScannerNotification` component built.
  - Integrated into Community Page.
  - Map markers updated to distinguish unverified resources.
</details>
</phase>

### <phase id="4">
<title>Phase 4: Community Verification</title>
<objective>Crowdsource data quality control.</objective>
<status>Complete</status>
<details>
  - `VerificationCard` component built.
  - Verification API implemented (up/down voting, auto-promotion).
</details>
</phase>

### <phase id="5">
<title>Phase 5: Dev Tooling & Refinement</title>
<objective>Enable rapid iteration and testing without polluting production data.</objective>
<status>Complete</status>

<steps>
  <step>
    <action>Admin Configuration</action>
    <details>
      Add `DeveloperInfo` component to Profile page to easily copy User ID.
      Configure `ADMIN_USER_ID` in `.env`.
    </details>
  </step>
  <step>
    <action>API Updates for Testing</action>
    <details>
      Update `/api/discovery/trigger` to accept `force: true` (bypass cooldown) and `isTest: true` (flag data).
      **Security**: Only allow `force` if `userId === ADMIN_USER_ID`.
    </details>
  </step>
  <step>
    <action>Cleanup Script</action>
    <details>
      Create `scripts/nuke-test-data.ts` to delete all resources where `importSource = 'tavily_test_run'`.
      Resets `discoveryEvents` for test locations.
    </details>
  </step>
  <step>
    <action>UI Triggers</action>
    <details>
      Update `ScannerNotification` to enable "Shift+Click" to force a rescan (Dev Mode).
    </details>
  </step>
</steps>
</phase>

### <phase id="6">
<title>Phase 6: Robustness & Scale (Implemented)</title>
<objective>Handle large-scale discovery without timeouts or hallucinations.</objective>
<status>Complete</status>
<details>
  - **Streaming API**: Converted `/api/discovery/trigger` to NDJSON stream for real-time progress.
  - **Deep Extraction**: Fetch full raw text for documents to find all resources.
  - **Batch Processing**: Process 3 docs at a time to avoid timeouts.
  - **Geocoding**: Added Mapbox Geocoding to prevent "Null Island" placements.
  - **Strict Schema**: Fixed Zod schema for OpenRouter/Azure compatibility.
</details>
</phase>

</section_implementation_phases>
