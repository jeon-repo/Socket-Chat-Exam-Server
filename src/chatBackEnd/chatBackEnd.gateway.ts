import { Logger } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatRoomService } from './chatRoom.service';
import { setInitDTO } from './dto/chatBackEnd.dto';
import ss from 'socket.io-stream';

@WebSocketGateway(5000, {
  cors: {
    // origin: 'http://localhost:3000',
    origin: '*',
  },
})
export class ChatBackEndGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly ChatRoomService: ChatRoomService) {}
  @WebSocketServer()
  server: Server;
  logger: Logger = new Logger('socket-gateway');

  //소켓 연결시 유저목록에 추가
  handleConnection(client: Socket): void {
    console.log('connected -> ', client.id);
    client.leave(client.id);
    // client.data.roomId = `room:lobby`;
    // client.join('room:lobby');
    // this.count = client.nsp.adapter.eventNames
    // console.log('client log -> ', client.nsp.adapter);
    console.log('sid list -> ', this.server.sockets.adapter.sids);
    console.log('room list -> ', this.server.sockets.adapter.rooms);
    this.logger.log('client rooms size -> ', client.nsp.adapter.rooms.size);
    this.logger.log('client sids size -> ', client.nsp.adapter.sids.size);
    // this.server.emit('createChatRoom', client.data.nickname);
  }

  //소켓 연결 해제시 유저목록에서 제거
  handleDisconnect(client: Socket): void {
    const { roomId } = client.data;
    if (
      roomId != 'room:lobby' &&
      !this.server.sockets.adapter.rooms.get(roomId)
    ) {
      this.ChatRoomService.deleteChatRoom(roomId);
      this.server.emit(
        'getChatRoomList',
        this.ChatRoomService.getChatRoomList(),
      );
    }
    console.log('disconnected', client.id);
    console.log('socket sids -> ', this.server.sockets.adapter.sids);
  }

  @SubscribeMessage('socketReset')
  socketReset(client: Socket): void {
    this.logger.log('socketReset -> ', client.id);
    this.server.sockets.adapter.rooms.clear();
    this.server.sockets.adapter.sids.clear();
    console.log('socketReset -> ', this.server.sockets.adapter.sids);
  }

  @SubscribeMessage('checkSid')
  checkSid(): void {
    console.log('checkSid -> ', this.server.sockets.adapter.sids);
  }

  //메시지가 전송되면 모든 유저에게 메시지 전송
  @SubscribeMessage('sendMessage')
  sendMessage(client: Socket, message: string): void {
    console.log(`client room ${client.id} -> `, message);
    // console.log(`client room ${client.id} -> `, client.data.roomId);
    client.to(client.data.roomId).emit('getMessage', {
      id: client.id,
      nickname: client.data.nickname,
      message,
    });
  }

  //처음 접속시 닉네임 등 최초 설정
  @SubscribeMessage('setInit')
  setInit(client: Socket, data: setInitDTO): setInitDTO {
    // 이미 최초 세팅이 되어있는 경우 패스
    if (client.data.isInit) {
      return;
    }

    client.data.nickname = data.nickname ? data.nickname : client.id;
    // : '낯선사람 ' + client.id;

    client.data.isInit = true;

    return {
      nickname: client.data.nickname,
      room: {
        roomId: 'room:lobby',
        roomName: '로비',
      },
    };
  }

  //닉네임 변경
  @SubscribeMessage('setNickname')
  setNickname(client: Socket, nickname: string): void {
    const { roomId } = client.data;
    client.to(roomId).emit('getMessage', {
      id: null,
      nickname: '안내',
      message: `"${client.data.nickname}"님이 "${nickname}"으로 닉네임을 변경하셨습니다.`,
    });
    client.data.nickname = nickname;
  }

  //채팅방 목록 가져오기
  @SubscribeMessage('getChatRoomList')
  getChatRoomList(client: Socket, payload: any) {
    client.emit('getChatRoomList', this.ChatRoomService.getChatRoomList());
    console.log('getChatRoomList -> ', this.ChatRoomService.getChatRoomList());
  }

  //채팅방 생성하기
  @SubscribeMessage('createChatRoom')
  createChatRoom(client: Socket, roomName: string) {
    //이전 방이 만약 나 혼자있던 방이면 제거
    // if (
    //   client.data.roomId != 'room:lobby' &&
    //   this.server.sockets.adapter.rooms.get(client.data.roomId).size == 1
    // ) {
    //   this.ChatRoomService.deleteChatRoom(client.data.roomId);
    // }

    this.ChatRoomService.createChatRoom(client, roomName);
    return {
      roomId: client.data.roomId,
      roomName: this.ChatRoomService.getChatRoom(client.data.roomId).roomName,
    };
  }

  //채팅방 들어가기
  @SubscribeMessage('enterChatRoom')
  enterChatRoom(client: Socket, roomId: string) {
    console.log('enterChatRoom -> ', client.rooms);
    //이미 접속해있는 방 일 경우 재접속 차단
    if (client.rooms.has(roomId)) {
      return;
    }
    //이전 방이 만약 나 혼자있던 방이면 제거
    // if (
    //   client.data.roomId != 'room:lobby' &&
    //   this.server.sockets.adapter.rooms.get(client.data.roomId).size == 1
    // ) {
    //   this.ChatRoomService.deleteChatRoom(client.data.roomId);
    // }
    this.ChatRoomService.enterChatRoom(client, roomId);
    return {
      roomId: roomId,
      roomName: this.ChatRoomService.getChatRoom(roomId).roomName,
    };
  }

  // 채팅방 인원 조회
  @SubscribeMessage('getChatRoomMan')
  getChatRoomMan(client: Socket, roomId: string) {
    console.log('check Man -> ', this.server.sockets.adapter.rooms.get(roomId));
    console.log('getChatRoomMan -> ', client.rooms);
  }

  // 파일 전송
  // @SubscribeMessage('uploadFile')
  // uploadFile()
}
