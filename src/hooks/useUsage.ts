import { useQuery } from "@tanstack/react-query";
import {
  ANALYTICS_PRO,
  analyticsApi,
  apiKeysApi,
  subscriptionApi,
} from "@/api";
import type { ApiKey } from "@/types";
import { useAuth } from "./AuthContext";

// The queries behind Overview and Usage. Widgets asking for the same thing
// share one request through the query key.

export function useSubscription() {
  const { tokens, user } = useAuth();
  const accessToken = tokens?.accessToken;
  const userId = user?.id;
  return useQuery({
    queryKey: ["subscription", userId, accessToken],
    queryFn: () => subscriptionApi.getSubscription(userId!, accessToken),
    enabled: !!accessToken && !!userId,
    // On load and on focus, at most about once a minute
    staleTime: 60_000,
    retry: 1,
  });
}

// Whether the plan includes Pro Analytics. False until the plan loads, and
// if it can't be loaded.
export function useAnalyticsPro() {
  const { data } = useSubscription();
  return data?.subscriptionType.features?.includes(ANALYTICS_PRO) ?? false;
}

export function useAnalyticsSummary(days: number) {
  const { tokens } = useAuth();
  const accessToken = tokens?.accessToken;
  return useQuery({
    queryKey: ["analytics-summary", days, accessToken],
    queryFn: () => analyticsApi.getSummary(days, accessToken),
    enabled: !!accessToken,
    retry: 1,
  });
}

// The caller's key names by id, to label usage per key
export function useApiKeyNames() {
  const { tokens } = useAuth();
  const accessToken = tokens?.accessToken;
  return useQuery({
    queryKey: ["api-key-names", accessToken],
    queryFn: async () => {
      const keys = (await apiKeysApi.getApiKeys(accessToken)) as ApiKey[];
      return new Map(keys.map((key) => [key.id, key.name]));
    },
    enabled: !!accessToken,
    staleTime: 60_000,
    retry: 1,
  });
}
