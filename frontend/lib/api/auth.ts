import { apiClient } from "./client"
import type { LoginPayload, LoginResult, RegisterPayload, User } from "@/types/auth"

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<LoginResult>("/auth/login", payload, { auth: false }),

  me: () => apiClient.get<User>("/auth/me"),

  register: (payload: RegisterPayload) => apiClient.post<User>("/auth/register", payload),
}
