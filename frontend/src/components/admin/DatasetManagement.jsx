import { useState, useEffect, useCallback } from 'react';

/**
 * Dataset Management Component
 * 
 * Features:
 * - Upload datasets (JSONL format) with drag-and-drop
 * - Browse and preview existing datasets by category
 * - Validate dataset format and quality
 * - Inline editing of dataset entries
 * - Dataset version control
 */
export default function DatasetManagement() {
  const [datasets, setDatasets] = useState([]);
  const [datasetCategories, setDatasetCategories] = useState({});
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [uploadCategory, setUploadCategory] = useState('custom');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [validationResults, setValidationResults] = useState(null);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const response = await fetch('/api/admin/datasets');
      if (response.ok) {
        const data = await response.json();
        setDatasets(data.datasets || []);
        setDatasetCategories(data.categories || {});
        setAvailableCategories(data.availableCategories || ['politik', 'sverige', 'oneseek', 'custom']);
      }
    } catch (error) {
      console.error('Error fetching datasets:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Filter datasets by selected category
  const getFilteredDatasets = () => {
    if (selectedCategory === 'all') {
      return datasets;
    }
    return datasets.filter(d => d.category === selectedCategory);
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleFileUpload(files[0]);
    }
  }, [uploadCategory]);

  const handleFileInput = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file.name.endsWith('.jsonl') && !file.name.endsWith('.json')) {
      alert('Please upload a JSONL or JSON file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('dataset', file);

    try {
      // Include category in the upload URL
      const response = await fetch(`/api/admin/datasets/upload?category=${uploadCategory}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setValidationResults(data.validation);
        await fetchDatasets();
        
        // Show naming convention suggestion if provided
        let message = `Dataset uploaded to '${uploadCategory}' category! ${data.validation.validEntries} valid entries.`;
        if (data.suggestedName && data.suggestedName !== file.name) {
          message += `\n\nNaming Convention: ${data.namingConvention}\nSuggested name: ${data.suggestedName}`;
        }
        alert(message);
      } else {
        alert(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error uploading dataset:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const validateDataset = async (datasetId) => {
    try {
      const response = await fetch(`/api/admin/datasets/${encodeURIComponent(datasetId)}/validate`);
      const data = await response.json();
      setValidationResults(data);
    } catch (error) {
      console.error('Error validating dataset:', error);
    }
  };

  const deleteDataset = async (datasetId) => {
    if (!confirm('Are you sure you want to delete this dataset?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/datasets/${encodeURIComponent(datasetId)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchDatasets();
        if (selectedDataset?.id === datasetId) {
          setSelectedDataset(null);
        }
      }
    } catch (error) {
      console.error('Error deleting dataset:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#666] font-mono text-sm">Loading datasets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="border border-[#2a2a2a] bg-[#111] p-6 rounded">
        <h2 className="text-[#eee] font-mono text-lg mb-4">Upload Dataset</h2>
        
        {/* Category Selection for Upload */}
        <div className="mb-4">
          <label className="block text-[#888] font-mono text-sm mb-2">
            Target Category
          </label>
          <select
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value)}
            className="bg-[#0a0a0a] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444]"
          >
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
          <p className="text-[#555] font-mono text-xs mt-1">
            Select the category folder where the dataset will be stored
          </p>
        </div>
        
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-[#666] bg-[#1a1a1a]'
              : 'border-[#2a2a2a] hover:border-[#444]'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="space-y-3">
              <div className="text-[#888] font-mono text-sm">Uploading to {uploadCategory}/...</div>
              <div className="w-full h-1 bg-[#2a2a2a] rounded overflow-hidden">
                <div className="h-full bg-[#666] animate-pulse"></div>
              </div>
            </div>
          ) : (
            <>
              <div className="text-4xl mb-4">📁</div>
              <div className="text-[#888] font-mono text-sm mb-2">
                Drag and drop JSONL file here
              </div>
              <div className="text-[#666] font-mono text-xs mb-4">or</div>
              <label className="inline-block px-4 py-2 border border-[#2a2a2a] text-[#888] text-sm font-mono hover:bg-[#1a1a1a] transition-colors cursor-pointer">
                Browse Files
                <input
                  type="file"
                  accept=".jsonl,.json"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </>
          )}
        </div>

        {validationResults && (
          <div className="mt-4 p-4 border border-[#2a2a2a] rounded bg-[#0a0a0a]">
            <h3 className="text-[#888] font-mono text-sm mb-2">Validation Results</h3>
            <div className="space-y-1 text-xs font-mono">
              <div className="text-[#666]">
                Valid entries: <span className="text-[#888]">{validationResults.validEntries}</span>
              </div>
              <div className="text-[#666]">
                Invalid entries: <span className="text-[#888]">{validationResults.invalidEntries}</span>
              </div>
              {validationResults.errors && validationResults.errors.length > 0 && (
                <div className="text-[#666] mt-2">
                  Errors: {validationResults.errors.join(', ')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dataset List */}
      <div className="border border-[#2a2a2a] bg-[#111] p-6 rounded">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[#eee] font-mono text-lg">Existing Datasets</h2>
          
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#0a0a0a] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444]"
          >
            <option value="all">All Categories ({datasets.length})</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)} ({datasetCategories[cat]?.length || 0})
              </option>
            ))}
          </select>
        </div>
        
        {getFilteredDatasets().length === 0 ? (
          <div className="text-[#666] font-mono text-sm text-center py-8">
            {selectedCategory === 'all' ? 'No datasets uploaded yet' : `No datasets in '${selectedCategory}' category`}
          </div>
        ) : (
          <div className="space-y-3">
            {getFilteredDatasets().map((dataset) => (
              <div
                key={dataset.id}
                className="border border-[#2a2a2a] p-4 rounded hover:border-[#444] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-[#eee] font-mono text-sm mb-1 flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] bg-[#1a1a1a] border border-[#2a2a2a] text-[#666] rounded">
                        {dataset.category || 'root'}
                      </span>
                      {dataset.name}
                    </div>
                    <div className="text-[#666] font-mono text-xs space-x-4">
                      <span>{dataset.entries} entries</span>
                      <span>{new Date(dataset.uploadedAt).toLocaleDateString()}</span>
                      <span>{(dataset.size / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedDataset(dataset)}
                      className="px-3 py-1 border border-[#2a2a2a] text-[#888] text-xs font-mono hover:bg-[#1a1a1a] transition-colors"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => validateDataset(dataset.id)}
                      className="px-3 py-1 border border-[#2a2a2a] text-[#888] text-xs font-mono hover:bg-[#1a1a1a] transition-colors"
                    >
                      Validate
                    </button>
                    <button
                      onClick={() => deleteDataset(dataset.id)}
                      className="px-3 py-1 border border-[#2a2a2a] text-[#666] text-xs font-mono hover:bg-[#1a1a1a] hover:text-[#888] transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dataset Preview Modal */}
      {selectedDataset && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
          <div className="bg-[#111] border border-[#2a2a2a] rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
              <div>
                <h3 className="text-[#eee] font-mono text-lg">{selectedDataset.name}</h3>
                <span className="text-[#666] font-mono text-xs">Category: {selectedDataset.category || 'root'}</span>
              </div>
              <button
                onClick={() => setSelectedDataset(null)}
                className="text-[#666] hover:text-[#888] text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <pre className="text-[#888] font-mono text-xs whitespace-pre-wrap">
                {JSON.stringify(selectedDataset.preview || selectedDataset, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
