import { useState } from "react";
import { Upload, FileText, CheckCircle, XCircle, Loader, Download, Users } from "lucide-react";
import { useAuth } from "@/app/providers/auth-provider";
import { bulkRegisterUsers, BulkRegisterUser, BulkRegisterResult } from "@/app/lib/api";

export function AdminRecruit() {
  const { token, user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [parsedUsers, setParsedUsers] = useState<BulkRegisterUser[]>([]);
  const [result, setResult] = useState<BulkRegisterResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);

    try {
      const text = await selectedFile.text();
      const users = parseCSV(text);
      
      if (users.length === 0) {
        setError("No valid users found in the file. Please check the format.");
        return;
      }
      
      setParsedUsers(users);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
    }
  };

  const parseCSV = (text: string): BulkRegisterUser[] => {
    const lines = text.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length < 2) {
      throw new Error("CSV must have a header row and at least one data row");
    }

    const headerLine = lines[0].toLowerCase();
    const headers = headerLine.split(",").map(h => h.trim().replace(/"/g, ""));
    
    // Map possible header names to our field names
    const headerMap: Record<string, string> = {
      "full_name": "full_name",
      "name": "full_name",
      "fullname": "full_name",
      "full name": "full_name",
      "email": "email",
      "email address": "email",
      "emailaddress": "email",
      "roll_number": "roll_number",
      "rollnumber": "roll_number",
      "roll number": "roll_number",
      "roll no": "roll_number",
      "rollno": "roll_number",
      "gender": "gender",
      "phone": "phone",
      "phone number": "phone",
      "phonenumber": "phone",
      "mobile": "phone",
      "department": "department",
      "dept": "department",
      "branch": "branch",
      "password": "password",
    };

    const mappedHeaders = headers.map(h => headerMap[h] || h);
    
    const requiredFields = ["full_name", "email"];
    const missingFields = requiredFields.filter(f => !mappedHeaders.includes(f));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required columns: ${missingFields.join(", ")}`);
    }

    const users: BulkRegisterUser[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      
      if (values.length !== headers.length) continue;

      const userData: Record<string, string> = {};
      
      for (let j = 0; j < mappedHeaders.length; j++) {
        const field = mappedHeaders[j];
        const value = values[j]?.trim().replace(/^"|"$/g, "");
        if (value) {
          userData[field] = value;
        }
      }

      if (userData.full_name && userData.email) {
        // Validate department if provided
        const dept = userData.department?.toLowerCase();
        const validDept = dept === "mechanical" || dept === "software" || dept === "embedded" ? dept : undefined;
        
        users.push({
          full_name: userData.full_name,
          email: userData.email,
          roll_number: userData.roll_number,
          gender: userData.gender?.toLowerCase(),
          phone: userData.phone,
          department: validDept as "mechanical" | "software" | "embedded" | undefined,
          branch: userData.branch,
          password: userData.password,
        });
      }
    }

    return users;
  };

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

  const handleSubmit = async () => {
    if (!token || parsedUsers.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await bulkRegisterUsers(token, parsedUsers);
      setResult(response);
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register users");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `full_name,email,roll_number,gender,phone,department,branch,password
John Doe,john@example.com,R001,male,+1234567890,software,CSE,
Jane Smith,jane@example.com,R002,female,+1234567891,mechanical,ME,`;
    
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recruit_template.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const downloadResults = () => {
    if (!result) return;

    const lines = ["email,status,password"];
    
    for (const success of result.success) {
      lines.push(`${success.email},success,${success.generated_password || "user-provided"}`);
    }
    
    for (const failed of result.failed) {
      lines.push(`${failed.email},failed: ${failed.error},`);
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "registration_results.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setParsedUsers([]);
    setResult(null);
    setError(null);
    setStep("upload");
  };

  if (!token || user?.role !== "admin") {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-semibold text-gray-200">Access Denied</h2>
        <p className="text-gray-400 mt-3">Only admins can access this page.</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-black to-neutral-950 min-h-screen">
      <div className="mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent flex items-center gap-3">
          <Users className="w-8 h-8 text-violet-500" />
          Recruit Members
        </h2>
        <p className="text-neutral-400 mt-2">
          Upload a CSV file with candidate details to register multiple members at once
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Upload Step */}
      {step === "upload" && (
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Upload CSV File</h3>
            
            <div className="border-2 border-dashed border-neutral-700 rounded-lg p-8 text-center hover:border-violet-500 transition-colors">
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
                <p className="text-neutral-300 mb-2">Click to upload or drag and drop</p>
                <p className="text-neutral-500 text-sm">CSV file with candidate details</p>
              </label>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Template
              </button>
            </div>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-700 rounded-lg p-6">
            <h4 className="text-sm font-semibold text-neutral-300 mb-3">Required CSV Columns</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-violet-400 font-medium">full_name</span>
                <span className="text-red-400 ml-1">*</span>
                <p className="text-neutral-500">Full name</p>
              </div>
              <div>
                <span className="text-violet-400 font-medium">email</span>
                <span className="text-red-400 ml-1">*</span>
                <p className="text-neutral-500">Email address</p>
              </div>
              <div>
                <span className="text-neutral-400 font-medium">roll_number</span>
                <p className="text-neutral-500">Roll/ID number</p>
              </div>
              <div>
                <span className="text-neutral-400 font-medium">gender</span>
                <p className="text-neutral-500">male/female/other</p>
              </div>
              <div>
                <span className="text-neutral-400 font-medium">phone</span>
                <p className="text-neutral-500">Phone number</p>
              </div>
              <div>
                <span className="text-neutral-400 font-medium">department</span>
                <p className="text-neutral-500">mechanical/software/embedded</p>
              </div>
              <div>
                <span className="text-neutral-400 font-medium">branch</span>
                <p className="text-neutral-500">Academic branch</p>
              </div>
              <div>
                <span className="text-neutral-400 font-medium">password</span>
                <p className="text-neutral-500">Optional (auto-generated)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Step */}
      {step === "preview" && (
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-500" />
                Preview ({parsedUsers.length} users)
              </h3>
              <button
                onClick={reset}
                className="text-sm text-neutral-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>

            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-neutral-800">
                  <tr>
                    <th className="text-left py-2 px-3 text-neutral-400">#</th>
                    <th className="text-left py-2 px-3 text-neutral-400">Name</th>
                    <th className="text-left py-2 px-3 text-neutral-400">Email</th>
                    <th className="text-left py-2 px-3 text-neutral-400">Roll No</th>
                    <th className="text-left py-2 px-3 text-neutral-400">Department</th>
                    <th className="text-left py-2 px-3 text-neutral-400">Branch</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedUsers.map((user, idx) => (
                    <tr key={idx} className="border-t border-neutral-800">
                      <td className="py-2 px-3 text-neutral-500">{idx + 1}</td>
                      <td className="py-2 px-3 text-white">{user.full_name}</td>
                      <td className="py-2 px-3 text-neutral-300">{user.email}</td>
                      <td className="py-2 px-3 text-neutral-400">{user.roll_number || "-"}</td>
                      <td className="py-2 px-3 text-neutral-400 capitalize">{user.department || "-"}</td>
                      <td className="py-2 px-3 text-neutral-400">{user.branch || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-all disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Register {parsedUsers.length} Users
                  </>
                )}
              </button>
              <button
                onClick={reset}
                disabled={isLoading}
                className="px-6 py-3 bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Step */}
      {step === "result" && result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <h3 className="text-lg font-semibold text-green-400">Successful</h3>
                  <p className="text-green-300 text-2xl font-bold">{result.success.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
                <div>
                  <h3 className="text-lg font-semibold text-red-400">Failed</h3>
                  <p className="text-red-300 text-2xl font-bold">{result.failed.length}</p>
                </div>
              </div>
            </div>
          </div>

          {result.success.length > 0 && (
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Registered Users</h4>
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-neutral-800">
                    <tr>
                      <th className="text-left py-2 px-3 text-neutral-400">Email</th>
                      <th className="text-left py-2 px-3 text-neutral-400">Name</th>
                      <th className="text-left py-2 px-3 text-neutral-400">Generated Password</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.success.map((user, idx) => (
                      <tr key={idx} className="border-t border-neutral-800">
                        <td className="py-2 px-3 text-neutral-300">{user.email}</td>
                        <td className="py-2 px-3 text-white">{user.full_name}</td>
                        <td className="py-2 px-3 text-violet-400 font-mono">
                          {user.generated_password || "(user provided)"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {result.failed.length > 0 && (
            <div className="bg-neutral-900 border border-red-500/30 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-red-400 mb-4">Failed Registrations</h4>
              <div className="space-y-2">
                {result.failed.map((fail, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-neutral-300">{fail.email}:</span>
                      <span className="text-red-400 ml-2">{fail.error}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={downloadResults}
              className="flex items-center gap-2 px-6 py-3 bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Download Results CSV
            </button>
            <button
              onClick={reset}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-all"
            >
              Register More Users
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
