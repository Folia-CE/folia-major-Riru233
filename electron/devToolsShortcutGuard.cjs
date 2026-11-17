'use strict';

// electron/devToolsShortcutGuard.cjs
// 打包后的窗口不给开 DevTools：Ctrl+Shift+I（macOS 上是菜单里同一个动作的 Cmd+Alt+I）在
// `before-input-event` 里被拦下。Electron 在把按键交给页面与菜单快捷键之前就发这个事件，所以一次
// preventDefault 同时挡住了页面和默认菜单里的「切换开发者工具」。
// 开发运行时不装（main.cjs 在那边的窗口建好后自己 openDevTools）；浏览器里打开网页版的人按
// Ctrl+Shift+I 由浏览器自己决定，这个守卫管不到。

/** 这一条输入是不是开 DevTools 的那个组合：Ctrl+Shift+I，或 macOS 的 Cmd+Alt+I。 */
const isDevToolsShortcut = (input) => {
    if (!input || input.type !== 'keyDown') return false;
    if (String(input.key || '').toLowerCase() !== 'i') return false;
    return Boolean(input.control && input.shift) || Boolean(input.meta && input.alt);
};

/** 创建守卫：每个窗口建好后 `attach` 一次。 */
const createDevToolsShortcutGuard = () => ({
    attach: (window) => {
        const { webContents } = window;
        webContents.on('before-input-event', (event, input) => {
            if (!isDevToolsShortcut(input)) return;
            event.preventDefault();
        });
    },
});

module.exports = { createDevToolsShortcutGuard, isDevToolsShortcut };
