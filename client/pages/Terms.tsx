// Helper component for structure
const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="mb-8">
    <h2 className="text-xl font-semibold mb-3">{title}</h2>
    <div className="text-muted-foreground space-y-3">{children}</div>
  </section>
);

export default function Terms() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-muted-foreground mb-10">
        Last Updated: November 13, 2025
      </p>

      <div className="max-w-4xl">
        <Section title="1. Acceptance of Terms">
          <p>
            Welcome to FoodLink ("we," "us," or "our"). By accessing or using our
            application (the "Service"), you agree to be bound by these Terms of
            Service ("Terms"). If you do not agree to these Terms, do not use the
            Service.
          </p>
        </Section>

        <Section title="2. Description of Service">
          <p>
            FoodLink is a platform that connects users who have surplus food
            ("Providers") with users seeking food ("Recipients") with the goal of
            reducing food waste and supporting the community. We are a facilitator
            and do not prepare, handle, or distribute any food ourselves.
          </p>
        </Section>

        <Section title="3. User-Generated Content">
          <p>
            You are solely responsible for the content you post, including post
            details, images, locations, and tags ("User Content"). You grant us a
            worldwide, non-exclusive, royalty-free license to host, display, and
            distribute your User Content as part of providing the Service.
          </p>
          <p>You agree not to post content that is:</p>
          <ul className="list-disc list-inside pl-4">
            <li>False, misleading, or inaccurate.</li>
            <li>Illegal, harassing, defamatory, or discriminatory.</li>
            <li>In violation of any third-party rights or privacy.</li>
          </ul>
        </Section>

        <Section title="4. Food Safety and Liability Disclaimer">
          <p className="font-semibold text-foreground">
            This is a critical section. Please read it carefully.
          </p>
          <p>
            FoodLink is a platform, not a food provider. We do not inspect,
            prepare, store, or guarantee the safety, quality, or legality of any
            food items listed on the Service. All transactions and exchanges are
            solely between the Provider and the Recipient.
          </p>
          <ul className="list-disc list-inside pl-4">
            <li>
              <strong>For Providers:</strong> You are solely responsible for
              ensuring the food you offer is safe, fresh, handled properly, and
_            </li>
            <li>
              <strong>For Recipients:</strong> You accept and consume any food
              obtained through the Service at your own discretion and{" "}
              <span className="font-bold">AT YOUR OWN RISK</span>. We urge you
              to use your best judgment, inspect food items, and ask questions
              before consuming.
            </li>
          </ul>
          <p className="font-bold">
            Release of Liability: You hereby release FoodLink, its owner (Adarsh
            Tiwari), and any affiliates from any and all claims, damages,
            illnesses, injuries, or other liabilities arising from or related
            to the food you provide or receive through the Service.
          </p>
        </Section>

        <Section title="5. Chatbot Assistant">
          <p>
            Our chatbot assistant is provided for informational purposes only.
            While we strive for accuracy, it may provide incomplete or
            incorrect information. We are not liable for any decisions made or
            actions taken based on the assistant's responses.
          </p>
        </Section>

        <Section title="6. Prohibited Conduct">
          <p>You agree not to:</p>
          <ul className="list-disc list-inside pl-4">
            <li>
              Use the Service for any commercial purposes (e.g., selling food).
            </li>
            <li>Scrape, reverse-engineer, or attempt to hack the Service.</li>
            <li>Use the Service for any illegal or malicious activity.</li>
            <li>Impersonate any person or entity.</li>
          </ul>
        </Section>

        <Section title="7. Termination">
          <p>
            We reserve the right to suspend or terminate your access to the
            Service at any time, without notice, for any reason, including
            for violation of these Terms.
          </p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>
            To the fullest extent permitted by law, FoodLink and Adarsh
            Tiwari shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages, or any loss of profits or
            revenues, arising from your use of the Service or any food
            obtained through it.
          </p>
        </Section>

        <Section title="9. Changes to Terms">
          <p>
            We may modify these Terms at any time. We will notify you of
            changes by posting the new Terms on this page. Your continued
            use of the Service after such changes constitutes your acceptance
            of the new Terms.
          </p>
        </Section>

        <Section title="10. Contact Us">
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <p>
            Adarsh Tiwari
            <br />
            <a
              href="mailto:aadarshtiwarri@gmail.com"
              className="text-primary hover:underline"
            >
              aadarshtiwarri@gmail.com
            </a>
          </p>
        </Section>
      </div>
    </div>
  );
}