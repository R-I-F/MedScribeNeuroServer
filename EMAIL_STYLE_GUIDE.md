# NeuroLogBook — Email style guide for backend

Use this guide to style transactional emails (e.g. submission review links, notifications) so they match the NeuroLogBook web app.

---

## 1. Brand

- **App name:** NeuroLogBook (no space; “Neuro” + “LogBook”).
- **Logo:** Use the same logo as the web app if available (e.g. `/logo.svg`). In email, prefer a hosted image URL or a simple text treatment.
- **Tagline (optional):** “The Intelligent Standard for Neurosurgery Records.”

---

## 2. Color palette

Use these hex values in email `color`, `background-color`, and `border-color`. All are from the app’s Tailwind-based design.

### Primary (brand)

| Name        | Hex       | Use |
|------------|-----------|-----|
| Blue 600   | `#2563eb` | Primary buttons, links, primary accent |
| Blue 700   | `#1d4ed8` | Link hover, darker accent |
| Blue 500   | `#3b82f6` | Lighter primary (e.g. focus) |
| Teal 600   | `#0d9488` | Secondary brand (gradient end, accents) |
| Teal 700   | `#0f766e` | Darker teal |

### Backgrounds and surfaces

| Name    | Hex       | Use |
|---------|-----------|-----|
| White   | `#ffffff` | Cards, form areas, main content |
| Blue 50 | `#eff6ff` | Page/section background (e.g. login-style) |
| Blue 100| `#dbeafe` | Badges, pills (e.g. institution name) |
| Gray 50 | `#f9fafb` | Neutral light background |
| Gray 100| `#f3f4f6` | Muted sections, buttons |

### Text

| Name     | Hex       | Use |
|----------|-----------|-----|
| Gray 900 | `#111827` | Headings, primary text |
| Gray 700 | `#374151` | Labels, strong body text |
| Gray 600 | `#4b5563` | Body text, secondary |
| Gray 500 | `#6b7280` | Captions, hints |

### Borders

| Name    | Hex       | Use |
|---------|-----------|-----|
| Gray 200| `#e5e7eb` | Card/content borders (default) |
| Gray 300| `#d1d5db` | Input borders |
| Blue 200| `#bfdbfe` | Accent borders (e.g. active state) |

### Semantic (status and alerts)

| Meaning   | Background   | Text/Border     | Use |
|-----------|--------------|-----------------|-----|
| Success   | `#d1fae5` (emerald-100) | `#047857` (emerald-700) | Approved, success messages |
| Error     | `#fee2e2` (red-100)    | `#b91c1c` (red-700)    | Errors, rejected |
| Warning   | `#fef3c7` (amber-100)  | `#b45309` (amber-700)  | Pending, warnings |
| Info/alert| `#dbeafe` (blue-100)   | `#1d4ed8` (blue-700)   | Neutral info |

---

## 3. Typography

- **Font stack (email-safe):**  
  `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;`
- **Headings:** Bold, dark gray.
  - H1: `font-size: 1.875rem; font-weight: 700; color: #111827;` (≈ 30px)
  - H2: `font-size: 1.5rem; font-weight: 700; color: #111827;` (≈ 24px)
  - H3: `font-size: 1.125rem; font-weight: 600; color: #111827;` (≈ 18px)
- **Body:** `font-size: 1rem; color: #4b5563; line-height: 1.5;` (16px)
- **Small / captions:** `font-size: 0.875rem; color: #6b7280;` (14px)
- **Labels:** `font-size: 0.875rem; font-weight: 500; color: #374151;`

---

## 4. Spacing and layout

- **Border radius:** Use `border-radius: 0.5rem;` (8px) for cards and buttons to match the app’s `rounded-lg`.
- **Padding:**  
  - Cards/sections: `padding: 1.5rem;` (24px)  
  - Buttons: `padding: 0.75rem 1.5rem;` (12px 24px)  
  - Small gaps: `0.5rem` (8px), `0.25rem` (4px)
- **Max width (content):** ~ 28rem (448px) for a single column; up to ~ 42rem (672px) for wider layouts.

---

## 5. Buttons and CTAs

**Primary (main action, e.g. “Review submission”)**

