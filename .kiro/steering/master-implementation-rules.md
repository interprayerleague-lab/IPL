# Master Implementation Rules

**CRITICAL: These rules apply to EVERY task and take precedence over all other instructions.**

## Deployment Context

**IMPORTANT: This project is NOT running locally. It will be deployed to Render/Railway.**

### Dependency Management Rules

1. **NEVER run installation commands:**
   - ❌ `npm install`
   - ❌ `pip install`
   - ❌ `npm run build`
   - ❌ Any package manager install commands

2. **ALWAYS add dependencies to manifest files:**
   - ✅ Add to `package.json` dependencies section
   - ✅ Add to `requirements.txt`
   - ✅ The deployment platform handles installation

3. **Testing locally is NOT required:**
   - Do not attempt to run dev servers
   - Do not attempt to test endpoints
   - Code review and validation is sufficient

4. **Build process:**
   - Render/Railway will run `npm install` and `npm run build`
   - Render/Railway will run `pip install -r requirements.txt`
   - Our job is to ensure manifest files are correct

## Pre-Implementation Inspection

Before implementing ANY task, I MUST:

1. **Inspect the current repository**
   - Read relevant files in full
   - Check callers and references
   - Verify imports and dependencies

2. **Verify live state where applicable**
   - Live database schema (use `list_tables`, `execute_sql`)
   - Deployed behaviour
   - Latest official API documentation

3. **Do not assume previous audits are correct**
   - Re-verify everything from scratch
   - Do not rely on memory or prior context

## Planning and Approval Process

### STOP and Report First

1. **Report the verified current state**
   - What exists now
   - What works/doesn't work
   - What needs to change

2. **Present the smallest implementation plan**
   - Minimal scope to achieve the goal
   - Clear steps
   - Explicit files to be modified

3. **Ask ALL necessary clarification questions**
   - Any uncertainties
   - Any ambiguities
   - Any decisions that need approval

4. **Wait for explicit approval before implementation**
   - Do not self-implement uncertain decisions
   - Do not assume what the user wants

## UI/UX Creation Rules

**STOP if task requires creating or materially redesigning:**
- Individual screens
- Pages
- Forms
- Modals
- Views

**Action Required:**
- Ask user to provide or identify the approved template
- Do NOT create UI until template is provided or explicit authorization is given

## Technology Stack Rules

**REQUIRE explicit permission before introducing:**
- New stack
- New dependency
- New database
- New framework
- New service
- New hosting component

**Action Required:**
- Prove necessity
- Get explicit user permission
- Do not assume it's okay

## What NOT to Create

**NEVER create without explicit request:**
- Sample data
- Mock production behaviour
- Unnecessary test files
- Documentation files
- README files
- `.md` files (except when explicitly requested)
- `.txt` files
- Demo files
- Duplicate files
- Temporary repository artifacts

## Implementation Phase

**After approval is received:**

1. **Implement ONLY the approved scope**
   - No scope creep
   - No "helpful" additions
   - Exactly what was approved

2. **Inspect every changed file in full**
   - Verify syntax
   - Verify imports
   - Verify references
   - Check completeness (no truncation)
   - Verify database compatibility
   - Check security
   - Verify account isolation
   - Validate against acceptance criteria

## Completion Phase

**At the end of implementation:**

1. **Provide task completion report**
   - What was implemented
   - Files changed
   - Verification results
   - Any issues encountered

2. **STOP immediately**
   - Do not start another task
   - Wait for user review
   - Wait for next instruction

---

## Summary Checklist for Every Task

- [ ] Inspect current repository state
- [ ] Verify live schema/behaviour where applicable
- [ ] Report current state
- [ ] Present smallest implementation plan
- [ ] Ask ALL clarification questions
- [ ] Wait for approval
- [ ] (If UI) Get template or authorization
- [ ] (If new tech) Prove necessity and get permission
- [ ] Implement ONLY approved scope
- [ ] Verify all changes in full
- [ ] Provide completion report
- [ ] STOP and wait for review
