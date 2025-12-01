# Admin Verification Dashboard & AI Sous-Chef Tools Implementation Plan

<metadata>
  <status>Draft</status>
  <date>2025-11-18</date>
  <author>Claude (via User Collaboration)</author>
  <philosophy>High-Density Management & AI Augmentation</philosophy>
</metadata>

## <section_executive_summary>
The "Just-in-Time" discovery engine successfully populates the database with unverified resources. To operationalize this data, we need a dedicated, high-density admin workspace. This dashboard will allow admins to rapidly triage, verify, and enhance resources using AI tools, ensuring data quality before it reaches the public map.
</section_executive_summary>

---

## <section_architecture>

### 1. Security & Access Control
- **RBAC (Role-Based Access Control):** Strict separation between "neighbor" and "admin" roles.
- **Middleware:** `withAdminAuth` ensures only verified admins can access `/admin` routes and API endpoints.
- **Redirects:** Unauthorized attempts are redirected to the home page.

### 2. Admin Dashboard (`/admin`)
- **Layout:** Dedicated sidebar navigation (Overview, Verification, Users, Settings).
- **Verification Workspace (`/admin/verification`):**
  - **Split View:** List/Table on the left, Detail/Editor on the right.
  - **High Density:** optimized for desktop mouse/keyboard usage (not mobile-first).

### 3. AI Enhancement ("Sous-Chef")
- **Targeted Agents:** Instead of generic chat, we use specific AI agents for data tasks.
- **"Enhance" Action:** A button that triggers a targeted search (Tavily) for a specific resource to find missing hours, phone numbers, or services.
- **Review Flow:** AI proposes changes (JSON Patch), Admin approves/rejects.

</section_architecture>

---

## <section_implementation_steps>

### <phase id="1">
<title>Phase 1: Backend Foundation & Security</title>
<description>Secure the perimeter and build the data access layer.</description>
<steps>
  - [ ] **Update Auth Middleware:**
    - Create `src/lib/auth/admin.ts` with `validateAdminSession`.
    - Update `src/lib/auth-middleware.ts` to export `withAdminAuth`.
  - [ ] **Admin Data Queries (`src/lib/admin-queries.ts`):**
    - `getUnverifiedResources(options)`: Support filtering by "missing fields" (no hours, no address) and "potential duplicates".
    - `getResourceStats()`: Counts for verified vs. unverified.
    - `batchUpdateStatus(ids, status)`: For rapid approval/rejection.
  - [ ] **Admin API Routes:**
    - `GET /api/admin/resources`: Fetch paginated list.
    - `POST /api/admin/resources`: Batch update status.
</steps>
</phase>

### <phase id="2">
<title>Phase 2: The Dashboard UI</title>
<description>Build the workspace for data management.</description>
<steps>
  - [ ] **Admin Layout (`src/app/admin/layout.tsx`):**
    - Sidebar navigation.
    - Admin user header.
  - [ ] **Verification Page (`src/app/admin/verification/page.tsx`):**
    - **Filter Bar:** Toggle "Show Missing Info", "Sort by Date".
    - **Data Table:** Columns: Name, Address, Status, "Missing" indicators (Hours, Phone).
    - **Selection:** Checkboxes for batch actions.
  - [ ] **Resource Editor Panel:**
    - Slide-over or side-panel.
    - Form fields for all resource data.
    - "Save" and "Verify" buttons.
</steps>
</phase>

### <phase id="3">
<title>Phase 3: AI Enhancement Tools</title>
<description>Integrate AI agents to do the heavy lifting.</description>
<steps>
  - [ ] **AI Endpoint (`/api/admin/resources/[id]/enhance`):**
    - Accepts `resourceId`.
    - Triggers Tavily search for official website/directories.
    - Uses LLM to extract structured data (Hours, Services).
    - Returns proposed updates.
  - [ ] **UI Integration:**
    - Add "✨ Auto-Fill" button to the Resource Editor.
    - Show "Diff View" (Current vs. Proposed) for admin review.
</steps>
</phase>

</section_implementation_steps>

---

## <section_checklist>
- [ ] **Backend: Auth & Queries**
  - [ ] Create `src/lib/admin-queries.ts`
  - [ ] Update `src/lib/auth-middleware.ts`
  - [ ] Create `src/app/api/admin/resources/route.ts`
- [ ] **Frontend: Dashboard Structure**
  - [ ] Create `src/app/admin/layout.tsx`
  - [ ] Create `src/app/admin/page.tsx` (Stats Overview)
  - [ ] Create `src/app/admin/verification/page.tsx` (Main Workspace)
- [ ] **Frontend: Verification Components**
  - [ ] Build `VerificationTable`
  - [ ] Build `ResourceEditorPanel`
- [ ] **AI Integration**
  - [ ] Implement `enhanceResource` logic (Tavily + LLM)
  - [ ] Wire up "Auto-Fill" button
</section_checklist>
