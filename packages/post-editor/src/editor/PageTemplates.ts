/**
 * 목적별 페이지 템플릿 HTML
 * OnboardingWizard에서 선택한 purpose에 따라 에디터에 초기 콘텐츠 삽입
 */

export type TemplatePurpose = 'company' | 'portfolio' | 'blog' | 'shop' | 'other';

export const PAGE_TEMPLATES: Record<TemplatePurpose, string> = {
  company: `<h1>회사 소개</h1>
<p>고객에게 신뢰를 주는 기업, <strong>[회사명]</strong>입니다.</p>

<h2>회사 소개</h2>
<p>[회사명]은(는) [설립연도]년에 설립되어 [업종/분야]에서 꾸준히 성장해 온 기업입니다. 고객의 가치를 최우선으로 생각하며, 혁신적인 솔루션을 제공합니다.</p>
<blockquote><p>"우리의 비전과 미션을 여기에 작성하세요."</p></blockquote>

<h2>서비스 안내</h2>
<table>
  <tr><th>서비스</th><th>설명</th><th>특징</th></tr>
  <tr><td>서비스 1</td><td>서비스에 대한 간략한 설명</td><td>핵심 장점</td></tr>
  <tr><td>서비스 2</td><td>서비스에 대한 간략한 설명</td><td>핵심 장점</td></tr>
  <tr><td>서비스 3</td><td>서비스에 대한 간략한 설명</td><td>핵심 장점</td></tr>
</table>

<h2>팀 소개</h2>
<table>
  <tr><th>이름</th><th>직책</th><th>담당 업무</th></tr>
  <tr><td>홍길동</td><td>대표이사</td><td>경영 총괄</td></tr>
  <tr><td>김철수</td><td>이사</td><td>사업 개발</td></tr>
  <tr><td>이영희</td><td>팀장</td><td>기술 개발</td></tr>
</table>

<h2>연락처</h2>
<p><strong>전화:</strong> 02-0000-0000</p>
<p><strong>이메일:</strong> info@company.com</p>
<p><strong>주소:</strong> 서울시 강남구 테헤란로 00길 00</p>
<p><strong>영업시간:</strong> 평일 09:00 ~ 18:00</p>

<hr/>
<p style="text-align:center"><em>Copyright &copy; [회사명]. All rights reserved.</em></p>`,

  portfolio: `<h1>포트폴리오</h1>
<p><strong>[이름]</strong> | [직업/전문 분야]</p>

<h2>프로필</h2>
<p>[자신을 소개하는 짧은 문장을 작성하세요. 경력, 전문성, 관심 분야 등을 포함할 수 있습니다.]</p>
<ul>
  <li><strong>경력:</strong> [N]년</li>
  <li><strong>전문 분야:</strong> [분야1], [분야2], [분야3]</li>
  <li><strong>학력:</strong> [대학교] [전공] 졸업</li>
</ul>

<h2>주요 작업물</h2>

<h3>프로젝트 1 — [프로젝트명]</h3>
<p><strong>기간:</strong> 2024.01 ~ 2024.06</p>
<p><strong>역할:</strong> [담당 역할]</p>
<p>[프로젝트 설명 — 어떤 문제를 해결했는지, 어떤 결과를 냈는지 작성하세요.]</p>

<h3>프로젝트 2 — [프로젝트명]</h3>
<p><strong>기간:</strong> 2023.07 ~ 2023.12</p>
<p><strong>역할:</strong> [담당 역할]</p>
<p>[프로젝트 설명을 작성하세요.]</p>

<h2>이력 / 경력</h2>
<table>
  <tr><th>기간</th><th>회사/기관</th><th>직책</th><th>업무 내용</th></tr>
  <tr><td>2022 ~ 현재</td><td>[회사명]</td><td>[직책]</td><td>[주요 업무]</td></tr>
  <tr><td>2020 ~ 2022</td><td>[회사명]</td><td>[직책]</td><td>[주요 업무]</td></tr>
</table>

<h2>수상 및 자격</h2>
<ul>
  <li>[자격증/수상명] — [발급기관] ([취득연도])</li>
  <li>[자격증/수상명] — [발급기관] ([취득연도])</li>
</ul>

<h2>연락처</h2>
<p><strong>이메일:</strong> your@email.com</p>
<p><strong>전화:</strong> 010-0000-0000</p>
<p><strong>포트폴리오 링크:</strong> <a href="#">behance.net/yourname</a></p>`,

  blog: `<h1>블로그</h1>
<p><em>생각과 경험을 기록합니다.</em></p>

<h2>최신 글</h2>

<h3>[첫 번째 글 제목을 입력하세요]</h3>
<p><em>2024년 1월 15일</em></p>
<p>[블로그의 첫 번째 글을 작성하세요. 자유롭게 주제를 선택하고 여러분의 이야기를 나눠보세요. 글은 나중에 언제든 수정할 수 있습니다.]</p>
<hr/>

<h3>[두 번째 글 제목]</h3>
<p><em>2024년 1월 10일</em></p>
<p>[두 번째 글의 내용을 작성하세요.]</p>
<hr/>

<h2>카테고리</h2>
<ul>
  <li><strong>일상</strong> — 일상적인 이야기</li>
  <li><strong>기술</strong> — 기술 관련 글</li>
  <li><strong>리뷰</strong> — 제품/서비스 리뷰</li>
  <li><strong>여행</strong> — 여행 기록</li>
</ul>

<h2>소개</h2>
<p>[블로거 소개를 작성하세요. 어떤 주제에 관심이 있는지, 왜 블로그를 시작했는지 등을 적어보세요.]</p>

<h2>구독 및 연락</h2>
<p>새 글이 올라오면 알림을 받고 싶다면 팔로우해 주세요!</p>
<p><strong>이메일:</strong> blog@example.com</p>`,

  shop: `<h1>상품 목록</h1>
<p><strong>[쇼핑몰명]</strong> — [슬로건 또는 한 줄 소개]</p>

<h2>인기 상품</h2>
<table>
  <tr><th>상품명</th><th>가격</th><th>설명</th></tr>
  <tr><td>[상품 1]</td><td>[가격]원</td><td>[간단한 상품 설명]</td></tr>
  <tr><td>[상품 2]</td><td>[가격]원</td><td>[간단한 상품 설명]</td></tr>
  <tr><td>[상품 3]</td><td>[가격]원</td><td>[간단한 상품 설명]</td></tr>
</table>

<h2>카테고리</h2>
<ul>
  <li><strong>카테고리 1</strong> — [설명]</li>
  <li><strong>카테고리 2</strong> — [설명]</li>
  <li><strong>카테고리 3</strong> — [설명]</li>
</ul>

<h2>배송 안내</h2>
<ul>
  <li><strong>배송비:</strong> 3,000원 (50,000원 이상 구매 시 무료배송)</li>
  <li><strong>배송 기간:</strong> 주문 후 1~3일 이내</li>
  <li><strong>교환/반품:</strong> 수령 후 7일 이내 가능</li>
</ul>

<h2>문의하기</h2>
<p><strong>고객센터:</strong> 1588-0000 (평일 09:00~18:00)</p>
<p><strong>카카오톡:</strong> @[쇼핑몰명]</p>
<p><strong>이메일:</strong> shop@example.com</p>

<hr/>
<p style="text-align:center"><em>사업자등록번호: 000-00-00000 | 통신판매업 신고번호: 제0000-서울강남-0000호</em></p>`,

  other: `<h1>내 페이지</h1>
<p>자유롭게 페이지를 구성해 보세요.</p>

<h2>섹션 1</h2>
<p>[이 영역에 원하는 내용을 작성하세요. 텍스트, 이미지, 표, 링크 등을 자유롭게 넣을 수 있습니다.]</p>

<h2>섹션 2</h2>
<p>[두 번째 섹션의 내용을 작성하세요.]</p>

<h2>섹션 3</h2>
<p>[세 번째 섹션의 내용을 작성하세요.]</p>

<h2>연락처</h2>
<p><strong>이메일:</strong> your@email.com</p>
<p><strong>전화:</strong> 010-0000-0000</p>`,
};

