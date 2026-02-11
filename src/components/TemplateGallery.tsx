import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, ShoppingCart, Users, Zap, Accessibility, Shield, Clock, Palette } from "lucide-react";

export interface Template {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: string;
  icon: React.ReactNode;
}

const TEMPLATES: Template[] = [
  // Productivity
  {
    id: "tab-manager",
    title: "Tab Manager",
    description: "Organize and manage browser tabs with grouping and quick search",
    prompt: "Create a Chrome extension that helps users organize and manage their browser tabs. Features: group tabs by domain, search tabs by title, save tab groups for later, one-click restore saved groups, show tab count badge",
    category: "Productivity",
    icon: <Zap className="h-4 w-4" />,
  },
  {
    id: "note-saver",
    title: "Quick Notes",
    description: "Save notes directly from any webpage with clipping tool",
    prompt: "Build a Chrome extension for quick note-taking. Features: capture text selection with one click, save notes with automatic page reference, organize notes by folder, search notes by keyword, export notes as markdown or PDF",
    category: "Productivity",
    icon: <Clock className="h-4 w-4" />,
  },
  {
    id: "password-strength",
    title: "Password Strength Checker",
    description: "Analyze password strength in real-time on any login form",
    prompt: "Create a Chrome extension that checks password strength. Features: real-time strength meter on password inputs, show password requirements, suggest strong passwords, warn about common passwords, display strength color codes",
    category: "Productivity",
    icon: <Shield className="h-4 w-4" />,
  },
  {
    id: "word-counter",
    title: "Word Counter",
    description: "Count words and characters on any webpage with one click",
    prompt: "Build a Chrome extension for text analysis. Features: count words and characters in selected text, show reading time estimate, detect language, save text snippets, export word frequency analysis",
    category: "Productivity",
    icon: <Code className="h-4 w-4" />,
  },

  // Social Media
  {
    id: "social-saver",
    title: "Social Media Saver",
    description: "Download posts, videos, and images from social platforms",
    prompt: "Create a Chrome extension for saving social media content. Features: download posts and videos from major platforms, batch download multiple items, organize saved content by date, show download progress",
    category: "Social Media",
    icon: <Users className="h-4 w-4" />,
  },
  {
    id: "mood-tracker",
    title: "Mood Tracker",
    description: "Track your mood throughout the day with ambient notifications",
    prompt: "Build a Chrome extension for mood tracking. Features: periodic mood check-ins with reminders, emoji-based mood selection, show mood trends over time, daily mood summary, motivational messages based on mood",
    category: "Social Media",
    icon: <Palette className="h-4 w-4" />,
  },
  {
    id: "translate-popup",
    title: "Quick Translator",
    description: "Instantly translate selected text to any language",
    prompt: "Create a Chrome extension for instant translation. Features: hover-to-translate for any text, support multiple languages, show pronunciation guide, save translation history, dark mode support",
    category: "Social Media",
    icon: <Users className="h-4 w-4" />,
  },

  // Developer Tools
  {
    id: "color-picker",
    title: "Color Picker Pro",
    description: "Extract and manage colors from any website",
    prompt: "Build a Chrome extension for color picking. Features: click to pick colors from any element, show hex, RGB, and HSL formats, save color palettes, generate color schemes, export palette as CSS or JSON",
    category: "Developer Tools",
    icon: <Palette className="h-4 w-4" />,
  },
  {
    id: "json-viewer",
    title: "JSON Formatter",
    description: "Pretty-print and validate JSON with syntax highlighting",
    prompt: "Create a Chrome extension for JSON handling. Features: auto-detect and format JSON on pages, syntax highlighting with themes, validate JSON structure, copy formatted JSON, collapse/expand sections",
    category: "Developer Tools",
    icon: <Code className="h-4 w-4" />,
  },
  {
    id: "css-inspector",
    title: "CSS Inspector",
    description: "Inspect and edit CSS styles directly in the browser",
    prompt: "Build a Chrome extension for CSS inspection. Features: click to inspect element styles, show CSS properties in readable format, edit styles in real-time, show computed styles, export selected CSS",
    category: "Developer Tools",
    icon: <Code className="h-4 w-4" />,
  },
  {
    id: "dark-toggle",
    title: "Dark Toggle",
    description: "Instantly toggle dark mode on any website",
    prompt: "Create a Chrome extension that adds dark mode to any website. Features: one-click dark mode toggle, invert colors intelligently, save preferences per site, custom dark mode themes, preserve readability",
    category: "Developer Tools",
    icon: <Zap className="h-4 w-4" />,
  },

  // Shopping & Productivity
  {
    id: "price-tracker",
    title: "Price Tracker",
    description: "Monitor price changes and get notified of deals",
    prompt: "Build a Chrome extension for price tracking. Features: track prices across e-commerce sites, get alerts when prices drop, show price history graph, compare prices across retailers, save items to watchlist",
    category: "Shopping",
    icon: <ShoppingCart className="h-4 w-4" />,
  },
  {
    id: "coupon-finder",
    title: "Coupon Finder",
    description: "Find and apply available coupons automatically at checkout",
    prompt: "Create a Chrome extension for finding coupons. Features: search for available coupons for any site, auto-apply best coupon at checkout, show savings amount, store coupon history, notify of new deals",
    category: "Shopping",
    icon: <ShoppingCart className="h-4 w-4" />,
  },

  // Accessibility
  {
    id: "readability-boost",
    title: "Readability Booster",
    description: "Improve text readability with custom fonts and spacing",
    prompt: "Build a Chrome extension for enhanced readability. Features: adjust font size and family, increase line spacing, toggle serif/sans-serif, change background color, save preferences per site, dyslexia-friendly fonts",
    category: "Accessibility",
    icon: <Accessibility className="h-4 w-4" />,
  },
  {
    id: "ad-blocker-lite",
    title: "Lightweight Ad Blocker",
    description: "Remove ads from websites while preserving site functionality",
    prompt: "Create a Chrome extension for ad blocking. Features: block common ad elements, whitelist trusted sites, show ads removed count, low memory usage, customizable blocking rules, dark mode for content",
    category: "Accessibility",
    icon: <Shield className="h-4 w-4" />,
  },
];

