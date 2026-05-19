import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { VizSlot } from "@/viz/VizSlot";

export function Landing() {
  return (
    <section className="max-w-4xl mx-auto px-6 py-16 text-center">
      <h1 className="font-display text-5xl md:text-6xl mb-4">P(Pass)</h1>
      <p className="text-xl mb-2">Bestehe die Stocha-Klausur.</p>
      <p className="text-muted-foreground mb-8">
        Das Tool nutzt Bayes-Inferenz, um deine Schwächen zu finden und gezielt zu trainieren.
      </p>
      <div className="my-8 flex justify-center">
        <VizSlot
          spec={{
            component: "GaltonBoard",
            props: { n: 14, p: 0.5, balls: 2000 },
          }}
          width={600}
          height={360}
          controlled={false}
        />
      </div>
      <Button asChild>
        <Link to="/train">Loslegen</Link>
      </Button>
    </section>
  );
}
