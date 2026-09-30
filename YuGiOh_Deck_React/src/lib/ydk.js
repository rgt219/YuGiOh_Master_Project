// Reading and writing the .ydk deck file format. Pure functions, no browser APIs.

/** Returns { main, extra, side } as arrays of card ID strings (duplicates kept, one per copy). */
export const parseYdk = (content) => {
    const result = { main: [], extra: [], side: [] };
    let section = 'main';

    String(content || '').split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        if (trimmed === '#main') section = 'main';
        else if (trimmed === '#extra') section = 'extra';
        else if (trimmed === '!side' || trimmed === '#side') section = 'side';
        else if (trimmed.startsWith('#') || trimmed.startsWith('!')) return; // comments such as "#created by ..."
        else if (/^\d+$/.test(trimmed)) result[section].push(trimmed);
    });

    return result;
};

/** Each argument is an array of card IDs. */
export const buildYdk = ({ main = [], extra = [], side = [] }) =>
    ['#created by ErreGeTe YGO', '#main', ...main, '#extra', ...extra, '!side', ...side].join('\n') + '\n';
