// src/services/welfareSongs.ts
// 福利歌曲：仓库自带整首音频的那几首（音频表在 bundledSongAudio.ts，键是 `平台:歌曲 id`）。元数据本身写在
// assets/songs/welfare-songs.json —— 歌名、歌手、专辑、封面、时长、音频文件名都在那边，加歌只改 JSON 不用动代码。
// 这里负责把 JSON 的「文件名」换成打包后的地址（封面用 import.meta.glob 一次性收集），再按组交给界面。
//
// 福利分两组（首页福利页先给两组的入口卡，点进去才是歌）：
// - permanent：版本典藏，一直在（界面上叫「版本典藏」）。
// - limited：限时福利，只在 WELFARE_LIMITED_FROM ~ WELFARE_LIMITED_TO 这段窗口里出现，过完就整组收起来
//   （入口卡都不画，歌也不再作为福利免试听）。窗口按本机日期算，含首尾两天。

import type { Artist, SongResult } from '../types';
import songData from '../../assets/songs/welfare-songs.json';

/** 这几首为什么能免登录放整首：文案在 i18n 的 status 下，四语种都有。单首想换说法就在 JSON 里加 reasonKey。 */
export const WELFARE_REASON_KEY = 'status.songWelfareBlgWorlds2026';

/** 福利的两个分组。 */
export type WelfareGroupId = 'permanent' | 'limited';

export type WelfareSongEntry = {
    song: SongResult;
    /** 福利缘由的文案 key。 */
    reasonKey: string;
};

/** 限时福利的窗口（含首尾两天，按本机日期算）；过完最后一天整组收起。 */
export const WELFARE_LIMITED_FROM = '2026-11-15';
export const WELFARE_LIMITED_TO = '2026-12-15';

/** 本机日期写成 YYYY-MM-DD：按字符串比较，不会被时区差成前一天或后一天。 */
const localDateKey = (now: Date): string => {
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
};

/** 限时福利此刻开不开放（窗口内）。 */
export const isWelfareLimitedOpen = (now: Date = new Date()): boolean => {
    const today = localDateKey(now);
    return today >= WELFARE_LIMITED_FROM && today <= WELFARE_LIMITED_TO;
};

/** 一张图一个变量：`covers/rise.jpg` → `rise.jpg`。缺图时封面留空，墙面上画占位。 */
const coverUrls = import.meta.glob('../../assets/music/covers/*.jpg', {
    eager: true,
    query: '?url',
    import: 'default',
}) as Record<string, string>;

const fileBaseName = (filePath: string): string => filePath.slice(filePath.lastIndexOf('/') + 1);

const COVER_BY_FILE: Record<string, string> = Object.fromEntries(
    Object.entries(coverUrls).map(([filePath, url]) => [fileBaseName(filePath), url]),
);

type WelfareSongRecord = {
    groupId: WelfareGroupId;
    provider: string;
    id: number;
    name: string;
    artists: Artist[];
    album: { id?: number; name: string; cover?: string };
    durationMs: number;
    audio?: string;
    reasonKey?: string;
};

const records = (songData as { songs: readonly WelfareSongRecord[] }).songs;

const toEntry = (record: WelfareSongRecord): WelfareSongEntry => ({
    reasonKey: record.reasonKey ?? WELFARE_REASON_KEY,
    song: {
        id: record.id,
        name: record.name,
        artists: record.artists.map(artist => ({ id: artist.id, name: artist.name })),
        album: {
            id: record.album.id ?? 0,
            name: record.album.name,
            coverUrl: (record.album.cover && COVER_BY_FILE[record.album.cover]) || undefined,
        },
        durationMs: record.durationMs,
        sourceRef: { kind: 'online', providerId: record.provider, mediaId: String(record.id) },
    },
});

const entriesOfGroup = (group: WelfareGroupId): readonly WelfareSongEntry[] => (
    records.filter(record => record.groupId === group).map(toEntry)
);

/**
 * 版本典藏那一组（顺序就是 JSON 里的顺序）。`sourceRef` 让播放链路认得出平台，
 * 取音频时再由 bundledSongAudio 按同一个「平台 + 歌曲 id」命中仓库里的那份文件。
 */
export const WELFARE_PERMANENT_SONGS: readonly WelfareSongEntry[] = entriesOfGroup('permanent');

/** 限时福利：窗口内才出现在福利页，过完 2026-12-15 整组收起。加歌用 assets/songs 里的追回脚本改这份 JSON。 */
export const WELFARE_LIMITED_SONGS: readonly WelfareSongEntry[] = entriesOfGroup('limited');

const WELFARE_GROUPS: Record<WelfareGroupId, readonly WelfareSongEntry[]> = {
    permanent: WELFARE_PERMANENT_SONGS,
    limited: WELFARE_LIMITED_SONGS,
};

/** 这一组此刻的歌：限时组过了窗口就是空的，别的一直是表里那些。 */
export const welfareSongsOfGroup = (group: WelfareGroupId): readonly WelfareSongEntry[] => (
    group === 'limited' && !isWelfareLimitedOpen() ? [] : WELFARE_GROUPS[group]
);

/** 这一组此刻的歌，按顺序（点其中一首时整组当队列）。 */
export const welfareGroupSongList = (group: WelfareGroupId): SongResult[] => (
    welfareSongsOfGroup(group).map(entry => entry.song)
);

/** 全部福利歌曲：永久组 + 窗口内的限时组。 */
export const welfareSongList = (): SongResult[] => [
    ...welfareGroupSongList('permanent'),
    ...welfareGroupSongList('limited'),
];

/** 按歌曲 id 找福利歌曲（id 可能是数字或字符串）；不是福利歌曲就返回 null。 */
export const findWelfareSong = (songId: string | number): WelfareSongEntry | null => (
    [...WELFARE_PERMANENT_SONGS, ...WELFARE_LIMITED_SONGS]
        .find(entry => String(entry.song.id) === String(songId)) ?? null
);
