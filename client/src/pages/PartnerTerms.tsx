import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PartnerTerms() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-3xl">
          <h1 className="text-2xl font-bold mb-2">파트너 서비스 이용약관</h1>
          <p className="text-sm text-muted-foreground mb-8">시행일: 2025년 1월 1일</p>

          <div className="prose prose-sm max-w-none space-y-8 text-foreground">

            <section>
              <h2 className="text-lg font-semibold mb-3">제1조 (목적)</h2>
              <p className="text-muted-foreground leading-relaxed">
                본 약관은 (주)멀티테크니션스(이하 "회사")가 운영하는 덕터스(Ductors) 플랫폼에서
                파트너(시공업체)로 활동하는 사업자(이하 "파트너")와 회사 간의 권리·의무 및
                서비스 이용에 관한 사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제2조 (정의)</h2>
              <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                <li><strong>"파트너"</strong>란 회사의 심사를 통해 승인된 환기·닥트 시공 사업자를 말합니다.</li>
                <li><strong>"견적 의뢰"</strong>란 고객이 플랫폼을 통해 등록한 시공 견적 요청을 말합니다.</li>
                <li><strong>"열람권"</strong>이란 파트너가 고객 견적 정보를 확인하기 위해 사용하는 유료 이용권을 말합니다.</li>
                <li><strong>"포인트"</strong>란 회사가 프로모션 목적으로 파트너에게 무상 지급하는 사이버머니를 말합니다.</li>
                <li><strong>"토큰"</strong>이란 파트너가 유료로 충전하여 열람에 사용하는 사이버머니를 말합니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제3조 (파트너 가입 및 자격)</h2>
              <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
                <li>파트너 가입 신청 시 사업자등록증을 필수로 제출해야 합니다.</li>
                <li>회사는 제출된 서류를 검토 후 승인 여부를 결정하며, 승인까지 영업일 기준 3~5일이 소요될 수 있습니다.</li>
                <li>아래에 해당하는 경우 파트너 가입이 거절될 수 있습니다.
                  <ul className="mt-2 ml-4 space-y-1 list-disc list-inside">
                    <li>사업자등록증이 유효하지 않은 경우</li>
                    <li>허위 정보를 제출한 경우</li>
                    <li>과거 파트너 자격이 정지·취소된 이력이 있는 경우</li>
                  </ul>
                </li>
                <li>파트너는 사업자 정보 변경 시 30일 이내에 플랫폼에 업데이트해야 합니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제4조 (열람권 및 결제)</h2>
              <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
                <li>파트너는 고객 견적 정보를 열람하기 위해 토큰 또는 포인트를 사용해야 합니다.</li>
                <li>열람 방식은 다음과 같이 구분됩니다.
                  <ul className="mt-2 ml-4 space-y-1 list-disc list-inside">
                    <li><strong>공개 견적 열람:</strong> 고객이 공개로 올린 견적을 열람하는 방식</li>
                    <li><strong>지정 견적 열람:</strong> 고객이 특정 파트너를 지정한 견적을 열람하는 방식 (높은 가격 적용)</li>
                  </ul>
                </li>
                <li>차감 순서: 포인트 잔액 먼저 차감 후 토큰 차감</li>
                <li>열람 후 고객과의 계약 성사 여부와 관계없이 열람권은 환불되지 않습니다.</li>
                <li>포인트는 유효기간이 있으며, 기간 경과 시 자동 소멸됩니다.</li>
                <li>토큰은 회원 탈퇴 시 환불 정책에 따라 처리됩니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제5조 (구독 서비스)</h2>
              <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
                <li>파트너는 월 정액 구독을 통해 견적 열람을 무제한으로 이용할 수 있습니다.</li>
                <li>구독료는 관리자가 설정하며, 변경 시 30일 전에 공지합니다.</li>
                <li>구독 기간 중 해지 시 잔여 기간에 대한 환불은 정책에 따릅니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제6조 (파트너의 의무)</h2>
              <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
                <li>파트너는 고객에게 성실하고 정직한 견적을 제출해야 합니다.</li>
                <li>파트너는 허위 견적, 과다 청구, 시공 포기 등 고객에게 피해를 주는 행위를 해서는 안 됩니다.</li>
                <li>파트너는 고객 정보를 견적 목적 외에 사용하거나 제3자에게 제공해서는 안 됩니다.</li>
                <li>파트너는 관련 법령(건설업법, 소방법 등)을 준수하여 시공을 진행해야 합니다.</li>
                <li>파트너는 시공 완료 후 고객의 리뷰 및 평가에 성실히 응해야 합니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제7조 (금지 행위)</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">다음 행위는 엄격히 금지됩니다.</p>
              <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                <li>경쟁업체 단가 파악을 위한 허위 고객 계정 생성 및 견적 의뢰</li>
                <li>타 파트너에 대한 허위 리뷰 작성</li>
                <li>플랫폼 외부에서 직접 거래하여 수수료를 회피하는 행위</li>
                <li>고객 정보의 무단 수집·유출</li>
                <li>시스템 해킹, 크롤링 등 기술적 침해 행위</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제8조 (파트너 자격 정지 및 취소)</h2>
              <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
                <li>회사는 다음의 경우 파트너 자격을 정지 또는 취소할 수 있습니다.
                  <ul className="mt-2 ml-4 space-y-1 list-disc list-inside">
                    <li>제6조·제7조 위반 시</li>
                    <li>고객 불만이 반복적으로 접수되는 경우</li>
                    <li>사업자 등록이 취소된 경우</li>
                    <li>3개월 이상 서비스를 이용하지 않는 경우</li>
                  </ul>
                </li>
                <li>자격 취소 시 미사용 토큰의 환불은 별도 정책에 따릅니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제9조 (등급 제도)</h2>
              <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
                <li>파트너 등급은 브론즈 → 실버 → 골드 → 플래티넘으로 구분됩니다.</li>
                <li>등급은 수주 실적, 평점, 응답률 등을 기준으로 자동 산정됩니다.</li>
                <li>높은 등급의 파트너는 검색 결과 상위 노출 등 혜택을 받을 수 있습니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제10조 (면책)</h2>
              <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
                <li>회사는 파트너와 고객 간의 시공 계약, 분쟁, 하자에 대해 직접적인 책임을 지지 않습니다.</li>
                <li>파트너는 시공 관련 분쟁 발생 시 자체적으로 해결해야 하며, 회사는 중재 역할에 한합니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제11조 (약관 변경)</h2>
              <p className="text-muted-foreground leading-relaxed">
                회사는 본 약관을 변경할 수 있으며, 변경 시 시행 30일 전에 플랫폼 공지사항 또는
                이메일을 통해 공지합니다. 변경 후에도 서비스를 계속 이용하면 변경된 약관에
                동의한 것으로 간주합니다.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제12조 (준거법 및 관할)</h2>
              <p className="text-muted-foreground leading-relaxed">
                본 약관은 대한민국 법률에 따르며, 분쟁 발생 시 회사 소재지를 관할하는
                법원을 전속 관할 법원으로 합니다.
              </p>
            </section>

            <div className="mt-10 p-4 bg-muted/50 rounded-xl text-xs text-muted-foreground">
              본 약관은 「전자상거래 등에서의 소비자보호에 관한 법률」, 「개인정보 보호법」,
              「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 준수합니다.<br /><br />
              (주)멀티테크니션스 | 사업자등록번호: 000-00-00000 | 대표: 김재유<br />
              주소: 경기도 화성시 | 고객센터: support@ductors.co.kr
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
