
export interface JoinRoomRequest {
  roomId: string;
  word: string;
  userSecret: string;
  username: string;
}

export interface LeaveRoomRequest {
  roomId: string;
  userSecret: string;
}
