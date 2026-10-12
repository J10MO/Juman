const nf = new Intl.NumberFormat('ar-IQ')

export const formatPrice = (n) => `${nf.format(n)} د.ع`
export const formatNumber = (n) => nf.format(n)
export const formatDims = ({ w, d, h }) =>
  `${nf.format(Math.round(w * 100))} × ${nf.format(Math.round(d * 100))} × ${nf.format(Math.max(1, Math.round(h * 100)))} سم`

export function timeAgo(date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000
  if (diff < 60) return 'هسه'
  if (diff < 3600) return `قبل ${nf.format(Math.floor(diff / 60))} دقيقة`
  if (diff < 86400) return `قبل ${nf.format(Math.floor(diff / 3600))} ساعة`
  if (diff < 86400 * 2) return 'البارحة'
  return new Date(date).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' })
}

export const COLOR_NAMES = {
  '#3e5c6e': 'أزرق نفطي', '#9c4a2f': 'طابوگي', '#cdbfa6': 'بيج', '#38463a': 'زيتوني',
  '#b0794a': 'جملي', '#d8d0c2': 'رصاصي فاتح', '#5b3a4a': 'خمري', '#8a5a3b': 'جوزي',
  '#c49a6c': 'بلوط', '#3b2a20': 'خشب غامق', '#ece6dc': 'أبيض عاجي', '#2b2b2b': 'أسود',
  '#d9c3a0': 'خشب فاتح', '#2f2f2f': 'فحمي', '#c8a45c': 'ذهبي', '#e8e1d5': 'كريمي',
  '#6d5a4b': 'بني', '#e3dcd2': 'حليبي', '#6b4a33': 'جوز غامق', '#4a3426': 'بني محروگ',
  '#8e2f2a': 'أحمر عنابي', '#2e4a62': 'كحلي', '#7a6a3a': 'زيتي', '#b5643c': 'فخاري',
  '#e9e4dc': 'أبيض', '#f1e6d0': 'كتاني', '#f2efe9': 'أبيض مطفي', '#c9ccd1': 'ستيل', '#f4f2ee': 'أبيض',
  '#e6e1d6': 'بيجي', '#d9dde3': 'رمادي فاتح', '#cfa77a': 'جوزي فاتح', '#2f6db5': 'أزرق علاء الدين',
}
export const colorName = (hex) => (hex === 'natural' ? 'الخامة الأصلية' : COLOR_NAMES[hex?.toLowerCase()] || hex)
