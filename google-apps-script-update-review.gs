/**
 * Google Apps Script for updating submission reviews in Google Sheets
 * 
 * This script handles POST requests to update submission status
 * in the "Neurosurgery Log Book (Responses)" spreadsheet, "Form Responses 1" sheet.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet (Neurosurgery Log Book (Responses))
 * 2. Go to Extensions > Apps Script
 * 3. Paste this code
 * 4. Save the project
 * 5. Deploy as a web app:
 *    - Click "Deploy" > "New deployment"
 *    - Choose type: "Web app"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (or "Anyone with Google account" for more security)
 *    - Click "Deploy"
 * 6. Copy the Web App URL and use it as GOOGLE_APPS_SCRIPT_WEB_APP_URL in your .env
 * 
 * SECURITY SETUP:
 * 1. After deploying, run setApiPassword("your-secure-password") from the editor
 * 2. Store this password in your backend .env as GOOGLE_APPS_SCRIPT_PASSWORD
 * 
 * API ENDPOINT USAGE:
 * POST to the Web App URL with JSON body:
 * {
 *   "action": "updateSubmissionReview",
 *   "password": "your-api-password",
 *   "googleUid": "submission-uid-here",
 *   "status": "Approved" or "Rejected"
 * }
 */
const files = Files.getFilesInstance();
const indexes = files.neuroLogResCols

// Configuration - Update these to match your spreadsheet
const SPREADSHEET_NAME = "Neurosurgery Log Book (Responses)";
const SHEET_NAME = "Form Responses 1";

// Column indices (1-indexed for Google Sheets)
// Using indexes from Files.getFilesInstance().neuroLogResCols
const UID_COLUMN = indexes.subUid; // Column index for "uid" (subUid)
const STATUS_COLUMN = indexes.subStatus; // Column index for "status" (subStatus)

// Password key for Script Properties
const PASSWORD_KEY = "API_PASSWORD";

/**
 * Main POST handler
 */
function doPost(e) {
  try {
    // Parse the request body
    const requestData = JSON.parse(e.postData.contents);
    
    // Validate password first
    const passwordCheck = validatePassword(requestData.password);
    if (!passwordCheck.success) {
      return passwordCheck.response;
    }
    
    // Validate required fields
    if (!requestData.action) {
      return createResponse(400, { 
        success: false, 
        error: "Missing 'action' field" 
      });
    }
    
    if (requestData.action === "updateSubmissionReview") {
      return handleUpdateSubmissionReview(requestData);
    } else {
      return createResponse(400, { 
        success: false, 
        error: "Unknown action: " + requestData.action 
      });
    }
  } catch (error) {
    return createResponse(500, { 
      success: false, 
      error: "Internal server error: " + error.toString() 
    });
  }
}

/**
 * Handle GET requests (for testing)
 */
function doGet(e) {
  return createResponse(200, { 
    success: true, 
    message: "Google Apps Script API is running",
    endpoints: {
      updateSubmissionReview: "POST with action='updateSubmissionReview', googleUid, status"
    }
  });
}

/**
 * Handle submission review update
 */
