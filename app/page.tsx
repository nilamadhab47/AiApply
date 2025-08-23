import Image from "next/image";
import { Button } from "@/components/ui/button";
import { FileText, PenLine, Check, Mail, Phone, MapPin } from "lucide-react";
import Hero from "../components/sections/Hero";
import CompaniesStatsSection from "../components/sections/CompaniesStatsSection";
import FeaturesSection from "../components/sections/FeaturesSection";
import TemplatesSection from "../components/sections/TemplatesSection";
export default function Home() {
  return (
    <>
    <div className="w-full h-screen bg-black">
      <Hero />
    </div>
    <CompaniesStatsSection />
    <FeaturesSection />
    <TemplatesSection />
    </>
  );
}
