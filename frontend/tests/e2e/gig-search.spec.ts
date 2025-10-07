import { test, expect } from '@playwright/test';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const sampleGigs = [
  {
    _id: 'g1',
    title: 'Mathematics Basics',
    description: 'Algebra and geometry for beginners',
    category: 'Mathematics',
    price: 20,
    duration: 60,
    teacher: { _id: 't1', name: 'Alice Johnson', avatar: '' },
  },
  {
    _id: 'g2',
    title: 'Spoken English',
    description: 'Improve your fluency and vocabulary',
    category: 'English',
    price: 25,
    duration: 45,
    teacher: { _id: 't2', name: 'Bob Smith', avatar: '' },
  },
];

// E2E smoke focusing on public browse/search page with network stubbing
// This avoids auth-protected routes for CI stability

test.beforeEach(async ({ page }) => {
  // Stub the gigs list endpoint used by `gigsApi.getAllGigs()`
  await page.route(`${API_BASE}/gigs`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: sampleGigs }),
    });
  });
});

test('browse page shows searchable gigs', async ({ page }) => {
  await page.goto('/browse');

  // Input should exist
  const input = page.getByPlaceholder('Search for subjects, topics, or teachers...');
  await expect(input).toBeVisible();

  // Typing triggers client-side filtering of fetched gigs
  await input.fill('english');

  // Expect at least 1 result card renders
  await expect(page.getByText('Spoken English')).toBeVisible();
  // And category badge shows
  await expect(page.getByText('English')).toBeVisible();
});
