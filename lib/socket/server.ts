import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import logger from '@/lib/logger';

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HTTPServer): SocketIOServer {
  if (io) {
    return io;
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/api/socket',
  });

  io.on('connection', (socket) => {
    logger.info('Socket connected', { socketId: socket.id });

    // Agent joins their own room
    socket.on('agent:join', (data: { agentId: string }) => {
      const room = `agent:${data.agentId}`;
      socket.join(room);
      logger.info('Agent joined room', { agentId: data.agentId, room });

      // Broadcast online status
      io?.emit('agent:status', {
        agentId: data.agentId,
        status: 'online',
      });
    });

    // Agent leaves their room
    socket.on('agent:leave', (data: { agentId: string }) => {
      const room = `agent:${data.agentId}`;
      socket.leave(room);
      logger.info('Agent left room', { agentId: data.agentId, room });

      // Broadcast offline status
      io?.emit('agent:status', {
        agentId: data.agentId,
        status: 'offline',
      });
    });

    // Agent joins customer conversation room
    socket.on('customer:join', (data: { waId: string }) => {
      const room = `customer:${data.waId}`;
      socket.join(room);
      logger.info('Joined customer room', { waId: data.waId, room });
    });

    // Agent leaves customer conversation room
    socket.on('customer:leave', (data: { waId: string }) => {
      const room = `customer:${data.waId}`;
      socket.leave(room);
      logger.info('Left customer room', { waId: data.waId, room });
    });

    // Agent sends message to customer
    socket.on('agent:message', (data: {
      customerId: string;
      waId: string;
      text: string;
      agentId: string;
    }) => {
      logger.info('Agent message received', { 
        customerId: data.customerId,
        agentId: data.agentId,
      });

      // Emit to customer room
      io?.to(`customer:${data.waId}`).emit('message', {
        type: 'message',
        data: {
          direction: 'out',
          text: data.text,
          timestamp: new Date().toISOString(),
          fromAgent: true,
        },
      });
    });

    // Handoff events
    socket.on('handoff:start', (data: {
      customerId: string;
      waId: string;
      agentId: string;
    }) => {
      logger.info('Handoff started', data);
      
      io?.to(`customer:${data.waId}`).emit('handoff:active', {
        active: true,
        agentId: data.agentId,
      });
    });

    socket.on('handoff:end', (data: {
      customerId: string;
      waId: string;
    }) => {
      logger.info('Handoff ended', data);
      
      io?.to(`customer:${data.waId}`).emit('handoff:active', {
        active: false,
      });
    });

    // WebRTC signaling
    socket.on('rtc:offer', (data: {
      waId: string;
      offer: any;
    }) => {
      logger.info('RTC offer received', { waId: data.waId });
      socket.to(`rtc:${data.waId}`).emit('rtc:offer', data.offer);
    });

    socket.on('rtc:answer', (data: {
      waId: string;
      answer: any;
    }) => {
      logger.info('RTC answer received', { waId: data.waId });
      socket.to(`rtc:${data.waId}`).emit('rtc:answer', data.answer);
    });

    socket.on('rtc:ice-candidate', (data: {
      waId: string;
      candidate: any;
    }) => {
      socket.to(`rtc:${data.waId}`).emit('rtc:ice-candidate', data.candidate);
    });

    socket.on('rtc:join', (data: { waId: string }) => {
      const room = `rtc:${data.waId}`;
      socket.join(room);
      logger.info('Joined RTC room', { waId: data.waId, room });
    });

    socket.on('disconnect', () => {
      logger.info('Socket disconnected', { socketId: socket.id });
    });
  });

  logger.info('Socket.io server initialized');
  return io;
}

export function getSocketServer(): SocketIOServer | null {
  return io;
}

