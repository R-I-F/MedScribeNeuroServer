# Google Apps Script Setup Guide for Submission Review Updates

This guide explains how to set up and deploy the Google Apps Script that updates submission reviews in Google Sheets.

## Overview

The Google Apps Script (`google-apps-script-update-review.gs`) allows your backend to update submission status and review comments in the Google Sheet by finding rows based on the `subGoogleUid` field.

## Setup Instructions

### Step 1: Open Google Apps Script Editor

1. Open your Google Sheet: **neuroLogResponses**
2. Go to **Extensions** → **Apps Script**
3. This opens the Apps Script editor in a new tab

### Step 2: Create the Script

1. Delete any existing code in the editor
2. Copy the entire contents of `google-apps-script-update-review.gs`
3. Paste it into the Apps Script editor
4. Click **Save** (or press `Ctrl+S` / `Cmd+S`)
5. Give your project a name (e.g., "Submission Review Updater")

### Step 3: Configure the Script (if needed)

The script is pre-configured with:
- **Spreadsheet Name**: `neuroLogResponses`
- **Sheet Name**: `Form Responses 1`
- **UID Column**: Uses `indexes.subUid` from your Files configuration
- **Status Column**: Uses `indexes.subStatus` from your Files configuration

The script automatically uses your existing `Files.getFilesInstance().neuroLogResCols` configuration, so no manual column configuration is needed.

### Step 4: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon (⚙️) next to "Select type" and choose **Web app**
3. Configure the deployment:
   - **Description**: "Submission Review Update API" (optional)
   - **Execute as**: **Me** (your account)
   - **Who has access**: 
     - For development: **Anyone** (less secure but easier)
     - For production: **Anyone with Google account** (more secure)
4. Click **Deploy**
5. **IMPORTANT**: Copy the **Web App URL** - you'll need this for your backend `.env` file
6. Click **Done**

### Step 5: Authorize the Script

1. The first time you deploy, you'll need to authorize the script
2. Click **Authorize access**
3. Choose your Google account
4. Click **Advanced** → **Go to [Project Name] (unsafe)**
5. Click **Allow** to grant permissions

### Step 6: Set API Password

1. In the Apps Script editor, select the function `setApiPassword` from the function dropdown
2. In the function, replace `"your-secure-password-here"` with your actual password (at least 8 characters)
3. Click **Run** (▶️) to execute the function
4. Check the **Execution log** (View → Logs) to confirm the password was set
5. **IMPORTANT**: After setting, you can remove or comment out the password from the code for security

**Example:**
```javascript
// Run this once to set the password
setApiPassword("MySecurePassword123!");
```

### Step 7: Add Environment Variables

Add the following to your backend `.env` file:
```env
GOOGLE_APPS_SCRIPT_WEB_APP_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
GOOGLE_APPS_SCRIPT_PASSWORD=your-secure-password-here
```

## API Usage

### Request Format

**Method**: `POST`

**URL**: Your Web App URL from Step 4

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "action": "updateSubmissionReview",
  "password": "your-api-password",
  "googleUid": "submission-uid-from-subGoogleUid-field",
  "status": "Approved"
}
```

**Note**: The `password` field is required for authentication. Use the same password you set in Step 6.

### Status Values

The `status` field accepts:
- `"Approved"` (or `"approved"` - will be normalized)
- `"Rejected"` (or `"rejected"` - will be normalized)
- `"Pending"` (or `"pending"` - will be normalized)

### Response Format

**Success (200)**:
```json
{
  "success": true,
  "message": "Submission review updated successfully",
  "data": {
    "googleUid": "submission-uid-123",
    "row": 5,
    "status": "Approved"
  }
}
```

**Unauthorized (401)**:
```json
{
  "success": false,
  "error": "Unauthorized: Invalid password"
}
```

**Error (400/404/500)**:
```json
{
  "success": false,
  "error": "Error message here"
}
```

## Testing

### Option 1: Test from Apps Script Editor

1. In the Apps Script editor, select the function `testUpdateReview`
2. Click the **Run** button (▶️)
3. Check the **Execution log** (View → Logs) for results
4. **Note**: Update the `googleUid` in the test function with an actual UID from your sheet

### Option 2: Test with cURL

```bash
curl -X POST "YOUR_WEB_APP_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "updateSubmissionReview",
    "password": "your-api-password",
    "googleUid": "your-test-uid-here",
    "status": "Approved"
  }'
```

### Option 3: Test with Postman/HTTP Client

1. Create a new POST request
2. URL: Your Web App URL
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "action": "updateSubmissionReview",
  "password": "your-api-password",
  "googleUid": "your-test-uid-here",
  "status": "Approved"
}
```

## Troubleshooting

### "Spreadsheet not found"
- Verify the spreadsheet name matches exactly: `neuroLogResponses`
- Ensure the script has access to the spreadsheet
- Check that you're using the correct Google account

### "Sheet not found"
- Verify the sheet name matches exactly: `Form Responses 1`
- Check for extra spaces or different capitalization

### "Submission with uid '...' not found"
- Verify the `googleUid` exists in column 59 of your sheet
- Check for leading/trailing spaces in the UID
- Ensure you're searching in the correct column

### "Missing 'action' field"
- Ensure your request body includes `"action": "updateSubmissionReview"`

### "Unauthorized: Invalid password"
- Verify you're sending the correct password in the request body
- Check that you've set the password using `setApiPassword()` function
- Ensure the password in your request matches the one stored in Script Properties

### "API password not configured"
- Run the `setApiPassword("your-password")` function from the Apps Script editor
- Make sure the function executed successfully (check Execution log)

### CORS Errors
- Google Apps Script Web Apps handle CORS automatically
- If you see CORS errors, check that you're using the correct Web App URL

### Permission Denied
- Re-authorize the script: Deploy → Manage deployments → Edit → Authorize access

## Security Notes

1. **Password Protection**: The API requires a password in every request. This adds a layer of security when exposing the endpoint to "Anyone"
2. **Password Storage**: The password is stored securely in Script Properties (not visible in code)
3. **Password Management**: 
   - Use a strong password (at least 8 characters, mix of letters, numbers, symbols)
   - Store the password in your backend `.env` file, never commit it to version control
   - Change the password periodically by running `setApiPassword()` again
4. **Web App Access**: Even with password protection, consider using "Anyone with Google account" for additional security
5. **Rate Limiting**: Google Apps Script has quotas - be mindful of request frequency
6. **HTTPS**: All Google Apps Script Web Apps use HTTPS by default

## Column Mapping Reference

The script uses your existing `Files.getFilesInstance().neuroLogResCols` configuration:
- **UID_COLUMN**: Uses `indexes.subUid` - Contains the submission UID
- **STATUS_COLUMN**: Uses `indexes.subStatus` - Contains the status

## Next Steps

Once the Google Apps Script is deployed and tested:
1. Add the `GOOGLE_APPS_SCRIPT_WEB_APP_URL` to your backend `.env`
2. Implement the backend endpoint to call this script
3. Test the full flow: Backend → Google Apps Script → Google Sheet