const CATEGORIES = [
  "All",
  "Productivity",
  "Social Media",
  "Developer Tools",
  "Shopping",
  "Accessibility",
];

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (prompt: string) => void;
}

export const TemplateGallery = ({ isOpen, onClose, onSelectTemplate }: TemplateGalleryProps) => {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredTemplates =
    selectedCategory === "All"
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === selectedCategory);

  const handleSelectTemplate = (template: Template) => {
    onSelectTemplate(template.prompt);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-2 border-foreground brutal-shadow">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-bold italic">
            EXTENSION TEMPLATES
          </DialogTitle>
          <DialogDescription className="font-mono text-sm mt-2">
            Browse {TEMPLATES.length} pre-built extension ideas organized by category. Click any to get started.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-2 bg-transparent h-auto p-0">
            {CATEGORIES.map((cat) => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="font-mono text-xs font-bold uppercase tracking-widest border-2 border-foreground data-[state=active]:bg-accent-lime data-[state=inactive]:bg-card hover:bg-card/80 transition-colors px-3 py-2"
              >
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>

          {CATEGORIES.map((category) => (
            <TabsContent
              key={category}
              value={category}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6"
            >
              {(category === "All"
                ? TEMPLATES
                : TEMPLATES.filter((t) => t.category === category)
              ).map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className="bg-card border-2 border-foreground p-4 brutal-shadow group text-left hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all duration-150"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-6 h-6 bg-foreground flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                      <div className="text-background">{template.icon}</div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-display text-sm font-bold italic uppercase">
                        {template.title}
                      </h4>
                      <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
                        {template.category}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-foreground/80 font-mono line-clamp-2">
                    {template.description}
                  </p>
                  <div className="mt-3 text-[9px] font-mono font-bold uppercase tracking-widest text-primary group-hover:text-foreground transition-colors">
                    Click to use →
                  </div>
                </button>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
