export function assert(condition, message){ if(!condition) throw new Error(message || 'Assertion failed'); }
export function isMarkdownFileName(name){ return /\.md$/i.test(name); }
export default { assert, isMarkdownFileName }
