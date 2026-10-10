import { Request, Response } from 'express';
import { processChat } from './chat.service.js';

export async function handleChat(req: Request, res: Response): Promise<void> {
  const { message, history, location, bookVolunteerId, bookingServiceType } = req.body;

  if (!message || typeof message !== 'string') {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Message is required' },
    });
    return;
  }

  const userId = (req as any).user?._id?.toString() || (req as any).user?.userId;

  try {
    const result = await processChat({
      message: message.trim(),
      history,
      location,
      userId,
      bookVolunteerId,
      bookingServiceType,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CHAT_ERROR', message: error.message || 'Error processing chat message' },
    });
  }
}
