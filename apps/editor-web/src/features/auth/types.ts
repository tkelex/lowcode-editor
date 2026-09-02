export interface User {
  id: number;
  email: string;
  username: string;
  role?: 'user' | 'admin';
  status?: 'active' | 'disabled';
  nickname?: string | null;
  avatarUrl?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
