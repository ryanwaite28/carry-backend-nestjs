import socket_io from 'socket.io';
import { PlainObject } from '../interfaces/common.interface';
import { COMMON_EVENT_TYPES } from '../enums/carry.enum';
import { decodeJWT } from '../utils/helpers.utils';
import { UserEntity } from '../entities/carry.entity';




export class CommonSocketEventsHandler {
  private static io: socket_io.Server;

  public static handleNewSocket(
    io: socket_io.Server,
    socket: socket_io.Socket,
  ): void {
    CommonSocketEventsHandler.io = io;

    socket.on(`disconnect`, (data: any) => {
      console.log(`disconnecting socket ${socket.id}...`);
    });

    socket.on(COMMON_EVENT_TYPES.SOCKET_JOIN_ROOM, (data: any) => {
      CommonSocketEventsHandler.SOCKET_JOIN_ROOM(io, socket, data);
    });

    socket.on(COMMON_EVENT_TYPES.SOCKET_LEAVE_ROOM, (data: any) => {
      CommonSocketEventsHandler.SOCKET_LEAVE_ROOM(io, socket, data);
    });

    socket.on(COMMON_EVENT_TYPES.SOCKET_TRACK, (data: any) => {
      CommonSocketEventsHandler.SOCKET_TRACK(io, socket, data);
    });

    socket.on(`EMIT_TO_ROOM`, (data: any) => {
      CommonSocketEventsHandler.EMIT_TO_ROOM(io, socket, data);
    });

    socket.on(`EMIT_TO_USER`, (data: any) => {
      CommonSocketEventsHandler.EMIT_TO_USER(io, socket, data);
    });
  }



  /** Helpers */

  private static SOCKET_JOIN_ROOM(
    io: socket_io.Server,
    socket: socket_io.Socket,
    data: any,
  ) {
    console.log(`CommonSocketEventsHandler - SOCKET_JOIN_ROOM event | socket id ${socket.id}`, data);

    const validEventData = (
      data.hasOwnProperty('room') &&
      typeof(data.room) === 'string'
    );
    if (!validEventData) {
      socket.to(socket.id).emit(`ERROR`, {
        error: `${COMMON_EVENT_TYPES.SOCKET_JOIN_ROOM}-error`,
        message: `room is required.`
      });
      return;
    }

    socket.join(data.room);

    CommonSocketEventsHandler.io.in(data.room).allSockets().then((sockets) => {
      console.log(`SOCKET_JOIN_ROOM - sockets in room ${data.room}:`, sockets);
    });
  }

  private static SOCKET_LEAVE_ROOM(
    io: socket_io.Server,
    socket: socket_io.Socket,
    data: any,
  ) {
    console.log(`CommonSocketEventsHandler - SOCKET_LEAVE_ROOM event | socket id ${socket.id}`, data);

    const validEventData = (
      data.hasOwnProperty('room') &&
      typeof(data.room) === 'string'
    );
    if (!validEventData) {
      socket.to(socket.id).emit(`ERROR`, {
        error: `${COMMON_EVENT_TYPES.SOCKET_LEAVE_ROOM}-error`,
        message: `room is required.`
      });
      return;
    }

    socket.leave(data.room);
    
    CommonSocketEventsHandler.io.in(data.room).allSockets().then((sockets) => {
      console.log(`SOCKET_LEAVE_ROOM - sockets in room ${data.room}:`, sockets);
    });
  }

  static emitEventToUserSockets(params: {
    user_id: number;
    event: string;
    event_data: PlainObject;
  }) {
    if (!params.user_id) {
      console.log(`CommonSocketEventsHandler.emitEventToRoom - no user id given`);
      return;
    }
    if (!params.event) {
      console.log(`CommonSocketEventsHandler.emitEventToRoom - no event name given`);
      return;
    }
    if (!params.event_data) {
      console.log(`CommonSocketEventsHandler.emitEventToRoom - no event data given`);
      return;
    }

    if (!('event' in params.event_data)) {
      params.event_data.event = params.event;
    }
    if (!('event_name' in params.event_data)) {
      params.event_data.event_name = params.event;
    }

    const usersSocketsRoom = `FOR_USER:${params.user_id}`;
    // CommonSocketEventsHandler.io?.in(usersSocketsRoom).allSockets().then((usersSockets) => {
    //   console.log(`emitEventToUserSockets - Emitting to room ${usersSocketsRoom}...`, usersSockets);
    //   CommonSocketEventsHandler.io.in(usersSocketsRoom).emit(params.event, params.event_data);
    // });
    CommonSocketEventsHandler.io.to(usersSocketsRoom).emit(params.event, params.event_data);
  }

