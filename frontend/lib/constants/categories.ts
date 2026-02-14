import {
  BookOpen,
  FlaskConical,
  Languages,
  History,
  Monitor,
  Palette,
  Calculator,
  Code,
  type LucideIcon,
} from "lucide-react";

export interface Category {
  key: string;
  label: string;
  icon: LucideIcon;
  description: string;
  color: string; // Tailwind color class for accent
}

/**
 * Centralized category configuration for the entire application.
 * Used by: Browse page, Gig create/edit, Dashboard, Backend validation.
 * 
 * To add a new category:
 * 1. Add it here with icon and color
 * 2. Backend will automatically accept it (shares this list)
 */
export const CATEGORIES: Category[] = [
  {
    key: "Mathematics",
    label: "Mathematics",
    icon: Calculator,
    description: "Algebra, Calculus, Statistics & more",
    color: "blue",
  },
  {
    key: "Science",
    label: "Science",
    icon: FlaskConical,
    description: "Physics, Chemistry, Biology",
    color: "green",
  },
  {
    key: "English",
    label: "English",
    icon: BookOpen,
    description: "Grammar, Literature, Writing",
    color: "purple",
  },
  {
    key: "History",
    label: "History",
    icon: History,
    description: "World History, Civilizations",
    color: "amber",
  },
  {
    key: "Computer Science",
    label: "Computer Science",
    icon: Monitor,
    description: "Programming, Algorithms, Web Dev",
    color: "cyan",
  },
  {
    key: "Art",
    label: "Art",
    icon: Palette,
    description: "Drawing, Painting, Design",
    color: "pink",
  },
  {
    key: "Languages",
    label: "Languages",
    icon: Languages,
    description: "Spanish, French, German & more",
    color: "indigo",
  },
  {
    key: "Programming",
    label: "Programming",
    icon: Code,
    description: "Python, JavaScript, Java & more",
    color: "emerald",
  },
];

/** Simple string array for dropdowns and validation */
export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);

/** Get category by key */
export const getCategoryByKey = (key: string): Category | undefined => {
  return CATEGORIES.find((c) => c.key.toLowerCase() === key.toLowerCase());
};

/** Default icon for unknown categories */
export const DEFAULT_CATEGORY_ICON = BookOpen;
