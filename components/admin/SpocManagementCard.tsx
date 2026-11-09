import React, { useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  KeyRound,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Check,
  Search,
  X,
  ShieldCheck,
  Building,
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
} from "lucide-react";
import { FacultyRecord, SpocFormData } from "@/types/admin";

interface SpocManagementCardProps {
  spocDepartments: string[];
  spocsByDept: Record<string, any[]>;
  faculties?: FacultyRecord[];
  spocUpdating: string | null;
  onSaveSpoc?: (data: {
    id?: string;
    department: string;
    name?: string;
    email: string;
    passcode?: string;
    action?: "CREATE" | "EDIT";
    facultyId?: string;
  }) => Promise<any>;
  onDeleteSpoc?: (dept: string, spocId?: string) => Promise<any>;
  onAssignSpoc?: (dept: string, facultyId: string) => void;
  onRevokeSpoc?: (dept: string, facultyId: string) => void;
  onResetSpocPasscode: (dept: string, spoc: any) => void;
}

export function canonicalDepartment(dept: string): string {
  if (!dept) return "";
  const trimmed = dept.trim();
  if (/^Cent(er|re)\s+of\s+Aerospace\s+and\s+Energy\s+Studies$/i.test(trimmed)) {
    return "Centre of Aerospace and Energy Studies";
  }
  return trimmed;
}

function getDeptSlug(dept: string): string {
  const map: Record<string, string> = {
    "School of Engineering & Sciences": "engineering",
    "School of Law": "law",
    "School of Management": "management",
    "School of Agricultural Sciences": "agri",
    "School of Healthcare and Allied Sciences": "health",
    "School of Hospitality & Tourism": "hospitality",
    "School of Liberal Arts": "liberalarts",
    "United World Institute of Design (UID)": "design",
    "Center of Aerospace and Energy Studies": "aerospace",
    "Centre of Aerospace and Energy Studies": "aerospace",
    "Centre Of Excellence: Occupational Health, Safety, Fire & Environment": "safety",
  };
  return map[dept] || dept.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);
}

