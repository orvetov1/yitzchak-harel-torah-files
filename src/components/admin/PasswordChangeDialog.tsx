
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Key } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { toast } from 'sonner';

export const PasswordChangeDialog = () => {
  const { changePassword } = useAdmin();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('הסיסמאות החדשות אינן תואמות');
      return;
    }

    setIsChangingPassword(true);
    const result = await changePassword(currentPassword, newPassword);
    
    if (result.success) {
      toast.success('הסיסמה שונתה בהצלחה');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error(result.error || 'שגיאה בשינוי הסיסמה');
    }
    
    setIsChangingPassword(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Key className="mr-2 h-4 w-4" />
          שנה סיסמה
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="hebrew-title">שינוי סיסמה</DialogTitle>
        </DialogHeader>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <Label htmlFor="current-password" className="hebrew-text">סיסמה נוכחית</Label>
            <Input
              id="current-password"
              name="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div>
            <Label htmlFor="new-password" className="hebrew-text">סיסמה חדשה</Label>
            <Input
              id="new-password"
              name="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label htmlFor="confirm-password" className="hebrew-text">אימות סיסמה חדשה</Label>
            <Input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" disabled={isChangingPassword} className="w-full hebrew-text">
            {isChangingPassword ? 'משנה...' : 'עדכן סיסמה'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
