import { checkSchema } from "express-validator";

export const createArabProcFromExternalValidator = checkSchema({
    row: {
        in: ['body'],
    }
});