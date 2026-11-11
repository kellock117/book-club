'use client';

/**
 * 운동 가이드(? 버튼) 시트. 글이 길어서 처음 화면에는 싣지 않고 app-shell에서 next/dynamic으로 늦게 불러온다.
 * 몸 정보(키·몸무게)가 들어 있으니 이 레포는 비공개로 둔다 (docs/NOTES.md).
 */
import { useEffect } from 'react';

export default function HelpSheet({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="box sheet" role="dialog" aria-modal="true" aria-labelledby="help-title">
        <button type="button" className="btn close" onClick={onClose} autoFocus>
          닫기
        </button>
        <h3 id="help-title">운동 가이드</h3>
        <p>
          171cm 62kg이면 체중이 정상 범위이고 이미 근육도 어느 정도 있으니, 근육 증량에 집중하되 아주 약한 칼로리 흑자로 가는 것이 맞습니다. 배는 복근 운동으로 빠지지 않고, 전체 근육량이 늘고 체중이 천천히 오르면
          상대적으로 눈에 덜 띄게 됩니다.
        </p>
        <h4>추천 빈도: 격일로 상체/하체 번갈아 (주 3~4회, 회당 40~50분)</h4>
        <p>
          주 5회까지 늘릴 필요는 없습니다. 맨몸 운동은 한 세션에서 한계까지 밀어붙이기 때문에 근육 회복에 하루 이상 걸립니다. 격일이면 같은 부위를 4일마다 자극하는 셈이라 초·중급자에게 충분하고, 오히려 회복이 잘 돼서
          증량에 유리합니다.
        </p>
        <h4>맨몸으로 근육을 키우는 핵심 원칙</h4>
        <ul>
          <li>세트는 힘들어서 1~2회만 더 할 수 있을 정도까지 합니다. 쉬운 횟수를 채우는 건 효과가 거의 없습니다.</li>
          <li>한 동작이 12~15회 이상 가볍게 된다면 횟수를 늘리지 말고 더 어려운 변형이나 무게로 바꾸세요. 푸시업 → 발 높이기 → 한 팔 변형 같은 식입니다.</li>
          <li>내려가는 동작을 2~3초로 천천히 하면 근육에 부하가 크게 걸립니다.</li>
          <li>세트 사이 휴식은 1.5~2분 정도 충분히 쉬세요.</li>
          <li>당기는 동작(턱걸이/로우)이 부족하면 상체가 한쪽으로 치우치니 꼭 넣으세요.</li>
        </ul>
        <h4>증량을 위한 식단 (가장 중요한 부분)</h4>
        <ul>
          <li>평소 먹던 양에서 하루 200~300kcal 정도만 더 먹어서 체중이 한 달에 0.3~0.5kg 늘도록 조절하세요. 너무 빨리 늘면 지방이 같이 늘어납니다.</li>
          <li>단백질은 체중 1kg당 1.6~2g, 즉 하루 100~125g 정도를 목표로 하세요. 세끼에 나눠서 먹으면 쉽습니다.</li>
          <li>수면은 7시간 이상 챙기세요. 근육은 운동이 아니라 자는 동안 만들어집니다.</li>
          <li>체중은 일주일에 한 번, 같은 조건에서 재고 2~3주 동안 변화가 없으면 먹는 양을 조금 늘리세요.</li>
        </ul>
        <h4>장비</h4>
        <p>철봉(문틀형, 몇 만 원대)과 저항 밴드 하나만 있어도 운동 선택지가 크게 늘어납니다. 특히 당기는 운동은 철봉 유무에 따라 효과 차이가 큽니다.</p>
      </div>
    </div>
  );
}
