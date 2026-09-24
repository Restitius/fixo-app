import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight, BadgeCheck, Calendar, ChevronDown, Clock, CreditCard,
  Droplets, Hammer, Headphones, MapPin, Paintbrush, Quote, Search, Shield, Sparkles, Star, Users, Wind, Wrench, Zap,
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
  const nearby = ["plumb", "clean", "elect"]
    .map((term) => categories.find((category) => category.name.toLowerCase().includes(term)))
    .filter((category): category is PublicCategory => Boolean(category));
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

        <section id="how-it-works" className="relative min-h-[920px] overflow-hidden bg-[#fbfbff] px-5 py-12 lg:px-[4.6vw]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_31%_78%,rgba(91,0,237,.09),transparent_29%),radial-gradient(circle_at_79%_18%,rgba(91,0,237,.055),transparent_25%)]" />
          <img src="/brand/fixo-how-it-works-v2.png" alt="FIXO professional ready to help" className="pointer-events-none absolute bottom-0 left-[14%] h-[500px] w-[48%] object-cover object-[38%_58%]" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-[390px] w-[62%] bg-gradient-to-b from-[#fbfbff]/15 via-transparent to-transparent" />

          <div className="relative grid items-start gap-[4.5vw] xl:grid-cols-[1.62fr_1fr]">
            <div>
              <span className="inline-flex rounded-full bg-[#eee4ff] px-6 py-2 text-base font-semibold text-[#651cf4]">How It Works</span>
              <h2 className="mt-6 max-w-[880px] text-[clamp(48px,4vw,66px)] font-extrabold leading-[.98] tracking-[-.052em]">Get the help you need<br />in <span className="bg-gradient-to-r from-[#6818f6] to-[#9b35ff] bg-clip-text text-transparent">three simple steps.</span></h2>
              <p className="mt-4 max-w-[735px] text-xl leading-8 text-[#696d8c]">From choosing a service to getting it done, FIXO makes<br className="hidden lg:block" /> home services simple, fast and reliable.</p>

              <div className="relative mt-8 grid max-w-[900px] gap-[3.7vw] md:grid-cols-3">
                <div className="pointer-events-none absolute left-[17%] right-[17%] top-[74px] hidden border-t-2 border-dashed border-[#d8cdf4] md:block" />
                {[
                  { icon: Search, title: "Choose a service", copy: "Pick the service you need for your home or office." },
                  { icon: Users, title: "Select a provider", copy: "View trusted professionals and choose the right fit." },
                  { icon: Calendar, title: "Book and get it done", copy: "Schedule at your convenience and relax while we handle the rest." },
                ].map((step, index) => {
                  const StepIcon = step.icon;
                  return (
                    <article key={step.title} className="relative z-10 min-h-[304px] rounded-[20px] border border-[#e6e2f1] bg-white/95 p-7 shadow-[0_14px_40px_rgba(35,22,76,.055)]">
                      <span className={`flex size-[82px] items-center justify-center rounded-full ${index === 2 ? "bg-[#dcf8ee]" : "bg-[#efe3ff]"}`}><StepIcon className="size-10 text-[#6617f5]" strokeWidth={2.5} /></span>
                      <span className="mt-3 flex size-8 items-center justify-center rounded-full bg-[#eee4ff] text-lg font-extrabold text-[#651cf4]">{index + 1}</span>
                      <h3 className="mt-3 text-xl font-bold">{step.title}</h3>
                      <p className="mt-2 max-w-[210px] text-base leading-6 text-[#6f7392]">{step.copy}</p>
                    </article>
                  );
                })}
              </div>

              <div className="relative z-10 mt-10 max-w-[245px] -rotate-6 text-center font-serif text-[28px] italic leading-[1.05] text-[#111333]">Same Homes<br />Brighter Tomorrows<div className="mx-auto mt-3 h-1.5 w-36 -rotate-6 rounded-full bg-gradient-to-r from-[#5c09ef] to-[#a740ff]" /></div>
            </div>

            <div>
              <aside className="rounded-[26px] bg-white p-9 shadow-[0_22px_60px_rgba(40,28,86,.1)]">
                <span className="inline-flex rounded-full bg-[#eee4ff] px-6 py-2 text-base font-semibold text-[#651cf4]">Popular Near You</span>
                <h2 className="mt-6 text-[clamp(46px,3.4vw,56px)] font-extrabold leading-[.98] tracking-[-.05em]">Top Services<br /><span className="bg-gradient-to-r from-[#6818f6] to-[#9b35ff] bg-clip-text text-transparent">Near You</span></h2>
                <p className="mt-3 text-xl text-[#717593]">Find trusted professionals in your area.</p>
                <div className="mt-7 space-y-4">{nearby.map((category, index) => { const Icon = categoryIcon(category.name); const descriptions = ["Repairs, installation, leaks.", "Homes and offices.", "Repairs and installations."]; return (
                  <button key={category.category_id} onClick={() => goToBooking(category)} className="group flex w-full items-center gap-5 rounded-2xl border border-[#dedbea] p-4 text-left transition hover:border-[#8a37ff] hover:shadow-md">
                    <span className={`flex size-[74px] shrink-0 items-center justify-center rounded-full ${TONES[index % TONES.length]}`}><Icon className="size-10" strokeWidth={2.4} /></span>
                    <span className="min-w-0 flex-1"><strong className="block text-xl">{category.name}</strong><small className="mt-1 block truncate text-base text-[#767a99]">{descriptions[index]}</small></span>
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#f0e8ff] text-[#6a19f4]"><ArrowRight className="size-6 transition group-hover:translate-x-0.5" /></span>
                  </button>
                ); })}</div>
                <button onClick={() => navigate({ to: "/register" })} className="mt-7 flex w-full items-center gap-3 border-t border-[#e6e3ef] pt-7 text-lg font-semibold text-[#651cf4]">View all services <ArrowRight className="size-5" /></button>
              </aside>
              <div className="mt-7 flex justify-center gap-2" aria-label="Service carousel page 1 of 3"><span className="size-3 rounded-full bg-[#6617f5]" /><span className="size-3 rounded-full bg-[#dfd5fb]" /><span className="size-3 rounded-full bg-[#dfd5fb]" /></div>
            </div>
          </div>
        </section>

        <section id="trust" className="bg-white px-5 pb-0 pt-12 lg:px-[4.6vw]">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <span className="inline-flex rounded-full bg-[#eee4ff] px-6 py-2 text-base font-semibold text-[#651cf4]">Why customers trust FIXO</span>
              <h2 className="mt-5 max-w-[640px] text-[clamp(46px,3.8vw,62px)] font-extrabold leading-[.98] tracking-[-.05em]">A simpler, safer way<br />to get things done</h2>
            </div>
            <p className="max-w-[470px] pb-3 text-xl leading-8 text-[#696d8c]">Thousands of homeowners and businesses<br className="hidden lg:block" /> trust FIXO for reliable service, every day.</p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[
              { icon: BadgeCheck, title: "Verified professionals", copy: "Background-checked experts" },
              { icon: CreditCard, title: "Secure payments", copy: "Safe and protected" },
              { icon: Clock, title: "Fast booking", copy: "Get help in minutes" },
              { icon: Headphones, title: "Friendly support", copy: "We're here to help" },
            ].map(({ icon: Icon, title, copy }) => (
              <article key={title} className="flex min-h-[126px] items-center gap-6 rounded-2xl border border-[#e4e1ed] bg-white px-6 shadow-[0_12px_35px_rgba(35,22,76,.04)]">
                <span className="flex size-[78px] shrink-0 items-center justify-center rounded-full bg-[#efe4ff]"><Icon className="size-10 text-[#651cf4]" strokeWidth={2.4} /></span>
                <span><strong className="block text-xl">{title}</strong><small className="mt-2 block text-base text-[#737795]">{copy}</small></span>
              </article>
            ))}
          </div>

          <div className="relative -mx-5 mt-10 min-h-[540px] overflow-hidden bg-[#f7f5ff] lg:-mx-[4.6vw]">
            <img src="/brand/fixo-provider-woman-v1.png" alt="Female FIXO service professional" className="absolute inset-y-0 left-0 h-full w-[108%] max-w-none -translate-x-[8%] object-cover object-center" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(249,248,255,.99)_0%,rgba(249,248,255,.93)_35%,rgba(249,248,255,.12)_61%,rgba(249,248,255,0)_100%)]" />
            <div className="relative z-10 flex min-h-[540px] px-5 py-12 lg:px-[4.6vw]">
              <div className="max-w-[570px] self-center">
                <span className="inline-flex rounded-full bg-[#eee4ff] px-6 py-2 text-base font-semibold text-[#651cf4]">For Service Professionals</span>
                <h2 className="mt-6 text-[clamp(48px,4vw,66px)] font-extrabold leading-[.96] tracking-[-.05em]">Grow your skills.<br /><span className="bg-gradient-to-r from-[#6818f6] to-[#9b35ff] bg-clip-text text-transparent">More opportunities<br />with FIXO.</span></h2>
                <p className="mt-5 text-xl leading-8 text-[#696d8c]">Join a trusted platform, get more jobs,<br />and build your reputation.</p>
                <div className="mt-7 flex flex-wrap gap-5">
                  <a href={PROVIDER_APP_URL} className="flex h-16 min-w-[290px] items-center justify-center gap-5 rounded-2xl bg-gradient-to-r from-[#8d32ff] to-[#5b00ed] px-8 text-lg font-bold text-white shadow-[0_14px_30px_rgba(99,21,242,.25)]">Join as a provider <ArrowRight className="size-6" /></a>
                  <a href={PROVIDER_APP_URL} className="flex h-16 min-w-[210px] items-center justify-center rounded-2xl bg-white px-8 text-lg font-bold shadow-[0_8px_28px_rgba(35,22,76,.08)]">Learn more</a>
                </div>
              </div>

              <aside className="absolute right-[1.5vw] top-10 hidden w-[300px] rounded-2xl bg-white/95 p-6 shadow-[0_18px_45px_rgba(35,22,76,.12)] xl:block 2xl:w-[350px]">
                <div className="flex gap-4"><span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#eee4ff]"><img src="/favicon-32x32.png" alt="FIXO" className="size-9" /></span><div><div className="flex gap-0.5 text-[#ffab00]">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className="size-5 fill-current" />)}</div><p className="mt-2 text-base leading-6 text-[#3f4261]">“FIXO has helped me get consistent work. It's reliable and easy to use.”</p><strong className="mt-3 block">— Amina M.</strong><small className="text-[#777b98]">Technician, Dar es Salaam</small></div></div>
              </aside>
            </div>
          </div>
        </section>

        <section id="reviews" className="relative overflow-hidden bg-[#fbfbff] px-5 py-14 lg:px-[4.6vw] lg:py-16">
          <div className="pointer-events-none absolute -right-24 -top-40 size-[500px] rounded-full bg-[radial-gradient(circle,rgba(105,25,245,.08),rgba(105,25,245,.015)_62%,transparent_63%)]" />
          <div className="pointer-events-none absolute right-[7%] top-12 -rotate-6 text-center font-serif text-[29px] italic leading-[1.05] text-[#111333]">Same<br />Great Service.<br />Happier Homes.<div className="mx-auto mt-3 h-1.5 w-40 -rotate-6 rounded-full bg-gradient-to-r from-[#5c09ef] to-[#a740ff]" /></div>

          <div className="relative">
            <span className="inline-flex rounded-full bg-[#eee4ff] px-6 py-2 text-base font-semibold text-[#651cf4]">Customer Reviews &amp; Trust</span>
            <h2 className="mt-5 text-[clamp(50px,4.7vw,76px)] font-extrabold leading-[.98] tracking-[-.055em]">Loved by <span className="bg-gradient-to-r from-[#6818f6] to-[#9b35ff] bg-clip-text text-transparent">homeowners.</span></h2>
            <p className="mt-3 text-2xl text-[#6d7190]">Real people. Real homes. Real results.</p>

            <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {[
                { icon: Users, value: "10,000+", label: "Happy Customers", tone: "bg-[#eee3ff] text-[#651cf4]" },
                { icon: Wrench, value: "25,000+", label: "Jobs Completed", tone: "bg-[#dcf8ee] text-[#0bad70]" },
                { icon: Shield, value: "500+", label: "Verified Professionals", tone: "bg-[#fff0d7] text-[#f0a000]" },
                { icon: Star, value: "4.9/5", label: "Customer Rating", tone: "bg-[#ffe1ec] text-[#e51e67]" },
              ].map(({ icon: Icon, value, label, tone }) => (
                <article key={label} className="flex min-h-[126px] items-center gap-4 rounded-2xl border border-[#e3e0ed] bg-white px-5 shadow-[0_10px_32px_rgba(35,22,76,.04)]">
                  <span className={`flex size-[72px] shrink-0 items-center justify-center rounded-full ${tone}`}><Icon className="size-10" strokeWidth={2.3} /></span>
                  <span><strong className="block text-[28px] leading-none">{value}</strong><small className="mt-3 block whitespace-nowrap text-base text-[#707493]">{label}</small></span>
                </article>
              ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              {[
                { name: "Amina", image: "/brand/fixo-provider-woman-v1.png", position: "68% 20%", zoom: 2.5, review: "FIXO made it so easy to find a reliable cleaner for my home. She was professional, arrived on time, and did an amazing job. I’ll definitely book again!", service: "Home Cleaning", icon: Sparkles, tone: TONES[0] },
                { name: "Daniel", image: "/brand/fixo-how-it-works-v2.png", position: "38% 52%", zoom: 4, review: "I needed an electrician urgently and FIXO connected me with a great pro within minutes. Fast, reliable and professional service!", service: "Electrical Repair", icon: Zap, tone: TONES[2] },
                { name: "Neema", image: "/brand/fixo-provider-woman-v1.png", position: "70% 18%", zoom: 2.5, review: "Great experience from start to finish. The plumber was polite, knowledgeable and fixed the issue quickly. FIXO really delivers!", service: "Plumbing", icon: Droplets, tone: TONES[1] },
              ].map((review) => {
                const ServiceIcon = review.icon;
                return (
                  <article key={review.name} className="relative flex min-h-[338px] flex-col rounded-2xl border border-[#e3e0ed] bg-white p-8 shadow-[0_14px_42px_rgba(35,22,76,.055)]">
                    <Quote className="absolute right-7 top-7 size-12 fill-[#e8dcff] text-[#e8dcff]" />
                    <div className="flex items-center gap-5">
                      <span className="size-[92px] shrink-0 overflow-hidden rounded-full bg-[#eee4ff]"><img src={review.image} alt={review.name} className="h-full w-full object-cover" style={{ objectPosition: review.position, transform: `scale(${review.zoom})`, transformOrigin: review.position }} /></span>
                      <span><strong className="block text-xl">{review.name}</strong><span className="mt-2 flex gap-0.5 text-[#ffab00]">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className="size-5 fill-current" />)}</span></span>
                    </div>
                    <p className="mt-5 flex-1 text-lg leading-7 text-[#666b8b]">“{review.review}”</p>
                    <div className="mt-4 flex items-center gap-4 border-t border-[#e6e3ef] pt-4"><span className={`flex size-12 items-center justify-center rounded-full ${review.tone}`}><ServiceIcon className="size-6" /></span><span className="text-base text-[#737795]">Booked: <strong className="text-[#111333]">{review.service}</strong></span></div>
                  </article>
                );
              })}
            </div>

            <div className="mt-14 flex items-center gap-7"><span className="h-px flex-1 bg-[#dddbea]" /><span className="text-xs font-semibold tracking-[.3em] text-[#9699b5]">TRUSTED BY THOUSANDS ACROSS DAR ES SALAAM</span><span className="h-px flex-1 bg-[#dddbea]" /></div>
            <div className="mt-7 grid grid-cols-3 items-center gap-4 text-[#777c9e] md:grid-cols-6">
              {["NMB", "Airtel", "vodacom", "tigo", "halotel", "selcom"].map((name) => <div key={name} className="flex items-center justify-center gap-3 border-r border-[#dddbea] py-2 last:border-r-0"><img src="/favicon-32x32.png" alt="FIXO" className="size-8 grayscale opacity-55" /><strong className="text-lg">{name}</strong></div>)}
            </div>
          </div>
        </section>
        <span id="support" className="sr-only">FIXO support</span>
      </main>
    </div>
  );
}
