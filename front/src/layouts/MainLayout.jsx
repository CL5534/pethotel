import { Outlet } from 'react-router-dom'
import Footer from '../components/Footer.jsx'
import Header from '../components/Header.jsx'
import './MainLayout.css'

function MainLayout() {
  return (
    <>
      <Header />
      <main className="app">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

export default MainLayout
