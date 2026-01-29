import { Repository } from "typeorm";
import bcrypt from "bcryptjs";
import { User, AuthProvider } from "../Domain/models/User";
import { IAuthService } from "../Domain/services/IAuthService";
import { LoginUserDTO } from "../Domain/DTOs/LoginUserDTO";
import { AuthResponseType } from "../Domain/types/AuthResponse";
import { RegistrationUserDTO } from "../Domain/DTOs/RegistrationUserDTO";

export class AuthService implements IAuthService {
  constructor(private userRepository: Repository<User>) {}

  async login(data: LoginUserDTO): Promise<AuthResponseType> {
    const user = await this.userRepository.findOne({ where: { username: data.username } });
    if (!user || !user.password) return { authenificated: false };

    const ok = await bcrypt.compare(data.password, user.password);
    if (!ok) return { authenificated: false };

    return { authenificated: true, userData: { id: user.id, username: user.username, role: user.role } };
  }

  async register(data: RegistrationUserDTO): Promise<AuthResponseType> {
    const existing = await this.userRepository.findOne({ where: [{ username: data.username }, { email: data.email }] });
    if (existing) return { authenificated: false };

    const hashed = await bcrypt.hash(data.password, Number(process.env.SALT_ROUNDS ?? 10));

    const newUser = this.userRepository.create({
      username: data.username,
      email: data.email,
      role: data.role,
      password: hashed,
      firstName: data.firstName,
      lastName: data.lastName,
      profileImage: data.profileImage,
      provider: AuthProvider.LOCAL,
      providerUserId: null,
    });

    const saved = await this.userRepository.save(newUser);
    return { authenificated: true, userData: { id: saved.id, username: saved.username, role: saved.role } };
  }

  async findOrCreateOAuthUser(data: {
    provider: AuthProvider;
    providerUserId: string;
    email: string;
    firstName: string;
    lastName: string;
    profileImage: string | null;
  }): Promise<User> {
    const byProvider = await this.userRepository.findOne({
      where: { provider: data.provider, providerUserId: data.providerUserId },
    });
    if (byProvider) return byProvider;

    const byEmail = await this.userRepository.findOne({ where: { email: data.email } });
    if (byEmail) {
      byEmail.provider = data.provider;
      byEmail.providerUserId = data.providerUserId;
      byEmail.profileImage = byEmail.profileImage ?? data.profileImage;
      return await this.userRepository.save(byEmail);
    }

    const usernameBase = (data.email.split("@")[0] || `${data.provider}_${data.providerUserId}`).slice(0, 90);
    let username = usernameBase;

    const existingUsername = await this.userRepository.findOne({ where: { username } });
    if (existingUsername) {
      username = `${usernameBase}_${Math.floor(Math.random() * 10000)}`;
    }

    const user = this.userRepository.create({
      username,
      email: data.email,
      role: "SELLER" as any,
      password: null,
      firstName: data.firstName,
      lastName: data.lastName,
      profileImage: data.profileImage,
      provider: data.provider,
      providerUserId: data.providerUserId,
    });

    return await this.userRepository.save(user);
  }
}
