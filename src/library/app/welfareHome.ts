// src/library/app/welfareHome.ts
// 首页「福利」页签的卡片与集合：墙上只有两个分组的入口（版本典藏 / 限时福利），点进去是那一组的集合页
// （GridView / BravaisCollection 都从集合描述渲染，曲目直接带在描述里，见 core/collection/collection.contract 的
// WelfareGridViewCollectionDescriptor）。网格与 bravais 同用这一份。
// 入口卡的 id 带 `welfare-group:` 前缀，免得与在线歌单的 id 撞在同一个目录会话 / 导航栈里。
// 放在 app（装配层）而不是 core：core 的纯变换不读 services，而这层读的是自带音频的歌曲元数据。

import i18n from '../../i18n/config';
import {
    isWelfareCatalogAvailable,
    isWelfareLimitedOpen,
    welfareSongsOfGroup,
    type WelfareGroupId,
} from '../../services/welfareSongs';
import type { LibraryHomeCard } from '../core/home/homeModel.contract';
import type { WelfareGridViewCollectionDescriptor } from '../core/collection/collection.contract';

const WELFARE_GROUP_PREFIX = 'welfare-group:';

const GROUP_IDS: readonly WelfareGroupId[] = ['permanent', 'limited'];

/** 分组入口卡的 id，同时也是这一组集合的 id。 */
export const welfareGroupCardId = (group: WelfareGroupId): string => `${WELFARE_GROUP_PREFIX}${group}`;

/** 入口卡 / 集合 id 还原成分组；不是福利分组就返回 null。 */
export const welfareGroupOfCard = (cardId: string | number): WelfareGroupId | null => {
    const text = String(cardId);
    if (!text.startsWith(WELFARE_GROUP_PREFIX)) return null;
    const group = text.slice(WELFARE_GROUP_PREFIX.length) as WelfareGroupId;
    return GROUP_IDS.includes(group) ? group : null;
};

/** 一组的文案：名字与一行说明（永久组一直在，限时组写明什么时候结束）。 */
const groupTexts = (group: WelfareGroupId) => {
    const limited = group === 'limited';
    return {
        name: i18n.t(limited ? 'home.welfareLimited' : 'home.welfarePermanent'),
        description: i18n.t(limited ? 'home.welfareLimitedHint' : 'home.welfarePermanentHint'),
    };
};

/** 一组的入口卡：封面取这一组第一首的专辑图，还没有歌的组留空（墙面画占位）。 */
const groupEntry = (group: WelfareGroupId): LibraryHomeCard => {
    const entries = welfareSongsOfGroup(group);
    return {
        id: welfareGroupCardId(group),
        ...groupTexts(group),
        type: 'playlist',
        coverUrl: entries[0]?.song.album.coverUrl,
        trackCount: entries.length,
        isVirtual: true,
    };
};

/**
 * 福利页的入口卡：版本典藏那一组一直在；限时福利要窗口内、且真的放了歌才画（窗口过了或还没有歌时整组收起——
 * 不然点进去是一个空集合页）。这份目录本身读不到（闭源素材没进这一份构建）时一张都不画。
 */
export const welfareGroupCards = (): LibraryHomeCard[] => {
    if (!isWelfareCatalogAvailable()) return [];
    return [
        groupEntry('permanent'),
        ...(isWelfareLimitedOpen() && welfareSongsOfGroup('limited').length > 0 ? [groupEntry('limited')] : []),
    ];
};

/**
 * 一组福利的集合描述：曲目就是这一组此刻的歌（queue 顺序即列表顺序），点开的集合页由 GridView / BravaisCollection
 * 渲染，播放走自带音频（services/bundledSongAudio），不经过平台的试听限制。目录不在时返回 null（没有这页可开）。
 */
export const welfareGroupCollection = (group: WelfareGroupId): WelfareGridViewCollectionDescriptor | null => {
    if (!isWelfareCatalogAvailable()) return null;
    const entries = welfareSongsOfGroup(group);
    return {
        source: 'welfare',
        id: welfareGroupCardId(group),
        type: 'playlist',
        ...groupTexts(group),
        coverUrl: entries[0]?.song.album.coverUrl,
        trackCount: entries.length,
        tracks: entries.map(entry => entry.song),
    };
};

/** 卡片对应的集合描述；不是福利入口卡（或这一天这一组已经收起）就返回 null。 */
export const welfareCollectionOfCard = (cardId: string | number): WelfareGridViewCollectionDescriptor | null => {
    const group = welfareGroupOfCard(cardId);
    return group ? welfareGroupCollection(group) : null;
};
