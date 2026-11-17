// src/components/app/playback/source/welfareNotice.ts
// 福利歌曲开始播放时的提示：这些歌放的是仓库自带的音频（services/bundledSongAudio），不向平台要
// 地址，所以账号没登录、没会员也放整首、不会有试听片段。这里把这件事和这首歌的缘由说一句。
//
// 和试听提示（previewNotice.ts）一样，只在活动播放器真的开始放的时候说，同一首歌每开始一次
// 只提示一次：暂停再放、卡顿后接着放、播放中换地址都不重复提示。

import { setStatusMessage } from '../../../../stores/useStatusMessageStore';
import { usePlaybackStore } from '../../../../stores/usePlaybackStore';
import { getOnlineProviderIdForSong, getPlaybackSongKey } from '../../../../utils/appPlaybackGuards';
import { bundledSongWelfareReasonKey } from '../../../../services/bundledSongAudio';
import { askedSongKeyRef, startOfAskedSong } from '../currentSong';

const told = new Map<string, number>();
const TOLD_LIMIT = 8;

/** 活动播放器开始放当前这首歌了：它是福利歌曲就说一句为什么。 */
export const noteWelfareSongPlaying = (t: (key: string) => string): void => {
    const { currentSong } = usePlaybackStore.getState();
    if (!currentSong) return;
    const songKey = getPlaybackSongKey(currentSong);
    // 换歌途中上一首报的 playing 不算：那一次开始已经属于上一首了。
    if (songKey !== askedSongKeyRef.current) return;
    const reasonKey = bundledSongWelfareReasonKey(getOnlineProviderIdForSong(currentSong), currentSong.id);
    if (!reasonKey) return;
    const start = startOfAskedSong();
    if (told.get(songKey) === start) return;
    told.delete(songKey);
    told.set(songKey, start);
    while (told.size > TOLD_LIMIT) {
        const oldest = told.keys().next().value;
        if (oldest === undefined) break;
        told.delete(oldest);
    }
    setStatusMessage({ type: 'info', text: t(reasonKey) });
};
