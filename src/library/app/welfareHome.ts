// src/library/app/welfareHome.ts
// 首页「福利」页签的卡片：福利歌曲（services/welfareSongs 的元数据）投影成首页卡片，网格与 bravais 同用一份。
// 卡片是「一首歌」而不是集合：type 记作 song，raw 带着整条 SongResult，点它就是播放——两套首页都按
// 「点了直接放」处理，不进任何新的一层。id 带 `welfare:` 前缀，免得与在线歌单的 id 撞在同一个目录会话里。
// 放在 app（装配层）而不是 core：core 的纯变换不读 services，而这层读的是自带音频的歌曲元数据。

import type { SongResult } from '../../types';
import { WELFARE_SONGS, findWelfareSong } from '../../services/welfareSongs';
import type { LibraryHomeCard } from '../core/home/homeModel.contract';

const WELFARE_CARD_PREFIX = 'welfare:';

/** 卡片 id（与歌曲 id 一一对应）。 */
export const welfareCardId = (songId: string | number): string => `${WELFARE_CARD_PREFIX}${String(songId)}`;

/** 卡片 id 还原成歌曲 id；不是福利卡片就返回 null。 */
export const welfareSongIdOfCard = (cardId: string | number): string | null => {
    const text = String(cardId);
    return text.startsWith(WELFARE_CARD_PREFIX) ? text.slice(WELFARE_CARD_PREFIX.length) : null;
};

/** 专区里的歌按顺序做成卡片（歌名、歌手、专辑、封面）。 */
export const welfareHomeCards = (): LibraryHomeCard[] => WELFARE_SONGS.map(({ song }) => ({
    id: welfareCardId(song.id),
    name: song.name,
    type: 'song',
    coverUrl: song.album.coverUrl,
    description: song.artists.map(entry => entry.name).join(' / '),
    summary: song.album.name,
    isVirtual: true,
    raw: song,
}));

/** 卡片（或滑块项）对应的歌；认不出来时返回 null。 */
export const welfareSongOfCard = (cardId: string | number): SongResult | null => {
    const songId = welfareSongIdOfCard(cardId);
    if (songId === null) return null;
    return findWelfareSong(songId)?.song ?? null;
};
