# Master Implementation Rules

**CRITICAL: These rules apply to EVERY task and take precedence over all other instructions.**

1. **Inspect the current repository**
   - Read relevant files in full
   - Check callers and references
   - Verify imports and dependencies

2. **Verify live state where applicable**
   - Live database schema (use `list_tables`, `execute_sql`)
   - Deployed behaviour
   - Latest official API documentation



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