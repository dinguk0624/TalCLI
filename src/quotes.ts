export interface Quote {
  text: string;
  author: string;
}

export const QUOTES: Quote[] = [
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
  { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
  { text: "Programs must be written for people to read.", author: "Harold Abelson" },
  { text: "The best way out is always through.", author: "Robert Frost" },
  {
    text: "Do the hard jobs first. The easy jobs will take care of themselves.",
    author: "Dale Carnegie",
  },
  { text: "Focus is the art of knowing what to ignore.", author: "James Clear" },
  { text: "Well begun is half done.", author: "Aristotle" },
  { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
  { text: "Progress, not perfection.", author: "Unknown" },
  { text: "Slow is smooth, smooth is fast.", author: "Unknown" },
  {
    text: "You don't have to be great to start, but you have to start to be great.",
    author: "Zig Ziglar",
  },
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
  { text: "Experience is the name everyone gives to their mistakes.", author: "Oscar Wilde" },
  { text: "A goal without a plan is just a wish.", author: "Antoine de Saint-Exupéry" },
];

export function pickQuote(preferred?: number): Quote {
  if (
    preferred !== undefined &&
    Number.isInteger(preferred) &&
    preferred >= 0 &&
    preferred < QUOTES.length
  ) {
    return QUOTES[preferred] as Quote;
  }
  const index = Math.floor(Math.random() * QUOTES.length);
  return QUOTES[index] as Quote;
}
