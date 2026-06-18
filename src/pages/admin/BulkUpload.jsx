import React, { useState, useRef } from 'react';
import AdminLayout from '../../components/AdminLayout';
import * as DS from '../../services/DataService';

const CSV_TEMPLATE = `item_name,type,occasion,sizes,colours,price,fabric,godown_number,rack_number,shelf,internal_notes,image_filenames
"Floral Summer Dress",long_dress,"casual|festive","S|M|L|XL","Peach:#F4A261|Navy Blue:#264653",2499,Georgette,GD-1,R-3,A,"Supplier: FabIndia","peach_dress.jpg|navy_dress.jpg"
"Cotton Office Kurti",kurti,"office|casual","S|M|L","White:#FAFAFA|Mint:#98D8C8",899,Cotton,GD-1,R-1,B,"","white_kurti.jpg|mint_kurti.jpg"`;

const VALID_TYPES = ['top', 'bottom', 'shorts', 'long_dress', 'coord_set', 'kurti', 'other'];
const VALID_OCCASIONS = ['casual', 'festive', 'office', 'party', 'wedding'];
const VALID_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'free_size'];

export default function BulkUpload() {
  const [step, setStep] = useState('upload'); // upload, validating, review, importing, done
  const [csvData, setCsvData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [validRows, setValidRows] = useState([]);
  const [importResults, setImportResults] = useState(null);
  const fileInputRef = useRef(null);

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dressmirror_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStep('validating');

    try {
      const Papa = await import('papaparse');
      const text = await file.text();
      Papa.default.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          validateCSV(results.data);
        },
        error: () => {
          setErrors([{ row: 0, message: 'Failed to parse CSV file' }]);
          setStep('review');
        },
      });
    } catch (err) {
      setErrors([{ row: 0, message: 'Failed to load CSV parser' }]);
      setStep('review');
    }
  };

  const validateCSV = (data) => {
    const errs = [];
    const valid = [];

    data.forEach((row, idx) => {
      const rowNum = idx + 2; // +2 for 1-indexed + header row
      const rowErrors = [];

      if (!row.item_name?.trim()) rowErrors.push('Missing item_name');
      if (!row.type?.trim() || !VALID_TYPES.includes(row.type.trim().toLowerCase())) {
        rowErrors.push(`Invalid type "${row.type}". Valid: ${VALID_TYPES.join(', ')}`);
      }
      if (!row.price || isNaN(parseFloat(row.price)) || parseFloat(row.price) <= 0) {
        rowErrors.push('Invalid price');
      }

      // Occasions
      const occasions = (row.occasion || '').split('|').map(s => s.trim().toLowerCase()).filter(Boolean);
      const invalidOccasions = occasions.filter(o => !VALID_OCCASIONS.includes(o));
      if (occasions.length === 0) rowErrors.push('At least one occasion required');
      if (invalidOccasions.length > 0) rowErrors.push(`Invalid occasions: ${invalidOccasions.join(', ')}`);

      // Sizes
      const sizes = (row.sizes || '').split('|').map(s => s.trim()).filter(Boolean);
      const invalidSizes = sizes.filter(s => !VALID_SIZES.includes(s));
      if (sizes.length === 0) rowErrors.push('At least one size required');
      if (invalidSizes.length > 0) rowErrors.push(`Invalid sizes: ${invalidSizes.join(', ')}`);

      // Colours
      const colourParts = (row.colours || '').split('|').map(s => s.trim()).filter(Boolean);
      if (colourParts.length === 0) rowErrors.push('At least one colour required');
      const parsedColours = [];
      colourParts.forEach(cp => {
        const match = cp.match(/^(.+):([#]?[0-9A-Fa-f]{6})$/);
        if (!match) {
          rowErrors.push(`Invalid colour format "${cp}". Use "Name:#HEXCODE"`);
        } else {
          parsedColours.push({ name: match[1].trim(), hex: match[2].startsWith('#') ? match[2] : `#${match[2]}` });
        }
      });

      if (rowErrors.length > 0) {
        errs.push({ row: rowNum, message: rowErrors.join('; ') });
      } else {
        valid.push({
          ...row,
          type: row.type.trim().toLowerCase(),
          occasions,
          sizes,
          colours: parsedColours,
          price: parseFloat(row.price),
        });
      }
    });

    setErrors(errs);
    setValidRows(valid);
    setCsvData(data);
    setStep('review');
  };

  const handleImport = () => {
    setStep('importing');
    let imported = 0;

    validRows.forEach(row => {
      const colourSizeVariants = [];
      row.colours.forEach(colour => {
        row.sizes.forEach(size => {
          colourSizeVariants.push({
            colour_name: colour.name,
            colour_hex: colour.hex,
            size,
            image_url: `https://picsum.photos/seed/${colour.name.replace(/\s/g, '')}-${size}/400/500`,
          });
        });
      });

      DS.addItem({
        name: row.item_name.trim(),
        type: row.type,
        occasions: row.occasions,
        price: row.price,
        fabric: (row.fabric || '').trim(),
        godown_number: (row.godown_number || '').trim(),
        rack_number: (row.rack_number || '').trim(),
        shelf: (row.shelf || '').trim(),
        internal_notes: (row.internal_notes || '').trim(),
        colourSizeVariants,
      });
      imported++;
    });

    setImportResults({ imported, skipped: errors.length });
    setStep('done');
  };

  const reset = () => {
    setStep('upload');
    setCsvData([]);
    setErrors([]);
    setValidRows([]);
    setImportResults(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bulk Upload</h1>
          <p className="text-gray-500 mt-1">Upload multiple items at once using a CSV file</p>
        </div>

        {/* Step: Upload */}
        {step === 'upload' && (
          <div className="space-y-6 animate-fade-in">
            {/* Template */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Step 1: Download Template</h2>
              <p className="text-gray-500 text-sm mb-4">Download the CSV template, fill in your item data, then upload below.</p>
              <button onClick={downloadTemplate} className="btn-secondary text-sm">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download CSV Template
              </button>
            </div>

            {/* Upload */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Step 2: Upload CSV</h2>
              <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-brand-400 hover:bg-brand-50/50 transition-all">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-600 font-medium">Click to upload CSV</p>
                <p className="text-gray-400 text-sm mt-1">or drag and drop</p>
              </label>
            </div>

            {/* Format guide */}
            <div className="bg-brand-50 rounded-2xl border border-brand-100 p-6">
              <h3 className="font-bold text-brand-900 mb-3">CSV Format Guide</h3>
              <div className="space-y-2 text-sm text-brand-800">
                <p><strong>occasion:</strong> pipe-separated — <code className="bg-brand-100 px-1 rounded">casual|festive|party</code></p>
                <p><strong>sizes:</strong> pipe-separated — <code className="bg-brand-100 px-1 rounded">S|M|L|XL</code></p>
                <p><strong>colours:</strong> pipe-separated as Name:#Hex — <code className="bg-brand-100 px-1 rounded">Peach:#F4A261|Navy:#264653</code></p>
              </div>
            </div>
          </div>
        )}

        {/* Step: Validating */}
        {step === 'validating' && (
          <div className="text-center py-16 animate-fade-in">
            <svg className="w-12 h-12 animate-spin text-brand-500 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-gray-600 font-medium">Validating CSV...</p>
          </div>
        )}

        {/* Step: Review */}
        {step === 'review' && (
          <div className="space-y-6 animate-fade-in">
            {/* Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Validation Results</h2>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-600">{validRows.length}</p>
                  <p className="text-sm text-gray-500">Valid rows</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-500">{errors.length}</p>
                  <p className="text-sm text-gray-500">Errors (skipped)</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-400">{csvData.length}</p>
                  <p className="text-sm text-gray-500">Total rows</p>
                </div>
              </div>
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-red-50 rounded-2xl border border-red-100 p-6">
                <h3 className="font-bold text-red-900 mb-3">Errors</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {errors.map((err, idx) => (
                    <div key={idx} className="text-sm text-red-700">
                      <span className="font-medium">Row {err.row}:</span> {err.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              {validRows.length > 0 && (
                <button onClick={handleImport} className="btn-primary">
                  Import {validRows.length} Item{validRows.length !== 1 ? 's' : ''}
                </button>
              )}
              <button onClick={reset} className="btn-secondary">
                Upload Different File
              </button>
            </div>
          </div>
        )}

        {/* Step: Importing */}
        {step === 'importing' && (
          <div className="text-center py-16 animate-fade-in">
            <svg className="w-12 h-12 animate-spin text-brand-500 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-gray-600 font-medium">Importing items...</p>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && importResults && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Import Complete</h2>
            <p className="text-gray-500 mb-1">{importResults.imported} items imported successfully</p>
            {importResults.skipped > 0 && (
              <p className="text-amber-600 text-sm">{importResults.skipped} rows skipped due to errors</p>
            )}
            <div className="flex justify-center gap-4 mt-6">
              <button onClick={reset} className="btn-secondary">Upload More</button>
              <a href="/admin/inventory" className="btn-primary">View Inventory</a>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
