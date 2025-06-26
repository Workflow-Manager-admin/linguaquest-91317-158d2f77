import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// Brand and theme colors
const COLORS = {
  primary: "#1d3557",
  secondary: "#457b9d",
  accent: "#e63946",
};

const DEFAULT_BOARD = {
  categories: [
    { name: "Vocabulary", scope: "words" },
    { name: "Grammar", scope: "grammar" },
    { name: "Idioms", scope: "phrases" },
  ],
  questions: [
    // Each row = array for each category
    [
      { question: "Translate: 'apple'", answer: "manzana", value: 100 },
      { question: "Present of 'be' (I, you, he)?", answer: "am, are, is", value: 100 },
      { question: "Meaning: 'Break the ice'", answer: "Make people feel comfortable", value: 100 },
    ],
    [
      { question: "Translate: 'cat'", answer: "gato", value: 200 },
      { question: "Past of 'go'", answer: "went", value: 200 },
      { question: "Meaning: 'Hit the books'", answer: "Study hard", value: 200 },
    ],
    [
      { question: "Translate: 'house'", answer: "casa", value: 300 },
      { question: "Comparative of 'big'", answer: "bigger", value: 300 },
      { question: "Meaning: 'Piece of cake'", answer: "Something easy", value: 300 },
    ],
  ],
};

// Utility functions for file operations
function exportJSON(data, filename) {
  const content = JSON.stringify(data, null, 2);
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const el = document.createElement("a");
  el.href = url;
  el.download = filename;
  document.body.appendChild(el);
  el.click();
  setTimeout(() => {
    document.body.removeChild(el);
    URL.revokeObjectURL(url);
  }, 100);
}

