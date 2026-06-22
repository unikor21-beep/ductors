import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export default function PasswordReminder() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [dismissed, setDismissed] = useState(false);
  const utils = trpc.useUtils();

  const { data } = trpc.auth.passwordReminder.useQuery(undefined, { enabled: isAuthenticated });
  const snooze = trpc.auth.snoozePasswordReminder.useMutation({
    onSuccess: () => { utils.auth.passwordReminder.invalidate(); setDismissed(true); },
  });

  const open = isAuthenticated && data?.remind === true && !dismissed;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && setDismissed(true)}>
      <DialogContent className="max-w-sm text-center">
        <div className="flex flex-col items-center pt-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-3">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-lg font-bold mb-1">비밀번호를 변경할 때가 되었어요</h2>
          <p className="text-sm text-muted-foreground mb-5">
            마지막으로 비밀번호를 바꾼 지 90일이 지났습니다.<br />안전을 위해 변경을 권장합니다.
          </p>
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" disabled={snooze.isPending}
              onClick={() => snooze.mutate()}>
              다음에 바꾸기
            </Button>
            <Button className="flex-1"
              onClick={() => { setDismissed(true); navigate("/change-password"); }}>
              지금 변경
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
