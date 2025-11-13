export default function Contact() {
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-4">Contact Me</h1>
      <p className="text-lg text-muted-foreground mb-8">
        You can reach me through the following channels.
      </p>

      <div className="max-w-lg space-y-4">
        {/* --- Name --- */}
        <div className="flex items-start gap-4">
          <span className="w-24 flex-shrink-0 font-semibold text-muted-foreground">
            Name:
          </span>
          <span className="font-medium">Adarsh Tiwari</span>
        </div>

        {/* --- Profession --- */}
        <div className="flex items-start gap-4">
          <span className="w-24 flex-shrink-0 font-semibold text-muted-foreground">
            Profession:
          </span>
          <span className="font-medium">Software Developer</span>
        </div>

        {/* --- Email --- */}
        <div className="flex items-start gap-4">
          <span className="w-24 flex-shrink-0 font-semibold text-muted-foreground">
            Email:
          </span>
          <a
            href="mailto:aadarshtiwarri@gmail.com"
            className="font-medium text-primary hover:underline"
          >
            aadarshtiwarri@gmail.com
          </a>
        </div>

        {/* --- Phone --- */}
        <div className="flex items-start gap-4">
          <span className="w-24 flex-shrink-0 font-semibold text-muted-foreground">
            Phone:
          </span>
          <a
            href="tel:8294818396"
            className="font-medium text-primary hover:underline"
          >
            8294818396
          </a>
        </div>
      </div>
    </div>
  );
}