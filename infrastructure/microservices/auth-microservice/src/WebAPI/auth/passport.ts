import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Repository } from "typeorm";
import { User, AuthProvider } from "../../Domain/models/User";
import { UserRole } from "../../Domain/enums/UserRole";

function safeName(full?: string) {
  const s = (full ?? "").trim();
  if (!s) return { firstName: "OAuth", lastName: "User" };
  const parts = s.split(/\s+/);
  return {
    firstName: parts[0] ?? "OAuth",
    lastName: parts.slice(1).join(" ") || "User",
  };
}

async function upsertOAuthUser(
  repo: Repository<User>,
  provider: AuthProvider.GOOGLE | AuthProvider.FACEBOOK,
  providerUserId: string,
  email: string,
  displayName?: string,
  photo?: string
) {
  let user = await repo.findOne({ where: { provider, providerUserId } });

  if (!user) {
    const existingByEmail = await repo.findOne({ where: { email } });
    if (existingByEmail) {
      existingByEmail.provider = provider;
      existingByEmail.providerUserId = providerUserId;
      existingByEmail.profileImage =
        existingByEmail.profileImage ?? (photo ?? null);
      return await repo.save(existingByEmail);
    }

    const { firstName, lastName } = safeName(displayName);
    const username = email.split("@")[0] ?? `user_${Date.now()}`;

    user = repo.create({
      username,
      email,
      firstName,
      lastName,
      profileImage: photo ?? null,
      role: UserRole.SELLER,
      provider,
      providerUserId,
      password: null,
    });

    return await repo.save(user);
  }

  user.profileImage = user.profileImage ?? (photo ?? null);
  return await repo.save(user);
}

export function configurePassport(userRepo: Repository<User>) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID ?? "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        callbackURL: process.env.GOOGLE_CALLBACK_URL ?? "",
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const id = profile.id;
          if (!email || !id) {
            return done(new Error("Google profile missing email/id"));
          }

          const photo = profile.photos?.[0]?.value;
          const user = await upsertOAuthUser(
            userRepo,
            AuthProvider.GOOGLE,
            id,
            email,
            profile.displayName,
            photo
          );
          return done(null, user);
        } catch (e) {
          return done(e as any);
        }
      }
    )
  );

  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_CLIENT_ID ?? "",
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET ?? "",
        callbackURL: process.env.FACEBOOK_CALLBACK_URL ?? "",
        profileFields: ["id", "displayName", "photos", "email"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = (profile.emails as any)?.[0]?.value;
          const id = profile.id;
          if (!email || !id) {
            return done(new Error("Facebook profile missing email/id"));
          }

          const photo = (profile.photos as any)?.[0]?.value;
          const user = await upsertOAuthUser(
            userRepo,
            AuthProvider.FACEBOOK,
            id,
            email,
            profile.displayName,
            photo
          );
          return done(null, user);
        } catch (e) {
          return done(e as any);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await userRepo.findOne({ where: { id } });
      done(null, user ?? null);
    } catch (e) {
      done(e as any);
    }
  });

  return passport;
}
