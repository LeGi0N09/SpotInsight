"use client";

import { useState } from "react";

export default function ImportPage() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setImporting(true);
    setResult(null);

    try {
      let allData: any[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const text = await file.text();
        const json = JSON.parse(text);
        allData = allData.concat(json);
      }

      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(allData),
      });

      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ error: String(error) });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e10] via-[#0d1517] to-[#05090b] flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="card">
          <h1 className="text-3xl font-bold text-white mb-6">Import Spotify Data</h1>
          
          <div className="space-y-6">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <h3 className="font-semibold text-blue-400 mb-2">📋 Instructions:</h3>
              <ol className="text-sm text-zinc-300 space-y-2 list-decimal list-inside">
                <li>Go to <a href="https://www.spotify.com/account/privacy/" target="_blank" className="text-emerald-400 underline">Spotify Privacy Settings</a></li>
                <li>Request "Extended streaming history"</li>
                <li>Wait for email (takes 5-30 days)</li>
                <li>Download and extract the ZIP file</li>
                <li>Upload all StreamingHistory*.json files below</li>
              </ol>
            </div>

            <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-emerald-500/50 transition-colors">
              <input
                type="file"
                accept=".json"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={importing}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-block px-6 py-3 bg-emerald-500 text-black rounded-xl font-semibold hover:bg-emerald-400 transition-colors"
              >
                {importing ? "Importing..." : "Select JSON Files"}
              </label>
              <p className="text-sm text-zinc-500 mt-3">
                Select multiple StreamingHistory*.json files
              </p>
            </div>

            {result && (
              <div className={`rounded-xl p-4 ${
                result.error 
                  ? "bg-red-500/10 border border-red-500/20" 
                  : "bg-green-500/10 border border-green-500/20"
              }`}>
                {result.error ? (
                  <>
                    <h3 className="font-semibold text-red-400 mb-2">❌ Error</h3>
                    <p className="text-sm text-zinc-300">{result.error}</p>
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold text-green-400 mb-2">✅ Success!</h3>
                    <p className="text-sm text-zinc-300">
                      Imported {result.imported} plays to database
                    </p>
                    <a
                      href="/"
                      className="inline-block mt-4 px-4 py-2 bg-emerald-500 text-black rounded-lg font-medium hover:bg-emerald-400 transition-colors"
                    >
                      View Dashboard
                    </a>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-zinc-400 hover:text-white transition-colors">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
