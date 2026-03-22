'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, ArrowRight, Loader2, Shield, Zap, Users } from 'lucide-react'
import toast from 'react-hot-toast'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: 'test@hireai.com', password: 'password123' })
  const role = searchParams.get('role') || 'recruiter'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await new Promise(r => setTimeout(r, 1500))
      toast.success('Welcome back!')
      router.push(role === 'recruiter' ? '/recruiter/jobs' : '/candidate/apply')
    } catch {
      toast.error('Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ─── LEFT PANEL (dark brand side) ─── */}
      <div className="hidden lg:flex flex-col w-[520px] relative overflow-hidden p-14" style={{
        background: 'linear-gradient(155deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)'
      }}>
        {/* Background glows */}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, rgba(99,102,241,0.25) 0%, transparent 55%),
                           radial-gradient(circle at 80% 20%, rgba(217,70,239,0.15) 0%, transparent 55%)`,
        }} />
        {/* Dot grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }} />

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-16 group">
            <Image src="/hireai-logo.png" alt="HireAI" width={44} height={44} className="rounded-xl object-cover logo-glow group-hover:scale-105 transition-transform" />
            <div>
              <div className="text-white font-bold text-xl tracking-tight">HireAI</div>
            </div>
          </Link>

          {/* Headline */}
          <div className="mb-12">
            <h2 className="text-4xl font-black text-white leading-tight mb-4" style={{ letterSpacing: '-0.03em' }}>
              The Intelligent Way<br />
              to <span className="gradient-text">Evaluate Talent</span>
            </h2>
            <p className="text-surface-400 text-base leading-relaxed">
              AI-powered interview platform that evaluates candidates comprehensively, consistently, and without bias.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-4 mb-auto">
            {[
              { icon: Zap, text: 'Structured, multi-round interview framework' },
              { icon: Users, text: 'Conversational voice AI with natural dialogue' },
              { icon: Shield, text: 'Objective, standardised candidate evaluation' },
              { icon: ArrowRight, text: 'Comprehensive role-specific skill assessment' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
                  <f.icon className="w-4 h-4 text-brand-400" />
                </div>
                <span className="text-surface-300 text-sm font-medium">{f.text}</span>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="mt-12 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <blockquote className="text-surface-300 text-sm leading-relaxed italic mb-4" style={{ borderLeft: '2px solid #6366f1', paddingLeft: '1rem' }}>
              &ldquo;HireAI transformed our talent pipeline. We hired a 50-person engineering team in half the time, with measurably better outcomes.&rdquo;
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                   style={{ background: 'linear-gradient(135deg, #6366f1, #d946ef)' }}>VK</div>
              <span className="text-surface-400 text-sm">Vikram Kapoor, VP Engineering, ScaleAI India</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL (form) ─── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">

          {/* Mobile Logo */}
          <Link href="/" className="flex items-center gap-3 mb-10 lg:hidden">
            <Image src="/hireai-logo.png" alt="HireAI" width={36} height={36} className="rounded-xl object-cover logo-glow" />
            <span className="text-xl font-bold text-surface-900 tracking-tight">HireAI</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-surface-900 mb-2 tracking-tight" style={{ letterSpacing: '-0.025em' }}>Welcome back</h1>
            <p className="text-surface-500 font-medium text-sm">
              New to HireAI?{' '}
              <Link href={`/auth/register?role=${role}`} className="text-brand-600 font-bold hover:text-brand-700 hover:underline">
                Create a free account
              </Link>
            </p>
          </div>

          {/* Role Toggle */}
          <div className="flex bg-surface-100 rounded-2xl p-1 mb-8">
            {['recruiter', 'candidate'].map(r => (
              <Link key={r} href={`/auth/login?role=${r}`}
                className={`flex-1 py-2.5 text-sm font-semibold text-center rounded-xl capitalize transition-all duration-200 ${
                  role === r 
                    ? 'bg-white text-surface-900 shadow-sm' 
                    : 'text-surface-500 hover:text-surface-700'
                }`}>
                {r}
              </Link>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-surface-800 mb-2">Email Address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                placeholder="you@company.com"
                className="w-full px-4 py-3.5 rounded-xl border border-surface-200 bg-white text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all text-sm font-medium"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-surface-800">Password</label>
                <Link href="/auth/forgot-password" className="text-xs text-brand-600 hover:text-brand-700 font-semibold">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 rounded-xl border border-surface-200 bg-white text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all text-sm font-medium pr-12"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 text-white font-bold py-4 rounded-2xl transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #d946ef 100%)', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}>
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-surface-100" />
            <span className="text-xs text-surface-400 font-bold tracking-wider uppercase">or continue with</span>
            <div className="flex-1 h-px bg-surface-100" />
          </div>

          {/* OAuth */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'Google', icon: '🔵' },
              { name: 'LinkedIn', icon: '💼' },
            ].map(p => (
              <button key={p.name}
                className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-surface-200 bg-white hover:bg-surface-50 text-sm font-semibold text-surface-700 transition-all hover:border-surface-300">
                <span>{p.icon}</span>
                {p.name}
              </button>
            ))}
          </div>

          <p className="text-center text-xs text-surface-400 mt-8">
            By signing in, you agree to our{' '}
            <a href="#" className="text-brand-600 hover:underline font-medium">Terms</a> and{' '}
            <a href="#" className="text-brand-600 hover:underline font-medium">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-600 border-t-transparent" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
