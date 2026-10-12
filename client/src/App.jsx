import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Footer, MobileTabs, Navbar } from './components/Navbar.jsx'
import { Loading } from './components/States.jsx'
import { useAuth } from './lib/auth.jsx'
import Home from './pages/Home.jsx'
import Catalog from './pages/Catalog.jsx'
import Product from './pages/Product.jsx'
import { Login, Register } from './pages/Auth.jsx'
import Designs from './pages/Designs.jsx'
import NotFound from './pages/NotFound.jsx'
import Cart from './pages/Cart.jsx'

const Studio = lazy(() => import('./studio/StudioPage.jsx'))

function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) return el.scrollIntoView({ behavior: 'smooth' })
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

function RequireAuth({ children }) {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) return <Loading />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

export default function App() {
  const { pathname } = useLocation()
  const isStudio = pathname.startsWith('/studio')
  return (
    <>
      <ScrollManager />
      <Navbar />
      <main>
        <Suspense fallback={<Loading label="دا نفتح الاستوديو..." />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/product/:slug" element={<Product />} />
            <Route path="/studio" element={<Studio />} />
            <Route path="/studio/:id" element={<Studio />} />
            <Route
              path="/designs"
              element={
                <RequireAuth>
                  <Designs />
                </RequireAuth>
              }
            />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!isStudio && <Footer />}
      <MobileTabs />
    </>
  )
}
