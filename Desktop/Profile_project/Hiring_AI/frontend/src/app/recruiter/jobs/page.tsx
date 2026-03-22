'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Plus, Search, Filter, MapPin, Users, Clock, 
  MoreVertical, Edit, Trash2, Eye, Briefcase, 
  ChevronDown, ArrowUpRight, Zap
} from 'lucide-react'

const jobs = [
  {
    id: '1', title: 'Senior React Developer', department: 'Engineering',
    location: 'Bangalore / Remote', type: 'Full-time', salary: '₹20-35 LPA',
    applications: 47, shortlisted: 8, interviewed: 3,
    status: 'active', posted: '5 days ago',
    tags: ['React', 'TypeScript', 'Node.js'],
    urgency: 'high',
  },
  {
    id: '2', title: 'ML Engineer — NLP', department: 'AI/ML',
    location: 'Mumbai / Hybrid', type: 'Full-time', salary: '₹25-45 LPA',
    applications: 31, shortlisted: 5, interviewed: 2,
    status: 'active', posted: '8 days ago',
    tags: ['Python', 'PyTorch', 'NLP', 'LLM'],
    urgency: 'medium',
  },
  {
    id: '3', title: 'Product Manager — Growth', department: 'Product',
    location: 'Delhi NCR', type: 'Full-time', salary: '₹18-30 LPA',
    applications: 89, shortlisted: 12, interviewed: 6,
    status: 'active', posted: '12 days ago',
    tags: ['Product Strategy', 'Analytics', 'Agile'],
    urgency: 'low',
  },
  {
    id: '4', title: 'DevOps / Cloud Engineer', department: 'Infrastructure',
    location: 'Remote', type: 'Full-time', salary: '₹22-38 LPA',
    applications: 28, shortlisted: 4, interviewed: 1,
    status: 'paused', posted: '15 days ago',
    tags: ['AWS', 'Kubernetes', 'Terraform'],
    urgency: 'medium',
  },
  {
    id: '5', title: 'UX/UI Designer', department: 'Design',
    location: 'Pune / Remote', type: 'Full-time', salary: '₹12-22 LPA',
    applications: 53, shortlisted: 9, interviewed: 4,
    status: 'active', posted: '18 days ago',
    tags: ['Figma', 'User Research', 'Design Systems'],
    urgency: 'low',
  },
]

const urgencyConfig = {
  high: 'bg-red-50 text-red-600 border-red-200',
  medium: 'bg-amber-50 text-amber-600 border-amber-200',
  low: 'bg-green-50 text-green-600 border-green-200',
}

export default function JobsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [localJobs, setLocalJobs] = useState(jobs)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('hireai_jobs')
    if (stored) {
      const parsed = JSON.parse(stored)
      // Check if default jobs are in there, if not, combine them if we want to, 
      // but simpler: if stored exists, use it. But if we posted a job FIRST before visiting this page,
      // stored might only have 1 job. Let's merge if parsed length < jobs length (rough check).
      if (parsed.length < jobs.length) {
        const merged = [...parsed, ...jobs]
        setLocalJobs(merged)
        localStorage.setItem('hireai_jobs', JSON.stringify(merged))
      } else {
        setLocalJobs(parsed)
      }
    } else {
      localStorage.setItem('hireai_jobs', JSON.stringify(jobs))
    }
  }, [])

  const filtered = localJobs.filter((j: any) => {
    const matchSearch = j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.department.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || j.status === statusFilter
    return matchSearch && matchStatus
  })

  const deleteJob = (id: string) => {
    const updated = localJobs.filter(j => j.id !== id)
    setLocalJobs(updated)
    localStorage.setItem('hireai_jobs', JSON.stringify(updated))
    setOpenDropdownId(null)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold font-display text-surface-900">Job Postings</h1>
          <p className="text-surface-700 font-medium mt-1">{filtered.length} active positions across departments</p>
        </div>
        <Link href="/recruiter/jobs/new"
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Post New Job
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search jobs..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm text-surface-900 placeholder:text-surface-600 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2">
          {['all', 'active', 'paused', 'closed'].map(s => (
            <button key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-surface-700 border border-surface-200 hover:bg-surface-50'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Job Cards */}
      <div className="space-y-4">
        {filtered.map(job => (
          <div key={job.id} className="bg-white rounded-2xl border border-surface-100 shadow-card hover:shadow-card-hover transition-all p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Left */}
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-surface-900 font-display">{job.title}</h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${urgencyConfig[job.urgency as keyof typeof urgencyConfig]}`}>
                        {job.urgency === 'high' ? '🔴 Urgent' : job.urgency === 'medium' ? '🟡 Normal' : '🟢 Low Priority'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-surface-600 font-medium mt-1.5 flex-wrap">
                      <span>{job.department}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                      <span>•</span>
                      <span>{job.salary}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{job.posted}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {job.tags.map(tag => (
                    <span key={tag} className="text-xs bg-surface-100 text-surface-700 px-2.5 py-1 rounded-lg font-medium">{tag}</span>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 lg:gap-8">
                <div className="text-center">
                  <div className="text-xl font-bold font-display text-surface-900">{job.applications}</div>
                  <div className="text-xs text-surface-600 font-bold uppercase tracking-wider">Applied</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold font-display text-brand-600">{job.shortlisted}</div>
                  <div className="text-xs text-brand-500/80 font-bold uppercase tracking-wider">Shortlisted</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold font-display text-green-600">{job.interviewed}</div>
                  <div className="text-xs text-green-500/80 font-bold uppercase tracking-wider">Interviewed</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0 lg:ml-auto">
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-xl hidden sm:block ${
                  job.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {job.status === 'active' ? '● Active' : '⏸ Paused'}
                </span>
                <Link href="/recruiter/candidates"
                  className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-xl transition-colors">
                  <Users className="w-3.5 h-3.5" />
                  View Candidates
                </Link>
                <div className="relative">
                  <button onClick={() => setOpenDropdownId(openDropdownId === job.id ? null : job.id)} className="w-9 h-9 rounded-xl border border-surface-200 flex items-center justify-center hover:bg-surface-50 transition-colors">
                    <MoreVertical className="w-4 h-4 text-surface-500" />
                  </button>
                  {openDropdownId === job.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-surface-200 rounded-xl shadow-card z-10 py-1 animate-fade-in">
                      <button onClick={() => setOpenDropdownId(null)} className="w-full text-left px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50 flex items-center gap-2"><Edit className="w-4 h-4"/> Edit Job</button>
                      <button onClick={() => setOpenDropdownId(null)} className="w-full text-left px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50 flex items-center gap-2"><Eye className="w-4 h-4"/> View Details</button>
                      <div className="h-px bg-surface-100 my-1"></div>
                      <button onClick={() => deleteJob(job.id)} className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 className="w-4 h-4"/> Delete Job</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 pt-4 border-t border-surface-50">
              <div className="flex items-center justify-between text-[11px] text-surface-600 font-bold uppercase tracking-wide mb-2">
                <span>Hiring Pipeline Progress</span>
                <span>{Math.round((job.interviewed / job.applications) * 100)}% conversion</span>
              </div>
              <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all"
                     style={{ width: `${(job.shortlisted / job.applications) * 100}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
