// Landing-page hero section (client component with animations)
import Header from '@/components/Header';

// Home route: renders only the hero — the rest lives in the Navbar
export default async function Home() {
  return (
    // Full-height container so the hero fills the viewport
    <main className="h-full">
      <Header />
    </main>
  );
}

