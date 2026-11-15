import { describe, expect, it } from 'vitest';
import {
    WELFARE_LIMITED_SONGS,
    WELFARE_PERMANENT_SONGS,
    isWelfareLimitedOpen,
    welfareGroupSongList,
    welfareSongList,
    welfareSongsOfGroup,
} from '../../../src/services/welfareSongs';
import {
    welfareCollectionOfCard,
    welfareGroupCardId,
    welfareGroupCards,
    welfareGroupOfCard,
} from '../../../src/library/app/welfareHome';
import { bundledSongAudioUrl, bundledSongWelfareReasonKey } from '../../../src/services/bundledSongAudio';

// test/unit/services/welfareGroups.test.ts
// 福利分成永久与限时两组：限时组只在 2026-11-15 ~ 2026-12-15 这段窗口里出现，过完连入口卡都不画。
// 墙上只有分组入口卡；点一张进的是那一组的集合页（描述里带着整串曲目）。

/** 本机时区的某一天中午（正午不会被夏令时挪到前一天）。 */
const day = (isoDate: string): Date => new Date(`${isoDate}T12:00:00`);

describe('福利分组', () => {
    it('限时窗口含首尾两天，之前之后都关着', () => {
        expect(isWelfareLimitedOpen(day('2026-11-14'))).toBe(false);
        expect(isWelfareLimitedOpen(day('2026-11-15'))).toBe(true);
        expect(isWelfareLimitedOpen(day('2026-12-01'))).toBe(true);
        expect(isWelfareLimitedOpen(day('2026-12-15'))).toBe(true);
        expect(isWelfareLimitedOpen(day('2026-12-16'))).toBe(false);
    });

    it('永久组的歌一直在，限时组过了窗口就是空的', () => {
        expect(welfareSongsOfGroup('permanent')).toBe(WELFARE_PERMANENT_SONGS);
        expect(WELFARE_PERMANENT_SONGS.length).toBeGreaterThan(0);
        expect(welfareSongsOfGroup('limited')).toEqual(isWelfareLimitedOpen() ? WELFARE_LIMITED_SONGS : []);
        // 播放队列里没有重复的歌：两组各管各的。
        const ids = welfareSongList().map(song => String(song.id));
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('入口卡的 id 认得出分组', () => {
        expect(welfareGroupOfCard(welfareGroupCardId('permanent'))).toBe('permanent');
        expect(welfareGroupOfCard(welfareGroupCardId('limited'))).toBe('limited');
        // 不是福利分组的东西（歌单 id、歌曲 id）都不是入口卡。
        expect(welfareGroupOfCard('1')).toBeNull();
        expect(welfareGroupOfCard('welfare-group:unknown')).toBeNull();
    });

    it('墙上只有入口卡：永久组一张；限时组要窗口内且真的有歌才多一张', () => {
        const cards = welfareGroupCards();
        expect(cards[0].id).toBe(welfareGroupCardId('permanent'));
        const showLimited = isWelfareLimitedOpen() && WELFARE_LIMITED_SONGS.length > 0;
        expect(cards.map(card => card.id)).toEqual(
            showLimited
                ? [welfareGroupCardId('permanent'), welfareGroupCardId('limited')]
                : [welfareGroupCardId('permanent')],
        );
        expect(cards[0].trackCount).toBe(WELFARE_PERMANENT_SONGS.length);
    });

    it('入口卡给出的是那一组的集合描述，曲目与队列一致', () => {
        const collection = welfareCollectionOfCard(welfareGroupCardId('permanent'));
        expect(collection).not.toBeNull();
        expect(collection?.source).toBe('welfare');
        expect(collection?.type).toBe('playlist');
        expect(collection?.tracks.map(song => String(song.id)))
            .toEqual(welfareGroupSongList('permanent').map(song => String(song.id)));
        // 不是入口卡就没有集合（不会凭空造出一个空集合页）。
        expect(welfareCollectionOfCard('12345')).toBeNull();
    });

    it('元数据来自 JSON：封面解析成地址，音频能在自带音频表里命中', () => {
        const songs = welfareSongList();
        expect(songs.length).toBe(WELFARE_PERMANENT_SONGS.length + welfareSongsOfGroup('limited').length);
        for (const song of songs) {
            // 封面文件名与 assets/music/covers 对不上时这里就是空的（墙面上会画占位）。
            expect(song.album.coverUrl, `封面缺失：${song.name}`).toBeTruthy();
            const providerId = song.sourceRef?.kind === 'online' ? song.sourceRef.providerId : null;
            expect(bundledSongAudioUrl(providerId, song.id), `自带音频缺失：${song.name}`).toBeTruthy();
            expect(bundledSongWelfareReasonKey(providerId, song.id)).toBeTruthy();
        }
    });
});
