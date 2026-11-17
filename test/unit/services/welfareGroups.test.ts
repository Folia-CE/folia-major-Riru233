import { describe, expect, it } from 'vitest';
import {
    WELFARE_LIMITED_SONGS,
    WELFARE_PERMANENT_SONGS,
    isWelfareCatalogAvailable,
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
//
// 目录（assets/music/welfare-songs.json）是闭源素材，不进仓库，所以这份测试在两种环境下都要成立：
// 有目录时校验数据；没有目录时校验降级——不画页签/入口卡、没有自带音频（收费歌按平台规则只能试听）。

const catalogAvailable = isWelfareCatalogAvailable();

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

    it('入口卡的 id 认得出分组', () => {
        expect(welfareGroupOfCard(welfareGroupCardId('permanent'))).toBe('permanent');
        expect(welfareGroupOfCard(welfareGroupCardId('limited'))).toBe('limited');
        // 不是福利分组的东西（歌单 id、歌曲 id）都不是入口卡。
        expect(welfareGroupOfCard('1')).toBeNull();
        expect(welfareGroupOfCard('welfare-group:unknown')).toBeNull();
    });
});

describe.runIf(catalogAvailable)('有福利目录时（本地带素材的构建）', () => {
    it('永久组的歌一直在，限时组过了窗口就是空的', () => {
        expect(welfareSongsOfGroup('permanent')).toBe(WELFARE_PERMANENT_SONGS);
        expect(WELFARE_PERMANENT_SONGS.length).toBeGreaterThan(0);
        expect(welfareSongsOfGroup('limited')).toEqual(isWelfareLimitedOpen() ? WELFARE_LIMITED_SONGS : []);
        // 播放队列里没有重复的歌：两组各管各的。
        const ids = welfareSongList().map(song => String(song.id));
        expect(new Set(ids).size).toBe(ids.length);
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

describe.runIf(!catalogAvailable)('没有福利目录时（素材没进这份构建）', () => {
    it('两组都是空的，页签那边也就不会出现', () => {
        expect(WELFARE_PERMANENT_SONGS).toEqual([]);
        expect(welfareSongsOfGroup('limited')).toEqual([]);
        expect(welfareSongList()).toEqual([]);
    });

    it('一张入口卡都不画，点不进去任何集合页', () => {
        expect(welfareGroupCards()).toEqual([]);
        expect(welfareCollectionOfCard(welfareGroupCardId('permanent'))).toBeNull();
        expect(welfareCollectionOfCard(welfareGroupCardId('limited'))).toBeNull();
    });

    it('没有自带音频：播放照常问平台，收费的歌非会员仍然只能试听', () => {
        // 平台给的这个 id 与曲目无关，关键是「查不到自带音频」——查不到就走平台那条路，
        // 平台说试听就只有试听（见 onlinePlayback 里 bundledSongAudioUrl 为 null 的分支）。
        expect(bundledSongAudioUrl('netease', 527822968)).toBeNull();
        expect(bundledSongWelfareReasonKey('netease', 527822968)).toBeNull();
    });
});
