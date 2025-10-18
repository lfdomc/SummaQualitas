"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      
      // Forzar refresh completo después del logout manual
      setTimeout(() => {
        window.location.href = '/?reason=manual_logout';
      }, 100);
    } catch (error) {
      // Forzar refresh incluso si hay error
      setTimeout(() => {
        window.location.href = '/?reason=manual_logout';
      }, 100);
    }
  };

  return <Button onClick={logout}>Cerrar sesión</Button>;
}
