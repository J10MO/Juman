import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container not-found">
      <h1>٤٠٤</h1>
      <h2>الصفحة ماكو</h2>
      <p className="muted">يمكن الرابط غلط، أو الصفحة انشالت. ارجع للرئيسية وكمّل.</p>
      <Link to="/" className="btn">
        ارجع للرئيسية
      </Link>
    </div>
  )
}
