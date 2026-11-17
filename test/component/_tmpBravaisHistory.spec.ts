import { expect, test } from './fixtures';
import { buildServiceStubModule, LOCAL_MUSIC_SERVICE_ROUTE } from '../../dev/probes/homeBehavior/serviceStubModule';
import '../../dev/probes/homeBehavior/probeApi';

// 临时视觉核对：修复合并后的 Grid3D 页头 + 搜索历史。跑完删掉。

const out = 'C:/Users/11251/AppData/Local/Temp/folia-settings-shots/';

const seedHistory = (page) => page.addInitScript(() => {
    localStorage.setItem('folia_home_search_history_v1', JSON.stringify([
        'blue train',
        'coltrane',
        'mingus ah um',
        'bill evans',
    ]));
});

const mountHome = async (mount, page, suite: 'grid' | 'bravais') => {
    await page.route(LOCAL_MUSIC_SERVICE_ROUTE, route => route.fulfill({ contentType: 'text/javascript', body: buildServiceStubModule() }));
    await mount('homeBehavior');
    await expect.poll(() => page.evaluate(() => window.__homeProbe?.ready() ?? false), { timeout: 30_000 }).toBe(true);
    await page.evaluate(s => window.__homeProbe!.setSuite(s), suite);
    await page.waitForTimeout(1600);
};

test.describe('desktop', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('grid head + search history', async ({ mount, page }) => {
        await seedHistory(page);
        await mountHome(mount, page, 'grid');
        await page.screenshot({ path: out + 'grid-head.png' });
        await page.locator('input[placeholder*="Search"]').first().click();
        await page.waitForTimeout(600);
        const info = await page.evaluate(() => {
            const panel = document.querySelector('[data-testid="home-search-history"]');
            const input = document.querySelector('input[placeholder*="Search"]');
            const i = input?.getBoundingClientRect();
            const p = panel?.getBoundingClientRect();
            const head = document.querySelector('[data-home-tab]')?.getBoundingClientRect();
            return {
                hasPanel: !!panel,
                tags: panel ? panel.querySelectorAll('.rounded-full').length : 0,
                input: i ? { x: Math.round(i.x), y: Math.round(i.y) } : null,
                panel: p ? { x: Math.round(p.x), y: Math.round(p.y), w: Math.round(p.width) } : null,
                firstTabY: head ? Math.round(head.y) : null,
                belowInput: !!(p && i && p.top >= i.bottom - 1),
            };
        });
        console.log('GRID_DESKTOP', JSON.stringify(info));
        await page.screenshot({ path: out + 'grid-search-history.png' });
    });

    test('bravais seam search history', async ({ mount, page }) => {
        await seedHistory(page);
        await mountHome(mount, page, 'bravais');
        await page.keyboard.press('/');
        await expect(page.locator('[data-bravais-seam]')).toHaveAttribute('data-bravais-seam', 'search');
        await page.waitForTimeout(600);
        const info = await page.evaluate(() => {
            const history = document.querySelector('[data-bravais-search-history]');
            const button = document.querySelector('[data-bravais-seam-action="submit-search"]');
            const b = button?.getBoundingClientRect();
            const h = history?.getBoundingClientRect();
            return {
                hasHistory: !!history,
                tagCount: history ? history.querySelectorAll('.bravais-search-history-tag').length : 0,
                belowButton: !!(b && h && h.top >= b.bottom - 1),
            };
        });
        console.log('BRAVAIS', JSON.stringify(info));
        await page.screenshot({ path: out + 'bravais-search-history.png' });
    });
});

test.describe('compact', () => {
    test.use({ viewport: { width: 420, height: 820 } });

    test('compact search layer + history', async ({ mount, page }) => {
        await seedHistory(page);
        await mountHome(mount, page, 'grid');
        const toggle = page.getByTestId('home-search-toggle');
        await expect(toggle).toBeVisible();
        await toggle.click();
        await page.waitForTimeout(700);
        const info = await page.evaluate(() => {
            const panel = document.querySelector('[data-testid="home-search-history"]');
            const input = document.querySelector('input[placeholder*="Search"]');
            const i = input?.getBoundingClientRect();
            const p = panel?.getBoundingClientRect();
            return {
                hasPanel: !!panel,
                input: i ? { x: Math.round(i.x), y: Math.round(i.y), w: Math.round(i.width) } : null,
                panel: p ? { x: Math.round(p.x), y: Math.round(p.y), w: Math.round(p.width) } : null,
                belowInput: !!(p && i && p.top >= i.bottom - 1),
                insideViewport: p ? p.right <= window.innerWidth + 1 : null,
            };
        });
        console.log('GRID_COMPACT', JSON.stringify(info));
        await page.screenshot({ path: out + 'grid-search-history-compact.png' });
    });
});
