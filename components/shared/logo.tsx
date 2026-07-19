import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Image
        src="/images/rag2.png"
        alt="BhanuTron"
        width={32}
        height={32}
        className="h-8 w-8 rounded-[7px] object-cover"
        priority
      />
      <span className="text-lg font-semibold tracking-tight">BhanuTron</span>
    </span>
  );
}
