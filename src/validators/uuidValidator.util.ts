/**
 * UUID validation utility for express-validator
 * Validates UUID v4 format (36 characters with hyphens)
 * Also supports backward compatibility with MongoDB ObjectId (24 hex characters) for legacy data
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OBJECT_ID_REGEX = /^[0-9a-f]{24}$/i;

/**
 * Validates if a string is a valid UUID v4 or MongoDB ObjectId (for backward compatibility with legacy data)
 * @param value - The value to validate
 * @returns true if valid UUID or ObjectId, false otherwise
 */
export function isValidUuidOrObjectId(value: any): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  return UUID_REGEX.test(value) || OBJECT_ID_REGEX.test(value);
}

/**
 * Validates if a string is a valid UUID v4
 * @param value - The value to validate
 * @returns true if valid UUID, false otherwise
 */
export function isValidUuid(value: any): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  return UUID_REGEX.test(value);
}

/**
 * Express-validator custom validator for UUID (with backward compatibility for ObjectId)
 * Use this in checkSchema with custom option
 * Note: ObjectId support is maintained for backward compatibility with legacy data only
 */
export const uuidValidator = {
  options: (value: any) => {
    return isValidUuidOrObjectId(value);
  },
  errorMessage: "must be a valid UUID (or ObjectId for backward compatibility)",
};

/**
 * Express-validator custom validator for UUID only (strict)
 * Use this in checkSchema with custom option
 */
export const strictUuidValidator = {
  options: (value: any) => {
    return isValidUuid(value);
  },
  errorMessage: "must be a valid UUID",
};
