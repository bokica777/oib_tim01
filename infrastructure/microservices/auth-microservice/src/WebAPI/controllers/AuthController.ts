import { Request, Response, Router } from "express";
import * as jwt from "jsonwebtoken";
import type { Secret } from "jsonwebtoken";
import passport from "passport";
import { IAuthService } from "../../Domain/services/IAuthService";
import { ILogerService } from "../../Domain/services/ILogerService";
import { LoginUserDTO } from "../../Domain/DTOs/LoginUserDTO";
import { RegistrationUserDTO } from "../../Domain/DTOs/RegistrationUserDTO";
import { validateLoginData } from "../validators/LoginValidator";
import { validateRegistrationData } from "../validators/RegisterValidator";

function getJwtSecret(): Secret {
  const s = process.env.JWT_SECRET;
  if (!s || !s.trim()) throw new Error("JWT_SECRET is missing");
  return s as Secret;
}

function signToken(payload: { id: number; username: string; role: any }) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "6h") as jwt.SignOptions["expiresIn"],
  });
}

export class AuthController {
  private router: Router;

  constructor(
    private authService: IAuthService,
    private logerService: ILogerService
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post("/auth/login", this.login.bind(this));
    this.router.post("/auth/register", this.register.bind(this));

    this.router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
    this.router.get(
      "/auth/google/callback",
      passport.authenticate("google", { session: false, failureRedirect: "/api/v1/auth/oauth-failed" }),
      this.oauthSuccess.bind(this)
    );

    this.router.get("/auth/facebook", (req, res, next) => {
      const cb = process.env.FACEBOOK_CALLBACK_URL;
      if (!cb) return res.status(500).json({ message: "FACEBOOK_CALLBACK_URL missing" });

      return (passport.authenticate("facebook", {
        scope: ["email"],
        callbackURL: cb,
      } as any) as any)(req, res, next);
    });

    this.router.get(
      "/auth/facebook/callback",
      (req, res, next) => {
        const cb = process.env.FACEBOOK_CALLBACK_URL;
        if (!cb) return res.status(500).json({ message: "FACEBOOK_CALLBACK_URL missing" });

        return (passport.authenticate("facebook", {
          session: false,
          failureRedirect: "/api/v1/auth/oauth-failed",
          callbackURL: cb,
        } as any) as any)(req, res, next);
      },
      this.oauthSuccess.bind(this)
    );

    this.router.get("/auth/oauth-failed", (_req, res) =>
      res.status(401).json({ success: false, message: "OAuth login failed" })
    );
  }

  private async oauthSuccess(req: any, res: Response) {
    const user = req.user as any;
    if (!user) return res.status(401).json({ success: false, message: "No user from OAuth" });

    const token = signToken({ id: user.id, username: user.username, role: user.role });

    const redirect = process.env.OAUTH_SUCCESS_REDIRECT;
    if (redirect) return res.redirect(`${redirect}?token=${encodeURIComponent(token)}`);

    return res.status(200).json({ success: true, token });
  }

  private async login(req: Request, res: Response): Promise<void> {
    try {
      this.logerService.log("Login request received");

      const data: LoginUserDTO = req.body as LoginUserDTO;

      const validation = validateLoginData(data);
      if (!validation.success) {
        res.status(400).json({ success: false, message: validation.message });
        return;
      }

      const result = await this.authService.login(data);

      if (!result.authenificated || !result.userData) {
        res.status(401).json({ success: false, message: "Invalid credentials!" });
        return;
      }

      const token = signToken({
        id: result.userData.id,
        username: result.userData.username,
        role: result.userData.role,
      });

      res.status(200).json({ success: true, token });
    } catch (error: any) {
      this.logerService.log(String(error?.message ?? error));
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  private async register(req: Request, res: Response): Promise<void> {
    try {
      this.logerService.log("Registration request received");

      const data: RegistrationUserDTO = req.body as RegistrationUserDTO;

      const validation = validateRegistrationData(data);
      if (!validation.success) {
        res.status(400).json({ success: false, message: validation.message });
        return;
      }

      const result = await this.authService.register(data);

      if (!result.authenificated || !result.userData) {
        res.status(400).json({
          success: false,
          message: "Registration failed. Username or email may already exist.",
        });
        return;
      }

      const token = signToken({
        id: result.userData.id,
        username: result.userData.username,
        role: result.userData.role,
      });

      res.status(201).json({ success: true, message: "Registration successful", token });
    } catch (error: any) {
      this.logerService.log(String(error?.message ?? error));
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
