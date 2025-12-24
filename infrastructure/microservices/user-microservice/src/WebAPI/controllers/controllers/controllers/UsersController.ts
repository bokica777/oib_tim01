import { Router, Request, Response } from "express";
import { ILogerService } from "../../../../Domain/services/ILogerService";
import { IUsersService } from "../../../../Domain/services/IUsersService";
import { CreateUserDTO } from "../../../../Domain/DTOs/CreateUserDTO";
import { UpdateUserDTO } from "../../../../Domain/DTOs/UpdateUserDTO";

export class UsersController {
  private readonly router: Router;

  constructor(
    private readonly usersService: IUsersService,
    private readonly logger: ILogerService
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get("/users", this.getAllUsers.bind(this));
    this.router.get("/users/:id", this.getUserById.bind(this));

    this.router.post("/users", this.createUser.bind(this));
    this.router.put("/users/:id", this.updateUser.bind(this));
    this.router.delete("/users/:id", this.deleteUser.bind(this));

    this.router.get("/users/search", this.searchUsers.bind(this));
  }

  private async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      this.logger.log("Fetching all users");
      const users = await this.usersService.getAllUsers();
      res.status(200).json(users);
    } catch (err) {
      this.logger.log((err as Error).message);
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      this.logger.log(`Fetching user with ID ${id}`);
      const user = await this.usersService.getUserById(id);
      res.status(200).json(user);
    } catch (err) {
      this.logger.log((err as Error).message);
      res.status(404).json({ message: (err as Error).message });
    }
  }

  private async createUser(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateUserDTO = req.body;
      this.logger.log("Creating new user");
      const user = await this.usersService.createUser(data);
      res.status(201).json(user);
    } catch (err) {
      this.logger.log((err as Error).message);
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const data: UpdateUserDTO = req.body;
      this.logger.log(`Updating user with ID ${id}`);
      const user = await this.usersService.updateUser(id, data);
      res.status(200).json(user);
    } catch (err) {
      this.logger.log((err as Error).message);
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      this.logger.log(`Deleting user with ID ${id}`);
      await this.usersService.deleteUser(id);
      res.status(204).send();
    } catch (err) {
      this.logger.log((err as Error).message);
      res.status(404).json({ message: (err as Error).message });
    }
  }

  private async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, role } = req.query;
      this.logger.log("Searching users");
      const users = await this.usersService.searchUsers({
        username: username as string | undefined,
        email: email as string | undefined,
        role: role as string | undefined,
      });
      res.status(200).json(users);
    } catch (err) {
      this.logger.log((err as Error).message);
      res.status(400).json({ message: (err as Error).message });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
