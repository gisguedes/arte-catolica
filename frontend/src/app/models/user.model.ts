export interface User {
  id: string;
  name: string;
  surname?: string;
  email: string;
  avatar?: string;
  provider?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  user: User;
}

