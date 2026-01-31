import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Search, Plus, Edit, Trash2, Eye, Upload, Download, FileText, CheckCircle, XCircle, Loader } from "lucide-react";
import { createItem, deleteItem, fetchItems, Item, ItemInput, updateItem } from "@/app/lib/api";
import { useAuth } from "@/app/providers/auth-provider";

interface ItemFormState {
  name: string;
  description: string;
  cabinet: string;
  quantity: number;
}

const DEFAULT_FORM: ItemFormState = {
  name: "",
  description: "",
  cabinet: "",
  quantity: 1,
};

// Cabinet options 1-12
const CABINET_OPTIONS = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

export function ToolManagement() {
  const { token, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState<ItemFormState>(DEFAULT_FORM);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const isAdmin = user?.role === "admin";
  
  // Bulk upload state
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [parsedTools, setParsedTools] = useState<ItemInput[]>([]);
  const [bulkStep, setBulkStep] = useState<"upload" | "preview" | "result">("upload");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState<{ success: string[]; failed: Array<{ name: string; error: string }> } | null>(null);

  const loadItems = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchItems(token);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) =>
      [item.name, item.description, item.cabinet]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [items, searchQuery]);

  const getStatusColor = (quantity: number) => {
    if (quantity === 0) return "bg-orange-500/20 text-orange-400";
    if (quantity < 3) return "bg-yellow-500/20 text-yellow-400";
    return "bg-green-500/20 text-green-400";
  };

  const getConditionLabel = (quantity: number) => {
    if (quantity === 0) return "Out of Stock";
    if (quantity < 3) return "Low";
    return "In Stock";
  };

  const openCreateForm = () => {
    setEditingItem(null);
    setFormState(DEFAULT_FORM);
    setIsFormOpen(true);
  };

  const openEditForm = (item: Item) => {
    setEditingItem(item);
    setFormState({
      name: item.name,
      description: item.description ?? "",
      cabinet: item.cabinet,
      quantity: item.quantity,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
    setFormState(DEFAULT_FORM);
  };

  const handleFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: name === "quantity" ? Number(value) : value }));
  };

  const normalizePayload = (state: ItemFormState): ItemInput => ({
    name: state.name.trim(),
    description: state.description.trim() || undefined,
    cabinet: state.cabinet.trim(),
    quantity: Number(state.quantity),
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setLoading(true);
      const payload = normalizePayload(formState);
      if (editingItem) {
        await updateItem(token, editingItem.id, payload);
      } else {
        await createItem(token, payload);
      }
      await loadItems();
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save item");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: Item) => {
    if (!token) return;
    const confirmed = window.confirm(`Delete ${item.name}? This action cannot be undone.`);
    if (!confirmed) return;
    try {
      setLoading(true);
      await deleteItem(token, item.id);
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete item");
    } finally {
      setLoading(false);
    }
  };

  // CSV Parsing functions
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const parseToolsCSV = (text: string): ItemInput[] => {
    const lines = text.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length < 2) {
      throw new Error("CSV must have a header row and at least one data row");
    }

    const headerLine = lines[0].toLowerCase();
    const headers = headerLine.split(",").map(h => h.trim().replace(/"/g, ""));
    
    const headerMap: Record<string, string> = {
      "name": "name",
      "tool_name": "name",
      "toolname": "name",
      "tool name": "name",
      "description": "description",
      "desc": "description",
      "cabinet": "cabinet",
      "cabinet_number": "cabinet",
      "cabinet number": "cabinet",
      "cab": "cabinet",
      "quantity": "quantity",
      "qty": "quantity",
      "count": "quantity",
    };

    const mappedHeaders = headers.map(h => headerMap[h] || h);
    
    const requiredFields = ["name"];
    const missingFields = requiredFields.filter(f => !mappedHeaders.includes(f));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required columns: ${missingFields.join(", ")}`);
    }

    const tools: ItemInput[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length !== headers.length) continue;

      const toolData: Record<string, string> = {};
      
      for (let j = 0; j < mappedHeaders.length; j++) {
        const field = mappedHeaders[j];
        const value = values[j]?.trim().replace(/^"|"$/g, "");
        if (value) {
          toolData[field] = value;
        }
      }

      if (toolData.name) {
        // Normalize cabinet to "Cabinet X" format
        let cabinet = toolData.cabinet || "Cabinet 1";
        const cabinetMatch = cabinet.match(/\d+/);
        if (cabinetMatch) {
          const num = parseInt(cabinetMatch[0], 10);
          if (num >= 1 && num <= 12) {
            cabinet = `Cabinet ${num}`;
          } else {
            cabinet = "Cabinet 1";
          }
        } else if (!cabinet.startsWith("Cabinet")) {
          cabinet = "Cabinet 1";
        }

        tools.push({
          name: toolData.name,
          description: toolData.description || undefined,
          cabinet,
          quantity: parseInt(toolData.quantity, 10) || 1,
        });
      }
    }

    return tools;
  };

  const handleBulkFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setBulkFile(selectedFile);
    setError(null);

    try {
      const text = await selectedFile.text();
      const tools = parseToolsCSV(text);
      
      if (tools.length === 0) {
        setError("No valid tools found in the file. Please check the format.");
        return;
      }
      
      setParsedTools(tools);
      setBulkStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
    }
  };

  const handleBulkSubmit = async () => {
    if (!token || parsedTools.length === 0) return;

    setBulkLoading(true);
    setError(null);

    const results = { success: [] as string[], failed: [] as Array<{ name: string; error: string }> };

    for (const tool of parsedTools) {
      try {
        await createItem(token, tool);
        results.success.push(tool.name);
      } catch (err) {
        results.failed.push({
          name: tool.name,
          error: err instanceof Error ? err.message : "Failed to create",
        });
      }
    }

    setBulkResults(results);
    setBulkStep("result");
    setBulkLoading(false);
    await loadItems();
  };

  const closeBulkUpload = () => {
    setIsBulkUploadOpen(false);
    setBulkFile(null);
    setParsedTools([]);
    setBulkStep("upload");
    setBulkResults(null);
  };

  const downloadToolsTemplate = () => {
    const template = `name,description,cabinet,quantity
Oscilloscope Model X200,Digital oscilloscope for signal analysis,1,5
Multimeter DMM-150,Professional multimeter,2,10
Soldering Station SS-75,Temperature controlled soldering,3,8`;
    
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tools_template.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (!token) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-semibold text-white">Tool Management</h2>
        <p className="text-neutral-500 mt-3">Please sign in to manage laboratory inventory.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Tool Management</h2>
        <p className="text-neutral-500 mt-1">Manage your laboratory equipment and tools</p>
      </div>

      <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-sm mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search tools by name or cabinet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsBulkUploadOpen(true)}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-500/20 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span>Bulk Upload</span>
                </button>
                <button
                  onClick={openCreateForm}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add New Tool</span>
                </button>
              </div>
            )}
          </div>
          {error && (
            <p className="mt-4 text-sm text-red-500">{error}</p>
          )}
        </div>
      </div>

      <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-800 border-b border-neutral-800">
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Tool Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Cabinet
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                {isAdmin && (
                  <th className="px-6 py-4 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-neutral-800 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{item.name}</div>
                    {item.description && (
                      <p className="text-xs text-neutral-500 mt-1 max-w-md truncate">{item.description}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-400">{item.cabinet}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{item.quantity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${getStatusColor(item.quantity)}`}>
                      {getConditionLabel(item.quantity)}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-500/20 rounded-lg transition-colors" title="View details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditForm(item)}
                          className="p-2 text-neutral-400 hover:text-green-600 hover:bg-green-500/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {!loading && filteredItems.length === 0 && (
                <tr>
                  <td className="px-6 py-10 text-center text-sm text-neutral-500" colSpan={isAdmin ? 5 : 4}>
                    No tools match your search criteria.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td className="px-6 py-10 text-center text-sm text-neutral-500" colSpan={isAdmin ? 5 : 4}>
                    Loading tools...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && isAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-neutral-900 rounded-xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-neutral-800">
              <h3 className="text-lg font-semibold text-white">
                {editingItem ? "Edit Tool" : "Add New Tool"}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Tool Name</label>
                <input
                  type="text"
                  name="name"
                  value={formState.name}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2.5 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formState.description}
                  onChange={handleFormChange}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Cabinet</label>
                  <select
                    name="cabinet"
                    value={formState.cabinet}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2.5 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select cabinet</option>
                    {CABINET_OPTIONS.map((num) => (
                      <option key={num} value={`Cabinet ${num}`}>
                        Cabinet {num}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    min={0}
                    value={formState.quantity}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2.5 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              {/* Location coordinates removed per request */}
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-6 py-2.5 border border-neutral-700 text-neutral-300 rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingItem ? "Update Tool" : "Create Tool"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {isBulkUploadOpen && isAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-neutral-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {bulkStep === "upload" && "Bulk Upload Tools"}
                {bulkStep === "preview" && "Preview Tools"}
                {bulkStep === "result" && "Upload Results"}
              </h3>
              <button
                onClick={closeBulkUpload}
                className="text-neutral-400 hover:text-neutral-400 text-xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 flex-1 overflow-auto">
              {bulkStep === "upload" && (
                <div className="space-y-6">
                  <div className="border-2 border-dashed border-neutral-700 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                    <p className="text-neutral-400 mb-4">
                      Upload a CSV file with tool information
                    </p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleBulkFileChange}
                      className="hidden"
                      id="bulk-upload-input"
                    />
                    <label
                      htmlFor="bulk-upload-input"
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      <FileText className="w-5 h-5" />
                      Select CSV File
                    </label>
                  </div>

                  <div className="bg-neutral-800 rounded-lg p-4">
                    <h4 className="font-medium text-neutral-300 mb-2">CSV Format</h4>
                    <p className="text-sm text-neutral-400 mb-3">
                      Your CSV should have these columns:
                    </p>
                    <ul className="text-sm text-neutral-400 space-y-1 mb-4">
                      <li><strong>name</strong> (required) - Tool name</li>
                      <li><strong>description</strong> - Tool description</li>
                      <li><strong>cabinet</strong> - Cabinet number (1-12)</li>
                      <li><strong>quantity</strong> - Number of items</li>
                    </ul>
                    <button
                      onClick={downloadToolsTemplate}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download Template
                    </button>
                  </div>
                </div>
              )}

              {bulkStep === "preview" && (
                <div className="space-y-4">
                  <p className="text-neutral-400">
                    Found <strong>{parsedTools.length}</strong> tools to import:
                  </p>
                  <div className="max-h-80 overflow-auto border border-neutral-800 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-800 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500">#</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500">Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500">Cabinet</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500">Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {parsedTools.map((tool, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 text-neutral-500">{idx + 1}</td>
                            <td className="px-4 py-2 text-white">{tool.name}</td>
                            <td className="px-4 py-2 text-neutral-400">{tool.cabinet}</td>
                            <td className="px-4 py-2 text-neutral-400">{tool.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {bulkStep === "result" && bulkResults && (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1 bg-green-50 rounded-lg p-4 text-center">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-700">{bulkResults.success.length}</p>
                      <p className="text-sm text-green-600">Imported Successfully</p>
                    </div>
                    <div className="flex-1 bg-red-50 rounded-lg p-4 text-center">
                      <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-red-700">{bulkResults.failed.length}</p>
                      <p className="text-sm text-red-600">Failed</p>
                    </div>
                  </div>

                  {bulkResults.failed.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-4">
                      <h4 className="font-medium text-red-700 mb-2">Failed Items:</h4>
                      <ul className="text-sm text-red-600 space-y-1">
                        {bulkResults.failed.map((item, idx) => (
                          <li key={idx}>
                            <strong>{item.name}:</strong> {item.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-neutral-800 flex justify-end gap-3">
              {bulkStep === "upload" && (
                <button
                  onClick={closeBulkUpload}
                  className="px-6 py-2.5 border border-neutral-700 text-neutral-300 rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
              )}
              {bulkStep === "preview" && (
                <>
                  <button
                    onClick={() => {
                      setBulkStep("upload");
                      setParsedTools([]);
                      setBulkFile(null);
                    }}
                    className="px-6 py-2.5 border border-neutral-700 text-neutral-300 rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleBulkSubmit}
                    disabled={bulkLoading}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {bulkLoading && <Loader className="w-4 h-4 animate-spin" />}
                    {bulkLoading ? "Importing..." : `Import ${parsedTools.length} Tools`}
                  </button>
                </>
              )}
              {bulkStep === "result" && (
                <button
                  onClick={closeBulkUpload}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
