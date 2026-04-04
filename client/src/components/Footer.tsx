import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-foreground/[0.03] border-t border-border/50">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-xs">D</span>
              </div>
              <span className="text-base font-bold text-foreground">덕터스</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              환기·닥트 시공이 필요한 고객과<br />
              전문 시공업체를 연결하는 플랫폼
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">서비스</h4>
            <div className="flex flex-col gap-2">
              <Link href="/quote-request" className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline">견적의뢰</Link>
              <Link href="/find-partner" className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline">파트너찾기</Link>
              <Link href="/ventilation" className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline">환기설계</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">파트너스</h4>
            <div className="flex flex-col gap-2">
              <Link href="/partners-info" className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline">파트너스 안내</Link>
              <Link href="/partner-register" className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline">파트너 가입</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">고객지원</h4>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">이메일: support@ductors.co.kr</span>
              <span className="text-sm text-muted-foreground">전화: 1588-0000</span>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline">이용약관</Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline">개인정보처리방침</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-border/50 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} 덕터스. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors no-underline">이용약관</Link>
            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors no-underline">개인정보처리방침</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