  static emitEventToRoom(params: {
    room: string;
    event: string;
    data: PlainObject;
  }) {
    if (!params.room) {
      console.log(`CommonSocketEventsHandler.emitEventToRoom - no roomKey given`);
      return;
    }
    if (!params.event) {
      console.log(`CommonSocketEventsHandler.emitEventToRoom - no event given`);
      return;
    }
    if (!params.data) {
      console.log(`CommonSocketEventsHandler.emitEventToRoom - no data given`);
      return;
    }

    if (!('event' in params.data)) {
      params.data.event = params.event;
    }

    CommonSocketEventsHandler.io.in(params.room).allSockets().then((roomSockets) => {
      console.log(`emitEventToRoom - Emitting to room ${params.room}...`, roomSockets);
      CommonSocketEventsHandler.io.in(params.room).emit(params.event, params.data);
    });
  }





  /** Handlers */

  private static async SOCKET_TRACK(
    io: socket_io.Server,
    socket: socket_io.Socket,
    data: any
  ) {
    const validJwtInData = (
      data.hasOwnProperty('jwt') &&
      typeof(data.jwt) === 'string'
    );
    if (!validJwtInData) {
      io.to(socket.id).emit(`${COMMON_EVENT_TYPES.SOCKET_TRACK}-error`, { message: `jwt is required.` });
      return;
    }

    console.log(`CommonSocketEventsHandler - SOCKET_TRACK event`);

    /* Check token validity */
    const token = data.jwt;
    let you: UserEntity;
    try {
      you = (decodeJWT(token) || null) as UserEntity;
    } 
    catch (e) {
      console.log(e);
      io.to(socket.id).emit(`${COMMON_EVENT_TYPES.SOCKET_TRACK}-error`, { message: `jwt is invalid.`, e });
      return;
    }

    if (!you) {
      io.to(socket.id).emit(`${COMMON_EVENT_TYPES.SOCKET_TRACK}-error`, { message: `jwt is invalid.` });
      return;
    }


    // add user to it's dedicated room
    const usersSocketsRoom = `FOR_USER:${data.user_id}`;
    socket.join(usersSocketsRoom);
    io.in(usersSocketsRoom).allSockets().then((sockets) => {
      console.log(`CommonSocketEventsHandler.SOCKET_TRACK - User ${data.user_id} added socket id ${socket.id} to room ${usersSocketsRoom} | sockets in room:`, sockets);
    });
  }

  private static EMIT_TO_ROOM(
    io: socket_io.Server,
    socket: socket_io.Socket,
    data: any
  ) {
    console.log(`CommonSocketEventsHandler - EMIT_TO_ROOM event | socket id ${socket.id}`, data);

    const validEventData = 
    (
      data.hasOwnProperty('to_room') &&
      typeof(data.to_room) === 'string'
    ) &&
    (
      data.hasOwnProperty('event_name') &&
      typeof(data.event_name) === 'string'
    ) &&
    (
      data.hasOwnProperty('data') &&
      typeof(data.data) === 'object'
    );
    if (!validEventData) {
      io.to(socket.id).emit(`EMIT_TO_ROOM-error`, { message: `to_room (string) is required; event_name (string) is required; data (object) is required` });
      return;
    }

    io.in(data.to_room).allSockets().then((sockets) => {
      console.log(`EMIT_TO_ROOM - sockets in room ${data.to_room}:`, sockets);
      socket.to(data.to_room).emit(data.event_name, data.data);
    });
  }

  private static EMIT_TO_USER(
    io: socket_io.Server,
    socket: socket_io.Socket,
    data: any
  ) {
    console.log(`CommonSocketEventsHandler - EMIT_TO_USER event | socket id ${socket.id}`, data);

    const validEventData = 
    (
      data.hasOwnProperty('user_id') &&
      typeof(data.user_id) === 'number'
    ) &&
    (
      data.hasOwnProperty('event_name') &&
      typeof(data.event_name) === 'string'
    ) &&
    (
      data.hasOwnProperty('data') &&
      typeof(data.data) === 'object'
    );
    if (!validEventData) {
      io.to(socket.id).emit(`EMIT_TO_USER-error`, { message: `user_id (number) is required; event_name (string) is required; data (object) is required` });
      return;
    }

    console.log(`EMIT_TO_USER event:`, data);

    CommonSocketEventsHandler.emitEventToUserSockets({
      user_id: data.user_id,
      event: data.event_name,
      event_data: data.data,
    });
  }
}