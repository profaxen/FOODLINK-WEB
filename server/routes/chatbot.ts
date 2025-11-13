import type { RequestHandler } from "express";

const KNOWLEDGE = {
  howItWorks:
    "Create a post with food details and pickup window. Receivers nearby request it. You accept, coordinate pickup, then mark done.",
  safety:
    "Meet in public, label allergens, keep food hygienic. Don’t share sensitive personal info.",
  createPost:
    "Go to Create Post, add title, quantity, time window, tags (veg/non‑veg), address, and images via URLs (or upload if available). Optionally use your location.",
  nearby:
    "Open Receiver Dashboard, allow location, set a distance filter. You’ll be notified when a new donation appears in range.",
  reset: "Use ‘Forgot password’ on the Auth page to receive a reset email.",
  profile:
    "Open Profile to view/edit your name and role. Changes sync to your account.",
  google:
    "On the Auth page, click ‘Continue with Google’ to sign up or log in using your Google account.",
  guest:
    "Use ‘Continue as Guest’ to browse without an account. Some actions (like posting) may require sign‑in.",
  imagesFree:
    "To avoid paid storage, paste image URLs when creating a post. You can host images on any free CDN or existing website.",
} as const;

function replyFor(message: string): { reply: string; intent: string | null } {
  const q = message.toLowerCase();

  if (/create|post|donat(e|ion)/.test(q))
    return {
      reply: KNOWLEDGE.createPost + "\nTip: " + KNOWLEDGE.imagesFree,
      intent: "create_post",
    };
  if (/(nearby|around|close|range|distance|map)/.test(q))
    return { reply: KNOWLEDGE.nearby, intent: "nearby" };
  if (/(how.*work|what.*do|help|guide)/.test(q))
    return { reply: KNOWLEDGE.howItWorks, intent: "how_it_works" };
  if (/(safe|safety|allergen|policy)/.test(q))
    return { reply: KNOWLEDGE.safety, intent: "safety" };
  if (/(reset|forgot).*password/.test(q))
    return { reply: KNOWLEDGE.reset, intent: "password_reset" };
  if (/(profile|account|name|role)/.test(q))
    return { reply: KNOWLEDGE.profile, intent: "profile" };
  if (/(google|gmail|oauth|signin|sign in|login)/.test(q))
    return { reply: KNOWLEDGE.google, intent: "google_auth" };
  if (/(guest|browse|without account)/.test(q))
    return { reply: KNOWLEDGE.guest, intent: "guest" };
  if (/(image|photo|picture).*(free|storage|cost|paid)/.test(q))
    return { reply: KNOWLEDGE.imagesFree, intent: "images_free" };

  return {
    reply:
      "I can help with posting, nearby search, safety, Google/guest sign‑in, password reset, and profile editing. Ask me anything.",
    intent: null,
  };
}

export const handleChat: RequestHandler = async (req, res) => {
  try {
    const { message } = req.body as { message?: string };
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Invalid message" });
    }

    const { reply, intent } = replyFor(message);
    return res.status(200).json({ reply, intent });
  } catch (e: any) {
    res
      .status(500)
      .json({ error: "chat_failed", details: String(e?.message ?? e) });
  }
};
