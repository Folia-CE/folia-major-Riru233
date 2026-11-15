import React, { useCallback, useMemo, useState } from 'react';
import type { SongResult, Theme } from '../../../../types';
import type { LibraryHiddenScope } from '../../../core/directory/directory.contract';
import type { LibraryDeclaredActions } from '../../../core/suite/suite.contract';
import { welfareHomeCards, welfareSongOfCard } from '../../../core/home/welfareHome';
import { welfareSongList } from '../../../../services/welfareSongs';
import DesktopGrid3DSurface from './DesktopGrid3DSurface';
import type { Grid3DSliderItem } from './Grid3DSlider';

// src/library/suites/grid/home/WelfareGrid3DSurface.tsx
// 首页「福利」页签的网格：仓库自带整首音频的那几首歌，按首页同一套卡片铺开（封面、歌名、歌手、专辑）。
// 点一张就是放这首，队列是专区里的整串歌；它没有目录、没有加载态，也不进 GridView——卡片本身就是一首歌。
// 卡片数据来自 core/home/welfareHome，与 bravais 的同一页签同源。

interface WelfareGrid3DSurfaceProps {
    title: string;
    mapButtonLabel: string;
    theme: Theme;
    isDaylight: boolean;
    isInteractive: boolean;
    hasFloatingPlayer: boolean;
    directoryKey: string;
    hiddenScope: LibraryHiddenScope;
    declaredActions?: LibraryDeclaredActions;
    onPlaySong: (song: SongResult, playlistCtx?: SongResult[], isFmCall?: boolean) => void;
}

const WelfareGrid3DSurface: React.FC<WelfareGrid3DSurfaceProps> = ({
    title,
    mapButtonLabel,
    theme,
    isDaylight,
    isInteractive,
    hasFloatingPlayer,
    directoryKey,
    hiddenScope,
    declaredActions,
    onPlaySong,
}) => {
    const [focusedIndex, setFocusedIndex] = useState(0);
    // 卡片内容固定（三首歌写死在 services/welfareSongs）：每次渲染重建数组只会让墙白白重排。
    const items = useMemo<Grid3DSliderItem[]>(() => welfareHomeCards().map(card => ({
        id: card.id,
        name: card.name,
        coverUrl: card.coverUrl,
        description: card.description,
        summary: card.summary,
        type: card.type,
    })), []);
    const handleSelect = useCallback((item: Grid3DSliderItem) => {
        const song = welfareSongOfCard(item.id);
        if (!song) return;
        onPlaySong(song, welfareSongList(), false);
    }, [onPlaySong]);

    return (
        <DesktopGrid3DSurface
            focusMemoryScope="welfare"
            title={title}
            mapButtonLabel={mapButtonLabel}
            items={items}
            focusedIndex={focusedIndex}
            onFocusedIndexChange={setFocusedIndex}
            onSelect={handleSelect}
            isLoading={false}
            theme={theme}
            isDaylight={isDaylight}
            isInteractive={isInteractive}
            hasFloatingPlayer={hasFloatingPlayer}
            playlistVisibilityScope={hiddenScope}
            directoryKey={directoryKey}
            declaredHomeActions={declaredActions}
        />
    );
};

export default WelfareGrid3DSurface;
