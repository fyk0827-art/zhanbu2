import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/services/api";

export function useAdminAuth() {
  const queryClient = useQueryClient();

  const {
    data: admin,
    isLoading,
  } = useQuery({
    queryKey: ["admin", "me"],
    queryFn: authApi.me,
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: !!localStorage.getItem("adminToken"),
  });

  const logout = useCallback(() => {
    localStorage.removeItem("adminToken");
    queryClient.invalidateQueries();
    window.location.reload();
  }, [queryClient]);

  return useMemo(
    () => ({
      admin: admin ? { username: admin, role: "admin" } : null,
      isAuthenticated: !!admin,
      isLoading,
      logout,
    }),
    [admin, isLoading, logout]
  );
}
