
export interface PublicRoom {
  roomId: string;
  status: 'unready' | 'defining' | 'voting';
  users: PublicUser[];
  word?: string;
  definitions?: string[];
}

export interface PublicUser {
  username: string;
  points: number;
  connected: boolean;
  ready: boolean;
}
