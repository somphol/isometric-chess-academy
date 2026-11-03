#!/usr/bin/env node
/**
 * Static and engine checks for Isometric Chess Academy & Studio.
 * No dependencies. Run: node scripts/check.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const E = require(path.join(root, 'script.js'));

let passed = 0;
let failed = 0;
const failures = [];

function check(name, ok, detail) {
  if (ok) {
    passed++;
    console.log('  ok   ' + name);
  } else {
    failed++;
    failures.push(name + (detail ? ' — ' + detail : ''));
    console.log('  FAIL ' + name + (detail ? ' — ' + detail : ''));
  }
}

function section(name) {
  console.log('\n' + name);
}

function perft(g, depth) {
  if (depth === 0) return 1;
  const moves = E.legalMoves(g);
  if (depth === 1) return moves.length;
  let n = 0;
  for (const m of moves) {
    const c = E.cloneGame(g, false);
    E.applyInternal(c, m);
    n += perft(c, depth - 1);
  }
  return n;
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'script.js'), 'utf8');

section('Source files');
for (const file of ['index.html', 'style.css', 'script.js']) {
  check(file + ' exists', fs.existsSync(path.join(root, file)));
}
check('index.html loads style.css', /<link[^>]+href="style\.css"/.test(html));
check('index.html loads script.js', /<script[^>]+src="script\.js"/.test(html));
check('no external stylesheet', !/<link[^>]+href="https?:/i.test(html));
check('no external runtime script', !/<script[^>]+src="https?:/i.test(html));
check('no external image', !/<img[^>]+src="https?:/i.test(html));
check('no runtime network call', !/\b(fetch|XMLHttpRequest|WebSocket)\s*\(/.test(js));
check('canvas present', /<canvas[^>]+id="board"/.test(html));
check('language toggle present', /id="langBtn"/.test(html));
check('promotion modal present', /id="promotionModal"/.test(html));
check('mobile viewport meta present', /name="viewport"/.test(html));
check('CSS has isometric palette', css.includes('#00e5ff') && css.includes('#00e676'));

section('i18n symmetry');
const en = Object.keys(E.i18n.en);
const th = Object.keys(E.i18n.th);
const asym = en.filter((k) => !th.includes(k)).concat(th.filter((k) => !en.includes(k)));
check('English and Thai dictionaries have the same keys', asym.length === 0, asym.join(', '));
const staticKeys = [...html.matchAll(/data-i18n(?:-aria|-ph)?="([^"]+)"/g)].map((m) => m[1]);
const missingStatic = [...new Set(staticKeys)].filter((k) => !en.includes(k));
check('every data-i18n key exists', missingStatic.length === 0, missingStatic.join(', '));
const dynamic = new Set();
for (const m of js.matchAll(/\bt\('([^']+)'/g)) dynamic.add(m[1]);
for (const m of js.matchAll(/\btIn\('[^']+',\s*'([^']+)'/g)) dynamic.add(m[1]);
const missingDynamic = [...dynamic].filter((k) => !en.includes(k) && k !== 'blunder.');
check('every t() key exists', missingDynamic.length === 0, missingDynamic.join(', '));
check('dictionary has at least 150 keys', en.length >= 150, String(en.length));

section('Puzzle data');
let puzzles = [];
try {
  const raw = html.match(/<script type="application\/json" id="puzzle-data">([\s\S]*?)<\/script>/);
  puzzles = JSON.parse(raw[1]);
  check('puzzle JSON parses', true);
} catch (err) {
  check('puzzle JSON parses', false, err.message);
}
check('exactly five puzzles', puzzles.length === 5, String(puzzles.length));
const ids = new Set();
for (const p of puzzles) {
  check('puzzle ' + p.id + ' has both languages', !!(p.title?.en && p.title?.th && p.goal?.en && p.goal?.th && p.hint?.en && p.hint?.th && p.success?.en && p.success?.th && p.lesson?.en && p.lesson?.th));
  check('puzzle ' + p.id + ' id is unique', !ids.has(p.id));
  ids.add(p.id);
  let g;
  try {
    g = E.createGame(p.fen);
    check('puzzle ' + p.id + ' FEN is legal', E.verifyPositionSetup(g));
    check('puzzle ' + p.id + ' side to move is White', g.turn === 'w');
    const m = E.findMove(g, p.expected.from, p.expected.to, p.expected.promotion, p.expected.castle);
    check('puzzle ' + p.id + ' expected move is legal', !!m, p.expected.from + '-' + p.expected.to);
    if (m) {
      const after = E.cloneGame(g, false);
      E.playMove(after, m);
      const status = E.gameStatus(after);
      if (p.expected.mate) check('puzzle ' + p.id + ' delivers mate', status.type === 'checkmate', status.type);
      if (p.expected.check) check('puzzle ' + p.id + ' gives check', status.check);
    }
  } catch (err) {
    check('puzzle ' + p.id + ' loads', false, err.message);
  }
}

section('Full western chess rules');
let g = E.createGame();
check('start position has 20 legal moves', E.legalMoves(g).length === 20);
check('perft 1 = 20', perft(g, 1) === 20);
check('perft 2 = 400', perft(g, 2) === 400);
check('perft 3 = 8902', perft(g, 3) === 8902);
check('perft 4 = 197281', perft(g, 4) === 197281);

g = E.createGame('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1');
check('kiwipete depth 1 = 48', perft(g, 1) === 48);
check('kiwipete depth 2 = 2039', perft(g, 2) === 2039);

g = E.createGame('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1');
const ep = E.findMove(g, 'e5', 'd6');
check('en passant is legal', !!ep && ep.ep === true);
const epAfter = E.cloneGame(g, false);
E.playMove(epAfter, ep);
check('en passant removes the passed pawn', epAfter.board[E.sqIndex('d5')] === null && epAfter.board[E.sqIndex('d6')]?.type === 'p');
check('en passant SAN is exd6', epAfter.history[0]?.san === 'exd6');

g = E.createGame('4k3/8/8/8/8/8/8/4K2R w K - 0 1');
const castle = E.findMove(g, 'e1', 'g1');
check('kingside castling is legal', !!castle && castle.castle === 'K');
const castleAfter = E.cloneGame(g, false);
E.playMove(castleAfter, castle);
check('castling moves the rook to f1', castleAfter.board[E.sqIndex('f1')]?.type === 'r' && castleAfter.board[E.sqIndex('h1')] === null);
check('castling SAN is O-O', castleAfter.history[0]?.san === 'O-O');

g = E.createGame('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
const promotionMoves = E.legalMoves(g).filter((m) => m.from.f === 0 && m.from.r === 6 && m.to.r === 7);
check('promotion offers four choices', promotionMoves.length === 4 && promotionMoves.every((m) => ['q', 'r', 'b', 'n'].includes(m.promotion)));
const queenMove = promotionMoves.find((m) => m.promotion === 'q');
const promoted = E.cloneGame(g, false);
E.playMove(promoted, queenMove);
check('promoted pawn becomes a queen', promoted.board[E.sqIndex('a8')]?.type === 'q');
check('promotion SAN is a8=Q+', promoted.history[0]?.san === 'a8=Q+');

g = E.createGame('6k1/5ppp/8/8/8/8/5PPP/3Q2K1 w - - 0 1');
const mateMove = E.findMove(g, 'd1', 'd8');
const mateAfter = E.cloneGame(g, false);
E.playMove(mateAfter, mateMove);
check('back-rank mate is checkmate', E.gameStatus(mateAfter).type === 'checkmate');
check('mate SAN ends with #', mateAfter.history[0]?.san.endsWith('#'));

g = E.createGame();
const sanSeq = [['e2', 'e4'], ['e7', 'e5'], ['g1', 'f3'], ['b8', 'c6'], ['f1', 'b5'], ['g8', 'f6'], ['e1', 'g1']];
const sanOut = [];
for (const [from, to] of sanSeq) {
  const m = E.findMove(g, from, to);
  if (m) { E.playMove(g, m); sanOut.push(m.san); }
}
check('SAN sequence records e4 e5 Nf3 Nc6 Bb5 Nf6 O-O', sanOut.join(' ') === 'e4 e5 Nf3 Nc6 Bb5 Nf6 O-O', sanOut.join(' '));

g = E.createGame('6k1/8/6K1/8/8/8/8/3Q4 w - - 0 1');
const blunder = E.findMove(g, 'd1', 'd8');
const blunderAfter = E.cloneGame(g, false);
E.playMove(blunderAfter, blunder);
check('checkmate SAN is #', blunderAfter.history[0]?.san === 'Qd8#');

g = E.createGame('4k3/4q3/8/8/8/8/8/4K3 w - - 0 1');
check('black queen attacks are detected', E.inCheck(g, 'w'));
check('material balance counts the queen', E.materialBalance(g).diff === -9);

section('State file');
const statePath = path.join(root, 'state.json');
if (fs.existsSync(statePath)) {
  try {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    check('state.json parses', true);
    check('state records the project', !!state.project);
    check('state records the session', !!state.session?.id && state.session?.elapsedSeconds > 0);
    check('state records model usage', state.usage?.totalTokens > 0);
    check('state credits OpenCode', state.credits?.tool === 'OpenCode');
    check('state credits the model', !!state.credits?.modelID);
    check('state records deployment', !!state.deployment?.repository);
  } catch (err) {
    check('state.json parses', false, err.message);
  }
} else {
  console.log('  skip state.json (created at release time)');
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed) {
  console.error('\nFailures:\n' + failures.map((f) => ' - ' + f).join('\n'));
  process.exit(1);
}
