# Module Security Audit Prompt Template

## Module Security Audit Request

Perform a comprehensive security audit of the **[reports]** module in the MedScribeNeuroServer application.

### Context
This is a MariaDB-based Express.js API using:
- **Dependency Injection**: InversifyJS
- **Authentication**: JWT tokens (extracted via `extractJWT` middleware)
- **Authorization**: Role-based access control with hierarchical privileges
- **Validation**: express-validator with custom validators
- **Database**: TypeORM with MariaDB

### Available Roles (hierarchical)
1. `SUPER_ADMIN` (highest privilege)
2. `INSTITUTE_ADMIN`
3. `SUPERVISOR`
4. `CLERK`
5. `CANDIDATE` (lowest privilege)

Higher privilege roles can access lower privilege endpoints by default (hierarchical access).

### Required Tasks

#### 1. Endpoint Inventory
**Task**: Identify and catalog all endpoints in the `[MODULE_NAME]` module.

**Deliverable**: Create a comprehensive table with the following columns:
- **Endpoint Path** (e.g., `/moduleName/getAll`, `/moduleName/:id`)
- **HTTP Method** (GET, POST, PUT, PATCH, DELETE)
- **Authentication Middleware** (e.g., `extractJWT`, `none`, or `missing`)
- **Authorization Middleware** (e.g., `requireSuperAdmin`, `requireInstituteAdmin`, `requireSupervisor`, `requireClerk`, `requireCandidate`, `authorize(...)`, or `none`)
- **Required Role(s)** (which roles can access this endpoint)
- **Security Level** (🔴 CRITICAL / 🟡 MEDIUM / 🟢 LOW / ✅ SECURE)
- **Validation Middleware** (which validators are applied, if any)
- **Notes** (special conditions, dynamic auth, etc.)

**Instructions**:
- Review `src/[moduleName]/[moduleName].router.ts` for all route definitions
- Check middleware order in route definitions
- Note any conditional authorization logic in route handlers
- Document public endpoints (no authentication)
- Document endpoints with missing authentication/authorization

#### 2. Authentication & Authorization Analysis
**Task**: Analyze the authentication and authorization patterns for each endpoint.

**Checklist for each endpoint**:
- [ ] Does the endpoint require `extractJWT` middleware?
- [ ] Is authorization middleware applied (`requireSuperAdmin`, `requireInstituteAdmin`, `requireSupervisor`, `requireClerk`, `requireCandidate`, or custom `authorize(...)`)?
- [ ] Is the middleware order correct? (`extractJWT` → `authorization` → `validator` → `handler`)
- [ ] Are sensitive operations (create, update, delete) properly protected?
- [ ] Are read operations appropriately protected (not over-exposed)?
- [ ] Is there any conditional authorization logic that could be bypassed?

**Deliverable**: 
- List of endpoints **missing authentication** (no `extractJWT`)
- List of endpoints **missing authorization** (no authorization middleware)
- List of endpoints with **incorrect middleware order**
- List of endpoints with **potential authorization bypasses**

#### 3. Security Posture Assessment
**Task**: Evaluate the overall security posture of the module.

**Comparative Analysis**:
- Compare authentication/authorization patterns with similar modules (e.g., other CRUD modules)
- Identify inconsistencies in security implementation across the codebase
- Check if the module follows the established security patterns

**Risk Assessment**:
- Identify endpoints that handle sensitive operations (user data, admin actions, deletions, data modifications)
- Assess the impact of unauthorized access to each endpoint
- Rate the severity of security gaps (CRITICAL / HIGH / MEDIUM / LOW)

**Deliverable**:
- Summary of security strengths
- Summary of security weaknesses
- Comparison with other modules (consistency check)
- Risk matrix (Endpoint × Risk Level × Impact)

#### 4. Security Recommendations
**Task**: Provide actionable security improvement recommendations.

**For each security issue identified, provide**:
- **Issue Description**: Clear explanation of the security gap
- **Severity**: 🔴 CRITICAL / 🟡 MEDIUM / 🟢 LOW
- **Risk Impact**: What could happen if this issue is exploited
- **Recommendation**: Specific, actionable fix (with code examples if applicable)
- **Priority**: Implementation priority (High / Medium / Low)
- **Rationale**: Why this recommendation improves security

