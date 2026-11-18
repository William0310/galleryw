// Newsroom entries live in content.js (edited with the admin app), newest first.
import content from './content.js';

export const news = [...content.news].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
