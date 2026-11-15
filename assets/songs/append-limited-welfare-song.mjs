#!/usr/bin/env node
// assets/songs/append-limited-welfare-song.mjs
// 福利歌曲追加脚本（交互式，一路问答，不用记参数）。把一首歌接进福利专区，一次做完三件事——
//   1. 音频落到 assets/music/<文件名>.mp3（assets/music 在 .gitignore 里，只在本机，不进仓库）；
//   2. 封面按平台专辑图落到 assets/music/covers/<文件名>.jpg；
//   3. 往 assets/songs/welfare-songs.json 的 songs 数组末尾追加一条（元数据全在 JSON 里，
//      代码侧 welfareSongs.ts / bundledSongAudio.ts 都是数据驱动，不用改）。
//
// 用法（在仓库根目录，终端里直接跑，会一条条问你）：
//   node assets/songs/append-limited-welfare-song.mjs
//
// 中途 Ctrl+C 随时退出，已经写下的文件不会回滚（下载的音频/封面留在 assets/music 里，可以手动删）。
// 同一个 id 已经在 JSON 里时会问要不要覆盖；覆盖是原位替换那一条，其余条目顺序不动。

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MUSIC_DIR = path.join(ROOT, 'assets/music');
const COVER_DIR = path.join(MUSIC_DIR, 'covers');
const SONGS_FILE = path.join(ROOT, 'assets/songs/welfare-songs.json');

const GROUP_OPTIONS = [
    { key: 'limited', label: '限时福利（默认，过窗口自动收起）' },
    { key: 'permanent', label: '永久福利（一直在）' },
];

const die = (message) => {
    console.error(`\n✗ ${message}\n`);
    process.exit(1);
};

const log = (message = '') => console.log(message);

// 一行一行地问。自己把 prompt 写出去、答案先攒起来再消费，这样管道里预先灌好的回答也能用
// （readline 的 question() 在输入提前结束时抛 ERR_USE_AFTER_CLOSE）。
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
const pendingLines = [];
const pendingAsks = [];
let inputEnded = false;

rl.on('line', (line) => {
    const waiting = pendingAsks.shift();
    if (waiting) waiting(line);
    else pendingLines.push(line);
});
rl.on('close', () => {
    inputEnded = true;
    // 输入没了：还没问到的都当空回答（各自走默认值 / 校验）。
    while (pendingAsks.length > 0) pendingAsks.shift()('');
});
// Ctrl+C / Ctrl+D 直接退出，别把终端留在半截问答里。
rl.on('SIGINT', () => {
    log('\n已退出。');
    process.exit(130);
});

const readLine = (prompt) => {
    process.stdout.write(prompt);
    if (pendingLines.length > 0) return Promise.resolve(pendingLines.shift());
    if (inputEnded) return Promise.resolve('');
    return new Promise((resolve) => pendingAsks.push(resolve));
};

/** 问一句，返回去掉首尾空白的答案；accept 不通过就重问。 */
const ask = async (question, { fallback = '', accept } = {}) => {
    for (;;) {
        const answer = (await readLine(question)).trim();
        const value = answer || fallback;
        if (!accept || accept(value)) return value;
        log('  ↑ 这个回答不行，再来一次。');
        if (inputEnded && !answer) return value;
    }
};

const askYes = async (question) => {
    const answer = (await readLine(`${question} [y/N] `)).trim().toLowerCase();
    return answer === 'y' || answer === 'yes';
};

/** 歌名 → 文件名：只留 ASCII 字母数字，其余当分隔符；中文歌名会变空，交回给调用方兜底。 */
const slugify = (text) => text
    .normalize('NFKD')
    .replace(/[^\w\s-]+/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();

/** 平台歌曲详情：歌名、时长、专辑（含封面）、歌手。 */
const fetchSongDetail = async (id) => {
    const response = await fetch(`https://music.163.com/api/song/detail?ids=%5B${id}%5D`, {
        headers: {
            Referer: 'https://music.163.com/',
            'User-Agent': 'Mozilla/5.0 (compatible; folia-welfare-append/1.0)',
        },
    });
    if (!response.ok) die(`拉歌曲详情失败：HTTP ${response.status}`);
    const payload = await response.json();
    const song = payload?.songs?.[0];
    if (!song) die(`平台没有返回这首歌：id=${id}（id 抄错了？）`);
    return song;
};

const download = async (url, target) => {
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) return { ok: false, status: response.status };
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 1024) return { ok: false, status: `只有 ${buffer.length} 字节` };
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, buffer);
    return { ok: true, bytes: buffer.length };
};

/** ffprobe 读真实时长；没有 ffprobe 就用平台给的 duration。 */
const probeDurationMs = (file, fallbackMs) => {
    const result = spawnSync('ffprobe', [
        '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file,
    ], { encoding: 'utf8' });
    const seconds = Number.parseFloat((result.stdout ?? '').trim());
    return Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds * 1000) : fallbackMs;
};

