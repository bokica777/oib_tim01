import { CreateUserDTO } from "../../../../Domain/DTOs/CreateUserDTO"; 
import { UserRole } from "../../../../Domain/enums/UserRole";

export function validateCreateUser(
  data: CreateUserDTO
): { success: boolean; message?: string } {

  if (!data.username || data.username.trim().length < 3) {
    return { success: false, message: "Username must be at least 3 characters long" };
  }

  if (!data.email || !data.email.includes("@")) {
    return { success: false, message: "Invalid email address" };
  }

  if (!data.firstName || data.firstName.trim().length < 2) {
    return { success: false, message: "First name must be at least 2 characters long" };
  }

  if (!data.lastName || data.lastName.trim().length < 2) {
    return { success: false, message: "Last name must be at least 2 characters long" };
  }

  if (!Object.values(UserRole).includes(data.role)) {
    return { success: false, message: "Invalid role" };
  }

  if (data.profileImage && !data.profileImage.startsWith("data:image")) {
    return { success: false, message: "Profile image must be base64 encoded" };
  }

  return { success: true };
}
