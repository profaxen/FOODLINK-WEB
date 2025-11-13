// Helper component for structure (you can place this at the top of the file)
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

export default function Privacy() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-muted-foreground mb-10">
        Last Updated: November 13, 2025
      </p>

      <div className="max-w-4xl">
        <Section title="1. Introduction">
          <p>
            FoodLink ("we," "us," or "our") is committed to protecting your
            privacy. This Privacy Policy explains how we collect, use,
            disclose, and safeguard your information when you use our mobile
            application and services (the "Service").
          </p>
          <p>
            By using the Service, you agree to the collection and use of
            information in accordance with this policy.
          </p>
        </Section>

        <Section title="2. Information We Collect">
          <p>
            We may collect information about you in a variety of ways. The
            information we may collect on the Service includes:
          </p>
          
          <p>
            <strong>Personal Data You Provide:</strong>
          </p>
          <ul className="list-disc list-inside pl-4">
            <li>
              <strong>Post Information:</strong> When you create a food post, we
              collect all the data you provide, such as the title,
              description, quantity, tags (e.g., veg/non-veg), images,
              and address or location.
            </li>
            <li>
              <strong>Chatbot Conversations:</strong> We collect and store the
              messages you send to our Chatbot Assistant, as well as the
              responses. This includes a `sessionId` stored in your
              browser's `localStorage` to maintain the conversation context.
            </li>
            <li>
              <strong>Communication:</strong> If you contact us directly (e.g.,
              via email), we may receive additional information about you.
            </li>
          </ul>

          <p className="mt-4">
            <strong>Data We Collect Automatically:</strong>
          </p>
          <ul className="list-disc list-inside pl-4">
            <li>
              <strong>Location Data:</strong> To provide features like "nearby
              posts," we may request access to or otherwise collect
              information about your device's precise or approximate
              location.
            </li>
            <li>
              <strong>Log and Usage Data:</strong> We may log information about
              your access and use of the Service, such as your IP address,
              device type, browser type, and actions taken.
            </li>
            <li>
              <strong>Service Provider Data:</strong> We use third-party
              services like Firebase to host, secure, and operate our
              application. Firebase may collect its own analytics and usage
              data.
            </li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Information">
          <p>
            We use the information we collect for various purposes, including to:
          </p>
          <ul className="list-disc list-inside pl-4">
            <li>Provide, operate, and maintain the Service.</li>
            <li>Display your food posts to other users.</li>
            <li>
              Enable you to find and connect with nearby food posts.
            </li>
            <li>
              Improve the Service, including our Chatbot Assistant, by
              analyzing chat logs and user behavior.
            </li>
            <li>Communicate with you and respond to your inquiries.</li>
            <li>Monitor for fraud and protect the security of the Service.</li>
          </ul>
        </Section>

        <Section title="4. How We Share Your Information">
          <p>
            We do not sell your personal information. We may share information
            in the following situations:
          </p>
          <ul className="list-disc list-inside pl-4">
            <li>
              <strong>With Other Users:</strong> Your food post details
              (including location/address and description) are shared
              publicly within the Service to allow other users to find them.
            </li>
            <li>
              <strong>With Service Providers:</strong> We use Firebase (a Google
              company) for database, authentication, and hosting. Your data
              is stored on Firebase servers and is subject to their
              privacy policies.
            </li>
            <li>
              <strong>For Legal Reasons:</strong> We may disclose your
              information if required by law or in response to valid requests
              by public authorities.
            </li>
          </ul>
        </Section>
        
        <Section title="5. Data Storage and Security">
          <p>
            Your information is primarily stored using Firebase, which
            provides industry-standard security measures. We take reasonable
            steps to protect your data, but please be aware that no security
            system is impenetrable. We cannot guarantee the absolute security
            of our databases or the information you transmit.
          </p>
        </Section>

        <Section title="6. Your Rights and Choices">
          <p>
            You have certain rights regarding your data. You may:
          </p>
          <ul className="list-disc list-inside pl-4">
            <li>
              Access, update, or delete the information you have provided in
              your posts.
            </li>
            <li>
              Disable location services through your device's settings,
              though this may limit the functionality of features like
              "nearby posts."
            </li>
            <li>
              Clear your browser's `localStorage` to remove your
              `sessionId`.
            </li>
          </ul>
        </Section>

        <Section title="7. Changes to This Privacy Policy">
          <p>
            We may update this Privacy Policy from time to time. We will
            notify you of any changes by posting the new policy on this page
            and updating the "Last Updated" date.
          </p>
        </Section>

        <Section title="8. Contact Us">
          <p>
            If you have any questions about this Privacy Policy, please
            contact us:
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