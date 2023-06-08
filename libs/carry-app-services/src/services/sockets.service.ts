import socket_io from 'socket.io';
import { CommonSocketEventsHandler } from './common.socket-event-handler';




export class SocketsService {
  private static io: socket_io.Server;

  public static set_io(io: socket_io.Server) {
    SocketsService.io = io;
  }

  public static get_io(): socket_io.Server {
    return SocketsService.io;
  }



  public static handle_io_connections(io: socket_io.Server) {
    console.log(`----- Socket IO up. -----`, { io: !!io });

    if (SocketsService.io) {
      // already handling
      return;
    }

    SocketsService.io = io;

    const connection = io.on('connection', (socket: socket_io.Socket) => {
      // const originIsAllowed = whitelist_domains.includes(socket.handshake.headers.origin || '');
      // if (!originIsAllowed) {
      //   console.log(`origin "${socket.handshake.headers.origin}" is not allowed`);
      //   return;
      // }
      // console.log(`socket origin (${socket.handshake.headers.origin}) is valid; listening to socket events...`);

      console.log('new socket:', socket.id, '\n');
      // io.to(socket_id).emit(`socket_id`, socket_id);
      
      /** Pass io, socket and state to each handler for app specific events */

      CommonSocketEventsHandler.handleNewSocket(io, socket);
      // HotspotSocketEventsHandler.handleNewSocket(io, socket, SocketsService.userIdsBySocket, SocketsService.userSocketsRoomKeyByUserId);
      // CarMasterSocketEventsHandler.handleNewSocket(io, socket, SocketsService.userIdsBySocket, SocketsService.userSocketsRoomKeyByUserId);
    
      /** end */
    });
  }

}
