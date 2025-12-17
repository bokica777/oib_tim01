import { Repository } from "typeorm";
import { IUsersService } from "../Domain/services/IUsersService";
import { User } from "../Domain/models/User";
import { UserDTO } from "../Domain/DTOs/UserDTO";
import { CreateUserDTO } from "../Domain/DTOs/CreateUserDTO";
import { UpdateUserDTO } from "../Domain/DTOs/UpdateUserDTO";

export class UsersService implements IUsersService {
  constructor(private userRepository: Repository<User>) {}

  async getAllUsers(): Promise<UserDTO[]> {
    const users = await this.userRepository.find();
    return users.map(u => this.toDTO(u));
  }

  async getUserById(id: number): Promise<UserDTO> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new Error(`User with ID ${id} not found`);
    return this.toDTO(user);
  }

  async createUser(data: CreateUserDTO): Promise<UserDTO> {
    const user = this.userRepository.create(data);
    const saved = await this.userRepository.save(user);
    return this.toDTO(saved);
  }

  async updateUser(id: number, data: UpdateUserDTO): Promise<UserDTO> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new Error(`User with ID ${id} not found`);

    Object.assign(user, data);
    const saved = await this.userRepository.save(user);

    return this.toDTO(saved);
  }

  async deleteUser(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (!result.affected) {
      throw new Error(`User with ID ${id} not found`);
    }
  }

  async searchUsers(query: {
    username?: string;
    email?: string;
    role?: string;
  }): Promise<UserDTO[]> {
    const qb = this.userRepository.createQueryBuilder("user");

    if (query.username) {
      qb.andWhere("user.username LIKE :username", {
        username: `%${query.username}%`,
      });
    }

    if (query.email) {
      qb.andWhere("user.email LIKE :email", {
        email: `%${query.email}%`,
      });
    }

    if (query.role) {
      qb.andWhere("user.role = :role", { role: query.role });
    }

    const users = await qb.getMany();
    return users.map(u => this.toDTO(u));
  }


  private toDTO(user: User): UserDTO {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: user.profileImage!,
    };
  }
}
