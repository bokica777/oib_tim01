import { UpdateUserDTO } from "../../../../Domain/DTOs/UpdateUserDTO"; 
import { UserRole } from "../../../../Domain/enums/UserRole"; 

export function validateUpdateUser(
  data: UpdateUserDTO
): { success: boolean; message?: string } {

  if (data.email && !data.email.includes("@")) {
    return { success: false, message: "Invalid email address" };
  }

  if (data.firstName && data.firstName.trim().length < 2) {
    return { success: false, message: "First name too short" };
  }

  if (data.lastName && data.lastName.trim().length < 2) {
    return { success: false, message: "Last name too short" };
  }

  if (data.role && !Object.values(UserRole).includes(data.role)) {
    return { success: false, message: "Invalid role" };
  }

  if (!data.profileImage) {
    return { success: false, message: "Profile image is required" };
  }

  if (!data.profileImage.startsWith("data:image")) {
    return { success: false, message: "Profile image must be base64 encoded" };
  }

  return { success: true };
}
