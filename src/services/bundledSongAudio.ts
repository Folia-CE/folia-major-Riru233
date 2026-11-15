// src/services/bundledSongAudio.ts
// 仓库自带音频：这几首歌直接放打包进应用的文件，不向平台要播放地址。不经过平台也就没有
// 登录、会员和试听片段这些限制（试听是平台按账号给的一段地址，见 neteaseProvider 的 freeTrialInfo）。
// 键是 `<平台 id>:<歌曲 id>`，值是 Vite 打进构建产物的资源地址：网页版与桌面版都能读到。
// 带 `welfareReasonKey` 的是福利歌曲：播放时会把这首为什么免登录放整首说一句（welfareNotice.ts）。

import legendsNeverDieRemixUrl from '../../assets/music/legends-never-die-alan-walker-remix.mp3?url';
import legendsNeverDieUrl from '../../assets/music/legends-never-die.mp3?url';
import flashFunkUrl from '../../assets/music/flash-funk.mp3?url';
import riseUrl from '../../assets/music/rise.mp3?url';
import camelotRiseAndFallUrl from '../../assets/music/camelot-rise-and-fall-djyaha-remix.mp3?url';
import { createSafeObjectUrl } from '../utils/blobGuards';

type BundledSongAudio = {
    url: string;
    /** 福利歌曲的缘由，文案在 i18n 里；没有这一项就只是自带音频，不提示。 */
    welfareReasonKey?: string;
};

const BUNDLED_SONG_AUDIO: Readonly<Record<string, BundledSongAudio>> = {
    // Legends Never Die (Alan Walker Remix) - Against the Current, Alan Walker, Mako
    // https://music.163.com/#/song?id=527822968
    'netease:527822968': {
        url: legendsNeverDieRemixUrl,
        welfareReasonKey: 'status.songWelfareBlgWorlds2026',
    },
    // Legends Never Die - 英雄联盟, Against the Current
    // https://music.163.com/#/song?id=506196018
    'netease:506196018': {
        url: legendsNeverDieUrl,
        welfareReasonKey: 'status.songWelfareBlgWorlds2026',
    },
    // Flash Funk - 英雄联盟, Marshmello
    // https://music.163.com/#/song?id=400161903
    'netease:400161903': {
        url: flashFunkUrl,
        welfareReasonKey: 'status.songWelfareBlgWorlds2026',
    },
    // RISE - 英雄联盟, Mako, The Word Alive, The Glitch Mob
    // https://music.163.com/#/song?id=1313107065
    'netease:1313107065': {
        url: riseUrl,
        welfareReasonKey: 'status.songWelfareBlgWorlds2026',
    },
    // Camelot - Rise and Fall[DjYaha Remix2017] - DjYaha
    // https://music.163.com/#/song?id=478419032
    'netease:478419032': {
        url: camelotRiseAndFallUrl,
        welfareReasonKey: 'status.songWelfareBlgWorlds2026',
    },
};

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
