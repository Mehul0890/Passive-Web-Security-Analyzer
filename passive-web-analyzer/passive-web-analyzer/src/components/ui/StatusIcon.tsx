import { CheckCircle, XCircle, AlertCircle, MinusCircle, Clock } from 'lucide-react';

interface StatusIconProps {
  status: boolean | null | undefined | string;
  size?: number;
}

export function StatusIcon({ status, size = 16 }: StatusIconProps) {
  if (status === true || status === 'complete') {
    return <CheckCircle size={size} className="text-emerald-400 shrink-0" />;
  }
  if (status === false || status === 'error' || status === 'blocked') {
    return <XCircle size={size} className="text-red-400 shrink-0" />;
  }
  if (status === 'partial' || status === 'restricted') {
    return <AlertCircle size={size} className="text-yellow-400 shrink-0" />;
  }
  if (status === 'timed_out') {
    return <Clock size={size} className="text-orange-400 shrink-0" />;
  }
  return <MinusCircle size={size} className="text-slate-500 shrink-0" />;
}
