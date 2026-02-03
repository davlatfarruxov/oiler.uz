import { Router, Request, Response } from 'express';
import User from '../models/User';
import OilProduct from '../models/OilProduct';
import { ApiResponse } from '../utils/ApiResponse';

const router = Router();

// TEMPORARY ROUTE - Remove after use!
router.post('/make-super-admin', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json(ApiResponse.error('Email is required'));
    }

    const user = await User.findOneAndUpdate(
      { email },
      { role: 'super_admin' },
      { new: true }
    );

    if (!user) {
      return res.status(404).json(ApiResponse.error('User not found'));
    }

    res.status(200).json(ApiResponse.success('User role updated to super_admin', {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    }));
  } catch (error) {
    res.status(500).json(ApiResponse.error('Failed to update user role'));
  }
});

// TEMPORARY - Clean old oil products
router.delete('/clean-oil-products', async (req: Request, res: Response) => {
  try {
    const result = await OilProduct.deleteMany({});
    res.status(200).json(ApiResponse.success('Old oil products deleted', { deletedCount: result.deletedCount }));
  } catch (error) {
    res.status(500).json(ApiResponse.error('Failed to clean oil products'));
  }
});

export default router;
