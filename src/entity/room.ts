
export interface Room {
  roomId: string;
  status: 'unready' | 'defining' | 'voting';
  word?: string;
  definition?: string;
  users: { [key: string]: User; };
}

export interface User {
  userSecret: string;
  username: string;
  points: number;
  connectedSocket: string;
  ready: boolean;
  definition?: string;
  vote?: string;
}
