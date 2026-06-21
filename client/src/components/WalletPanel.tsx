/**
 * WalletPanel - 파트너 지갑 화면
 * 토큰/포인트 잔액 + 거래내역
 */
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Gift, Wallet, ArrowUpCircle, ArrowDownCircle, Clock, Info } from "lucide-react";

function formatWon(n: number) {
  return n.toLocaleString("ko-KR");
}

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const TYPE_LABEL: Record<string, string> = {
  charge: "충전",
  deduct: "사용",
  expire: "만료",
  refund: "환불",
};

export default function WalletPanel() {
  const { data: wallet, isLoading } = trpc.partners.wallet.useQuery();
  const { data: transactions = [] } = trpc.partners.walletTransactions.useQuery();

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">불러오는 중...</div>;

  return (
    <div className="space-y-5">
      {/* 잔액 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 총 잔액 */}
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Wallet className="w-4 h-4" />
              <span className="text-sm font-medium">총 보유</span>
            </div>
            <p className="text-2xl font-bold text-primary">{formatWon(wallet?.total ?? 0)}<span className="text-sm font-normal ml-1">원</span></p>
          </CardContent>
        </Card>

        {/* 토큰 */}
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Coins className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium">토큰 (충전)</span>
            </div>
            <p className="text-2xl font-bold">{formatWon(wallet?.tokenBalance ?? 0)}<span className="text-sm font-normal ml-1 text-muted-foreground">원</span></p>
          </CardContent>
        </Card>

        {/* 포인트 */}
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Gift className="w-4 h-4 text-pink-500" />
              <span className="text-sm font-medium">포인트 (프로모션)</span>
            </div>
            <p className="text-2xl font-bold">{formatWon(wallet?.pointBalance ?? 0)}<span className="text-sm font-normal ml-1 text-muted-foreground">원</span></p>
          </CardContent>
        </Card>
      </div>

      {/* 안내 */}
      <div className="flex items-start gap-2 p-3 bg-muted/40 rounded-lg">
        <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          견적 열람 시 <strong>포인트가 먼저 차감</strong>되고, 포인트가 부족하면 토큰이 차감됩니다.
          포인트는 유효기간이 있으며, 토큰 충전은 현재 관리자를 통해 진행됩니다.
        </div>
      </div>

      {/* 거래 내역 */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">거래 내역</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">아직 거래 내역이 없습니다</p>
          ) : (
            <div className="space-y-1">
              {transactions.map((tx: any) => {
                const isPlus = tx.type === "charge" || tx.type === "refund";
                return (
                  <div key={tx.id} className="flex items-center gap-3 py-3 border-b border-border/40 last:border-0">
                    <div className="shrink-0">
                      {isPlus ? (
                        <ArrowUpCircle className="w-5 h-5 text-green-500" />
                      ) : tx.type === "expire" ? (
                        <Clock className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ArrowDownCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{tx.description || TYPE_LABEL[tx.type]}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${tx.currency === "point" ? "text-pink-500 border-pink-200" : "text-amber-600 border-amber-200"}`}>
                          {tx.currency === "point" ? "포인트" : "토큰"}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-semibold ${isPlus ? "text-green-600" : "text-red-500"}`}>
                        {isPlus ? "+" : "-"}{formatWon(tx.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">잔액 {formatWon(tx.balanceAfter)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
