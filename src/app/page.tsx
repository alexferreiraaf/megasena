import { fetchLastTenResults } from "@/lib/actions";
import { LotteryTrackerClient } from "@/components/lottery-tracker-client";

export const revalidate = 300; // Revalidate every 5 minutes

export default async function Home() {
  const { data: initialResults, error: initialError } = await fetchLastTenResults();

  return (
    <main className="flex min-h-screen w-full items-start justify-center bg-background p-4 sm:p-8 transition-colors duration-300">
      <LotteryTrackerClient initialResults={initialResults} initialError={initialError} />
    </main>
  );
}
