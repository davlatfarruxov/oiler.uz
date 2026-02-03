import { Request, Response, NextFunction } from 'express';
import { EmployeeService } from '../services/employeeService';
import { ApiResponse } from '../utils/ApiResponse';

const employeeService = new EmployeeService();

export class EmployeeController {
  async createEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employee = await employeeService.createEmployee(req.body);
      res.status(201).json(ApiResponse.success('Employee created successfully', employee));
    } catch (error) {
      next(error);
    }
  }

  async getAllEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employees = await employeeService.getAllEmployeesWithStats();
      res.status(200).json(ApiResponse.success('Employees retrieved', employees));
    } catch (error) {
      next(error);
    }
  }

  async getEmployeeById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employee = await employeeService.getEmployeeWithPerformance(req.params.id);
      res.status(200).json(ApiResponse.success('Employee retrieved', employee));
    } catch (error) {
      next(error);
    }
  }

  async getEmployeeStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await employeeService.getEmployeeStats();
      res.status(200).json(ApiResponse.success('Employee statistics retrieved', stats));
    } catch (error) {
      next(error);
    }
  }

  async getEmployeePerformance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const performance = await employeeService.getEmployeePerformance(req.params.id);
      res.status(200).json(ApiResponse.success('Employee performance retrieved', performance));
    } catch (error) {
      next(error);
    }
  }

  async updateEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employee = await employeeService.updateEmployee(req.params.id, req.body);
      res.status(200).json(ApiResponse.success('Employee updated successfully', employee));
    } catch (error) {
      next(error);
    }
  }

  async toggleEmployeeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employee = await employeeService.toggleEmployeeStatus(req.params.id);
      res.status(200).json(ApiResponse.success('Employee status toggled', employee));
    } catch (error) {
      next(error);
    }
  }

  async deleteEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await employeeService.deleteEmployee(req.params.id);
      res.status(200).json(ApiResponse.success('Employee deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}