/**
 * 사업자 정보를 템플릿에 반영
 */
export function applyBusinessInfo(
  templateHtml: string,
  info: {
    companyName?: string;
    ceoName?: string;
    contact?: string;
    businessNumber?: string;
  },
): string {
  let html = templateHtml;

  if (info.companyName) {
    html = html.replace(/\[회사명\]/g, info.companyName);
    html = html.replace(/\[쇼핑몰명\]/g, info.companyName);
    html = html.replace(/\[이름\]/g, info.companyName);
  }
  if (info.ceoName) {
    html = html.replace(/홍길동/g, info.ceoName);
  }
  if (info.contact) {
    html = html.replace(/02-0000-0000/g, info.contact);
    html = html.replace(/010-0000-0000/g, info.contact);
  }
  if (info.businessNumber) {
    html = html.replace(/000-00-00000/g, info.businessNumber);
  }

  return html;
}

/**
 * localStorage에서 온보딩 템플릿 데이터 읽기 + 소비(1회성)
 */
export function consumePendingTemplate(): string | null {
  if (typeof window === 'undefined') return null;

  const purpose = localStorage.getItem('pagedle_onboarding_purpose') as TemplatePurpose | null;
  const bizInfoRaw = localStorage.getItem('pagedle_onboarding_bizinfo');

  if (!purpose || !PAGE_TEMPLATES[purpose]) return null;

  // 소비 — 다음 페이지 생성 시 다시 적용되지 않도록
  localStorage.removeItem('pagedle_onboarding_purpose');
  localStorage.removeItem('pagedle_onboarding_bizinfo');

  let html = PAGE_TEMPLATES[purpose];

  if (bizInfoRaw) {
    try {
      const bizInfo = JSON.parse(bizInfoRaw);
      html = applyBusinessInfo(html, bizInfo);
    } catch {
      // ignore parse error
    }
  }

  return html;
}
