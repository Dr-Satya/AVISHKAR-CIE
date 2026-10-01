import React from "react";
import { Search, Loader2, FileText, FileSpreadsheet, Download } from "lucide-react";
import { PaginationBar } from "@/components/common/PaginationBar";
import { exportToCsv, exportToXlsx, exportToPdf } from "@/lib/export";

interface RegistrationsTableCardProps {
  registrations: any[];
  registrationTotal: number;
  registrationSearch: string;
  setRegistrationSearch: (v: string) => void;
  registrationPage: number;
  registrationTotalPages: number;
  loadingRegistrations: boolean;
  onFetchRegistrations: (page: number, search?: string) => void;
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
}: RegistrationsTableCardProps) {
  const handleExportCsv = () => {
    const rows = registrations.map((r, idx) => ({
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
    exportToCsv(rows, "GDGU_Admin_Registrations");
  };

  const handleExportXlsx = () => {
    const rows = registrations.map((r, idx) => ({
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
    exportToXlsx(rows, "GDGU_Admin_Registrations", "Registrations");
  };

  const handleExportPdf = () => {
    const rows = registrations.map((r, idx) => ({
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
    exportToPdf(rows, "GDGU Project Registrations Master Report");
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

          <div className="flex items-center gap-1 border-l pl-2 border-slate-200">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-2 py-1 text-[11px] font-semibold rounded border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
              title="Export Registrations CSV"
            >
              <FileText className="w-3 h-3 text-blue-600" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportXlsx}
              className="px-2 py-1 text-[11px] font-semibold rounded border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
              title="Export Registrations Excel"
            >
              <FileSpreadsheet className="w-3 h-3 text-green-600" />
              <span>Excel</span>
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              className="px-2 py-1 text-[11px] font-semibold rounded border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
              title="Print / Save PDF"
            >
              <Download className="w-3 h-3 text-red-600" />
              <span>PDF</span>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loadingRegistrations ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#0d2137]" />
                </td>
              </tr>
            ) : registrations.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-slate-400">
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
