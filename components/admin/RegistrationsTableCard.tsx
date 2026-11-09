import React, { useState } from "react";
import { Search, Loader2, FileText, FileSpreadsheet, Download, Layers, UserX } from "lucide-react";
import { PaginationBar } from "@/components/common/PaginationBar";
import { exportToCsv, exportToXlsx, exportToPdf, downloadIdpCohortsXlsx } from "@/lib/export";
import { cleanErrorMessage } from "@/lib/error-utils";

interface RegistrationsTableCardProps {
  registrations: any[];
  registrationTotal: number;
  registrationSearch: string;
  setRegistrationSearch: (v: string) => void;
  registrationPage: number;
  registrationTotalPages: number;
  loadingRegistrations: boolean;
  onFetchRegistrations: (page: number, search?: string) => void;
  onDownloadCohorts?: () => void;
  onReassignClick?: (registration: any) => void;
  onUnmapClick?: (registration: any) => void;
}

export function RegistrationsTableCard({
  registrations,
  registrationTotal,
  registrationSearch,
  setRegistrationSearch,
  registrationPage,
  registrationTotalPages,
  loadingRegistrations,
  onFetchRegistrations,
  onDownloadCohorts,
  onReassignClick,
  onUnmapClick,
}: RegistrationsTableCardProps) {
  const [downloadingCohorts, setDownloadingCohorts] = useState(false);
  const [exportingType, setExportingType] = useState<"csv" | "xlsx" | "pdf" | null>(null);

  const fetchAllRegistrationsForExport = async (): Promise<any[]> => {
    if (registrationTotal === 0) return [];
    if (registrationTotal <= registrations.length && registrations.length > 0) {
      return registrations;
    }

    const params = new URLSearchParams({
      export: "true",
      search: registrationSearch || "",
    });

    const res = await fetch(`/api/admin/registrations?${params.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to fetch registrations for export.");
    }
    const data = await res.json();
    return data.registrations || [];
  };

  const formatRegistrationRows = (data: any[]) =>
    data.map((r, idx) => ({
      "Sr. No": idx + 1,
      Timestamp: r.timestamp,
      Enrollment: r.enrollment,
      "Student Name": r.studentName,
      Department: r.department,
      "Project Code": r.projectCode,
      "Faculty Mentor": r.facultyName,
      Status: r.status,
      Theme: r.theme,
    }));

  const handleDownloadFullCohorts = async () => {
    if (onDownloadCohorts) {
      onDownloadCohorts();
      return;
    }
    try {
      setDownloadingCohorts(true);
      await downloadIdpCohortsXlsx("registered");
    } catch (err: any) {
      alert(cleanErrorMessage(err, "Failed to export cohort details."));
    } finally {
      setDownloadingCohorts(false);
    }
  };

  const handleExportCsv = async () => {
    if (exportingType) return;
    setExportingType("csv");
    try {
      const exportData = await fetchAllRegistrationsForExport();
      if (!exportData || exportData.length === 0) {
        alert("No registrations found to export.");
        return;
      }
      await exportToCsv(
        formatRegistrationRows(exportData),
        `GDGU_Admin_Registrations_${registrationSearch ? "Filtered" : "All"}`
      );
    } catch (err: any) {
      alert(cleanErrorMessage(err, "Failed to export registrations CSV."));
    } finally {
      setExportingType(null);
    }
  };

  const handleExportXlsx = async () => {
    if (exportingType) return;
    setExportingType("xlsx");
    try {
      const exportData = await fetchAllRegistrationsForExport();
      if (!exportData || exportData.length === 0) {
        alert("No registrations found to export.");
        return;
      }
      await exportToXlsx(
        formatRegistrationRows(exportData),
        `GDGU_Admin_Registrations_${registrationSearch ? "Filtered" : "All"}`,
        "Registrations"
      );
    } catch (err: any) {
      alert(cleanErrorMessage(err, "Failed to export registrations Excel."));
    } finally {
      setExportingType(null);
    }
  };

  const handleExportPdf = async () => {
    if (exportingType) return;
    setExportingType("pdf");
    try {
      const exportData = await fetchAllRegistrationsForExport();
      if (!exportData || exportData.length === 0) {
        alert("No registrations found to export.");
        return;
      }
      exportToPdf(
        formatRegistrationRows(exportData),
        `GDGU Project Registrations Master Report (${registrationSearch ? "Filter: " + registrationSearch : "All Records"})`
      );
    } catch (err: any) {
      alert(cleanErrorMessage(err, "Failed to export registrations PDF."));
    } finally {
      setExportingType(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative">
      <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h2 className="text-base sm:text-lg font-bold text-[#0d2137]">
          Registrations ({registrationTotal})
        </h2>

        {/* Search & Export */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search enrollment or student..."
              aria-label="Search registrations by enrollment or student"
              value={registrationSearch}
              onChange={(e) => {
                setRegistrationSearch(e.target.value);
                onFetchRegistrations(1, e.target.value);
              }}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#0d2137] w-48 sm:w-64"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <div className="flex items-center gap-1.5 border-l pl-2 border-slate-200">
            <button
              type="button"
              onClick={handleDownloadFullCohorts}
              disabled={downloadingCohorts || exportingType !== null}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm transition-all ${
                downloadingCohorts || exportingType !== null ? "opacity-60 cursor-not-allowed" : ""
              }`}
              title="Download entire student cohort database in official IDP Cohorts Details (.xlsx) format"
            >
              {downloadingCohorts ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-3 h-3" />
              )}
              <span>Cohort Details (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={handleExportXlsx}
              disabled={exportingType !== null || downloadingCohorts}
              className={`px-2 py-1 text-[11px] font-semibold rounded border border-slate-200 text-slate-700 flex items-center gap-1 transition-colors ${
                exportingType !== null || downloadingCohorts ? "opacity-60 cursor-not-allowed" : "hover:bg-slate-50"
              }`}
              title="Export Registrations Excel (.xlsx)"
            >
              {exportingType === "xlsx" ? (
                <Loader2 className="w-3 h-3 text-green-600 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-3 h-3 text-green-600" />
              )}
              <span>{exportingType === "xlsx" ? "Exporting..." : "Excel"}</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={exportingType !== null || downloadingCohorts}
              className={`px-2 py-1 text-[11px] font-semibold rounded border border-slate-200 text-slate-700 flex items-center gap-1 transition-colors ${
                exportingType !== null || downloadingCohorts ? "opacity-60 cursor-not-allowed" : "hover:bg-slate-50"
              }`}
              title="Export Current View CSV"
            >
              {exportingType === "csv" ? (
                <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
              ) : (
                <FileText className="w-3 h-3 text-blue-600" />
              )}
              <span>{exportingType === "csv" ? "Exporting..." : "CSV"}</span>
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={exportingType !== null || downloadingCohorts}
              className={`px-2 py-1 text-[11px] font-semibold rounded border border-slate-200 text-slate-700 flex items-center gap-1 transition-colors ${
                exportingType !== null || downloadingCohorts ? "opacity-60 cursor-not-allowed" : "hover:bg-slate-50"
              }`}
              title="Print / Save PDF"
            >
              {exportingType === "pdf" ? (
                <Loader2 className="w-3 h-3 text-red-600 animate-spin" />
              ) : (
                <Download className="w-3 h-3 text-red-600" />
              )}
              <span>{exportingType === "pdf" ? "Exporting..." : "PDF"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#0d2137] text-white">
              <th className="py-2.5 px-3 font-semibold">TIMESTAMP</th>
              <th className="py-2.5 px-3 font-semibold">ENROLLMENT</th>
              <th className="py-2.5 px-3 font-semibold">STUDENT</th>
              <th className="py-2.5 px-3 font-semibold">DEPARTMENT</th>
              <th className="py-2.5 px-3 font-semibold">PROJECT</th>
              <th className="py-2.5 px-3 font-semibold">FACULTY</th>
              <th className="py-2.5 px-3 font-semibold">STATUS</th>
              <th className="py-2.5 px-3 font-semibold">THEME</th>
              {(onReassignClick || onUnmapClick) && (
                <th className="py-2.5 px-3 font-semibold text-center">ACTIONS</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loadingRegistrations ? (
              <tr>
                <td colSpan={onReassignClick || onUnmapClick ? 9 : 8} className="py-8 text-center text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#0d2137]" />
                </td>
              </tr>
            ) : registrations.length === 0 ? (
              <tr>
                <td colSpan={onReassignClick || onUnmapClick ? 9 : 8} className="py-6 text-center text-slate-400">
                  No registrations found.
                </td>
              </tr>
            ) : (
              registrations.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">
                    {r.timestamp}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-800">{r.enrollment}</td>
                  <td className="py-3 px-3 font-medium text-[#0d2137]">{r.studentName}</td>
                  <td className="py-3 px-3 text-slate-600">{r.department}</td>
                  <td className="py-3 px-3 font-mono font-bold text-[#0d2137]">{r.projectCode}</td>
                  <td className="py-3 px-3 text-slate-700">{r.facultyName}</td>
                  <td className="py-3 px-3">
                    <span className="bg-[#dcfce7] text-[#15803d] px-2 py-0.5 rounded text-[11px] font-bold">
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{r.theme}</td>
                  {(onReassignClick || onUnmapClick) && (
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {onReassignClick && (
                          <button
                            type="button"
                            onClick={() =>
                              onReassignClick({
                                id: r.studentId,
                                studentId: r.studentId,
                                enrollment: r.enrollment,
                                name: r.studentName,
                                department: r.department,
                                projectCode: r.projectCode,
                                projectId: r.projectId,
                                registered: true,
                                registrationId: r.id,
                                facultyName: r.facultyName,
                              })
                            }
                            className="p-1.5 rounded-lg text-slate-700 hover:text-[#0d2137] hover:bg-slate-200 transition-colors"
                            title="Reassign Project Guide"
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onUnmapClick && (
                          <button
                            type="button"
                            onClick={() =>
                              onUnmapClick({
                                id: r.studentId,
                                studentId: r.studentId,
                                enrollment: r.enrollment,
                                name: r.studentName,
                                projectCode: r.projectCode,
                                registrationId: r.id,
                                facultyName: r.facultyName,
                              })
                            }
                            className="p-1.5 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50 transition-colors"
                            title="Unmap / Free Allocation"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PaginationBar
        page={registrationPage}
        totalPages={registrationTotalPages}
        totalItems={registrationTotal}
        disabled={loadingRegistrations}
        onPageChange={(newPage) => onFetchRegistrations(newPage, registrationSearch)}
      />
    </div>
  );
}
