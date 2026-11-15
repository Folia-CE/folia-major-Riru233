// src/services/welfareSongs.ts
// 福利歌曲：仓库自带整首音频的那几首（音频表在 bundledSongAudio.ts，键是 `平台:歌曲 id`）。这里放的是
// 在界面上显示它们需要的元数据——歌名、歌手、专辑、封面——首页的「福利」页签直接读这份列表。
// 元数据取自平台（music.163.com 的歌曲详情），封面也一并下载进仓库：福利专区不依赖网络也能画出来。
// 音频与元数据两边靠同一对「平台 + 歌曲 id」对齐，改一边记得改另一边。

import type { Artist, SongResult } from '../types';
import coverLegendsNeverDieRemix from '../../assets/music/covers/legends-never-die-alan-walker-remix.jpg?url';
import coverLegendsNeverDie from '../../assets/music/covers/legends-never-die.jpg?url';
import coverFlashFunk from '../../assets/music/covers/flash-funk.jpg?url';

/** 这几首为什么能免登录放整首：文案在 i18n 的 status 下，四语种都有。 */
export const WELFARE_REASON_KEY = 'status.songWelfareBlgWorlds2026';

export type WelfareSongEntry = {
    song: SongResult;
    /** 福利缘由的文案 key。 */
    reasonKey: string;
};

const artist = (id: number, name: string): Artist => ({ id, name });

/**
 * 福利歌曲（顺序就是专区的顺序）。三首都是网易云的歌，`sourceRef` 让播放链路认得出平台，
 * 取音频时再由 bundledSongAudio 命中仓库里的那份文件。
 */
export const WELFARE_SONGS: readonly WelfareSongEntry[] = [
    {
        reasonKey: WELFARE_REASON_KEY,
        song: {
            id: 527822968,
            name: 'Legends Never Die (Alan Walker Remix)',
            artists: [
                artist(783418, 'Against the Current'),
                artist(1045123, 'Alan Walker'),
                artist(68192, 'Mako'),
            ],
            album: {
                id: 37154046,
                name: '《英雄联盟》赛事主题曲合辑',
                coverUrl: coverLegendsNeverDieRemix,
            },
            durationMs: 167173,
            sourceRef: { kind: 'online', providerId: 'netease', mediaId: '527822968' },
        },
    },
    {
        reasonKey: WELFARE_REASON_KEY,
        song: {
            id: 506196018,
            name: 'Legends Never Die',
            artists: [
                artist(1047337, '英雄联盟'),
                artist(783418, 'Against the Current'),
            ],
            album: {
                id: 75816481,
                name: 'Legends Never Die',
                coverUrl: coverLegendsNeverDie,
            },
            durationMs: 235000,
            sourceRef: { kind: 'online', providerId: 'netease', mediaId: '506196018' },
        },
    },
    {
        reasonKey: WELFARE_REASON_KEY,
        song: {
            id: 400161903,
            name: 'Flash Funk',
            artists: [
                artist(1047337, '英雄联盟'),
                artist(1060019, 'Marshmello'),
            ],
            album: {
                id: 34429106,
                name: 'Warsongs',
                coverUrl: coverFlashFunk,
            },
            durationMs: 221408,
            sourceRef: { kind: 'online', providerId: 'netease', mediaId: '400161903' },
        },
    },
];

/** 专区里的歌，按顺序（播放时整张当队列）。 */
export const welfareSongList = (): SongResult[] => WELFARE_SONGS.map(entry => entry.song);

/** 按歌曲 id 找福利歌曲（id 可能是数字或字符串）；不是福利歌曲就返回 null。 */
export const findWelfareSong = (songId: string | number): WelfareSongEntry | null => (
    WELFARE_SONGS.find(entry => String(entry.song.id) === String(songId)) ?? null
);
