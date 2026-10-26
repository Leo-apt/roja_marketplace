import { useAuth } from "@/hooks/useAuth";

export function useProfileImage() {
    const { user } = useAuth();
    return user?.user_image ?? null;
}