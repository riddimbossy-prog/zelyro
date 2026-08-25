import { createFileRoute } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand-mark";

export const Route = createFileRoute("/legal")({ component: Legal });

function Legal() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <BrandMark />
      <h1 className="mt-8 font-display text-4xl">Legal</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        These documents must be reviewed by qualified counsel before launch. They exist so the product
        has a door to the real policies.
      </p>
      <ul className="mt-8 space-y-6 text-sm leading-relaxed">
        <li>
          <strong>Terms of Service.</strong> Use of VerzZify, accounts, acceptable use, and termination.
        </li>
        <li>
          <strong>Privacy Policy.</strong> What we collect, why, and how to export or delete.
        </li>
        <li>
          <strong>Creator Agreement.</strong> You warrant you have rights to distribute the upload.
        </li>
        <li>
          <strong>Copyright Policy.</strong> DMCA-style notice, takedown, payout freeze.
        </li>
        <li>
          <strong>Refund Policy.</strong> Digital goods, tickets, livestream access.
        </li>
        <li>
          <strong>Community Guidelines</strong> and <strong>Ticket Terms.</strong>
        </li>
        <li>
          <strong>YouTube.</strong> VerzZify uses the official YouTube Data API and official YouTube
          player for discovery and playback of YouTube-hosted videos. By using those features you also
          agree to the{" "}
          <a
            className="text-primary underline-offset-2 hover:underline"
            href="https://www.youtube.com/t/terms"
            target="_blank"
            rel="noopener noreferrer"
          >
            YouTube Terms of Service
          </a>
          . YouTube content is not offered for offline download. Our own catalog, tickets, and studio
          tools are independent of YouTube.
        </li>
      </ul>
    </main>
  );
}
