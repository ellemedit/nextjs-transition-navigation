import { BackNavigationButton } from "~/components/BackNavigationButton";
import { TopNavigation } from "~/components/TopNavigation";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <TopNavigation>
        <BackNavigationButton className="text-2xl font-bold">
          Back
        </BackNavigationButton>
      </TopNavigation>
      <div className="isolate">{children}</div>
    </div>
  );
}
