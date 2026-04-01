import React, { useState, useEffect } from 'react';

const FileEditor = ({
  repoName,
  files,
  selectedFile,
  fileContent,
  onFileSelect,
  onSaveFile,
  onCommit,
}) => {
  const [editorContent, setEditorContent] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [success, setSuccess] = useState('');

  // Update editor content when selectedFile or fileContent changes
  useEffect(() => {
    setEditorContent(fileContent);
  }, [fileContent, selectedFile]);

  const handleSaveFile = async () => {
    setSaving(true);
    try {
      await onSaveFile(editorContent);
      setSuccess('File saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      alert('Please enter a commit message');
      return;
    }
    setCommitting(true);
    try {
      await onCommit(commitMessage);
      setCommitMessage('');
      setSuccess('Committed successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Commit failed', err);
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '20px' }}>
      {/* File Browser */}
      <div className="card" style={{ height: 'fit-content' }}>
        <h3>Files</h3>
        <div className="file-tree">
          {files.length === 0 ? (
            <p style={{ color: '#999', fontSize: '12px' }}>No files</p>
          ) : (
            files.map((file) => (
              <div
                key={file}
                className="file-item"
                onClick={() => onFileSelect(file)}
                style={{
                  fontWeight: file === selectedFile ? 'bold' : 'normal',
                  color: file === selectedFile ? '#007bff' : '#0066cc',
                  padding: '8px',
                  borderRadius: '4px',
                  backgroundColor: file === selectedFile ? '#f0f7ff' : 'transparent',
                }}
              >
                📄 {file}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="card">
        {success && <div className="success">{success}</div>}

        {selectedFile ? (
          <>
            <h3>{selectedFile}</h3>
            <textarea
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              style={{
                width: '100%',
                height: '400px',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontFamily: "Monaco, 'Courier New', monospace",
                fontSize: '13px',
                marginBottom: '15px',
              }}
            />
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button onClick={handleSaveFile} className="primary" disabled={saving}>
                {saving ? 'Saving...' : '💾 Save File'}
              </button>
            </div>
          </>
        ) : (
          <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>
            Select a file to edit
          </p>
        )}

        <div style={{ borderTop: '1px solid #ddd', paddingTop: '20px' }}>
          <h3>Commit Changes</h3>
          <textarea
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Enter commit message..."
            style={{
              width: '100%',
              height: '100px',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              marginBottom: '10px',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={handleCommit}
            className="primary"
            disabled={committing || !commitMessage.trim()}
          >
            {committing ? 'Committing...' : '✓ Commit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileEditor;