- Background: linear gradient from blue to teal (see below), or solid `#2563eb`.
- Text: `color: #ffffff; font-weight: 600; font-size: 1rem;`
- Padding: `12px 24px`
- Border radius: `8px`
- Optional shadow: `0 10px 15px -3px rgba(37, 99, 235, 0.25);`

**Gradient (matches app):**

```css
background: linear-gradient(to right, #2563eb, #0d9488);
```

**Secondary / outline**

- Background: `#ffffff`
- Border: `2px solid #2563eb`
- Text: `color: #2563eb; font-weight: 600;`

**Link style**

- Color: `#2563eb`
- Hover (where supported): `#1d4ed8`
- `font-weight: 500` or `600` for emphasis.

---

## 6. Cards and containers

- Background: `#ffffff`
- Border: `1px solid #e5e7eb`
- Border radius: `8px`
- Padding: `24px`
- Optional subtle shadow: `0 1px 3px 0 rgba(0, 0, 0, 0.1);`

---

## 7. Badges and pills

- **Institution / context:**  
  Background `#dbeafe`, text `#1d4ed8`, `font-size: 0.875rem`, `font-weight: 600`, padding `8px 16px`, `border-radius: 9999px` (pill).
- **Status:**
  - Approved: bg `#d1fae5`, text `#047857`
  - Pending: bg `#fef3c7`, text `#b45309`
  - Rejected: bg `#fee2e2`, text `#b91c1c`

---

## 8. Alerts and error blocks

- Error/alert container: background `#fee2e2`, border `1px solid #f87171`, text `#b91c1c`, padding `12px 16px`, border radius `8px`.
- Success: background `#d1fae5`, border `#047857`, text `#047857`.

---

## 9. Email implementation notes

- Use **inline CSS** or **table-based layout** where needed; many clients strip `<style>` blocks or don’t support flexbox/grid.
- Prefer **hex colors** (e.g. `#2563eb`) for maximum compatibility.
- **Links:** Use full absolute URLs (e.g. `https://yourapp.com/dashboard/a-ins/supervisor/submissions/...`).
- **Images:** Use absolute URLs; provide `alt` text.
- **CTA button:** Use a table-based button or a padded link styled as a button; test in common clients (Gmail, Outlook, Apple Mail).

---

## 10. Example: review submission email (snippet)

```html
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 480px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <tr>
    <td style="padding: 24px 0 8px; text-align: center;">
      <span style="display: inline-block; padding: 8px 16px; background-color: #dbeafe; color: #1d4ed8; font-size: 14px; font-weight: 600; border-radius: 9999px;">NeuroLogBook</span>
    </td>
  </tr>
  <tr>
    <td style="padding: 16px 0; font-size: 24px; font-weight: 700; color: #111827; text-align: center;">New submission to review</td>
  </tr>
  <tr>
    <td style="padding: 16px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
      <p style="margin: 0 0 16px; font-size: 16px; color: #4b5563; line-height: 1.5;">A candidate has submitted a procedure for your review.</p>
      <a href="https://yourapp.com/dashboard/a-ins/supervisor/submissions/SUBMISSION_ID?institutionId=INST_ID" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #2563eb, #0d9488); color: #ffffff; font-weight: 600; font-size: 16px; text-decoration: none; border-radius: 8px;">Review submission</a>
    </td>
  </tr>
  <tr>
    <td style="padding: 16px 0 0; font-size: 12px; color: #6b7280; text-align: center;">NeuroLogBook — The Intelligent Standard for Neurosurgery Records.</td>
  </tr>
</table>
```

Replace `SUBMISSION_ID` and `INST_ID` with the real submission and institution IDs.

---

## 11. Quick reference (hex only)

| Token      | Hex       |
|-----------|-----------|
| Primary   | `#2563eb` |
| Primary dark | `#1d4ed8` |
| Teal      | `#0d9488` |
| Text      | `#111827` |
| Body      | `#4b5563` |
| Border    | `#e5e7eb` |
| Success   | `#d1fae5` / `#047857` |
| Error     | `#fee2e2` / `#b91c1c` |
| Pending   | `#fef3c7` / `#b45309` |
