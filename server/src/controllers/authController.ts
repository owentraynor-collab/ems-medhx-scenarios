import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authController = {
  // Register new user
  async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName, role, organization } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create new user
      const user = new User({
        email,
        password,
        firstName,
        lastName,
        role,
        organization,
      });

      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organization: user.organization,
        },
      });
    } catch (error) {
      res.status(500).json({ message: 'Error creating user', error });
    }
  },

  // Login user
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organization: user.organization,
        },
      });
    } catch (error) {
      res.status(500).json({ message: 'Error logging in', error });
    }
  },

  // Get current user
  async getCurrentUser(req: Request, res: Response) {
    try {
      const user = await User.findById(req.user?.userId).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user', error });
    }
  },
};

