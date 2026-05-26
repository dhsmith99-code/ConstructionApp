import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import { FolderKanban, Camera, ClipboardCheck, ArrowRight } from 'lucide-react';

function StatCard({ icon: Icon, label, value, to, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Link
        to={to}
        className="flex items-center gap-4 p-5 bg-card rounded-2xl border border-border hover:shadow-md hover:border-primary/30 transition-all group"
      >
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-2xl font-serif font-semibold text-foreground">{value ?? '—'}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </Link>
    </motion.div>
  );
}

export default function Dashboard() {
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-updated_date'),
  });

  const { data: photos = [] } = useQuery({
    queryKey: ['photos'],
    queryFn: () => base44.entities.Photo.list('-created_date'),
  });

  const { data: punchItems = [] } = useQuery({
    queryKey: ['punch'],
    queryFn: () => base44.entities.PunchItem.list('-updated_date'),
  });

  const activeProjects = projects.filter((p) => p.status === 'active');
  const openPunch = punchItems.filter((p) => p.status !== 'completed');

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Your construction projects at a glance."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatCard icon={FolderKanban} label="Active Projects" value={activeProjects.length} to="/projects" delay={0} />
        <StatCard icon={Camera} label="Site Photos" value={photos.length} to="/photos" delay={0.05} />
        <StatCard icon={ClipboardCheck} label="Open Punch Items" value={openPunch.length} to="/punch-list" delay={0.1} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Projects */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-semibold">Recent Projects</h2>
            <Link to="/projects" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects yet.</p>
          ) : (
            <div className="space-y-2">
              {projects.slice(0, 5).map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="flex items-center gap-3 p-3.5 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <FolderKanban className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{project.name}</p>
                    {project.client && <p className="text-xs text-muted-foreground truncate">{project.client}</p>}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      project.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : project.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {project.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </motion.section>

        {/* Recent Photos */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-semibold">Recent Photos</h2>
            <Link to="/photos" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {photos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No photos yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.slice(0, 6).map((photo) => (
                <div key={photo.id} className="aspect-square rounded-xl overflow-hidden bg-muted">
                  <img
                    src={photo.url}
                    alt={photo.caption || 'Site photo'}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}
