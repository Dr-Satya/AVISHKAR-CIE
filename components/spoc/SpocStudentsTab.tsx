"use client";

import React, { useState, useRef } from "react";
import {
  FileText,
  FileSpreadsheet,
  Download,
  UploadCloud,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import * as XLSX from "xlsx";
import { StudentRecord } from "@/types/spoc";
import { exportToXlsx, exportToCsv } from "@/lib/export";

interface SpocStudentsTabProps {
  studentList: StudentRecord[];
  department: string;
  onExport: (format: "csv" | "xlsx" | "pdf") => void;
  onRefresh?: () => void;
}

export function SpocStudentsTab({
  studentList,
  department,
  onExport,
  onRefresh,
}: SpocStudentsTabProps) {
  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [editAttendance, setEditAttendance] = useState("");
  const [editInternals, setEditInternals] = useState("");
  const [editExternals, setEditExternals] = useState("");

  // Upload parsed state
  const [parsedRows, setParsedRows] = useState<
    Array<{
      enrollmentNumber: string;
      name?: string;
      attendancePercent?: number;
      internalMarks?: number;
      externalMarks?: number;
    }>
  >([]);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Template generator for SPOC
  const handleDownloadTemplate = (format: "xlsx" | "csv") => {
    const templateData = studentList.map((std) => ({
      "Enrollment Number": std.enrollmentNumber,
      "Student Name": std.name,
      "Programme": std.programme || "N/A",
      "Attendance (%)": std.attendancePercent ?? 85,
      "Internal Marks (/40)": std.internalMarks ?? 32,
      "External Marks (/60)": std.externalMarks ?? 48,
    }));

    const filename = `${department.replace(/[^a-zA-Z0-9]/g, "_")}_Marks_Attendance_Template`;
    if (format === "xlsx") {
      exportToXlsx(templateData, filename, "Assessment");
    } else {
      exportToCsv(templateData, filename);
    }
  };

  // Handle spreadsheet file upload & parsing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rawJson || rawJson.length === 0) {
          setStatusMessage({ type: "error", text: "The selected sheet contains no data." });
          setParsedRows([]);
          return;
        }

        // Map column headers flexibly
        const rows = rawJson.map((r) => {
          const enrollment =
            r["Enrollment Number"] ||
            r["Enrollment"] ||
            r["enrollmentNumber"] ||
            r["Roll No"] ||
            r["RollNo"] ||
            r["Enrollment_No"] ||
            "";

          const attRaw =
            r["Attendance (%)"] ??
            r["Attendance"] ??
            r["Attendance%"] ??
            r["attendancePercent"] ??
            r["attendance"];

          const intRaw =
            r["Internal Marks (/40)"] ??
            r["Internal Marks"] ??
            r["Internals"] ??
            r["Internal"] ??
            r["internalMarks"];

          const extRaw =
            r["External Marks (/60)"] ??
            r["External Marks"] ??
            r["Externals"] ??
            r["External"] ??
            r["externalMarks"];

          return {
            enrollmentNumber: String(enrollment).trim(),
            name: r["Student Name"] || r["Name"] || "",
            attendancePercent:
              attRaw !== undefined && attRaw !== null && attRaw !== ""
                ? Number(attRaw)
                : undefined,
            internalMarks:
              intRaw !== undefined && intRaw !== null && intRaw !== ""
                ? Number(intRaw)
                : undefined,
            externalMarks:
              extRaw !== undefined && extRaw !== null && extRaw !== ""
                ? Number(extRaw)
                : undefined,
          };
        }).filter((r) => r.enrollmentNumber.length > 0);

        if (rows.length === 0) {
          setStatusMessage({
            type: "error",
            text: "No valid rows found. Ensure 'Enrollment Number' column exists.",
          });
          setParsedRows([]);
          return;
        }

        setParsedRows(rows);
        setStatusMessage({
          type: "success",
          text: `Parsed ${rows.length} student record(s) successfully. Ready to submit.`,
        });
      } catch (err) {
        setStatusMessage({
          type: "error",
          text: "Failed to read file. Please ensure it is a valid Excel or CSV file.",
        });
      }
    };

    reader.readAsBinaryString(file);
  };

  // Submit bulk marks
  const handleSubmitBulkMarks = async () => {
    if (parsedRows.length === 0) return;

    setUploadLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/spoc/department", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "BULK_UPDATE_MARKS",
          updates: parsedRows,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({
          type: "error",
          text: data.error || "Failed to update assessment records.",
        });
        return;
      }

      setStatusMessage({
        type: "success",
        text: data.message || "Attendance & marks updated successfully!",
      });

      if (onRefresh) onRefresh();

      setTimeout(() => {
        setShowUploadModal(false);
        setParsedRows([]);
        setUploadFileName(null);
        setStatusMessage(null);
      }, 1500);
    } catch {
      setStatusMessage({ type: "error", text: "Network error during upload." });
    } finally {
      setUploadLoading(false);
    }
  };

  // Quick edit single student
  const handleOpenEdit = (std: StudentRecord) => {
    setEditingStudent(std);
    setEditAttendance(std.attendancePercent !== null && std.attendancePercent !== undefined ? String(std.attendancePercent) : "85");
    setEditInternals(std.internalMarks !== null && std.internalMarks !== undefined ? String(std.internalMarks) : "32");
    setEditExternals(std.externalMarks !== null && std.externalMarks !== undefined ? String(std.externalMarks) : "48");
    setStatusMessage(null);
  };

  const handleSaveSingleEdit = async () => {
    if (!editingStudent) return;

    setUploadLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/spoc/department", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_STUDENT_MARKS",
          studentId: editingStudent.id,
          attendancePercent: Number(editAttendance),
          internalMarks: Number(editInternals),
          externalMarks: Number(editExternals),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({
          type: "error",
          text: data.error || "Failed to update student marks.",
        });
        return;
      }

      if (onRefresh) onRefresh();
      setEditingStudent(null);
    } catch {
      setStatusMessage({ type: "error", text: "Network error saving changes." });
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-[#0d2137]">
            Students Enrolled in {department} Projects ({studentList.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage student attendance, internals, externals, and mentored projects.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Upload Marks & Attendance Button */}
          <button
            type="button"
            onClick={() => {
              setShowUploadModal(true);
              setStatusMessage(null);
              setParsedRows([]);
              setUploadFileName(null);
            }}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[#0d2137] hover:bg-[#1a3a60] text-white flex items-center gap-1.5 shadow-sm transition-all"
          >
            <UploadCloud className="w-4 h-4 text-[#cda34f]" />
            <span>Upload Marks & Attendance</span>
          </button>

          {/* Export Buttons */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => onExport("csv")}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg hover:bg-white text-slate-700 flex items-center gap-1 transition-colors"
              title="Export as CSV"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => onExport("xlsx")}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg hover:bg-white text-slate-700 flex items-center gap-1 transition-colors"
              title="Export as Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
              <span>Excel</span>
            </button>
            <button
              onClick={() => onExport("pdf")}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg hover:bg-white text-slate-700 flex items-center gap-1 transition-colors"
              title="Export as PDF"
            >
              <Download className="w-3.5 h-3.5 text-red-600" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Students Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
              <th className="py-3 px-3">Enrollment No.</th>
              <th className="py-3 px-3">Student Name</th>
              <th className="py-3 px-3">Branch / Programme</th>
              <th className="py-3 px-2 text-center">Attendance (%)</th>
              <th className="py-3 px-2 text-center">Internals (/40)</th>
              <th className="py-3 px-2 text-center">Externals (/60)</th>
              <th className="py-3 px-3">Project ID & Title</th>
              <th className="py-3 px-3">Faculty Mentor</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {studentList.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">
                  No students currently enrolled in this department&apos;s projects.
                </td>
              </tr>
            ) : (
              studentList.map((std) => {
                const att = Number(std.attendancePercent ?? 100);
                const attIsGood = att >= 75;

                return (
                  <tr key={std.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#0d2137]">
                      {std.enrollmentNumber}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {std.name}
                      {std.phone && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          📱 +91 {std.phone}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{std.programme || "—"}</td>

                    {/* Attendance */}
                    <td className="py-3 px-2 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          attIsGood
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {att}%
                      </span>
                    </td>

                    {/* Internals */}
                    <td className="py-3 px-2 text-center font-mono font-bold text-slate-700">
                      {std.internalMarks ?? "—"}
                    </td>

                    {/* Externals */}
                    <td className="py-3 px-2 text-center font-mono font-bold text-slate-700">
                      {std.externalMarks ?? "—"}
                    </td>

                    {/* Project */}
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-[#0d2137] text-[11px]">
                        {std.projectId}
                      </div>
                      <div className="text-slate-600 truncate max-w-xs text-[11px]" title={std.projectTitle}>
                        {std.projectTitle}
                      </div>
                    </td>

                    {/* Mentor */}
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {std.facultyName}
                    </td>

                    {/* Quick Edit */}
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(std)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-100 text-[#0d2137] inline-flex items-center gap-1 transition-colors"
                        title="Edit marks and attendance"
                      >
                        <Edit2 className="w-3 h-3 text-[#cda34f]" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: BULK UPLOAD MARKS & ATTENDANCE */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d2137]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#cda34f]">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0d2137]">
                  Upload Attendance & Assessment Marks
                </h3>
                <p className="text-xs text-slate-500">
                  Update records for students enrolled in {department} projects.
                </p>
              </div>
            </div>

            {/* Template Download Option */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-800">Need the standard spreadsheet template?</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pre-filled with your department&apos;s current enrolled students and enrollment numbers.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate("xlsx")}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
                  <span>Excel Template</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate("csv")}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>CSV Template</span>
                </button>
              </div>
            </div>

            {/* File Upload Box */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Select Excel (.xlsx) or CSV File
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-[#cda34f] rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50"
              >
                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                  {uploadFileName ? uploadFileName : "Click or drag spreadsheet file to upload"}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supported columns: Enrollment Number, Attendance (%), Internal Marks, External Marks
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Status alerts */}
            {statusMessage && (
              <div
                className={`p-3.5 rounded-2xl mb-4 text-xs flex items-start gap-2.5 ${
                  statusMessage.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                {statusMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Parsed Preview Table */}
            {parsedRows.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-800">
                    Parsed Preview ({parsedRows.length} students)
                  </h4>
                  <span className="text-[11px] text-slate-500">Showing first 5 entries</span>
                </div>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <th className="py-2 px-3">Enrollment</th>
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-2 text-center">Attendance</th>
                        <th className="py-2 px-2 text-center">Internals</th>
                        <th className="py-2 px-2 text-center">Externals</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.slice(0, 5).map((row, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">
                            {row.enrollmentNumber}
                          </td>
                          <td className="py-2 px-3 text-slate-700">{row.name || "—"}</td>
                          <td className="py-2 px-2 text-center font-bold text-emerald-700">
                            {row.attendancePercent !== undefined ? `${row.attendancePercent}%` : "—"}
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-slate-800">
                            {row.internalMarks ?? "—"}
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-slate-800">
                            {row.externalMarks ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitBulkMarks}
                disabled={uploadLoading || parsedRows.length === 0}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-[#0d2137] hover:bg-[#1a3a60] text-white flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {uploadLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#cda34f]" />
                    <span>Save {parsedRows.length} Student Record(s)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: QUICK EDIT INDIVIDUAL STUDENT MARKS */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d2137]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setEditingStudent(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#cda34f]">
                <Edit2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0d2137]">Update Student Assessment</h3>
                <p className="text-xs text-slate-500 font-mono">{editingStudent.enrollmentNumber}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 mb-4 text-xs space-y-1">
              <div>
                <span className="text-slate-500 font-medium">Student: </span>
                <span className="font-bold text-[#0d2137]">{editingStudent.name}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Programme: </span>
                <span className="text-slate-700">{editingStudent.programme || "N/A"}</span>
              </div>
            </div>

            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Attendance Percentage (0 - 100%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editAttendance}
                  onChange={(e) => setEditAttendance(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Internal Marks (out of 40)
                </label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={editInternals}
                  onChange={(e) => setEditInternals(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  External Marks (out of 60)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={editExternals}
                  onChange={(e) => setEditExternals(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSingleEdit}
                disabled={uploadLoading}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-[#0d2137] hover:bg-[#1a3a60] text-white flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {uploadLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#cda34f]" />
                    <span>Save Assessment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
