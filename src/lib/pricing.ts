export type Plan = {
  id: string;
  name: string;
  monthly: number;
  yearly: number;
  unit: string;
  summary: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
};

export const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    monthly: 0,
    yearly: 0,
    unit: "/month",
    summary: "Everything most people need, with no account.",
    features: [
      "Basic PDF tools",
      "Limited daily processing",
      "Standard processing speed",
      "Files up to 100 MB",
    ],
    cta: "Start using PDFFlow",
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 9,
    yearly: 90,
    unit: "/month",
    summary: "For people who work with documents every day.",
    features: [
      "Unlimited processing",
      "Advanced PDF tools",
      "Larger files",
      "Faster processing",
      "No ads",
      "Priority processing",
    ],
    cta: "Get Pro",
    highlighted: true,
  },
  {
    id: "business",
    name: "Business",
    monthly: 19,
    yearly: 190,
    unit: "/user/month",
    summary: "For teams that share templates, files and billing.",
    features: [
      "Everything in Pro",
      "Team management",
      "Shared workspace",
      "Central billing",
      "Usage analytics",
      "Priority support",
    ],
    cta: "Talk to us",
  },
];
