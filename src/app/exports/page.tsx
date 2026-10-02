"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import {
  Download,
  FileSpreadsheet,
  FileCode,
  Upload,
  Database,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  RotateCcw,
  Sparkles,
  Info,
} from "lucide-react";
import { Habit, ExportFilterOptions } from "@/types/routine";
import { getPresetDateRange, getTodayDateString } from "@/lib/date-utils";

export default function ExportsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [archives, setArchives] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Export Filter States
  const [exportFormat, setExportFormat] = useState<"xlsx" | "json">("xlsx");
  const [dateRangePreset, setDateRangePreset] = useState<"all" | "today" | "week" | "month" | "custom">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedHabitIds, setSelectedHabitIds] = useState<Set<string>>(new Set());
  const [includeArchived, setIncludeArchived] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "completed_only" | "incomplete_only">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Snapshot Creation
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [snapshotName, setSnapshotName] = useState("");

  // Import / Restore States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState("");
  const [importErrorMsg, setImportErrorMsg] = useState("");

  // Load habits and archives
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [habitsRes, archivesRes] = await Promise.all([
        fetch("/api/habits"),
        fetch("/api/archives"),
      ]);

      if (habitsRes.ok) {
        const hJson = await habitsRes.json();
        setHabits(hJson.habits || []);
        setSelectedHabitIds(new Set((hJson.habits || []).map((h: Habit) => h.id)));
      }

      if (archivesRes.ok) {
        const aJson = await archivesRes.json();
        setArchives(aJson.archives || []);
      }
    } catch (err) {
      console.error("Failed to load exports data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Preset changes
  const handlePresetChange = (preset: "all" | "today" | "week" | "month" | "custom") => {
    setDateRangePreset(preset);
    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "today") {
      const today = getTodayDateString();
      setStartDate(today);
      setEndDate(today);
    } else if (preset === "week") {
      const r = getPresetDateRange("week");
      setStartDate(r.start);
      setEndDate(r.end);
    } else if (preset === "month") {
      const r = getPresetDateRange("month");
      setStartDate(r.start);
      setEndDate(r.end);
    }
  };

  // Toggle habit selection
  const toggleHabit = (id: string) => {
    const next = new Set(selectedHabitIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedHabitIds(next);
  };

  const selectAllHabits = () => {
    setSelectedHabitIds(new Set(habits.map((h) => h.id)));
  };

  const clearHabitSelection = () => {
    setSelectedHabitIds(new Set());
  };

  // Categories list
  const categories = Array.from(new Set(habits.map((h) => h.category || "General")));

  // Handle Export Download
  const handleDownloadExport = async () => {
    try {
      setIsExporting(true);
      setExportSuccess(false);

      const filterOptions: ExportFilterOptions = {
        dateRangePreset,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        habitIds: Array.from(selectedHabitIds),
        includeArchived,
        statusFilter,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        searchTerm: searchTerm.trim() || undefined,
      };

      if (exportFormat === "xlsx") {
        const res = await fetch("/api/export/excel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filterOptions }),
        });

        if (!res.ok) throw new Error("Excel export failed");

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `routine-export-${getTodayDateString()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const res = await fetch("/api/export/json", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filterOptions }),
        });

        if (!res.ok) throw new Error("JSON export failed");

        const json = await res.json();
        const blob = new Blob([JSON.stringify(json, null, 2)], {
          type: "application/json",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `routine-export-${getTodayDateString()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err: any) {
      alert(err.message || "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  // Create Snapshot
  const handleCreateSnapshot = async () => {
    try {
      setIsCreatingSnapshot(true);
      const res = await fetch("/api/archives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: snapshotName.trim() || undefined }),
      });

      if (!res.ok) throw new Error("Failed to create snapshot");

      setSnapshotName("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to create archive snapshot");
    } finally {
      setIsCreatingSnapshot(false);
    }
  };

  // Download Existing Snapshot
  const handleDownloadSnapshot = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/archives/${id}`);
      if (!res.ok) throw new Error("Download failed");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data.archive.payload, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name.toLowerCase().replace(/\s+/g, "-")}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || "Could not download archive");
    }
  };

  // Delete Snapshot
  const handleDeleteSnapshot = async (id: string) => {
    if (!confirm("Are you sure you want to delete this archive snapshot?")) return;
    try {
      const res = await fetch(`/api/archives/${id}`, { method: "DELETE" });
      if (res.ok) await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Handle File Selection for Import
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportErrorMsg("");
    setImportPreview(null);

    try {
      const text = await file.text();
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preview", payload: text }),
      });

      const previewData = await res.json();
      if (!previewData.valid) {
        setImportErrorMsg(
          previewData.errors?.join(", ") || "Invalid routine backup format"
        );
      } else {
        setImportPreview(previewData);
      }
    } catch (err: any) {
      setImportErrorMsg("Could not parse file: " + err.message);
    }
  };

  // Execute Import
  const handleExecuteImport = async () => {
    if (!importPreview?.validatedData) return;

    if (
      importMode === "replace" &&
      !confirm(
        "CAUTION: 'Replace' mode will overwrite existing records in the imported date range. Do you want to proceed?"
      )
    ) {
      return;
    }

    try {
      setIsImporting(true);
      setImportErrorMsg("");
      setImportSuccessMsg("");

      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute",
          mode: importMode,
          validatedData: importPreview.validatedData,
        }),
      });

      const result = await res.json();
      if (!res.ok || result.error) {
        throw new Error(result.error || "Import failed");
      }

      setImportSuccessMsg(
        `Successfully restored ${result.importedRecordsCount} records, ${result.importedEntriesCount} entries, and ${result.importedHabitsCount} habits!`
      );
      await loadData();
    } catch (err: any) {
      setImportErrorMsg(err.message || "Failed to restore data");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
          <div>
            <span className="text-xs font-medium text-forest uppercase tracking-wider">
              Data Sovereignty
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-charcoal">
              Exports, Archives & Restore
            </h1>
            <p className="text-xs text-charcoal-muted mt-0.5">
              Filtered downloads in Excel/JSON, verified manual snapshots, and safe restore workflows
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setImportFile(null);
                setImportPreview(null);
                setImportErrorMsg("");
                setImportSuccessMsg("");
                setIsImportModalOpen(true);
              }}
              className="gap-1.5"
            >
              <Upload className="h-4 w-4" />
              <span>Import / Restore</span>
            </Button>
          </div>
        </div>

        {/* SECTION 1: FILTERED EXPORT WIZARD */}
        <Card className="shadow-subtle">
          <CardHeader className="pb-3 border-b border-border-subtle">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Filtered Routine Export</CardTitle>
                <p className="text-xs text-charcoal-muted">
                  Customize date ranges, selected habits, and completion criteria before downloading
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExportFormat("xlsx")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                    exportFormat === "xlsx"
                      ? "bg-forest border-forest text-white shadow-xs"
                      : "bg-white border-border-subtle text-charcoal hover:bg-page"
                  }`}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => setExportFormat("json")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                    exportFormat === "json"
                      ? "bg-forest border-forest text-white shadow-xs"
                      : "bg-white border-border-subtle text-charcoal hover:bg-page"
                  }`}
                >
                  <FileCode className="h-3.5 w-3.5" />
                  <span>JSON (.json)</span>
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* Filter Row 1: Date Range */}
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1.5">
                Date Range Filter
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {(["all", "today", "week", "month", "custom"] as const).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handlePresetChange(preset)}
                    className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors ${
                      dateRangePreset === preset
                        ? "bg-sage border-forest/40 text-forest font-semibold"
                        : "bg-white border-border-subtle text-charcoal hover:bg-page"
                    }`}
                  >
                    {preset === "all"
                      ? "All Dates"
                      : preset === "today"
                      ? "Today"
                      : preset === "week"
                      ? "This Week"
                      : preset === "month"
                      ? "This Month"
                      : "Custom Range"}
                  </button>
                ))}

                {dateRangePreset === "custom" && (
                  <div className="flex items-center gap-2 ml-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-8 px-2 text-xs rounded border border-border-subtle bg-white"
                    />
                    <span className="text-xs text-charcoal-muted">to</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-8 px-2 text-xs rounded border border-border-subtle bg-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Filter Row 2: Status & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Completion Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  className="h-9 w-full rounded-md border border-border-subtle bg-white px-3 text-xs shadow-subtle"
                >
                  <option value="all">All Entries (Completed & Incomplete)</option>
                  <option value="completed_only">Completed Entries Only</option>
                  <option value="incomplete_only">Incomplete Entries Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="h-9 w-full rounded-md border border-border-subtle bg-white px-3 text-xs shadow-subtle"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Search Filter
                </label>
                <Input
                  type="text"
                  placeholder="Filter by keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Filter Row 3: Habit Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-charcoal">
                  Included Habits ({selectedHabitIds.size}/{habits.length})
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAllHabits}
                    className="text-[11px] text-forest hover:underline font-medium"
                  >
                    Select All
                  </button>
                  <span className="text-charcoal-muted">•</span>
                  <button
                    onClick={clearHabitSelection}
                    className="text-[11px] text-charcoal-muted hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 p-3 rounded-md border border-border-subtle bg-page/50 max-h-36 overflow-y-auto">
                {habits.map((habit) => {
                  const isSelected = selectedHabitIds.has(habit.id);
                  return (
                    <button
                      key={habit.id}
                      onClick={() => toggleHabit(habit.id)}
                      className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                        isSelected
                          ? "bg-sage border-forest/40 text-forest font-semibold"
                          : "bg-white border-border-subtle text-charcoal-muted opacity-70"
                      }`}
                    >
                      {habit.name}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-charcoal">
                  <input
                    type="checkbox"
                    checked={includeArchived}
                    onChange={(e) => setIncludeArchived(e.target.checked)}
                    className="rounded border-border-strong text-forest focus:ring-forest"
                  />
                  <span>Include archived habits in historical export</span>
                </label>
              </div>
            </div>

            {/* Export Summary & Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-border-subtle bg-page/30 p-3 rounded-lg">
              <div className="text-xs text-charcoal-muted">
                Exporting as <span className="font-semibold text-charcoal">.{exportFormat}</span> •{" "}
                <span className="font-semibold text-charcoal">
                  {selectedHabitIds.size}
                </span>{" "}
                habits selected • Status:{" "}
                <span className="font-semibold text-charcoal">{statusFilter}</span>
              </div>

              <Button
                onClick={handleDownloadExport}
                isLoading={isExporting}
                className="gap-2 shadow-subtle shrink-0"
              >
                <Download className="h-4 w-4" />
                <span>
                  {exportFormat === "xlsx" ? "Generate & Download Excel" : "Generate & Download JSON"}
                </span>
              </Button>
            </div>

            {exportSuccess && (
              <div className="p-2.5 rounded-md bg-status-success-bg text-status-success text-xs border border-green-200 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>File generated and downloaded successfully!</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 2: MANUAL ARCHIVE & VERIFIED SNAPSHOTS */}
        <Card className="shadow-subtle">
          <CardHeader className="pb-3 border-b border-border-subtle">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">Manual Archives & Snapshots</CardTitle>
                <p className="text-xs text-charcoal-muted">
                  Create verified point-in-time snapshots with SHA-256 integrity checksums
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Snapshot label..."
                  value={snapshotName}
                  onChange={(e) => setSnapshotName(e.target.value)}
                  className="h-8 text-xs w-44"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleCreateSnapshot}
                  isLoading={isCreatingSnapshot}
                  className="gap-1.5 shrink-0"
                >
                  <Database className="h-3.5 w-3.5" />
                  <span>Create Snapshot</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {archives.length === 0 ? (
              <div className="py-8 text-center text-xs text-charcoal-muted">
                No manual archives created yet. Use "Create Snapshot" above to generate a verified backup.
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {archives.map((arch) => (
                  <div
                    key={arch.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-charcoal">
                          {arch.archive_name}
                        </span>
                        <Badge variant="success" className="gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          <span>Verified</span>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-charcoal-muted mt-1 flex-wrap">
                        <span>
                          {arch.record_count} days • {arch.entry_count} entries • {arch.habit_count} habits
                        </span>
                        <span>•</span>
                        <span>Date Range: {arch.date_range_start} to {arch.date_range_end}</span>
                        <span>•</span>
                        <span className="font-mono text-[10px] truncate max-w-[120px]" title={arch.checksum}>
                          SHA: {arch.checksum.slice(0, 10)}...
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadSnapshot(arch.id, arch.archive_name)}
                        className="gap-1 text-xs"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download</span>
                      </Button>
                      <button
                        onClick={() => handleDeleteSnapshot(arch.id)}
                        title="Delete snapshot"
                        className="p-1.5 text-charcoal-muted hover:text-status-error hover:bg-status-error-bg rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* RESTORE / IMPORT MODAL DIALOG */}
        <Dialog
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          title="Restore / Import Routine Backup"
          description="Upload a verified JSON routine export file to preview and restore"
          maxWidth="lg"
        >
          <div className="space-y-4">
            {importErrorMsg && (
              <div className="p-3 rounded-md bg-status-error-bg text-status-error text-xs border border-red-200">
                {importErrorMsg}
              </div>
            )}
            {importSuccessMsg && (
              <div className="p-3 rounded-md bg-status-success-bg text-status-success text-xs border border-green-200">
                {importSuccessMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Select .json Routine File
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="w-full text-xs text-charcoal file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-sage file:text-forest hover:file:bg-sage-dark cursor-pointer"
              />
            </div>

            {/* PREVIEW DETAILS */}
            {importPreview && (
              <div className="space-y-3 p-3 bg-page rounded-lg border border-border-subtle">
                <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                  <span className="text-xs font-semibold text-charcoal">
                    Backup Contents Preview
                  </span>
                  <Badge variant="sage">Schema v{importPreview.schemaVersion}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-white rounded border border-border-subtle">
                    <span className="text-charcoal-muted block text-[10px]">Habits</span>
                    <span className="text-sm font-bold text-charcoal">
                      {importPreview.totalHabits}
                    </span>
                    <span className="text-[10px] text-charcoal-muted block">
                      ({importPreview.conflictingHabitsCount} existing)
                    </span>
                  </div>

                  <div className="p-2 bg-white rounded border border-border-subtle">
                    <span className="text-charcoal-muted block text-[10px]">Days</span>
                    <span className="text-sm font-bold text-charcoal">
                      {importPreview.totalRecords}
                    </span>
                    <span className="text-[10px] text-charcoal-muted block">
                      ({importPreview.conflictingDatesCount} conflicts)
                    </span>
                  </div>

                  <div className="p-2 bg-white rounded border border-border-subtle">
                    <span className="text-charcoal-muted block text-[10px]">Entries</span>
                    <span className="text-sm font-bold text-charcoal">
                      {importPreview.totalEntries}
                    </span>
                    <span className="text-[10px] text-charcoal-muted block">total logged</span>
                  </div>
                </div>

                <div className="text-[11px] text-charcoal-muted">
                  Date Range: {importPreview.dateRange.start} to {importPreview.dateRange.end}
                </div>

                {/* RESTORE STRATEGY SELECTION */}
                <div className="pt-2 border-t border-border-subtle">
                  <span className="text-xs font-semibold text-charcoal block mb-1">
                    Restore Strategy
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setImportMode("merge")}
                      className={`p-2.5 text-left rounded-md border text-xs transition-all ${
                        importMode === "merge"
                          ? "bg-white border-forest ring-1 ring-forest/30 font-semibold text-charcoal"
                          : "bg-page/50 border-border-subtle text-charcoal-muted"
                      }`}
                    >
                      <span className="block font-medium">Merge (Safe)</span>
                      <span className="text-[10px] text-charcoal-muted block mt-0.5">
                        Upserts imported data without deleting other dates
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setImportMode("replace")}
                      className={`p-2.5 text-left rounded-md border text-xs transition-all ${
                        importMode === "replace"
                          ? "bg-red-50 border-red-400 ring-1 ring-red-400/30 font-semibold text-status-error"
                          : "bg-page/50 border-border-subtle text-charcoal-muted"
                      }`}
                    >
                      <span className="block font-medium">Replace Range</span>
                      <span className="text-[10px] text-charcoal-muted block mt-0.5">
                        Overwrites existing dates in the backup range
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsImportModalOpen(false)}
              >
                Close
              </Button>

              {importPreview && (
                <Button
                  onClick={handleExecuteImport}
                  isLoading={isImporting}
                  variant={importMode === "replace" ? "danger" : "primary"}
                >
                  Confirm & Execute Restore
                </Button>
              )}
            </div>
          </div>
        </Dialog>
      </div>
    </AppLayout>
  );
}
