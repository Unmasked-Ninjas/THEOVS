export type PollType = 'single' | 'multiple' | 'ranked';

export interface Candidate {
  id?: string; // Temporary ID for frontend management
  name: string;
  description?: string;
  votes?: number;
  percentage?: number;
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  candidates: Candidate[];
  startDate: string;
  endDate: string;
  pollType: PollType;
  isPublic: boolean;
  createdBy: string;
  createdAt: any; // Firestore timestamp
  updatedAt?: string;
  totalVotes: number;
  status: 'active' | 'ended';
}
