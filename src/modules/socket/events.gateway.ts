import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to WebSocket: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_user_room')
  handleJoinUserRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    if (data && data.userId) {
      const room = `user_${data.userId}`;
      client.join(room);
      this.logger.log(`Socket ${client.id} joined room ${room}`);
      return { event: 'room_joined', room };
    }
  }

  @SubscribeMessage('join_admin_room')
  handleJoinAdminRoom(@ConnectedSocket() client: Socket) {
    client.join('admin_room');
    this.logger.log(`Socket ${client.id} joined admin_room`);
    return { event: 'room_joined', room: 'admin_room' };
  }

  emitDiplomaAccessUpdated(
    userId: string,
    payload: {
      userId: string;
      courseId?: string;
      status: 'ACTIVE' | 'INACTIVE' | string;
      hasDiplomaAccess: boolean;
    },
  ) {
    const userRoom = `user_${userId}`;
    this.logger.log(`Emitting diploma_access_updated to ${userRoom} and admin_room:`, payload);

    // Emit to specific user room
    this.server.to(userRoom).emit('diploma_access_updated', payload);
    // Emit to all admin clients for live dashboard sync
    this.server.to('admin_room').emit('diploma_access_updated', payload);
  }

  emitModuleAccessUpdated(
    userId: string,
    payload: {
      userId: string;
      moduleId: string;
      originalModuleId?: string;
      isUnlocked: boolean;
      moduleTitle?: string;
      notes?: string;
    },
  ) {
    const userRoom = `user_${userId}`;
    this.logger.log(`Emitting module_access_updated to ${userRoom} and admin_room:`, payload);

    this.server.to(userRoom).emit('module_access_updated', payload);
    this.server.to('admin_room').emit('module_access_updated', payload);
  }

  emitCustomAssignmentCreated(
    userId: string,
    payload: {
      userId: string;
      title: string;
      description: string;
      attachmentUrl?: string;
      dueDate?: string;
    },
  ) {
    const userRoom = `user_${userId}`;
    this.logger.log(`Emitting custom_assignment_created to ${userRoom}:`, payload);

    this.server.to(userRoom).emit('custom_assignment_created', payload);
    this.server.to('admin_room').emit('custom_assignment_created', payload);
  }
}
