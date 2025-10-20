// src/components/admin/AdminSidebar.jsx
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/api/client';
import * as Icons from 'lucide-react';

export default function AdminSidebar() {
  const [navigation, setNavigation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  useEffect(() => {
    loadNavigation();
  }, []);

  const loadNavigation = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/navigation');

      if (response.success) {
        setNavigation(response.navigation);
      } else {
        throw new Error(response.error || 'Failed to load navigation');
      }
    } catch (err) {
      console.error('Failed to load navigation:', err);
      setError(err.message);

      // Fallback to minimal navigation
      setNavigation([
        { key: 'dashboard', label: 'Dashboard', icon: 'Home', route: '/admin', children: [] },
        { key: 'products', label: 'Products', icon: 'Package', route: '/admin/products', children: [] }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName) => {
    const Icon = Icons[iconName] || Icons.Box;
    return <Icon className="w-5 h-5" />;
  };

  const renderNavItem = (item, depth = 0) => {
    const isActive = item.route && (
      location.pathname === item.route ||
      location.pathname.startsWith(item.route + '/')
    );
    const hasChildren = item.children && item.children.length > 0;
    const isClickable = item.route !== null && item.route !== undefined;

    const content = (
      <>
        {getIcon(item.icon)}
        <span className="flex-1">{item.label}</span>
        {item.badge && (
          <Badge
            variant="secondary"
            className="ml-auto"
            style={item.badge.color ? { backgroundColor: item.badge.color } : {}}
          >
            {item.badge.text}
          </Badge>
        )}
      </>
    );

    const className = `
      flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors
      ${isActive
        ? 'bg-primary text-primary-foreground font-medium'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }
      ${depth > 0 ? `ml-${depth * 4} text-sm` : ''}
      ${!isClickable ? 'font-semibold text-foreground opacity-90' : ''}
    `;

    return (
      <div key={item.key} className="nav-item-wrapper">
        {isClickable ? (
          <Link to={item.route} className={className}>
            {content}
          </Link>
        ) : (
          <div className={className}>
            {content}
          </div>
        )}

        {hasChildren && (
          <div className="mt-1 space-y-1">
            {item.children.map(child => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <aside className="w-64 h-screen bg-background border-r p-4">
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className="w-64 h-screen bg-background border-r p-4">
        <div className="text-sm text-destructive p-4 bg-destructive/10 rounded-lg">
          Failed to load navigation. Using fallback.
        </div>
        <nav className="mt-4 space-y-2">
          {navigation.map(item => renderNavItem(item))}
        </nav>
      </aside>
    );
  }

  return (
    <aside className="w-64 h-screen bg-background border-r flex flex-col">
      {/* Logo/Header */}
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">Admin Panel</h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto space-y-2">
        {navigation.map(item => renderNavItem(item))}
      </nav>
    </aside>
  );
}
