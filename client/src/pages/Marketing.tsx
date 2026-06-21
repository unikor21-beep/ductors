import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Marketing() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-3xl">
          <h1 className="text-2xl font-bold mb-2">마케팅 정보 수신 동의</h1>
          <p className="text-sm text-muted-foreground mb-8">시행일: 2025년 1월 1일</p>

          <div className="prose prose-sm max-w-none space-y-8 text-foreground">

            <section>
              <h2 className="text-lg font-semibold mb-3">1. 수집 항목</h2>
              <p className="text-muted-foreground leading-relaxed">
                (주)멀티테크니션스(이하 "회사")는 마케팅 정보 제공을 위해 아래 항목을 수집합니다.
              </p>
              <ul className="mt-3 space-y-1 text-muted-foreground list-disc list-inside">
                <li>이름(닉네임)</li>
                <li>이메일 주소</li>
                <li>휴대전화 번호</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">2. 이용 목적</h2>
              <p className="text-muted-foreground leading-relaxed">
                수집된 정보는 아래 목적에 한하여 이용됩니다.
              </p>
              <ul className="mt-3 space-y-1 text-muted-foreground list-disc list-inside">
                <li>덕터스(Ductors) 서비스 관련 이벤트 및 프로모션 안내</li>
                <li>신규 서비스·기능 출시 안내</li>
                <li>할인 혜택 및 쿠폰 제공</li>
                <li>업계 동향 및 유용한 정보 뉴스레터 발송</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">3. 수신 채널</h2>
              <ul className="mt-3 space-y-1 text-muted-foreground list-disc list-inside">
                <li>이메일</li>
                <li>문자메시지(SMS/MMS)</li>
                <li>앱 푸시 알림 (서비스 출시 후)</li>
                <li>카카오 알림톡</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">4. 보유 및 이용 기간</h2>
              <p className="text-muted-foreground leading-relaxed">
                마케팅 수신 동의일로부터 회원 탈퇴 또는 동의 철회 시까지 보유·이용합니다.
                단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">5. 동의 거부 권리 및 불이익</h2>
              <p className="text-muted-foreground leading-relaxed">
                마케팅 정보 수신 동의는 선택사항입니다. 동의하지 않으셔도 덕터스 서비스의
                기본 기능(견적 의뢰, 파트너 찾기 등) 이용에는 아무런 제한이 없습니다.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">6. 동의 철회 방법</h2>
              <p className="text-muted-foreground leading-relaxed">
                마케팅 수신 동의는 언제든지 철회할 수 있습니다.
              </p>
              <ul className="mt-3 space-y-1 text-muted-foreground list-disc list-inside">
                <li>마이페이지 → 알림 설정에서 직접 변경</li>
                <li>수신된 이메일 하단의 "수신거부" 링크 클릭</li>
                <li>고객센터 이메일: support@ductors.co.kr</li>
              </ul>
            </section>

            <div className="mt-10 p-4 bg-muted/50 rounded-xl text-xs text-muted-foreground">
              본 동의서는 「개인정보 보호법」 제22조 및 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」
              제50조에 따라 작성되었습니다.<br />
              문의: (주)멀티테크니션스 / support@ductors.co.kr
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
