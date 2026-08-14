export type Role = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role | string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: Role | string;
  phone?: string | null;
  bio?: string | null;
  avatar?: string | null;
  track?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  accessToken: string;
  user: UserResponse;
}
