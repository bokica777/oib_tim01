import { UserRole } from "../enums/UserRole";

export interface UpdateUserDTO {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  profileImage?: string;
}