function handleUpdateSubmissionReview(data) {
  try {
    // Validate required fields
    if (!data.googleUid) {
      return createResponse(400, { 
        success: false, 
        error: "Missing 'googleUid' field" 
      });
    }
    
    if (!data.status) {
      return createResponse(400, { 
        success: false, 
        error: "Missing 'status' field" 
      });
    }
    
    // Validate status value
    const validStatuses = ["Approved", "Rejected", "Pending"];
    const normalizedStatus = capitalizeFirstLetter(data.status);
    if (validStatuses.indexOf(normalizedStatus) === -1) {
      return createResponse(400, { 
        success: false, 
        error: "Invalid status. Must be one of: " + validStatuses.join(", ") 
      });
    }
    
    // Get the spreadsheet and sheet
    const spreadsheet = getSpreadsheet();
    if (!spreadsheet) {
      return createResponse(500, { 
        success: false, 
        error: "Spreadsheet not found: " + SPREADSHEET_NAME 
      });
    }
    
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) {
      return createResponse(500, { 
        success: false, 
        error: "Sheet not found: " + SHEET_NAME 
      });
    }
    
    // Find the row with matching uid
    const uidToFind = String(data.googleUid).trim();
    const lastRow = sheet.getLastRow();
    
    if (lastRow < 2) {
      return createResponse(404, { 
        success: false, 
        error: "No data rows found in sheet" 
      });
    }
    
    // Get all uid values from the column (skip header row)
    const uidRange = sheet.getRange(2, UID_COLUMN, lastRow - 1, 1);
    const uidValues = uidRange.getValues();
    
    let targetRow = null;
    for (let i = 0; i < uidValues.length; i++) {
      const cellValue = String(uidValues[i][0]).trim();
      if (cellValue === uidToFind) {
        targetRow = i + 2; // +2 because array is 0-indexed and we skipped header
        break;
      }
    }
    
    if (!targetRow) {
      return createResponse(404, { 
        success: false, 
        error: "Submission with uid '" + uidToFind + "' not found" 
      });
    }
    
    // Update the status column
    const statusCell = sheet.getRange(targetRow, STATUS_COLUMN);
    statusCell.setValue(normalizedStatus);
    
    return createResponse(200, { 
      success: true, 
      message: "Submission review updated successfully",
      data: {
        googleUid: uidToFind,
        row: targetRow,
        status: normalizedStatus
      }
    });
    
  } catch (error) {
    return createResponse(500, { 
      success: false, 
      error: "Error updating submission review: " + error.toString() 
    });
  }
}

/**
 * Validate password from request
 */
function validatePassword(password) {
  const storedPassword = PropertiesService.getScriptProperties().getProperty(PASSWORD_KEY);
  
  if (!storedPassword) {
    return {
      success: false,
      response: createResponse(500, {
        success: false,
        error: "API password not configured. Please run setApiPassword() function first."
      })
    };
  }
  
  if (!password || password !== storedPassword) {
    return {
      success: false,
      response: createResponse(401, {
        success: false,
        error: "Unauthorized: Invalid password"
      })
    };
  }
  
  return { success: true };
}

/**
 * Set the API password in Script Properties
 * 
 * IMPORTANT: Run this function ONCE from the Apps Script editor to set your password.
 * After setting, the password will be stored securely and you can remove this function call.
 * 
 * Usage: Call setApiPassword("your-secure-password-here") from the editor
 */
function setApiPassword(password) {
  if (!password || password.length < 8) {
    Logger.log("Error: Password must be at least 8 characters long");
    return;
  }
  
  PropertiesService.getScriptProperties().setProperty(PASSWORD_KEY, password);
  Logger.log("API password has been set successfully");
}

/**
 * Get the spreadsheet by name
 */
function getSpreadsheet() {
  try {
    const ssId = files.neuroLogResponses
    if (ssId) {
      return SpreadsheetApp.openById(ssId);
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Create a JSON response
 */
function createResponse(statusCode, data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Capitalize first letter of a string
 */
function capitalizeFirstLetter(str) {
  if (!str || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Test function - can be run from Apps Script editor for testing
 * 
 * IMPORTANT: Make sure you've set the password first using setApiPassword()
 */
function testUpdateReview() {
  // Get the password from Script Properties for testing
  const password = PropertiesService.getScriptProperties().getProperty(PASSWORD_KEY);
  
  if (!password) {
    Logger.log("Error: Please set API password first using setApiPassword('your-password')");
    return;
  }
  
  const testData = {
    action: "updateSubmissionReview",
    password: password, // Use the stored password
    googleUid: "test-uid-123", // Replace with actual uid from your sheet
    status: "Approved"
  };
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  const result = doPost(mockEvent);
  Logger.log(result.getContent());
}


