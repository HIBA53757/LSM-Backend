import { ValidationError } from "../utils/errors.js";

export function schemaValidate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");

      return next(new ValidationError(message));
    }

    req.body = result.data;
    return next();
  };
}