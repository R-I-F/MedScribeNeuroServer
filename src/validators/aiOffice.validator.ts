import { body, checkSchema, param, query } from "express-validator";
import { AI_OFFICE_ACTIVITY_TYPES } from "../aiOffice/aiOffice.types";
import { Rank, RegDegree } from "../cand/cand.interface";
import { SupervisorPosition } from "../types/supervisorPosition.types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const isCandidate = body("role").equals("candidate");

/**
 * POST /aiOffice/signup - the hidden AI Office signup (docs/AI_OFFICE_PLAN.md).
 * Same fields as the normal candidate/supervisor signup, but the password only needs 8 characters,
 * and the department is either a mirrored department id OR a typed name (exactly one).
 */
export const aiOfficeSignupValidator = [
  body("role").isIn(["candidate", "supervisor"]).withMessage("role must be candidate or supervisor"),

  body("email").isEmail().withMessage("email must be a valid email address"),

  body("password")
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage("password must be at least 8 characters long"),

  body("fullName")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("fullName is required")
    .bail()
    .isLength({ max: 100 })
    .withMessage("fullName should have a maximum of 100 characters"),

  body("phoneNum")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("phoneNum is required")
    .bail()
    .isLength({ max: 32 })
    .withMessage("phoneNum is too long"),

  body("departmentId")
    .optional({ values: "falsy" })
    .isUUID()
    .withMessage("departmentId must be a valid UUID"),

  body("departmentOther")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ min: 2, max: 160 })
    .withMessage("department name must be between 2 and 160 characters"),

  body("departmentOther").custom((value, { req }) => {
    const hasId = typeof req.body?.departmentId === "string" && req.body.departmentId.trim() !== "";
    const hasOther = typeof value === "string" && value.trim() !== "";
    if (hasId === hasOther) {
      throw new Error("Choose a department from the list or type your department, not both");
    }
    return true;
  }),

  // Candidate-only fields (same rules as the normal candidate signup, with the enums enforced).
  body("regNum")
    .if(isCandidate)
    .isString()
    .trim()
    .notEmpty()
    .withMessage("regNum is required")
    .bail()
    .isLength({ max: 50 })
    .withMessage("regNum is too long"),
  body("nationality")
    .if(isCandidate)
    .isString()
    .trim()
    .notEmpty()
    .withMessage("nationality is required")
    .bail()
    .isLength({ max: 100 })
    .withMessage("nationality is too long"),
  body("rank")
    .if(isCandidate)
    .isIn(Object.values(Rank))
    .withMessage(`rank must be one of: ${Object.values(Rank).join(", ")}`),
  body("regDeg")
    .if(isCandidate)
    .optional({ values: "falsy" })
    .isIn(Object.values(RegDegree))
    .withMessage(`regDeg must be one of: ${Object.values(RegDegree).join(", ")}`),

  // Supervisor-only field.
  body("position")
    .if(body("role").equals("supervisor"))
    .optional({ values: "falsy" })
    .isIn(Object.values(SupervisorPosition))
    .withMessage(`position must be one of: ${Object.values(SupervisorPosition).join(", ")}`),
];

/**
 * POST /aiOffice/activities and PATCH /aiOffice/activities/:id - the activity form. Only the shape
 * is checked here; which fields and statuses a section allows is enforced in the provider from
 * AI_OFFICE_ACTIVITY_DEFS.
 */
export const aiOfficeActivityValidator = checkSchema({
  activityType: {
    in: ["body"],
    isIn: {
      options: [AI_OFFICE_ACTIVITY_TYPES as unknown as string[]],
      errorMessage: `activityType must be one of: ${AI_OFFICE_ACTIVITY_TYPES.join(", ")}`,
    },
  },
  title: { in: ["body"], optional: { options: { values: "null" } }, isString: { errorMessage: "title must be text" } },
  status: { in: ["body"], optional: { options: { values: "null" } }, isString: { errorMessage: "status must be text" } },
  notes: { in: ["body"], optional: { options: { values: "null" } }, isString: { errorMessage: "notes must be text" } },
  activityDate: {
    in: ["body"],
    optional: { options: { values: "falsy" } },
    matches: { options: [DATE_RE], errorMessage: "activityDate must be YYYY-MM-DD" },
  },
  details: {
    in: ["body"],
    optional: { options: { values: "null" } },
    isObject: { errorMessage: "details must be an object" },
  },
});

export const aiOfficeActivityIdValidator = [
  param("id").matches(UUID_RE).withMessage("activity id must be a valid UUID"),
];

const departmentFilter = (field: string) =>
  query(field)
    .optional({ values: "falsy" })
    .custom((value) => value === "all" || value === "none" || UUID_RE.test(String(value)))
    .withMessage(`${field} must be all, none, or a department UUID`);

const paging = [
  query("page").optional().isInt({ min: 1, max: 100000 }).withMessage("page must be a positive integer").toInt(),
  query("pageSize").optional().isInt({ min: 1, max: 100 }).withMessage("pageSize must be between 1 and 100").toInt(),
];

/** GET /aiOffice/admin/users */
export const aiOfficeAdminUsersQueryValidator = [
  query("role").isIn(["candidate", "supervisor"]).withMessage("role must be candidate or supervisor"),
  departmentFilter("departmentId"),
  query("aiOffice").optional().isIn(["all", "yes", "no"]).withMessage("aiOffice must be all, yes or no"),
  query("approved").optional().isIn(["all", "yes", "no"]).withMessage("approved must be all, yes or no"),
  query("search").optional().isString().trim().isLength({ max: 100 }).withMessage("search is too long"),
  ...paging,
];

/** PATCH /aiOffice/admin/users/:role/:id */
export const aiOfficeSetMemberValidator = [
  param("role").isIn(["candidate", "supervisor"]).withMessage("role must be candidate or supervisor"),
  param("id").matches(UUID_RE).withMessage("id must be a valid UUID"),
  body("aiOfficeMember").isBoolean({ strict: true }).withMessage("aiOfficeMember must be true or false"),
];

/** GET /aiOffice/admin/activities and GET /aiOffice/admin/stats */
export const aiOfficeAdminActivitiesQueryValidator = [
  query("activityType")
    .optional({ values: "falsy" })
    .isIn(AI_OFFICE_ACTIVITY_TYPES as unknown as string[])
    .withMessage("unknown activityType"),
  query("status").optional({ values: "falsy" }).isString().isLength({ max: 32 }).withMessage("status is too long"),
  query("role").optional({ values: "falsy" }).isIn(["candidate", "supervisor"]).withMessage("role must be candidate or supervisor"),
  query("memberId").optional({ values: "falsy" }).matches(UUID_RE).withMessage("memberId must be a valid UUID"),
  departmentFilter("departmentId"),
  query("from").optional({ values: "falsy" }).matches(DATE_RE).withMessage("from must be YYYY-MM-DD"),
  query("to").optional({ values: "falsy" }).matches(DATE_RE).withMessage("to must be YYYY-MM-DD"),
  ...paging,
];

/** GET /aiOffice/admin/access-requests */
export const aiOfficeAccessRequestsQueryValidator = [...paging];
