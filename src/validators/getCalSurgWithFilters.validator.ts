import { checkSchema, body } from "express-validator";

export const getCalSurgWithFiltersValidator = checkSchema({
  "startDate": {
    in: ["query"],
    optional: true,
    isISO8601: true,
    custom: {
      options: (value: string) => {
        if (!value) return true; // Skip if not provided
        
        const date = new Date(value);
        const today = new Date();
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(today.getFullYear() - 2);
        
        if (date > today) {
          throw new Error("startDate cannot be in the future");
        }
        if (date < twoYearsAgo) {
          throw new Error("startDate cannot be more than 2 years in the past");
        }
        
        return true;
      }
    },
    errorMessage: "startDate must be a valid ISO 8601 date string within the last 2 years and not in the future",
  },
  "endDate": {
    in: ["query"],
    optional: true,
    isISO8601: true,
    custom: {
      options: (value: string) => {
        if (!value) return true; // Skip if not provided
        
        const date = new Date(value);
        const today = new Date();
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(today.getFullYear() - 2);
        
        if (date > today) {
          throw new Error("endDate cannot be in the future");
        }
        if (date < twoYearsAgo) {
          throw new Error("endDate cannot be more than 2 years in the past");
        }
        
        return true;
      }
    },
    errorMessage: "endDate must be a valid ISO 8601 date string within the last 2 years and not in the future",
  },
  "month": {
    in: ["query"],
    optional: true,
    matches: {
      options: /^\d{4}-\d{2}$/,
      errorMessage: "month must be in YYYY-MM format",
    },
    custom: {
      options: (value: string) => {
        if (!value) return true; // Skip if not provided
        
        const [year, month] = value.split('-').map(Number);
        const today = new Date();
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(today.getFullYear() - 2);
        
        // Validate month
        if (month < 1 || month > 12) {
          throw new Error("Month must be between 1 and 12");
        }
        
        // Validate year range
        if (year < twoYearsAgo.getFullYear() || year > today.getFullYear()) {
          throw new Error("Month must be within the last 2 years and not in the future");
        }
        
        // If it's the current year, validate the month
        if (year === today.getFullYear() && month > today.getMonth() + 1) {
          throw new Error("Month cannot be in the future");
        }
        
        return true;
      }
    },
  },
  "year": {
    in: ["query"],
    optional: true,
    matches: {
      options: /^\d{4}$/,
      errorMessage: "year must be in YYYY format",
    },
    custom: {
      options: (value: string) => {
        if (!value) return true; // Skip if not provided
        
        const year = parseInt(value);
        const today = new Date();
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(today.getFullYear() - 2);
        
        if (year < twoYearsAgo.getFullYear() || year > today.getFullYear()) {
          throw new Error("Year must be within the last 2 years and not in the future");
        }
        
        return true;
      }
    },
  },
  "day": {
    in: ["query"],
    optional: true,
    isISO8601: true,
    custom: {
      options: (value: string) => {
        if (!value) return true; // Skip if not provided
        
        const date = new Date(value);
        const today = new Date();
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(today.getFullYear() - 2);
        
        if (date > today) {
          throw new Error("day cannot be in the future");
        }
        if (date < twoYearsAgo) {
          throw new Error("day cannot be more than 2 years in the past");
        }
        
        return true;
      }
    },
    errorMessage: "day must be a valid ISO 8601 date string within the last 2 years and not in the future",
  },
});