**Recommendation Categories**:
1. **Missing Authentication**: Endpoints that should require `extractJWT`
2. **Missing Authorization**: Endpoints that need role-based access control
3. **Over-Privileged Endpoints**: Endpoints with too permissive access
4. **Under-Protected Operations**: Sensitive operations without adequate protection
5. **Middleware Order Issues**: Incorrect middleware application order
6. **Rate Limiting**: Endpoints that may need rate limiting
7. **Audit Logging**: Operations that should be logged for security monitoring
8. **Input Validation**: Missing or insufficient input validation
9. **Data Exposure**: Endpoints that may expose sensitive data
10. **Best Practices**: Recommendations following security best practices

#### 5. Implementation Examples
**Task**: Provide code examples for recommended fixes.

**For each critical recommendation, include**:
- **Before**: Current implementation (code snippet)
- **After**: Recommended implementation (code snippet)
- **Explanation**: Why the change improves security

**Example Template**:
```typescript
// BEFORE (Insecure)
this.router.get("/getAll", async (req, res) => {
  // No authentication required
});

// AFTER (Secure)
this.router.get(
  "/getAll",
  extractJWT,
  requireCandidate, // Allows all authenticated users
  async (req, res) => {
    // Protected endpoint
  }
);
```

### Deliverable Format

Create a comprehensive audit report with the following structure:

```markdown
# [MODULE_NAME] Module Security Audit Report

## Executive Summary
- **Overall Security Grade**: [A/B/C/D/F]
- **Critical Issues**: [count]
- **High Priority Issues**: [count]
- **Medium Priority Issues**: [count]
- **Low Priority Issues**: [count]

## 1. Endpoint Authentication Inventory

| Endpoint | Method | Auth Middleware | Authorization | Required Role | Security Level | Notes |
|----------|--------|-----------------|---------------|---------------|----------------|-------|
| ... | ... | ... | ... | ... | ... | ... |

## 2. Security Concerns

### 🔴 CRITICAL Issues
[Detailed descriptions with code references]

### 🟡 MEDIUM Priority Issues
[Detailed descriptions]

### 🟢 LOW Priority Issues
[Detailed descriptions]

## 3. Authorization Requirements Analysis

### Missing Authorization Checks
[List with endpoint paths]

### Over-Privileged Endpoints
[List with endpoint paths]

### Correctly Protected Endpoints
[List with endpoint paths]

## 4. Security Posture Assessment

### Comparison with Similar Modules
[Consistency analysis]

### Sensitive Operations Protection
[Assessment of protected vs unprotected operations]

## 5. Security Recommendations

### 🔴 CRITICAL Priority
[Detailed recommendations with code examples]

### 🟡 MEDIUM Priority
[Recommendations]

### 🟢 LOW Priority
[Recommendations]

## 6. Implementation Checklist
- [ ] Fix critical authentication gaps
- [ ] Fix critical authorization gaps
- [ ] Review and update middleware order
- [ ] Implement missing validators
- [ ] Add audit logging for sensitive operations
- [ ] Test all endpoints with proper role-based access

## Summary
[Brief summary of findings and next steps]
```

### Quality Criteria

The audit should:
1. **Be Comprehensive**: Cover all endpoints, not just a subset
2. **Be Specific**: Provide exact endpoint paths, line numbers, and code references
3. **Be Actionable**: Recommendations should be implementable with clear steps
4. **Be Prioritized**: Issues should be ranked by severity and impact
5. **Be Consistent**: Use the same security standards across all modules
6. **Be Evidence-Based**: Support findings with code references and examples

### Review Process

After completing the audit:
1. Verify all endpoints are documented
2. Cross-check recommendations against existing security patterns
3. Ensure recommendations align with application architecture rules
4. Validate that fixes don't break existing functionality
5. Confirm all sensitive operations are properly protected

---

**Usage**: Replace `[MODULE_NAME]` with the actual module name (e.g., `calSurg`, `event`, `cand`) when using this prompt.
