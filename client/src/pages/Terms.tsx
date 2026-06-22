import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-3xl">
          <h1 className="text-3xl font-bold text-foreground mb-2">서비스 이용약관</h1>
          <p className="text-sm text-muted-foreground mb-8">시행일: 2025년 1월 1일 (최종 개정: 2026년 6월 22일)</p>

          <div className="prose prose-sm max-w-none text-foreground/90 space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">제1조 (목적)</h2>
              <p className="leading-relaxed">
                본 약관은 주식회사 멀티테크니션스(이하 "회사")가 운영하는 환기·닥트 시공 매칭 플랫폼 "덕터스(Ductors)"(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">제2조 (정의)</h2>
              <div className="space-y-2 leading-relaxed">
                <p>① "서비스"란 회사가 제공하는 환기·닥트 시공 관련 견적 의뢰, 파트너 매칭, 환기설계 계산 등의 온라인 플랫폼 서비스를 말합니다.</p>
                <p>② "이용자"란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.</p>
                <p>③ "회원"이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사의 서비스를 이용할 수 있는 자를 말합니다.</p>
                <p>④ "파트너"란 회원 중 시공업체로 등록하여 견적 제출 등 파트너 서비스를 이용하는 사업자를 말합니다.</p>
                <p>⑤ "고객"이란 회원 중 견적 의뢰 등 시공 서비스를 요청하는 자를 말합니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">제3조 (약관의 효력 및 변경)</h2>
              <div className="space-y-2 leading-relaxed">
                <p>① 본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</p>
                <p>② 회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있으며, 변경된 약관은 적용일자 7일 전부터 서비스 내에 공지합니다.</p>
                <p>③ 이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 회원 탈퇴를 할 수 있습니다. 변경된 약관의 효력 발생일 이후에도 서비스를 계속 이용하는 경우 약관 변경에 동의한 것으로 간주합니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">제4조 (회원가입)</h2>
              <div className="space-y-2 leading-relaxed">
                <p>① 이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 본 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.</p>
                <p>② 회사는 다음 각 호에 해당하는 신청에 대하여 회원가입을 승낙하지 않을 수 있습니다.</p>
                <p className="pl-4">1. 가입 신청자가 본 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우</p>
                <p className="pl-4">2. 실명이 아니거나 타인의 명의를 이용한 경우</p>
                <p className="pl-4">3. 허위의 정보를 기재하거나, 회사가 제시하는 내용을 기재하지 않은 경우</p>
                <p className="pl-4">4. 기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">제5조 (서비스의 제공)</h2>
              <div className="space-y-2 leading-relaxed">
                <p>① 회사는 다음과 같은 서비스를 제공합니다.</p>
                <p className="pl-4">1. 환기·닥트 시공 견적 의뢰 및 매칭 서비스</p>
                <p className="pl-4">2. 시공업체(파트너) 검색 및 정보 제공 서비스</p>
                <p className="pl-4">3. 환기설계 계산기 서비스</p>
                <p className="pl-4">4. 파트너 대시보드 및 현장 관리 서비스</p>
                <p className="pl-4">5. 열람권, 구독권 등 유료 서비스</p>
                <p className="pl-4">6. 기타 회사가 추가 개발하거나 제휴를 통해 제공하는 서비스</p>
                <p>② 회사는 서비스의 품질 향상을 위해 서비스의 내용을 변경할 수 있으며, 이 경우 변경된 서비스의 내용 및 제공일자를 명시하여 공지합니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">제6조 (서비스의 중단)</h2>
              <div className="space-y-2 leading-relaxed">
                <p>① 회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.</p>
                <p>② 회사는 제1항의 사유로 서비스의 제공이 일시적으로 중단됨으로 인하여 이용자 또는 제3자가 입은 손해에 대하여 배상합니다. 단, 회사에 고의 또는 과실이 없는 경우에는 그러하지 아니합니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">제7조 (파트너 서비스)</h2>
              <div className="space-y-2 leading-relaxed">
                <p>① 파트너 회원가입은 별도의 파트너 가입 신청 절차를 통해 이루어지며, 회사의 승인을 받아야 합니다.</p>
                <p>② 파트너는 견적 리드 열람을 위해 토큰을 충전하거나 구독 서비스에 가입해야 합니다.</p>
                <p>③ 파트너의 등급은 시공 완료 건수와 고객 평점에 따라 자동으로 산정되며, 회사는 필요 시 등급을 조정할 수 있습니다.</p>
                <p>④ 파트너가 제공하는 견적, 시공 정보 등의 정확성에 대한 책임은 해당 파트너에게 있으며, 회사는 이에 대해 보증하지 않습니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">제8조 (유료 서비스 및 결제)</h2>
              <div className="space-y-2 leading-relaxed">
                <p>① 회사가 제공하는 유료 서비스의 이용요금 및 결제방법은 서비스 내에 별도로 고지합니다.</p>
                <p>② 회사는 다음 각 호의 사이버머니 및 혜택을 운영합니다.</p>
                <p className="pl-4">1. <strong>토큰</strong>: 이용자가 직접 충전하는 유상 사이버머니로, 견적 열람 등 유료 서비스 이용에 사용됩니다.</p>
                <p className="pl-4">2. <strong>포인트</strong>: 회사가 이벤트·프로모션 등을 통해 무상으로 지급하는 혜택으로, 유효기간이 있으며 현금으로 전환·환불되지 않습니다.</p>
                <p>③ 유료 결제는 신용카드, 계좌이체, 간편결제 등 전자지급결제대행(PG)사를 통해 처리되며, 결제 관련 사항은 해당 결제수단의 약관 및 정책을 따릅니다.</p>
                <p>④ 충전한 토큰의 환불은 다음 기준에 따릅니다.</p>
                <p className="pl-4">1. 미사용 토큰은 환불을 신청할 수 있으며, 회사는 관련 법령에 따라 환불 처리합니다. 다만 결제 수수료 등 실비가 공제될 수 있습니다.</p>
                <p className="pl-4">2. 이미 사용한 토큰(견적 열람 등 서비스가 제공 완료된 건)은 환불되지 않습니다.</p>
                <p className="pl-4">3. 무상으로 지급된 포인트는 환불 대상이 아니며, 유효기간 경과 또는 회원 탈퇴 시 소멸합니다.</p>
                <p className="pl-4">4. 환불은 원칙적으로 원결제수단으로 처리되며, 불가한 경우 이용자가 지정한 계좌로 환불됩니다.</p>
                <p>⑤ 구독 서비스는 결제일로부터 7일 이내 미사용 시 전액 환불이 가능하며, 사용 후에는 잔여 기간에 대한 일할 계산으로 환불합니다.</p>
                <p>⑥ 부정한 목적으로 토큰을 충전·이용한 사실이 확인되는 경우, 회사는 환급을 보류하고 이용자에게 소명을 요청할 수 있습니다.</p>
                <p>⑦ <strong>청약철회</strong>: 이용자는 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조에 따라 토큰·구독 등 유료 결제일로부터 <strong>7일 이내</strong> 청약철회를 할 수 있습니다. 다만, 결제 후 토큰을 일부라도 사용(견적 열람 등)한 경우 등 관련 법령에서 정한 청약철회 제한 사유에 해당하는 때에는 그 사용분에 대하여 청약철회가 제한될 수 있습니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">제8조의2 (회원 탈퇴 및 이용계약의 해지)</h2>
              <div className="space-y-2 leading-relaxed">
                <p>① 이용자는 언제든지 마이페이지(파트너 회원은 '파트너 정보 관리')를 통해 회원 탈퇴(이용계약 해지)를 신청할 수 있으며, 회사는 관련 법령이 정하는 경우를 제외하고 지체 없이 이를 처리합니다.</p>
                <p>② 다음 각 호에 해당하는 경우 탈퇴 신청이 제한될 수 있습니다.</p>
                <p className="pl-4">1. 진행 중인 견적 또는 거래가 있는 경우 (해당 거래 완료 후 탈퇴 가능)</p>
                <p className="pl-4">2. 분쟁이 진행 중이거나 회사의 제재 조치가 진행 중인 경우</p>
                <p>③ 탈퇴 시 이용자가 보유한 무상 포인트 및 쿠폰 등의 혜택은 즉시 소멸되며, 재가입하더라도 복구되지 않습니다.</p>
                <p>④ 충전한 토큰의 잔액이 있는 경우, 탈퇴 전 환불 절차를 통해 정산하여야 하며, 정산 없이 탈퇴할 경우 잔액은 소멸될 수 있습니다.</p>
                <p>⑤ 탈퇴한 회원의 계정 정보는 복구되지 않으며, 회사는 관계법령(「전자상거래 등에서의 소비자보호에 관한 법률」 등)에 따라 보존 의무가 있는 거래기록, 결제·환불 이력, 부정이용 기록 등은 해당 법령이 정한 기간 동안 분리하여 보관합니다.</p>
                <p>⑥ 회원이 작성한 견적, 후기 등의 게시물은 탈퇴 시 자동으로 삭제되지 않을 수 있으며, 삭제를 원하는 경우 탈퇴 전 회사에 요청하여야 합니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">제9조 (이용자의 의무)</h2>
              <div className="space-y-2 leading-relaxed">
                <p>이용자는 다음 행위를 하여서는 안 됩니다.</p>
                <p className="pl-4">1. 신청 또는 변경 시 허위 내용의 등록</p>
                <p className="pl-4">2. 타인의 정보 도용</p>
                <p className="pl-4">3. 회사가 게시한 정보의 변경</p>
                <p className="pl-4">4. 회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</p>
                <p className="pl-4">5. 회사 및 기타 제3자의 저작권 등 지적재산권에 대한 침해</p>
                <p className="pl-4">6. 회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</p>
                <p className="pl-4">7. 외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</p>
                <p className="pl-4">8. 서비스를 이용하여 얻은 정보를 회사의 사전 승낙 없이 복제, 유통, 조장하거나 상업적으로 이용하는 행위</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">제10조 (회사의 의무)</h2>
              <div className="space-y-2 leading-relaxed">
                <p>① 회사는 관련 법령과 본 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며, 지속적이고 안정적으로 서비스를 제공하기 위하여 최선을 다합니다.</p>
                <p>② 회사는 이용자가 안전하게 서비스를 이용할 수 있도록 개인정보보호를 위한 보안 시스템을 갖추어야 합니다.</p>
                <p>③ 회사는 이용자로부터 제기되는 의견이나 불만이 정당하다고 인정할 경우 적절한 절차를 거쳐 처리하여야 합니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">제11조 (개인정보보호)</h2>
              <p className="leading-relaxed">
                회사는 이용자의 개인정보를 보호하기 위해 「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령이 정하는 바를 준수하며, 별도의 개인정보처리방침을 통해 이용자의 개인정보 보호에 관한 사항을 고지합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">제12조 (면책조항 및 통신판매중개자의 지위)</h2>
              <div className="space-y-2 leading-relaxed">
                <p>① 회사는 「전자상거래 등에서의 소비자보호에 관한 법률」에 따른 <strong>통신판매중개자</strong>로서, 이용자(고객)와 파트너(시공업체) 간의 시공 거래를 중개하는 플랫폼을 제공할 뿐이며, <strong>시공 계약의 당사자가 아닙니다.</strong></p>
                <p>② 시공 계약은 이용자와 파트너 간에 직접 체결되며, 시공의 이행, 품질, 하자보수, 대금 지급, 일정 등 거래에 관한 책임은 거래 당사자에게 있습니다. 회사는 통신판매중개자로서 거래 당사자가 아니므로 이로 인해 발생하는 분쟁에 대해 책임을 지지 않습니다. 다만, 회사는 원활한 분쟁 해결을 위해 합리적인 노력을 기울입니다.</p>
                <p>③ 회사는 파트너가 등록한 정보(견적, 시공 내용, 사업자 정보 등)의 정확성, 신뢰성, 적법성을 보증하지 않으며, 해당 정보에 대한 책임은 이를 등록한 파트너에게 있습니다.</p>
                <p>④ 회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력적인 사유로 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</p>
                <p>⑤ 회사는 이용자가 서비스를 이용하여 기대하는 수익을 얻지 못하거나 상실한 것에 대하여 책임을 지지 않습니다.</p>
                <p>⑥ 회사는 이용자가 서비스에 게재한 정보, 자료, 사실의 신뢰도, 정확성 등에 대해서는 책임을 지지 않습니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">제12조의2 (거래 진행 및 이용후기)</h2>
              <div className="space-y-2 text-muted-foreground leading-relaxed">
                <p>① 서비스 내에서 제공되는 파트너 선정, 시공 진행·완료 등의 상태 표시는 거래 당사자의 입력에 따른 기록일 뿐이며, 실제 시공 계약의 체결·이행 및 그 책임은 제12조에 따라 이용자와 파트너 간에 있습니다.</p>
                <p>② 이용후기(리뷰)는 해당 파트너와의 거래를 완료한 이용자에 한하여 작성할 수 있으며, 후기의 내용에 대한 책임은 작성한 이용자에게 있습니다.</p>
                <p>③ 회사는 허위·비방·광고 등 관련 법령이나 운영정책에 위반되는 후기에 대해 사전 통지 없이 비공개 또는 삭제 조치를 할 수 있습니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">제13조 (분쟁해결)</h2>
              <div className="space-y-2 leading-relaxed">
                <p>① 회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상처리하기 위하여 고객센터를 운영합니다.</p>
                <p>② 본 약관에서 정하지 아니한 사항과 본 약관의 해석에 관하여는 「전자상거래 등에서의 소비자보호에 관한 법률」, 「약관의 규제에 관한 법률」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령에 따릅니다.</p>
                <p>③ 서비스 이용으로 발생한 분쟁에 대해 소송이 제기되는 경우, 회사의 본사 소재지를 관할하는 법원을 전속적 합의관할 법원으로 합니다.</p>
              </div>
            </section>

            <section className="bg-muted/50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">부칙</h2>
              <p className="leading-relaxed text-sm">본 약관은 2025년 1월 1일부터 시행되며, 2026년 6월 22일 개정되었습니다.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
