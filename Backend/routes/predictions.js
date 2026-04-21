const express  = require("express");
const router   = express.Router();
const mongoose = require("mongoose");
const { exec } = require("child_process");
const path     = require("path");
const { spawn } = require("child_process");

const PIPELINE   = path.join(__dirname, "..", "ml_module", "pipeline.py");
const ML_DIR     = path.join(__dirname, "..", "ml_module");

// Full path to Python executable
const PYTHON_PATH = "C:\\Users\\Pinipa Hettiarachchi\\AppData\\Local\\Programs\\Python\\Python314\\python.exe";
const PYTHON = `"${PYTHON_PATH}"`; // quoted for exec()

// GET /api/predictions?supplierId=xxx
router.get("/", async (req, res) => {
  try {
    const col    = mongoose.connection.db.collection("predictions");
    const query  = req.query.supplierId ? { supplier_id: req.query.supplierId } : {};
    const latest = await col.find(query).sort({ created_at: -1 }).toArray();

    const seen   = new Set();
    const unique = latest.filter(p => {
      const key = `${p.supplier_id}__${p.material_name}__${p.category}__${p.condition}__${p.parts}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    res.json(unique);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/predictions/dataset/download — download RAW transaction rows from MongoDB
router.get("/dataset/download", (req, res) => {
  if (!PYTHON_PATH) return res.status(503).json({ error: "Python is not installed or not in PATH on this server." });
  const scriptPath = path.join(ML_DIR, "export_dataset.py");
  const py = spawn(PYTHON_PATH, ["-W", "ignore", scriptPath], { cwd: ML_DIR });
  let csv = "", err = "";
  py.stdout.on("data", d => { csv += d.toString(); });
  py.stderr.on("data", d => { err += d.toString(); });
  py.on("close", code => {
    if (code !== 0 || !csv.trim()) return res.status(500).json({ error: err || "Failed" });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="herbayur_raw_dataset.csv"');
    res.send(csv);
  });
});

// GET /api/predictions/trend?supplierId=xxx — monthly demand history for trend chart
router.get("/trend", (req, res) => {
  if (!PYTHON_PATH) return res.status(503).json({ error: "Python is not installed or not in PATH on this server." });
  const { supplierId } = req.query;
  if (!supplierId) return res.status(400).json({ error: "supplierId required" });

  const script = `
import sys, os, json
sys.path.insert(0, r"${ML_DIR.replace(/\\/g, "\\\\")}")
import pandas as pd
from extract import extract_data
from aggregate import aggregate_monthly

raw     = extract_data()
monthly = aggregate_monthly(raw)

# Filter for this supplier
sup = monthly[monthly['supplier_id'] == '${supplierId}']

# Monthly total per material
result = []
for (mat, cat, cond, parts), grp in sup.groupby(['material_name','category','condition','parts']):
    label = mat if cat in ('', None) else f"{mat} ({cat})"
    rows  = grp.sort_values('month')[['month','total_quantity']].tail(13)
    result.append({
        'label': label,
        'material': mat,
        'category': cat,
        'condition': cond,
        'parts': parts,
        'data': [{'month': r['month'], 'qty': round(float(r['total_quantity']),2)} for _, r in rows.iterrows()]
    })

print(json.dumps(result))
`;

  const py = spawn(PYTHON_PATH, ["-W", "ignore", "-c", script], { cwd: ML_DIR });
  let out = "", err = "";
  py.stdout.on("data", d => { out += d.toString(); });
  py.stderr.on("data", d => { err += d.toString(); });
  py.on("close", code => {
    if (code !== 0) return res.status(500).json({ error: err });
    try { res.json(JSON.parse(out)); }
    catch { res.status(500).json({ error: "Parse error", raw: out }); }
  });
});

router.post("/run", (req, res) => {
  if (!PYTHON_PATH) return res.status(503).json({ error: "Python is not installed or not in PATH on this server." });
  exec(`${PYTHON} "${PIPELINE}"`, { timeout: 180000 }, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: stderr || err.message });
    res.json({ success: true, output: stdout });
  });
});

module.exports = router;
