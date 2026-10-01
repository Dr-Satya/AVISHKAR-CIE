import React, { useState } from "react";
import { CheckCircle2, AlertCircle, Loader2, FileUp, X } from "lucide-react";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultYear: string;
  onSuccess: () => Promise<void> | void;
}

export function BulkImportModal({
  isOpen,
  onClose,
  defaultYear,
  onSuccess,
}: BulkImportModalProps) {
  const [importType, setImportType] = useState<"STUDENTS" | "FACULTY" | "SPOC" | "PROJECTS">("STUDENTS");
  const [importYear, setImportYear] = useState(defaultYear);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setImportFile(null);
    setImportResult(null);
    setImportError(null);
    onClose();
  };

  const handleImportXlsx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      setImportError("Please select a valid .xlsx file.");
      return;
    }
    setImportLoading(true);
    setImportError(null);
    setImportResult(null);
    try {
      const fd = new FormData();
      fd.append("file", importFile);
      fd.append("type", importType);
      fd.append("academicYear", importYear);

      const res = await fetch("/api/admin/bulk-registration", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setImportError(data.error || "Import failed.");
        setImportLoading(false);
        return;
      }
      setImportResult(data.summary);
      setImportFile(null);
      await onSuccess();
    } catch (err: any) {
      setImportError(err.message || "Import encountered an error.");
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-[#0d2137]">
              Direct XLSX Data Ingestion
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload formatted spreadsheet to directly insert or update database records.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {importError && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{importError}</span>
          </div>
        )}

        {importResult && (
          <div className="mt-4 p-4 bg-emerald-50 text-emerald-900 text-xs rounded-xl border border-emerald-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Spreadsheet Processed Successfully</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
              <div className="bg-white p-2 rounded border border-emerald-200 text-center">
                <div className="text-[10px] text-slate-500">TOTAL</div>
                <div className="text-sm font-bold text-slate-800">{importResult.total}</div>
              </div>
              <div className="bg-white p-2 rounded border border-emerald-200 text-center">
                <div className="text-[10px] text-emerald-600">INSERTED</div>
                <div className="text-sm font-bold text-emerald-700">{importResult.inserted}</div>
              </div>
              <div className="bg-white p-2 rounded border border-emerald-200 text-center">
                <div className="text-[10px] text-amber-600">SKIPPED</div>
                <div className="text-sm font-bold text-amber-700">{importResult.skipped}</div>
              </div>
            </div>
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="mt-2 text-[11px] text-amber-800 font-sans">
                Notice: {importResult.errors.slice(0, 3).join(", ")}
                {importResult.errors.length > 3 ? "..." : ""}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleImportXlsx} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Data Entity
            </label>
            <select
              value={importType}
              onChange={(e: any) => setImportType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0d2137] bg-white"
            >
              <option value="STUDENTS">Students Master List</option>
              <option value="FACULTY">Faculty &amp; Mentor List</option>
              <option value="SPOC">Department SPOC List</option>
              <option value="PROJECTS">Projects Master List</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Academic Year Tag
            </label>
            <input
              type="text"
              value={importYear}
              onChange={(e) => setImportYear(e.target.value.trim())}
              placeholder="e.g. 2025-2026"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-[#0d2137] focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Records will be indexed under this academic year.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Choose .xlsx Spreadsheet File
            </label>
            <input
              type="file"
              accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={importLoading || !importFile}
              className="px-5 py-2 rounded-xl bg-[#0d2137] text-white text-xs font-semibold hover:bg-[#163456] transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            >
              {importLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Ingesting Spreadsheet...</span>
                </>
              ) : (
                <>
                  <FileUp className="w-3.5 h-3.5" />
                  <span>Upload &amp; Populate D1</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
