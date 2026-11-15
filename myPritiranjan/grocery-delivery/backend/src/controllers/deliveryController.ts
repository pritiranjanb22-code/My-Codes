import { Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { deliveryService } from '../services/deliveryService.js';
import { orderService } from '../services/orderService.js';
import { updateDeliveryStatusSchema, idParamSchema } from '../validators/index.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getMyProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const deliveryPerson = await deliveryService.getDeliveryPersonByUserId(req.user!.id);
  
  if (!deliveryPerson) {
    return sendError(res, 'Delivery person profile not found', 404, 'PROFILE_NOT_FOUND');
  }
  
  return sendSuccess(res, deliveryPerson);
});

export const updateMyProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const deliveryPerson = await deliveryService.getDeliveryPersonByUserId(req.user!.id);
  
  if (!deliveryPerson) {
    return sendError(res, 'Delivery person profile not found', 404, 'PROFILE_NOT_FOUND');
  }
  
  const { isAvailable, currentLatitude, currentLongitude } = req.body;
  const updated = await deliveryService.updateDeliveryPerson(deliveryPerson.id, { isAvailable, currentLatitude, currentLongitude });
  return sendSuccess(res, updated);
});

export const getMyAssignments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const deliveryPerson = await deliveryService.getDeliveryPersonByUserId(req.user!.id);
  
  if (!deliveryPerson) {
    return sendError(res, 'Delivery person profile not found', 404, 'PROFILE_NOT_FOUND');
  }
  
  const status = req.query.status as string;
  const assignments = await deliveryService.getDeliveryAssignments(deliveryPerson.id, status);
  return sendSuccess(res, assignments);
});

export const getAssignmentDetails = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const deliveryPerson = await deliveryService.getDeliveryPersonByUserId(req.user!.id);
  
  if (!deliveryPerson) {
    return sendError(res, 'Delivery person profile not found', 404, 'PROFILE_NOT_FOUND');
  }
  
  const { id } = idParamSchema.parse(req.params);
  const assignment = await deliveryService.getOrderDeliveryDetails(id);
  
  if (assignment.delivery_person_id !== deliveryPerson.id) {
    return sendError(res, 'Assignment not found', 404, 'ASSIGNMENT_NOT_FOUND');
  }
  
  return sendSuccess(res, assignment);
});

export const updateDeliveryStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const deliveryPerson = await deliveryService.getDeliveryPersonByUserId(req.user!.id);
  
  if (!deliveryPerson) {
    return sendError(res, 'Delivery person profile not found', 404, 'PROFILE_NOT_FOUND');
  }
  
  const { id } = idParamSchema.parse(req.params);
  const data = updateDeliveryStatusSchema.parse(req.body);
  
  const result = await deliveryService.updateDeliveryStatus(deliveryPerson.id, id, data);
  return sendSuccess(res, result);
});

export const getMyStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const deliveryPerson = await deliveryService.getDeliveryPersonByUserId(req.user!.id);
  
  if (!deliveryPerson) {
    return sendError(res, 'Delivery person profile not found', 404, 'PROFILE_NOT_FOUND');
  }
  
  const stats = await deliveryService.getDeliveryStats(deliveryPerson.id);
  return sendSuccess(res, stats);
});