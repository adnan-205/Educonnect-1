import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:5000", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # -> Resize viewport to tablet size and verify UI layout adjusts appropriately.
        await page.goto('http://localhost:5000/', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Resize viewport to tablet size and verify UI layout adjusts appropriately.
        await page.goto('http://localhost:5000/', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Resize viewport to tablet size and verify UI layout adjusts appropriately.
        await page.goto('http://localhost:5000/', timeout=10000)
        await asyncio.sleep(3)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=Welcome to EduConnect API').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=POST /api/auth/register').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=POST /api/auth/login').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=GET /api/gigs').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=GET /api/gigs/:id').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=POST /api/gigs').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=PUT /api/gigs/:id').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=DELETE /api/gigs/:id').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=GET /api/bookings').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=GET /api/bookings/:id').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=POST /api/bookings').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=PUT /api/bookings/:id').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=GET /api/reviews?gig=&teacher=&student=').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=GET /api/reviews/:id').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=PUT /api/reviews/:id').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=DELETE /api/reviews/:id').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=GET /api/gigs/:gigId/reviews').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=GET /api/gigs/:gigId/reviews/me').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=POST /api/gigs/:gigId/reviews').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=POST /api/payments/init').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=GET /api/payments/status/:gigId').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=POST /api/payments/success/:tran_id').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=POST /api/payments/fail/:tran_id').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=POST /api/payments/cancel/:tran_id').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=POST /api/payments/ipn').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=GET /api/wallet/balance (Teacher)').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=GET /api/wallet/transactions (Teacher)').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=POST /api/wallet/withdraw (Teacher)').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=GET /api/wallet/admin/withdrawals/pending (Admin)').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=PUT /api/wallet/admin/withdrawals/:id/approve (Admin)').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=PUT /api/wallet/admin/withdrawals/:id/reject (Admin)').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=GET /api/wallet/admin/stats (Admin)').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    