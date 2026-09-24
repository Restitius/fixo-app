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
        <div className="flex h-[88px] w-full items-center gap-8 px-5 lg:px-[4vw]">
          <Link to="/" className="flex min-w-[240px] items-center gap-3">
            <img src="/favicon-32x32.png" alt="FIXO" className="size-12 object-contain" />
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
        <section id="home" className="relative min-h-[570px] overflow-hidden bg-[#f8f8ff]">
          <img src="/brand/fixo-landing-hero-v1.png" alt="FIXO home-services professional" className="absolute inset-0 h-full w-full object-cover object-[64%_42%]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(250,250,255,.99)_0%,rgba(250,250,255,.94)_35%,rgba(250,250,255,.18)_60%,rgba(250,250,255,0)_100%)]" />
          <div className="relative w-full px-5 pb-10 pt-10 lg:px-[4vw]">
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

        <section id="services" className="w-full px-5 py-7 lg:px-[4vw]">
          <div className="flex items-end justify-between"><div><h2 className="text-[32px] font-extrabold tracking-[-.035em]">Popular Services</h2><p className="text-base text-[#777a9a]">Find the right service for your home or office</p></div><button onClick={() => navigate({ to: "/register" })} className="hidden items-center gap-2 font-semibold text-[#651cf4] sm:flex">View all services <ArrowRight className="size-4" /></button></div>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">{popular.map((category, index) => { const Icon = categoryIcon(category.name); return <button key={category.category_id} onClick={() => goToBooking(category)} className="group min-h-[164px] rounded-xl border border-[#e6e5ef] bg-white p-5 text-left transition hover:-translate-y-1 hover:shadow-lg"><span className={`flex size-14 items-center justify-center rounded-full ${TONES[index % TONES.length]}`}><Icon className="size-7" /></span><strong className="mt-4 block text-lg">{category.name}</strong><span className="mt-2 flex size-9 items-center justify-center rounded-full bg-[#f0e8ff] text-[#6a19f4]"><ArrowRight className="size-4 transition group-hover:translate-x-0.5" /></span></button>; })}</div>
        </section>

        <section className="border-t border-[#ececf5] bg-[#fafaff]" aria-label="Why choose FIXO"><div className="grid w-full gap-5 px-5 py-6 md:grid-cols-4 lg:px-[4vw]">{[
          { icon: BadgeCheck, title: "Verified Professionals", copy: "Background-checked experts" },
          { icon: CreditCard, title: "Secure Payments", copy: "Safe and protected" },
          { icon: Clock, title: "Easy Booking", copy: "In minutes" },
          { icon: Headphones, title: "Reliable Support", copy: "We're here to help" },
        ].map(({ icon: Icon, title, copy }) => <div key={title} className="flex items-center gap-4 border-[#dfdeea] px-4 md:border-r md:last:border-r-0"><Icon className="size-9 shrink-0 text-[#651cf4]" /><span><strong className="block">{title}</strong><small className="text-sm text-[#747795]">{copy}</small></span></div>)}</div></section>

        <section id="how-it-works" className="relative overflow-hidden bg-[#fafaff] px-5 py-16 lg:px-[4vw] lg:py-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_70%,rgba(113,37,255,.09),transparent_34%),radial-gradient(circle_at_85%_20%,rgba(113,37,255,.06),transparent_30%)]" />
          <div className="relative grid gap-12 xl:grid-cols-[1.7fr_1fr]">
            <div className="relative min-h-[720px] overflow-hidden rounded-[28px]">
              <img src="/brand/fixo-how-it-works-v1.png" alt="FIXO professional ready to help" className="absolute inset-0 h-full w-full object-cover object-[46%_center]" />
              <div className="absolute inset-0 bg-gradient-to-b from-white via-white/90 to-white/5" />
              <div className="relative z-10 p-7 lg:p-10">
                <span className="inline-flex rounded-full bg-[#eee4ff] px-5 py-2 text-base font-semibold text-[#651cf4]">How It Works</span>
                <h2 className="mt-5 max-w-[850px] text-5xl font-extrabold leading-[.98] tracking-[-.05em] lg:text-[66px]">Get the help you need<br />in <span className="bg-gradient-to-r from-[#6818f6] to-[#9b35ff] bg-clip-text text-transparent">three simple steps.</span></h2>
                <p className="mt-4 max-w-[720px] text-xl leading-8 text-[#696d8c]">From choosing a service to getting it done, FIXO makes home services simple, fast and reliable.</p>
                <div className="relative mt-8 grid gap-5 md:grid-cols-3">
                  <div className="pointer-events-none absolute left-[15%] right-[15%] top-[72px] hidden border-t-2 border-dashed border-[#d8cdf4] md:block" />
                  {[
                    { title: "Choose a service", copy: "Pick the service you need for your home or office." },
                    { title: "Select a provider", copy: "View trusted professionals and choose the right fit." },
                    { title: "Book and get it done", copy: "Schedule at your convenience and relax while we handle the rest." },
                  ].map((step, index) => (
                    <article key={step.title} className="relative z-10 min-h-[260px] rounded-2xl border border-[#e7e3f2] bg-white/95 p-6 shadow-[0_18px_45px_rgba(35,22,76,.08)]">
                      <span className={`flex size-20 items-center justify-center rounded-full ${index === 2 ? "bg-[#dcf8ee]" : "bg-[#efe3ff]"}`}><img src="/favicon-32x32.png" alt="" className="size-10 object-contain" /></span>
                      <span className="mt-3 flex size-8 items-center justify-center rounded-full bg-[#eee4ff] font-extrabold text-[#651cf4]">{index + 1}</span>
                      <h3 className="mt-3 text-xl font-bold">{step.title}</h3>
                      <p className="mt-2 max-w-[230px] text-base leading-6 text-[#6f7392]">{step.copy}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            <aside className="self-start rounded-[28px] bg-white p-7 shadow-[0_22px_60px_rgba(40,28,86,.1)] lg:p-9">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#eee4ff] px-5 py-2 font-semibold text-[#651cf4]"><img src="/favicon-32x32.png" alt="" className="size-5" /> Popular Near You</span>
              <h2 className="mt-5 text-5xl font-extrabold leading-[.98] tracking-[-.05em]">Top Services<br /><span className="bg-gradient-to-r from-[#6818f6] to-[#9b35ff] bg-clip-text text-transparent">Near You</span></h2>
              <p className="mt-3 text-lg text-[#717593]">Find trusted professionals in your area.</p>
              <div className="mt-6 space-y-4">{popular.slice(0, 3).map((category, index) => { const Icon = categoryIcon(category.name); return (
                <button key={category.category_id} onClick={() => goToBooking(category)} className="group flex w-full items-center gap-4 rounded-2xl border border-[#e3e0ef] p-4 text-left transition hover:border-[#8a37ff] hover:shadow-md">
                  <span className={`flex size-16 shrink-0 items-center justify-center rounded-full ${TONES[index % TONES.length]}`}><Icon className="size-8" /></span>
                  <span className="min-w-0 flex-1"><strong className="block text-xl">{category.name}</strong><small className="mt-1 block truncate text-base text-[#767a99]">Trusted local professionals.</small></span>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#f0e8ff] text-[#6a19f4]"><ArrowRight className="size-5 transition group-hover:translate-x-0.5" /></span>
                </button>
              ); })}</div>
              <button onClick={() => navigate({ to: "/register" })} className="mt-7 flex w-full items-center gap-3 border-t border-[#e6e3ef] pt-7 text-lg font-semibold text-[#651cf4]">View all services <ArrowRight className="size-5" /></button>
            </aside>
          </div>
        </section>
        <span id="support" className="sr-only">FIXO support</span>
      </main>
    </div>
  );
}
