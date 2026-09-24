import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight, BadgeCheck, Calendar, ChevronDown, Clock, CreditCard,
  Droplets, Hammer, Headphones, MapPin, Paintbrush, Sparkles, Wind, Wrench, Zap,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { publicApi, type PublicCategory } from "@/lib/api-client";

const TONES = [
  "bg-[#efe4ff] text-[#6e20ee]", "bg-[#e2f2ff] text-[#1262c8]",
  "bg-[#fff0d3] text-[#f29700]", "bg-[#daf8ef] text-[#0d9e72]",
  "bg-[#ffe0eb] text-[#dc286d]", "bg-[#ffe8da] text-[#d95c13]",
];
const PROVIDER_APP_URL = import.meta.env["VITE_PROVIDER_APP_URL"] ?? "http://localhost:5190";

function categoryIcon(name: string): LucideIcon {
  const key = name.toLowerCase();
  if (key.includes("plumb")) return Droplets;
  if (key.includes("elect")) return Zap;
  if (key.includes("clean")) return Sparkles;
  if (key.includes("paint")) return Paintbrush;
  if (key.includes("air") || key.includes("hvac")) return Wind;
  return Hammer;
}

export function LandingPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [serviceMenuOpen, setServiceMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void publicApi.categories().then((rows) => {
      if (!active) return;
      setCategories(rows);
      setSelectedCode((current) => current || rows[0]?.code || "");
    }).catch(() => active && setCategories([]));
    return () => { active = false; };
  }, []);

  const selected = categories.find((category) => category.code === selectedCode);
  const popular = categories.slice(0, 6);
  const goToBooking = (category = selected) => {
    if (!category) return void navigate({ to: "/register" });
    const query = new URLSearchParams({
      category: category.name,
      categoryId: category.category_id,
      path: "find-provider",
    });
    sessionStorage.setItem("fixo.postAuthPath", `/book?${query.toString()}`);
    void navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-white text-[#111333]">
      <header className="relative z-30 border-b border-[#ececf5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[88px] max-w-[1440px] items-center gap-8 px-5 lg:px-14">
          <Link to="/" className="flex min-w-[240px] items-center gap-3">
            <img src="/brand/fixo-icon-mark.png" alt="FIXO" className="size-14 object-contain" />
            <span><strong className="block text-[34px] leading-none tracking-[-.04em]">FIXO</strong><small className="mt-1 block text-xs text-[#666887]">Home services made simple</small></span>
          </Link>
          <nav className="hidden h-full flex-1 items-center justify-center gap-7 text-[15px] font-medium lg:flex">
            <a href="#home" className="flex h-full items-center border-b-[3px] border-[#6b22ff] px-2 text-[#5a18ee]">Home</a>
            <a href="#services" className="hover:text-[#5a18ee]">Services</a>
            <a href="#how-it-works" className="hover:text-[#5a18ee]">How It Works</a>
            <a href={PROVIDER_APP_URL} className="hover:text-[#5a18ee]">For Providers</a>
            <a href="#support" className="hover:text-[#5a18ee]">Support</a>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <button className="hidden h-12 items-center gap-3 rounded-xl bg-white px-4 text-sm shadow-[0_4px_20px_rgba(29,27,68,.09)] xl:flex"><MapPin className="size-5 text-[#6c25ff]" />Dar es Salaam<ChevronDown className="ml-2 size-4 text-[#777995]" /></button>
            <Button asChild variant="outline" className="h-12 rounded-xl border-0 bg-white px-6 shadow-[0_4px_20px_rgba(29,27,68,.09)]"><Link to="/login">Log in</Link></Button>
            <Button asChild className="h-12 rounded-xl px-7 text-base shadow-none" style={{ backgroundImage: "linear-gradient(135deg,#9943ff,#5b00ed)" }}><Link to="/register">Get Started</Link></Button>
          </div>
        </div>
      </header>

      <main>
        <section id="home" className="relative min-h-[514px] overflow-hidden bg-[#f8f8ff]">
          <img src="/brand/fixo-landing-hero-v1.png" alt="FIXO home-services professional" className="absolute inset-0 h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(250,250,255,.99)_0%,rgba(250,250,255,.93)_36%,rgba(250,250,255,.22)_62%,rgba(250,250,255,0)_100%)]" />
          <div className="relative mx-auto max-w-[1440px] px-5 pb-10 pt-10 lg:px-14">
            <span className="inline-flex rounded-full bg-[#eee4ff] px-5 py-2 text-sm font-semibold text-[#651cf4]">Trusted Professionals. Better Homes.</span>
            <h1 className="mt-4 max-w-[620px] text-[50px] font-extrabold leading-[.98] tracking-[-.045em] sm:text-[68px]">Home services<br /><span className="bg-gradient-to-r from-[#6818f6] to-[#9b35ff] bg-clip-text text-transparent">made simple.</span></h1>
            <p className="mt-4 max-w-[580px] text-lg leading-7 text-[#626688] sm:text-xl">Book trusted professionals for repairs, maintenance<br className="hidden sm:block" /> and everyday services around your home or business.</p>

            <div className="relative mt-5 grid max-w-[1080px] gap-2 rounded-[26px] bg-white/95 p-4 shadow-[0_18px_55px_rgba(39,26,84,.16)] backdrop-blur md:grid-cols-[1.35fr_.95fr_.82fr_.85fr]">
              <div className="relative">
                <button type="button" onClick={() => setServiceMenuOpen((open) => !open)} className="flex h-[68px] w-full items-center gap-4 rounded-xl border border-[#e6e4f1] px-4 text-left"><Wrench className="size-6 shrink-0 text-[#8a37ff]" /><span className="min-w-0 flex-1"><strong className="block text-sm">What service do you need?</strong><small className="block truncate text-sm text-[#686b89]">{selected?.name ?? "Choose a service"}</small></span><ChevronDown className="size-4 text-[#777995]" /></button>
                {serviceMenuOpen && <div className="absolute left-0 top-[74px] z-40 max-h-64 w-full overflow-auto rounded-xl border bg-white p-2 shadow-xl">{categories.map((category) => <button key={category.category_id} type="button" onClick={() => { setSelectedCode(category.code); setServiceMenuOpen(false); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#f3edff]">{category.name}</button>)}</div>}
              </div>
              <button type="button" className="flex h-[68px] items-center gap-4 rounded-xl border border-[#e6e4f1] px-4 text-left"><MapPin className="size-6 text-[#8a37ff]" /><span className="flex-1"><strong className="block text-sm">Where?</strong><small className="text-sm text-[#686b89]">Dar es Salaam</small></span><ChevronDown className="size-4 text-[#777995]" /></button>
              <button type="button" className="flex h-[68px] items-center gap-4 rounded-xl border border-[#e6e4f1] px-4 text-left"><Calendar className="size-6 text-[#8a37ff]" /><span className="flex-1"><strong className="block text-sm">When?</strong><small className="text-sm text-[#686b89]">Today</small></span><ChevronDown className="size-4 text-[#777995]" /></button>
              <button type="button" onClick={() => goToBooking()} className="flex h-[68px] items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#9a43ff] to-[#5b00ed] px-5 text-base font-bold text-white shadow-[0_12px_24px_rgba(104,24,246,.28)]">Find Providers <ArrowRight className="size-5" /></button>
            </div>
            <div className="mt-4 flex max-w-[860px] flex-wrap items-center gap-3 text-sm"><strong>Popular:</strong>{popular.slice(0, 5).map((category) => <button key={category.category_id} onClick={() => { setSelectedCode(category.code); goToBooking(category); }} className="rounded-full bg-[#f0eff9] px-5 py-2 hover:bg-[#e6ddff]">{category.name}</button>)}</div>
          </div>
        </section>

        <section id="services" className="mx-auto max-w-[1440px] px-5 py-7 lg:px-14">
          <div className="flex items-end justify-between"><div><h2 className="text-[32px] font-extrabold tracking-[-.035em]">Popular Services</h2><p className="text-base text-[#777a9a]">Find the right service for your home or office</p></div><button onClick={() => navigate({ to: "/register" })} className="hidden items-center gap-2 font-semibold text-[#651cf4] sm:flex">View all services <ArrowRight className="size-4" /></button></div>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">{popular.map((category, index) => { const Icon = categoryIcon(category.name); return <button key={category.category_id} onClick={() => goToBooking(category)} className="group min-h-[164px] rounded-xl border border-[#e6e5ef] bg-white p-5 text-left transition hover:-translate-y-1 hover:shadow-lg"><span className={`flex size-14 items-center justify-center rounded-full ${TONES[index % TONES.length]}`}><Icon className="size-7" /></span><strong className="mt-4 block text-lg">{category.name}</strong><span className="mt-2 flex size-9 items-center justify-center rounded-full bg-[#f0e8ff] text-[#6a19f4]"><ArrowRight className="size-4 transition group-hover:translate-x-0.5" /></span></button>; })}</div>
        </section>

        <section id="how-it-works" className="border-t border-[#ececf5] bg-[#fafaff]" aria-label="Why choose FIXO"><div className="mx-auto grid max-w-[1320px] gap-5 px-6 py-6 md:grid-cols-4">{[
          { icon: BadgeCheck, title: "Verified Professionals", copy: "Background-checked experts" },
          { icon: CreditCard, title: "Secure Payments", copy: "Safe and protected" },
          { icon: Clock, title: "Easy Booking", copy: "In minutes" },
          { icon: Headphones, title: "Reliable Support", copy: "We're here to help" },
        ].map(({ icon: Icon, title, copy }) => <div key={title} className="flex items-center gap-4 border-[#dfdeea] px-4 md:border-r md:last:border-r-0"><Icon className="size-9 shrink-0 text-[#651cf4]" /><span><strong className="block">{title}</strong><small className="text-sm text-[#747795]">{copy}</small></span></div>)}</div></section>
        <span id="support" className="sr-only">FIXO support</span>
      </main>
    </div>
  );
}
