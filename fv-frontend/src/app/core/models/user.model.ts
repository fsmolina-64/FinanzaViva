export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
}

// Lo que se envía al actualizar perfil
export interface UpdateProfileRequest {
  name?: string;
  avatar?: string;
  bio?: string;
}