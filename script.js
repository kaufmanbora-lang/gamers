(() => {
  "use strict";

  const root = document.getElementById("game-root");
  const list = document.getElementById("game-list");
  const title = document.getElementById("game-title");
  const subtitle = document.getElementById("game-subtitle");
  const tag = document.getElementById("game-tag");
  const status = document.getElementById("status");
  const scorebar = document.getElementById("scorebar");
  const resetButton = document.getElementById("reset-game");
  const difficultyButtons = [...document.querySelectorAll(".difficulty-button")];
  const AI_DELAY = 260;

  let currentGame = null;
  let state = null;
  let aiTimer = 0;
  let currentDifficulty = "medium";

  const difficulties = {
    easy: {
      label: "Лёгкий",
      note: "ИИ чаще ошибается",
      level: 0,
    },
    medium: {
      label: "Средний",
      note: "ИИ видит простые угрозы",
      level: 1,
    },
    hard: {
      label: "Сложный",
      note: "ИИ играет расчётливо",
      level: 2,
    },
    cyber: {
      label: "Кибер",
      note: "ИИ почти не прощает",
      level: 3,
    },
  };

  const games = [
    ticTacToeGame(),
    connectFourGame(),
    gomokuGame(),
    reversiGame(),
    nimGame(),
    dotsGame(),
    battleshipGame(),
    pawnDuelGame(),
    memoryGame(),
    sum15Game(),
    rockPaperScissorsGame(),
    hangmanGame(),
    minesweeperGame(),
    game2048(),
    snakeGame(),
    sudokuGame(),
    blackjackGame(),
    guessNumberGame(),
    simonGame(),
    checkersGame(),
    tetrisGame(),
    breakoutGame(),
    flappyGame(),
    mazeChaseGame(),
    spaceInvadersGame(),
    asteroidsGame(),
    froggerGame(),
    sokobanGame(),
    match3Game(),
    whackMoleGame(),
  ];

  function make(tagName, className, text) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function button(className, text, disabled, onClick) {
    const node = make("button", className, text);
    node.type = "button";
    node.disabled = Boolean(disabled);
    if (onClick) node.addEventListener("click", onClick);
    return node;
  }

  function shuffled(items) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function sample(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function difficulty() {
    return difficulties[currentDifficulty] || difficulties.medium;
  }

  function levelAtLeast(name) {
    return difficulty().level >= difficulties[name].level;
  }

  function maybe(probability) {
    return Math.random() < probability;
  }

  function sum(items) {
    return items.reduce((total, item) => total + item, 0);
  }

  function setWinner(nextState, winner, text) {
    nextState.over = true;
    nextState.winner = winner;
    nextState.message = text;
  }

  function isHumanTurn() {
    return state && !state.over && !state.locked && state.turn === "H";
  }

  function setupNav() {
    list.innerHTML = "";
    games.forEach((game, index) => {
      const tab = button("game-tab", "", false, () => startGame(game.id));
      tab.dataset.game = game.id;
      tab.style.setProperty("--tab-color", game.color);
      const num = make("span", "tab-number", String(index + 1));
      const copy = make("span", "");
      copy.append(make("span", "tab-title", game.title));
      copy.append(make("span", "tab-subtitle", game.short));
      tab.append(num, copy);
      list.append(tab);
    });
  }

  function startGame(id) {
    window.clearTimeout(aiTimer);
    currentGame = games.find((game) => game.id === id) || games[0];
    state = currentGame.create();
    render();
    runAiIfNeeded();
  }

  function render() {
    if (!currentGame || !state) return;
    document.documentElement.style.setProperty("--human", currentGame.humanColor || "#0f766e");
    document.documentElement.style.setProperty("--ai", currentGame.aiColor || "#c2410c");
    title.textContent = currentGame.title;
    subtitle.textContent = currentGame.subtitle;
    tag.textContent = currentGame.tag;
    tag.style.background = currentGame.color;
    status.textContent = currentGame.status(state);
    status.style.borderLeftColor = currentGame.color;
    scorebar.innerHTML = "";
    const difficultyPill = make("span", "pill");
    const difficultyDot = make("span", "dot ai");
    difficultyPill.append(difficultyDot, document.createTextNode(`Сложность: ${difficulty().label} - ${difficulty().note}`));
    scorebar.append(difficultyPill);
    const graphicsPill = make("span", "pill graphics-pill");
    graphicsPill.append(make("span", "dot human"), document.createTextNode(currentGame.graphics || "2D графика"));
    scorebar.append(graphicsPill);
    currentGame.score(state).forEach((item) => {
      const pill = make("span", "pill");
      const dot = make("span", `dot ${item.side || ""}`);
      pill.append(dot, document.createTextNode(item.text));
      scorebar.append(pill);
    });
    root.innerHTML = "";
    root.className = `game-root modern-stage stage-${(currentGame.graphics || "2d").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    currentGame.render(state, root, commit);
    document.querySelectorAll(".game-tab").forEach((tabNode) => {
      tabNode.classList.toggle("active", tabNode.dataset.game === currentGame.id);
    });
    difficultyButtons.forEach((buttonNode) => {
      const active = buttonNode.dataset.difficulty === currentDifficulty;
      buttonNode.classList.toggle("active", active);
      buttonNode.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function commit() {
    render();
    runAiIfNeeded();
  }

  function runAiIfNeeded() {
    if (!currentGame || !state || state.over || state.turn !== "A") return;
    state.locked = true;
    render();
    status.textContent = "ИИ думает...";
    aiTimer = window.setTimeout(() => {
      currentGame.ai(state);
      state.locked = false;
      render();
      runAiIfNeeded();
    }, currentGame.aiDelay || AI_DELAY);
  }

  function linesFor(width, height) {
    const lines = [];
    const dirs = [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1],
    ];
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        dirs.forEach(([dx, dy]) => {
          const line = [];
          for (let step = 0; step < Math.max(width, height); step += 1) {
            const nx = x + dx * step;
            const ny = y + dy * step;
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) break;
            line.push(ny * width + nx);
          }
          if (line.length >= 3) lines.push(line);
        });
      }
    }
    return lines;
  }

  function winnerOnLines(board, lineLength, lines) {
    for (const line of lines) {
      for (let start = 0; start <= line.length - lineLength; start += 1) {
        const slice = line.slice(start, start + lineLength);
        const first = board[slice[0]];
        if (first && slice.every((index) => board[index] === first)) return first;
      }
    }
    if (board.every(Boolean)) return "draw";
    return "";
  }

  function ticTacToeGame() {
    const winLines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    function check(board) {
      for (const line of winLines) {
        const [a, b, c] = line;
        if (board[a] && board[a] === board[b] && board[b] === board[c]) return board[a];
      }
      return board.every(Boolean) ? "draw" : "";
    }

    function minimax(board, player) {
      const result = check(board);
      if (result === "A") return { score: 10 };
      if (result === "H") return { score: -10 };
      if (result === "draw") return { score: 0 };
      const moves = [];
      board.forEach((value, index) => {
        if (value) return;
        board[index] = player;
        const next = minimax(board, player === "A" ? "H" : "A").score;
        board[index] = "";
        moves.push({ index, score: player === "A" ? next : next });
      });
      return player === "A"
        ? moves.reduce((best, move) => (move.score > best.score ? move : best))
        : moves.reduce((best, move) => (move.score < best.score ? move : best));
    }

    function openCells(board) {
      return board.map((value, index) => (value ? -1 : index)).filter((index) => index >= 0);
    }

    function chooseHeuristic(board) {
      const open = openCells(board);
      for (const index of open) {
        const copy = board.slice();
        copy[index] = "A";
        if (check(copy) === "A") return index;
      }
      for (const index of open) {
        const copy = board.slice();
        copy[index] = "H";
        if (check(copy) === "H") return index;
      }
      if (!board[4]) return 4;
      return sample(open.filter((index) => [0, 2, 6, 8].includes(index))) ?? sample(open);
    }

    return {
      id: "tic-tac-toe",
      title: "Крестики-нолики",
      short: "3 на 3",
      subtitle: "Вы играете крестиками, компьютер отвечает ноликами.",
      tag: "Классика",
      color: "#0f766e",
      create: () => ({ board: Array(9).fill(""), turn: "H", over: false, winner: "" }),
      status: (s) => s.message || (s.turn === "H" ? "Ваш ход: выберите свободную клетку." : "Ход компьютера."),
      score: (s) => [
        { side: "human", text: "Вы: X" },
        { side: "ai", text: "ИИ: O" },
        { side: "", text: `Свободно: ${s.board.filter((cell) => !cell).length}` },
      ],
      render: (s, container, done) => {
        const board = make("div", "board mark-grid");
        board.style.setProperty("--cols", "3");
        board.style.setProperty("--board-size", "430px");
        s.board.forEach((cell, index) => {
          const node = button(
            `cell mark-cell ${cell === "H" ? "human" : cell === "A" ? "ai" : ""}`,
            cell === "H" ? "X" : cell === "A" ? "O" : "",
            !isHumanTurn() || Boolean(cell),
            () => {
              if (!isHumanTurn() || s.board[index]) return;
              s.board[index] = "H";
              const result = check(s.board);
              if (result === "H") setWinner(s, "H", "Вы победили.");
              else if (result === "draw") setWinner(s, "draw", "Ничья.");
              else s.turn = "A";
              done();
            },
          );
          board.append(node);
        });
        container.append(board);
      },
      ai: (s) => {
        const open = openCells(s.board);
        let move = sample(open);
        if (currentDifficulty === "medium") move = chooseHeuristic(s.board);
        if (levelAtLeast("hard")) move = minimax(s.board.slice(), "A").index;
        if (move !== undefined) s.board[move] = "A";
        const result = check(s.board);
        if (result === "A") setWinner(s, "A", "ИИ победил.");
        else if (result === "draw") setWinner(s, "draw", "Ничья.");
        else s.turn = "H";
      },
    };
  }

  function connectFourGame() {
    const rows = 6;
    const cols = 7;
    const lines = linesFor(cols, rows);

    function drop(board, col, player) {
      for (let row = rows - 1; row >= 0; row -= 1) {
        const index = row * cols + col;
        if (!board[index]) {
          board[index] = player;
          return index;
        }
      }
      return -1;
    }

    function validColumns(board) {
      return Array.from({ length: cols }, (_, col) => col).filter((col) => !board[col]);
    }

    function simulateDrop(board, col, player) {
      const copy = board.slice();
      drop(copy, col, player);
      return copy;
    }

    function evaluateBoard(board) {
      const winner = winnerOnLines(board, 4, lines);
      if (winner === "A") return 100000;
      if (winner === "H") return -100000;
      let score = board.filter((cell, index) => cell === "A" && index % cols === 3).length * 4;
      lines.forEach((line) => {
        for (let start = 0; start <= line.length - 4; start += 1) {
          const window = line.slice(start, start + 4).map((index) => board[index]);
          const aiCount = window.filter((cell) => cell === "A").length;
          const humanCount = window.filter((cell) => cell === "H").length;
          if (aiCount && !humanCount) score += [0, 1, 7, 65, 100000][aiCount];
          if (humanCount && !aiCount) score -= [0, 1, 8, 78, 100000][humanCount];
        }
      });
      return score;
    }

    function minimaxBoard(board, depth, maximizing, alpha = -Infinity, beta = Infinity) {
      const result = winnerOnLines(board, 4, lines);
      const options = validColumns(board).sort((a, b) => Math.abs(3 - a) - Math.abs(3 - b));
      if (depth === 0 || result || !options.length) return { score: evaluateBoard(board) };
      let best = { col: options[0], score: maximizing ? -Infinity : Infinity };
      for (const col of options) {
        const next = simulateDrop(board, col, maximizing ? "A" : "H");
        const score = minimaxBoard(next, depth - 1, !maximizing, alpha, beta).score;
        if (maximizing) {
          if (score > best.score) best = { col, score };
          alpha = Math.max(alpha, score);
        } else {
          if (score < best.score) best = { col, score };
          beta = Math.min(beta, score);
        }
        if (alpha >= beta) break;
      }
      return best;
    }

    function chooseMove(board) {
      const options = validColumns(board);
      if (currentDifficulty === "easy") return sample(options);
      for (const col of options) {
        if (winnerOnLines(simulateDrop(board, col, "A"), 4, lines) === "A") return col;
      }
      if (currentDifficulty === "medium" && maybe(0.35)) return sample(options);
      for (const col of options) {
        if (winnerOnLines(simulateDrop(board, col, "H"), 4, lines) === "H") return col;
      }
      if (currentDifficulty === "cyber") return minimaxBoard(board, 6, true).col ?? sample(options);
      const weights = [3, 4, 6, 8, 6, 4, 3];
      return options
        .map((col) => ({ col, score: weights[col] + Math.random() }))
        .sort((a, b) => b.score - a.score)[0].col;
    }

    return {
      id: "connect-four",
      title: "Четыре в ряд",
      short: "фишки в колонках",
      subtitle: "Соберите четыре фишки в линию раньше ИИ.",
      tag: "Линия",
      color: "#4d7c0f",
      create: () => ({ board: Array(rows * cols).fill(""), turn: "H", over: false, winner: "" }),
      status: (s) => s.message || (s.turn === "H" ? "Ваш ход: выберите колонку." : "Компьютер выбирает колонку."),
      score: (s) => [
        { side: "human", text: `Ваши фишки: ${s.board.filter((cell) => cell === "H").length}` },
        { side: "ai", text: `Фишки ИИ: ${s.board.filter((cell) => cell === "A").length}` },
      ],
      render: (s, container, done) => {
        const wrap = make("div", "connect-wrap");
        const controls = make("div", "column-row");
        for (let col = 0; col < cols; col += 1) {
          controls.append(
            button("column-button", "v", !isHumanTurn() || !validColumns(s.board).includes(col), () => {
              if (!isHumanTurn()) return;
              drop(s.board, col, "H");
              const result = winnerOnLines(s.board, 4, lines);
              if (result === "H") setWinner(s, "H", "Вы победили.");
              else if (result === "draw") setWinner(s, "draw", "Ничья.");
              else s.turn = "A";
              done();
            }),
          );
        }
        const board = make("div", "board disc-board");
        s.board.forEach((cell) => {
          board.append(make("div", `disc-cell ${cell === "H" ? "human" : cell === "A" ? "ai" : ""}`));
        });
        wrap.append(controls, board);
        container.append(wrap);
      },
      ai: (s) => {
        const move = chooseMove(s.board);
        if (move !== undefined) drop(s.board, move, "A");
        const result = winnerOnLines(s.board, 4, lines);
        if (result === "A") setWinner(s, "A", "ИИ победил.");
        else if (result === "draw") setWinner(s, "draw", "Ничья.");
        else s.turn = "H";
      },
    };
  }

  function gomokuGame() {
    const size = 5;
    const lines = linesFor(size, size);

    function evaluateMove(board, index, player) {
      const copy = board.slice();
      copy[index] = player;
      if (winnerOnLines(copy, 4, lines) === player) return 1000;
      const x = index % size;
      const y = Math.floor(index / size);
      const center = 2 - Math.abs(2 - x) + (2 - Math.abs(2 - y));
      let links = 0;
      lines.forEach((line) => {
        if (line.includes(index)) links += line.filter((cell) => copy[cell] === player).length;
      });
      return center * 4 + links;
    }

    function evaluatePosition(board) {
      const result = winnerOnLines(board, 4, lines);
      if (result === "A") return 100000;
      if (result === "H") return -100000;
      let score = 0;
      lines.forEach((line) => {
        for (let start = 0; start <= line.length - 4; start += 1) {
          const window = line.slice(start, start + 4).map((index) => board[index]);
          const aiCount = window.filter((cell) => cell === "A").length;
          const humanCount = window.filter((cell) => cell === "H").length;
          if (aiCount && !humanCount) score += [0, 2, 15, 160, 100000][aiCount];
          if (humanCount && !aiCount) score -= [0, 3, 22, 210, 100000][humanCount];
        }
      });
      return score;
    }

    function candidateMoves(board, limit) {
      return board
        .map((value, index) => (value ? null : { index, score: evaluateMove(board, index, "A") + evaluateMove(board, index, "H") * 0.85 }))
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((move) => move.index);
    }

    function minimaxGomoku(board, depth, maximizing, alpha = -Infinity, beta = Infinity) {
      const result = winnerOnLines(board, 4, lines);
      if (depth === 0 || result) return { score: evaluatePosition(board) };
      const candidates = candidateMoves(board, depth >= 3 ? 10 : 12);
      if (!candidates.length) return { score: evaluatePosition(board) };
      let best = { index: candidates[0], score: maximizing ? -Infinity : Infinity };
      for (const index of candidates) {
        board[index] = maximizing ? "A" : "H";
        const score = minimaxGomoku(board, depth - 1, !maximizing, alpha, beta).score;
        board[index] = "";
        if (maximizing) {
          if (score > best.score) best = { index, score };
          alpha = Math.max(alpha, score);
        } else {
          if (score < best.score) best = { index, score };
          beta = Math.min(beta, score);
        }
        if (alpha >= beta) break;
      }
      return best;
    }

    function choose(board) {
      const open = board.map((value, index) => (value ? -1 : index)).filter((index) => index >= 0);
      if (currentDifficulty === "easy") return sample(open);
      for (const index of open) if (evaluateMove(board, index, "A") >= 1000) return index;
      if (currentDifficulty === "medium" && maybe(0.35)) return sample(open);
      for (const index of open) if (evaluateMove(board, index, "H") >= 1000) return index;
      if (currentDifficulty === "cyber") return minimaxGomoku(board.slice(), 3, true).index ?? sample(open);
      return open
        .map((index) => ({
          index,
          score:
            evaluateMove(board, index, "A") +
            (currentDifficulty === "cyber" ? evaluateMove(board, index, "H") * 0.72 : 0) +
            Math.random(),
        }))
        .sort((a, b) => b.score - a.score)[0].index;
    }

    return {
      id: "gomoku",
      title: "Гомоку 4",
      short: "5 на 5",
      subtitle: "На маленьком поле нужно собрать четыре своих знака подряд.",
      tag: "Тактика",
      color: "#ca8a04",
      create: () => ({ board: Array(size * size).fill(""), turn: "H", over: false, winner: "" }),
      status: (s) => s.message || (s.turn === "H" ? "Ваш ход: поставьте бирюзовый знак." : "ИИ ищет линию."),
      score: (s) => [
        { side: "human", text: `Вы: ${s.board.filter((cell) => cell === "H").length}` },
        { side: "ai", text: `ИИ: ${s.board.filter((cell) => cell === "A").length}` },
      ],
      render: (s, container, done) => {
        const board = make("div", "board mark-grid");
        board.style.setProperty("--cols", String(size));
        board.style.setProperty("--board-size", "520px");
        s.board.forEach((cell, index) => {
          board.append(
            button(
              `cell mark-cell ${cell === "H" ? "human" : cell === "A" ? "ai" : ""}`,
              cell === "H" ? "X" : cell === "A" ? "O" : "",
              !isHumanTurn() || Boolean(cell),
              () => {
                if (!isHumanTurn() || s.board[index]) return;
                s.board[index] = "H";
                const result = winnerOnLines(s.board, 4, lines);
                if (result === "H") setWinner(s, "H", "Вы победили.");
                else if (result === "draw") setWinner(s, "draw", "Ничья.");
                else s.turn = "A";
                done();
              },
            ),
          );
        });
        container.append(board);
      },
      ai: (s) => {
        const index = choose(s.board);
        if (index !== undefined) s.board[index] = "A";
        const result = winnerOnLines(s.board, 4, lines);
        if (result === "A") setWinner(s, "A", "ИИ победил.");
        else if (result === "draw") setWinner(s, "draw", "Ничья.");
        else s.turn = "H";
      },
    };
  }

  function reversiGame() {
    const size = 6;
    const dirs = [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1],
    ];

    function at(x, y) {
      return y * size + x;
    }

    function flipsFor(board, index, player) {
      if (board[index]) return [];
      const x = index % size;
      const y = Math.floor(index / size);
      const other = player === "H" ? "A" : "H";
      const flips = [];
      dirs.forEach(([dx, dy]) => {
        const line = [];
        let nx = x + dx;
        let ny = y + dy;
        while (nx >= 0 && nx < size && ny >= 0 && ny < size && board[at(nx, ny)] === other) {
          line.push(at(nx, ny));
          nx += dx;
          ny += dy;
        }
        if (line.length && nx >= 0 && nx < size && ny >= 0 && ny < size && board[at(nx, ny)] === player) {
          flips.push(...line);
        }
      });
      return flips;
    }

    function moves(board, player) {
      return board
        .map((_, index) => ({ index, flips: flipsFor(board, index, player) }))
        .filter((move) => move.flips.length);
    }

    function apply(board, move, player) {
      board[move.index] = player;
      move.flips.forEach((index) => {
        board[index] = player;
      });
    }

    function passOrFinish(s, nextTurn) {
      const humanMoves = moves(s.board, "H");
      const aiMoves = moves(s.board, "A");
      if (!humanMoves.length && !aiMoves.length) {
        const h = s.board.filter((cell) => cell === "H").length;
        const a = s.board.filter((cell) => cell === "A").length;
        if (h > a) setWinner(s, "H", "Вы победили по фишкам.");
        else if (a > h) setWinner(s, "A", "ИИ победил по фишкам.");
        else setWinner(s, "draw", "Ничья.");
        return;
      }
      s.turn = nextTurn;
      if (s.turn === "H" && !humanMoves.length) s.turn = "A";
      if (s.turn === "A" && !aiMoves.length) s.turn = "H";
    }

    function evaluateBoard(board) {
      const corners = [0, size - 1, size * (size - 1), size * size - 1];
      const aiDiscs = board.filter((cell) => cell === "A").length;
      const humanDiscs = board.filter((cell) => cell === "H").length;
      const aiMoves = moves(board, "A").length;
      const humanMoves = moves(board, "H").length;
      let score = (aiDiscs - humanDiscs) * 2 + (aiMoves - humanMoves) * 7;
      corners.forEach((index) => {
        if (board[index] === "A") score += 35;
        if (board[index] === "H") score -= 35;
      });
      for (let i = 1; i < size - 1; i += 1) {
        [i, size * (size - 1) + i, i * size, i * size + size - 1].forEach((index) => {
          if (board[index] === "A") score += 3;
          if (board[index] === "H") score -= 3;
        });
      }
      return score;
    }

    function minimaxBoard(board, depth, player, alpha = -Infinity, beta = Infinity) {
      const options = moves(board, player);
      const other = player === "A" ? "H" : "A";
      if (depth === 0 || (!options.length && !moves(board, other).length)) return { score: evaluateBoard(board) };
      if (!options.length) return { score: minimaxBoard(board, depth - 1, other, alpha, beta).score };
      let best = { move: options[0], score: player === "A" ? -Infinity : Infinity };
      for (const move of options) {
        const next = board.slice();
        apply(next, move, player);
        const score = minimaxBoard(next, depth - 1, other, alpha, beta).score;
        if (player === "A") {
          if (score > best.score) best = { move, score };
          alpha = Math.max(alpha, score);
        } else {
          if (score < best.score) best = { move, score };
          beta = Math.min(beta, score);
        }
        if (alpha >= beta) break;
      }
      return best;
    }

    return {
      id: "reversi",
      title: "Реверси 6",
      short: "захват фишек",
      subtitle: "Ставьте фишку так, чтобы перевернуть ряд фишек соперника.",
      tag: "Захват",
      color: "#15803d",
      create: () => {
        const board = Array(size * size).fill("");
        board[at(2, 2)] = "A";
        board[at(3, 3)] = "A";
        board[at(2, 3)] = "H";
        board[at(3, 2)] = "H";
        return { board, turn: "H", over: false, winner: "" };
      },
      status: (s) => s.message || (s.turn === "H" ? "Ваш ход: доступны подсвеченные клетки." : "ИИ выбирает переворот."),
      score: (s) => [
        { side: "human", text: `Вы: ${s.board.filter((cell) => cell === "H").length}` },
        { side: "ai", text: `ИИ: ${s.board.filter((cell) => cell === "A").length}` },
      ],
      render: (s, container, done) => {
        const valid = new Map(moves(s.board, "H").map((move) => [move.index, move]));
        const board = make("div", "board reversi-board");
        s.board.forEach((cell, index) => {
          const node = button("cell reversi-cell", "", !isHumanTurn() || !valid.has(index), () => {
            if (!isHumanTurn() || !valid.has(index)) return;
            apply(s.board, valid.get(index), "H");
            passOrFinish(s, "A");
            done();
          });
          if (cell) node.append(make("span", `reversi-disc ${cell === "H" ? "human" : "ai"}`));
          else if (valid.has(index) && isHumanTurn()) node.append(make("span", "reversi-dot"));
          board.append(node);
        });
        container.append(board);
      },
      ai: (s) => {
        const options = moves(s.board, "A");
        if (!options.length) {
          passOrFinish(s, "H");
          return;
        }
        const corners = new Set([0, size - 1, size * (size - 1), size * size - 1]);
        let best = sample(options);
        if (currentDifficulty === "medium") {
          best = (maybe(0.25) ? shuffled(options) : options).sort((a, b) => b.flips.length - a.flips.length)[0];
        }
        if (levelAtLeast("hard")) {
          best = options
            .map((move) => ({
              move,
              score: move.flips.length + (corners.has(move.index) ? 10 : 0) + Math.random() / 10,
            }))
            .sort((a, b) => b.score - a.score)[0].move;
        }
        if (currentDifficulty === "cyber") {
          best = minimaxBoard(s.board.slice(), 4, "A").move ?? best;
        }
        apply(s.board, best, "A");
        passOrFinish(s, "H");
      },
    };
  }

  function nimGame() {
    return {
      id: "nim",
      title: "Ним",
      short: "21 палочка",
      subtitle: "Берите от одной до трёх палочек; последняя палочка выигрывает раунд.",
      tag: "Счёт",
      color: "#b45309",
      create: () => ({ total: 21, turn: "H", over: false, winner: "", last: "" }),
      status: (s) => s.message || (s.turn === "H" ? "Ваш ход: возьмите 1, 2 или 3 палочки." : "ИИ считает остаток."),
      score: (s) => [
        { side: "human", text: "Вы ходите первым" },
        { side: "ai", text: s.last || "ИИ ждёт" },
        { side: "", text: `Осталось: ${s.total}` },
      ],
      render: (s, container, done) => {
        const layout = make("div", "nim-layout");
        const sticks = make("div", "sticks");
        for (let i = 0; i < s.total; i += 1) sticks.append(make("span", "stick"));
        const controls = make("div", "take-row");
        [1, 2, 3].forEach((count) => {
          controls.append(
            button("take-button", `Взять ${count}`, !isHumanTurn() || count > s.total, () => {
              if (!isHumanTurn() || count > s.total) return;
              s.total -= count;
              s.last = `Вы взяли: ${count}`;
              if (s.total <= 0) setWinner(s, "H", "Вы забрали последнюю палочку и победили.");
              else s.turn = "A";
              done();
            }),
          );
        });
        layout.append(sticks, controls);
        container.append(layout);
      },
      ai: (s) => {
        const ideal = s.total % 4;
        const options = [1, 2, 3].filter((n) => n <= s.total);
        let take = sample(options);
        if ((currentDifficulty === "medium" && maybe(0.65)) || levelAtLeast("hard")) {
          take = Math.min(s.total, ideal === 0 ? sample(options) : ideal);
        }
        s.total -= take;
        s.last = `ИИ взял: ${take}`;
        if (s.total <= 0) setWinner(s, "A", "ИИ забрал последнюю палочку.");
        else s.turn = "H";
      },
    };
  }

  function dotsGame() {
    const size = 3;

    function createEdges() {
      return {
        h: Array.from({ length: size + 1 }, () => Array(size).fill("")),
        v: Array.from({ length: size }, () => Array(size + 1).fill("")),
        boxes: Array.from({ length: size }, () => Array(size).fill("")),
      };
    }

    function edgeList(s) {
      const edges = [];
      for (let r = 0; r <= size; r += 1) {
        for (let c = 0; c < size; c += 1) if (!s.h[r][c]) edges.push({ type: "h", r, c });
      }
      for (let r = 0; r < size; r += 1) {
        for (let c = 0; c <= size; c += 1) if (!s.v[r][c]) edges.push({ type: "v", r, c });
      }
      return edges;
    }

    function boxComplete(s, r, c) {
      return s.h[r][c] && s.h[r + 1][c] && s.v[r][c] && s.v[r][c + 1];
    }

    function claimBoxes(s, player) {
      let gained = 0;
      for (let r = 0; r < size; r += 1) {
        for (let c = 0; c < size; c += 1) {
          if (!s.boxes[r][c] && boxComplete(s, r, c)) {
            s.boxes[r][c] = player;
            gained += 1;
          }
        }
      }
      return gained;
    }

    function setEdge(s, edge, player) {
      s[edge.type][edge.r][edge.c] = player;
      return claimBoxes(s, player);
    }

    function cloneDots(s) {
      return {
        h: s.h.map((row) => row.slice()),
        v: s.v.map((row) => row.slice()),
        boxes: s.boxes.map((row) => row.slice()),
      };
    }

    function finishTurn(s, gained, player) {
      const remaining = edgeList(s).length;
      if (!remaining) {
        const human = s.boxes.flat().filter((box) => box === "H").length;
        const ai = s.boxes.flat().filter((box) => box === "A").length;
        if (human > ai) setWinner(s, "H", "Вы собрали больше квадратов.");
        else if (ai > human) setWinner(s, "A", "ИИ собрал больше квадратов.");
        else setWinner(s, "draw", "Ничья.");
        return;
      }
      if (!gained) s.turn = player === "H" ? "A" : "H";
    }

    function scoreState(s) {
      const human = s.boxes.flat().filter((box) => box === "H").length;
      const ai = s.boxes.flat().filter((box) => box === "A").length;
      return (ai - human) * 40;
    }

    function rankEdge(s, edge, player) {
      const after = cloneDots(s);
      const gained = setEdge(after, edge, player);
      let risk = 0;
      edgeList(after).forEach((next) => {
        const future = cloneDots(after);
        risk = Math.max(risk, setEdge(future, next, player === "A" ? "H" : "A"));
      });
      return gained * 30 - risk * 12 + Math.random() / 100;
    }

    function searchDots(s, depth, player, alpha = -Infinity, beta = Infinity) {
      const edges = edgeList(s);
      if (!edges.length || depth === 0) return { score: scoreState(s) };
      const ordered = edges
        .map((edge) => ({ edge, score: rankEdge(s, edge, player) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, edges.length > 12 ? 12 : edges.length)
        .map((item) => item.edge);
      let best = { edge: ordered[0], score: player === "A" ? -Infinity : Infinity };
      for (const edge of ordered) {
        const next = cloneDots(s);
        const gained = setEdge(next, edge, player);
        const nextPlayer = gained ? player : player === "A" ? "H" : "A";
        const score = searchDots(next, depth - 1, nextPlayer, alpha, beta).score;
        if (player === "A") {
          if (score > best.score) best = { edge, score };
          alpha = Math.max(alpha, score);
        } else {
          if (score < best.score) best = { edge, score };
          beta = Math.min(beta, score);
        }
        if (alpha >= beta) break;
      }
      return best;
    }

    function choose(s) {
      const edges = edgeList(s);
      if (currentDifficulty === "easy") return sample(edges);
      if (currentDifficulty === "cyber") return searchDots(s, 5, "A").edge ?? sample(edges);
      const scored = edges.map((edge) => {
        const after = cloneDots(s);
        const gained = setEdge(after, edge, "A");
        let risk = 0;
        edgeList(after).forEach((next) => {
          const future = cloneDots(after);
          risk = Math.max(risk, setEdge(future, next, "H"));
        });
        const riskWeight = currentDifficulty === "cyber" ? 13 : currentDifficulty === "hard" ? 8 : 3;
        const gainWeight = currentDifficulty === "medium" ? 18 : 20;
        return { edge, score: gained * gainWeight - risk * riskWeight + Math.random() };
      });
      return scored.sort((a, b) => b.score - a.score)[0].edge;
    }

    return {
      id: "dots",
      title: "Точки и квадраты",
      short: "3 на 3",
      subtitle: "Закрывайте стороны квадратов; закрытый квадрат остаётся вашим.",
      tag: "Контроль",
      color: "#be123c",
      create: () => ({ ...createEdges(), turn: "H", over: false, winner: "" }),
      status: (s) => s.message || (s.turn === "H" ? "Ваш ход: выберите свободную сторону." : "ИИ закрывает сторону."),
      score: (s) => [
        { side: "human", text: `Ваши квадраты: ${s.boxes.flat().filter((box) => box === "H").length}` },
        { side: "ai", text: `Квадраты ИИ: ${s.boxes.flat().filter((box) => box === "A").length}` },
      ],
      render: (s, container, done) => {
        const board = make("div", "dots-board");
        for (let r = 0; r < size * 2 + 1; r += 1) {
          for (let c = 0; c < size * 2 + 1; c += 1) {
            if (r % 2 === 0 && c % 2 === 0) {
              board.append(make("span", "point"));
            } else if (r % 2 === 0) {
              const er = r / 2;
              const ec = (c - 1) / 2;
              const owner = s.h[er][ec];
              board.append(
                button(`edge-button h-edge ${owner === "H" ? "human" : owner === "A" ? "ai" : ""}`, "", !isHumanTurn() || owner, () => {
                  if (!isHumanTurn() || s.h[er][ec]) return;
                  const gained = setEdge(s, { type: "h", r: er, c: ec }, "H");
                  finishTurn(s, gained, "H");
                  done();
                }),
              );
            } else if (c % 2 === 0) {
              const er = (r - 1) / 2;
              const ec = c / 2;
              const owner = s.v[er][ec];
              board.append(
                button(`edge-button v-edge ${owner === "H" ? "human" : owner === "A" ? "ai" : ""}`, "", !isHumanTurn() || owner, () => {
                  if (!isHumanTurn() || s.v[er][ec]) return;
                  const gained = setEdge(s, { type: "v", r: er, c: ec }, "H");
                  finishTurn(s, gained, "H");
                  done();
                }),
              );
            } else {
              const owner = s.boxes[(r - 1) / 2][(c - 1) / 2];
              board.append(make("span", `box-fill ${owner === "H" ? "human" : owner === "A" ? "ai" : ""}`));
            }
          }
        }
        container.append(board);
      },
      ai: (s) => {
        const edge = choose(s);
        const gained = setEdge(s, edge, "A");
        finishTurn(s, gained, "A");
      },
    };
  }

  function battleshipGame() {
    const size = 5;
    const shipLengths = [3, 2, 2];

    function index(x, y) {
      return y * size + x;
    }

    function placeShips() {
      const occupied = new Set();
      shipLengths.forEach((length) => {
        let placed = false;
        while (!placed) {
          const horizontal = Math.random() > 0.5;
          const maxX = horizontal ? size - length : size - 1;
          const maxY = horizontal ? size - 1 : size - length;
          const x = Math.floor(Math.random() * (maxX + 1));
          const y = Math.floor(Math.random() * (maxY + 1));
          const cells = Array.from({ length }, (_, step) => index(x + (horizontal ? step : 0), y + (horizontal ? 0 : step)));
          if (cells.every((cell) => !occupied.has(cell))) {
            cells.forEach((cell) => occupied.add(cell));
            placed = true;
          }
        }
      });
      return occupied;
    }

    function allHit(ships, shots) {
      return [...ships].every((cell) => shots.has(cell));
    }

    function aiShot(s) {
      const tried = s.aiShots;
      const untried = Array.from({ length: size * size }, (_, cell) => cell).filter((cell) => !tried.has(cell));
      if (currentDifficulty === "easy") return sample(untried);
      const hits = [...tried].filter((cell) => s.playerShips.has(cell));
      const candidates = [];
      hits.forEach((cell) => {
        const x = cell % size;
        const y = Math.floor(cell / size);
        [
          [x + 1, y],
          [x - 1, y],
          [x, y + 1],
          [x, y - 1],
        ].forEach(([nx, ny]) => {
          const next = index(nx, ny);
          if (nx >= 0 && nx < size && ny >= 0 && ny < size && !tried.has(next)) candidates.push(next);
        });
      });
      if (currentDifficulty === "medium") return sample(candidates.length && maybe(0.65) ? candidates : untried);
      if (currentDifficulty === "cyber") {
        const shipCandidates = candidates.filter((cell) => s.playerShips.has(cell));
        if (shipCandidates.length) return sample(shipCandidates);
        const hiddenShips = untried.filter((cell) => s.playerShips.has(cell));
        if (hiddenShips.length && maybe(0.72)) return sample(hiddenShips);
      }
      if (currentDifficulty === "cyber" && !candidates.length) {
        const parity = untried.filter((cell) => {
          const x = cell % size;
          const y = Math.floor(cell / size);
          return (x + y) % 2 === 0;
        });
        return sample(parity.length ? parity : untried);
      }
      return sample(candidates.length ? candidates : untried);
    }

    return {
      id: "battleship",
      title: "Морской бой 5",
      short: "мини-флот",
      subtitle: "Оба флота уже на поле; стреляйте по зоне компьютера.",
      tag: "Поиск",
      color: "#0369a1",
      create: () => ({
        playerShips: placeShips(),
        aiShips: placeShips(),
        humanShots: new Set(),
        aiShots: new Set(),
        turn: "H",
        over: false,
        winner: "",
        last: "Первый залп за вами.",
      }),
      status: (s) => s.message || (s.turn === "H" ? s.last : "ИИ выбирает клетку для залпа."),
      score: (s) => [
        { side: "human", text: `Попадания: ${[...s.humanShots].filter((cell) => s.aiShips.has(cell)).length}/7` },
        { side: "ai", text: `Попадания ИИ: ${[...s.aiShots].filter((cell) => s.playerShips.has(cell)).length}/7` },
      ],
      render: (s, container, done) => {
        const layout = make("div", "battle-layout");
        const playerPanel = make("section", "battle-panel");
        playerPanel.append(make("h3", "", "Ваш флот"));
        const playerBoard = make("div", "battle-board");
        for (let cell = 0; cell < size * size; cell += 1) {
          const shot = s.aiShots.has(cell);
          const ship = s.playerShips.has(cell);
          playerBoard.append(make("div", `cell battle-cell ${ship ? "ship" : ""} ${shot && ship ? "sunk-safe" : ""} ${shot && !ship ? "miss" : ""}`, shot ? (ship ? "X" : "-") : ""));
        }
        playerPanel.append(playerBoard);

        const aiPanel = make("section", "battle-panel");
        aiPanel.append(make("h3", "", "Зона ИИ"));
        const aiBoard = make("div", "battle-board");
        for (let cell = 0; cell < size * size; cell += 1) {
          const shot = s.humanShots.has(cell);
          const hit = shot && s.aiShips.has(cell);
          aiBoard.append(
            button(`cell battle-cell ${hit ? "hit" : ""} ${shot && !hit ? "miss" : ""}`, shot ? (hit ? "X" : "-") : "", !isHumanTurn() || shot, () => {
              if (!isHumanTurn() || s.humanShots.has(cell)) return;
              s.humanShots.add(cell);
              s.last = s.aiShips.has(cell) ? "Попадание. Ваш следующий залп." : "Мимо. Ход переходит ИИ.";
              if (allHit(s.aiShips, s.humanShots)) setWinner(s, "H", "Вы потопили флот ИИ.");
              else s.turn = s.aiShips.has(cell) ? "H" : "A";
              done();
            }),
          );
        }
        aiPanel.append(aiBoard);
        layout.append(playerPanel, aiPanel);
        container.append(layout);
      },
      ai: (s) => {
        const shot = aiShot(s);
        s.aiShots.add(shot);
        s.last = s.playerShips.has(shot) ? "ИИ попал и стреляет снова." : "ИИ промахнулся. Ваш ход.";
        if (allHit(s.playerShips, s.aiShots)) setWinner(s, "A", "ИИ потопил ваш флот.");
        else s.turn = s.playerShips.has(shot) ? "A" : "H";
      },
    };
  }

  function pawnDuelGame() {
    const size = 3;

    function idx(x, y) {
      return y * size + x;
    }

    function moves(board, player) {
      const dir = player === "H" ? -1 : 1;
      const result = [];
      board.forEach((piece, index) => {
        if (piece !== player) return;
        const x = index % size;
        const y = Math.floor(index / size);
        const forward = idx(x, y + dir);
        if (y + dir >= 0 && y + dir < size && !board[forward]) result.push({ from: index, to: forward });
        [x - 1, x + 1].forEach((nx) => {
          if (nx < 0 || nx >= size || y + dir < 0 || y + dir >= size) return;
          const target = idx(nx, y + dir);
          if (board[target] && board[target] !== player) result.push({ from: index, to: target });
        });
      });
      return result;
    }

    function apply(board, move) {
      const copy = board.slice();
      copy[move.to] = copy[move.from];
      copy[move.from] = "";
      return copy;
    }

    function winner(board, turn) {
      if (board.slice(0, 3).includes("H")) return "H";
      if (board.slice(6, 9).includes("A")) return "A";
      if (!board.includes("H")) return "A";
      if (!board.includes("A")) return "H";
      if (!moves(board, turn).length) return turn === "H" ? "A" : "H";
      return "";
    }

    function minimax(board, turn, depth) {
      const won = winner(board, turn);
      if (won) return { score: won === "A" ? 10 + depth : -10 - depth };
      if (depth <= 0) return { score: board.filter((p) => p === "A").length - board.filter((p) => p === "H").length };
      const options = moves(board, turn).map((move) => {
        const nextTurn = turn === "A" ? "H" : "A";
        return { move, score: minimax(apply(board, move), nextTurn, depth - 1).score };
      });
      return turn === "A"
        ? options.reduce((best, option) => (option.score > best.score ? option : best))
        : options.reduce((best, option) => (option.score < best.score ? option : best));
    }

    return {
      id: "pawns",
      title: "Пешечная дуэль",
      short: "мини-шахматы",
      subtitle: "Пешка выигрывает, если дошла до противоположного края.",
      tag: "Шахматы",
      color: "#7c3aed",
      create: () => ({ board: ["A", "A", "A", "", "", "", "H", "H", "H"], turn: "H", over: false, selected: -1, winner: "" }),
      status: (s) => s.message || (s.turn === "H" ? "Ваш ход: выберите пешку и клетку." : "ИИ двигает пешку."),
      score: (s) => [
        { side: "human", text: `Ваши пешки: ${s.board.filter((p) => p === "H").length}` },
        { side: "ai", text: `Пешки ИИ: ${s.board.filter((p) => p === "A").length}` },
      ],
      render: (s, container, done) => {
        const legal = moves(s.board, "H");
        const targets = new Map(legal.filter((move) => move.from === s.selected).map((move) => [move.to, move]));
        const board = make("div", "board pawn-board");
        s.board.forEach((piece, index) => {
          const canSelect = isHumanTurn() && piece === "H" && legal.some((move) => move.from === index);
          const canMove = isHumanTurn() && targets.has(index);
          const selected = s.selected === index;
          const node = button(
            `cell pawn-cell ${(index + Math.floor(index / size)) % 2 ? "dark" : "light"} ${piece === "H" ? "human" : piece === "A" ? "ai" : ""} ${canMove ? "valid" : ""}`,
            piece === "H" ? "▲" : piece === "A" ? "▼" : "",
            !canSelect && !canMove,
            () => {
              if (!isHumanTurn()) return;
              if (canSelect) {
                s.selected = selected ? -1 : index;
                done();
                return;
              }
              if (canMove) {
                s.board = apply(s.board, targets.get(index));
                s.selected = -1;
                const won = winner(s.board, "A");
                if (won === "H") setWinner(s, "H", "Ваша пешка прорвалась.");
                else if (won === "A") setWinner(s, "A", "ИИ победил.");
                else s.turn = "A";
                done();
              }
            },
          );
          if (selected) node.style.outline = "3px solid rgba(15, 118, 110, 0.75)";
          board.append(node);
        });
        container.append(board);
      },
      ai: (s) => {
        const options = moves(s.board, "A");
        let best = sample(options);
        if (currentDifficulty === "medium") best = minimax(s.board, "A", 3).move;
        if (currentDifficulty === "hard") best = minimax(s.board, "A", 7).move;
        if (currentDifficulty === "cyber") best = minimax(s.board, "A", 9).move;
        if (best) s.board = apply(s.board, best);
        const won = winner(s.board, "H");
        if (won === "A") setWinner(s, "A", "Пешка ИИ дошла до края.");
        else if (won === "H") setWinner(s, "H", "Вы победили.");
        else s.turn = "H";
      },
    };
  }

  function memoryGame() {
    const values = ["1", "2", "3", "4", "5", "6", "7", "8"];

    function remember(s, index) {
      const value = s.cards[index].value;
      if (!s.seen[value]) s.seen[value] = new Set();
      s.seen[value].add(index);
    }

    function unmatched(s) {
      return s.cards.map((card, index) => (card.owner ? -1 : index)).filter((index) => index >= 0);
    }

    function finishPair(s, player) {
      const [a, b] = s.selected;
      if (s.cards[a].value === s.cards[b].value) {
        s.cards[a].owner = player;
        s.cards[b].owner = player;
        if (player === "H") s.human += 1;
        else s.ai += 1;
        s.selected = [];
        if (!unmatched(s).length) {
          if (s.human > s.ai) setWinner(s, "H", "Вы нашли больше пар.");
          else if (s.ai > s.human) setWinner(s, "A", "ИИ нашёл больше пар.");
          else setWinner(s, "draw", "Ничья.");
        }
        return true;
      }
      s.selected = [];
      s.turn = player === "H" ? "A" : "H";
      return false;
    }

    function aiPair(s) {
      const randomPair = () => shuffled(unmatched(s)).slice(0, 2);
      if (currentDifficulty === "easy") return randomPair();
      if (currentDifficulty === "cyber") {
        const groups = {};
        unmatched(s).forEach((index) => {
          const value = s.cards[index].value;
          if (!groups[value]) groups[value] = [];
          groups[value].push(index);
        });
        const pair = Object.values(groups).find((indexes) => indexes.length >= 2);
        if (pair) return pair.slice(0, 2);
      }
      for (const indexes of Object.values(s.seen)) {
        const known = [...indexes].filter((index) => !s.cards[index].owner);
        if (known.length >= 2 && (levelAtLeast("hard") || maybe(0.55))) return known.slice(0, 2);
      }
      return randomPair();
    }

    return {
      id: "memory",
      title: "Память",
      short: "найди пару",
      subtitle: "Открывайте пары карточек; ИИ запоминает увиденные значения.",
      tag: "Память",
      color: "#0e7490",
      aiDelay: 420,
      create: () => ({
        cards: shuffled(values.concat(values)).map((value) => ({ value, owner: "" })),
        selected: [],
        seen: {},
        human: 0,
        ai: 0,
        turn: "H",
        over: false,
        winner: "",
      }),
      status: (s) => s.message || (s.turn === "H" ? "Ваш ход: откройте две карточки." : "ИИ вспоминает пары."),
      score: (s) => [
        { side: "human", text: `Ваши пары: ${s.human}` },
        { side: "ai", text: `Пары ИИ: ${s.ai}` },
        { side: "", text: `Осталось: ${unmatched(s).length}` },
      ],
      render: (s, container, done) => {
        const board = make("div", "board memory-board");
        s.cards.forEach((card, index) => {
          const open = s.selected.includes(index) || card.owner;
          const ownerClass = card.owner === "H" ? "matched-human" : card.owner === "A" ? "matched-ai" : open ? "open" : "";
          board.append(
            button(`card-button ${ownerClass}`, open ? card.value : "", !isHumanTurn() || open || s.selected.length >= 2, () => {
              if (!isHumanTurn() || open || s.selected.length >= 2) return;
              s.selected.push(index);
              remember(s, index);
              if (s.selected.length < 2) {
                done();
                return;
              }
              const matched = s.cards[s.selected[0]].value === s.cards[s.selected[1]].value;
              if (matched) {
                finishPair(s, "H");
                done();
              } else {
                s.locked = true;
                render();
                window.setTimeout(() => {
                  finishPair(s, "H");
                  s.locked = false;
                  done();
                }, 620);
              }
            }),
          );
        });
        container.append(board);
      },
      ai: (s) => {
        const pair = aiPair(s);
        pair.forEach((index) => {
          s.selected.push(index);
          remember(s, index);
        });
        finishPair(s, "A");
      },
    };
  }

  function sum15Game() {
    const triples = [
      [1, 5, 9],
      [1, 6, 8],
      [2, 4, 9],
      [2, 5, 8],
      [2, 6, 7],
      [3, 4, 8],
      [3, 5, 7],
      [4, 5, 6],
    ];

    function wins(picked) {
      return triples.some((triple) => triple.every((slot) => picked.includes(slot)));
    }

    function minimax(human, ai, available, turn) {
      if (wins(ai)) return { score: 10 };
      if (wins(human)) return { score: -10 };
      if (!available.length) return { score: 0 };
      const moves = available.map((slot) => {
        const nextAvailable = available.filter((item) => item !== slot);
        const next =
          turn === "A"
            ? minimax(human, ai.concat(slot), nextAvailable, "H")
            : minimax(human.concat(slot), ai, nextAvailable, "A");
        return { slot, score: next.score };
      });
      return turn === "A"
        ? moves.reduce((best, move) => (move.score > best.score ? move : best))
        : moves.reduce((best, move) => (move.score < best.score ? move : best));
    }

    function chooseHeuristic(human, ai, available) {
      for (const slot of available) if (wins(ai.concat(slot))) return slot;
      for (const slot of available) if (wins(human.concat(slot))) return slot;
      if (available.includes(5)) return 5;
      return sample(available);
    }

    return {
      id: "sum15",
      title: "Сумма 15",
      short: "магический ряд",
      subtitle: "Выбирайте числа 1-9; три ваших числа с суммой 15 дают победу.",
      tag: "Числа",
      color: "#9333ea",
      create: () => ({ human: [], ai: [], turn: "H", over: false, winner: "" }),
      status: (s) => s.message || (s.turn === "H" ? "Ваш ход: выберите свободное число." : "ИИ выбирает число."),
      score: (s) => [
        { side: "human", text: `Ваши числа: ${s.human.length ? s.human.join(", ") : "-"}` },
        { side: "ai", text: `Числа ИИ: ${s.ai.length ? s.ai.join(", ") : "-"}` },
      ],
      render: (s, container, done) => {
        const layout = make("div", "number-layout");
        const row = make("div", "number-row");
        for (let n = 1; n <= 9; n += 1) {
          const owner = s.human.includes(n) ? "human" : s.ai.includes(n) ? "ai" : "";
          row.append(
            button(`number-button ${owner}`, String(n), !isHumanTurn() || Boolean(owner), () => {
              if (!isHumanTurn() || s.human.includes(n) || s.ai.includes(n)) return;
              s.human.push(n);
              if (wins(s.human)) setWinner(s, "H", "Вы собрали выигрышный ряд.");
              else if (s.human.length + s.ai.length === 9) setWinner(s, "draw", "Ничья.");
              else s.turn = "A";
              done();
            }),
          );
        }
        const picked = make("div", "picked-list");
        picked.append(make("div", "", `Вы: ${s.human.length ? s.human.join(" + ") : "-"}`));
        picked.append(make("div", "", `ИИ: ${s.ai.length ? s.ai.join(" + ") : "-"}`));
        layout.append(row, picked);
        container.append(layout);
      },
      ai: (s) => {
        const available = Array.from({ length: 9 }, (_, i) => i + 1).filter((n) => !s.human.includes(n) && !s.ai.includes(n));
        let move = sample(available);
        if (currentDifficulty === "medium") move = chooseHeuristic(s.human, s.ai, available);
        if (levelAtLeast("hard")) move = minimax(s.human, s.ai, available, "A").slot || sample(available);
        s.ai.push(move);
        if (wins(s.ai)) setWinner(s, "A", "ИИ собрал выигрышный ряд.");
        else if (s.human.length + s.ai.length === 9) setWinner(s, "draw", "Ничья.");
        else s.turn = "H";
      },
    };
  }

  function rockPaperScissorsGame() {
    const choices = [
      { id: "rock", label: "Камень", beats: "scissors" },
      { id: "paper", label: "Бумага", beats: "rock" },
      { id: "scissors", label: "Ножницы", beats: "paper" },
    ];
    const counter = { rock: "paper", paper: "scissors", scissors: "rock" };

    function aiChoice(s) {
      if (currentDifficulty === "easy" || !s.history.length) return sample(choices).id;
      const last = s.history[s.history.length - 1];
      if (currentDifficulty === "medium") return maybe(0.62) ? counter[last] : sample(choices).id;
      const counts = choices.map((choice) => ({
        id: choice.id,
        count: s.history.filter((item) => item === choice.id).length,
      }));
      const predicted = counts.sort((a, b) => b.count - a.count)[0].id;
      if (currentDifficulty === "cyber") return counter[predicted];
      return maybe(0.82) ? counter[predicted] : sample(choices).id;
    }

    return {
      id: "rps",
      title: "Камень-ножницы-бумага",
      short: "до 3 побед",
      subtitle: "Выберите жест. ИИ пытается предугадать ваш следующий ход.",
      tag: "Реакция",
      color: "#dc2626",
      create: () => ({ turn: "H", over: false, winner: "", human: 0, ai: 0, rounds: 0, history: [], last: "Первый раунд за вами." }),
      status: (s) => s.message || s.last,
      score: (s) => [
        { side: "human", text: `Вы: ${s.human}` },
        { side: "ai", text: `ИИ: ${s.ai}` },
        { side: "", text: `Раунд: ${s.rounds + 1}` },
      ],
      render: (s, container, done) => {
        const layout = make("div", "choice-layout");
        choices.forEach((choice) => {
          layout.append(
            button("choice-button", choice.label, s.over, () => {
              if (s.over) return;
              const ai = aiChoice(s);
              s.history.push(choice.id);
              s.rounds += 1;
              if (ai === choice.id) s.last = `Ничья: ${choice.label} против ${choices.find((item) => item.id === ai).label}.`;
              else if (choice.beats === ai) {
                s.human += 1;
                s.last = `Ваш раунд: ${choice.label} побеждает ${choices.find((item) => item.id === ai).label}.`;
              } else {
                s.ai += 1;
                s.last = `Раунд ИИ: ${choices.find((item) => item.id === ai).label} бьёт ${choice.label}.`;
              }
              if (s.human >= 3) setWinner(s, "H", "Вы выиграли матч до трёх побед.");
              if (s.ai >= 3) setWinner(s, "A", "ИИ выиграл матч до трёх побед.");
              done();
            }),
          );
        });
        container.append(layout);
      },
    };
  }

  function hangmanGame() {
    const alphabet = "АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ".split("");
    const wordSets = {
      easy: ["КОТ", "ДОМ", "ЛЕС", "МЯЧ", "СОН"],
      medium: ["МОСТ", "ИГРА", "КЛЮЧ", "ШКОЛА", "ПОЕЗД"],
      hard: ["ПИРАТ", "КОСМОС", "ПАЗЛЫ", "РОБОТ", "ШАХТА"],
      cyber: ["АЛГОРИТМ", "СТРАТЕГИЯ", "КОМПЬЮТЕР", "ЛАБИРИНТ", "ГОЛОВОЛОМКА"],
    };
    const misses = { easy: 8, medium: 7, hard: 6, cyber: 5 };

    return {
      id: "hangman",
      title: "Виселица",
      short: "угадай слово",
      subtitle: "ИИ загадал слово. Открывайте буквы до того, как закончатся ошибки.",
      tag: "Слова",
      color: "#475569",
      create: () => {
        const word = sample(wordSets[currentDifficulty] || wordSets.medium);
        return { word, guessed: new Set(), wrong: 0, turn: "H", over: false, winner: "", last: "Выберите букву." };
      },
      status: (s) => s.message || s.last,
      score: (s) => [
        { side: "human", text: `Ошибки: ${s.wrong}/${misses[currentDifficulty]}` },
        { side: "ai", text: `Букв: ${s.word.length}` },
      ],
      render: (s, container, done) => {
        const layout = make("div", "word-layout");
        const word = make("div", "word-row");
        [...s.word].forEach((letter) => word.append(make("span", "word-letter", s.guessed.has(letter) || s.over ? letter : "")));
        const keys = make("div", "alphabet-grid");
        alphabet.forEach((letter) => {
          keys.append(
            button("letter-button", letter, s.over || s.guessed.has(letter), () => {
              s.guessed.add(letter);
              if (s.word.includes(letter)) s.last = `Есть буква ${letter}.`;
              else {
                s.wrong += 1;
                s.last = `Буквы ${letter} нет.`;
              }
              if ([...s.word].every((item) => s.guessed.has(item))) setWinner(s, "H", "Вы угадали слово.");
              else if (s.wrong >= misses[currentDifficulty]) setWinner(s, "A", `ИИ выиграл. Слово: ${s.word}.`);
              done();
            }),
          );
        });
        layout.append(word, keys);
        container.append(layout);
      },
    };
  }

  function minesweeperGame() {
    const size = 5;
    const mineCounts = { easy: 3, medium: 5, hard: 7, cyber: 9 };
    const total = size * size;

    function neighbors(index) {
      const x = index % size;
      const y = Math.floor(index / size);
      const result = [];
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (!dx && !dy) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < size && ny >= 0 && ny < size) result.push(ny * size + nx);
        }
      }
      return result;
    }

    function buildMines(exclude) {
      const count = mineCounts[currentDifficulty] || mineCounts.medium;
      return new Set(shuffled(Array.from({ length: total }, (_, index) => index).filter((index) => index !== exclude)).slice(0, count));
    }

    function countNear(mines, index) {
      return neighbors(index).filter((cell) => mines.has(cell)).length;
    }

    function reveal(s, index) {
      if (!s.mines) s.mines = buildMines(index);
      if (s.revealed.has(index)) return;
      s.revealed.add(index);
      if (s.mines.has(index)) {
        setWinner(s, "A", "Бум. Вы открыли мину.");
        return;
      }
      if (countNear(s.mines, index) === 0) neighbors(index).forEach((cell) => reveal(s, cell));
      if (s.revealed.size >= total - s.mines.size) setWinner(s, "H", "Поле очищено без взрыва.");
    }

    return {
      id: "minesweeper",
      title: "Сапёр",
      short: "мини-поле",
      subtitle: "Открывайте клетки и обходите мины. Первый клик всегда безопасный.",
      tag: "Риск",
      color: "#64748b",
      create: () => ({ mines: null, revealed: new Set(), turn: "H", over: false, winner: "" }),
      status: (s) => s.message || "Ваш ход: откройте клетку.",
      score: (s) => [
        { side: "human", text: `Открыто: ${s.revealed.size}` },
        { side: "ai", text: `Мин: ${mineCounts[currentDifficulty]}` },
      ],
      render: (s, container, done) => {
        const board = make("div", "board mine-board");
        for (let index = 0; index < total; index += 1) {
          const open = s.revealed.has(index) || s.over;
          const isMine = s.mines?.has(index);
          const near = s.mines ? countNear(s.mines, index) : 0;
          board.append(
            button(`cell mine-cell ${open ? "open" : ""} ${isMine && open ? "mine" : ""}`, open ? (isMine ? "*" : near || "") : "", s.over || s.revealed.has(index), () => {
              reveal(s, index);
              done();
            }),
          );
        }
        container.append(board);
      },
    };
  }

  function game2048() {
    const target = { easy: 128, medium: 256, hard: 512, cyber: 1024 };

    function addTile(board) {
      const open = board.map((value, index) => (value ? -1 : index)).filter((index) => index >= 0);
      if (!open.length) return;
      board[sample(open)] = maybe(currentDifficulty === "cyber" ? 0.28 : 0.12) ? 4 : 2;
    }

    function mergeLine(line) {
      const compact = line.filter(Boolean);
      const merged = [];
      let gained = 0;
      for (let i = 0; i < compact.length; i += 1) {
        if (compact[i] === compact[i + 1]) {
          merged.push(compact[i] * 2);
          gained += compact[i] * 2;
          i += 1;
        } else {
          merged.push(compact[i]);
        }
      }
      while (merged.length < 4) merged.push(0);
      return { line: merged, gained };
    }

    function moveBoard(board, dir) {
      const next = Array(16).fill(0);
      let gained = 0;
      for (let i = 0; i < 4; i += 1) {
        const line = [];
        for (let j = 0; j < 4; j += 1) {
          const x = dir === "left" || dir === "right" ? j : i;
          const y = dir === "left" || dir === "right" ? i : j;
          line.push(board[y * 4 + x]);
        }
        if (dir === "right" || dir === "down") line.reverse();
        const merged = mergeLine(line);
        gained += merged.gained;
        if (dir === "right" || dir === "down") merged.line.reverse();
        for (let j = 0; j < 4; j += 1) {
          const x = dir === "left" || dir === "right" ? j : i;
          const y = dir === "left" || dir === "right" ? i : j;
          next[y * 4 + x] = merged.line[j];
        }
      }
      return { board: next, gained, changed: next.some((value, index) => value !== board[index]) };
    }

    function hasMove(board) {
      return ["left", "right", "up", "down"].some((dir) => moveBoard(board, dir).changed);
    }

    return {
      id: "2048",
      title: "2048",
      short: "сливай плитки",
      subtitle: "Сдвигайте плитки и доберитесь до целевого числа.",
      tag: "Пазл",
      color: "#d97706",
      create: () => {
        const board = Array(16).fill(0);
        addTile(board);
        addTile(board);
        return { board, points: 0, turn: "H", over: false, winner: "" };
      },
      status: (s) => s.message || `Цель уровня: ${target[currentDifficulty]}.`,
      score: (s) => [
        { side: "human", text: `Очки: ${s.points}` },
        { side: "ai", text: `Максимум: ${Math.max(...s.board)}` },
      ],
      render: (s, container, done) => {
        const layout = make("div", "number-layout");
        const board = make("div", "board tile-board");
        s.board.forEach((value) => board.append(make("div", `tile-cell v${value}`, value || "")));
        const controls = make("div", "direction-pad");
        [
          ["up", "Вверх"],
          ["left", "Влево"],
          ["right", "Вправо"],
          ["down", "Вниз"],
        ].forEach(([dir, label]) => {
          controls.append(
            button("take-button", label, s.over, () => {
              const moved = moveBoard(s.board, dir);
              if (!moved.changed) return;
              s.board = moved.board;
              s.points += moved.gained;
              addTile(s.board);
              if (Math.max(...s.board) >= target[currentDifficulty]) setWinner(s, "H", "Целевая плитка собрана.");
              else if (!hasMove(s.board)) setWinner(s, "A", "Ходов больше нет.");
              done();
            }),
          );
        });
        layout.append(board, controls);
        container.append(layout);
      },
    };
  }

  function snakeGame() {
    const size = 8;
    const targets = { easy: 5, medium: 7, hard: 9, cyber: 11 };
    const obstacleCounts = { easy: 0, medium: 2, hard: 5, cyber: 8 };
    const dirs = { up: -size, down: size, left: -1, right: 1 };

    function edgeWraps(head, next, dir) {
      if (dir === "left") return head % size === 0;
      if (dir === "right") return head % size === size - 1;
      return next < 0 || next >= size * size;
    }

    function placeFree(s) {
      const blocked = new Set([...s.snake, ...s.obstacles]);
      return sample(Array.from({ length: size * size }, (_, index) => index).filter((index) => !blocked.has(index)));
    }

    return {
      id: "snake",
      title: "Змейка",
      short: "пошаговая",
      subtitle: "Двигайте змейку к еде. На сложных уровнях появляются стены.",
      tag: "Аркада",
      color: "#16a34a",
      create: () => {
        const obstacles = new Set(shuffled(Array.from({ length: size * size }, (_, index) => index).filter((index) => ![27, 28, 35].includes(index))).slice(0, obstacleCounts[currentDifficulty]));
        const s = { snake: [27, 28], food: -1, obstacles, turn: "H", over: false, winner: "" };
        s.food = placeFree(s);
        return s;
      },
      status: (s) => s.message || `Съешьте ${targets[currentDifficulty]} еды.`,
      score: (s) => [
        { side: "human", text: `Длина: ${s.snake.length}` },
        { side: "ai", text: `Цель: ${targets[currentDifficulty]}` },
      ],
      render: (s, container, done) => {
        const layout = make("div", "number-layout");
        const board = make("div", "board snake-board");
        for (let index = 0; index < size * size; index += 1) {
          const cls = s.snake[0] === index ? "head" : s.snake.includes(index) ? "body" : s.food === index ? "food" : s.obstacles.has(index) ? "wall" : "";
          board.append(make("div", `snake-cell ${cls}`));
        }
        const controls = make("div", "direction-pad");
        [
          ["up", "Вверх"],
          ["left", "Влево"],
          ["right", "Вправо"],
          ["down", "Вниз"],
        ].forEach(([dir, label]) => {
          controls.append(
            button("take-button", label, s.over, () => {
              const head = s.snake[0];
              const next = head + dirs[dir];
              if (edgeWraps(head, next, dir) || s.obstacles.has(next) || s.snake.includes(next)) {
                setWinner(s, "A", "Змейка врезалась.");
                done();
                return;
              }
              s.snake.unshift(next);
              if (next === s.food) {
                if (s.snake.length >= targets[currentDifficulty]) setWinner(s, "H", "Змейка выросла до цели.");
                else s.food = placeFree(s);
              } else {
                s.snake.pop();
              }
              done();
            }),
          );
        });
        layout.append(board, controls);
        container.append(layout);
      },
    };
  }

  function sudokuGame() {
    const solution = [1, 2, 3, 4, 3, 4, 1, 2, 2, 1, 4, 3, 4, 3, 2, 1];
    const givenCounts = { easy: 10, medium: 8, hard: 6, cyber: 4 };
    const mistakeLimit = { easy: 5, medium: 4, hard: 3, cyber: 2 };

    return {
      id: "sudoku",
      title: "Судоку 4x4",
      short: "быстрый судоку",
      subtitle: "Заполните поле числами 1-4 без ошибок.",
      tag: "Логика",
      color: "#2563eb",
      create: () => {
        const givens = new Set(shuffled(Array.from({ length: 16 }, (_, index) => index)).slice(0, givenCounts[currentDifficulty]));
        return { cells: solution.map((value, index) => (givens.has(index) ? value : 0)), givens, selected: -1, mistakes: 0, turn: "H", over: false, winner: "" };
      },
      status: (s) => s.message || "Выберите пустую клетку и поставьте число.",
      score: (s) => [
        { side: "human", text: `Ошибки: ${s.mistakes}/${mistakeLimit[currentDifficulty]}` },
        { side: "ai", text: `Пусто: ${s.cells.filter((value) => !value).length}` },
      ],
      render: (s, container, done) => {
        const layout = make("div", "number-layout");
        const board = make("div", "board sudoku-board");
        s.cells.forEach((value, index) => {
          const given = s.givens.has(index);
          const node = button(`cell sudoku-cell ${given ? "given" : ""} ${s.selected === index ? "selected" : ""}`, value || "", s.over || given, () => {
            s.selected = index;
            done();
          });
          board.append(node);
        });
        const nums = make("div", "take-row");
        [1, 2, 3, 4].forEach((value) => {
          nums.append(
            button("number-button", String(value), s.over || s.selected < 0, () => {
              if (solution[s.selected] === value) {
                s.cells[s.selected] = value;
                s.selected = -1;
                if (s.cells.every(Boolean)) setWinner(s, "H", "Судоку решён.");
              } else {
                s.mistakes += 1;
                if (s.mistakes >= mistakeLimit[currentDifficulty]) setWinner(s, "A", "Слишком много ошибок.");
              }
              done();
            }),
          );
        });
        layout.append(board, nums);
        container.append(layout);
      },
    };
  }

  function blackjackGame() {
    const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

    function deck() {
      return shuffled(ranks.concat(ranks, ranks, ranks));
    }

    function value(hand) {
      let total = 0;
      let aces = 0;
      hand.forEach((card) => {
        if (card === "A") {
          total += 11;
          aces += 1;
        } else total += Number(card) || 10;
      });
      while (total > 21 && aces) {
        total -= 10;
        aces -= 1;
      }
      return total;
    }

    function draw(s, hand) {
      hand.push(s.deck.pop());
    }

    function dealerTurn(s) {
      const standAt = { easy: 15, medium: 17, hard: 18, cyber: 21 }[currentDifficulty];
      while (value(s.dealer) < standAt && value(s.dealer) <= 21) {
        if (currentDifficulty === "cyber" && value(s.dealer) >= value(s.player)) break;
        draw(s, s.dealer);
      }
      const player = value(s.player);
      const dealer = value(s.dealer);
      if (dealer > 21 || player > dealer) setWinner(s, "H", "Вы выиграли раздачу.");
      else if (dealer > player) setWinner(s, "A", "Дилер ИИ выиграл раздачу.");
      else setWinner(s, "draw", "Ничья.");
    }

    return {
      id: "blackjack",
      title: "Блэкджек",
      short: "21 очко",
      subtitle: "Берите карты или остановитесь. Дилер играет по сложности.",
      tag: "Карты",
      color: "#111827",
      create: () => {
        const s = { deck: deck(), player: [], dealer: [], turn: "H", over: false, winner: "" };
        draw(s, s.player);
        draw(s, s.dealer);
        draw(s, s.player);
        draw(s, s.dealer);
        return s;
      },
      status: (s) => s.message || "Ваш ход: взять карту или остановиться.",
      score: (s) => [
        { side: "human", text: `Вы: ${value(s.player)}` },
        { side: "ai", text: `Дилер: ${s.over ? value(s.dealer) : "?"}` },
      ],
      render: (s, container, done) => {
        const layout = make("div", "cards-layout");
        const player = make("div", "card-hand");
        s.player.forEach((card) => player.append(make("span", "playing-card", card)));
        const dealer = make("div", "card-hand");
        s.dealer.forEach((card, index) => dealer.append(make("span", "playing-card", s.over || index === 0 ? card : "?")));
        const controls = make("div", "take-row");
        controls.append(
          button("take-button", "Взять", s.over, () => {
            draw(s, s.player);
            if (value(s.player) > 21) setWinner(s, "A", "Перебор. Дилер выиграл.");
            done();
          }),
          button("take-button", "Стоп", s.over, () => {
            dealerTurn(s);
            done();
          }),
        );
        layout.append(make("h3", "", "Дилер"), dealer, make("h3", "", "Вы"), player, controls);
        container.append(layout);
      },
    };
  }

  function guessNumberGame() {
    const maxes = { easy: 12, medium: 20, hard: 30, cyber: 40 };
    const tries = { easy: 6, medium: 6, hard: 5, cyber: 4 };

    return {
      id: "guess-number",
      title: "Угадай число",
      short: "секрет ИИ",
      subtitle: "ИИ загадал число. После каждого ответа он говорит: выше или ниже.",
      tag: "Угадай",
      color: "#0891b2",
      create: () => ({ secret: Math.floor(Math.random() * maxes[currentDifficulty]) + 1, used: new Set(), tries: tries[currentDifficulty], turn: "H", over: false, winner: "", last: "Выберите число." }),
      status: (s) => s.message || s.last,
      score: (s) => [
        { side: "human", text: `Попытки: ${s.tries}` },
        { side: "ai", text: `Диапазон: 1-${maxes[currentDifficulty]}` },
      ],
      render: (s, container, done) => {
        const grid = make("div", "guess-grid");
        for (let n = 1; n <= maxes[currentDifficulty]; n += 1) {
          grid.append(
            button("number-button", String(n), s.over || s.used.has(n), () => {
              s.used.add(n);
              s.tries -= 1;
              if (n === s.secret) setWinner(s, "H", "Вы угадали секретное число.");
              else if (s.tries <= 0) setWinner(s, "A", `Попытки закончились. Число: ${s.secret}.`);
              else s.last = n < s.secret ? "Нужно выше." : "Нужно ниже.";
              done();
            }),
          );
        }
        container.append(grid);
      },
    };
  }

  function simonGame() {
    const colors = [
      { id: "red", label: "Красный" },
      { id: "blue", label: "Синий" },
      { id: "green", label: "Зелёный" },
      { id: "yellow", label: "Жёлтый" },
    ];
    const targets = { easy: 4, medium: 5, hard: 6, cyber: 8 };

    function addStep(s) {
      s.sequence.push(sample(colors).id);
      s.input = [];
      s.showing = true;
    }

    return {
      id: "simon",
      title: "Simon",
      short: "повтори ряд",
      subtitle: "Запомните цветовую последовательность и повторите её.",
      tag: "Память",
      color: "#7c3aed",
      create: () => {
        const s = { sequence: [], input: [], showing: true, turn: "H", over: false, winner: "" };
        addStep(s);
        return s;
      },
      status: (s) => s.message || (s.showing ? "Запомните последовательность." : "Повторите цвета по порядку."),
      score: (s) => [
        { side: "human", text: `Раунд: ${s.sequence.length}` },
        { side: "ai", text: `Цель: ${targets[currentDifficulty]}` },
      ],
      render: (s, container, done) => {
        const layout = make("div", "simon-layout");
        const display = make("div", "simon-sequence");
        s.sequence.forEach((id) => display.append(make("span", `simon-chip ${id}`, s.showing ? colors.find((item) => item.id === id).label : "?")));
        const controls = make("div", "simon-grid");
        colors.forEach((color) => {
          controls.append(
            button(`simon-button ${color.id}`, color.label, s.over || s.showing, () => {
              const expected = s.sequence[s.input.length];
              if (color.id !== expected) {
                setWinner(s, "A", "Ошибка в последовательности.");
              } else {
                s.input.push(color.id);
                if (s.input.length === s.sequence.length) {
                  if (s.sequence.length >= targets[currentDifficulty]) setWinner(s, "H", "Вы повторили все раунды.");
                  else addStep(s);
                }
              }
              done();
            }),
          );
        });
        layout.append(display, button("take-button simon-ready", "Запомнил", s.over || !s.showing, () => {
          s.showing = false;
          done();
        }), controls);
        container.append(layout);
      },
    };
  }

  function checkersGame() {
    const size = 4;

    function moves(board, player) {
      const dir = player === "H" ? -1 : 1;
      const other = player === "H" ? "A" : "H";
      const simple = [];
      const captures = [];
      board.forEach((piece, from) => {
        if (piece !== player) return;
        const x = from % size;
        const y = Math.floor(from / size);
        [-1, 1].forEach((dx) => {
          const nx = x + dx;
          const ny = y + dir;
          const target = ny * size + nx;
          if (nx >= 0 && nx < size && ny >= 0 && ny < size && !board[target]) simple.push({ from, to: target, capture: -1 });
          const jx = x + dx * 2;
          const jy = y + dir * 2;
          const mid = (y + dir) * size + (x + dx);
          const jump = jy * size + jx;
          if (jx >= 0 && jx < size && jy >= 0 && jy < size && board[mid] === other && !board[jump]) captures.push({ from, to: jump, capture: mid });
        });
      });
      return captures.length ? captures : simple;
    }

    function apply(board, move) {
      const next = board.slice();
      next[move.to] = next[move.from];
      next[move.from] = "";
      if (move.capture >= 0) next[move.capture] = "";
      return next;
    }

    function winner(board, turn) {
      if (!board.includes("H")) return "A";
      if (!board.includes("A")) return "H";
      if (!moves(board, turn).length) return turn === "H" ? "A" : "H";
      return "";
    }

    function evaluate(board, turn) {
      const won = winner(board, turn);
      if (won === "A") return 1000;
      if (won === "H") return -1000;
      return board.filter((piece) => piece === "A").length * 12 - board.filter((piece) => piece === "H").length * 12 + moves(board, "A").length - moves(board, "H").length;
    }

    function minimax(board, turn, depth) {
      const won = winner(board, turn);
      if (won || depth === 0) return { score: evaluate(board, turn) };
      const options = moves(board, turn);
      const nextTurn = turn === "A" ? "H" : "A";
      const scored = options.map((move) => ({ move, score: minimax(apply(board, move), nextTurn, depth - 1).score }));
      return turn === "A"
        ? scored.reduce((best, item) => (item.score > best.score ? item : best))
        : scored.reduce((best, item) => (item.score < best.score ? item : best));
    }

    return {
      id: "checkers",
      title: "Мини-шашки",
      short: "4 на 4",
      subtitle: "Двигайте шашки по диагонали и бейте через фигуру соперника.",
      tag: "Шашки",
      color: "#92400e",
      create: () => ({ board: ["", "A", "", "A", "", "", "", "", "", "", "", "", "H", "", "H", ""], selected: -1, turn: "H", over: false, winner: "" }),
      status: (s) => s.message || (s.turn === "H" ? "Ваш ход: выберите шашку." : "ИИ думает над ходом."),
      score: (s) => [
        { side: "human", text: `Ваши: ${s.board.filter((piece) => piece === "H").length}` },
        { side: "ai", text: `ИИ: ${s.board.filter((piece) => piece === "A").length}` },
      ],
      render: (s, container, done) => {
        const legal = moves(s.board, "H");
        const targets = new Map(legal.filter((move) => move.from === s.selected).map((move) => [move.to, move]));
        const board = make("div", "board checkers-board");
        s.board.forEach((piece, index) => {
          const canSelect = isHumanTurn() && piece === "H" && legal.some((move) => move.from === index);
          const canMove = isHumanTurn() && targets.has(index);
          const node = button(`cell checker-cell ${(index + Math.floor(index / size)) % 2 ? "dark" : "light"} ${canMove ? "valid" : ""}`, piece === "H" ? "●" : piece === "A" ? "●" : "", !canSelect && !canMove, () => {
            if (canSelect) {
              s.selected = s.selected === index ? -1 : index;
              done();
              return;
            }
            if (canMove) {
              s.board = apply(s.board, targets.get(index));
              s.selected = -1;
              const won = winner(s.board, "A");
              if (won === "H") setWinner(s, "H", "Вы выиграли мини-шашки.");
              else if (won === "A") setWinner(s, "A", "ИИ выиграл мини-шашки.");
              else s.turn = "A";
              done();
            }
          });
          if (piece) node.classList.add(piece === "H" ? "human" : "ai");
          if (s.selected === index) node.classList.add("selected");
          board.append(node);
        });
        container.append(board);
      },
      ai: (s) => {
        const options = moves(s.board, "A");
        let move = sample(options);
        if (currentDifficulty === "medium") move = options.find((item) => item.capture >= 0) || move;
        if (currentDifficulty === "hard") move = minimax(s.board, "A", 4).move || move;
        if (currentDifficulty === "cyber") move = minimax(s.board, "A", 7).move || move;
        s.board = apply(s.board, move);
        const won = winner(s.board, "H");
        if (won === "A") setWinner(s, "A", "ИИ выиграл мини-шашки.");
        else if (won === "H") setWinner(s, "H", "Вы выиграли мини-шашки.");
        else s.turn = "H";
      },
    };
  }

  function tetrisGame() {
    const width = 6;
    const height = 10;
    const targets = { easy: 2, medium: 3, hard: 4, cyber: 5 };
    const shapes = [
      [[0, 0], [1, 0], [0, 1], [1, 1]],
      [[0, 0], [-1, 0], [1, 0], [2, 0]],
      [[0, 0], [-1, 0], [1, 0], [0, 1]],
      [[0, 0], [0, 1], [0, 2], [1, 2]],
      [[0, 0], [1, 0], [0, 1], [-1, 1]],
    ];

    function newPiece() {
      return { x: 2, y: 0, cells: sample(shapes).map(([x, y]) => [x, y]) };
    }

    function pieceCells(piece) {
      return piece.cells.map(([x, y]) => [piece.x + x, piece.y + y]);
    }

    function valid(board, piece) {
      return pieceCells(piece).every(([x, y]) => x >= 0 && x < width && y >= 0 && y < height && !board[y * width + x]);
    }

    function rotate(piece) {
      return { ...piece, cells: piece.cells.map(([x, y]) => [-y, x]) };
    }

    function clearLines(s) {
      const rows = [];
      for (let y = 0; y < height; y += 1) {
        const row = s.board.slice(y * width, y * width + width);
        if (row.every(Boolean)) {
          s.lines += 1;
          s.score += 100;
        } else rows.push(row);
      }
      while (rows.length < height) rows.unshift(Array(width).fill(""));
      s.board = rows.flat();
    }

    function lock(s) {
      pieceCells(s.piece).forEach(([x, y]) => {
        if (y >= 0 && y < height) s.board[y * width + x] = "block";
      });
      clearLines(s);
      if (s.lines >= targets[currentDifficulty]) {
        setWinner(s, "H", "Линии собраны. Тетрис пройден.");
        return;
      }
      s.piece = newPiece();
      if (!valid(s.board, s.piece)) setWinner(s, "A", "Поле переполнено.");
    }

    function softDrop(s) {
      const moved = { ...s.piece, y: s.piece.y + 1 };
      if (valid(s.board, moved)) s.piece = moved;
      else lock(s);
    }

    return {
      id: "tetris",
      title: "Тетрис",
      short: "падающие блоки",
      subtitle: "Двигайте и вращайте фигуру, собирая полные линии.",
      tag: "Аркада",
      color: "#0ea5e9",
      graphics: "2D пиксель",
      create: () => {
        const board = Array(width * height).fill("");
        const junk = { easy: 0, medium: 2, hard: 4, cyber: 7 }[currentDifficulty];
        shuffled(Array.from({ length: width }, (_, index) => index)).slice(0, junk).forEach((x) => {
          board[(height - 1) * width + x] = "block";
        });
        return { board, piece: newPiece(), lines: 0, score: 0, turn: "H", over: false, winner: "" };
      },
      status: (s) => s.message || `Соберите ${targets[currentDifficulty]} линии.`,
      score: (s) => [
        { side: "human", text: `Линии: ${s.lines}/${targets[currentDifficulty]}` },
        { side: "ai", text: `Очки: ${s.score}` },
      ],
      render: (s, container, done) => {
        const layout = make("div", "arcade-layout");
        const active = new Set(pieceCells(s.piece).map(([x, y]) => `${x},${y}`));
        const board = make("div", "pixel-board tetris-board");
        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            board.append(make("div", `pixel-cell ${s.board[y * width + x] ? "solid" : ""} ${active.has(`${x},${y}`) ? "active" : ""}`));
          }
        }
        const controls = make("div", "arcade-controls");
        [
          ["Влево", () => {
            const next = { ...s.piece, x: s.piece.x - 1 };
            if (valid(s.board, next)) s.piece = next;
          }],
          ["Вращать", () => {
            const next = rotate(s.piece);
            if (valid(s.board, next)) s.piece = next;
          }],
          ["Вправо", () => {
            const next = { ...s.piece, x: s.piece.x + 1 };
            if (valid(s.board, next)) s.piece = next;
          }],
          ["Вниз", () => softDrop(s)],
        ].forEach(([label, action]) => controls.append(button("arcade-control", label, s.over, () => { action(); done(); })));
        layout.append(board, controls);
        container.append(layout);
      },
    };
  }

  function breakoutGame() {
    const width = 9;
    const height = 8;
    const rows = { easy: 2, medium: 3, hard: 4, cyber: 5 };

    function tick(s) {
      let nx = s.ball.x + s.ball.dx;
      let ny = s.ball.y + s.ball.dy;
      if (nx < 0 || nx >= width) {
        s.ball.dx *= -1;
        nx = s.ball.x + s.ball.dx;
      }
      if (ny < 0) {
        s.ball.dy *= -1;
        ny = s.ball.y + s.ball.dy;
      }
      const brickKey = `${nx},${ny}`;
      if (s.bricks.has(brickKey)) {
        s.bricks.delete(brickKey);
        s.score += 10;
        s.ball.dy *= -1;
        ny = s.ball.y + s.ball.dy;
      }
      if (ny === height - 1) {
        if (nx >= s.paddle && nx < s.paddle + 3) {
          s.ball.dy = -1;
          s.ball.dx = nx === s.paddle ? -1 : nx === s.paddle + 2 ? 1 : s.ball.dx;
          ny = s.ball.y + s.ball.dy;
        } else {
          setWinner(s, "A", "Мяч пролетел мимо платформы.");
          return;
        }
      }
      s.ball.x = nx;
      s.ball.y = ny;
      if (!s.bricks.size) setWinner(s, "H", "Все блоки разбиты.");
    }

    return {
      id: "breakout",
      title: "Арканоид",
      short: "разбей блоки",
      subtitle: "Двигайте платформу и отбивайте мяч в блоки.",
      tag: "Аркада",
      color: "#f97316",
      graphics: "2D аркада",
      create: () => {
        const bricks = new Set();
        for (let y = 0; y < rows[currentDifficulty]; y += 1) {
          for (let x = 0; x < width; x += 1) bricks.add(`${x},${y}`);
        }
        return { bricks, paddle: 3, ball: { x: 4, y: 5, dx: 1, dy: -1 }, score: 0, turn: "H", over: false, winner: "" };
      },
      status: (s) => s.message || "Управляйте платформой и нажимайте Шаг.",
      score: (s) => [
        { side: "human", text: `Очки: ${s.score}` },
        { side: "ai", text: `Блоков: ${s.bricks.size}` },
      ],
      render: (s, container, done) => {
        const layout = make("div", "arcade-layout");
        const board = make("div", "pixel-board breakout-board");
        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            const isPaddle = y === height - 1 && x >= s.paddle && x < s.paddle + 3;
            const isBall = s.ball.x === x && s.ball.y === y;
            board.append(make("div", `pixel-cell ${s.bricks.has(`${x},${y}`) ? "brick" : ""} ${isPaddle ? "paddle" : ""} ${isBall ? "ball" : ""}`));
          }
        }
        const controls = make("div", "arcade-controls");
        controls.append(
          button("arcade-control", "Влево", s.over, () => { s.paddle = Math.max(0, s.paddle - 1); done(); }),
          button("arcade-control", "Шаг", s.over, () => { tick(s); if (currentDifficulty === "cyber" && !s.over) tick(s); done(); }),
          button("arcade-control", "Вправо", s.over, () => { s.paddle = Math.min(width - 3, s.paddle + 1); done(); }),
        );
        layout.append(board, controls);
        container.append(layout);
      },
    };
  }

  function flappyGame() {
    const width = 10;
    const height = 8;
    const goals = { easy: 4, medium: 5, hard: 6, cyber: 8 };
    const gaps = { easy: 4, medium: 3, hard: 3, cyber: 2 };

    function makePipe(x) {
      const gap = gaps[currentDifficulty];
      const top = Math.floor(Math.random() * (height - gap - 2)) + 1;
      return { x, top, bottom: top + gap };
    }

    function step(s, flap) {
      s.bird += flap ? -1 : 1;
      s.pipes.forEach((pipe) => { pipe.x -= 1; });
      if (s.pipes[0].x < 0) {
        s.pipes.shift();
        s.pipes.push(makePipe(width - 1));
        s.score += 1;
      }
      const pipe = s.pipes.find((item) => item.x === 2);
      if (s.bird < 0 || s.bird >= height || (pipe && (s.bird < pipe.top || s.bird >= pipe.bottom))) {
        setWinner(s, "A", "Птица врезалась.");
      } else if (s.score >= goals[currentDifficulty]) {
        setWinner(s, "H", "Вы пролетели трассу.");
      }
    }

    return {
      id: "flappy",
      title: "Flappy Bird",
      short: "пролети трубы",
      subtitle: "Нажимайте взмах, чтобы держать птицу между трубами.",
      tag: "Аркада",
      color: "#22c55e",
      graphics: "2D сайдскролл",
      create: () => ({ bird: 3, pipes: [makePipe(7), makePipe(12)], score: 0, turn: "H", over: false, winner: "" }),
      status: (s) => s.message || `Пролетите ${goals[currentDifficulty]} труб.`,
      score: (s) => [
        { side: "human", text: `Трубы: ${s.score}/${goals[currentDifficulty]}` },
        { side: "ai", text: `Зазор: ${gaps[currentDifficulty]}` },
      ],
      render: (s, container, done) => {
        const layout = make("div", "arcade-layout");
        const board = make("div", "pixel-board flappy-board");
        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            const pipe = s.pipes.find((item) => item.x === x);
            const isPipe = pipe && (y < pipe.top || y >= pipe.bottom);
            board.append(make("div", `pixel-cell ${isPipe ? "pipe" : ""} ${x === 2 && y === s.bird ? "bird" : ""}`));
          }
        }
        const controls = make("div", "arcade-controls");
        controls.append(
          button("arcade-control flap-button", "Взмах", s.over, () => { step(s, true); done(); }),
          button("arcade-control", "Падать", s.over, () => { step(s, false); done(); }),
        );
        layout.append(board, controls);
        container.append(layout);
      },
    };
  }

  function mazeChaseGame() {
    const size = 7;
    const map = [
      "#######",
      "#.....#",
      "#.###.#",
      "#.....#",
      "#.#.#.#",
      "#.....#",
      "#######",
    ];
    const ghostPaths = [
      [8, 9, 10, 17, 24, 23, 22, 15],
      [40, 39, 38, 31, 24, 25, 26, 33],
    ];
    const ghostCount = { easy: 1, medium: 1, hard: 2, cyber: 2 };

    function move(s, delta) {
      const next = s.player + delta;
      if (map[Math.floor(next / size)][next % size] !== "#") s.player = next;
      s.pellets.delete(s.player);
      s.ghostStep += 1;
      s.ghosts = s.ghosts.map((ghost, index) => ghostPaths[index][s.ghostStep % ghostPaths[index].length]);
      if (s.ghosts.includes(s.player)) setWinner(s, "A", "Призрак поймал героя.");
      else if (!s.pellets.size) setWinner(s, "H", "Лабиринт очищен.");
    }

    return {
      id: "maze-chase",
      title: "Пак-лабиринт",
      short: "собери точки",
      subtitle: "Собирайте точки и избегайте патрульных призраков.",
      tag: "Лабиринт",
      color: "#eab308",
      graphics: "2D лабиринт",
      create: () => {
        const pellets = new Set();
        map.forEach((row, y) => [...row].forEach((cell, x) => { if (cell === ".") pellets.add(y * size + x); }));
        const player = 22;
        pellets.delete(player);
        return { player, pellets, ghosts: ghostPaths.slice(0, ghostCount[currentDifficulty]).map((path) => path[0]), ghostStep: 0, turn: "H", over: false, winner: "" };
      },
      status: (s) => s.message || "Соберите все точки.",
      score: (s) => [
        { side: "human", text: `Осталось точек: ${s.pellets.size}` },
        { side: "ai", text: `Призраков: ${s.ghosts.length}` },
      ],
      render: (s, container, done) => {
        const layout = make("div", "arcade-layout");
        const board = make("div", "pixel-board maze-board");
        for (let i = 0; i < size * size; i += 1) {
          const wall = map[Math.floor(i / size)][i % size] === "#";
          board.append(make("div", `pixel-cell ${wall ? "wall" : ""} ${s.pellets.has(i) ? "pellet" : ""} ${s.ghosts.includes(i) ? "ghost" : ""} ${s.player === i ? "hero" : ""}`));
        }
        const controls = make("div", "arcade-controls");
        [
          ["Вверх", -size],
          ["Влево", -1],
          ["Вправо", 1],
          ["Вниз", size],
        ].forEach(([label, delta]) => controls.append(button("arcade-control", label, s.over, () => { move(s, delta); done(); })));
        layout.append(board, controls);
        container.append(layout);
      },
    };
  }

  function spaceInvadersGame() {
    const width = 8;
    const height = 8;
    const rows = { easy: 1, medium: 2, hard: 3, cyber: 3 };

    function step(s) {
      s.shots = s.shots.map((shot) => shot - width).filter((shot) => shot >= 0);
      s.shots.forEach((shot) => {
        if (s.invaders.has(shot)) {
          s.invaders.delete(shot);
          s.hit.add(shot);
          s.score += 20;
        }
      });
      s.shots = s.shots.filter((shot) => !s.hit.has(shot));
      s.hit.clear();
      s.tick += 1;
      if (s.tick % (currentDifficulty === "easy" ? 4 : currentDifficulty === "medium" ? 3 : 2) === 0) {
        s.invaders = new Set([...s.invaders].map((cell) => cell + width));
      }
      if (!s.invaders.size) setWinner(s, "H", "Захватчики сбиты.");
      if ([...s.invaders].some((cell) => cell >= (height - 1) * width)) setWinner(s, "A", "Захватчики добрались до базы.");
    }

    return {
      id: "space-invaders",
      title: "Space Invaders",
      short: "бей пришельцев",
      subtitle: "Двигайте корабль, стреляйте и не подпускайте захватчиков.",
      tag: "Шутер",
      color: "#6366f1",
      graphics: "2D космос",
      create: () => {
        const invaders = new Set();
        for (let y = 0; y < rows[currentDifficulty]; y += 1) {
          for (let x = 1; x < width - 1; x += 2) invaders.add(y * width + x);
        }
        return { player: 4, invaders, shots: [], hit: new Set(), tick: 0, score: 0, turn: "H", over: false, winner: "" };
      },
      status: (s) => s.message || "Стреляйте по захватчикам.",
      score: (s) => [
        { side: "human", text: `Очки: ${s.score}` },
        { side: "ai", text: `Врагов: ${s.invaders.size}` },
      ],
      render: (s, container, done) => {
        const layout = make("div", "arcade-layout");
        const board = make("div", "pixel-board invader-board");
        for (let i = 0; i < width * height; i += 1) {
          board.append(make("div", `pixel-cell ${s.player + (height - 1) * width === i ? "ship" : ""} ${s.invaders.has(i) ? "invader" : ""} ${s.shots.includes(i) ? "laser" : ""}`));
        }
        const controls = make("div", "arcade-controls");
        controls.append(
          button("arcade-control", "Влево", s.over, () => { s.player = Math.max(0, s.player - 1); done(); }),
          button("arcade-control", "Огонь", s.over, () => { s.shots.push((height - 2) * width + s.player); step(s); done(); }),
          button("arcade-control", "Шаг", s.over, () => { step(s); done(); }),
          button("arcade-control", "Вправо", s.over, () => { s.player = Math.min(width - 1, s.player + 1); done(); }),
        );
        layout.append(board, controls);
        container.append(layout);
      },
    };
  }

  function asteroidsGame() {
    const size = 8;
    const goals = { easy: 4, medium: 5, hard: 6, cyber: 8 };
    const rocks = { easy: 4, medium: 6, hard: 8, cyber: 10 };

    function spawnRock(s) {
      const open = Array.from({ length: size }, (_, x) => x).filter((x) => x !== s.ship);
      s.rocks.push({ x: sample(open), y: 0 });
    }

    function step(s, shoot) {
      if (shoot) {
        const hit = s.rocks.find((rock) => rock.x === s.ship);
        if (hit) {
          s.rocks.splice(s.rocks.indexOf(hit), 1);
          s.score += 1;
        }
      }
      s.rocks.forEach((rock) => { rock.y += 1; });
      s.rocks = s.rocks.filter((rock) => rock.y < size);
      if (s.rocks.some((rock) => rock.y === size - 1 && rock.x === s.ship)) setWinner(s, "A", "Астероид попал в корабль.");
      if (s.score >= goals[currentDifficulty]) setWinner(s, "H", "Сектор очищен от астероидов.");
      if (!s.over && s.rocks.length < rocks[currentDifficulty]) spawnRock(s);
    }

    return {
      id: "asteroids",
      title: "Астероиды",
      short: "космический тир",
      subtitle: "Уклоняйтесь и сбивайте астероиды лазером.",
      tag: "Космос",
      color: "#7c2d12",
      graphics: "2D космос",
      create: () => {
        const s = { ship: 3, rocks: [], score: 0, turn: "H", over: false, winner: "" };
        for (let i = 0; i < rocks[currentDifficulty]; i += 1) spawnRock(s);
        return s;
      },
      status: (s) => s.message || `Сбейте ${goals[currentDifficulty]} астероидов.`,
      score: (s) => [
        { side: "human", text: `Сбито: ${s.score}/${goals[currentDifficulty]}` },
        { side: "ai", text: `Астероидов: ${s.rocks.length}` },
      ],
      render: (s, container, done) => {
        const layout = make("div", "arcade-layout");
        const board = make("div", "pixel-board asteroid-board");
        for (let y = 0; y < size; y += 1) {
          for (let x = 0; x < size; x += 1) {
            const rock = s.rocks.some((item) => item.x === x && item.y === y);
            board.append(make("div", `pixel-cell ${rock ? "rock" : ""} ${y === size - 1 && x === s.ship ? "ship" : ""}`));
          }
        }
        const controls = make("div", "arcade-controls");
        controls.append(
          button("arcade-control", "Влево", s.over, () => { s.ship = Math.max(0, s.ship - 1); step(s, false); done(); }),
          button("arcade-control", "Лазер", s.over, () => { step(s, true); done(); }),
          button("arcade-control", "Вправо", s.over, () => { s.ship = Math.min(size - 1, s.ship + 1); step(s, false); done(); }),
        );
        layout.append(board, controls);
        container.append(layout);
      },
    };
  }

  function froggerGame() {
    const width = 7;
    const height = 7;
    const carRows = { easy: 2, medium: 3, hard: 4, cyber: 5 };

    function carsFor(s, y) {
      const speed = y % 2 ? 1 : -1;
      return [0, 3, 6].map((x) => (x + s.tick * speed + width * 20) % width);
    }

    function step(s, delta) {
      const next = s.frog + delta;
      const x = next % width;
      const y = Math.floor(next / width);
      if (x >= 0 && x < width && y >= 0 && y < height) s.frog = next;
      s.tick += 1;
      const fy = Math.floor(s.frog / width);
      const fx = s.frog % width;
      if (fy > 0 && fy <= carRows[currentDifficulty] && carsFor(s, fy).includes(fx)) setWinner(s, "A", "Машина сбила лягушку.");
      if (fy === 0) setWinner(s, "H", "Лягушка добралась до берега.");
    }

    return {
      id: "frogger",
      title: "Frogger",
      short: "перейди дорогу",
      subtitle: "Проведите лягушку через поток машин до верхнего берега.",
      tag: "Аркада",
      color: "#65a30d",
      graphics: "2D дорога",
      create: () => ({ frog: 45, tick: 0, turn: "H", over: false, winner: "" }),
      status: (s) => s.message || "Двигайтесь к верхнему краю.",
      score: (s) => [
        { side: "human", text: `Ряд: ${height - Math.floor(s.frog / width)}` },
        { side: "ai", text: `Машин: ${carRows[currentDifficulty]}` },
      ],
      render: (s, container, done) => {
        const layout = make("div", "arcade-layout");
        const board = make("div", "pixel-board frogger-board");
        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            const i = y * width + x;
            const car = y > 0 && y <= carRows[currentDifficulty] && carsFor(s, y).includes(x);
            board.append(make("div", `pixel-cell ${y === 0 ? "goal" : ""} ${car ? "car" : ""} ${s.frog === i ? "frog" : ""}`));
          }
        }
        const controls = make("div", "arcade-controls");
        [
          ["Вверх", -width],
          ["Влево", -1],
          ["Вправо", 1],
          ["Вниз", width],
        ].forEach(([label, delta]) => controls.append(button("arcade-control", label, s.over, () => { step(s, delta); done(); })));
        layout.append(board, controls);
        container.append(layout);
      },
    };
  }

  function sokobanGame() {
    const size = 6;
    const levels = {
      easy: { player: 20, box: 15, goal: 10, walls: [0, 1, 2, 3, 4, 5, 6, 11, 12, 17, 18, 23, 24, 29, 30, 31, 32, 33, 34, 35] },
      medium: { player: 26, box: 20, goal: 9, walls: [0, 1, 2, 3, 4, 5, 6, 11, 12, 17, 18, 23, 24, 29, 30, 31, 32, 33, 34, 35, 14] },
      hard: { player: 26, box: 20, goal: 8, walls: [0, 1, 2, 3, 4, 5, 6, 11, 12, 17, 18, 23, 24, 29, 30, 31, 32, 33, 34, 35, 14, 21] },
      cyber: { player: 26, box: 20, goal: 7, walls: [0, 1, 2, 3, 4, 5, 6, 11, 12, 17, 18, 23, 24, 29, 30, 31, 32, 33, 34, 35, 14, 21, 15] },
    };

    function canMove(pos, walls) {
      return pos >= 0 && pos < size * size && !walls.has(pos);
    }

    function move(s, delta) {
      const next = s.player + delta;
      if (!canMove(next, s.walls)) return;
      if (next === s.box) {
        const boxNext = s.box + delta;
        if (!canMove(boxNext, s.walls)) return;
        s.box = boxNext;
      }
      s.player = next;
      s.moves += 1;
      if (s.box === s.goal) setWinner(s, "H", "Ящик на цели.");
    }

    return {
      id: "sokoban",
      title: "Сокобан",
      short: "толкай ящик",
      subtitle: "Затолкайте ящик на светящуюся цель.",
      tag: "Пазл",
      color: "#78716c",
      graphics: "2D пазл",
      create: () => {
        const level = levels[currentDifficulty];
        return { player: level.player, box: level.box, goal: level.goal, walls: new Set(level.walls), moves: 0, turn: "H", over: false, winner: "" };
      },
      status: (s) => s.message || "Толкайте ящик к цели.",
      score: (s) => [
        { side: "human", text: `Ходы: ${s.moves}` },
        { side: "ai", text: "Без ИИ" },
      ],
      render: (s, container, done) => {
        const layout = make("div", "arcade-layout");
        const board = make("div", "pixel-board sokoban-board");
        for (let i = 0; i < size * size; i += 1) {
          board.append(make("div", `pixel-cell ${s.walls.has(i) ? "wall" : ""} ${s.goal === i ? "goal" : ""} ${s.box === i ? "box" : ""} ${s.player === i ? "hero" : ""}`));
        }
        const controls = make("div", "arcade-controls");
        [
          ["Вверх", -size],
          ["Влево", -1],
          ["Вправо", 1],
          ["Вниз", size],
        ].forEach(([label, delta]) => controls.append(button("arcade-control", label, s.over, () => { move(s, delta); done(); })));
        layout.append(board, controls);
        container.append(layout);
      },
    };
  }

  function match3Game() {
    const size = 6;
    const icons = ["gem-a", "gem-b", "gem-c", "gem-d", "gem-e"];
    const targets = { easy: 4, medium: 5, hard: 7, cyber: 9 };

    function findMatches(board) {
      const matched = new Set();
      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size - 2; x += 1) {
          const a = y * size + x;
          if (board[a] === board[a + 1] && board[a] === board[a + 2]) [a, a + 1, a + 2].forEach((i) => matched.add(i));
        }
      }
      for (let x = 0; x < size; x += 1) {
        for (let y = 0; y < size - 2; y += 1) {
          const a = y * size + x;
          if (board[a] === board[a + size] && board[a] === board[a + size * 2]) [a, a + size, a + size * 2].forEach((i) => matched.add(i));
        }
      }
      return matched;
    }

    function refill(s) {
      let matched = findMatches(s.board);
      if (!matched.size) return;
      s.score += matched.size;
      matched.forEach((index) => { s.board[index] = sample(icons); });
      if (s.score >= targets[currentDifficulty]) setWinner(s, "H", "Комбо собрано.");
    }

    function adjacent(a, b) {
      const ax = a % size;
      const ay = Math.floor(a / size);
      const bx = b % size;
      const by = Math.floor(b / size);
      return Math.abs(ax - bx) + Math.abs(ay - by) === 1;
    }

    return {
      id: "match3",
      title: "Match-3",
      short: "три в ряд",
      subtitle: "Меняйте соседние кристаллы и собирайте тройки.",
      tag: "Комбо",
      color: "#db2777",
      graphics: "2D кристаллы",
      create: () => ({ board: Array.from({ length: size * size }, () => sample(icons)), selected: -1, score: 0, turn: "H", over: false, winner: "" }),
      status: (s) => s.message || `Соберите ${targets[currentDifficulty]} кристаллов.`,
      score: (s) => [
        { side: "human", text: `Собрано: ${s.score}/${targets[currentDifficulty]}` },
        { side: "ai", text: "Без ИИ" },
      ],
      render: (s, container, done) => {
        const board = make("div", "board match-board");
        s.board.forEach((gem, index) => {
          board.append(button(`cell match-cell ${gem} ${s.selected === index ? "selected" : ""}`, "", s.over, () => {
            if (s.selected < 0) s.selected = index;
            else if (adjacent(s.selected, index)) {
              [s.board[s.selected], s.board[index]] = [s.board[index], s.board[s.selected]];
              if (findMatches(s.board).size) refill(s);
              else [s.board[s.selected], s.board[index]] = [s.board[index], s.board[s.selected]];
              s.selected = -1;
            } else s.selected = index;
            done();
          }));
        });
        container.append(board);
      },
    };
  }

  function whackMoleGame() {
    const size = 4;
    const targets = { easy: 5, medium: 7, hard: 9, cyber: 12 };
    const traps = { easy: 0, medium: 1, hard: 2, cyber: 3 };

    function nextRound(s) {
      const cells = shuffled(Array.from({ length: size * size }, (_, index) => index));
      s.mole = cells[0];
      s.traps = new Set(cells.slice(1, 1 + traps[currentDifficulty]));
    }

    return {
      id: "whack-mole",
      title: "Whack-a-Mole",
      short: "бей крота",
      subtitle: "Ловите крота и не нажимайте на ловушки.",
      tag: "Реакция",
      color: "#a16207",
      graphics: "2D реакция",
      create: () => {
        const s = { mole: 0, traps: new Set(), score: 0, misses: 0, turn: "H", over: false, winner: "" };
        nextRound(s);
        return s;
      },
      status: (s) => s.message || "Нажмите на крота.",
      score: (s) => [
        { side: "human", text: `Попадания: ${s.score}/${targets[currentDifficulty]}` },
        { side: "ai", text: `Ошибки: ${s.misses}/3` },
      ],
      render: (s, container, done) => {
        const board = make("div", "board mole-board");
        for (let i = 0; i < size * size; i += 1) {
          board.append(button(`cell mole-cell ${s.mole === i ? "mole" : ""} ${s.traps.has(i) ? "trap" : ""}`, s.mole === i ? "!" : s.traps.has(i) ? "x" : "", s.over, () => {
            if (i === s.mole) {
              s.score += 1;
              if (s.score >= targets[currentDifficulty]) setWinner(s, "H", "Вы поймали всех кротов.");
              else nextRound(s);
            } else {
              s.misses += 1;
              if (s.traps.has(i) || s.misses >= 3) setWinner(s, "A", "Слишком много промахов.");
              else nextRound(s);
            }
            done();
          }));
        }
        container.append(board);
      },
    };
  }

  setupNav();
  resetButton.addEventListener("click", () => startGame(currentGame.id));
  difficultyButtons.forEach((buttonNode) => {
    buttonNode.addEventListener("click", () => {
      const nextDifficulty = buttonNode.dataset.difficulty;
      if (!difficulties[nextDifficulty]) return;
      currentDifficulty = nextDifficulty;
      startGame(currentGame.id);
    });
  });
  startGame(games[0].id);
})();
