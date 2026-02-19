import { Request, Response, NextFunction } from 'express';
import { ArchiveService } from '../services/archiveService';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

const archiveService = new ArchiveService();

export const getArchives = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new ApiError(401, 'Tenant not found');
    }

    const { entityType, page = 1, limit = 20, action } = req.query;

    console.log('Archive request params:', { tenantId, entityType, page, limit, action });

    const result = await archiveService.getAllArchives(
      tenantId,
      entityType as string,
      Number(page),
      Number(limit),
      action as string
    );

    console.log('Archive result:', { 
      totalItems: result.totalItems, 
      dataLength: result.data.length,
      firstItem: result.data[0] 
    });

    res.json(new ApiResponse(200, result, 'Archives retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

export const getEntityHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new ApiError(401, 'Tenant not found');
    }

    const { entityType, entityId } = req.params;

    const history = await archiveService.getEntityHistory(tenantId, entityType, entityId);

    res.json(new ApiResponse(200, history, 'Entity history retrieved successfully'));
  } catch (error) {
    next(error);
  }
};
