// src/services/bundledSongAudio.ts
// 仓库自带音频：这几首歌直接放打包进应用的文件，不向平台要播放地址。不经过平台也就没有
// 登录、会员和试听片段这些限制（试听是平台按账号给的一段地址，见 neteaseProvider 的 freeTrialInfo）。
// 表由 assets/music/welfare-songs.json 生成：里面每条带 `audio` 的歌，就去 assets/music 找那个文件名，
// 键仍是 `<平台 id>:<歌曲 id>`。加歌只改 JSON + 落一个 mp3，这里不用动。
// 带 `welfareReasonKey` 的是福利歌曲：播放时会把这首为什么免登录放整首说一句（welfareNotice.ts）。

import songData from '../../assets/music/welfare-songs.json';
import { createSafeObjectUrl } from '../utils/blobGuards';
import { WELFARE_REASON_KEY } from './welfareSongs';

type BundledSongAudio = {
    url: string;
    /** 福利歌曲的缘由，文案在 i18n 里；没有这一项就只是自带音频，不提示。 */
    welfareReasonKey?: string;
};

/** `assets/music/*.mp3` 的打包地址，按文件名索引。目录不在仓库里，缺文件时就查不到（退回平台）。 */
const AUDIO_URLS: Record<string, string> = Object.fromEntries(
    Object.entries(
        import.meta.glob('../../assets/music/*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<
            string,
            string
        >,
    ).map(([filePath, url]) => [filePath.slice(filePath.lastIndexOf('/') + 1), url]),
);

type BundledSongRecord = {
    provider: string;
    id: number;
    audio?: string;
    reasonKey?: string;
};

const buildBundledTable = (): Record<string, BundledSongAudio> => {
    const table: Record<string, BundledSongAudio> = {};
    for (const record of (songData as { songs: readonly BundledSongRecord[] }).songs) {
        if (!record.audio) continue;
        const url = AUDIO_URLS[record.audio];
        if (!url) continue;
        table[`${record.provider}:${record.id}`] = {
            url,
            welfareReasonKey: record.reasonKey ?? WELFARE_REASON_KEY,
        };
    }
    return table;
};

const BUNDLED_SONG_AUDIO: Readonly<Record<string, BundledSongAudio>> = buildBundledTable();

const bundledEntry = (providerId: string | null | undefined, songId: string | number): BundledSongAudio | null => {
    if (!providerId) return null;
    return BUNDLED_SONG_AUDIO[`${providerId}:${String(songId)}`] ?? null;
};

/** 这首歌有没有自带音频；没有就返回 null，照常问平台。 */
export const bundledSongAudioUrl = (
    providerId: string | null | undefined,
    songId: string | number,
): string | null => bundledEntry(providerId, songId)?.url ?? null;

/** 福利歌曲的缘由文案键；不是福利歌曲就返回 null。 */
export const bundledSongWelfareReasonKey = (
    providerId: string | null | undefined,
    songId: string | number,
): string | null => bundledEntry(providerId, songId)?.welfareReasonKey ?? null;

/** 读出这份音频的 blob 地址：播放器收 blob URL，和缓存里的歌走同一条路。 */
export const loadBundledSongAudio = async (
    audioUrl: string,
): Promise<{ audioSrc: string; blobUrl: string } | null> => {
    try {
        const response = await fetch(audioUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blobUrl = createSafeObjectUrl(await response.blob());
        return blobUrl ? { audioSrc: blobUrl, blobUrl } : null;
    } catch (error) {
        // 读不到就退回平台：宁可放成试听片段，也别整首放不出来。
        console.warn('[BundledAudio] Failed to read the bundled audio; asking the platform instead', error);
        return null;
    }
};
