export const formatDate = (date: Date | string | null | undefined, format: 'yyyy-MM-dd' | 'yyyy년 MM월 dd일' = 'yyyy-MM-dd'): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');

  if (format === 'yyyy년 MM월 dd일') return `${yyyy}년 ${MM}월 ${dd}일`;
  return `${yyyy}-${MM}-${dd}`;
};

export const formatNumber = (num: number): string => num.toLocaleString('ko-KR');

export const formatPrice = (amount: number): string => `${formatNumber(amount)}원`;
