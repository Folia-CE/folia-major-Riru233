import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { LibraryHiddenScope } from '../../core/directory/directory.contract';
import type { LibraryDeclaredActions } from '../../core/suite/suite.contract';
import type { LibraryHomeCard } from '../../core/home/homeModel.contract';
import type { LibraryCollectionDescriptor } from '../../core/collection/collection.contract';
import { welfareGroupCards, welfareGroupOfCard, welfareGroupCollection } from '../../app/welfareHome';
import BravaisHomeDirectory from './BravaisHomeDirectory';
import type { BravaisHomeChrome } from './useBravaisHomeChrome';

// src/library/suites/bravais/BravaisHomeWelfare.tsx
// bravais 首页的「福利」页签，与网格同一套结构：墙上只有两个分组的入口（版本典藏 / 限时福利），点开的是那一组的
// 集合页（与别的歌单一样进集合层，曲目由福利集合的静态资源给出）——歌不在墙上铺。
// 墙面、缝里的标题与元数据都沿用 BravaisHomeDirectory。

const BravaisHomeWelfare: React.FC<{
    chrome: BravaisHomeChrome;
    directoryKey: string;
    hiddenScope: LibraryHiddenScope;
    declaredActions: LibraryDeclaredActions;
    isInteractive: boolean;
    label: string;
    onOpenCollection: (collection: LibraryCollectionDescriptor) => void;
}> = ({ chrome, directoryKey, hiddenScope, declaredActions, isInteractive, label, onOpenCollection }) => {
    const { t } = useTranslation();
    const items = useMemo<LibraryHomeCard[]>(() => welfareGroupCards(), []);
    const onOpen = useCallback((card: LibraryHomeCard) => {
        const group = welfareGroupOfCard(card.id);
        if (!group) return;
        // 入口卡 → 那一组的集合页（已过窗口的组、或福利目录读不到时没有集合，点了什么也不发生）。
        const collection = welfareGroupCollection(group);
        if (collection) onOpenCollection(collection);
    }, [onOpenCollection]);
    return (
        <BravaisHomeDirectory
            chrome={chrome}
            layerKey="home:welfare"
            source="online"
            section="welfare"
            directoryKey={directoryKey}
            hiddenScope={hiddenScope}
            items={items}
            isLoading={false}
            meta={label}
            panelTitle={label}
            declaredActions={declaredActions}
            isInteractive={isInteractive}
            onOpen={onOpen}
        />
    );
};

export default BravaisHomeWelfare;
