import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
        <p className="text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="space-y-3">
          <Link href="/">
            <Button className="w-full">
              Return Home
            </Button>
          </Link>
          <Link href="/modules">
            <Button variant="outline" className="w-full">
              Browse Lessons
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 