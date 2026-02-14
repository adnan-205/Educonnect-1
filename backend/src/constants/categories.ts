/**
 * Centralized category configuration for the backend.
 * Must match frontend/lib/constants/categories.ts
 */
export const ALLOWED_CATEGORIES = [
  "Mathematics",
  "Science",
  "English",
  "History",
  "Computer Science",
  "Art",
  "Languages",
  "Programming",
] as const;

export type CategoryType = typeof ALLOWED_CATEGORIES[number];

export const isValidCategory = (category: string): boolean => {
  return ALLOWED_CATEGORIES.some(
    (c) => c.toLowerCase() === category.toLowerCase()
  );
};
