import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-3xl">
          <h1 className="text-3xl font-bold text-foreground mb-2">개인정보처리방침</h1>
          <p className="text-sm text-muted-foreground mb-8">시행일: 2025년 1월 1일</p>

          <div className="prose prose-sm max-w-none text-foreground/90 space-y-8">
            <section className="bg-muted/50 rounded-xl p-6">
              <p className="leading-relaxed text-sm">
                주식회사 멀티테크니션스(이하 "회사")는 환기·닥트 시공 매칭 플랫폼 "덕터스(Ductors)"를 운영하며, 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">제1조 (개인정보의 처리 목적)</h2>
              <p className="leading-relaxed mb-3">회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
              <div className="space-y-2 leading-relaxed">
                <p><strong>① 회원 가입 및 관리:</strong> 회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지, 각종 고지·통지 목적으로 개인정보를 처리합니다.</p>
                <p><strong>② 서비스 제공:</strong> 견적 의뢰 및 매칭 서비스 제공, 파트너 검색 및 정보 제공, 환기설계 계산 서비스, 콘텐츠 제공, 맞춤 서비스 제공 목적으로 개인정보를 처리합니다.</p>
                <p><strong>③ 파트너 서비스:</strong> 파트너 가입 심사, 사업자 정보 확인, 견적 리드 제공, 열람권·구독권 관리, 등급 산정 목적으로 개인정보를 처리합니다.</p>
                <p><strong>④ 마케팅 및 광고:</strong> 이벤트 및 광고성 정보 제공, 서비스 이용 통계 분석 목적으로 개인정보를 처리합니다. (선택 동의 항목)</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">제2조 (개인정보의 처리 및 보유 기간)</h2>
              <p className="leading-relaxed mb-3">회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-semibold">처리 목적</th>
                      <th className="text-left py-2 px-3 font-semibold">보유 기간</th>
                      <th className="text-left py-2 px-3 font-semibold">근거 법령</th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground/80">
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-3">회원 가입 및 관리</td>
                      <td className="py-2 px-3">회원 탈퇴 시까지</td>
                      <td className="py-2 px-3">개인정보 보호법</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-3">계약 또는 청약철회 등에 관한 기록</td>
                      <td className="py-2 px-3">5년</td>
                      <td className="py-2 px-3">전자상거래법 제6조</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-3">대금결제 및 재화 등의 공급에 관한 기록</td>
                      <td className="py-2 px-3">5년</td>
                      <td className="py-2 px-3">전자상거래법 제6조</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-3">소비자의 불만 또는 분쟁처리에 관한 기록</td>
                      <td className="py-2 px-3">3년</td>
                      <td className="py-2 px-3">전자상거래법 제6조</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-3">웹사이트 방문 기록</td>
                      <td className="py-2 px-3">3개월</td>
                      <td className="py-2 px-3">통신비밀보호법 제15조의2</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">제3조 (처리하는 개인정보의 항목)</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-2">① 회원 가입 시 (필수)</h3>
                  <p className="leading-relaxed bg-muted/30 rounded-lg p-3 text-sm">이름, 이메일 주소, 소셜 로그인 식별정보(카카오/네이버/구글 고유 ID), 프로필 이미지</p>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-2">② 파트너 가입 시 (필수)</h3>
                  <p className="leading-relaxed bg-muted/30 rounded-lg p-3 text-sm">회사명, 사업자등록번호, 대표자명, 연락처, 이메일, 사업장 주소, 서비스 가능 지역, 전문 분야</p>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-2">③ 견적 의뢰 시</h3>
                  <p className="leading-relaxed bg-muted/30 rounded-lg p-3 text-sm">시공 주소, 시공 관련 상세 정보(카테고리별 동적 폼 응답), 첨부 파일</p>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-2">④ 서비스 이용 과정에서 자동 수집</h3>
                  <p className="leading-relaxed bg-muted/30 rounded-lg p-3 text-sm">IP 주소, 쿠키, 서비스 이용 기록, 접속 로그, 접속 일시</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">제4조 (개인정보의 제3자 제공)</h2>
              <div className="space-y-2 leading-relaxed">
                <p>① 회사는 정보주체의 개인정보를 제1조에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 「개인정보 보호법」 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.</p>
                <p>② 고객이 견적을 의뢰하고 파트너가 해당 견적을 열람하는 경우, 견적 내용(시공 주소, 상세 정보 등)이 해당 파트너에게 제공됩니다. 이는 서비스 제공을 위해 필수적인 사항이며, 회원가입 시 이에 대한 동의를 받습니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">제5조 (개인정보처리의 위탁)</h2>
              <div className="space-y-2 leading-relaxed">
                <p>① 회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 font-semibold">위탁받는 자</th>
                        <th className="text-left py-2 px-3 font-semibold">위탁 업무</th>
                      </tr>
                    </thead>
                    <tbody className="text-foreground/80">
                      <tr className="border-b border-border/50">
                        <td className="py-2 px-3">클라우드 서비스 제공업체</td>
                        <td className="py-2 px-3">데이터 저장 및 서버 운영</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 px-3">결제 대행 서비스</td>
                        <td className="py-2 px-3">유료 서비스 결제 처리</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p>② 위탁계약 시 개인정보가 안전하게 관리될 수 있도록 필요한 사항을 규정하고 있습니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">제6조 (정보주체의 권리·의무 및 행사방법)</h2>
              <div className="space-y-2 leading-relaxed">
                <p>① 정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.</p>
                <p className="pl-4">1. 개인정보 열람 요구</p>
                <p className="pl-4">2. 오류 등이 있을 경우 정정 요구</p>
                <p className="pl-4">3. 삭제 요구</p>
                <p className="pl-4">4. 처리정지 요구</p>
                <p>② 제1항에 따른 권리 행사는 회사에 대해 서면, 전자우편 등을 통하여 하실 수 있으며, 회사는 이에 대해 지체 없이 조치하겠습니다.</p>
                <p>③ 정보주체가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한 경우에는 회사는 정정 또는 삭제를 완료할 때까지 당해 개인정보를 이용하거나 제공하지 않습니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">제7조 (개인정보의 파기)</h2>
              <div className="space-y-2 leading-relaxed">
                <p>① 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.</p>
                <p>② 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다.</p>
                <p>③ 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">제8조 (개인정보의 안전성 확보 조치)</h2>
              <p className="leading-relaxed mb-3">회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
              <div className="space-y-2 leading-relaxed">
                <p className="pl-4">1. <strong>관리적 조치:</strong> 내부관리계획 수립·시행, 개인정보 취급 직원의 최소화 및 교육</p>
                <p className="pl-4">2. <strong>기술적 조치:</strong> 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치</p>
                <p className="pl-4">3. <strong>물리적 조치:</strong> 전산실, 자료보관실 등의 접근통제</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">제9조 (쿠키의 설치·운영 및 거부)</h2>
              <div className="space-y-2 leading-relaxed">
                <p>① 회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용 정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다.</p>
                <p>② 쿠키는 웹사이트를 운영하는데 이용되는 서버가 이용자의 컴퓨터 브라우저에게 보내는 소량의 정보이며 이용자의 PC 컴퓨터 내의 하드디스크에 저장되기도 합니다.</p>
                <p>③ 이용자는 쿠키 설치에 대한 선택권을 가지고 있습니다. 웹브라우저의 옵션을 설정함으로써 모든 쿠키를 허용하거나, 쿠키가 저장될 때마다 확인을 거치거나, 아니면 모든 쿠키의 저장을 거부할 수 있습니다.</p>
                <p>④ 다만, 쿠키의 저장을 거부할 경우에는 로그인이 필요한 일부 서비스는 이용에 어려움이 있을 수 있습니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">제10조 (개인정보 보호책임자)</h2>
              <div className="leading-relaxed">
                <p className="mb-3">회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
                <div className="bg-muted/30 rounded-lg p-4 text-sm space-y-1">
                  <p><strong>개인정보 보호책임자</strong></p>
                  <p>이메일: privacy@ductors.co.kr</p>
                  <p>전화: 1588-0000</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">제11조 (권익침해 구제방법)</h2>
              <p className="leading-relaxed mb-3">정보주체는 개인정보침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회, 한국인터넷진흥원 개인정보침해신고센터 등에 분쟁해결이나 상담 등을 신청할 수 있습니다.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-semibold">기관</th>
                      <th className="text-left py-2 px-3 font-semibold">연락처</th>
                      <th className="text-left py-2 px-3 font-semibold">웹사이트</th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground/80">
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-3">개인정보분쟁조정위원회</td>
                      <td className="py-2 px-3">1833-6972</td>
                      <td className="py-2 px-3">www.kopico.go.kr</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-3">개인정보침해신고센터</td>
                      <td className="py-2 px-3">118</td>
                      <td className="py-2 px-3">privacy.kisa.or.kr</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-3">대검찰청 사이버수사과</td>
                      <td className="py-2 px-3">1301</td>
                      <td className="py-2 px-3">www.spo.go.kr</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-3">경찰청 사이버수사국</td>
                      <td className="py-2 px-3">182</td>
                      <td className="py-2 px-3">ecrm.cyber.go.kr</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-muted/50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">부칙</h2>
              <p className="leading-relaxed text-sm">본 개인정보처리방침은 2025년 1월 1일부터 시행됩니다.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
