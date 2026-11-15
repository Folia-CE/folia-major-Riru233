import React, { useMemo } from 'react';
import type { SongResult } from '../../../types';
import type { LibraryHiddenScope } from '../../core/directory/directory.contract';
import type { LibraryDeclaredActions } from '../../core/suite/suite.contract';
import { welfareHomeCards, welfareSongOfCard } from '../../core/home/welfareHome';
import { welfareSongList } from '../../../services/welfareSongs';
import BravaisHomeDirectory from './BravaisHomeDirectory';
import type { BravaisHomeChrome } from './useBravaisHomeChrome';

// src/library/suites/bravais/BravaisHomeWelfare.tsx
// bravais 首页的「福利」页签：仓库自带整首音频的那几首歌铺成一面墙，卡片就是歌（core/home/welfareHome）。
// 点一张直接放这首、队列是专区里的整串歌，不再进新的一层（isDirect，与私人 FM 卡同一种处理）；
// 墙面、缝里的标题与元数据都沿用 BravaisHomeDirectory，和别的来源一致。

const WELFARE_CARDS = welfareHomeCards();

const BravaisHomeWelfare: React.FC<{
    chrome: BravaisHomeChrome;
    directoryKey: string;
    hiddenScope: LibraryHiddenScope;
    declaredActions: LibraryDeclaredActions;
    isInteractive: boolean;
    label: string;
    onPlaySong: (song: SongResult, playlistCtx?: SongResult[], isFmCall?: boolean) => void;
}> = ({ chrome, directoryKey, hiddenScope, declaredActions, isInteractive, label, onPlaySong }) => {
    const onOpen = useMemo(() => (card: { id: string | number }) => {
        const song = welfareSongOfCard(card.id);
        if (song) onPlaySong(song, welfareSongList(), false);
    }, [onPlaySong]);
    return (
        <BravaisHomeDirectory
            chrome={chrome}
            layerKey="home:welfare"
            source="online"
            section="welfare"
            directoryKey={directoryKey}
            hiddenScope={hiddenScope}
            items={WELFARE_CARDS}
            isLoading={false}
            meta={label}
            panelTitle={label}
            declaredActions={declaredActions}
            isInteractive={isInteractive}
            onOpen={onOpen}
            isDirect={() => true}
        />
    );
};

export default BravaisHomeWelfare;
