/**
 * Remove the `password` hash from a user-shaped object (or array of them) before it is
 * returned to any client. Bcrypt hashes must never leave the server, even to authenticated
 * admins. Handles TypeORM entities (plain objects) and arrays; leaves non-objects untouched.
 */
export function stripPassword<T>(input: T): T {
  if (Array.isArray(input)) {
    return input.map((item) => stripPassword(item)) as unknown as T;
  }
  if (input && typeof input === "object") {
    const { password, ...rest } = input as Record<string, unknown>;
    return rest as unknown as T;
  }
  return input;
}
