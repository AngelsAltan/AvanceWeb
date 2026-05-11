import Hero from "../components/Hero";
import Services from "../components/Services";
import Cobertura from "../components/Cobertura";
import Functionality from "../components/Functionality";
import AboutUs from "../components/AboutUs";
import Contact from "../components/Contact";
import Pricing from "../components/Pricing";
import Faq from "../components/Faq";
import Footer from "../components/footer";

export default function Landing() {
  return (
    <div>
      <main>
        <section id="hero"><Hero /></section>
        <section id="servicios"><Services /></section>
        <section id="nosotros"><AboutUs /></section>
        <section id="cobertura"><Cobertura /></section>
        <section id="funcionalidad"><Functionality /></section>
        <section id="faq"><Faq /></section>
        <section id="pricing"><Pricing /></section>
        <section id="contacto"><Contact /></section>
      </main>
      <Footer />
    </div>
  );
}
