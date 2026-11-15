import React from 'react';
import { useTranslation } from 'react-i18next';
import { BLG_LOGO_URL, BLG_PLAYER_URLS } from './welfareChampionAssets';

// src/library/suites/grid/home/WelfareChampionBanner.tsx
// 福利页顶部的冠军横幅：整幅 100% 宽，底色是 BLG 的深蓝；左边队标 + 粗体的「我们是冠军！」，
// 右边五个选手头像叠成一簇。横幅固定用这套配色，不跟日夜主题走（它就长这样）。

/** 每张头像自己的角度与上下偏移，叠起来才像一簇人，而不是一排证件照。 */
const AVATAR_TILT = [
    { rotate: -6, shift: 1 },
    { rotate: 4, shift: -2 },
    { rotate: -3, shift: 2 },
    { rotate: 6, shift: -1 },
    { rotate: -5, shift: 0 },
] as const;

const BANNER_BACKGROUND = 'linear-gradient(#0d228d,#dddd)';

export const WelfareChampionBanner: React.FC<{ className?: string }> = ({ className = '' }) => {
    const { t } = useTranslation();
    return (
        <div
            className={`relative w-full shrink-0 overflow-hidden px-4 py-2.5 md:px-5 md:py-3 ${className}`}
            style={{ background: BANNER_BACKGROUND }}
        >
            <div className="flex w-full items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-2.5 md:gap-3">
                    <img
                        src={BLG_LOGO_URL}
                        alt=""
                        draggable={false}
                        className="h-7 w-auto shrink-0 select-none md:h-8"
                    />
                    <div className="flex min-w-0 flex-col">
                        <span
                            className="truncate font-bold tracking-wide text-white"
                            style={{ fontSize: '30px', lineHeight: 1.1 }}
                        >
                            {t('home.welfareChampion')}
                        </span>
                        <span
                            className="truncate font-normal"
                            style={{ fontSize: '16px', lineHeight: 1.4, color: '#fffa' }}
                        >
                            {t('home.welfareChampionSubtitle')}
                        </span>
                    </div>
                </div>

                {/* 头像簇：负 margin 叠在一起，靠 z-index 让左边的压在右边上面一点。 */}
                <div className="flex shrink-0 items-center">
                    {BLG_PLAYER_URLS.map((url, index) => {
                        const tilt = AVATAR_TILT[index % AVATAR_TILT.length];
                        return (
                            <img
                                key={url}
                                src={url}
                                alt=""
                                draggable={false}
                                className="h-9 w-9 shrink-0 select-none rounded-full object-cover object-top ring-2 ring-white/70 md:h-10 md:w-10"
                                style={{
                                    marginLeft: index === 0 ? 0 : '-0.55rem',
                                    zIndex: BLG_PLAYER_URLS.length - index,
                                    transform: `rotate(${tilt.rotate}deg) translateY(${tilt.shift}px)`,
                                }}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default WelfareChampionBanner;
