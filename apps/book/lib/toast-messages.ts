/**
 * 서버 액션이 `redirect('/?toast=코드')`로 보낼 때 쓰는 코드와, 화면에 뜨는 문구의 표.
 * 새 알림이 필요하면 여기에 한 줄 추가한다. (Toast 컴포넌트는 @me/ui/toast)
 */
export const TOAST_MESSAGES: Record<string, string> = {
  rated: '평점을 남겼어요',
  deleted: '삭제했어요',
  recommended: '책을 추천했어요',
  selected: '이번 달 책을 정했어요',
  saved: '저장했어요',
};
