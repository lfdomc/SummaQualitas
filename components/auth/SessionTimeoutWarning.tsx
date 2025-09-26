'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, Clock } from 'lucide-react';

interface SessionTimeoutWarningProps {
  isOpen: boolean;
  onExtend: () => void;
  onLogout: () => void;
  warningMinutes: number;
}

export function SessionTimeoutWarning({
  isOpen,
  onExtend,
  onLogout,
  warningMinutes
}: SessionTimeoutWarningProps) {
  const [countdown, setCountdown] = useState(warningMinutes * 60);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(warningMinutes * 60);
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, warningMinutes, onLogout]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Sesión por Expirar
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <p>
              Tu sesión expirará por inactividad en:
            </p>
            <div className="flex items-center justify-center gap-2 text-2xl font-mono font-bold text-red-600">
              <Clock className="h-6 w-6" />
              {formatTime(countdown)}
            </div>
            <p className="text-sm text-muted-foreground">
              ¿Deseas continuar trabajando?
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onLogout}
            className="w-full sm:w-auto"
          >
            Cerrar Sesión
          </Button>
          <Button
            onClick={onExtend}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
          >
            Continuar Trabajando
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}