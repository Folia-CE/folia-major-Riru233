// src/library/suites/grid/home/welfareChampionAssets.ts
// 福利页冠军横幅用的图：BLG 队标（横幅左侧 + 首页「福利」页签的小图标）与五位选手头像。
// 图片在 assets/banners/blg/，跟着构建一起打包；这里只做 ?url 的集中导入，别在组件里到处写路径。

import blgLogoUrl from '../../../../../assets/banners/blg/blg-logo.png?url';
import player1Url from '../../../../../assets/banners/blg/player-1.png?url';
import player2Url from '../../../../../assets/banners/blg/player-2.webp?url';
import player3Url from '../../../../../assets/banners/blg/player-3.png?url';
import player4Url from '../../../../../assets/banners/blg/player-4.webp?url';
import player5Url from '../../../../../assets/banners/blg/player-5.png?url';

export const BLG_LOGO_URL = blgLogoUrl;

/** 横幅右侧那一簇头像，顺序即从左到右。 */
export const BLG_PLAYER_URLS: readonly string[] = [
    player1Url,
    player2Url,
    player3Url,
    player4Url,
    player5Url,
];
