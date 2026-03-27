import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { useEffect, useState } from "react";
import { FileText, Clock, CheckCircle2, Loader2, Star, User } from "lucide-react";
import { QUOTE_STATUS_LABELS } from "@shared/constants";

export default function MyPage() {
  const { user, isAuthenticated, loading } = useAuth();

  const { data: myQuotes, isLoading: quotesLoading } = trpc.quotes.myQuotes.useQuery(undefined, { enabled: isAuthenticated });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  if (loading || !isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-4xl">
          {/* Profile */}
          <Card className="border-border/50 shadow-sm mb-6">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{user?.name || "사용자"}</h1>
                <p className="text-sm text-muted-foreground">{user?.email || ""}</p>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="quotes">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="quotes">내 견적 요청</TabsTrigger>
            </TabsList>

            <TabsContent value="quotes" className="mt-4">
              {quotesLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : !myQuotes || myQuotes.length === 0 ? (
                <div className="text-center py-16">
                  <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">아직 견적 요청이 없습니다</p>
                  <Link href="/quote-request"><Button>견적 의뢰하기</Button></Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {myQuotes.map((q) => (
                    <Card key={q.id} className="border-border/50 shadow-sm">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground truncate">{q.title}</h3>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span>{q.region || "미지정"}</span>
                              <span>{new Date(q.createdAt).toLocaleDateString("ko-KR")}</span>
                            </div>
                          </div>
                          <Badge variant={q.status === "completed" ? "default" : "secondary"} className="shrink-0">
                            {QUOTE_STATUS_LABELS[q.status] || q.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
