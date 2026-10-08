import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authApi } from '@/lib/api';
import { AxiosError } from 'axios';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'recruiter' | 'admin';
  emailVerified: boolean;
}

interface AuthResult {
  success: boolean;
  message?: string;
}

interface RegisterStudentData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  universityId?: number;
  majorId?: number;
  graduationYear?: number;
  // Step 2 fields
  linkedinUrl?: string;
  githubUrl?: string;
  cvUrl?: string;
  careerPathId?: number;
  skillIds?: number[];
  interestIds?: number[];
}

interface RegisterRecruiterData {
  email: string;
  password: string;
  name: string;
  phone: string;
  companyName: string;
  companyDescription?: string;
  website?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  registerStudent: (data: RegisterStudentData) => Promise<AuthResult>;
  registerRecruiter: (data: RegisterRecruiterData) => Promise<AuthResult>;
  verifyEmail: (token: string) => Promise<AuthResult>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const response = await authApi.login({ email, password });
      const { token, user: userData } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const message = axiosError.response?.data?.message || 'Login failed';
      return { success: false, message };
    }
  };

  const registerStudent = async (data: RegisterStudentData): Promise<AuthResult> => {
    try {
      const response = await authApi.registerStudent(data);
      const { token, user: userData } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const message = axiosError.response?.data?.message || 'Registration failed';
      return { success: false, message };
    }
  };

  const registerRecruiter = async (data: RegisterRecruiterData): Promise<AuthResult> => {
    try {
      const response = await authApi.registerRecruiter(data);
      const { token, user: userData } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const message = axiosError.response?.data?.message || 'Registration failed';
      return { success: false, message };
    }
  };

  const verifyEmail = async (token: string): Promise<AuthResult> => {
    try {
      const response = await authApi.verifyEmail(token);
      const { token: newToken, user: userData } = response.data;

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const message = axiosError.response?.data?.message || 'Verification failed';
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    const updatedUser = { ...user, ...updates } as User;
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        registerStudent,
        registerRecruiter,
        verifyEmail,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
