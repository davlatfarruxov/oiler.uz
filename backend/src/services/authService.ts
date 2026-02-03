import User, { IUserDocument } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { UserRole } from '../types';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  accessToken: string;
}

export class AuthService {
  async register(data: RegisterData): Promise<{ user: AuthResponse['user']; accessToken: string; refreshToken: string }> {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new ApiError(409, 'Email already registered');
    }

    const user = await User.create(data);

    const accessToken = generateAccessToken({ id: user._id.toString(), role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id.toString(), role: user.role });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    };
  }

  async login(data: LoginData): Promise<{ user: AuthResponse['user']; accessToken: string; refreshToken: string }> {
    const user = await User.findOne({ email: data.email }).select('+password');
    if (!user || !user.isActive) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const isPasswordValid = await user.comparePassword(data.password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const accessToken = generateAccessToken({ id: user._id.toString(), role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id.toString(), role: user.role });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    };
  }

  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const decoded = verifyRefreshToken(token);
      
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) {
        throw new ApiError(401, 'Invalid token');
      }

      const accessToken = generateAccessToken({ id: user._id.toString(), role: user.role });
      const refreshToken = generateRefreshToken({ id: user._id.toString(), role: user.role });

      return { accessToken, refreshToken };
    } catch (error) {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }
  }

  async getProfile(userId: string): Promise<IUserDocument> {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user;
  }
}
