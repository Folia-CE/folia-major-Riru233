import { Gift, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { HomeViewTab } from '../../types';
import blgChampionsBanner from '../../../assets/banners/blg-worlds-2026-champions.png?url';

// src/components/modal/newFeaturesRelease.ts

type NewFeatureCard = {
    id: string;
    icon: LucideIcon;
};

/** 更新日志顶部的一张图；点它跳到首页的某个页签（先关掉日志所在的窗口）。 */
type NewFeatureBanner = {
    imageUrl: string;
    targetTab: HomeViewTab;
    /** 文案 key 前缀：`<key>.alt` 是图的说明，`<key>.hint` 是图上的跳转提示。 */
    i18nKey: string;
};

type NewFeaturesRelease = {
    i18nKey: string;
    /** 界面上写的版本（可以带渠道字母，如 0.7.29L）；不给就按 help 页的版本号显示。 */
    displayVersion?: string;
    banner?: NewFeatureBanner;
    /** 重大更新：介绍上方显示「<代号> Update · 重大更新」标签；代号不翻译，文案在 help.majorUpdateLabel。
     *  servicePack：同一重大更新的热修复版，标签改成「<代号> Update SP<n> · 重大更新」，文案在 help.servicePackLabel。 */
    majorUpdate?: { codename: string; servicePack?: number };
    features: NewFeatureCard[];
};

// Defines the current release's cards; their localized text lives under i18nKey in every locale.
export const NEW_FEATURES_RELEASE: NewFeaturesRelease = {
    i18nKey: 'releaseNotes.v0_7_28_9',
    displayVersion: '0.7.29L',
    banner: {
        imageUrl: blgChampionsBanner,
        targetTab: 'welfare',
        i18nKey: 'releaseNotes.v0_7_28_9.banner',
    },
    majorUpdate: { codename: 'Mimiambol', servicePack: 1 },
    features: [
        { id: 'blgWelfare', icon: Gift },
        { id: 'preview0729', icon: Sparkles },
    ],
};
