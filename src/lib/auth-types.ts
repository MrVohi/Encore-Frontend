export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_email_verified: boolean;
  provider: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  recaptcha_token: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  googleLogin: () => Promise<void>;
}