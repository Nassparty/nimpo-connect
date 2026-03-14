import { motion } from 'framer-motion';

export function PostCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className="bg-nimpo-surface border-b border-nimpo-separator p-4 space-y-3"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-nimpo-surface-3 animate-pulse" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3 w-28 bg-nimpo-surface-3 rounded animate-pulse" />
          <div className="h-2.5 w-20 bg-nimpo-surface-3 rounded animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3.5 w-full bg-nimpo-surface-3 rounded animate-pulse" />
        <div className="h-3.5 w-4/5 bg-nimpo-surface-3 rounded animate-pulse" />
        <div className="h-3.5 w-2/3 bg-nimpo-surface-3 rounded animate-pulse" />
      </div>
      <div className="h-48 w-full bg-nimpo-surface-3 rounded-inner animate-pulse" />
      <div className="flex gap-5">
        <div className="h-5 w-12 bg-nimpo-surface-3 rounded animate-pulse" />
        <div className="h-5 w-12 bg-nimpo-surface-3 rounded animate-pulse" />
      </div>
    </motion.div>
  );
}
