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
  '#7a1f24': 'أحمر خمري', '#1f3a5f': 'كحلي', '#5b4636': 'بني', '#b5442f': 'طابوگي', '#2e5e6e': 'فيروزي غامق',
  '#c8902e': 'خردلي', '#2b2b2b': 'فحمي', '#8fa3a8': 'رمادي مزرق', '#c9a27a': 'جملي فاتح', '#a3a18a': 'زيتي فاتح',
  '#3f5e45': 'أخضر غامق', '#4a5a3a': 'زيتوني', '#a3312a': 'أحمر', '#d8a7a7': 'وردي', '#9ecbd9': 'سمائي',
  '#f2c6a0': 'مشمشي', '#c9b8e0': 'ليلكي', '#1f5e4a': 'أخضر زمردي', '#b7c4cf': 'رمادي سمائي', '#9db8a0': 'أخضر فاتح',
  '#8a8f96': 'رصاصي', '#c4a484': 'جملي', '#f2efe9': 'أبيض مطفي',
  '#f1efeb': 'مرمر كرارا أبيض', '#1d1d1f': 'مرمر أسود', '#2f4a3e': 'مرمر أخضر', '#e9d6cc': 'مرمر وردي',
  '#d9c7aa': 'ترافرتين', '#eae4d8': 'بوكليه عاجي', '#a9b5a0': 'أخضر مريمية', '#c9b49a': 'بيج رملي',
  '#6f7a86': 'رمادي أزرق', '#d8d2c6': 'رمادي حجري', '#b9a48a': 'جملي فاتح', '#4f5b4a': 'زيتوني غامق',
  '#efe9de': 'عاجي', '#e3c9c0': 'وردي ترابي', '#c9a377': 'بلوط فاتح', '#1b1b1d': 'أسود مطفي', '#7d8a7a': 'أخضر رمادي',
  '#3e4a5a': 'كحلي رمادي',
}
/** Arabic name for any colour: a known name, or one derived from its hue and lightness. */
export function colorName(hex) {
  if (hex === 'natural') return 'الخامة الأصلية'
  const known = COLOR_NAMES[hex?.toLowerCase()]
  if (known) return known
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '')
  if (!m) return hex
  const n = parseInt(m[1], 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const sat = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1))
  if (sat < 0.12) return l > 0.85 ? 'أبيض' : l > 0.6 ? 'رصاصي فاتح' : l > 0.3 ? 'رصاصي' : 'أسود'
  let h = 0
  if (max === r) h = ((g - b) / (max - min)) % 6
  else if (max === g) h = (b - r) / (max - min) + 2
  else h = (r - g) / (max - min) + 4
  h = (h * 60 + 360) % 360
  const base =
    h < 15 || h >= 340 ? 'أحمر' : h < 40 ? (l < 0.45 ? 'بني' : 'برتقالي') : h < 65 ? (l < 0.45 ? 'زيتوني' : 'أصفر')
      : h < 165 ? 'أخضر' : h < 200 ? 'فيروزي' : h < 255 ? 'أزرق' : h < 290 ? 'بنفسجي' : 'وردي'
  const tone = l < 0.3 ? ' غامق' : l > 0.72 ? ' فاتح' : ''
  return base + tone
}
