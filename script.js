/* ============================================================
   Isometric Chess Academy & Studio — script.js
   One file, no dependencies:
   1. Chess engine (full rules, SAN, FEN, perft-friendly)
   2. Isometric canvas renderer (hand-built vector pieces)
   3. Academy coaching, blunder guard, puzzle drills
   4. Bilingual UI, Web Audio, localStorage, PGN / JSON export
   ============================================================ */
(function (global) {
  'use strict';

  var HAS_DOM = typeof document !== 'undefined';
  var FILES = 'abcdefgh';
  var START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  var VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  var STORAGE_KEY = 'isometricChessAcademy.v1';
  var CLOCK_START = 600;

  /* ==========================================================
     PART 1 — CHESS ENGINE
     ========================================================== */

  function other(color) { return color === 'w' ? 'b' : 'w'; }
  function inside(f, r) { return f >= 0 && f < 8 && r >= 0 && r < 8; }
  function idx(f, r) { return r * 8 + f; }
  function sqName(f, r) { return FILES[f] + (r + 1); }
  function sqIndex(name) {
    if (typeof name !== 'string' || name.length < 2) return -1;
    var f = FILES.indexOf(name[0].toLowerCase());
    var r = parseInt(name[1], 10) - 1;
    return inside(f, r) ? idx(f, r) : -1;
  }
  function sqToFR(name) {
    var i = sqIndex(name);
    return i < 0 ? null : { f: i % 8, r: Math.floor(i / 8) };
  }
  function cloneGame(g, keepHistory) {
    var board = new Array(64);
    for (var i = 0; i < 64; i++) {
      var p = g.board[i];
      board[i] = p ? { type: p.type, color: p.color } : null;
    }
    return {
      board: board,
      turn: g.turn,
      castling: { wK: g.castling.wK, wQ: g.castling.wQ, bK: g.castling.bK, bQ: g.castling.bQ },
      ep: g.ep,
      halfmove: g.halfmove,
      fullmove: g.fullmove,
      history: keepHistory ? g.history.slice() : [],
      positionCounts: keepHistory ? Object.assign({}, g.positionCounts) : {}
    };
  }

  function loadFen(g, fen) {
    var parts = String(fen).trim().split(/\s+/);
    var rows = parts[0].split('/');
    if (rows.length !== 8) throw new Error('Bad FEN: ' + fen);
    g.board = new Array(64).fill(null);
    for (var ri = 0; ri < 8; ri++) {
      var row = rows[ri];
      var r = 7 - ri;
      var f = 0;
      for (var c = 0; c < row.length; c++) {
        var ch = row[c];
        if (ch >= '1' && ch <= '8') { f += parseInt(ch, 10); continue; }
        var lower = ch.toLowerCase();
        if ('pnbrqk'.indexOf(lower) === -1) throw new Error('Bad FEN piece: ' + ch);
        if (!inside(f, r)) throw new Error('Bad FEN row: ' + row);
        g.board[idx(f, r)] = { type: lower, color: ch === ch.toUpperCase() ? 'w' : 'b' };
        f++;
      }
      if (f !== 8) throw new Error('Bad FEN width: ' + row);
    }
    g.turn = parts[1] === 'b' ? 'b' : 'w';
    var cs = parts[2] || '-';
    g.castling = {
      wK: cs.indexOf('K') !== -1,
      wQ: cs.indexOf('Q') !== -1,
      bK: cs.indexOf('k') !== -1,
      bQ: cs.indexOf('q') !== -1
    };
    g.ep = parts[3] && parts[3] !== '-' ? sqIndex(parts[3]) : null;
    g.halfmove = parseInt(parts[4] || '0', 10) || 0;
    g.fullmove = parseInt(parts[5] || '1', 10) || 1;
    return g;
  }

  function toFen(g) {
    var rows = [];
    for (var r = 7; r >= 0; r--) {
      var row = '', empty = 0;
      for (var f = 0; f < 8; f++) {
        var p = g.board[idx(f, r)];
        if (!p) { empty++; continue; }
        if (empty) { row += empty; empty = 0; }
        row += p.color === 'w' ? p.type.toUpperCase() : p.type;
      }
      if (empty) row += empty;
      rows.push(row);
    }
    var castle = '';
    if (g.castling.wK) castle += 'K';
    if (g.castling.wQ) castle += 'Q';
    if (g.castling.bK) castle += 'k';
    if (g.castling.bQ) castle += 'q';
    if (!castle) castle = '-';
    var ep = g.ep != null ? sqName(g.ep % 8, Math.floor(g.ep / 8)) : '-';
    return rows.join('/') + ' ' + g.turn + ' ' + castle + ' ' + ep + ' ' + g.halfmove + ' ' + g.fullmove;
  }

  function posKey(g) {
    var parts = toFen(g).split(' ');
    return parts[0] + ' ' + parts[1] + ' ' + parts[2] + ' ' + parts[3];
  }

  function createGame(fen) {
    var g = {
      board: new Array(64).fill(null),
      turn: 'w',
      castling: { wK: false, wQ: false, bK: false, bQ: false },
      ep: null,
      halfmove: 0,
      fullmove: 1,
      history: [],
      positionCounts: {}
    };
    loadFen(g, fen || START_FEN);
    g.positionCounts[posKey(g)] = 1;
    return g;
  }

  function pieceAt(g, f, r) {
    return inside(f, r) ? g.board[idx(f, r)] : null;
  }

  function findKing(g, color) {
    for (var i = 0; i < 64; i++) {
      var p = g.board[i];
      if (p && p.type === 'k' && p.color === color) {
        return { f: i % 8, r: Math.floor(i / 8) };
      }
    }
    return null;
  }

  var KNIGHT_STEPS = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
  var DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  var ORTHO = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  var ALL_DIRS = DIAG.concat(ORTHO);

  function isAttacked(g, f, r, by) {
    // Pawns
    var pawnRank = by === 'w' ? r - 1 : r + 1;
    for (var df = -1; df <= 1; df += 2) {
      var pp = pieceAt(g, f + df, pawnRank);
      if (pp && pp.color === by && pp.type === 'p') return true;
    }
    // Knights
    for (var i = 0; i < KNIGHT_STEPS.length; i++) {
      var np = pieceAt(g, f + KNIGHT_STEPS[i][0], r + KNIGHT_STEPS[i][1]);
      if (np && np.color === by && np.type === 'n') return true;
    }
    // King
    for (var kf = -1; kf <= 1; kf++) {
      for (var kr = -1; kr <= 1; kr++) {
        if (!kf && !kr) continue;
        var kp = pieceAt(g, f + kf, r + kr);
        if (kp && kp.color === by && kp.type === 'k') return true;
      }
    }
    // Sliding pieces
    for (var d = 0; d < ALL_DIRS.length; d++) {
      var dir = ALL_DIRS[d];
      var ff = f + dir[0], rr = r + dir[1];
      while (inside(ff, rr)) {
        var sp = pieceAt(g, ff, rr);
        if (sp) {
          if (sp.color === by) {
            if (sp.type === 'q') return true;
            if (dir[0] !== 0 && dir[1] !== 0 && sp.type === 'b') return true;
            if ((dir[0] === 0 || dir[1] === 0) && sp.type === 'r') return true;
          }
          break;
        }
        ff += dir[0]; rr += dir[1];
      }
    }
    return false;
  }

  function inCheck(g, color) {
    var k = findKing(g, color);
    return k ? isAttacked(g, k.f, k.r, other(color)) : false;
  }

  function makeMoveObj(f, r, tf, tr, extra) {
    var m = {
      from: { f: f, r: r },
      to: { f: tf, r: tr },
      piece: null,
      color: null,
      promotion: null,
      castle: null,
      ep: false,
      captured: null,
      san: ''
    };
    if (extra) for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) m[k] = extra[k];
    return m;
  }

  function generatePseudo(g, color, onlyIndex) {
    var out = [];
    var rank = color === 'w' ? 0 : 7;
    var promoRank = color === 'w' ? 7 : 0;

    function addPawn(f, r, tf, tr, ep) {
      if (tr === promoRank) {
        ['q', 'r', 'b', 'n'].forEach(function (promo) {
          out.push(makeMoveObj(f, r, tf, tr, { promotion: promo, ep: !!ep }));
        });
      } else {
        out.push(makeMoveObj(f, r, tf, tr, { ep: !!ep }));
      }
    }

    for (var r = 0; r < 8; r++) {
      for (var f = 0; f < 8; f++) {
        var i = idx(f, r);
        if (onlyIndex != null && i !== onlyIndex) continue;
        var p = g.board[i];
        if (!p || p.color !== color) continue;

        if (p.type === 'p') {
          var dir = color === 'w' ? 1 : -1;
          var oneR = r + dir;
          if (inside(f, oneR) && !g.board[idx(f, oneR)]) {
            addPawn(f, r, f, oneR, false);
            var startRank = color === 'w' ? 1 : 6;
            if (r === startRank && !g.board[idx(f, r + dir * 2)]) {
              addPawn(f, r, f, r + dir * 2, false);
            }
          }
          for (var pd = -1; pd <= 1; pd += 2) {
            var tf = f + pd, tr = r + dir;
            if (!inside(tf, tr)) continue;
            var target = g.board[idx(tf, tr)];
            if (target && target.color !== color) {
              addPawn(f, r, tf, tr, false);
            } else if (!target && g.ep != null && g.ep === idx(tf, tr)) {
              addPawn(f, r, tf, tr, true);
            }
          }
          continue;
        }

        if (p.type === 'n') {
          for (var n = 0; n < KNIGHT_STEPS.length; n++) {
            var nf = f + KNIGHT_STEPS[n][0], nr = r + KNIGHT_STEPS[n][1];
            if (!inside(nf, nr)) continue;
            var np = g.board[idx(nf, nr)];
            if (!np || np.color !== color) out.push(makeMoveObj(f, r, nf, nr));
          }
          continue;
        }

        if (p.type === 'b' || p.type === 'r' || p.type === 'q') {
          var dirs = p.type === 'b' ? DIAG : p.type === 'r' ? ORTHO : ALL_DIRS;
          for (var d = 0; d < dirs.length; d++) {
            var ff = f + dirs[d][0], rr = r + dirs[d][1];
            while (inside(ff, rr)) {
              var sp = g.board[idx(ff, rr)];
              if (!sp) {
                out.push(makeMoveObj(f, r, ff, rr));
              } else {
                if (sp.color !== color) out.push(makeMoveObj(f, r, ff, rr));
                break;
              }
              ff += dirs[d][0]; rr += dirs[d][1];
            }
          }
          continue;
        }

        if (p.type === 'k') {
          for (var kf = -1; kf <= 1; kf++) {
            for (var kr = -1; kr <= 1; kr++) {
              if (!kf && !kr) continue;
              var kxf = f + kf, kyr = r + kr;
              if (!inside(kxf, kyr)) continue;
              var kp = g.board[idx(kxf, kyr)];
              if (!kp || kp.color !== color) out.push(makeMoveObj(f, r, kxf, kyr));
            }
          }
          if (f === 4 && r === rank) {
            var enemy = other(color);
            var kingSafe = !isAttacked(g, 4, rank, enemy);
            var rights = g.castling[color + 'K'];
            var rookK = g.board[idx(7, rank)];
            if (rights && kingSafe && rookK && rookK.type === 'r' && rookK.color === color &&
                !g.board[idx(5, rank)] && !g.board[idx(6, rank)] &&
                !isAttacked(g, 5, rank, enemy) && !isAttacked(g, 6, rank, enemy)) {
              out.push(makeMoveObj(4, rank, 6, rank, { castle: 'K' }));
            }
            var rightsQ = g.castling[color + 'Q'];
            var rookQ = g.board[idx(0, rank)];
            if (rightsQ && kingSafe && rookQ && rookQ.type === 'r' && rookQ.color === color &&
                !g.board[idx(3, rank)] && !g.board[idx(2, rank)] && !g.board[idx(1, rank)] &&
                !isAttacked(g, 3, rank, enemy) && !isAttacked(g, 2, rank, enemy)) {
              out.push(makeMoveObj(4, rank, 2, rank, { castle: 'Q' }));
            }
          }
        }
      }
    }
    return out;
  }

  function applyInternal(g, m) {
    var fromI = idx(m.from.f, m.from.r);
    var toI = idx(m.to.f, m.to.r);
    var p = g.board[fromI];
    if (!p) throw new Error('No piece on ' + sqName(m.from.f, m.from.r));
    var captured = null;

    if (m.ep) {
      var capI = idx(m.to.f, m.from.r);
      captured = g.board[capI];
      g.board[capI] = null;
    } else {
      captured = g.board[toI];
    }

    g.board[fromI] = null;
    g.board[toI] = m.promotion ? { type: m.promotion, color: p.color } : p;

    if (m.castle) {
      if (m.castle === 'K') {
        g.board[idx(5, m.from.r)] = g.board[idx(7, m.from.r)];
        g.board[idx(7, m.from.r)] = null;
      } else {
        g.board[idx(3, m.from.r)] = g.board[idx(0, m.from.r)];
        g.board[idx(0, m.from.r)] = null;
      }
    }

    if (p.type === 'k') {
      g.castling[p.color + 'K'] = false;
      g.castling[p.color + 'Q'] = false;
    }
    if (p.type === 'r') {
      if (m.from.f === 0 && m.from.r === 0) g.castling.wQ = false;
      if (m.from.f === 7 && m.from.r === 0) g.castling.wK = false;
      if (m.from.f === 0 && m.from.r === 7) g.castling.bQ = false;
      if (m.from.f === 7 && m.from.r === 7) g.castling.bK = false;
    }
    if (captured && captured.type === 'r') {
      if (m.to.f === 0 && m.to.r === 0) g.castling.wQ = false;
      if (m.to.f === 7 && m.to.r === 0) g.castling.wK = false;
      if (m.to.f === 0 && m.to.r === 7) g.castling.bQ = false;
      if (m.to.f === 7 && m.to.r === 7) g.castling.bK = false;
    }

    if (p.type === 'p' && Math.abs(m.to.r - m.from.r) === 2) {
      g.ep = idx(m.from.f, (m.from.r + m.to.r) / 2);
    } else {
      g.ep = null;
    }

    if (p.type === 'p' || captured) g.halfmove = 0;
    else g.halfmove += 1;
    if (p.color === 'b') g.fullmove += 1;
    g.turn = other(p.color);
    return captured;
  }

  var moveCache = new Map();

  function legalMoves(g, color) {
    color = color || g.turn;
    var key = posKey(g) + '|' + color;
    if (moveCache.has(key)) return moveCache.get(key);
    var pseudo = generatePseudo(g, color);
    var legal = [];
    for (var i = 0; i < pseudo.length; i++) {
      var test = cloneGame(g, false);
      applyInternal(test, pseudo[i]);
      if (!inCheck(test, color)) legal.push(pseudo[i]);
    }
    if (moveCache.size > 800) moveCache.clear();
    moveCache.set(key, legal);
    return legal;
  }

  function sanBase(g, m) {
    var piece = g.board[idx(m.from.f, m.from.r)];
    if (m.castle === 'K') return 'O-O';
    if (m.castle === 'Q') return 'O-O-O';
    var capture = !!m.ep || !!g.board[idx(m.to.f, m.to.r)];
    var dest = sqName(m.to.f, m.to.r);
    var s = '';
    if (piece.type === 'p') {
      if (capture) s += FILES[m.from.f] + 'x';
      s += dest;
      if (m.promotion) s += '=' + m.promotion.toUpperCase();
      return s;
    }
    s += piece.type.toUpperCase();
    var all = legalMoves(g, piece.color);
    var ambiguous = all.filter(function (x) {
      return x.to.f === m.to.f && x.to.r === m.to.r &&
        !(x.from.f === m.from.f && x.from.r === m.from.r) &&
        g.board[idx(x.from.f, x.from.r)] &&
        g.board[idx(x.from.f, x.from.r)].type === piece.type;
    });
    if (ambiguous.length) {
      var sameFile = ambiguous.some(function (x) { return x.from.f === m.from.f; });
      var sameRank = ambiguous.some(function (x) { return x.from.r === m.from.r; });
      if (!sameFile) s += FILES[m.from.f];
      else if (!sameRank) s += (m.from.r + 1);
      else s += sqName(m.from.f, m.from.r);
    }
    if (capture) s += 'x';
    s += dest;
    return s;
  }

  function playMove(g, m) {
    var piece = g.board[idx(m.from.f, m.from.r)];
    if (!piece) throw new Error('Illegal move: no piece');
    m.color = piece.color;
    m.piece = piece.type;
    var fenBefore = toFen(g);
    var capture = !!m.ep || !!g.board[idx(m.to.f, m.to.r)];
    var base = sanBase(g, m);
    var captured = applyInternal(g, m);
    var suffix = '';
    if (inCheck(g, g.turn)) {
      suffix = legalMoves(g, g.turn).length ? '+' : '#';
    }
    m.san = base + suffix;
    m.captured = captured ? { type: captured.type, color: captured.color } : null;
    m.fenBefore = fenBefore;
    m.fenAfter = toFen(g);
    delete m._capture;
    g.history.push(m);
    var key = posKey(g);
    g.positionCounts[key] = (g.positionCounts[key] || 0) + 1;
    return m;
  }

  function findMove(g, fromName, toName, promotion, castle) {
    var from = sqToFR(fromName), to = sqToFR(toName);
    if (!from || !to) return null;
    var moves = legalMoves(g, g.turn);
    for (var i = 0; i < moves.length; i++) {
      var m = moves[i];
      if (m.from.f === from.f && m.from.r === from.r && m.to.f === to.f && m.to.r === to.r) {
        if (promotion && m.promotion !== promotion) continue;
        if (castle && m.castle !== castle) continue;
        return m;
      }
    }
    return null;
  }

  function verifyPositionSetup(g) {
    var dummy = cloneGame(g, false);
    return !inCheck(dummy, other(dummy.turn));
  }

  function insufficientMaterial(g) {
    var minors = [], pawnsOrMajor = false;
    for (var i = 0; i < 64; i++) {
      var p = g.board[i];
      if (!p || p.type === 'k') continue;
      if (p.type === 'p' || p.type === 'r' || p.type === 'q') { pawnsOrMajor = true; break; }
      minors.push({ type: p.type, color: p.color, f: i % 8, r: Math.floor(i / 8) });
    }
    if (pawnsOrMajor) return false;
    if (minors.length === 0) return true;
    if (minors.length === 1) return true;
    if (minors.length === 2 && minors[0].type === 'b' && minors[1].type === 'b' &&
        minors[0].color !== minors[1].color) {
      var c0 = (minors[0].f + minors[0].r) % 2;
      var c1 = (minors[1].f + minors[1].r) % 2;
      if (c0 === c1) return true;
    }
    return false;
  }

  function gameStatus(g) {
    var moves = legalMoves(g, g.turn);
    var check = inCheck(g, g.turn);
    if (!moves.length) return { type: check ? 'checkmate' : 'stalemate', check: check };
    if (g.halfmove >= 100) return { type: 'draw', reason: 'fifty', check: check };
    if (g.positionCounts[posKey(g)] >= 3) return { type: 'draw', reason: 'threefold', check: check };
    if (insufficientMaterial(g)) return { type: 'draw', reason: 'material', check: check };
    return { type: check ? 'check' : 'normal', check: check, moves: moves.length };
  }

  function materialBalance(g) {
    var w = 0, b = 0;
    for (var i = 0; i < 64; i++) {
      var p = g.board[i];
      if (!p) continue;
      if (p.color === 'w') w += VALUE[p.type];
      else b += VALUE[p.type];
    }
    return { white: w, black: b, diff: w - b };
  }

  function attackersOf(g, f, r, by) {
    var pseudo = generatePseudo(g, by);
    var res = [];
    for (var i = 0; i < pseudo.length; i++) {
      var m = pseudo[i];
      if (m.castle) continue;
      if (m.to.f === f && m.to.r === r) {
        var p = g.board[idx(m.from.f, m.from.r)];
        if (p) res.push({ type: p.type, color: p.color, f: m.from.f, r: m.from.r, square: sqName(m.from.f, m.from.r) });
      }
    }
    return res;
  }

  function kingSafeAfter(g, m) {
    var test = cloneGame(g, false);
    applyInternal(test, m);
    return !inCheck(test, m.color);
  }

  function analyzeBlunder(g, move) {
    // g is the position after the move; g.turn is the opponent.
    if (!move || !move.color || move.san === '#' || move.san.indexOf('++') !== -1) return null;
    var mover = move.color;
    var opp = other(mover);
    var target = g.board[idx(move.to.f, move.to.r)];
    if (!target || target.type === 'k') return null;

    var attackers = attackersOf(g, move.to.f, move.to.r, opp)
      .sort(function (a, b) { return VALUE[a.type] - VALUE[b.type]; });
    var defenders = attackersOf(g, move.to.f, move.to.r, mover);
    var movedValue = VALUE[target.type];
    var best = null;

    if (attackers.length) {
      var cheapest = attackers[0];
      var loss = movedValue - VALUE[cheapest.type];
      if (!defenders.length && movedValue >= 3) {
        best = {
          kind: 'hanging',
          severity: movedValue >= 5 ? 'high' : 'medium',
          piece: target.type,
          square: sqName(move.to.f, move.to.r),
          attacker: cheapest.type,
          attackerSquare: cheapest.square,
          loss: movedValue
        };
      } else if (defenders.length && loss >= 2 && movedValue >= 5) {
        best = {
          kind: 'exchange',
          severity: loss >= 4 ? 'high' : 'medium',
          piece: target.type,
          square: sqName(move.to.f, move.to.r),
          attacker: cheapest.type,
          attackerSquare: cheapest.square,
          loss: loss
        };
      }
    }

    // Did the move allow a mate in one?
    var replies = legalMoves(g, opp);
    for (var i = 0; i < replies.length; i++) {
      var reply = replies[i];
      var test = cloneGame(g, false);
      applyInternal(test, reply);
      if (inCheck(test, test.turn) && legalMoves(test, test.turn).length === 0) {
        var mate = {
          kind: 'mate',
          severity: 'high',
          san: sanBase(g, reply) + '#',
          loss: 0
        };
        if (!best || best.severity !== 'high') best = mate;
        break;
      }
    }
    return best;
  }

  var Engine = {
    START_FEN: START_FEN,
    VALUE: VALUE,
    createGame: createGame,
    cloneGame: cloneGame,
    loadFen: loadFen,
    toFen: toFen,
    posKey: posKey,
    pieceAt: pieceAt,
    findKing: findKing,
    legalMoves: legalMoves,
    generatePseudo: generatePseudo,
    applyInternal: applyInternal,
    playMove: playMove,
    findMove: findMove,
    inCheck: inCheck,
    isAttacked: isAttacked,
    gameStatus: gameStatus,
    materialBalance: materialBalance,
    insufficientMaterial: insufficientMaterial,
    analyzeBlunder: analyzeBlunder,
    attackersOf: attackersOf,
    sanBase: sanBase,
    sqName: sqName,
    sqIndex: sqIndex,
    sqToFR: sqToFR,
    verifyPositionSetup: verifyPositionSetup,
    kingSafeAfter: kingSafeAfter
  };


  /* ==========================================================
     PART 2 — LOCALISATION
     ========================================================== */

  var I18N = {
    en: {
      'app.title': 'Isometric Chess Academy & Studio',
      'app.subtitle': 'Learn the royal game on a hand-built 2.5D board.',
      'a11y.skip': 'Skip to the board',
      'a11y.lang': 'Switch language between English and Thai',
      'a11y.sound': 'Toggle sound effects',
      'a11y.board': 'Isometric chess board. Click a piece, then a highlighted square to move.',
      'btn.newGame': 'New game',
      'btn.undo': 'Undo',
      'btn.undoLearn': 'Undo & learn',
      'btn.guard': 'Blunder guard',
      'btn.flip': 'Flip board',
      'btn.exportPgn': 'Export PGN',
      'btn.exportJson': 'Export JSON',
      'btn.reset': 'Reset',
      'btn.keep': 'Keep the move',
      'btn.close': 'Got it',
      'btn.playAgain': 'Play again',
      'btn.review': 'Review board',
      'mode.casual': 'Casual play',
      'mode.academy': 'Academy',
      'mode.puzzle': 'Puzzle {n} / {total}',
      'promo.eyebrow': 'Pawn reached the last rank',
      'promo.title': 'Promote your pawn',
      'promo.note': 'Most players choose a queen. A knight can be stronger in rare endings.',
      'piece.pawn': 'Pawn',
      'piece.knight': 'Knight',
      'piece.bishop': 'Bishop',
      'piece.rook': 'Rook',
      'piece.queen': 'Queen',
      'piece.king': 'King',
      'side.white': 'White',
      'side.black': 'Black',
      'clock.toMove': 'to move',
      'turn.white': 'White to move',
      'turn.black': 'Black to move',
      'turn.check': 'Check!',
      'turn.gameOver': 'Game over',
      'turn.yourMove': 'Your move',
      'tab.play': 'Play',
      'tab.academy': 'Academy',
      'tab.puzzles': 'Puzzles',
      'coach.title': "Coach's corner",
      'coach.subtitle': 'Gentle nudges, never a lecture.',
      'coach.learningMode': 'Learning mode',
      'coach.mood': 'Beginner friendly',
      'coach.warn': 'Watch out',
      'coach.good': 'Well played',
      'coach.off': 'Learning mode is off. The coach will stay quiet until you switch it back on.',
      'coach.offTh': 'ปิดโหมดเรียนรู้อยู่ โค้ชจะเงียบจนกว่าคุณจะเปิดอีกครั้ง',
      'status.title': 'Position',
      'status.normal': 'Normal',
      'status.check': 'Check',
      'status.checkmate': 'Checkmate',
      'status.stalemate': 'Stalemate',
      'status.draw': 'Draw',
      'status.material': 'Material',
      'status.moves': 'Moves',
      'status.phase': 'Phase',
      'status.captured': 'Captured',
      'status.even': 'Even',
      'status.whiteAhead': 'White +{n}',
      'status.blackAhead': 'Black +{n}',
      'phase.opening': 'Opening',
      'phase.middlegame': 'Middlegame',
      'phase.endgame': 'Endgame',
      'history.title': 'Move history',
      'history.no': '#',
      'history.empty': 'No moves yet. White begins — try e4 or d4.',
      'history.ply': '{n} ply',
      'learn.eyebrow': "Coach's note",
      'learn.blunderTitle': 'That move has a problem',
      'learn.whyTitle': 'Why that move was risky',
      'learn.undone': 'Move undone. Look for a safer idea.',
      'end.eyebrow': 'Game complete',
      'end.checkmate': 'Checkmate',
      'end.stalemate': 'Stalemate',
      'end.draw': 'Draw',
      'end.time': 'Time out',
      'end.checkmateText': '{winner} delivered checkmate. The king has no legal escape.',
      'end.stalemateText': 'The side to move has no legal move, but the king is not in check. The game is a draw.',
      'end.drawText': 'The game ended in a draw: {reason}.',
      'end.timeText': '{winner} won on time. The other clock ran out.',
      'end.moves': 'Moves',
      'end.material': 'Material',
      'end.blunders': 'Blunders',
      'academy.title': 'Piece inspector',
      'academy.tag': 'Academy',
      'academy.intro': 'Click any piece on the board, or choose one below. Its history, value and movement light up on the board.',
      'academy.pick': 'Pick a piece to begin',
      'academy.pickBody': 'Every piece has a personality, a point value and a story. The board will show its paths.',
      'academy.value': 'Point value',
      'academy.movement': 'How it moves',
      'academy.role': 'Its role',
      'academy.story': 'A little history',
      'academy.lessons': 'Three quiet rules',
      'academy.rule1': 'Develop before you attack. Knights and bishops first, queen later.',
      'academy.rule2': 'Castle by move ten when you can. A safe king is worth more than a pawn.',
      'academy.rule3': 'Before every move, ask what your opponent threatens — not what you hope.',
      'puzzles.title': 'Mini-puzzle drills',
      'puzzles.tag': 'Drills',
      'puzzles.intro': 'Five calm little puzzles, loaded from local JSON. Each one teaches a single idea you will use in real games.',
      'puzzles.streak': 'Current streak',
      'puzzles.best': 'Best streak',
      'puzzles.attempts': 'Attempts',
      'puzzles.hint': 'Hint',
      'puzzles.retry': 'Retry',
      'puzzles.yourTurn': 'Your turn',
      'puzzles.solvedTag': 'Solved',
      'puzzles.newTag': 'New',
      'puzzles.solution': 'The idea',
      'puzzles.next': 'Next puzzle',
      'puzzles.backToGame': 'Back to game',
      'puzzles.solvedEyebrow': 'Puzzle solved',
      'puzzles.solvedTitle': 'Lovely work',
      'puzzles.allSolved': 'All five puzzles are solved. Beautiful pattern work.',
      'puzzles.why': 'Why puzzles work',
      'academy.fullLesson': 'Full lesson',
      'puzzles.whyBody': 'Patterns are chess vocabulary. Five minutes a day trains your eye to notice a back rank, a loose piece or a knight fork before it costs you a game.',
      'puzzles.level': 'Level {n}',
      'puzzles.solvedPill': 'Solved',
      'puzzles.activePill': 'Active',
      'foot.saved': 'Progress saves in this browser',
      'foot.clear': 'Clear saved data',
      'foot.built': 'Built by',
      'foot.with': 'with',
      'foot.offline': 'One page, no frameworks, no network.',
      'message.welcome': 'Welcome. Click a piece to see its paths.',
      'message.resume': 'Your last game was restored.',
      'message.notMove': 'That square is not a legal destination.',
      'message.wrongPuzzle': 'Not quite. Look for the idea in the hint.',
      'message.undo': 'Move undone.',
      'message.saved': 'Saved in this browser.',
      'message.cleared': 'Saved data cleared.',
      'message.soundOn': 'Sound on.',
      'message.soundOff': 'Sound off.',
      'message.copied': 'Download ready.',
      'message.flipped': 'Board flipped.',
      'message.puzzleLoad': 'Puzzle loaded. You are White.',
      'message.guardOn': 'Blunder guard on.',
      'message.guardOff': 'Blunder guard off.',
      'message.learningOn': 'Learning mode on.',
      'message.learningOff': 'Learning mode off.',
      'message.confirmClear': 'Clear the saved game, puzzle streaks and settings?',
      'message.illegal': 'That move is not legal.',
      'message.checkHint': 'Your king is in check. Block, capture or move the king.',
      'message.puzzleSolved': 'Puzzle solved. The idea is now yours.',
      'message.kept': 'Move kept. Watch that piece.',
      'message.exported': 'Progress exported.',
      'message.exportPgn': 'PGN game exported.',
      'message.puzzleAll': 'Every puzzle is solved — try a casual game.',
      'blunder.hangingEn': 'Your {piece} on {square} can be captured by the {attacker} on {from}, and nothing is defending it. That is a {loss}-point gift.',
      'blunder.hangingTh': '{piece}ของคุณที่ {square} ถูก {attacker} ที่ {from} โจมตี และไม่มีอะไรป้องกัน เสียฟรี {loss} คะแนน',
      'blunder.exchangeEn': 'Your {piece} on {square} is attacked by a cheaper {attacker} from {from}. If the trade happens, you lose about {loss} points.',
      'blunder.exchangeTh': '{piece}ของคุณที่ {square} ถูก {attacker} ที่ถูกกว่าจาก {from} โจมตี ถ้าแลกกันคุณจะเสียประมาณ {loss} คะแนน',
      'blunder.mateEn': 'This move allows {san}. There is no defence: the next move is checkmate.',
      'blunder.mateTh': 'หมากนี้อนุญาตให้เล่น {san} ป้องกันไม่ได้ เพราะหมากถัดไปคือรุกจน',
      'blunder.tipEn': 'Before you move, ask: is this piece safe on its new square?',
      'blunder.tipTh': 'ก่อนเดิน ถามตัวเองว่า: หมากตัวนี้ปลอดภัยบนช่องใหม่หรือไม่?',
      'blunder.mateTipEn': 'When you are ahead, check every opponent check and capture. One careless move is enough.',
      'blunder.mateTipTh': 'เมื่อได้เปรียบ ให้ตรวจการเช็คและการกินทุกครั้งของคู่ต่อสู้ เพราะหมากพลาดครั้งเดียวก็พอ',
      'blunder.tip': 'Before you move, ask: is this piece safe on its new square?',
      'blunder.mateTip': 'When you are ahead, check every opponent check and capture. One careless move is enough.',
      'blunder.safe': 'The move was undone, so nothing is lost. Look for a developing move, a capture, or a check.',
      'blunder.safeTh': 'ย้อนหมากแล้ว ไม่มีอะไรเสียหาย มองหาการเดินพัฒนาหมาก การกิน หรือการเช็ค',
      'a11y.moveAnnounce': '{side} played {san}.'
    },
    th: {
      'app.title': 'สถาบันหมากรุกไอโซเมตริก & สตูดิโอ',
      'app.subtitle': 'เรียนหมากรุกบนกระดาน 2.5D ที่สร้างด้วยมือ',
      'a11y.skip': 'ข้ามไปที่กระดาน',
      'a11y.lang': 'สลับภาษาระหว่างอังกฤษและไทย',
      'a11y.sound': 'เปิดหรือปิดเสียง',
      'a11y.board': 'กระดานหมากรุกไอโซเมตริก คลิกหมาก แล้วคลิกช่องที่ไฮไลต์เพื่อเดิน',
      'btn.newGame': 'เกมใหม่',
      'btn.undo': 'ย้อนกลับ',
      'btn.undoLearn': 'ย้อน & เรียนรู้',
      'btn.guard': 'การ์ดกันพลาด',
      'btn.flip': 'พลิกกระดาน',
      'btn.exportPgn': 'ส่งออก PGN',
      'btn.exportJson': 'ส่งออก JSON',
      'btn.reset': 'รีเซ็ต',
      'btn.keep': 'เก็บหมากนี้',
      'btn.close': 'เข้าใจแล้ว',
      'btn.playAgain': 'เล่นอีกครั้ง',
      'btn.review': 'ดูกระดาน',
      'mode.casual': 'เล่นสบาย ๆ',
      'mode.academy': 'ห้องเรียนรู้',
      'mode.puzzle': 'โจทย์ {n} / {total}',
      'promo.eyebrow': 'เบี้ยไปถึงแถวสุดท้าย',
      'promo.title': 'เลื่อนขั้นเบี้ย',
      'promo.note': 'ผู้เล่นส่วนใหญ่เลือกควีน แต่ในบางเกมท้าย ๆ อัศวินแข็งกว่าก็มี',
      'piece.pawn': 'เบี้ย',
      'piece.knight': 'อัศวิน',
      'piece.bishop': 'บิชอป',
      'piece.rook': 'เรือ',
      'piece.queen': 'ควีน',
      'piece.king': 'ราชา',
      'side.white': 'ขาว',
      'side.black': 'ดำ',
      'clock.toMove': 'ตาที่เดิน',
      'turn.white': 'ขาวเดิน',
      'turn.black': 'ดำเดิน',
      'turn.check': 'ถูกเช็ค!',
      'turn.gameOver': 'เกมจบ',
      'turn.yourMove': 'ตาของคุณ',
      'tab.play': 'เล่น',
      'tab.academy': 'เรียนรู้',
      'tab.puzzles': 'โจทย์',
      'coach.title': 'มุมโค้ช',
      'coach.subtitle': 'คำแนะนำนุ่มนวล ไม่ใช่การบรรยาย',
      'coach.learningMode': 'โหมดเรียนรู้',
      'coach.mood': 'เป็นมิตรกับมือใหม่',
      'coach.warn': 'ระวัง',
      'coach.good': 'เล่นได้ดี',
      'coach.off': 'ปิดโหมดเรียนรู้อยู่ โค้ชจะเงียบจนกว่าคุณจะเปิดอีกครั้ง',
      'coach.offTh': 'Learning mode is off. The coach will stay quiet until you switch it back on.',
      'status.title': 'ตำแหน่ง',
      'status.normal': 'ปกติ',
      'status.check': 'ถูกเช็ค',
      'status.checkmate': 'รุกจน',
      'status.stalemate': 'จนแต้ม',
      'status.draw': 'เสมอ',
      'status.material': 'กำลังหมาก',
      'status.moves': 'จำนวนหมาก',
      'status.phase': 'ช่วงเกม',
      'status.captured': 'หมากที่ถูกกิน',
      'status.even': 'เท่ากัน',
      'status.whiteAhead': 'ขาว +{n}',
      'status.blackAhead': 'ดำ +{n}',
      'phase.opening': 'เปิดเกม',
      'phase.middlegame': 'กลางเกม',
      'phase.endgame': 'ท้ายเกม',
      'history.title': 'ประวัติการเดิน',
      'history.no': '#',
      'history.empty': 'ยังไม่มีการเดิน ขาวเริ่มก่อน — ลอง e4 หรือ d4',
      'history.ply': '{n} ตา',
      'learn.eyebrow': 'บันทึกโค้ช',
      'learn.blunderTitle': 'หมากนี้มีปัญหา',
      'learn.whyTitle': 'ทำไมหมากนั้นจึงเสี่ยง',
      'learn.undone': 'ย้อนหมากแล้ว มองหาทางที่ปลอดภัยกว่า',
      'end.eyebrow': 'จบเกม',
      'end.checkmate': 'รุกจน',
      'end.stalemate': 'จนแต้ม',
      'end.draw': 'เสมอ',
      'end.time': 'หมดเวลา',
      'end.checkmateText': '{winner} รุกจน ราชาไม่มีช่องหนีที่ถูกกฎหมาย',
      'end.stalemateText': 'ฝ่ายที่ต้องเดินไม่มีหมากเดินที่ถูกกฎหมาย แต่ราชาไม่ได้ถูกเช็ค เกมจึงเสมอ',
      'end.drawText': 'เกมจบด้วยผลเสมอ: {reason}',
      'end.timeText': '{winner} ชนะเพราะเวลาของอีกฝ่ายหมด',
      'end.moves': 'หมาก',
      'end.material': 'กำลังหมาก',
      'end.blunders': 'พลาด',
      'academy.title': 'ตรวจดูหมาก',
      'academy.tag': 'ห้องเรียนรู้',
      'academy.intro': 'คลิกหมากบนกระดานหรือเลือกด้านล่าง ประวัติ คะแนน และการเดินของหมากจะสว่างขึ้นบนกระดาน',
      'academy.pick': 'เลือกหมากเพื่อเริ่ม',
      'academy.pickBody': 'หมากทุกตัวมีบุคลิก คะแนน และเรื่องราว กระดานจะแสดงเส้นทางของมัน',
      'academy.value': 'คะแนน',
      'academy.movement': 'การเดิน',
      'academy.role': 'บทบาท',
      'academy.story': 'เรื่องราวสั้น ๆ',
      'academy.lessons': 'กฎเงียบสามข้อ',
      'academy.rule1': 'พัฒนาหมากก่อนโจมตี อัศวินและบิชอปก่อน ควีนไว้ทีหลัง',
      'academy.rule2': 'เข้าปราสาทก่อนหมากที่ 10 เมื่อทำได้ ราชาที่ปลอดภัยมีค่ากว่าเบี้ยหนึ่งตัว',
      'academy.rule3': 'ก่อนเดินทุกครั้ง ถามว่าคู่ต่อสู้ขู่อะไร ไม่ใช่สิ่งที่คุณหวัง',
      'puzzles.title': 'แบบฝึกหมากรุก',
      'puzzles.tag': 'แบบฝึก',
      'puzzles.intro': 'โจทย์สั้น ๆ ห้าข้อ โหลดจาก JSON ในเครื่อง แต่ละข้อสอนแนวคิดเดียวที่ใช้ในเกมจริง',
      'puzzles.streak': 'สถิติต่อเนื่อง',
      'puzzles.best': 'สถิติสูงสุด',
      'puzzles.attempts': 'จำนวนลอง',
      'puzzles.hint': 'คำใบ้',
      'puzzles.retry': 'ลองใหม่',
      'puzzles.yourTurn': 'ตาของคุณ',
      'puzzles.solvedTag': 'แก้ได้',
      'puzzles.newTag': 'ใหม่',
      'puzzles.solution': 'แนวคิด',
      'puzzles.next': 'โจทย์ถัดไป',
      'puzzles.backToGame': 'กลับไปเล่นเกม',
      'puzzles.solvedEyebrow': 'แก้โจทย์แล้ว',
      'puzzles.solvedTitle': 'เยี่ยมมาก',
      'puzzles.allSolved': 'แก้โจทย์ครบทั้งห้าข้อแล้ว ยอดเยี่ยมเรื่องรูปแบบ',
      'puzzles.why': 'ทำไมแบบฝึกได้ผล',
      'academy.fullLesson': 'บทเรียนเต็ม',
      'puzzles.whyBody': 'รูปแบบคือคำศัพท์ของหมากรุก ฝึกวันละห้านาทีจะช่วยให้ตาคุณเห็นแถวหลัง หมากที่ลอยลำ หรืออัศวินสองง่ามก่อนที่จะเสียเกม',
      'puzzles.level': 'ระดับ {n}',
      'puzzles.solvedPill': 'แก้ได้',
      'puzzles.activePill': 'กำลังเล่น',
      'foot.saved': 'ความคืบหน้าบันทึกในเบราว์เซอร์นี้',
      'foot.clear': 'ล้างข้อมูลที่บันทึก',
      'foot.built': 'สร้างโดย',
      'foot.with': 'ด้วย',
      'foot.offline': 'หน้าเดียว ไม่มีเฟรมเวิร์ก ไม่ต่อเน็ต',
      'message.welcome': 'ยินดีต้อนรับ คลิกหมากเพื่อดูเส้นทางของมัน',
      'message.resume': 'เกมล่าสุดของคุณถูกกู้คืนแล้ว',
      'message.notMove': 'ช่องนั้นไม่ใช่ปลายทางที่ถูกกฎหมาย',
      'message.wrongPuzzle': 'ยังไม่ใช่ มองหาแนวคิดในคำใบ้',
      'message.undo': 'ย้อนหมากแล้ว',
      'message.saved': 'บันทึกในเบราว์เซอร์นี้แล้ว',
      'message.cleared': 'ล้างข้อมูลที่บันทึกแล้ว',
      'message.soundOn': 'เปิดเสียงแล้ว',
      'message.soundOff': 'ปิดเสียงแล้ว',
      'message.copied': 'ไฟล์พร้อมดาวน์โหลด',
      'message.flipped': 'พลิกกระดานแล้ว',
      'message.puzzleLoad': 'โหลดโจทย์แล้ว คุณเป็นฝ่ายขาว',
      'message.guardOn': 'เปิดการ์ดกันพลาดแล้ว',
      'message.guardOff': 'ปิดการ์ดกันพลาดแล้ว',
      'message.learningOn': 'เปิดโหมดเรียนรู้แล้ว',
      'message.learningOff': 'ปิดโหมดเรียนรู้แล้ว',
      'message.confirmClear': 'ล้างเกมที่บันทึก สถิติโจทย์ และการตั้งค่าทั้งหมดหรือไม่?',
      'message.illegal': 'หมากนั้นเดินไม่ได้ตามกฎ',
      'message.checkHint': 'ราชาถูกเช็ค ป้องกัน กินตัวที่รุก หรือเลื่อนราชา',
      'message.puzzleSolved': 'แก้โจทย์ได้แล้ว แนวคิดนี้เป็นของคุณ',
      'message.kept': 'เก็บหมากนี้ไว้ ระวังหมากตัวนั้นด้วย',
      'message.exported': 'ส่งออกความคืบหน้าแล้ว',
      'message.exportPgn': 'ส่งออกเกม PGN แล้ว',
      'message.puzzleAll': 'แก้โจทย์ครบทุกข้อแล้ว — ลองเล่นเกมสบาย ๆ ดู',
      'blunder.hangingEn': 'Your {piece} on {square} can be captured by the {attacker} on {from}, and nothing is defending it. That is a {loss}-point gift.',
      'blunder.hangingTh': '{piece}ของคุณที่ {square} ถูก {attacker} ที่ {from} โจมตี และไม่มีอะไรป้องกัน เสียฟรี {loss} คะแนน',
      'blunder.exchangeEn': 'Your {piece} on {square} is attacked by a cheaper {attacker} from {from}. If the trade happens, you lose about {loss} points.',
      'blunder.exchangeTh': '{piece}ของคุณที่ {square} ถูก {attacker} ที่ถูกกว่าจาก {from} โจมตี ถ้าแลกกันคุณจะเสียประมาณ {loss} คะแนน',
      'blunder.mateEn': 'This move allows {san}. There is no defence: the next move is checkmate.',
      'blunder.mateTh': 'หมากนี้อนุญาตให้เล่น {san} ป้องกันไม่ได้ เพราะหมากถัดไปคือรุกจน',
      'blunder.tipEn': 'Before you move, ask: is this piece safe on its new square?',
      'blunder.tipTh': 'ก่อนเดิน ถามตัวเองว่า: หมากตัวนี้ปลอดภัยบนช่องใหม่หรือไม่?',
      'blunder.mateTipEn': 'When you are ahead, check every opponent check and capture. One careless move is enough.',
      'blunder.mateTipTh': 'เมื่อได้เปรียบ ให้ตรวจการเช็คและการกินทุกครั้งของคู่ต่อสู้ เพราะหมากพลาดครั้งเดียวก็พอ',
      'blunder.tip': 'ก่อนเดิน ถามตัวเองว่า: หมากตัวนี้ปลอดภัยบนช่องใหม่หรือไม่?',
      'blunder.mateTip': 'เมื่อได้เปรียบ ให้ตรวจการเช็คและการกินทุกครั้งของคู่ต่อสู้ เพราะหมากพลาดครั้งเดียวก็พอ',
      'blunder.safe': 'ย้อนหมากแล้ว ไม่มีอะไรเสียหาย มองหาการเดินพัฒนาหมาก การกิน หรือการเช็ค',
      'blunder.safeTh': 'ย้อนหมากแล้ว ไม่มีอะไรเสียหาย มองหาการเดินพัฒนาหมาก การกิน หรือการเช็ค',
      'a11y.moveAnnounce': '{side} เล่น {san}'
    }
  };

  var PIECE_INFO = {
    p: {
      value: 1,
      name: { en: 'Pawn', th: 'เบี้ย' },
      movement: {
        en: 'One square forward; two from its starting rank. It captures one square diagonally forward, can take en passant, and promotes on the last rank.',
        th: 'เดินหน้าได้หนึ่งช่อง (สองช่องในตาแรก) กินหมากทแยงไปข้างหน้าหนึ่งช่อง กินเบี้ยผ่านทางได้ และเลื่อนขั้นเมื่อถึงแถวสุดท้าย'
      },
      role: {
        en: 'The soul of the position. Pawns make the map: they claim space, fix weaknesses and decide where the pieces can travel.',
        th: 'จิตวิญญาณของตำแหน่ง เบี้ยสร้างแผนที่ มันยึดพื้นที่ สร้างจุดอ่อน และกำหนดว่าเรือกับบิชอปจะวิ่งไปไหนได้'
      },
      history: {
        en: 'From the old Italian pedone, a foot soldier. Once the weakest piece, the pawn gained promotion and the en passant rule in the fifteenth century — a small soldier with a royal dream.',
        th: 'มาจาก pedone ในอิตาลี แปลว่าทหารราบ เดิมเป็นหมากที่อ่อนที่สุด แต่ได้รับกฎเลื่อนขั้นและกินเบี้ยผ่านทางราวคริสต์ศตวรรษที่ 15 ทหารเล็ก ๆ ที่ฝันอยากเป็นราชวงศ์'
      },
      tip: {
        en: 'Every pawn move is permanent. Before pushing, ask which squares it leaves behind.',
        th: 'การเดินเบี้ยทุกครั้งย้อนไม่ได้ ก่อนดัน ถามว่ามันเปิดช่องอะไรทิ้งไว้'
      }
    },
    n: {
      value: 3,
      name: { en: 'Knight', th: 'อัศวิน' },
      movement: {
        en: 'An L-shape: two squares one way and one square across. It is the only piece that jumps over others.',
        th: 'เดินเป็นตัว L: สองช่องทางหนึ่งและหนึ่งช่องอีกทาง เป็นหมากเดียวที่กระโดดข้ามหมากอื่นได้'
      },
      role: {
        en: 'A fork artist and a nightmare in closed positions. Put knights on protected central squares and let them touch several targets at once.',
        th: 'ศิลปินแห่งการแทงสองง่ามและตัวป่วนในเกมปิด วางอัศวินบนช่องกลางที่มีการป้องกัน เพื่อให้มันแตะเป้าหมายหลายอย่างพร้อมกัน'
      },
      history: {
        en: 'The Persian asb, a horse. European carvers turned the horse head into the familiar profile, and the knight has been the most recognizable piece on the board ever since.',
        th: 'asb ในเปอร์เซียหมายถึงม้า ช่างแกะสลักยุโรปเปลี่ยนหัวม้าให้เป็นรูปด้านข้างที่คุ้นตา และอัศวินก็เป็นหมากที่จำง่ายที่สุดบนกระดานตั้งแต่นั้น'
      },
      tip: {
        en: 'A knight on the rim is dim. Centralise it before you look for tricks.',
        th: 'อัศวินที่ขอบกระดานมักอ่อนแอ พาเข้ามากลางก่อนมองหาลูกเล่น'
      }
    },
    b: {
      value: 3,
      name: { en: 'Bishop', th: 'บิชอป' },
      movement: {
        en: 'Any number of squares diagonally. It never changes square colour, so one bishop can never attack the other.',
        th: 'เดินทแยงได้ไม่จำกัดช่อง มันไม่เปลี่ยนสีช่อง จึงโจมตีบิชอปอีกตัวไม่ได้'
      },
      role: {
        en: 'A long-range sniper. Bishops love open diagonals; a pair of them can dominate an open board.',
        th: 'มือซุ่มยิงระยะไกล บิชอปชอบทแยงที่เปิด และบิชอปคู่หนึ่งสามารถครองกระดานโล่งได้'
      },
      history: {
        en: 'From the Persian pil, an elephant. The English name comes from the church, because the mitre-shaped top looked like a bishop\'s hat.',
        th: 'มาจาก pil ในเปอร์เซียหมายถึงช้าง ชื่ออังกฤษมาจากศาสนจักร เพราะยอดหมากรูปหมวกบาทหลวงดูเหมือนหมวกของบิชอป'
      },
      tip: {
        en: 'Keep your bishops on diagonals that point at the enemy king.',
        th: 'วางบิชอปให้ทแยงของมันชี้ไปทางราชาศัตรู'
      }
    },
    r: {
      value: 5,
      name: { en: 'Rook', th: 'เรือ' },
      movement: {
        en: 'Any number of squares along a rank or file. It also takes part in castling.',
        th: 'เดินตามแถวหรือหลักได้ไม่จำกัดช่อง และมีส่วนในการเข้าปราสาท'
      },
      role: {
        en: 'A heavy weapon that wants open files and the seventh rank. In endings, rooks become the main actors.',
        th: 'อาวุธหนักที่ต้องการหลักเปิดและแถวที่ 7 ในเกมท้าย เรือมักเป็นตัวเอก'
      },
      history: {
        en: 'From the Persian rukh, a chariot or war tower. European players built it as a castle tower, which is why castling feels like a small fortress.',
        th: 'มาจาก rukh ในเปอร์เซียหมายถึงรถรบหรือหอคอย ชาวยุโรปสร้างเป็นหอปราสาท การเข้าปราสาทจึงให้ความรู้สึกเหมือนสร้างป้อมเล็ก ๆ'
      },
      tip: {
        en: 'Put rooks on open files, then look for the seventh rank.',
        th: 'วางเรือบนหลักเปิด แล้วมองหาแถวที่ 7'
      }
    },
    q: {
      value: 9,
      name: { en: 'Queen', th: 'ควีน' },
      movement: {
        en: 'Any number of squares in any straight line: ranks, files and diagonals. The most powerful piece on the board.',
        th: 'เดินได้ไม่จำกัดช่องในแนวตรงทุกแบบ ทั้งแถว หลัก และทแยง เป็นหมากที่แข็งแรงที่สุดบนกระดาน'
      },
      role: {
        en: 'A finisher, not a scout. Bring her out after the minor pieces, and never leave her undefended.',
        th: 'ตัวปิดเกม ไม่ใช่หน่วยลาดตระเวน นำออกมาหลังอัศวินและบิชอป และอย่าปล่อยให้ไม่มีตัวป้องกัน'
      },
      history: {
        en: 'The Persian farzin was a counsellor. Europe promoted the counsellor to queen, and by the late fifteenth century she had the combined powers of rook and bishop — the game\'s great accelerator.',
        th: 'farzin ในเปอร์เซียคือที่ปรึกษา ยุโรปยกระดับเป็นควีน และปลายคริสต์ศตวรรษที่ 15 เธอมีพลังรวมของเรือและบิชอป กลายเป็นตัวเร่งเกมที่ยิ่งใหญ่'
      },
      tip: {
        en: 'Do not develop the queen too early. She becomes a target for every minor piece.',
        th: 'อย่ารีบนำควีนออกมาเร็วเกินไป เพราะเธอจะเป็นเป้าให้หมากเล็กทุกตัว'
      }
    },
    k: {
      value: 0,
      name: { en: 'King', th: 'ราชา' },
      movement: {
        en: 'One square in any direction. The king may castle once with a rook, and may never move into check.',
        th: 'เดินหนึ่งช่องได้ทุกทิศ ราชาเข้าปราสาทกับเรือได้หนึ่งครั้ง และห้ามเดินเข้าไปในตำแหน่งที่ถูกเช็ค'
      },
      role: {
        en: 'The whole game. Keep him safe in the opening and bring him forward in the ending, where he becomes a fighting piece.',
        th: 'หัวใจของเกมทั้งหมด รักษาความปลอดภัยในเปิดเกม และนำออกมาในท้ายเกมซึ่งเขาจะกลายเป็นหมากสู้'
      },
      history: {
        en: 'The Persian shah. Checkmate comes from shah mat — the king is helpless. The king is never captured; the game simply ends when escape is impossible.',
        th: 'shah ในเปอร์เซียหมายถึงราชา คำว่า checkmate มาจาก shah mat — ราชาจนหนทาง ราชาไม่เคยถูกกิน เกมจบเมื่อหนีไม่ได้เท่านั้น'
      },
      tip: {
        en: 'Castle early, and keep one pawn move ready to give the king air.',
        th: 'เข้าปราสาทเร็ว และเผื่อการเดินเบี้ยหนึ่งครั้งเพื่อเปิดช่องอากาศให้ราชา'
      }
    }
  };

  var TIPS = [
    {
      en: 'Control the four centre squares: e4, d4, e5 and d5. Pieces see more from the middle.',
      th: 'ควบคุมช่องกลางทั้งสี่: e4, d4, e5 และ d5 หมากมองเห็นได้ไกลกว่าจากตรงกลาง'
    },
    {
      en: 'Develop knights and bishops before you move the queen. Each new piece makes your position safer.',
      th: 'พัฒนาอัศวินและบิชอปก่อนขยับควีน หมากใหม่แต่ละตัวทำให้ตำแหน่งปลอดภัยขึ้น'
    },
    {
      en: 'Protect your king by castling early. A king in the centre is a target.',
      th: 'ปกป้องราชาด้วยการเข้าปราสาทเร็ว ราชาที่อยู่กลางกระดานคือเป้า'
    },
    {
      en: 'Before every move, look for checks, captures and threats — yours and your opponent\'s.',
      th: 'ก่อนเดินทุกครั้ง มองหาเช็ค การกิน และการขู่ ทั้งของคุณและของคู่ต่อสู้'
    },
    {
      en: 'A quiet developing move is rarely a mistake. A loose pawn often is.',
      th: 'การเดินพัฒนาแบบเงียบ ๆ แทบไม่เคยผิด ส่วนเบี้ยที่ลอยลำมักผิดบ่อย'
    },
    {
      en: 'Rooks belong on open files. Ask which file has no pawns on it.',
      th: 'เรือควรอยู่บนหลักเปิด ถามว่าหลักใดไม่มีเบี้ยอยู่เลย'
    },
    {
      en: 'Trade when you are ahead in material, avoid trades when you are behind.',
      th: 'เมื่อได้เปรียบกำลังหมากให้แลก แต่ถ้าตามอยู่ให้เลี่ยงการแลก'
    },
    {
      en: 'In the endgame, the king is a fighting piece. Walk him toward the action.',
      th: 'ในท้ายเกม ราชาเป็นหมากสู้ พาเขาเดินเข้าไปหาการต่อสู้'
    }
  ];

  Engine.i18n = I18N;
  Engine.pieceInfo = PIECE_INFO;
  if (typeof module !== 'undefined' && module.exports) module.exports = Engine;
  if (!HAS_DOM) return;

  /* ==========================================================
     PART 3 — UI STATE & HELPERS
     ========================================================== */

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  function clamp(n, min, max) { return n < min ? min : n > max ? max : n; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function tIn(lang, key, vars) {
    var table = I18N[lang] || I18N.en;
    var s = table[key];
    if (s == null) s = I18N.en[key];
    if (s == null) return key;
    if (vars) {
      Object.keys(vars).forEach(function (k) { s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]); });
    }
    return s;
  }
  function t(key, vars) { return tIn(UI.lang, key, vars); }
  function pieceName(type) {
    var p = PIECE_INFO[type];
    return p ? p.name[UI.lang] : type;
  }
  function pieceGlyph(type, color) {
    var map = {
      w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
      b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' }
    };
    return (map[color] || map.w)[type] || '?';
  }

  var UI = {
    lang: 'en',
    sound: true,
    learning: true,
    guard: true,
    flipped: false,
    tab: 'play',
    selected: null,
    legal: [],
    pattern: [],
    hover: null,
    cursor: { f: 4, r: 1 },
    lastMove: null,
    anim: null,
    flash: null,
    inspector: null,
    inspectSquare: null,
    clocks: { w: CLOCK_START, b: CLOCK_START },
    clockRunning: false,
    lastTick: 0,
    mode: 'casual',
    puzzleId: null,
    puzzleSolved: false,
    puzzleAttempts: 0,
    savedCasual: null,
    savedCasualMoves: [],
    promotionPending: null,
    modalOpen: false,
    clockWasRunning: false,
    gameOver: false,
    gameOverInfo: null,
    stats: { games: 0, blunders: 0 },
    puzzleStats: { solved: [], streak: 0, best: 0, attempts: 0 },
    coach: null,
    lastSavedAt: 0,
    startFen: START_FEN,
    hasRestored: false
  };

  var game = createGame();
  var puzzles = [];
  var board, ctx;
  var view = { w: 0, h: 0, dpr: 1, ox: 0, oy: 0, TW: 90, TH: 56, depth: 20, hit: [] };
  var els = {};
  var toastTimer = null;
  var lastFrame = 0;
  var boardCache = null;
  var boardCacheDirty = true;

  /* ==========================================================
     PART 4 — PERSISTENCE
     ========================================================== */

  function currentCasual() {
    if (UI.mode === 'puzzle' && UI.savedCasual) return UI.savedCasual;
    return serializeCasual();
  }

  function serializeCasual() {
    return {
      fen: toFen(game),
      initialFen: UI.startFen,
      moves: game.history.map(function (m) {
        return {
          from: sqName(m.from.f, m.from.r),
          to: sqName(m.to.f, m.to.r),
          promotion: m.promotion || null,
          castle: m.castle || null
        };
      }),
      clocks: { w: Math.max(0, Math.round(UI.clocks.w)), b: Math.max(0, Math.round(UI.clocks.b)) },
      savedAt: Date.now()
    };
  }

  function restoreCasual(data) {
    if (!data || !Array.isArray(data.moves)) return false;
    var restored = createGame(data.initialFen || START_FEN);
    for (var i = 0; i < data.moves.length; i++) {
      var raw = data.moves[i];
      var m = findMove(restored, raw.from, raw.to, raw.promotion || null, raw.castle || null);
      if (!m) return false;
      playMove(restored, m);
    }
    game = restored;
    UI.startFen = data.initialFen || START_FEN;
    UI.clocks = {
      w: data.clocks && typeof data.clocks.w === 'number' ? clamp(data.clocks.w, 0, 36000) : CLOCK_START,
      b: data.clocks && typeof data.clocks.b === 'number' ? clamp(data.clocks.b, 0, 36000) : CLOCK_START
    };
    UI.lastMove = game.history.length ? game.history[game.history.length - 1] : null;
    UI.hasRestored = game.history.length > 0;
    return true;
  }

  function saveState() {
    try {
      var casual = currentCasual();
      if (!casual) return;
      var payload = {
        version: 1,
        casual: casual,
        settings: {
          lang: UI.lang,
          sound: UI.sound,
          learning: UI.learning,
          guard: UI.guard,
          flipped: UI.flipped
        },
        puzzles: UI.puzzleStats,
        stats: UI.stats,
        savedAt: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      UI.lastSavedAt = Date.now();
    } catch (err) { /* private mode or quota — stay in memory */ }
  }

  function loadState() {
    var raw = null;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (err) { raw = null; }
    if (!raw) return false;
    try {
      var data = JSON.parse(raw);
      if (!data || data.version !== 1) return false;
      var s = data.settings || {};
      if (s.lang === 'en' || s.lang === 'th') UI.lang = s.lang;
      UI.sound = s.sound !== false;
      UI.learning = s.learning !== false;
      UI.guard = s.guard !== false;
      UI.flipped = !!s.flipped;
      if (data.puzzles && Array.isArray(data.puzzles.solved)) {
        UI.puzzleStats = {
          solved: data.puzzles.solved.filter(function (x) { return typeof x === 'string'; }),
          streak: Math.max(0, parseInt(data.puzzles.streak, 10) || 0),
          best: Math.max(0, parseInt(data.puzzles.best, 10) || 0),
          attempts: Math.max(0, parseInt(data.puzzles.attempts, 10) || 0)
        };
      }
      if (data.stats) {
        UI.stats.games = Math.max(0, parseInt(data.stats.games, 10) || 0);
        UI.stats.blunders = Math.max(0, parseInt(data.stats.blunders, 10) || 0);
      }
      if (data.casual) restoreCasual(data.casual);
      return true;
    } catch (err) { return false; }
  }

  /* ==========================================================
     PART 5 — DOM CACHE, I18N, SETTINGS
     ========================================================== */

  function cacheEls() {
    board = $('#board');
    ctx = board.getContext('2d');
    [
      'langBtn', 'soundBtn', 'soundIcon', 'newGameBtn', 'undoBtn', 'guardBtn', 'flipBtn',
      'exportPgnBtn', 'exportJsonBtn', 'resetBtn', 'learnToggle', 'modeBadge', 'academyTag',
      'boardToast', 'promotionModal', 'learnModal', 'endModal', 'puzzleModal',
      'promoTitle', 'learnTitle', 'learnEyebrow', 'learnBody', 'learnUndo', 'learnClose',
      'endTitle', 'endText', 'endStats', 'endNew', 'endReview',
      'puzzleTitle', 'puzzleEyebrow', 'puzzleText', 'puzzleLesson', 'puzzleNext', 'puzzleBack',
      'clockBlack', 'clockWhite', 'clockBlackCard', 'clockWhiteCard', 'clockStrip',
      'turnPill', 'turnText', 'historyBody', 'historyEmpty', 'historyCount', 'historyScroll',
      'statusTag', 'materialText', 'moveCount', 'phaseText', 'evalBarWhite',
      'capturedByWhite', 'capturedByBlack', 'coachEn', 'coachTh', 'coachMood', 'coachMove',
      'inspectorEmpty', 'inspectorBody', 'inspectorGlyph', 'inspectorSide', 'inspectorName',
      'inspectorValue', 'inspectorMove', 'inspectorRole', 'inspectorHistory', 'inspectorTip',
      'pieceGrid', 'piecePeek', 'peekGlyph', 'peekSide', 'peekName', 'peekValue', 'peekMove', 'peekMore', 'puzzleList', 'puzzleProgress', 'puzzleStreak', 'puzzleBest',
      'puzzleAttempts', 'puzzleActive', 'puzzleActiveTitle', 'puzzleActiveGoal',
      'puzzleHintBtn', 'puzzleResetBtn', 'puzzleHintBox', 'puzzleSolutionBox',
      'puzzleSolutionText', 'puzzleTurnTag', 'puzzleExit', 'clearBtn', 'tabPlay',
      'tabAcademy', 'tabPuzzles', 'boardFrame'
    ].forEach(function (id) { els[id] = document.getElementById(id); });
    els.clockStrip = document.querySelector('.clock-strip');
    els.coachCard = document.querySelector('.coach-card');
  }

  function applyI18n() {
    document.documentElement.lang = UI.lang;
    $$('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });
    $$('[data-i18n-aria]').forEach(function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
    $$('.lang-opt').forEach(function (el) {
      el.classList.toggle('is-active', el.getAttribute('data-lang') === UI.lang);
    });
    if (els.learnToggle) els.learnToggle.checked = UI.learning;
  }

  function setLanguage(lang) {
    UI.lang = lang === 'th' ? 'th' : 'en';
    applyI18n();
    updateMode();
    updateClocks();
    updateTurn();
    updateHistory();
    updateStatus();
    updateInspector();
    updatePuzzleUI();
    updateButtons();
    renderCoach();
    if (els.learnModal && !els.learnModal.classList.contains('hidden') && UI.learnContext) {
      if (UI.learnContext.kind === 'undo') openUndoLearn(UI.learnContext.move);
      else openBlunderModal(UI.learnContext.move);
    }
    if (els.puzzleModal && !els.puzzleModal.classList.contains('hidden') && UI.puzzleModalData) {
      openPuzzleSolved(UI.puzzleModalData);
    }
    if (els.endModal && !els.endModal.classList.contains('hidden') && UI.gameOverInfo) {
      openEndModal(UI.gameOverInfo);
    }
    saveState();
  }

  function setSound(on) {
    UI.sound = !!on;
    els.soundBtn.setAttribute('aria-pressed', String(UI.sound));
    els.soundIcon.textContent = UI.sound ? '🔊' : '🔇';
    if (UI.sound) { ensureAudio(); playSound('select'); }
    saveState();
  }

  function setLearning(on) {
    UI.learning = !!on;
    els.learnToggle.checked = UI.learning;
    els.coachCard.classList.toggle('is-learning-off', !UI.learning);
    if (!UI.learning) {
      setCoach(t('coach.off'), t('coach.offTh'), 'quiet');
    } else {
      coachAfterMove();
    }
    saveState();
  }

  function setGuard(on) {
    UI.guard = !!on;
    els.guardBtn.classList.toggle('is-on', UI.guard);
    els.guardBtn.setAttribute('aria-pressed', String(UI.guard));
    saveState();
  }

  function setTab(tab) {
    UI.tab = tab;
    $$('.tab').forEach(function (b) {
      var active = b.getAttribute('data-tab') === tab;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-selected', String(active));
    });
    $$('.tab-panel').forEach(function (p) {
      var active = p.getAttribute('data-panel') === tab;
      p.classList.toggle('is-active', active);
      p.hidden = !active;
    });
  }

  /* ==========================================================
     PART 6 — SOUND
     ========================================================== */

  var audioCtx = null;
  var noiseBuffer = null;

  function ensureAudio() {
    if (audioCtx) {
      if (audioCtx.state === 'suspended') { try { audioCtx.resume(); } catch (err) {} }
      return audioCtx;
    }
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    try {
      audioCtx = new AC();
      var len = Math.floor(audioCtx.sampleRate * 0.09);
      noiseBuffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
      var data = noiseBuffer.getChannelData(0);
      for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    } catch (err) { audioCtx = null; }
    return audioCtx;
  }

  function tone(freq, dur, type, gain, delay, slideTo) {
    var ac = ensureAudio();
    if (!ac) return;
    var start = ac.currentTime + (delay || 0);
    var osc = ac.createOscillator();
    var g = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain || 0.05, start + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  function noise(dur, gain, delay, cutoff) {
    var ac = ensureAudio();
    if (!ac || !noiseBuffer) return;
    var start = ac.currentTime + (delay || 0);
    var src = ac.createBufferSource();
    src.buffer = noiseBuffer;
    var filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff || 1200;
    var g = ac.createGain();
    g.gain.setValueAtTime(gain || 0.04, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(filter); filter.connect(g); g.connect(ac.destination);
    src.start(start);
    src.stop(start + dur + 0.02);
  }

  function playSound(kind) {
    if (!UI.sound) return;
    switch (kind) {
      case 'move':
        tone(240, 0.07, 'triangle', 0.045, 0, 170);
        noise(0.045, 0.012, 0, 900);
        break;
      case 'select':
        tone(520, 0.05, 'sine', 0.022, 0, 560);
        break;
      case 'capture':
        tone(160, 0.12, 'square', 0.035, 0, 80);
        noise(0.09, 0.045, 0, 700);
        break;
      case 'castle':
        tone(392, 0.09, 'triangle', 0.035, 0);
        tone(523, 0.09, 'triangle', 0.035, 0.08);
        tone(659, 0.12, 'triangle', 0.03, 0.16);
        break;
      case 'check':
        tone(740, 0.09, 'sine', 0.035, 0);
        tone(988, 0.14, 'sine', 0.03, 0.09);
        break;
      case 'promote':
        [523, 659, 784, 1047].forEach(function (f, i) {
          tone(f, 0.14, 'triangle', 0.032, i * 0.07);
        });
        break;
      case 'undo':
        tone(340, 0.08, 'sine', 0.03, 0, 220);
        break;
      case 'blunder':
        tone(140, 0.22, 'sawtooth', 0.028, 0, 90);
        tone(110, 0.2, 'sawtooth', 0.02, 0.08, 70);
        break;
      case 'error':
        tone(190, 0.12, 'square', 0.025, 0, 150);
        break;
      case 'success':
        [523, 659, 784, 1047, 1319].forEach(function (f, i) {
          tone(f, 0.2, 'triangle', 0.032, i * 0.09);
        });
        break;
      case 'end':
        [392, 330, 262].forEach(function (f, i) {
          tone(f, 0.3, 'sine', 0.03, i * 0.12);
        });
        break;
      default:
        break;
    }
  }

  /* ==========================================================
     PART 7 — COACHING
     ========================================================== */

  function setCoach(en, th, mood) {
    UI.coach = { en: en, th: th, mood: mood || 'ok' };
    renderCoach();
  }

  function renderCoach() {
    if (!els.coachEn) return;
    if (!UI.learning && UI.coach && UI.coach.mood === 'quiet') {
      els.coachEn.textContent = UI.coach.en;
      els.coachTh.textContent = UI.coach.th;
    } else if (UI.coach) {
      els.coachEn.textContent = UI.coach.en;
      els.coachTh.textContent = UI.coach.th;
    }
    var moodText = t('coach.mood');
    if (UI.coach && UI.coach.mood === 'warn') moodText = t('coach.warn');
    if (UI.coach && UI.coach.mood === 'good') moodText = t('coach.good');
    if (UI.coach && UI.coach.mood === 'quiet') moodText = t('coach.learningMode');
    els.coachMood.textContent = moodText;
    els.coachMood.className = 'coach-pill ' + (UI.coach && UI.coach.mood === 'warn' ? 'is-warn' : UI.coach && UI.coach.mood === 'good' ? 'is-good' : '');
    els.coachMove.textContent = t('history.ply', { n: game.history.length });
  }

  function coachAfterMove() {
    if (!UI.learning) {
      setCoach(t('coach.off'), t('coach.offTh'), 'quiet');
      return;
    }
    var st = gameStatus(game);
    var move = game.history.length ? game.history[game.history.length - 1] : null;
    var ply = game.history.length;

    if (st.type === 'checkmate') {
      var winner = game.turn === 'w' ? t('side.black') : t('side.white');
      setCoach(
        winner + ' delivered checkmate. ' + (game.turn === 'w' ? 'White' : 'Black') + ' has no legal reply.',
        winner + ' รุกจนแล้ว อีกฝ่ายไม่มีหมากเดินที่ถูกกฎหมาย',
        'good'
      );
      return;
    }
    if (st.type === 'stalemate') {
      setCoach('Stalemate: no legal moves, but the king is not in check. A draw.',
        'จนแต้ม: ไม่มีหมากเดิน แต่ราชาไม่ได้ถูกเช็ค เกมเสมอ', 'warn');
      return;
    }
    if (st.type === 'draw') {
      setCoach('The game is a draw. A fair result is still a result.',
        'เกมเสมอ ผลที่ยุติธรรมก็ยังเป็นผลอยู่', 'ok');
      return;
    }
    if (move && move.blunder) {
      var ex = explainBlunder(move.blunder);
      setCoach(ex.en, ex.th, 'warn');
      return;
    }
    if (st.check) {
      setCoach(t('message.checkHint'),
        'ราชาถูกเช็ค ป้องกันด้วยการเอามหากั้น กินตัวที่รุก หรือเลื่อนราชา', 'warn');
      return;
    }
    var bal = materialBalance(game);
    if (Math.abs(bal.diff) >= 3) {
      var ahead = bal.diff > 0 ? 'White' : 'Black';
      var n = Math.abs(bal.diff);
      setCoach(
        ahead + ' is ahead by ' + n + ' points of material. ' + (bal.diff > 0 ? 'Trade pieces, not pawns.' : 'Look for a tactic or a safer structure.'),
        (bal.diff > 0 ? 'ขาว' : 'ดำ') + ' นำอยู่ ' + n + ' คะแนน ' + (bal.diff > 0 ? 'ควรแลกหมาก แต่ระวังเบี้ย' : 'มองหาลูกเล่นหรือโครงสร้างที่ปลอดภัยขึ้น'),
        'ok'
      );
      return;
    }
    if (ply < 16) {
      var opening = [
        [TIPS[0], 'เปิดเกม: ควบคุมช่องกลางก่อน'],
        [TIPS[1], 'เปิดเกม: พัฒนาอัศวินและบิชอป'],
        [TIPS[2], 'เปิดเกม: ราชาควรเข้าปราสาท']
      ];
      var pair = opening[Math.floor(ply / 2) % opening.length];
      setCoach(pair[0].en, pair[0].th, 'ok');
      return;
    }
    var tip = TIPS[(ply + game.history.length) % TIPS.length];
    setCoach(tip.en, tip.th, 'ok');
  }

  function explainBlunder(b) {
    if (!b) return { en: '', th: '' };
    function nameIn(type, lang) {
      return PIECE_INFO[type] ? PIECE_INFO[type].name[lang] : type;
    }
    function varsIn(lang) {
      return {
        piece: nameIn(b.piece, lang),
        square: b.square,
        attacker: nameIn(b.attacker, lang),
        from: b.attackerSquare,
        loss: b.loss,
        san: b.san || ''
      };
    }
    var suffix = b.kind === 'mate' ? 'mate' : b.kind === 'exchange' ? 'exchange' : 'hanging';
    return {
      en: tIn('en', 'blunder.' + suffix + 'En', varsIn('en')),
      th: tIn('th', 'blunder.' + suffix + 'Th', varsIn('th'))
    };
  }

  /* ==========================================================
     PART 8 — STATUS, HISTORY, INSPECTOR, PUZZLES UI
     ========================================================== */

  function updateTurn() {
    if (!els.turnText) return;
    var st = gameStatus(game);
    var text;
    var cls = 'turn-pill';
    if (UI.gameOver && UI.gameOverInfo) {
      text = t('turn.gameOver');
    } else if (UI.mode === 'puzzle') {
      text = UI.puzzleSolved ? t('puzzles.solvedTag') : t('puzzles.yourTurn');
    } else if (st.check) {
      text = t('turn.check');
      cls += ' is-check';
    } else {
      text = game.turn === 'w' ? t('turn.white') : t('turn.black');
    }
    els.turnText.textContent = text;
    els.turnPill.className = cls + (game.turn === 'b' && UI.mode !== 'puzzle' ? ' is-black' : '');
    els.clockWhiteCard.classList.toggle('is-active', game.turn === 'w' && !UI.gameOver);
    els.clockBlackCard.classList.toggle('is-active', game.turn === 'b' && !UI.gameOver);
    els.clockWhiteCard.classList.toggle('is-low', UI.clocks.w < 60);
    els.clockBlackCard.classList.toggle('is-low', UI.clocks.b < 60);
    var announce = t('a11y.moveAnnounce', {
      side: game.turn === 'w' ? t('side.white') : t('side.black'),
      san: game.history.length ? game.history[game.history.length - 1].san : ''
    });
    board.setAttribute('aria-label', t('a11y.board') + ' ' + announce);
  }

  function updateClocks() {
    if (!els.clockWhite) return;
    els.clockWhite.textContent = formatClock(UI.clocks.w);
    els.clockBlack.textContent = formatClock(UI.clocks.b);
  }

  function formatClock(sec) {
    sec = Math.max(0, Math.ceil(sec));
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function updateStatus() {
    if (!els.statusTag) return;
    var st = gameStatus(game);
    var tag = t('status.normal');
    var tagClass = 'mini-tag';
    if (st.type === 'checkmate') { tag = t('status.checkmate'); tagClass += ' is-warn'; }
    else if (st.type === 'stalemate') { tag = t('status.stalemate'); tagClass += ' is-warn'; }
    else if (st.type === 'draw') { tag = t('status.draw'); tagClass += ' is-warn'; }
    else if (st.type === 'check') { tag = t('status.check'); tagClass += ' is-warn'; }
    els.statusTag.textContent = tag;
    els.statusTag.className = tagClass;

    var bal = materialBalance(game);
    var diff = bal.diff;
    els.materialText.textContent = diff === 0 ? t('status.even') :
      (diff > 0 ? t('status.whiteAhead', { n: diff }) : t('status.blackAhead', { n: -diff }));
    els.moveCount.textContent = String(game.history.length);
    var phase = game.fullmove <= 10 ? 'phase.opening' : (bal.white + bal.black <= 26 || game.history.length > 60) ? 'phase.endgame' : 'phase.middlegame';
    els.phaseText.textContent = t(phase);
    els.evalBarWhite.style.width = clamp(50 + diff * 4, 8, 92) + '%';

    var byWhite = [], byBlack = [];
    game.history.forEach(function (m) {
      if (m.captured) {
        if (m.color === 'w') byWhite.push(m.captured);
        else byBlack.push(m.captured);
      }
    });
    fillCaptured(els.capturedByWhite, byWhite);
    fillCaptured(els.capturedByBlack, byBlack);
  }

  function fillCaptured(el, list) {
    if (!el) return;
    el.innerHTML = '';
    list.forEach(function (p) {
      var s = document.createElement('span');
      s.textContent = pieceGlyph(p.type, p.color);
      s.title = pieceName(p.type);
      el.appendChild(s);
    });
  }

  function updateHistory() {
    if (!els.historyBody) return;
    els.historyBody.innerHTML = '';
    var h = game.history;
    for (var i = 0; i < h.length; i += 2) {
      var tr = document.createElement('tr');
      if (i + 1 >= h.length - 1 || i === h.length - 1) tr.className = 'is-last';
      var n = document.createElement('td');
      n.textContent = String(i / 2 + 1);
      var w = document.createElement('td');
      w.textContent = h[i].san;
      var b = document.createElement('td');
      b.textContent = h[i + 1] ? h[i + 1].san : '';
      tr.appendChild(n); tr.appendChild(w); tr.appendChild(b);
      els.historyBody.appendChild(tr);
    }
    if (els.historyEmpty) {
      els.historyEmpty.classList.toggle('hidden', h.length > 0);
      els.historyEmpty.textContent = t('history.empty');
    }
    els.historyCount.textContent = t('history.ply', { n: h.length });
    if (els.historyScroll) {
      requestAnimationFrame(function () { els.historyScroll.scrollTop = els.historyScroll.scrollHeight; });
    }
  }

  function updateInspector() {
    if (!els.inspectorBody) return;
    var insp = UI.inspector;
    if (!insp) {
      els.inspectorEmpty.classList.remove('hidden');
      els.inspectorBody.classList.add('hidden');
      if (els.piecePeek) els.piecePeek.classList.add('hidden');
      $$('.piece-chip').forEach(function (b) { b.classList.remove('is-active'); });
      return;
    }
    var info = PIECE_INFO[insp.type];
    if (!info) return;
    els.inspectorEmpty.classList.add('hidden');
    els.inspectorBody.classList.remove('hidden');
    els.inspectorGlyph.textContent = pieceGlyph(insp.type, insp.color);
    els.inspectorSide.textContent = insp.color === 'w' ? t('side.white') : t('side.black');
    els.inspectorName.textContent = info.name[UI.lang];
    els.inspectorValue.textContent = insp.type === 'k' ? '∞' : String(info.value);
    els.inspectorMove.textContent = info.movement[UI.lang];
    els.inspectorRole.textContent = info.role[UI.lang];
    els.inspectorHistory.textContent = info.history[UI.lang];
    els.inspectorTip.textContent = info.tip[UI.lang];
    if (els.piecePeek) {
      els.piecePeek.classList.remove('hidden');
      els.peekGlyph.textContent = pieceGlyph(insp.type, insp.color);
      els.peekSide.textContent = insp.color === 'w' ? t('side.white') : t('side.black');
      els.peekName.textContent = info.name[UI.lang];
      els.peekValue.textContent = insp.type === 'k' ? '∞' : String(info.value);
      els.peekMove.textContent = info.movement[UI.lang];
    }
    $$('.piece-chip').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-inspect') === insp.type);
    });
  }

  function inspectPiece(type, color, f, r) {
    UI.inspector = { type: type, color: color, f: f, r: r };
    UI.inspectSquare = (f != null && r != null) ? { f: f, r: r } : null;
    if (f != null && r != null) {
      if (!UI.gameOver && color === game.turn && !(UI.mode === 'puzzle' && UI.puzzleSolved)) {
        var all = legalMoves(game, color).filter(function (m) { return m.from.f === f && m.from.r === r; });
        UI.pattern = all.map(function (m) { return { f: m.to.f, r: m.to.r, capture: !!m.capture || !!m.ep || (game.board[idx(m.to.f, m.to.r)] != null) }; });
      } else {
        var pseudo = generatePseudo(game, color, idx(f, r));
        var seen = {};
        UI.pattern = [];
        pseudo.forEach(function (m) {
          var dest = game.board[idx(m.to.f, m.to.r)];
          if (dest && dest.color === color) return;
          var k = m.to.f + ',' + m.to.r;
          if (seen[k]) return;
          seen[k] = true;
          UI.pattern.push({ f: m.to.f, r: m.to.r, capture: !!dest });
        });
      }
      setCoach(info0(type, 'tipEn'), info0(type, 'tipTh'), 'ok');
    } else {
      UI.pattern = [];
    }
    updateInspector();
  }

  function info0(type, which) {
    var info = PIECE_INFO[type];
    if (!info) return '';
    if (which === 'tipEn') return info.tip.en;
    if (which === 'tipTh') return info.tip.th;
    return '';
  }

  function updatePuzzleUI() {
    if (!els.puzzleList) return;
    var solved = UI.puzzleStats.solved || [];
    els.puzzleProgress.textContent = solved.length + ' / ' + puzzles.length;
    els.puzzleStreak.textContent = String(UI.puzzleStats.streak || 0);
    els.puzzleBest.textContent = String(UI.puzzleStats.best || 0);
    els.puzzleAttempts.textContent = String(UI.puzzleStats.attempts || 0);

    els.puzzleList.innerHTML = '';
    puzzles.forEach(function (p, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'puzzle-item' + (solved.indexOf(p.id) !== -1 ? ' is-solved' : '') + (UI.puzzleId === p.id && UI.mode === 'puzzle' ? ' is-active' : '');
      var num = document.createElement('span');
      num.className = 'puzzle-index';
      num.textContent = String(i + 1).padStart(2, '0');
      var copy = document.createElement('span');
      copy.className = 'puzzle-item-copy';
      var strong = document.createElement('strong');
      strong.textContent = p.title[UI.lang];
      var sub = document.createElement('span');
      sub.textContent = t('puzzles.level', { n: p.level || 1 });
      copy.appendChild(strong); copy.appendChild(sub);
      var state = document.createElement('span');
      var isSolved = solved.indexOf(p.id) !== -1;
      state.className = 'puzzle-state' + (isSolved ? ' is-good' : '');
      state.textContent = isSolved ? t('puzzles.solvedTag') : t('puzzles.newTag');
      btn.appendChild(num); btn.appendChild(copy); btn.appendChild(state);
      btn.addEventListener('click', function () { enterPuzzle(p.id); });
      els.puzzleList.appendChild(btn);
    });

    var active = getPuzzle(UI.puzzleId);
    if (UI.mode === 'puzzle' && active) {
      els.puzzleActive.classList.remove('hidden');
      els.puzzleActiveTitle.textContent = active.title[UI.lang];
      els.puzzleActiveGoal.textContent = active.goal[UI.lang];
      els.puzzleTurnTag.textContent = UI.puzzleSolved ? t('puzzles.solvedTag') : t('puzzles.yourTurn');
      els.puzzleTurnTag.className = 'mini-tag' + (UI.puzzleSolved ? ' is-good' : '');
      els.puzzleSolutionText.textContent = active.lesson[UI.lang];
      if (UI.puzzleSolved) els.puzzleSolutionBox.classList.remove('hidden');
    } else {
      els.puzzleActive.classList.add('hidden');
    }
    var showHint = UI.mode === 'puzzle' && active && UI.puzzleHintVisible;
    if (showHint && active) {
      els.puzzleHintBox.classList.remove('hidden');
      els.puzzleHintBox.textContent = active.hint[UI.lang];
    } else {
      els.puzzleHintBox.classList.add('hidden');
    }
  }

  function updateMode() {
    if (!els.modeBadge) return;
    if (UI.mode === 'puzzle') {
      var p = getPuzzle(UI.puzzleId);
      var n = puzzles.findIndex(function (x) { return x.id === UI.puzzleId; }) + 1;
      els.modeBadge.textContent = t('mode.puzzle', { n: n, total: puzzles.length });
      els.modeBadge.parentElement.classList.add('is-puzzle');
      board.parentElement.classList.add('is-puzzle-mode');
    } else {
      els.modeBadge.textContent = t('mode.casual');
      els.modeBadge.parentElement.classList.remove('is-puzzle');
      board.parentElement.classList.remove('is-puzzle-mode');
    }
    if (els.clockStrip) els.clockStrip.classList.toggle('hidden', UI.mode === 'puzzle');
    els.academyTag.classList.toggle('hidden', UI.mode === 'puzzle');
    els.guardBtn.disabled = UI.mode === 'puzzle';
    els.exportPgnBtn.disabled = false;
  }

  function updateButtons() {
    var canUndo = UI.mode === 'casual' && game.history.length > 0;
    els.undoBtn.disabled = !canUndo;
    var last = game.history.length ? game.history[game.history.length - 1] : null;
    var undoLabel = els.undoBtn.querySelector('[data-i18n]');
    if (undoLabel) {
      undoLabel.setAttribute('data-i18n', last && last.blunder ? 'btn.undoLearn' : 'btn.undo');
      undoLabel.textContent = last && last.blunder ? t('btn.undoLearn') : t('btn.undo');
    }
    els.guardBtn.classList.toggle('is-on', UI.guard);
    els.guardBtn.setAttribute('aria-pressed', String(UI.guard));
    els.soundBtn.setAttribute('aria-pressed', String(UI.sound));
    els.soundIcon.textContent = UI.sound ? '🔊' : '🔇';
    els.learnToggle.checked = UI.learning;
    els.puzzleHintBtn.disabled = UI.mode !== 'puzzle';
    els.puzzleResetBtn.disabled = UI.mode !== 'puzzle';
  }

  function updateAll() {
    applyI18n();
    updateMode();
    updateClocks();
    updateTurn();
    updateHistory();
    updateStatus();
    updateInspector();
    updatePuzzleUI();
    updateButtons();
    renderCoach();
    updateLanguageUI();
  }

  function updateLanguageUI() {
    $$('.lang-opt').forEach(function (el) {
      el.classList.toggle('is-active', el.getAttribute('data-lang') === UI.lang);
    });
  }

  /* ==========================================================
     PART 9 — ISOMETRIC RENDERER
     ========================================================== */

  function resizeBoard() {
    if (!board) return;
    var rect = board.getBoundingClientRect();
    var w = Math.max(320, rect.width || 900);
    var h = rect.height || Math.round(w * 780 / 900);
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    board.width = Math.round(w * dpr);
    board.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    view.w = w;
    view.h = h;
    view.dpr = dpr;
    view.TW = Math.min(w / 8.7, h / 4.9);
    view.TH = view.TW * 0.62;
    view.ox = w / 2;
    view.oy = h * 0.515;
    view.depth = Math.max(10, view.TW * 0.22);
    boardCacheDirty = true;
  }

  function disp(f, r) {
    return UI.flipped ? [7 - f, 7 - r] : [f, r];
  }

  function tileCenter(f, r) {
    var d = disp(f, r);
    var df = d[0], dr = d[1];
    return {
      x: view.ox + (df - dr) * view.TW / 2,
      y: view.oy + (3.5 - (df + dr) / 2) * view.TH
    };
  }

  function pointToSquare(x, y) {
    var dx = x - view.ox, dy = y - view.oy;
    var a = 2 * dx / view.TW;
    var b = 7 - 2 * dy / view.TH;
    var df = Math.round((a + b) / 2);
    var dr = Math.round((b - a) / 2);
    if (df < 0 || df > 7 || dr < 0 || dr > 7) return null;
    var f = UI.flipped ? 7 - df : df;
    var r = UI.flipped ? 7 - dr : dr;
    if (!inside(f, r)) return null;
    var c = tileCenter(f, r);
    var nx = Math.abs(x - c.x) / (view.TW / 2);
    var ny = Math.abs(y - c.y) / (view.TH / 2);
    if (nx + ny > 1.02) return null;
    return { f: f, r: r };
  }

  function hitSquare(x, y) {
    var hits = view.hit;
    for (var i = hits.length - 1; i >= 0; i--) {
      var h = hits[i];
      var dx = x - h.cx;
      var dy = y - h.baseY;
      if (dy < -h.height * 1.03 || dy > view.TH * 0.42) continue;
      var top = clamp(-dy / h.height, 0, 1);
      var halfW = view.TW * (0.235 - 0.062 * top);
      if (Math.abs(dx) <= halfW) return { f: h.f, r: h.r, fromPiece: true };
    }
    return pointToSquare(x, y);
  }

  function tilePoints(f, r) {
    var c = tileCenter(f, r);
    var hw = view.TW / 2, hh = view.TH / 2;
    return [
      [c.x, c.y - hh],
      [c.x + hw, c.y],
      [c.x, c.y + hh],
      [c.x - hw, c.y]
    ];
  }

  function pathPoints(points) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (var i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath();
  }

  function tilePath(f, r) {
    var p = tilePoints(f, r);
    pathPoints(p);
    return p;
  }

  function roundRectPath(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }


  function rebuildBoardCache() {
    if (!boardCache) boardCache = document.createElement('canvas');
    boardCache.width = Math.round(view.w * view.dpr);
    boardCache.height = Math.round(view.h * view.dpr);
    var cacheCtx = boardCache.getContext('2d');
    cacheCtx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    var prev = ctx;
    ctx = cacheCtx;
    drawAmbient();
    drawSlab();
    drawTiles(0);
    drawCoordinates();
    ctx = prev;
    boardCacheDirty = false;
  }

  function drawFrame(now) {
    if (!ctx) return;
    if (!view.w || board.width === 0) resizeBoard();
    var tsec = now / 1000;
    if (boardCacheDirty) rebuildBoardCache();
    ctx.clearRect(0, 0, view.w, view.h);
    if (boardCache) ctx.drawImage(boardCache, 0, 0, view.w, view.h);
    drawHighlights(tsec);
    drawPieces(now, tsec);
    drawCoordinates();
    requestAnimationFrame(drawFrame);
  }

  function drawAmbient() {
    var cx = view.ox;
    var cy = view.oy + view.TH * 3.6;
    var r = view.TW * 4.9;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, 0.34);
    var g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, 'rgba(0, 0, 0, 0.50)');
    g.addColorStop(0.6, 'rgba(0, 0, 0, 0.22)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSlab() {
    var TW = view.TW, TH = view.TH, ox = view.ox, oy = view.oy, D = view.depth;
    var top = { x: ox, y: oy - 4 * TH };
    var right = { x: ox + 4 * TW, y: oy };
    var bottom = { x: ox, y: oy + 4 * TH };
    var left = { x: ox - 4 * TW, y: oy };

    // left side
    var gl = ctx.createLinearGradient(left.x, bottom.y, bottom.x, bottom.y + D);
    gl.addColorStop(0, '#1d2e3b');
    gl.addColorStop(1, '#0b141c');
    ctx.beginPath();
    ctx.moveTo(left.x, left.y);
    ctx.lineTo(bottom.x, bottom.y);
    ctx.lineTo(bottom.x, bottom.y + D);
    ctx.lineTo(left.x, left.y + D);
    ctx.closePath();
    ctx.fillStyle = gl;
    ctx.fill();

    // right side
    var gr = ctx.createLinearGradient(bottom.x, bottom.y, right.x, right.y + D);
    gr.addColorStop(0, '#172632');
    gr.addColorStop(1, '#081017');
    ctx.beginPath();
    ctx.moveTo(right.x, right.y);
    ctx.lineTo(bottom.x, bottom.y);
    ctx.lineTo(bottom.x, bottom.y + D);
    ctx.lineTo(right.x, right.y + D);
    ctx.closePath();
    ctx.fillStyle = gr;
    ctx.fill();

    // rim lines on the sides
    ctx.strokeStyle = 'rgba(255, 200, 87, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left.x, left.y + D);
    ctx.lineTo(bottom.x, bottom.y + D);
    ctx.lineTo(right.x, right.y + D);
    ctx.stroke();

    // top surface
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.lineTo(right.x, right.y);
    ctx.lineTo(bottom.x, bottom.y);
    ctx.lineTo(left.x, left.y);
    ctx.closePath();
    var gt = ctx.createLinearGradient(top.x, top.y, bottom.x, bottom.y);
    gt.addColorStop(0, '#1a2a37');
    gt.addColorStop(1, '#0e1a24');
    ctx.fillStyle = gt;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 200, 87, 0.30)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // corner studs
    [[top, 'top'], [right, 'right'], [bottom, 'bottom'], [left, 'left']].forEach(function (pair) {
      var p = pair[0];
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(2.2, TW * 0.032), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 200, 87, 0.35)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 240, 200, 0.22)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });
  }

  function drawTiles(tsec) {
    for (var r = 0; r < 8; r++) {
      for (var f = 0; f < 8; f++) {
        var light = (f + r) % 2 === 1;
        var pts = tilePath(f, r);
        var c = tileCenter(f, r);
        var g = ctx.createLinearGradient(c.x - view.TW / 2, c.y - view.TH / 2, c.x + view.TW / 2, c.y + view.TH / 2);
        if (light) {
          var warm = ((f * 7 + r * 11) % 5) * 3;
          g.addColorStop(0, 'rgb(' + (222 - warm) + ',' + (201 - warm) + ',' + (162 - warm) + ')');
          g.addColorStop(0.55, 'rgb(' + (205 - warm) + ',' + (181 - warm) + ',' + (140 - warm) + ')');
          g.addColorStop(1, 'rgb(' + (181 - warm) + ',' + (156 - warm) + ',' + (116 - warm) + ')');
        } else {
          var cool = ((f * 5 + r * 7) % 4) * 2;
          g.addColorStop(0, 'rgb(' + (59 - cool) + ',' + (79 - cool) + ',' + (96 - cool) + ')');
          g.addColorStop(0.55, 'rgb(' + (45 - cool) + ',' + (63 - cool) + ',' + (78 - cool) + ')');
          g.addColorStop(1, 'rgb(' + (34 - cool) + ',' + (50 - cool) + ',' + (63 - cool) + ')');
        }
        ctx.fillStyle = g;
        ctx.fill();

        // inner texture, clipped to the diamond
        ctx.save();
        ctx.clip();
        if (light) {
          ctx.strokeStyle = 'rgba(96, 67, 36, 0.10)';
          ctx.lineWidth = 1;
          for (var k = 0; k < 3; k++) {
            var y0 = c.y - view.TH * 0.2 + k * view.TH * 0.18;
            ctx.beginPath();
            ctx.moveTo(c.x - view.TW * 0.5, y0);
            ctx.bezierCurveTo(c.x - view.TW * 0.15, y0 - 3, c.x + view.TW * 0.15, y0 + 3, c.x + view.TW * 0.5, y0);
            ctx.stroke();
          }
        } else {
          ctx.fillStyle = 'rgba(210, 232, 245, 0.055)';
          for (var s = 0; s < 3; s++) {
            var sx = c.x - view.TW * 0.3 + ((f * 31 + r * 17 + s * 23) % 100) / 100 * view.TW * 0.6;
            var sy = c.y - view.TH * 0.24 + ((f * 13 + r * 41 + s * 7) % 100) / 100 * view.TH * 0.48;
            ctx.beginPath();
            ctx.arc(sx, sy, 0.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();

        // carved edge: light on the upper-left, dark on the lower-right
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        ctx.lineTo(pts[3][0], pts[3][1]);
        ctx.lineTo(pts[2][0], pts[2][1]);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.19)';
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        ctx.lineTo(pts[1][0], pts[1][1]);
        ctx.lineTo(pts[2][0], pts[2][1]);
        ctx.stroke();
      }
    }
  }

  function fillTile(f, r, color) {
    tilePath(f, r);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function drawHighlights(tsec) {
    var pulse = 0.5 + 0.5 * Math.sin(tsec * 3.2);

    // last move
    if (UI.lastMove) {
      fillTile(UI.lastMove.from.f, UI.lastMove.from.r, 'rgba(255, 200, 87, 0.12)');
      fillTile(UI.lastMove.to.f, UI.lastMove.to.r, 'rgba(255, 200, 87, 0.16)');
    }

    // check glow
    var st = gameStatus(game);
    if (st.check) {
      var king = findKing(game, game.turn);
      if (king) {
        ctx.save();
        tilePath(king.f, king.r);
        ctx.fillStyle = 'rgba(255, 70, 70, ' + (0.17 + pulse * 0.16) + ')';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 90, 90, ' + (0.6 + pulse * 0.35) + ')';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(255, 70, 70, 0.8)';
        ctx.shadowBlur = 16;
        ctx.stroke();
        ctx.restore();
      }
    }

    // hover
    if (UI.hover && !(UI.selected && UI.selected.f === UI.hover.f && UI.selected.r === UI.hover.r)) {
      fillTile(UI.hover.f, UI.hover.r, 'rgba(88, 171, 255, 0.20)');
      ctx.save();
      tilePath(UI.hover.f, UI.hover.r);
      ctx.strokeStyle = 'rgba(140, 205, 255, 0.48)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();
    }

    // selected square (bright cyan)
    if (UI.selected) {
      ctx.save();
      tilePath(UI.selected.f, UI.selected.r);
      ctx.fillStyle = 'rgba(0, 229, 255, 0.20)';
      ctx.fill();
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2.4;
      ctx.shadowColor = 'rgba(0, 229, 255, 0.85)';
      ctx.shadowBlur = 18;
      ctx.stroke();
      ctx.restore();
    }

    // legal moves (emerald pulse dots and travelling dots)
    var src = UI.selected;
    if (src) {
      var fromC = tileCenter(src.f, src.r);
      UI.legal.forEach(function (m, i) {
        var c = tileCenter(m.to.f, m.to.r);
        var capture = !!m.ep || !!game.board[idx(m.to.f, m.to.r)];
        var ph = (tsec * 0.9 + i * 0.17) % 1;
        var rad = (capture ? view.TW * 0.30 : view.TW * 0.10) * (0.9 + pulse * 0.16);
        ctx.save();
        if (capture) {
          ctx.beginPath();
          ctx.arc(c.x, c.y, rad, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(0, 230, 118, 0.85)';
          ctx.lineWidth = Math.max(2, view.TW * 0.035);
          ctx.shadowColor = 'rgba(0, 230, 118, 0.7)';
          ctx.shadowBlur = 12;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(c.x, c.y, rad, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 230, 118, ' + (0.42 + pulse * 0.22) + ')';
          ctx.shadowColor = 'rgba(0, 230, 118, 0.75)';
          ctx.shadowBlur = 10;
          ctx.fill();
        }
        ctx.restore();

        // animated pulse dots travelling from the selected piece to each destination
        if (UI.learning) {
          for (var k = 0; k < 2; k++) {
            var tt = (ph + k * 0.5) % 1;
            var eased = easeInOut(tt);
            var dx = lerp(fromC.x, c.x, eased);
            var dy = lerp(fromC.y, c.y, eased) - Math.sin(tt * Math.PI) * view.TH * 0.18;
            ctx.save();
            ctx.beginPath();
            ctx.arc(dx, dy, Math.max(1.8, view.TW * 0.027 * (1 - tt * 0.35)), 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(125, 255, 185, ' + (0.75 * (1 - tt * 0.55)) + ')';
            ctx.shadowColor = 'rgba(0, 230, 118, 0.8)';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.restore();
          }
        }
      });
    }

    // academy pattern (hollow emerald rings)
    if (!UI.selected && UI.pattern.length) {
      UI.pattern.forEach(function (p, i) {
        var c = tileCenter(p.f, p.r);
        var ph = (tsec * 0.8 + i * 0.2) % 1;
        ctx.save();
        ctx.beginPath();
        ctx.arc(c.x, c.y, view.TW * 0.09 * (0.9 + pulse * 0.2), 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 230, 118, ' + (0.35 + pulse * 0.35) + ')';
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(c.x, c.y, view.TW * 0.045, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 230, 118, ' + (0.25 + 0.25 * ph) + ')';
        ctx.fill();
        ctx.restore();
      });
    }

    // keyboard cursor
    if (document.activeElement === board) {
      var kc = tileCenter(UI.cursor.f, UI.cursor.r);
      ctx.save();
      var kp = tilePoints(UI.cursor.f, UI.cursor.r);
      pathPoints(kp);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawCoordinates() {
    ctx.save();
    ctx.font = '600 ' + Math.max(8, view.TW * 0.13) + 'px "Avenir Next", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(222, 238, 250, 0.46)';
    for (var df = 0; df < 8; df++) {
      var origF = UI.flipped ? 7 - df : df;
      var c1 = tileCenter(origF, UI.flipped ? 7 : 0);
      ctx.fillText(FILES[origF], c1.x + view.TW * 0.26, c1.y + view.TH * 0.72);
    }
    for (var dr = 0; dr < 8; dr++) {
      var origR = UI.flipped ? 7 - dr : dr;
      var c2 = tileCenter(UI.flipped ? 7 : 0, origR);
      ctx.fillText(String(origR + 1), c2.x - view.TW * 0.26, c2.y + view.TH * 0.72);
    }
    ctx.restore();
  }

  function drawPieces(now, tsec) {
    view.hit = [];
    var items = [];
    for (var r = 0; r < 8; r++) {
      for (var f = 0; f < 8; f++) {
        var p = game.board[idx(f, r)];
        if (!p) continue;
        var c = tileCenter(f, r);
        items.push({ f: f, r: r, p: p, x: c.x, y: c.y, baseY: c.y + view.TH * 0.16 });
      }
    }

    var anim = UI.anim;
    var animItem = null;
    if (anim) {
      var progress = clamp((now - anim.start) / anim.dur, 0, 1);
      var e = easeInOut(progress);
      var fromC = tileCenter(anim.move.from.f, anim.move.from.r);
      var toC = tileCenter(anim.move.to.f, anim.move.to.r);
      var ax = lerp(fromC.x, toC.x, e);
      var ay = lerp(fromC.y, toC.y, e) - Math.sin(progress * Math.PI) * view.TW * 0.24;
      items = items.filter(function (it) { return !(it.f === anim.move.to.f && it.r === anim.move.to.r); });
      animItem = {
        f: anim.move.to.f,
        r: anim.move.to.r,
        p: { type: anim.move.promotion || anim.move.piece || 'p', color: anim.move.color || game.turn },
        x: ax,
        y: ay,
        baseY: ay + view.TH * 0.16,
        moving: true
      };
      items.push(animItem);
      if (progress >= 1) UI.anim = null;
    }

    items.sort(function (a, b) { return a.baseY - b.baseY; });
    var lastMove = UI.lastMove;
    items.forEach(function (it) {
      if (!it.moving && lastMove && it.f === lastMove.to.f && it.r === lastMove.to.r) {
        // subtle lift under the last moved piece
      }
      drawPiece(it.p, it.x, it.baseY, tsec, it.moving);
      if (!it.moving) {
        view.hit.push({
          f: it.f, r: it.r,
          cx: it.x,
          baseY: it.baseY,
          height: pieceHeightUnits(it.p.type) * (view.TW / 112)
        });
      }
    });

    // a soft spark when a capture happened
    if (UI.flash) {
      var fp = clamp((now - UI.flash.start) / 420, 0, 1);
      if (fp >= 1) UI.flash = null;
      else {
        var fc = tileCenter(UI.flash.f, UI.flash.r);
        ctx.save();
        ctx.beginPath();
        ctx.arc(fc.x, fc.y, view.TW * (0.12 + fp * 0.36), 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 200, 87, ' + (0.7 * (1 - fp)) + ')';
        ctx.lineWidth = 2.4 * (1 - fp) + 0.5;
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  function pieceHeightUnits(type) {
    return type === 'k' ? 76 : type === 'q' ? 66 : type === 'b' ? 70 : type === 'r' ? 64 : type === 'n' ? 58 : 56;
  }

  function piecePalette(color) {
    if (color === 'w') {
      return { top: '#fffaf0', mid: '#ecdfc6', low: '#bea77d', stroke: '#5a472b', under: 'rgba(10, 8, 4, 0.34)' };
    }
    return { top: '#93a6ba', mid: '#4b5f74', low: '#1b2733', stroke: '#071018', under: 'rgba(0, 0, 0, 0.48)' };
  }

  function drawPiece(p, x, baseY, tsec, moving) {
    var S = view.TW / 106;
    var pal = piecePalette(p.color);
    var height = pieceHeightUnits(p.type);

    // drop shadow
    ctx.save();
    ctx.translate(x, baseY + view.TH * 0.10);
    ctx.scale(1, 0.38);
    var sg = ctx.createRadialGradient(0, 0, 0, 0, 0, view.TW * 0.36);
    sg.addColorStop(0, 'rgba(0, 0, 0, 0.46)');
    sg.addColorStop(0.6, 'rgba(0, 0, 0, 0.22)');
    sg.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(0, 0, view.TW * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(x, baseY - (moving ? Math.sin((tsec * 8) % Math.PI) * 0 : 0));
    ctx.scale(S, S);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // under-extrusion for a carved, weighty look
    ctx.save();
    ctx.translate(0, 3.2);
    ctx.fillStyle = pal.under;
    drawPieceBody(p.type, true, pal);
    ctx.restore();

    drawPieceBody(p.type, false, pal);
    ctx.restore();
  }

  function drawPieceBody(type, under, pal) {
    function part(build, useStroke) {
      ctx.beginPath();
      build();
      if (under) {
        ctx.fillStyle = pal.under;
        ctx.fill();
        return;
      }
      var g = ctx.createLinearGradient(0, -72, 0, 4);
      g.addColorStop(0, pal.top);
      g.addColorStop(0.48, pal.mid);
      g.addColorStop(1, pal.low);
      ctx.fillStyle = g;
      ctx.fill();
      if (useStroke !== false) {
        ctx.strokeStyle = pal.stroke;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // Base plinth shared by all pieces
    part(function () { roundRectPath(-22, -8, 44, 8, 3.4); });
    part(function () { ctx.ellipse(0, -8, 21, 3.8, 0, 0, Math.PI * 2); }, false);

    if (type === 'p') {
      part(function () {
        ctx.moveTo(-9, -8);
        ctx.bezierCurveTo(-9, -20, -7.5, -25, -5, -29);
        ctx.lineTo(5, -29);
        ctx.bezierCurveTo(7.5, -25, 9, -20, 9, -8);
        ctx.closePath();
      });
      part(function () { ctx.ellipse(0, -30, 9.5, 3.2, 0, 0, Math.PI * 2); }, false);
      part(function () { ctx.arc(0, -41, 10.5, 0, Math.PI * 2); });
      if (!under) {
        ctx.beginPath();
        ctx.arc(-4, -44, 3.6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
        ctx.fill();
      }
    } else if (type === 'r') {
      part(function () {
        ctx.moveTo(-14, -8);
        ctx.lineTo(-11, -46);
        ctx.lineTo(11, -46);
        ctx.lineTo(14, -8);
        ctx.closePath();
      });
      part(function () { roundRectPath(-17, -57, 34, 11, 2); });
      part(function () { ctx.rect(-17, -64, 8, 8); });
      part(function () { ctx.rect(-4, -64, 8, 8); });
      part(function () { ctx.rect(9, -64, 8, 8); });
      if (!under) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-10, -18); ctx.lineTo(10, -18);
        ctx.moveTo(-11, -40); ctx.lineTo(11, -40);
        ctx.stroke();
      }
    } else if (type === 'n') {
      part(function () {
        ctx.moveTo(-14, -8);
        ctx.lineTo(-14, -18);
        ctx.bezierCurveTo(-17, -24, -20, -28, -23, -31);
        ctx.bezierCurveTo(-27, -34, -29, -38, -27, -41);
        ctx.bezierCurveTo(-25, -44, -21, -44, -18, -42);
        ctx.lineTo(-12, -46);
        ctx.lineTo(-7, -58);
        ctx.lineTo(-2, -48);
        ctx.bezierCurveTo(4, -47, 8, -42, 8, -37);
        ctx.bezierCurveTo(8, -32, 4, -29, 0, -27);
        ctx.bezierCurveTo(5, -21, 9, -13, 10, -8);
        ctx.closePath();
      });
      if (!under) {
        ctx.beginPath();
        ctx.arc(-21.5, -40, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = pal.stroke;
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-8.5, -53);
        ctx.bezierCurveTo(-10, -44, -8, -36, -3, -30);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    } else if (type === 'b') {
      part(function () {
        ctx.moveTo(-7, -8);
        ctx.lineTo(-5, -32);
        ctx.lineTo(5, -32);
        ctx.lineTo(7, -8);
        ctx.closePath();
      });
      part(function () { ctx.ellipse(0, -33, 10.5, 3.4, 0, 0, Math.PI * 2); }, false);
      part(function () {
        ctx.moveTo(0, -65);
        ctx.bezierCurveTo(10, -59, 13, -49, 10, -40);
        ctx.bezierCurveTo(8, -34, -8, -34, -10, -40);
        ctx.bezierCurveTo(-13, -49, -10, -59, 0, -65);
        ctx.closePath();
      });
      part(function () { ctx.arc(0, -66.5, 3, 0, Math.PI * 2); });
      if (!under) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.24)';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(0, -58); ctx.lineTo(0, -47);
        ctx.moveTo(0, -52); ctx.lineTo(4, -47);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-3.5, -45, 1.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.fill();
      }
    } else if (type === 'q') {
      part(function () {
        ctx.moveTo(-11, -8);
        ctx.bezierCurveTo(-12, -22, -16, -34, -19, -40);
        ctx.lineTo(19, -40);
        ctx.bezierCurveTo(16, -34, 12, -22, 11, -8);
        ctx.closePath();
      });
      part(function () { ctx.ellipse(0, -40, 19, 4.2, 0, 0, Math.PI * 2); }, false);
      part(function () {
        ctx.moveTo(-17, -41);
        ctx.lineTo(-20, -56);
        ctx.lineTo(-10, -48);
        ctx.lineTo(0, -60);
        ctx.lineTo(10, -48);
        ctx.lineTo(20, -56);
        ctx.lineTo(17, -41);
        ctx.closePath();
      });
      part(function () { ctx.arc(-20, -57, 2.6, 0, Math.PI * 2); });
      part(function () { ctx.arc(0, -61, 2.8, 0, Math.PI * 2); });
      part(function () { ctx.arc(20, -57, 2.6, 0, Math.PI * 2); });
      if (!under) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-15, -44); ctx.lineTo(15, -44);
        ctx.stroke();
      }
    } else if (type === 'k') {
      part(function () {
        ctx.moveTo(-11, -8);
        ctx.bezierCurveTo(-12, -23, -16, -35, -18, -41);
        ctx.lineTo(18, -41);
        ctx.bezierCurveTo(16, -35, 12, -23, 11, -8);
        ctx.closePath();
      });
      part(function () { ctx.ellipse(0, -41, 18, 4.2, 0, 0, Math.PI * 2); }, false);
      part(function () {
        ctx.moveTo(-16, -42);
        ctx.lineTo(-18, -54);
        ctx.lineTo(-8, -48);
        ctx.lineTo(0, -58);
        ctx.lineTo(8, -48);
        ctx.lineTo(18, -54);
        ctx.lineTo(16, -42);
        ctx.closePath();
      });
      part(function () { roundRectPath(-2.4, -72, 4.8, 15, 1); });
      part(function () { roundRectPath(-8, -66, 16, 4.6, 1); });
      if (!under) {
        ctx.fillStyle = 'rgba(255, 200, 87, 0.55)';
        ctx.beginPath();
        ctx.arc(0, -51, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /* ==========================================================
     PART 10 — GAME FLOW
     ========================================================== */

  function selectSquare(sq) {
    if (!sq) return;
    var p = pieceAt(game, sq.f, sq.r);
    if (UI.selected) {
      var matches = UI.legal.filter(function (m) { return m.to.f === sq.f && m.to.r === sq.r; });
      if (matches.length) {
        attemptMove(UI.selected, { f: sq.f, r: sq.r }, null);
        return;
      }
    }
    if (p) {
      inspectPiece(p.type, p.color, sq.f, sq.r);
      if (!UI.gameOver && p.color === game.turn && !(UI.mode === 'puzzle' && UI.puzzleSolved)) {
        UI.selected = { f: sq.f, r: sq.r };
        UI.legal = legalMoves(game, game.turn).filter(function (m) {
          return m.from.f === sq.f && m.from.r === sq.r;
        });
        UI.pattern = [];
        playSound('select');
      } else {
        UI.selected = null;
        UI.legal = [];
      }
    } else {
      if (UI.selected) UI.pattern = UI.pattern;
      UI.selected = null;
      UI.legal = [];
      if (UI.mode === 'casual') {
        UI.inspector = null;
        UI.inspectSquare = null;
        UI.pattern = [];
        updateInspector();
      }
    }
    updateTurn();
    updateButtons();
  }

  function attemptMove(from, to, promo) {
    if (UI.mode === 'puzzle' && UI.puzzleSolved) return;
    var candidates = UI.legal.filter(function (m) {
      return m.from.f === from.f && m.from.r === from.r && m.to.f === to.f && m.to.r === to.r;
    });
    if (!candidates.length) {
      playSound('error');
      return;
    }
    var promoOptions = candidates.filter(function (m) { return !!m.promotion; });
    if (promoOptions.length && !promo) {
      UI.promotionPending = { from: from, to: to };
      var promoColor = game.turn;
      $$('.promo-choice').forEach(function (choice) {
        var type = choice.getAttribute('data-promo');
        var glyph = choice.querySelector('.promo-glyph');
        if (glyph) {
          glyph.textContent = pieceGlyph(type, promoColor);
          glyph.setAttribute('data-glyph', promoColor + type);
        }
      });
      openModal(els.promotionModal, els.promotionModal.querySelector('.promo-choice'));
      return;
    }
    var move = promo ? candidates.filter(function (m) { return m.promotion === promo; })[0] : candidates[0];
    if (!move) return;

    if (UI.mode === 'puzzle') {
      if (!puzzleMoveIsCorrect(move)) {
        UI.legal = [];
        UI.selected = null;
        UI.pattern = [];
        UI.puzzleAttempts++;
        UI.puzzleStats.attempts++;
        UI.puzzleStats.streak = 0;
        playSound('error');
        showToast(t('message.wrongPuzzle'));
        setCoach(t('message.wrongPuzzle'), 'ยังไม่ใช่ มองหาแนวคิดในคำใบ้', 'warn');
        updateStatus();
        updatePuzzleUI();
        updateButtons();
        saveState();
        return;
      }
      commitMove(move, true);
      return;
    }

    commitMove(move, true);
  }

  function puzzleMoveIsCorrect(m) {
    var p = getPuzzle(UI.puzzleId);
    if (!p) return false;
    var exp = p.expected;
    if (sqName(m.from.f, m.from.r) !== exp.from || sqName(m.to.f, m.to.r) !== exp.to) return false;
    if (exp.castle && m.castle !== exp.castle) return false;
    if (exp.promotion && m.promotion !== exp.promotion) return false;
    var test = cloneGame(game, false);
    applyInternal(test, m);
    if (exp.mate && gameStatus(test).type !== 'checkmate') return false;
    if (exp.check && !inCheck(test, test.turn)) return false;
    return true;
  }

  function commitMove(move, animated) {
    var mover = move.color;
    var wasCastle = !!move.castle;
    var wasCapture = !!move.ep || !!game.board[idx(move.to.f, move.to.r)];
    var source = tileCenter(move.from.f, move.from.r);
    var dest = tileCenter(move.to.f, move.to.r);

    playMove(game, move);
    UI.lastMove = move;
    UI.selected = null;
    UI.legal = [];
    UI.pattern = [];
    UI.inspector = null;
    UI.inspectSquare = null;
    UI.hover = null;
    if (animated) {
      UI.anim = { move: move, start: performance.now(), dur: 260 };
    }
    if (wasCapture) {
      UI.flash = { f: move.to.f, r: move.to.r, start: performance.now() };
    }

    if (move.piece === 'p' && move.promotion) playSound('promote');
    else if (wasCastle) playSound('castle');
    else if (wasCapture) playSound('capture');
    else playSound('move');

    if (!UI.clockRunning && UI.mode === 'casual' && !UI.gameOver) {
      UI.clockWasRunning = false;
      UI.clockRunning = true;
      UI.lastTick = Date.now();
    }

    if (UI.mode === 'puzzle') {
      var p = getPuzzle(UI.puzzleId);
      UI.puzzleSolved = true;
      var newlySolved = UI.puzzleStats.solved.indexOf(UI.puzzleId) === -1;
      if (newlySolved) {
        UI.puzzleStats.solved.push(UI.puzzleId);
        UI.puzzleStats.streak = (UI.puzzleStats.streak || 0) + 1;
        UI.puzzleStats.best = Math.max(UI.puzzleStats.best || 0, UI.puzzleStats.streak);
      }
      updatePuzzleUI();
      updateStatus();
      updateTurn();
      updateHistory();
      updateButtons();
      playSound('success');
      setCoach(p.success[UI.lang], p.success[UI.lang === 'en' ? 'th' : 'en'], 'good');
      saveState();
      setTimeout(function () {
        if (UI.mode !== 'puzzle' || UI.puzzleId !== p.id) return;
        openPuzzleSolved(p);
      }, 430);
      return;
    }

    var st = gameStatus(game);
    if (st.type === 'check') playSound('check');

    if (st.type === 'checkmate' || st.type === 'stalemate' || st.type === 'draw') {
      UI.gameOver = true;
      UI.gameOverInfo = st;
      UI.clockRunning = false;
      UI.stats.games++;
      saveState();
      updateClocks();
      updateTurn();
      updateStatus();
      updateHistory();
      updateButtons();
      coachAfterMove();
      playSound('end');
      setTimeout(function () { openEndModal(st); }, 520);
      return;
    }

    // Look for a teaching moment after the move.
    var analysis = analyzeBlunder(game, move);
    move.blunder = analysis || null;
    if (analysis) {
      UI.stats.blunders++;
      saveState();
      if (UI.guard && (analysis.severity === 'high' || analysis.severity === 'medium')) {
        playSound('blunder');
        setTimeout(function () {
          if (UI.mode !== 'casual' || UI.gameOver) return;
          openBlunderModal(move);
        }, animated ? 340 : 80);
      }
    }

    updateAll();
    coachAfterMove();
    saveState();
  }

  function openEndModal(st) {
    if (!els.endModal) return;
    var title = t('end.draw');
    var text = '';
    var winner = null;
    if (st.type === 'checkmate') {
      title = t('end.checkmate');
      winner = game.turn === 'w' ? t('side.black') : t('side.white');
      text = t('end.checkmateText', { winner: winner });
    } else if (st.type === 'stalemate') {
      title = t('end.stalemate');
      text = t('end.stalemateText');
    } else if (st.type === 'draw') {
      title = t('end.draw');
      var reasonMap = { fifty: 'fifty-move rule', threefold: 'threefold repetition', material: 'insufficient material' };
      text = t('end.drawText', { reason: reasonMap[st.reason] || 'insufficient material' });
    } else if (st.type === 'time') {
      title = t('end.time');
      winner = st.winner === 'w' ? t('side.white') : t('side.black');
      text = t('end.timeText', { winner: winner });
    }
    els.endTitle.textContent = title;
    els.endText.textContent = text;
    var bal = materialBalance(game);
    var gameBlunders = game.history.filter(function (x) { return !!x.blunder; }).length;
    els.endStats.innerHTML = '';
    [[t('end.moves'), String(game.history.length)],
     [t('end.material'), bal.diff === 0 ? t('status.even') : (bal.diff > 0 ? '+' + bal.diff + ' W' : '+' + (-bal.diff) + ' B')],
     [t('end.blunders'), String(gameBlunders)]
    ].forEach(function (row) {
      var d = document.createElement('div');
      var s = document.createElement('span');
      s.textContent = row[0];
      var strong = document.createElement('strong');
      strong.textContent = row[1];
      d.appendChild(s); d.appendChild(strong);
      els.endStats.appendChild(d);
    });
    openModal(els.endModal, els.endNew);
  }

  function openBlunderModal(move) {
    var b = move.blunder;
    var ex = explainBlunder(b);
    els.learnEyebrow.textContent = t('learn.eyebrow');
    els.learnTitle.textContent = t('learn.blunderTitle');
    els.learnBody.innerHTML = '';
    var p1 = document.createElement('p');
    p1.setAttribute('lang', UI.lang);
    p1.textContent = UI.lang === 'en' ? ex.en : ex.th;
    var tip = document.createElement('p');
    tip.className = 'learn-tip';
    tip.setAttribute('lang', UI.lang);
    tip.textContent = b.kind === 'mate' ? t('blunder.mateTip') : t('blunder.tip');
    els.learnBody.appendChild(p1);
    els.learnBody.appendChild(tip);
    els.learnUndo.classList.remove('hidden');
    els.learnUndo.textContent = t('btn.undoLearn');
    els.learnClose.textContent = t('btn.keep');
    UI.learnAction = 'undo';
    UI.learnContext = { kind: 'blunder', move: move };
    openModal(els.learnModal, els.learnUndo);
  }

  function openUndoLearn(move) {
    var ex = explainBlunder(move.blunder);
    els.learnEyebrow.textContent = t('learn.eyebrow');
    els.learnTitle.textContent = t('learn.whyTitle');
    els.learnBody.innerHTML = '';
    var p1 = document.createElement('p');
    p1.setAttribute('lang', UI.lang);
    p1.textContent = UI.lang === 'en' ? ex.en : ex.th;
    var tip = document.createElement('p');
    tip.className = 'learn-tip';
    tip.setAttribute('lang', UI.lang);
    tip.textContent = t('blunder.safe');
    els.learnBody.appendChild(p1); els.learnBody.appendChild(tip);
    els.learnUndo.classList.add('hidden');
    els.learnClose.textContent = t('btn.close') || 'Got it';
    UI.learnAction = 'close';
    UI.learnContext = { kind: 'undo', move: move };
    openModal(els.learnModal, els.learnClose);
  }

  function undoLast(showLearn) {
    if (UI.mode !== 'casual' || !game.history.length) return;
    var removed = game.history[game.history.length - 1];
    var kept = game.history.slice(0, -1);
    game = createGame(removed.fenBefore);
    game.history = kept;
    game.positionCounts = {};
    game.positionCounts[posKey(game)] = 1;
    UI.lastMove = kept.length ? kept[kept.length - 1] : null;
    UI.selected = null;
    UI.legal = [];
    UI.pattern = [];
    UI.inspector = null;
    UI.gameOver = false;
    UI.gameOverInfo = null;
    UI.anim = null;
    UI.flash = null;
    if (!kept.length) { UI.clockRunning = false; }
    else { UI.clockRunning = true; UI.lastTick = Date.now(); }
    playSound('undo');
    updateAll();
    coachAfterMove();
    saveState();
    if (showLearn && removed.blunder) {
      openUndoLearn(removed);
    } else {
      showToast(t('message.undo'));
    }
  }

  function newGame() {
    closeAllModals();
    UI.mode = 'casual';
    UI.puzzleId = null;
    UI.puzzleSolved = false;
    UI.savedCasual = null;
    UI.startFen = START_FEN;
    game = createGame(START_FEN);
    UI.clocks = { w: CLOCK_START, b: CLOCK_START };
    UI.clockRunning = false;
    UI.lastTick = 0;
    UI.gameOver = false;
    UI.gameOverInfo = null;
    UI.selected = null;
    UI.legal = [];
    UI.pattern = [];
    UI.hover = null;
    UI.lastMove = null;
    UI.anim = null;
    UI.flash = null;
    UI.inspector = null;
    UI.inspectSquare = null;
    UI.promotionPending = null;
    playSound('select');
    updateAll();
    setCoach(TIPS[0].en, TIPS[0].th, 'ok');
    showToast(t('message.welcome'));
    saveState();
    board.focus();
  }

  function resetGame() {
    if (UI.mode === 'puzzle') { retryPuzzle(); return; }
    if (!game.history.length) return;
    newGame();
  }

  /* ==========================================================
     PART 11 — PUZZLES
     ========================================================== */

  function getPuzzle(id) {
    for (var i = 0; i < puzzles.length; i++) if (puzzles[i].id === id) return puzzles[i];
    return null;
  }

  function enterPuzzle(id) {
    var p = getPuzzle(id);
    if (!p) return;
    if (UI.mode !== 'puzzle') {
      UI.savedCasual = serializeCasual();
    }
    closeAllModals();
    UI.mode = 'puzzle';
    UI.puzzleId = id;
    UI.puzzleSolved = false;
    UI.puzzleAttempts = 0;
    UI.puzzleHintVisible = false;
    UI.startFen = p.fen;
    UI.gameOver = false;
    UI.gameOverInfo = null;
    UI.clockRunning = false;
    UI.selected = null;
    UI.legal = [];
    UI.pattern = [];
    UI.hover = null;
    UI.anim = null;
    UI.flash = null;
    UI.inspector = null;
    UI.inspectSquare = null;
    UI.lastMove = null;
    UI.clockRunning = false;
    try {
      game = createGame(p.fen);
    } catch (err) {
      showToast('Puzzle FEN error: ' + p.id);
      UI.mode = 'casual';
      return;
    }
    setTab('puzzles');
    updateAll();
    setCoach(p.goal[UI.lang], p.goal[UI.lang === 'en' ? 'th' : 'en'], 'ok');
    showToast(t('message.puzzleLoad'));
    playSound('select');
    saveState();
  }

  function exitPuzzle() {
    if (UI.mode !== 'puzzle') return;
    closeAllModals();
    UI.mode = 'casual';
    UI.puzzleId = null;
    UI.puzzleSolved = false;
    UI.gameOver = false;
    UI.gameOverInfo = null;
    if (UI.savedCasual) {
      var ok = restoreCasual(UI.savedCasual);
      if (!ok) { game = createGame(START_FEN); UI.startFen = START_FEN; }
    }
    UI.savedCasual = null;
    UI.selected = null;
    UI.legal = [];
    UI.pattern = [];
    UI.inspector = null;
    UI.anim = null;
    UI.clockRunning = game.history.length > 0 && !UI.gameOver;
    UI.lastTick = Date.now();
    updateAll();
    coachAfterMove();
    showToast(t('message.resume'));
    saveState();
  }

  function retryPuzzle() {
    var p = getPuzzle(UI.puzzleId);
    if (!p) return;
    closeAllModals();
    UI.puzzleSolved = false;
    UI.puzzleHintVisible = false;
    UI.selected = null;
    UI.legal = [];
    UI.pattern = [];
    UI.lastMove = null;
    UI.anim = null;
    game = createGame(p.fen);
    updateAll();
    setCoach(p.goal[UI.lang], p.goal[UI.lang === 'en' ? 'th' : 'en'], 'ok');
    saveState();
  }

  function openPuzzleSolved(p) {
    els.puzzleEyebrow.textContent = t('puzzles.solvedEyebrow');
    els.puzzleTitle.textContent = p.title[UI.lang];
    els.puzzleText.textContent = p.success[UI.lang];
    els.puzzleLesson.innerHTML = '';
    var p1 = document.createElement('p');
    p1.setAttribute('lang', UI.lang);
    p1.textContent = p.lesson[UI.lang];
    els.puzzleLesson.appendChild(p1);
    els.puzzleLesson.classList.remove('hidden');
    UI.puzzleModalData = p;
    openModal(els.puzzleModal, els.puzzleNext);
    updatePuzzleUI();
  }

  function nextPuzzle() {
    closeAllModals();
    var current = puzzles.findIndex(function (x) { return x.id === UI.puzzleId; });
    var solved = UI.puzzleStats.solved;
    for (var step = 1; step <= puzzles.length; step++) {
      var cand = puzzles[(current + step) % puzzles.length];
      if (solved.indexOf(cand.id) === -1) { enterPuzzle(cand.id); return; }
    }
    closeAllModals();
    exitPuzzle();
    showToast(t('message.puzzleAll'));
  }

  /* ==========================================================
     PART 12 — EXPORT
     ========================================================== */

  function resultString() {
    if (!UI.gameOver || !UI.gameOverInfo) return '*';
    var st = UI.gameOverInfo;
    if (st.type === 'checkmate' || st.type === 'time') {
      return game.turn === 'b' ? '1-0' : '0-1';
    }
    return '1/2-1/2';
  }

  function buildPgn() {
    var date = new Date();
    var d = date.getFullYear() + '.' + String(date.getMonth() + 1).padStart(2, '0') + '.' + String(date.getDate()).padStart(2, '0');
    var white = UI.mode === 'puzzle' ? 'Student' : 'White';
    var black = UI.mode === 'puzzle' ? 'Coach' : 'Black';
    var headers = [
      '[Event "Isometric Chess Academy & Studio"]',
      '[Site "https://somphol.github.io/isometric-chess-academy/"]',
      '[Date "' + d + '"]',
      '[White "' + white + '"]',
      '[Black "' + black + '"]',
      '[Result "' + resultString() + '"]',
      '[TimeControl "600+0"]',
      '[Orientation "isometric-2.5d"]',
      '[Annotator "OpenCode / DeepSeek V4.1 Flash"]'
    ];
    if (UI.startFen && UI.startFen !== START_FEN) {
      headers.push('[SetUp "1"]');
      headers.push('[FEN "' + UI.startFen + '"]');
    }
    var body = '';
    for (var i = 0; i < game.history.length; i += 2) {
      body += (i / 2 + 1) + '. ' + game.history[i].san;
      if (game.history[i + 1]) body += ' ' + game.history[i + 1].san;
      body += ' ';
    }
    body += resultString();
    return headers.join('\n') + '\n\n' + body.trim() + '\n';
  }

  function buildJson() {
    return JSON.stringify({
      app: 'Isometric Chess Academy & Studio',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      fen: toFen(game),
      startFen: UI.startFen,
      pgn: buildPgn(),
      turn: game.turn,
      status: gameStatus(game),
      clocks: UI.clocks,
      history: game.history.map(function (m) {
        return {
          san: m.san,
          from: sqName(m.from.f, m.from.r),
          to: sqName(m.to.f, m.to.r),
          promotion: m.promotion || null,
          castle: m.castle || null,
          captured: m.captured || null,
          fenAfter: m.fenAfter
        };
      }),
      puzzles: UI.puzzleStats,
      stats: UI.stats,
      settings: { lang: UI.lang, sound: UI.sound, learning: UI.learning, guard: UI.guard, flipped: UI.flipped }
    }, null, 2);
  }

  function download(filename, text, mime) {
    try {
      var blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 200);
      showToast(t('message.exported'));
    } catch (err) {
      showToast(t('message.exported'));
    }
  }

  /* ==========================================================
     PART 13 — MODALS, TOAST, KEYBOARD
     ========================================================== */

  function openModal(layer, focusEl) {
    if (!layer) return;
    if (!UI.modalOpen) {
      UI.clockWasRunning = UI.clockRunning;
      UI.clockRunning = false;
    }
    layer.classList.remove('hidden');
    UI.modalOpen = true;
    if (focusEl) setTimeout(function () { try { focusEl.focus(); } catch (err) {} }, 60);
  }

  function closeModal(layer) {
    if (!layer) return;
    layer.classList.add('hidden');
    var stillOpen = $$('.modal-layer:not(.hidden)').length > 0;
    UI.modalOpen = stillOpen;
    if (!stillOpen) resumeClockAfterModal();
  }

  function closeAllModals() {
    $$('.modal-layer').forEach(function (m) { m.classList.add('hidden'); });
    UI.modalOpen = false;
    UI.promotionPending = null;
    UI.learnAction = null;
    resumeClockAfterModal();
  }

  function resumeClockAfterModal() {
    if (!UI.clockWasRunning) return;
    UI.clockWasRunning = false;
    if (UI.gameOver || UI.mode !== 'casual' || !game.history.length) return;
    UI.clockRunning = true;
    UI.lastTick = Date.now();
  }

  function showToast(msg) {
    if (!els.boardToast) return;
    els.boardToast.textContent = msg;
    els.boardToast.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      els.boardToast.classList.remove('is-show');
    }, 3000);
  }

  /* ==========================================================
     PART 14 — EVENT WIRING
     ========================================================== */

  function wireEvents() {
    // Language
    els.langBtn.addEventListener('click', function () {
      setLanguage(UI.lang === 'en' ? 'th' : 'en');
      showToast(UI.lang === 'th' ? 'เปลี่ยนเป็นภาษาไทยแล้ว' : 'Switched to English.');
    });

    // Sound
    els.soundBtn.addEventListener('click', function () {
      setSound(!UI.sound);
      showToast(UI.sound ? t('message.soundOn') : t('message.soundOff'));
    });

    // New game
    els.newGameBtn.addEventListener('click', function () {
      newGame();
      setTab('play');
    });

    // Guard / learning / flip
    els.guardBtn.addEventListener('click', function () {
      setGuard(!UI.guard);
      showToast(UI.guard ? t('message.guardOn') : t('message.guardOff'));
    });
    els.learnToggle.addEventListener('change', function () {
      setLearning(els.learnToggle.checked);
      showToast(UI.learning ? t('message.learningOn') : t('message.learningOff'));
    });
    els.flipBtn.addEventListener('click', function () {
      UI.flipped = !UI.flipped;
      boardCacheDirty = true;
      playSound('select');
      saveState();
      showToast(t('message.flipped'));
    });

    // Tabs
    $$('.tab').forEach(function (b) {
      b.addEventListener('click', function () {
        setTab(b.getAttribute('data-tab'));
        if (b.getAttribute('data-tab') === 'academy' && !UI.inspector) {
          setCoach('Click a piece to meet it.', 'คลิกหมากเพื่อทำความรู้จัก', 'ok');
        }
        if (global.innerWidth < 1180 && els.tabPlay) {
          var side = document.querySelector('.sidebar');
          if (side) side.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // Undo / reset
    els.undoBtn.addEventListener('click', function () {
      var last = game.history.length ? game.history[game.history.length - 1] : null;
      undoLast(!!(last && last.blunder));
    });
    els.resetBtn.addEventListener('click', resetGame);

    // Export
    els.exportPgnBtn.addEventListener('click', function () {
      download('isometric_chess_game.pgn', buildPgn(), 'application/x-chess-pgn;charset=utf-8');
      showToast(t('message.exportPgn'));
    });
    els.exportJsonBtn.addEventListener('click', function () {
      download('isometric_chess_progress.json', buildJson(), 'application/json;charset=utf-8');
      showToast(t('message.exported'));
    });

    // Clear data
    els.clearBtn.addEventListener('click', function () {
      if (!global.confirm || global.confirm(t('message.confirmClear'))) {
        try { localStorage.removeItem(STORAGE_KEY); } catch (err) {}
        UI.puzzleStats = { solved: [], streak: 0, best: 0, attempts: 0 };
        UI.stats = { games: 0, blunders: 0 };
        UI.lang = 'en';
        UI.sound = true;
        UI.learning = true;
        UI.guard = true;
        UI.flipped = false;
        newGame();
        updatePuzzleUI();
        showToast(t('message.cleared'));
      }
    });

    // Piece chips
    $$('.piece-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var type = chip.getAttribute('data-inspect');
        var found = null;
        for (var i = 0; i < 64; i++) {
          var p = game.board[i];
          if (p && p.type === type) { found = p; break; }
        }
        if (found) {
          var f = i % 8, r = Math.floor(i / 8);
          inspectPiece(type, found.color, f, r);
          UI.selected = null;
          UI.legal = [];
          if (!UI.gameOver && found.color === game.turn && !(UI.mode === 'puzzle' && UI.puzzleSolved)) {
            UI.selected = { f: f, r: r };
            UI.legal = legalMoves(game, game.turn).filter(function (m) { return m.from.f === f && m.from.r === r; });
          }
        } else {
          UI.inspector = { type: type, color: 'w', f: null, r: null };
          UI.pattern = [];
          updateInspector();
        }
        playSound('select');
      });
    });

    // Open the full inspector from the compact play card
    if (els.peekMore) {
      els.peekMore.addEventListener('click', function () {
        setTab('academy');
        var side = document.querySelector('.sidebar');
        if (side && global.innerWidth < 1180) side.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    // Promotion choices
    $$('.promo-choice').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var pending = UI.promotionPending;
        if (!pending) return;
        var promo = btn.getAttribute('data-promo');
        UI.promotionPending = null;
        closeModal(els.promotionModal);
        attemptMove(pending.from, pending.to, promo);
      });
    });

    // Learn modal actions
    els.learnUndo.addEventListener('click', function () {
      closeModal(els.learnModal);
      if (UI.learnAction === 'undo') undoLast(false);
    });
    els.learnClose.addEventListener('click', function () {
      closeModal(els.learnModal);
      if (UI.learnAction === 'undo') {
        showToast(t('message.kept'));
      }
    });

    // End modal
    els.endNew.addEventListener('click', newGame);
    els.endReview.addEventListener('click', function () { closeModal(els.endModal); board.focus(); });

    // Puzzle modal
    els.puzzleNext.addEventListener('click', function () { closeAllModals(); nextPuzzle(); });
    els.puzzleBack.addEventListener('click', function () { closeAllModals(); exitPuzzle(); });

    // Puzzles
    els.puzzleExit.addEventListener('click', exitPuzzle);
    els.puzzleHintBtn.addEventListener('click', function () {
      if (UI.mode !== 'puzzle') return;
      UI.puzzleHintVisible = true;
      updatePuzzleUI();
      playSound('select');
    });
    els.puzzleResetBtn.addEventListener('click', retryPuzzle);

    // Board pointer
    board.addEventListener('pointermove', function (ev) {
      if (ev.pointerType && ev.pointerType !== 'mouse') return;
      var rect = board.getBoundingClientRect();
      var x = ev.clientX - rect.left, y = ev.clientY - rect.top;
      var sq = hitSquare(x, y);
      var changed = (sq && (!UI.hover || sq.f !== UI.hover.f || sq.r !== UI.hover.r)) || (!sq && UI.hover);
      if (changed) UI.hover = sq ? { f: sq.f, r: sq.r } : null;
      board.style.cursor = sq ? 'pointer' : 'default';
    });
    board.addEventListener('pointerleave', function () { UI.hover = null; });
    board.addEventListener('click', function (ev) {
      if (UI.modalOpen) return;
      try { board.focus({ preventScroll: true }); } catch (err) { board.focus(); }
      var rect = board.getBoundingClientRect();
      var x = ev.clientX - rect.left, y = ev.clientY - rect.top;
      var sq = hitSquare(x, y);
      if (!sq) {
        UI.selected = null;
        UI.legal = [];
        return;
      }
      UI.cursor = { f: sq.f, r: sq.r };
      selectSquare(sq);
    });
    board.addEventListener('keydown', function (ev) {
      if (UI.modalOpen) return;
      var key = ev.key;
      if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown') {
        ev.preventDefault();
        if (key === 'ArrowLeft') UI.cursor.f = (UI.cursor.f + 7) % 8;
        if (key === 'ArrowRight') UI.cursor.f = (UI.cursor.f + 1) % 8;
        if (key === 'ArrowUp') UI.cursor.r = (UI.cursor.r + 1) % 8;
        if (key === 'ArrowDown') UI.cursor.r = (UI.cursor.r + 7) % 8;
        return;
      }
      if (key === 'Enter' || key === ' ') {
        ev.preventDefault();
        selectSquare({ f: UI.cursor.f, r: UI.cursor.r });
        return;
      }
      if (key === 'Escape') {
        UI.selected = null;
        UI.legal = [];
        UI.hover = null;
      }
    });

    // Escape closes informational modals
    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape') return;
      if (!els.promotionModal.classList.contains('hidden')) return;
      if (!els.learnModal.classList.contains('hidden')) { closeModal(els.learnModal); return; }
      if (!els.endModal.classList.contains('hidden')) { closeModal(els.endModal); return; }
      if (!els.puzzleModal.classList.contains('hidden')) { closeModal(els.puzzleModal); }
    });

    // Clocks
    setInterval(function () {
      if (!UI.clockRunning || UI.gameOver || UI.mode !== 'casual' || !game.history.length) return;
      var now = Date.now();
      var dt = Math.min(2, (now - UI.lastTick) / 1000);
      UI.lastTick = now;
      var side = game.turn;
      UI.clocks[side] = Math.max(0, UI.clocks[side] - dt);
      updateClocks();
      if (UI.clocks[side] <= 0) {
        UI.clockRunning = false;
        UI.gameOver = true;
        var st = { type: 'time', winner: other(side), check: false };
        UI.gameOverInfo = st;
        updateTurn();
        updateStatus();
        playSound('end');
        saveState();
        openEndModal(st);
        return;
      }
      if (now - UI.lastSavedAt > 10000) saveState();
    }, 250);

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) UI.lastTick = Date.now();
    });

    // Resize
    if (global.ResizeObserver) {
      new ResizeObserver(function () { resizeBoard(); }).observe(board);
    } else {
      global.addEventListener('resize', resizeBoard);
    }
    global.addEventListener('resize', resizeBoard);

    // Persist when leaving
    global.addEventListener('beforeunload', saveState);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) saveState();
    });
  }

  /* ==========================================================
     PART 15 — BOOT
     ========================================================== */

  function parsePuzzles() {
    var node = document.getElementById('puzzle-data');
    if (!node) return [];
    try {
      var data = JSON.parse(node.textContent);
      if (!Array.isArray(data)) return [];
      return data.filter(function (p) {
        return p && p.id && p.fen && p.expected && p.title && p.goal;
      });
    } catch (err) {
      return [];
    }
  }

  function boot() {
    cacheEls();
    puzzles = parsePuzzles();
    loadState();
    if (!puzzles.length) {
      els.puzzleProgress.textContent = '0 / 0';
    }
    if (!UI.puzzleStats || !Array.isArray(UI.puzzleStats.solved)) {
      UI.puzzleStats = { solved: [], streak: 0, best: 0, attempts: 0 };
    }
    wireEvents();
    resizeBoard();
    setTab('play');
    updateAll();
    if (game.history.length) {
      var restoredStatus = gameStatus(game);
      if (restoredStatus.type === 'checkmate' || restoredStatus.type === 'stalemate' || restoredStatus.type === 'draw') {
        UI.gameOver = true;
        UI.gameOverInfo = restoredStatus;
        UI.clockRunning = false;
      }
      setCoach(t('message.resume'), 'กู้คืนเกมล่าสุดแล้ว เล่นต่อได้เลย', 'ok');
      UI.lastTick = Date.now();
      UI.clockRunning = game.history.length > 0 && !UI.gameOver;
      showToast(t('message.resume'));
    } else {
      setCoach(TIPS[0].en, TIPS[0].th, 'ok');
    }
    updateLanguageUI();
    requestAnimationFrame(drawFrame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // A tiny API for debugging and for the repository's automated checks.
  global.IsometricChess = {
    engine: Engine,
    i18n: I18N,
    pieceInfo: PIECE_INFO,
    getGame: function () { return game; },
    getState: function () { return UI; },
    getPuzzles: function () { return puzzles; },
    getView: function () { return { w: view.w, h: view.h, TW: view.TW, TH: view.TH, ox: view.ox, oy: view.oy, depth: view.depth }; },
    newGame: newGame,
    enterPuzzle: enterPuzzle,
    exitPuzzle: exitPuzzle,
    setLanguage: setLanguage,
    buildPgn: buildPgn,
    buildJson: buildJson,
    selectSquare: selectSquare,
    attemptMove: attemptMove
  };
})(typeof window !== 'undefined' ? window : globalThis);
