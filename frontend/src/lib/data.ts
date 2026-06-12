import { BookOpen, Briefcase, Coins, TrendingUp } from "lucide-react";

export const AVAILABLE_MODELS = [
  { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", provider: "gemini" },
  { id: "gemini-3.1-pro", name: "Gemini 3.1 Pro", provider: "gemini" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "gemini" },
  { id: "gpt-4o", name: "GPT-4o", provider: "openai" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai" },
];

export const SUGGESTIONS = [
  {
    title: "Analyze market trends",
    description:
      "Get insights on current trends, sector moves, and indicators.",
    prompt:
      "Analyze current market trends in the technology sector vs the energy sector.",
    icon: TrendingUp,
  },
  {
    title: "De-jargon financial terms",
    description: "Understand complex corporate finance metrics easily.",
    prompt:
      "Explain the difference between EBITDA, operating cash flow, and free cash flow.",
    icon: Coins,
  },
  {
    title: "Optimize portfolio strategy",
    description:
      "Learn core principles of asset allocation and diversification.",
    prompt:
      "What are the core strategies for building a growth-focused, diversified investment portfolio?",
    icon: Briefcase,
  },
  {
    title: "Evaluate financial health",
    description: "Analyze company balance sheets, ratios, and risk factors.",
    prompt:
      "How do I check a company's liquidity and debt safety using its balance sheet?",
    icon: BookOpen,
  },
];
