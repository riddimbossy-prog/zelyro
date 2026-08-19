import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/legal")({ component: Legal });

function Legal() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link to="/" className="font-display text-2xl">
        Zelyro
      </Link>
      <h1 className="mt-8 font-display text-4xl">Legal placeholders</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        These documents must be reviewed by qualified counsel before launch. They exist so the product
        has a door to the real policies.
      </p>
      <ul className="mt-8 space-y-6 text-sm leading-relaxed">
        <li>
          <strong>Terms of Service.</strong> Use of Zelyro, accounts, acceptable use, and termination.
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
      </ul>
    </main>
  );
}
