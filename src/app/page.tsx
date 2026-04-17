import Navbar from "@/components/Navbar";
import Hero from "@/components/Landing/Hero";
import FeatureCards from "@/components/Landing/FeatureCards";
import Footer from "@/components/Landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar variant="landing" />
      <main className="flex-1 flex flex-col mt-14">
        <Hero />
        <FeatureCards />
      </main>
      <Footer />
    </div>
  );
}
