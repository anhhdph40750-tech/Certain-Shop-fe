import { Loader2 } from 'lucide-react';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullPage?: boolean;
}

export default function LoadingSpinner({ size = 'md', text, fullPage = false }: Props) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };

  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <Loader2 className={`${sizes.lg} animate-spin text-indigo-600`} />
        {text && <p className="text-gray-500">{text}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 py-8">
      <Loader2 className={`${sizes[size]} animate-spin text-indigo-600`} />
      {text && <span className="text-gray-500 text-sm">{text}</span>}
    </div>
  );
}
