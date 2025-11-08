import { getSocketServer } from './server';
import logger from '@/lib/logger';

export function emitToCustomerRoom(waId: string, event: { type: string; data: any }) {
  const io = getSocketServer();
  
  if (!io) {
    logger.warn('Socket.io server not initialized');
    return;
  }

  const room = waId.startsWith('agent:') ? waId : `customer:${waId}`;
  
  io.to(room).emit(event.type, event.data);
  
  logger.debug('Event emitted to room', { room, type: event.type });
}

export function emitToAgent(agentId: string, event: { type: string; data: any }) {
  emitToCustomerRoom(`agent:${agentId}`, event);
}

export function broadcastAgentStatus(agentId: string, status: 'online' | 'offline') {
  const io = getSocketServer();
  
  if (!io) {
    return;
  }

  io.emit('agent:status', { agentId, status });
}

