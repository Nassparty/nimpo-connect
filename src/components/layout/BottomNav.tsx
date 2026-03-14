import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, PlusSquare, MessageCircle, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { name: 'Home',     href: '/',             icon: Home },
  { name: 'Create',   href: '/create',       icon: PlusSquare },
  { name: 'Messages', href: '/messages',     icon: MessageCircle },
  { name: 'Alerts',   href: '/notifications',icon: Bell },
  { name: 'Profile',  href: '/profile',      icon: User },
];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 bg-nimpo-surface/90 backdrop-blur-md border-t border-nimpo-separator pb-safe">
      <div className="flex justify-around items-center h-14">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));
          return (
            <Link
              key={tab.name}
              to={tab.href}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors duration-150',
                isActive ? 'text-nimpo-brand' : 'text-nimpo-ink-3'
              )}
            >
              <motion.div
                whileTap={{ scale: 0.88 }}
                transition={{ duration: 0.1 }}
              >
                <tab.icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              </motion.div>
              <span className={cn(
                'text-[10px] font-medium tracking-tight',
                isActive ? 'text-nimpo-brand' : 'text-nimpo-ink-3'
              )}>
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
