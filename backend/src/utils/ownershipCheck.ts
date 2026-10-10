import { Model, Types } from 'mongoose';
import { AppError } from './AppError.js';

/**
 * Assert that a resource belongs to the requesting user.
 * Always returns 404 (never 403) to avoid confirming resource existence to unauthorized users.
 *
 * @param ModelClass - Mongoose model
 * @param resourceId - The resource ID to look up
 * @param userId - The authenticated user's ID
 * @param ownerField - The field name that holds the owner reference (default: 'userId')
 */
export async function assertOwnership<T>(
  ModelClass: Model<T>,
  resourceId: string,
  userId: string,
  ownerField = 'userId',
): Promise<T> {
  const query: Record<string, unknown> = {
    _id: new Types.ObjectId(resourceId),
    [ownerField]: new Types.ObjectId(userId),
    isDeleted: false,
  };

  const doc = await ModelClass.findOne(query);
  if (!doc) {
    throw AppError.notFound('Resource');
  }
  return doc as T;
}
