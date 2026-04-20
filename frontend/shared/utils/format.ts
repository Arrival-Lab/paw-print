export const formatDate = (date: Date | string, format: 'yyyy-MM-dd' | 'yyyy년 MM월 dd일' = 'yyyy-MM-dd'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const yyyy = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');

  if (format === 'yyyy년 MM월 dd일') return `${yyyy}년 ${MM}월 ${dd}일`;
  return `${yyyy}-${MM}-${dd}`;
};

export const formatNumber = (num: number): string => num.toLocaleString('ko-KR');

export const formatPrice = (amount: number): string => `${formatNumber(amount)}원`;
