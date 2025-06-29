import { QueryClient } from "@tanstack/react-query";
import type { Match, BallInfo } from "@shared/schema";

// API-based query functions - single source of truth
export const clientQueryFunctions = {
  getCurrentMatch: async (): Promise<Match | null> => {
    const response = await fetch('/api/match/current');
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to get current match');
    }
    return response.json();
  },
  
  createMatch: async (matchData: {
    player1Name: string;
    player1SkillLevel: number;
    player2Name: string;
    player2SkillLevel: number;
    ballStates?: BallInfo[];
  }): Promise<Match> => {
    const response = await fetch('/api/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(matchData)
    });
    if (!response.ok) throw new Error('Failed to create match');
    return response.json();
  },
  
  updateMatch: async (matchId: number, updates: Partial<Match>): Promise<Match | null> => {
    const response = await fetch(`/api/match/${matchId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update match');
    return response.json();
  },
  
  updateBallStates: async (matchId: number, ballStates: BallInfo[]): Promise<Match | null> => {
    const response = await fetch(`/api/match/${matchId}/balls`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ballStates })
    });
    if (!response.ok) throw new Error('Failed to update ball states');
    return response.json();
  }
};

// Custom query function for API operations
const getQueryFn = (context: { queryKey: readonly unknown[] }) => {
  const [endpoint] = context.queryKey as string[];
  
  switch (endpoint) {
    case '/api/match/current':
      return clientQueryFunctions.getCurrentMatch();
    default:
      throw new Error(`Unknown query endpoint: ${endpoint}`);
  }
};

// API mutation helper
export function clientMutation<T>(
  mutationFn: () => Promise<T>
): Promise<T> {
  return mutationFn();
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn,
      staleTime: 0, // Always fresh for localStorage
      refetchOnWindowFocus: false,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
