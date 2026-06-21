import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Send } from "lucide-react";

interface Props {
  quoteId: number;
  partnerId: number;
  myRole: "customer" | "partner"; // 내가 누구인지
  title?: string;
  onClose: () => void;
}

// 의뢰별 채팅방 (quoteId + partnerId로 방 구분)
export default function ChatModal({ quoteId, partnerId, myRole, title, onClose }: Props) {
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // 메시지 목록 (5초마다 자동 새로고침)
  const { data: messages, isLoading } = trpc.chat.messages.useQuery(
    { quoteId, partnerId },
    { refetchInterval: 5000 }
  );
  const utils = trpc.useUtils();

  const send = trpc.chat.send.useMutation({
    onSuccess: () => {
      setText("");
      utils.chat.messages.invalidate({ quoteId, partnerId });
    },
  });

  // 새 메시지 오면 맨 아래로 스크롤
  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    send.mutate({ quoteId, partnerId, message: text.trim() });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md h-[70vh] flex flex-col p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="text-base">{title || "채팅"}</DialogTitle>
        </DialogHeader>

        {/* 메시지 영역 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : !messages || messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              아직 메시지가 없습니다.<br />첫 메시지를 보내 대화를 시작하세요.
            </p>
          ) : (
            messages.map((m: any) => {
              const isMine = m.senderRole === myRole;
              return (
                <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${isMine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                    <p className="whitespace-pre-wrap break-words">{m.message}</p>
                    <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(m.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 입력 영역 */}
        <div className="px-5 py-3 border-t border-border flex gap-2">
          <Input
            placeholder="메시지를 입력하세요"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
          />
          <Button size="icon" onClick={handleSend} disabled={send.isPending || !text.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
