import { EventEmitter } from 'events';
import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

// test/unit/electron/devToolsShortcutGuard.test.ts
// The packaged window takes the DevTools combination away from the page and the default menu, and
// leaves every other key alone.
const require = createRequire(import.meta.url);
const { createDevToolsShortcutGuard, isDevToolsShortcut } = require('../../../electron/devToolsShortcutGuard.cjs') as {
    createDevToolsShortcutGuard: () => { attach: (window: unknown) => void };
    isDevToolsShortcut: (input: unknown) => boolean;
};

const makeWindow = () => {
    const window = new EventEmitter() as EventEmitter & { webContents: EventEmitter };
    window.webContents = new EventEmitter();
    return window;
};

/** Sends one input to the window and says whether the guard swallowed it. */
const sendKey = (window: EventEmitter, input: Record<string, unknown>): boolean => {
    let prevented = false;
    (window as unknown as { webContents: EventEmitter }).webContents.emit(
        'before-input-event',
        { preventDefault: () => { prevented = true; } },
        input,
    );
    return prevented;
};

describe('devToolsShortcutGuard', () => {
    it('swallows Ctrl+Shift+I and its macOS spelling', () => {
        expect(isDevToolsShortcut({ type: 'keyDown', key: 'I', control: true, shift: true })).toBe(true);
        expect(isDevToolsShortcut({ type: 'keyDown', key: 'i', meta: true, alt: true })).toBe(true);
    });

    it('leaves other combinations, key releases and non-key input alone', () => {
        expect(isDevToolsShortcut({ type: 'keyDown', key: 'i' })).toBe(false);
        expect(isDevToolsShortcut({ type: 'keyDown', key: 'i', control: true })).toBe(false);
        expect(isDevToolsShortcut({ type: 'keyUp', key: 'I', control: true, shift: true })).toBe(false);
        expect(isDevToolsShortcut({ type: 'keyDown', key: 'J', control: true, shift: true })).toBe(false);
        expect(isDevToolsShortcut(null)).toBe(false);
    });

    it('prevents the combination for the attached window only', () => {
        const guard = createDevToolsShortcutGuard();
        const main = makeWindow();
        const other = makeWindow();
        guard.attach(main);

        expect(sendKey(main, { type: 'keyDown', key: 'I', control: true, shift: true })).toBe(true);
        expect(sendKey(main, { type: 'keyDown', key: 'I', control: false, shift: true })).toBe(false);
        expect(sendKey(other, { type: 'keyDown', key: 'I', control: true, shift: true })).toBe(false);
    });
});
