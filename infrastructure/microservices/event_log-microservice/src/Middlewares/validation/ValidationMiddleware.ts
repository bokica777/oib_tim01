import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

export const validateDTO =
  (dtoClass: any) =>
    async (req: any, res: any, next: any) => {
      const dtoObject = plainToInstance(dtoClass, req.body);

      const errors = await validate(dtoObject, {
        whitelist: true,
        forbidNonWhitelisted: false,
      });

      if (errors.length > 0) {
        console.error(
          "[ValidationMiddleware] validation failed for DTO:",
          dtoClass.name,
          JSON.stringify(errors, null, 2)
        );
        return res.status(400).json({ message: "Validation failed", errors });
      }

      req.body = dtoObject;
      next();
    };
