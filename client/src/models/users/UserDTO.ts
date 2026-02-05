export interface UserDTO {
  id: number;
  username: string;
  email: string;
  role: string;

  firstName?: string;
  lastName?: string;
  profileImage?: string;
}
