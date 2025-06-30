
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Key } from 'lucide-react';
import { PasswordChangeDialog } from './PasswordChangeDialog';

interface AdminHeaderProps {
  onLogout: () => void;
}

export const AdminHeader = ({ onLogout }: AdminHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="hebrew-title text-3xl font-bold text-primary">
        ממשק ניהול האתר
      </h1>
      <div className="flex gap-4">
        <PasswordChangeDialog />
        <Button variant="outline" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          התנתק
        </Button>
      </div>
    </div>
  );
};