export function SpocManagementCard({
  spocDepartments,
  spocsByDept,
  faculties = [],
  spocUpdating,
  onSaveSpoc,
  onDeleteSpoc,
  onAssignSpoc,
  onRevokeSpoc,
  onResetSpocPasscode,
}: SpocManagementCardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Canonicalize department list to eliminate duplicate spelling variants
  const canonicalDepts = Array.from(
    new Set(spocDepartments.map(canonicalDepartment))
  ).sort();

  // Modal Form State
  const [formData, setFormData] = useState<SpocFormData>({
    id: "",
    department: canonicalDepts[0] || "School of Engineering & Sciences",
    name: "",
    email: "",
    passcode: "spoc@gdgu2026",
    facultyId: undefined,
  });

  // Inline Quick Add State
  const [inlineDept, setInlineDept] = useState<string | null>(null);
  const [inlineEmail, setInlineEmail] = useState("");
  const [inlinePasscode, setInlinePasscode] = useState("spoc@gdgu2026");
  const [inlineName, setInlineName] = useState("");
  const [inlineError, setInlineError] = useState<string | null>(null);

  const handleCopyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getExistingSpocsForDept = (dept: string): any[] => {
    const canon = canonicalDepartment(dept);
    const list: any[] = [];
    Object.entries(spocsByDept).forEach(([d, spocs]) => {
      if (canonicalDepartment(d) === canon && Array.isArray(spocs)) {
        list.push(...spocs);
      }
    });
    // Deduplicate by id
    const seen = new Set<string>();
    return list.filter((s) => {
      if (!s.id || seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  };

  const openCreateModal = (preselectedDept?: string) => {
    const dept = canonicalDepartment(preselectedDept || canonicalDepts[0] || "School of Engineering & Sciences");
    const slug = getDeptSlug(dept);
    const existing = getExistingSpocsForDept(dept);
    const existingEmails = new Set(existing.map((s) => (s.email || "").toLowerCase()));

    let defaultEmail = `spoc.${slug}@gdgu.org`;
    if (existingEmails.has(defaultEmail)) {
      let counter = 2;
      while (existingEmails.has(`spoc.${slug}${counter}@gdgu.org`)) {
        counter++;
      }
      defaultEmail = `spoc.${slug}${counter}@gdgu.org`;
    }

    const defaultName = existing.length > 0 
      ? `${dept} SPOC ${existing.length + 1}` 
      : `${dept} Coordinator`;

    setModalMode("CREATE");
    setFormData({
      id: "",
      department: dept,
      name: defaultName,
      email: defaultEmail,
      passcode: `spoc@${slug}2026`,
      facultyId: undefined,
    });
    setFormError(null);
    setShowPassword(false);
    setShowModal(true);
  };

  const openEditModal = (spoc: any, dept: string) => {
    const canonDept = canonicalDepartment(dept);
    setModalMode("EDIT");
    setFormData({
      id: spoc.id,
      department: canonDept,
      name: spoc.facultyName && spoc.facultyName !== "N/A" ? spoc.facultyName : spoc.name,
      email: spoc.email || spoc.spocEmail || "",
      passcode: "", // Leave blank to preserve password
      facultyId: spoc.facultyId || undefined,
    });
    setFormError(null);
    setShowPassword(false);
    setShowModal(true);
  };

  const handleDeptSelectInModal = (dept: string) => {
    const canonDept = canonicalDepartment(dept);
    const slug = getDeptSlug(canonDept);
    const existing = getExistingSpocsForDept(canonDept);
    const existingEmails = new Set(existing.map((s) => (s.email || "").toLowerCase()));

    let defaultEmail = `spoc.${slug}@gdgu.org`;
    if (existingEmails.has(defaultEmail)) {
      let counter = 2;
      while (existingEmails.has(`spoc.${slug}${counter}@gdgu.org`)) {
        counter++;
      }
      defaultEmail = `spoc.${slug}${counter}@gdgu.org`;
    }

    setFormData((prev) => ({
      ...prev,
      department: canonDept,
      name:
        modalMode === "CREATE"
          ? existing.length > 0
            ? `${canonDept} SPOC ${existing.length + 1}`
            : `${canonDept} Coordinator`
          : prev.name,
      email: modalMode === "CREATE" ? defaultEmail : prev.email,
      passcode: modalMode === "CREATE" ? `spoc@${slug}2026` : prev.passcode,
      facultyId: undefined,
    }));
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.department) {
      setFormError("Please select a school or department.");
      return;
    }
    if (!formData.email || !formData.email.includes("@")) {
      setFormError("Please enter a valid email address.");
      return;
    }
    if (modalMode === "CREATE" && (!formData.passcode || formData.passcode.length < 6)) {
      setFormError("Passcode must be at least 6 characters long.");
      return;
    }
    if (modalMode === "EDIT" && formData.passcode && formData.passcode.length < 6) {
      setFormError("New passcode must be at least 6 characters long.");
      return;
    }

    setFormSubmitting(true);
    try {
      if (onSaveSpoc) {
        await onSaveSpoc({
          id: formData.id,
          department: formData.department,
          name: formData.name,
          email: formData.email,
          passcode: formData.passcode,
          action: modalMode,
          facultyId: formData.facultyId,
        });
        setShowModal(false);
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to save SPOC.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleInlineSubmit = async (dept: string) => {
    setInlineError(null);
    if (!inlineEmail || !inlineEmail.includes("@")) {
      setInlineError("Please enter a valid email address.");
      return;
    }
    if (!inlinePasscode || inlinePasscode.length < 6) {
      setInlineError("Passcode must be at least 6 characters.");
      return;
    }

    try {
      if (onSaveSpoc) {
        await onSaveSpoc({
          department: dept,
          name: inlineName || `${dept} Coordinator`,
          email: inlineEmail,
          passcode: inlinePasscode,
          action: "CREATE",
        });
        setInlineDept(null);
        setInlineEmail("");
        setInlinePasscode("spoc@gdgu2026");
        setInlineName("");
      }
    } catch (err: any) {
      setInlineError(err.message || "Failed to create SPOC.");
    }
  };

  const handleDelete = async (dept: string, spocId?: string, spocName?: string) => {
    const label = spocName ? `"${spocName}" for "${dept}"` : `this SPOC for "${dept}"`;
    if (!confirm(`Are you sure you want to remove the SPOC profile for ${label}? Their SPOC portal access will be immediately revoked.`)) {
      return;
    }
    if (onDeleteSpoc) {
      await onDeleteSpoc(dept, spocId);
    } else if (onRevokeSpoc) {
      onRevokeSpoc(dept, spocId || "");
    }
  };

  // Filter departments by search query
  const filteredDepartments = canonicalDepts.filter((dept) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const currentSpocs = getExistingSpocsForDept(dept);
    const matchesDept = dept.toLowerCase().includes(q);
    const matchesSpoc = currentSpocs.some(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.facultyName?.toLowerCase().includes(q)
    );
    return matchesDept || matchesSpoc;
  });

  const totalConfigured = canonicalDepts.filter(
    (dept) => getExistingSpocsForDept(dept).length > 0
  ).length;

  const currentModalDeptSpocs = getExistingSpocsForDept(formData.department);

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative">
      <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />

      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-[#0d2137]">
              Department SPOC (Single Point of Contact) Management
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#0d2137]/10 text-[#0d2137] border border-[#0d2137]/15">
              {totalConfigured} / {canonicalDepts.length} Schools Configured
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure dedicated SPOCs for each school. You can assign <strong className="text-slate-700">multiple SPOCs per school</strong>, edit credentials, or reset passcodes at any time.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search school or SPOC..."
              className="text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0d2137]/20 w-44 sm:w-56"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => openCreateModal()}
            className="tactile-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0d2137] hover:bg-[#1a3a60] text-white text-xs font-bold shadow-sm transition-all"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#cda34f]" />
            <span>Add / Configure SPOC</span>
          </button>
        </div>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDepartments.map((dept) => {
          const currentSpocs = getExistingSpocsForDept(dept);
          const hasSpoc = currentSpocs.length > 0;
          const isInlineOpen = inlineDept === dept;
          const isUpdating = spocUpdating === dept;

          return (
            <div
              key={dept}
              className={`rounded-2xl p-4.5 border transition-all flex flex-col justify-between gap-3 text-xs ${
                hasSpoc
                  ? "bg-white border-slate-200 shadow-sm hover:border-slate-300"
                  : "bg-slate-50/70 border-dashed border-slate-300"
              }`}
            >
              <div>
                {/* School Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Building className="w-3.5 h-3.5 text-[#cda34f] flex-shrink-0" />
                    <span
                      className="font-bold text-[#0d2137] text-xs line-clamp-1"
                      title={dept}
                    >
                      {dept}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {hasSpoc && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                        {currentSpocs.length} {currentSpocs.length === 1 ? "SPOC" : "SPOCs"}
                      </span>
                    )}
                    <Link
                      href="/spoc/portal"
                      className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-0.5 flex-shrink-0 ml-1"
                      title="Open SPOC Portal"
                    >
                      <span>Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* SPOC Profile Content */}
                {hasSpoc ? (
                  <div className="space-y-2 mt-2">
                    {currentSpocs.map((s) => (
                      <div
                        key={s.id}
                        className="bg-slate-50/90 rounded-xl p-3 border border-slate-200/80 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
                            <span className="font-bold text-slate-900 truncate">
                              {s.facultyName && s.facultyName !== "N/A"
                                ? s.facultyName
                                : s.name || `${dept} SPOC`}
                            </span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/60 uppercase">
                            Active
                          </span>
                        </div>

                        {/* SPOC Login ID with Copy */}
                        <div className="flex items-center justify-between gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className="font-mono text-[11px] font-bold text-[#0d2137] truncate select-all">
                              {s.email}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyEmail(s.email, s.id)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0"
                            title="Copy Login Email"
                          >
                            {copiedId === s.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Actions Toolbar */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                          <div className="flex items-center gap-2">
                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => openEditModal(s, dept)}
                              disabled={isUpdating}
                              className="font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                              title="Edit SPOC details"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>

                            {/* Password Button */}
                            <button
                              type="button"
                              onClick={() => onResetSpocPasscode(dept, s)}
                              disabled={isUpdating}
                              className="font-semibold text-amber-700 hover:text-amber-800 hover:underline flex items-center gap-1"
                              title="Change or reset password"
                            >
                              <KeyRound className="w-3 h-3 text-[#cda34f]" />
                              <span>Password</span>
                            </button>
                          </div>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDelete(dept, s.id, s.name)}
                            disabled={isUpdating}
                            className="font-semibold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
                            title="Delete SPOC credentials"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Button to add another SPOC to this school */}
                    <button
                      type="button"
                      onClick={() => openCreateModal(dept)}
                      className="tactile-btn w-full mt-1 py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#0d2137] border border-slate-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Plus className="w-3 h-3 text-[#cda34f]" />
                      <span>Add Another SPOC</span>
                    </button>
                  </div>
                ) : isInlineOpen ? (
                  /* Inline Quick Entry Form */
                  <div className="mt-2 p-3 bg-white rounded-xl border border-[#cda34f]/50 space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0d2137] text-[11px]">
                        Quick Configure SPOC
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setInlineDept(null);
                          setInlineError(null);
                        }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {inlineError && (
                      <div className="p-1.5 rounded bg-red-50 text-red-700 text-[10px]">
                        {inlineError}
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Coordinator Name
                      </label>
                      <input
                        type="text"
                        value={inlineName}
                        onChange={(e) => setInlineName(e.target.value)}
                        placeholder={`${dept} Coordinator`}
                        className="w-full px-2.5 py-1 text-[11px] rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0d2137]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Login Email *
                      </label>
                      <input
                        type="email"
                        value={inlineEmail}
                        onChange={(e) => setInlineEmail(e.target.value)}
                        placeholder={`spoc.${getDeptSlug(dept)}@gdgu.org`}
                        className="w-full px-2.5 py-1 text-[11px] font-mono rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0d2137]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Password *
                      </label>
                      <input
                        type="text"
                        value={inlinePasscode}
                        onChange={(e) => setInlinePasscode(e.target.value)}
                        placeholder="spoc@gdgu2026"
                        className="w-full px-2.5 py-1 text-[11px] font-mono rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0d2137]"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleInlineSubmit(dept)}
                        disabled={isUpdating}
                        className="flex-1 py-1.5 rounded-lg bg-[#0d2137] hover:bg-[#1a3a60] text-white text-[11px] font-bold shadow-sm transition-all"
                      >
                        {isUpdating ? "Saving..." : "Save & Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setInlineDept(null);
                          setInlineError(null);
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-[11px] font-medium hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Empty State Card */
                  <div className="mt-2 p-3 bg-white/60 rounded-xl border border-dashed border-slate-200 text-center space-y-2">
                    <span className="text-slate-400 italic text-xs block">
                      No SPOC assigned
                    </span>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const slug = getDeptSlug(dept);
                          setInlineDept(dept);
                          setInlineName(`${dept} Coordinator`);
                          setInlineEmail(`spoc.${slug}@gdgu.org`);
                          setInlinePasscode(`spoc@${slug}2026`);
                          setInlineError(null);
                        }}
                        className="tactile-btn inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0d2137]/5 hover:bg-[#0d2137]/10 text-[#0d2137] border border-[#0d2137]/15 text-[11px] font-bold transition-all"
                      >
                        <Plus className="w-3 h-3 text-[#cda34f]" />
                        <span>Quick Setup</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openCreateModal(dept)}
                        className="text-[11px] font-semibold text-blue-600 hover:underline"
                      >
                        Open Form
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit SPOC Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0d2137] flex items-center justify-center text-[#cda34f]">
                  {modalMode === "CREATE" ? (
                    <UserPlus className="w-5 h-5" />
                  ) : (
                    <Edit3 className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {modalMode === "CREATE" ? (
                      currentModalDeptSpocs.length > 0 ? (
                        <span>Add Additional SPOC ({formData.department})</span>
                      ) : (
                        <span>Configure SPOC Credentials</span>
                      )
                    ) : (
                      <span>Edit SPOC Profile</span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {modalMode === "CREATE"
                      ? "Create dedicated login credentials for a faculty coordinator."
                      : "Update SPOC coordinator details, assigned school, or password."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Alert */}
            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
                {formError}
              </div>
            )}

            {/* Existing SPOCs assigned to this department */}
            {currentModalDeptSpocs.length > 0 && (
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <span>Configured SPOCs for {formData.department} ({currentModalDeptSpocs.length}):</span>
                  </span>
                  {modalMode === "EDIT" && (
                    <button
                      type="button"
                      onClick={() => openCreateModal(formData.department)}
                      className="text-[10px] font-bold text-blue-700 hover:underline"
                    >
                      + Switch to Add New SPOC
                    </button>
                  )}
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {currentModalDeptSpocs.map((s) => {
                    const isCurrentlyEditing = modalMode === "EDIT" && formData.id === s.id;
                    return (
                      <div
                        key={s.id}
                        className={`flex items-center justify-between p-2 rounded-xl text-[11px] border transition-all ${
                          isCurrentlyEditing
                            ? "bg-amber-100 border-amber-400 font-bold"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-semibold text-slate-800 truncate">
                            {s.facultyName && s.facultyName !== "N/A" ? s.facultyName : s.name}
                          </div>
                          <div className="font-mono text-[10px] text-slate-500 truncate">{s.email}</div>
                        </div>
                        {isCurrentlyEditing ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-600 text-white uppercase">
                            Editing Now
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openEditModal(s, formData.department)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] flex items-center gap-1 flex-shrink-0"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleModalSubmit} className="space-y-3.5 text-xs">
              {/* School / Department Dropdown */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  School / Department *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => handleDeptSelectInModal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                  required
                >
                  {canonicalDepts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Optional: Pick from existing Faculty in this School */}
              {modalMode === "CREATE" && faculties.length > 0 && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Assign from Existing Faculty in this School (Optional)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Auto-fills name & email</span>
                  </label>
                  <select
                    onChange={(e) => {
                      const facId = e.target.value;
                      if (!facId) return;
                      const fac = faculties.find((f) => f.id === facId);
                      if (fac) {
                        setFormData((prev) => ({
                          ...prev,
                          name: fac.name,
                          email: fac.email,
                          facultyId: fac.id,
                        }));
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                    defaultValue=""
                  >
                    <option value="">-- Choose faculty member to designate as SPOC --</option>
                    {faculties
                      .filter(
                        (f) =>
                          canonicalDepartment(f.department) === canonicalDepartment(formData.department)
                      )
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.email})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Coordinator Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  SPOC / Coordinator Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g. Dr. Satya Prakash or SOES SPOC"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                    required
                  />
                </div>
              </div>

              {/* Dedicated Login Email */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Login Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="spoc.engineering@gdgu.org"
                    className="w-full pl-9 pr-3 py-2 font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">
                    {modalMode === "CREATE"
                      ? "Login Password *"
                      : "New Password (leave empty to keep current)"}
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          passcode: "spoc@gdgu2026",
                        }))
                      }
                      className="text-[10px] text-slate-500 hover:text-slate-800 font-medium"
                    >
                      spoc@gdgu2026
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const slug = getDeptSlug(formData.department);
                        setFormData((prev) => ({
                          ...prev,
                          passcode: `spoc@${slug}2026`,
                        }));
                      }}
                      className="text-[10px] text-slate-500 hover:text-slate-800 font-medium"
                    >
                      Dept Default
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.passcode || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        passcode: e.target.value,
                      }))
                    }
                    placeholder={
                      modalMode === "CREATE"
                        ? "Enter password (min 6 chars)"
                        : "Enter new password if updating"
                    }
                    className="w-full pl-9 pr-9 py-2 font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                    minLength={formData.passcode ? 6 : undefined}
                    required={modalMode === "CREATE"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={formSubmitting}
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#0d2137] hover:bg-[#1a3a60] text-white font-bold shadow-md disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {formSubmitting ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-[#cda34f]" />
                      <span>
                        {modalMode === "CREATE"
                          ? currentModalDeptSpocs.length > 0
                            ? "Add Additional SPOC"
                            : "Save & Activate SPOC"
                          : "Update SPOC"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
