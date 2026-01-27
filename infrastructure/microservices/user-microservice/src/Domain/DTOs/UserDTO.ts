export interface UserDTO {
  id: number;
  username: string;
  email: string;
  role: string;
  profileImage: string | null;
  firstName: string | null;
  lastName: string | null;
}
