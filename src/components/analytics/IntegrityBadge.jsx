import React from 'react';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function IntegrityBadge({ score, size = 'default', showLabel = true }) {
  const getScoreConfig = () => {
    if (score >= 85) {
      return {
        color: 'emerald',
        label: 'High Integrity',
        icon: CheckCircle,
        bgClass: 'bg-emerald-50 border-emerald-200',
        textClass: 'text-emerald-700',
        iconClass: 'text-emerald-600'
      };
    } else if (score >= 70) {
      return {
        color: 'amber',
        label: 'Moderate Integrity',
        icon: Shield,
        bgClass: 'bg-amber-50 border-amber-200',
        textClass: 'text-amber-700',
        iconClass: 'text-amber-600'
      };
    } else {
      return {
        color: 'rose',
        label: 'Low Integrity',
        icon: AlertTriangle,
        bgClass: 'bg-rose-50 border-rose-200',
        textClass: 'text-rose-700',
        iconClass: 'text-rose-600'
      };
    }
  };

  const config = getScoreConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    default: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    default: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={cn(
      'inline-flex items-center gap-2 rounded-lg border font-medium',
      config.bgClass,
      config.textClass,
      sizeClasses[size]
    )}>
      <Icon className={cn(config.iconClass, iconSizes[size])} />
      <span className="font-bold">{score}%</span>
      {showLabel && <span className="hidden sm:inline">{config.label}</span>}
    </div>
  );
}