import { plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";

function formatErrors(errors: ValidationError[]): any[] {
  const out: any[] = [];
  for (const e of errors) {
    const constraints = e.constraints ? Object.values(e.constraints) : [];
    if (constraints.length > 0) out.push({ property: e.property, errors: constraints });
    if (e.children && e.children.length > 0) {
      const child = formatErrors(e.children);
      child.forEach(c => out.push({ property: `${e.property}.${c.property}`, errors: c.errors }));
    }
  }
  return out;
}

export const validateDTO = (dtoClass: any) => async (req: any, res: any, next: any) => {
  const dtoObject = plainToInstance(dtoClass, req.body);
  const errors = await validate(dtoObject, {
    whitelist: true,
    forbidNonWhitelisted: false,
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const formatted = formatErrors(errors);
    console.error("[ValidationMiddleware] validation failed for DTO:", dtoClass.name, JSON.stringify(formatted, null, 2));
    return res.status(400).json({ message: "Validation failed", errors: formatted, receivedBody: req.body, transformed: dtoObject });
  }

  req.body = dtoObject;
  next();
};