import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import Hero from '../components/sections/Hero'
import About from '../components/sections/About'
import Products from '../components/sections/Products'
import Services from '../components/sections/Services'
import Team from '../components/sections/Team'
import Contact from '../components/sections/Contact'

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <About />
      <Products />
      <Services />
      <Team />
      <Contact />
      <Footer />
    </>
  )
}
