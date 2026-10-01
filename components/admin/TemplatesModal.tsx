import React from "react";
import { FileSpreadsheet, Download, X } from "lucide-react";

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TemplatesModal({ isOpen, onClose }: TemplatesModalProps) {
  if (!isOpen) return null;

  const templates = [
    {
      title: "IDP Cohort Details Template (.xlsx)",
      description:
        "Official format of 'IDP Cohorts Details_5Sep-2026.xlsx': Faculty Name, School, Email ID, Contact No., Projet Title, Category, Theme, Description, Project ID, Enrollment, Student Name.",
      downloadUrl: "/api/export?type=TEMPLATE_COHORTS",
      filename: "TEMPLATE_IDP_Cohorts_Details.xlsx",
    },
    {
      title: "CHC Service Report Template (.xlsx)",
      description:
        "Official format of 'CHC_Service_Report(38) (1).xlsx': Workflow attributes, Department, Official Email, Phone, Project Title, Project Code, Category, SDG Mapping, Theme, Project Description.",
      downloadUrl: "/api/export?type=TEMPLATE_PROJECTS",
      filename: "TEMPLATE_CHC_Service_Report.xlsx",
    },
    {
      title: "Student Master Mapping Template (.xlsx)",
      description:
        "Official format of 'IDP Mapping Format (Mohit Maan)': S.No., Enrolment No., Admission No., Name , Department, Programme Name, Batch, Course Code, Course Name, Faculty Mentor Details.",
      downloadUrl: "/api/export?type=TEMPLATE_STUDENTS",
      filename: "TEMPLATE_IDP_Mapping_Format_Students.xlsx",
    },
    {
      title: "Faculty Directory Template (.xlsx)",
      description:
        "Columns: Faculty Name, Email ID, School / Department, Contact No. Pre-populated with verified GDGU schools.",
      downloadUrl: "/api/export?type=TEMPLATE_FACULTY",
      filename: "TEMPLATE_GDGU_Faculty.xlsx",
    },
    {
      title: "SPOC Assignment Template (.xlsx)",
      description:
        "Columns: Faculty Name, Official Email, Department, Contact No. Assigns single point of contact roles across university schools.",
      downloadUrl: "/api/export?type=TEMPLATE_SPOC",
      filename: "TEMPLATE_GDGU_SPOC.xlsx",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl relative">
        <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-[#0d2137]">
              Official Bulk Upload Templates (.xlsx)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pre-configured Excel templates with valid column headers for direct database ingestion.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {templates.map((tpl, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2 font-bold text-[#0d2137] text-sm">
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  <span>{tpl.title}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {tpl.description}
                </p>
              </div>
              <a
                href={tpl.downloadUrl}
                download={tpl.filename}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0d2137] text-white text-xs font-semibold hover:bg-[#163456] transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .xlsx</span>
              </a>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
