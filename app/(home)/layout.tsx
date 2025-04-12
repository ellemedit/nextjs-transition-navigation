import { Link } from "~/components/Link";
import { TopNavigation } from "~/components/TopNavigation";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <TopNavigation className="flex items-center">
        <Link href="/" className="text-2xl font-bold">
          Home
        </Link>
        <div className="ml-auto flex gap-4">
          <Link href="/signin">Sign In</Link>
        </div>
      </TopNavigation>
      <div className="isolate">{children}</div>
    </div>
  );
}