// PUBLIC_INTERFACE
function App() {
  // Board/state: categories (with language scope), questions[rows][columns] => objects
  const [board, setBoard] = useState(() => loadInitialBoard());
  const [revealed, setRevealed] = useState([]); // revealed[row][col] = true
  const [modal, setModal] = useState(null); // {row, col}
  const [adminMode, setAdminMode] = useState(false);
  const [editMode, setEditMode] = useState(false); // Edit question cell directly
  const [editCell, setEditCell] = useState(null); // {row, col}
  const [error, setError] = useState(null);
  const uploadRef = useRef();

  useEffect(() => {
    if (adminMode) setRevealed(Array(board.questions.length).fill().map(() => Array(board.categories.length).fill(false)));
  }, [adminMode, board.categories.length, board.questions.length]);

  function loadInitialBoard() {
    // Optionally, load from localStorage
    try {
      const raw = localStorage.getItem("jeopardy_board");
      if (raw) return JSON.parse(raw);
    } catch {}
    return JSON.parse(JSON.stringify(DEFAULT_BOARD));
  }

  function saveBoardToStorage(b) {
    localStorage.setItem("jeopardy_board", JSON.stringify(b));
  }

  function handleTileClick(row, col) {
    if (adminMode) {
      setEditCell({ row, col });
      setEditMode(true);
      return;
    }
    // Show the question modal
    setModal({ row, col });
    // Mark as revealed
    const revealedCopy = revealed.slice();
    revealedCopy[row][col] = true;
    setRevealed(revealedCopy);
  }

  function handleCloseModal() {
    setModal(null);
  }

  function handleAdminToggle() {
    setAdminMode((a) => !a);
    setEditCell(null);
    setEditMode(false);
    setModal(null);
  }

  function handleEditCategory(idx, prop, value) {
    const categoriesCopy = [...board.categories];
    categoriesCopy[idx] = { ...categoriesCopy[idx], [prop]: value };
    const updatedBoard = { ...board, categories: categoriesCopy };
    setBoard(updatedBoard);
    saveBoardToStorage(updatedBoard);
  }

  function handleEditQuestion(row, col, prop, value) {
    const questionsCopy = board.questions.map((rowArr, i) =>
      rowArr.map((q, j) =>
        i === row && j === col ? { ...q, [prop]: value } : q
      )
    );
    const updatedBoard = { ...board, questions: questionsCopy };
    setBoard(updatedBoard);
    saveBoardToStorage(updatedBoard);
  }

  function handleResetRevealed() {
    setRevealed(Array(board.questions.length).fill().map(() => Array(board.categories.length).fill(false)));
  }

  function handleExport() {
    exportJSON(board, "jeopardy_questions.json");
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        // Verify shape: categories (array), questions (array of row arrays)
        if (
          Array.isArray(data.categories) &&
          Array.isArray(data.questions) &&
          data.questions.length > 0 &&
          data.categories.length > 0
        ) {
          setBoard(data);
          saveBoardToStorage(data);
          setEditCell(null);
          setError(null);
        } else {
          setError("File format invalid.");
        }
      } catch {
        setError("Could not parse JSON file.");
      }
    };
    reader.readAsText(file);
  }

  function handleAddCategory() {
    const categoriesCopy = [...board.categories, { name: "New category", scope: "" }];
    const questionsCopy = board.questions.map((rowArr) => [...rowArr, { question: "", answer: "", value: 100 }]);
    const updatedBoard = { categories: categoriesCopy, questions: questionsCopy };
    setBoard(updatedBoard);
    saveBoardToStorage(updatedBoard);
  }

  function handleRemoveCategory(idx) {
    if (board.categories.length <= 1) return;
    const categoriesCopy = board.categories.filter((_, i) => i !== idx);
    const questionsCopy = board.questions.map((rowArr) => rowArr.filter((_, j) => j !== idx));
    const updatedBoard = { categories: categoriesCopy, questions: questionsCopy };
    setBoard(updatedBoard);
    saveBoardToStorage(updatedBoard);
  }

  function handleAddRow() {
    const newRow = board.categories.map(() => ({ question: "", answer: "", value: 100 }));
    const questionsCopy = [...board.questions, newRow];
    const updatedBoard = { ...board, questions: questionsCopy };
    setBoard(updatedBoard);
    saveBoardToStorage(updatedBoard);
  }

  function handleRemoveRow(idx) {
    if (board.questions.length <= 1) return;
    const questionsCopy = board.questions.filter((_, i) => i !== idx);
    const updatedBoard = { ...board, questions: questionsCopy };
    setBoard(updatedBoard);
    saveBoardToStorage(updatedBoard);
  }

  // Theme toggle (already supported, but simplified)
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  // Render Functions
  function renderBoard() {
    return (
      <div style={{ overflowX: "auto" }}>
        <table className="jeopardy-board" style={{ borderCollapse: "separate", borderSpacing: 4, margin: "0 auto" }}>
          <thead>
            <tr>
              {board.categories.map((cat, i) => (
                <th key={i} style={categoryHeaderStyle(i)}>
                  <div>
                    {adminMode ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "center" }}>
                        <input
                          type="text"
                          value={cat.name}
                          style={catEditInputStyle()}
                          onChange={e => handleEditCategory(i, "name", e.target.value)}
                          aria-label={`Edit category ${i + 1}`}
                        />
                        <input
                          type="text"
                          value={cat.scope}
                          style={{ ...catEditInputStyle(), width: 60, fontSize: 11 }}
                          placeholder="Scope"
                          onChange={e => handleEditCategory(i, "scope", e.target.value)}
                          aria-label={`Edit language scope for category ${i + 1}`}
                        />
                        <button
                          style={miniBtnStyle()}
                          onClick={() => handleRemoveCategory(i)}
                          title="Remove category"
                          aria-label="Remove category"
                          disabled={board.categories.length <= 1}
                        >✕</button>
                      </div>
                    ) : (
                      <span>
                        <span style={{ fontWeight: 600 }}>{cat.name}</span>
                        <br />
                        <span style={{ fontSize: 12, color: COLORS.secondary, letterSpacing: 0.7 }}>
                          {cat.scope}
                        </span>
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {adminMode &&
                <th style={{ background: "none", border: "none", width: 44 }}>
                  <button style={miniBtnStyle({ background: COLORS.primary })} onClick={handleAddCategory} title="Add category">+</button>
                </th>}
            </tr>
          </thead>
          <tbody>
            {board.questions.map((rowArr, row) => (
              <tr key={row}>
                {rowArr.map((cell, col) => (
                  <td
                    key={col}
                    style={tileStyle(row, col, revealed, adminMode, COLORS)}
                    onClick={() => handleTileClick(row, col)}
                    tabIndex={0}
                    aria-label={adminMode ? "Edit question" : revealed[row]?.[col] ? "Revealed" : "Reveal question"}
                  >
                    {adminMode && editCell && editCell.row === row && editCell.col === col && editMode ? (
                      <QuestionEditForm
                        cell={cell}
                        onSave={obj => {
                          handleEditQuestion(row, col, "question", obj.question);
                          handleEditQuestion(row, col, "answer", obj.answer);
                          handleEditQuestion(row, col, "value", obj.value);
                          setEditCell(null);
                          setEditMode(false);
                        }}
                        onCancel={() => { setEditCell(null); setEditMode(false); }}
                      />
                    ) : adminMode ? (
                      <>
                        <span style={{ fontSize: 13, color: COLORS.primary }}>{cell.value}</span>
                        <br />
                        <span style={{ color: COLORS.secondary, fontSize: 11 }}>{cell.question.slice(0, 18) || <em>Empty</em>}</span>
                      </>
                    ) : (
                      revealed[row]?.[col] ? (
                        <span style={{ color: COLORS.secondary, fontWeight: 600 }}>{cell.value}</span>
                      ) : (
                        <span style={{ fontWeight: 700, fontSize: 18 }}>{cell.value}</span>
                      )
                    )}
                  </td>
                ))}
                {adminMode && (
                  <td>
                    <button
                      style={miniBtnStyle({ background: COLORS.secondary })}
                      onClick={() => handleRemoveRow(row)}
                      title="Remove row"
                      aria-label="Remove row"
                      disabled={board.questions.length <= 1}
                    >✕</button>
                  </td>
                )}
              </tr>
            ))}
            {adminMode && (
              <tr>
                <td colSpan={board.categories.length + 1} style={{ textAlign: "right", border: "none" }}>
                  <button onClick={handleAddRow} style={miniBtnStyle({ background: COLORS.primary })}>Add row</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="App" style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
      </button>
      <div style={headerBarStyle(COLORS)}>
        <h1 style={titleStyle()}>LinguaQuest: Jeopardy English Game</h1>
        <button style={adminBtnStyle(adminMode, COLORS)} onClick={handleAdminToggle}>
          {adminMode ? "Exit Admin Mode" : "Admin Mode"}
        </button>
      </div>
      <div style={{ margin: "0 auto", maxWidth: 960, padding: 18 }}>
        <p style={{ marginTop: 0, color: COLORS.primary, fontSize: 16 }}>
          {adminMode ? (
            "Admin mode: Edit questions, categories, language scopes. Save and load question sets as JSON files."
          ) : (
            "Select a tile to reveal its question. Each category can represent a different language scope."
          )}
        </p>
        {error && <div style={{ color: COLORS.accent, marginBottom: 8 }}>{error}</div>}
        {renderBoard()}

        {modal &&
          <QuestionModal
            question={board.questions[modal.row][modal.col]}
            onClose={handleCloseModal}
            category={board.categories[modal.col]}
          />
        }

        {adminMode && (
          <AdminPanel
            onExport={handleExport}
            onImport={() => uploadRef.current.click()}
            fileInputRef={uploadRef}
            onFileChange={handleImport}
            error={error}
            board={board}
            setError={setError}
          />
        )}
        {!adminMode && (
          <button style={{ ...adminBtnStyle(false, COLORS), marginTop: 20 }} onClick={handleResetRevealed}>
            Reset Board
          </button>
        )}
      </div>
      <footer style={footerStyle()}>
        <span style={{ color: COLORS.primary, fontSize: 12 }}>
          &copy; 2024 LinguaQuest - KAVIA Template
        </span>
      </footer>
    </div>
  );
}

// PUBLIC_INTERFACE
function QuestionModal({ question, onClose, category }) {
  return (
    <div style={modalOverlayStyle()}>
      <div style={modalContentStyle()}>
        <span style={{ fontSize: 13, color: "#457b9d" }}>
          Category: <strong>{category.name}</strong>
          {category.scope && <> &mdash; <i>{category.scope}</i></>}
        </span>
        <h2 style={{ margin: "8px 0", fontSize: 21 }}>{question.question}</h2>
        <p>
          <label style={{ color: "#999", fontWeight: 400 }}>Answer: </label>
          <span style={{ fontSize: 17, color: "#1d3557" }}>{question.answer}</span>
        </p>
        <button style={{ ...adminBtnStyle(false), marginTop: 14 }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function QuestionEditForm({ cell, onSave, onCancel }) {
  const [q, setQ] = useState(cell.question);
  const [a, setA] = useState(cell.answer);
  const [v, setV] = useState(cell.value);
  return (
    <form
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minWidth: 112,
      }}
      onSubmit={e => {
        e.preventDefault();
        onSave({ question: q, answer: a, value: Number(v) || 100 });
      }}
    >
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        style={inputStyle()}
        placeholder="Question"
        autoFocus
      />
      <input
        value={a}
        onChange={e => setA(e.target.value)}
        style={inputStyle()}
        placeholder="Answer"
      />
      <input
        value={v}
        onChange={e => setV(e.target.value)}
        style={inputStyle()}
        type="number"
        min={0}
        max={5000}
        placeholder="Value"
      />
      <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
        <button type="submit" style={miniBtnStyle({ background: "#1d3557" })}>Save</button>
        <button type="button" style={miniBtnStyle({ background: "#ccc", color: "#1d3557" })} onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

// PUBLIC_INTERFACE
function AdminPanel({ onExport, onImport, fileInputRef, onFileChange, error }) {
  return (
    <div style={({ marginTop: 24, display: "flex", gap: 16, alignItems: "center" })}>
      <button style={adminBtnStyle()} onClick={onExport}>
        Save Questions
      </button>
      <button style={adminBtnStyle()} onClick={onImport}>
        Load Questions
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        style={{ display: "none" }}
        onChange={onFileChange}
        data-testid="file-input"
      />
      <span style={{ fontSize: 12, color: "#888" }}>
        (JSON file with categories & questions)
      </span>
      {error && <span style={{ color: "#e63946", marginLeft: 8 }}>{error}</span>}
    </div>
  );
}

// STYLES
function categoryHeaderStyle(idx) {
  return {
    background: "#f1faee",
    borderBottom: `3px solid ${COLORS.primary}`,
    borderRadius: 4,
    padding: "6px 10px",
    color: COLORS.primary,
    fontSize: 17,
    textAlign: "center",
    fontWeight: 700,
    minWidth: 125,
    position: "relative",
  };
}
function tileStyle(row, col, revealed, adminMode, COLORS) {
  return {
    cursor: adminMode ? "pointer" : (revealed?.[row]?.[col] ? "not-allowed" : "pointer"),
    background: revealed?.[row]?.[col]
      ? "#e7ecef"
      : (adminMode ? "#dee2e6" : COLORS.primary),
    color: adminMode
      ? COLORS.primary
      : revealed?.[row]?.[col]
      ? COLORS.secondary
      : "#fff",
    border: "1.5px solid #ddd",
    borderRadius: 6,
    minWidth: 110,
    minHeight: 60,
    fontSize: 18,
    fontWeight: 600,
    textAlign: "center",
    verticalAlign: "middle",
    transition: "background 0.15s, color 0.15s",
    boxShadow: adminMode ? undefined : (revealed?.[row]?.[col] ? "none" : `0 1px 8px 0 rgba(50,60,120,0.08)`),
    position: "relative",
  };
}
function headerBarStyle(colors) {
  return {
    background: "#fafffd",
    padding: "14px 0 10px 0",
    marginBottom: 24,
    boxShadow: "0 1px 8px 0 rgba(110,120,140,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 14,
    width: "100%",
  };
}
function titleStyle() {
  return {
    color: COLORS.primary,
    fontWeight: 900,
    fontSize: 27,
    margin: 0,
    fontFamily: "'Segoe UI', 'Roboto', sans-serif"
  };
}
function adminBtnStyle(active, customColors = COLORS) {
  return {
    background: active ? customColors.accent : customColors.secondary,
    color: "#fff",
    fontWeight: "bold",
    border: "none",
    borderRadius: 6,
    padding: "7px 18px",
    margin: "0 6px",
    boxShadow: "0 0.5px 2px 0 rgba(0,0,0,0.10)",
    cursor: "pointer",
    fontSize: 15,
    textTransform: "none",
    transition: "background 0.15s",
  };
}
function miniBtnStyle(styleExtras) {
  return {
    background: "#e63946",
    color: "#fff",
    padding: "2px 9px",
    fontSize: 16,
    border: "none",
    borderRadius: 6,
    fontWeight: "bold",
    marginLeft: 2,
    minWidth: 22,
    transition: "background 0.15s",
    ...styleExtras,
    cursor: "pointer",
  };
}
function inputStyle() {
  return {
    fontSize: 13.5,
    padding: "4px 6px",
    borderRadius: 5,
    border: "1px solid #aaa",
    outline: "none",
  };
}
function catEditInputStyle() {
  return {
    fontWeight: "700",
    fontSize: 15,
    borderRadius: 3,
    outline: "none",
    border: "1px solid #aad",
    padding: "2px 6px",
    minWidth: 70,
    marginRight: 3,
  };
}
function modalOverlayStyle() {
  return {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(30,30,45,0.13)",
    zIndex: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  };
}
function modalContentStyle() {
  return {
    background: "#fff",
    borderRadius: 10,
    padding: "24px 20px 14px 20px",
    minWidth: 320,
    minHeight: 90,
    boxShadow: "0 8px 36px 0 rgba(60,50,105,0.23)",
    color: "#1d3557",
    textAlign: "center",
    position: "relative"
  };
}
function footerStyle() {
  return {
    padding: "16px 0 8px 0",
    textAlign: "center"
  };
}

export default App;
