import { QueryClient } from "@tanstack/react-query";
import { cookieStorageAPI } from "./cookieStorage";
import type { Match, BallInfo } from "@shared/schema";

// Client-side query functions using cookie storage
export const clientQueryFunctions = {
  getCurrentMatch: (): Match | null => {
    return cookieStorageAPI.getCurrentMatch();
  },
  
  createMatch: (matchData: {
    player1Name: string;
    player1SkillLevel: number;
    player2Name: string;
    player2SkillLevel: number;
    ballStates?: BallInfo[];
  }): Match => {
    return cookieStorageAPI.createMatch(matchData);
  },
  
  updateMatch: (matchId: string, updates: Partial<Match>): Match | null => {
    return cookieStorageAPI.updateMatch(matchId, updates);
  },
  
  updateBallStates: (matchId: string, ballStates: BallInfo[]): Match | null => {
    return cookieStorageAPI.updateBallStates(matchId, ballStates);
  }
};

// Custom query function for client-side operations
const getQueryFn = (context: { queryKey: readonly unknown[] }) => {
  const [endpoint] = context.queryKey as string[];
  
  switch (endpoint) {
    case '/api/match/current':
      return Promise.resolve(clientQueryFunctions.getCurrentMatch());
    default:
      throw new Error(`Unknown query endpoint: ${endpoint}`);
  }
};

// Client-side mutation helper
export function clientMutation<T>(
  mutationFn: () => T
): Promise<T> {
  return Promise.resolve(mutationFn());
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn,
      staleTime: 0, // Always fresh for cookie storage
      refetchOnWindowFocus: false,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