const main = async () => {
    log('\n福利歌曲追加（Ctrl+C 随时退出）\n');

    // 1. 歌曲 id
    const songId = await ask('歌曲 id（网易云数字 id，如 2088507144）：', {
        accept: value => /^\d+$/.test(value),
    });

    // 2. 平台详情
    log('  正在拉歌曲详情…');
    const detail = await fetchSongDetail(songId);
    const album = detail.album ?? {};
    const artists = (detail.artists ?? []).map(entry => ({ id: entry.id, name: entry.name }));
    if (artists.length === 0) die('平台没给歌手，脚本没法写 artists');
    log(`  歌名：${detail.name}`);
    log(`  歌手：${artists.map(artist => artist.name).join(' / ')}`);
    log(`  专辑：${album.name ?? '(无)'}（id ${album.id ?? '?'}）`);
    log('');

    // 3. 歌名（可以改写法）
    const title = await ask(`歌名（回车用「${detail.name}」）：`, { fallback: detail.name });

    // 4. 文件名
    const slugFallback = slugify(title) || songId;
    const slug = await ask(`文件名（音频与封面都叫它，回车用「${slugFallback}」）：`, {
        fallback: slugFallback,
        accept: value => /^[\w.-]+$/.test(value),
    }).then(value => value.replace(/[^\w.-]+/g, '-').toLowerCase());

    // 5. 分组
    log('分组：');
    GROUP_OPTIONS.forEach((option, index) => log(`  [${index + 1}] ${option.label}`));
    const group = await ask('选一个（回车 1）：', {
        fallback: '1',
        accept: value => value === '1' || value === '2',
    }).then(value => GROUP_OPTIONS[Number(value) - 1].key);

    // 6. 音频来源：直链或本地文件
    log('');
    const audioUrl = await ask('音频直链（平台 mp3 地址；直接回车改用本地文件）：');
    let localFile = null;
    if (!audioUrl) {
        const filePath = await ask('本地音频路径（相对仓库根目录也行）：', {
            accept: value => value.length > 0 && existsSync(path.resolve(ROOT, value)),
        });
        localFile = path.resolve(ROOT, filePath);
    } else if (!/^https?:\/\//.test(audioUrl)) {
        die('直链要以 http(s):// 开头；本地文件请留空再填路径。');
    }

    // 7. 重复检查
    const data = JSON.parse(await readFile(SONGS_FILE, 'utf8'));
    if (!Array.isArray(data.songs)) die('welfare-songs.json 里没有 songs 数组');
    const existing = data.songs.findIndex(entry => String(entry.id) === songId);
    let replace = false;
    if (existing >= 0) {
        log('');
        log(`  注意：这个 id 已经在表里（第 ${existing + 1} 条「${data.songs[existing].name}」）。`);
        replace = await askYes('覆盖那一条？');
        if (!replace) die('没有覆盖，什么都没改。');
    }

    const audioTarget = path.join(MUSIC_DIR, `${slug}.mp3`);
    const coverTarget = path.join(COVER_DIR, `${slug}.jpg`);
    const audioExists = existsSync(audioTarget);
    const coverExists = existsSync(coverTarget);

    // 8. 确认
    log('');
    log('将要写入：');
    log(`  JSON 条目：${GROUP_OPTIONS.find(option => option.key === group).label} · ${title}`);
    log(`  音频：${path.relative(ROOT, audioTarget)}${audioExists ? '（已存在，会被覆盖）' : '（新下载/复制）'}`);
    log(`  封面：${path.relative(ROOT, coverTarget)}${coverExists ? '（已存在，跳过）' : '（按平台专辑图下载）'}`);
    log(`  ${replace ? `替换第 ${existing + 1} 条` : '追加到 songs 末尾'}`);
    log('');
    if (!(await askYes('确认写入？'))) die('已取消，什么都没改。');

    // 9. 下载 / 复制音频
    if (localFile) {
        await mkdir(MUSIC_DIR, { recursive: true });
        await copyFile(localFile, audioTarget);
        log(`  音频：${path.relative(ROOT, audioTarget)}（来自 ${path.relative(ROOT, localFile)}）`);
    } else {
        const audio = await download(audioUrl, audioTarget);
        if (!audio.ok) die(`音频下载失败：${audio.status}（直链多半过期了，回网易云重新复制一条）`);
        log(`  音频：${path.relative(ROOT, audioTarget)}（${(audio.bytes / 1024 / 1024).toFixed(1)} MB）`);
    }

    const durationMs = probeDurationMs(audioTarget, Math.round(detail.duration ?? 0));

    // 10. 封面
    if (album.picUrl && !existsSync(coverTarget)) {
        const cover = await download(album.picUrl, coverTarget);
        log(cover.ok
            ? `  封面：${path.relative(ROOT, coverTarget)}（${(cover.bytes / 1024).toFixed(0)} KB）`
            : `  封面：下载失败（${cover.status}），${path.relative(ROOT, coverTarget)} 没有写出来`);
    } else {
        log(`  封面：${existsSync(coverTarget) ? '已有，跳过' : '平台没给封面图，需要自己放一张'}`);
    }

    // 11. 写 JSON
    const record = {
        groupId: group,
        provider: 'netease',
        id: Number(songId),
        name: title,
        artists,
        album: {
            id: album.id ?? 0,
            name: album.name ?? title,
            cover: `${slug}.jpg`,
        },
        durationMs,
        audio: `${slug}.mp3`,
    };
    if (replace) data.songs[existing] = record;
    else data.songs.push(record);
    await writeFile(SONGS_FILE, `${JSON.stringify(data, null, 2)}\n`);
    log(`\n✓ 已写入 ${path.relative(ROOT, SONGS_FILE)}（共 ${data.songs.length} 条）`);
    log('  记得：assets/music 不进仓库（.gitignore），换机器构建前要把音频放回去。');
    log('  收尾：npx tsc --noEmit && npx vitest run -c vitest.config.ts test/unit/services/welfareGroups.test.ts\n');
};

main()
    .catch((error) => {
        die(error instanceof Error ? error.stack ?? error.message : String(error));
    })
    .finally(() => rl.close());
