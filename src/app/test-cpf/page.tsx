"use client";
import React, { useState } from "react";
import { CPFField } from "@/components/Auth/CPFField";
import { CPFValidator } from "@/lib/utils/cpf-validation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestCPFPage() {
  const [cpf, setCpf] = useState("");
  const [testResults, setTestResults] = useState<any[]>([]);

  const testCPFs = [
    "111.444.777-35", // Valid CPF
    "123.456.789-00", // Invalid CPF (all same digits)
    "000.000.000-00", // Invalid CPF (all zeros)
    "111.111.111-11", // Invalid CPF (all ones)
    "123.456.789-01", // Invalid CPF (wrong check digits)
    "529.982.247-25", // Valid CPF
    "123.456.789-10", // Invalid CPF
  ];

  const runTests = () => {
    const results = testCPFs.map((testCpf) => {
      const validation = CPFValidator.validate(testCpf);
      return {
        cpf: testCpf,
        clean: CPFValidator.clean(testCpf),
        formatted: CPFValidator.format(testCpf),
        isValid: validation.isValid,
        errors: validation.errors,
      };
    });
    setTestResults(results);
  };

  const generateRandomCPF = () => {
    const randomCPF = CPFValidator.generate();
    setCpf(CPFValidator.format(randomCPF));
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">CPF Validation Test</h1>
          <p className="text-muted-foreground">
            Test the CPF validation functionality
          </p>
        </div>

        {/* Interactive CPF Field */}
        <Card>
          <CardHeader>
            <CardTitle>Interactive CPF Field</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CPFField
              value={cpf}
              onChange={setCpf}
              label="Test CPF"
              placeholder="Digite um CPF para testar"
              required
            />

            <div className="flex gap-2">
              <Button onClick={generateRandomCPF} variant="outline">
                Generate Valid CPF
              </Button>
              <Button onClick={() => setCpf("")} variant="outline">
                Clear
              </Button>
            </div>

            {cpf && (
              <div className="p-4 bg-gray-900 rounded-lg">
                <h3 className="font-semibold mb-2">Validation Details:</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Input:</strong> {cpf}
                  </p>
                  <p>
                    <strong>Clean:</strong> {CPFValidator.clean(cpf)}
                  </p>
                  <p>
                    <strong>Formatted:</strong> {CPFValidator.format(cpf)}
                  </p>
                  <p>
                    <strong>Valid:</strong>{" "}
                    {CPFValidator.isValid(cpf) ? "✅ Yes" : "❌ No"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={runTests} className="mb-4">
              Run CPF Tests
            </Button>

            {testResults.length > 0 && (
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.isValid
                        ? "bg-green-900/20 border-green-500/20"
                        : "bg-red-900/20 border-red-500/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{result.cpf}</h4>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          result.isValid
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {result.isValid ? "VALID" : "INVALID"}
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>Clean:</strong> {result.clean}
                      </p>
                      <p>
                        <strong>Formatted:</strong> {result.formatted}
                      </p>
                      {result.errors.length > 0 && (
                        <div>
                          <strong>Errors:</strong>
                          <ul className="list-disc list-inside ml-2">
                            {result.errors.map(
                              (error: string, errorIndex: number) => (
                                <li key={errorIndex} className="text-red-400">
                                  {error}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Algorithm Information */}
        <Card>
          <CardHeader>
            <CardTitle>CPF Validation Algorithm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <p>The CPF validation uses the official Brazilian algorithm:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Remove all non-numeric characters</li>
                <li>Check if it has exactly 11 digits</li>
                <li>Check if all digits are not the same</li>
                <li>Calculate first check digit using weights 10-2</li>
                <li>Calculate second check digit using weights 11-2</li>
                <li>Verify both check digits match the CPF</li>
              </ol>

              <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
                <h4 className="font-semibold mb-2">Example:</h4>
                <p>CPF: 529.982.247-25</p>
                <p>
                  First digit calculation: (5×10 + 2×9 + 9×8 + 9×7 + 8×6 + 2×5 +
                  2×4 + 4×3 + 7×2) % 11 = 5
                </p>
                <p>
                  Second digit calculation: (5×11 + 2×10 + 9×9 + 9×8 + 8×7 + 2×6
                  + 2×5 + 4×4 + 7×3 + 2×2) % 11 = 5
                </p>
                <p>Result: Valid CPF ✅</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
