import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { 
  ArrowRight, 
  Sparkles, 
  TrendingUp, 
  Shield, 
  Zap, 
  Users, 
  Coins, 
  Receipt, 
  ArrowUpRight,
  CheckCircle2,
  HelpCircle,
  ChevronRight,
  Info
} from 'lucide-react'

export default async function LandingPage() {
  // Check user authentication on the server
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="relative min-h-screen overflow-x-hidden flex flex-col justify-between">
      {/* LANDING HEADER */}
      <header className="fixed top-0 left-0 right-0 h-20 flex items-center justify-between px-6 md:px-12 z-50 glass-thick border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/25">
            S
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            SplitID
          </span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-400">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#simplifier" className="hover:text-white transition-colors">The Math</Link>
          <Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link>
          <Link href="#faq" className="hover:text-white transition-colors">FAQ</Link>
        </nav>

        <div>
          {user ? (
            <Link
              href="/dashboard"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/25 active:scale-95"
            >
              Go to Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="hidden sm:inline-block text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-6 py-2.5 bg-white text-slate-900 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition-all active:scale-95 shadow-md"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 pt-32 lg:pt-40 pb-20 w-full flex-1 flex flex-col justify-center relative">
        <div className="absolute top-[20%] left-[-10%] w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[20%] right-[-10%] w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24 w-full relative z-10">
          {/* HERO LEFT */}
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] uppercase tracking-widest font-black text-indigo-400">
                Privacy-First Expense Coordinator
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">
              Split expenses <br />
              <span className="text-slate-500">without sharing</span> <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent italic font-serif">
                your number.
              </span>
            </h1>
            
            <p className="text-sm sm:text-base md:text-lg text-slate-400 max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
              Social group expenses, built for precision. Coordinate dining bills, rent, and trips securely using a unique Split ID. No phone numbers, no email tracking, and absolute security.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link
                href={user ? '/dashboard' : '/signup'}
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl font-extrabold text-xs uppercase tracking-widest text-center shadow-2xl shadow-indigo-500/30 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Claim Your Split ID <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#features"
                className="w-full sm:w-auto px-8 py-4 glass-card rounded-2xl font-extrabold text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-center"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* HERO RIGHT (Floating Mockup UI) */}
          <div className="flex-1 relative w-full max-w-[480px] h-[520px] hidden lg:block perspective-1000">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="glass-thick w-[420px] h-[490px] rounded-[40px] shadow-2xl border-white/10 p-8 space-y-6 animate-mockup-float relative overflow-hidden">
                <div className="absolute top-[-20%] right-[-20%] w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl"></div>
                
                {/* Mockup Header */}
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 text-sm">
                      P
                    </div>
                    <div>
                      <h4 className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Your Split ID</h4>
                      <p className="text-sm font-extrabold mono text-slate-300">PADMA-7128</p>
                    </div>
                  </div>
                  <div className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/25">
                    SECURED
                  </div>
                </div>

                {/* Mockup Content */}
                <div className="space-y-4">
                  {/* Balance Widget */}
                  <div className="h-24 w-full bg-slate-900/40 border border-white/5 rounded-2xl flex flex-col justify-center px-6">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Net Balance</span>
                    <span className="text-3xl font-black text-emerald-400">+₹2,410.50</span>
                  </div>
                  
                  {/* Stream Cards */}
                  <div className="space-y-3">
                    <div className="bg-slate-900/30 border border-white/5 rounded-xl border-l-4 border-l-indigo-500 p-4 flex justify-between items-center">
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Tokyo Trip Dinner</span>
                        <span className="text-xs font-extrabold text-slate-300">Paid by you</span>
                      </div>
                      <span className="text-xs font-bold text-indigo-400">+₹124.00</span>
                    </div>
                    <div className="bg-slate-900/30 border border-white/5 rounded-xl border-l-4 border-l-purple-500 p-4 flex justify-between items-center opacity-70">
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Co-working Space</span>
                        <span className="text-xs font-extrabold text-slate-300">Paid by Alex</span>
                      </div>
                      <span className="text-xs font-bold text-rose-400">-₹65.00</span>
                    </div>
                  </div>

                  {/* Algorithm Visual Indicator */}
                  <div className="p-3 bg-indigo-500/5 border border-indigo-500/15 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-indigo-300 font-medium flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
                      Simplifier optimized 5 debts
                    </span>
                    <span className="font-bold text-indigo-400">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* VISUAL DEBT SIMPLIFIER SECTION */}
      <section id="simplifier" className="max-w-7xl mx-auto px-6 md:px-12 py-24 w-full border-t border-white/5 space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[10px] uppercase tracking-widest font-black text-purple-400">
              SMART MINIMIZATION ENGINE
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Say goodbye to circular payments.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Traditionally, expense splitting leads to dozens of repetitive transfers. SplitID balances the scales globally, showing only the absolute minimum transfers needed to square up.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Before: Traditional */}
          <div className="glass-thick p-6 sm:p-8 rounded-[32px] border-white/5 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
              Traditional Group Split (5 Transfers)
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3.5 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-xs">
                <span className="font-bold text-slate-300">Alex</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase">pays ₹40 to</span>
                <span className="font-bold text-slate-300">Bob</span>
              </div>
              <div className="flex justify-between items-center p-3.5 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-xs">
                <span className="font-bold text-slate-300">Bob</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase">pays ₹30 to</span>
                <span className="font-bold text-slate-300">Charlie</span>
              </div>
              <div className="flex justify-between items-center p-3.5 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-xs">
                <span className="font-bold text-slate-300">Charlie</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase">pays ₹20 to</span>
                <span className="font-bold text-slate-300">Daniel</span>
              </div>
              <div className="flex justify-between items-center p-3.5 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-xs">
                <span className="font-bold text-slate-300">Daniel</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase">pays ₹10 to</span>
                <span className="font-bold text-slate-300">Alex</span>
              </div>
              <div className="flex justify-between items-center p-3.5 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-xs opacity-60">
                <span className="font-bold text-slate-300">Bob</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase">pays ₹15 to</span>
                <span className="font-bold text-slate-300">Daniel</span>
              </div>
            </div>
          </div>

          {/* After: SplitID Optimized */}
          <div className="glass-thick p-6 sm:p-8 rounded-[32px] border-indigo-500/20 space-y-6 relative overflow-hidden">
            <div className="absolute top-[-30%] right-[-30%] w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl"></div>
            
            <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
              SplitID Optimized (Only 2 Transfers)
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-5 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl text-sm font-semibold relative group hover:border-indigo-500/30 transition-all">
                <div className="flex items-center gap-2">
                  <span className="text-slate-300">Alex</span>
                  <ChevronRight className="w-4 h-4 text-indigo-500" />
                  <span className="text-slate-300">Charlie</span>
                </div>
                <div className="text-indigo-400 font-extrabold">₹20.00</div>
              </div>
              <div className="flex justify-between items-center p-5 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl text-sm font-semibold relative group hover:border-indigo-500/30 transition-all">
                <div className="flex items-center gap-2">
                  <span className="text-slate-300">Bob</span>
                  <ChevronRight className="w-4 h-4 text-indigo-500" />
                  <span className="text-slate-300">Daniel</span>
                </div>
                <div className="text-indigo-400 font-extrabold">₹25.00</div>
              </div>
              
              <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 text-xs text-indigo-300/80 leading-relaxed flex gap-2">
                <Info className="w-4.5 h-4.5 shrink-0 text-indigo-400" />
                <span>By mapping members' net balances globally, SplitID bypasses middle transfers entirely and links net debtors directly to net creditors.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" className="max-w-7xl mx-auto px-6 md:px-12 py-24 w-full border-t border-white/5 space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-400">
              Core Architecture
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Engineered for modern groups.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Forget sharing personal credentials or setting up complex email log validation. SplitID integrates database privacy with seamless logic.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1: Anonymous IDs */}
          <div className="glass-card p-8 rounded-3xl space-y-4 relative group">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 group-hover:border-indigo-500/40 transition-colors">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-white">Private Split IDs</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
              Every user claims a unique ID (e.g. ALEX-984F) upon signup. Add friends and create groups using only Split IDs. Protect your phone number and email from peer exposure.
            </p>
          </div>

          {/* Feature 2: Smart Debt Minimizer */}
          <div className="glass-card p-8 rounded-3xl space-y-4 relative group">
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20 group-hover:border-purple-500/40 transition-colors">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-white">One-Click Debt Cleaner</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
              Our simplification algorithm aggregates all group transactions, offsets balanced amounts, and provides optimized suggestions for simple one-click settlements.
            </p>
          </div>

          {/* Feature 3: Split strategy */}
          <div className="glass-card p-8 rounded-3xl space-y-4 relative group">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors">
              <Coins className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-white">Custom Split Equations</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
              Split bills however they happen. Supports equal divisions, percentage-based weight allocations, or exact dollar amounts for specific itemization.
            </p>
          </div>

          {/* Feature 4: Digital Receipt Safe */}
          <div className="glass-card p-8 rounded-3xl space-y-4 relative group">
            <div className="w-12 h-12 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-400 border border-pink-500/20 group-hover:border-pink-500/40 transition-colors">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-white">Receipt Storage</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
              Upload bills, invoices, or receipt PDFs directly to our secure cloud bucket. Maintain a permanent audit trail of all transactions inside your group.
            </p>
          </div>

          {/* Feature 5: Multi-Sphere Groups */}
          <div className="glass-card p-8 rounded-3xl space-y-4 relative group">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 border border-amber-500/20 group-hover:border-amber-500/40 transition-colors">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-white">Social Spheres</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
              Create isolated groups for separate circles: Flatmates, Road Trips, office lunch groups. Keep records organized and avoid mixing social circles.
            </p>
          </div>

          {/* Feature 6: Dynamic Dashboards */}
          <div className="glass-card p-8 rounded-3xl space-y-4 relative group">
            <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-400 border border-sky-500/20 group-hover:border-sky-500/40 transition-colors">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-white">Precision Metrics</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
              Instant KPI analytics dashboard showing you exactly what is pending, your monthly spend trends, and active balances across all joined spheres.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (Timeline) */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 md:px-12 py-24 w-full border-t border-white/5 space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Four steps to coordination.</h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Setting up takes less than a minute. Here is how you split and coordinate transactions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="glass-thick p-6.5 rounded-3xl border-white/5 space-y-4 relative">
            <span className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs uppercase">1</span>
            <h4 className="font-extrabold text-base text-white pt-2">Claim ID</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Create your account instantly. Receive your unique Split ID automatically (e.g. ALAN-A938).
            </p>
          </div>

          <div className="glass-thick p-6.5 rounded-3xl border-white/5 space-y-4 relative">
            <span className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs uppercase">2</span>
            <h4 className="font-extrabold text-base text-white pt-2">Add Friends</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Search for friends by entering their Split ID. Once they accept your request, you are connected.
            </p>
          </div>

          <div className="glass-thick p-6.5 rounded-3xl border-white/5 space-y-4 relative">
            <span className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs uppercase">3</span>
            <h4 className="font-extrabold text-base text-white pt-2">Form Spheres</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Create a group and add your friends. Add transactions, split rules, and attach receipt records.
            </p>
          </div>

          <div className="glass-thick p-6.5 rounded-3xl border-white/5 space-y-4 relative">
            <span className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs uppercase">4</span>
            <h4 className="font-extrabold text-base text-white pt-2">Settle Debts</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Let the algorithm simplify the debts. Click a suggestion to pay and completely settle up balances.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="max-w-4xl mx-auto px-6 md:px-12 py-24 w-full border-t border-white/5 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-500/10 border border-white/10 rounded-full">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
              HAVE QUESTIONS?
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Frequently Answered.</h2>
        </div>

        <div className="space-y-6">
          <div className="glass-thick p-6 rounded-2xl border-white/5 space-y-2">
            <h4 className="font-extrabold text-base text-white">Is SplitID really anonymous?</h4>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
              Yes. You never have to share your phone number or email address with other users. You only share your unique alphanumeric Split ID. We store your account registration securely, but your peers only interact with your Split ID.
            </p>
          </div>

          <div className="glass-thick p-6 rounded-2xl border-white/5 space-y-2">
            <h4 className="font-extrabold text-base text-white">How does the Smart Debt Simplifier work?</h4>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
              The engine aggregates all expenses and payments in a group to calculate a net balance (positive or negative) for each member. It then matches the highest debtor with the highest creditor, simplifying circular debts into direct payments.
            </p>
          </div>

          <div className="glass-thick p-6 rounded-2xl border-white/5 space-y-2">
            <h4 className="font-extrabold text-base text-white">Are there any file upload limits for receipts?</h4>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
              Currently, we support PNG, JPG, and PDF uploads for receipts. File sizes are capped at 5MB to ensure fast loading times across your expense stream feed.
            </p>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-24 w-full relative">
        <div className="glass-thick rounded-[40px] border-indigo-500/10 p-8 sm:p-12 md:p-16 text-center space-y-6 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 opacity-30"></div>
          <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-white">
              Ready to split with precision?
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-lg mx-auto font-medium">
              Get your unique Split ID in under 10 seconds. Create your first group and experience debt-minimization.
            </p>
            <div className="pt-4">
              <Link
                href={user ? '/dashboard' : '/signup'}
                className="inline-flex px-8 py-4 bg-white text-slate-900 hover:bg-slate-100 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-xl active:scale-95"
              >
                Claim Your Split ID Now <ArrowUpRight className="ml-2 w-4.5 h-4.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-10 px-6 md:px-12 text-center text-slate-500 text-xs relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white text-xs">S</div>
            <span className="font-extrabold text-slate-400">SplitID</span>
          </div>
          <p>© {new Date().getFullYear()} SplitID Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
