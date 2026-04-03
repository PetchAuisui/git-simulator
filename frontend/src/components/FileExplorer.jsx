import { useState, useEffect, useCallback } from 'react';
import { fileApi } from '../api';
import { Folder, FolderOpen, File as FileIcon, Trash2, Edit2, FilePlus, FolderPlus, X, Check, Terminal as TerminalIcon, ChevronRight, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { twMerge } from 'tailwind-merge';

// Helper for joining paths
const joinPath = (parent, child) => parent ? `${parent}/${child}` : child;

// Individual file/folder item (recursive)
const FileTreeItem = ({ item, depth = 0, onRefresh, onRootRefresh, onFileChange, onMove, onOpenTerminal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(item.name);
  const [isDragOver, setIsDragOver] = useState(false);

  // Inline creation state
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newName, setNewName] = useState('');

  const loadChildren = useCallback(async () => {
    if (!item.isDirectory) return;
    try {
      const { data } = await fileApi.getTree(item.path);
      setChildren(data.files);
    } catch (e) {
      console.error('Failed to load folder:', e);
    }
  }, [item.path, item.isDirectory]);

  useEffect(() => {
    if (isOpen && item.isDirectory) {
      loadChildren();
    }
  }, [isOpen, loadChildren]);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (item.isDirectory) setIsOpen(prev => !prev);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    try {
      await fileApi.delete(item.path);
      onRefresh();
      onFileChange();
      toast.success(`Deleted ${item.name}`);
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const submitRename = async () => {
    if (renameValue === item.name || !renameValue.trim()) {
      setIsRenaming(false);
      return;
    }
    const parentDir = item.path.includes('/') ? item.path.substring(0, item.path.lastIndexOf('/')) : '';
    const newPath = joinPath(parentDir, renameValue.trim());
    try {
      await fileApi.rename(item.path, newPath);
      setIsRenaming(false);
      onRefresh();
      onFileChange();
      toast.success(`Renamed to ${renameValue}`);
    } catch (err) {
      toast.error('Rename failed');
    }
  };

  // Create file/folder INSIDE this folder
  const handleCreate = async (isDirectory) => {
    if (!newName.trim()) {
      setIsCreatingFile(false);
      setIsCreatingFolder(false);
      return;
    }
    const targetPath = joinPath(item.path, newName.trim());
    try {
      await fileApi.createFile(targetPath, isDirectory);
      toast.success(`Created ${newName}`);
      setNewName('');
      setIsCreatingFile(false);
      setIsCreatingFolder(false);
      if (!isOpen) setIsOpen(true);
      await loadChildren();
      onFileChange();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Creation failed');
    }
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData('sourcePath', item.path);
    e.stopPropagation();
  };
  const handleDragOver = (e) => { e.preventDefault(); if (item.isDirectory) setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragOver(false);
    if (!item.isDirectory) return;
    const src = e.dataTransfer.getData('sourcePath');
    if (src && src !== item.path) onMove(src, item.path);
  };

  const indentPx = depth * 14;

  return (
    <div className="select-none">
      {/* Row */}
      <div
        draggable={!isRenaming}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleToggle}
        style={{ paddingLeft: `${indentPx + 4}px` }}
        className={twMerge(
          'flex items-center group py-1 pr-1 hover:bg-slate-800 rounded-md cursor-pointer transition-colors text-sm min-w-0',
          isOpen && item.isDirectory && 'bg-slate-800/40',
          isDragOver && 'bg-blue-900/50 border border-blue-500'
        )}
      >
        {/* Chevron for folders */}
        <span className="mr-1 text-slate-500 shrink-0 w-4 flex items-center justify-center">
          {item.isDirectory
            ? (isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />)
            : null}
        </span>

        {/* Icon */}
        <span className="mr-1.5 shrink-0">
          {item.isDirectory
            ? (isOpen ? <FolderOpen size={15} className="text-blue-400" /> : <Folder size={15} className="text-blue-400" />)
            : <FileIcon size={15} className="text-slate-400" />}
        </span>

        {/* Name / Rename */}
        {isRenaming ? (
          <div className="flex-1 flex gap-1 items-center min-w-0" onClick={e => e.stopPropagation()}>
            <input
              autoFocus
              className="flex-1 min-w-0 bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-slate-200 outline-none focus:border-blue-500 text-sm"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitRename(); if (e.key === 'Escape') setIsRenaming(false); }}
            />
            <button onClick={submitRename} className="p-1 hover:text-green-400 shrink-0"><Check size={13} /></button>
            <button onClick={() => setIsRenaming(false)} className="p-1 hover:text-red-400 shrink-0"><X size={13} /></button>
          </div>
        ) : (
          <span className="flex-1 truncate text-slate-300 group-hover:text-slate-100 min-w-0">{item.name}</span>
        )}

        {/* Hover actions */}
        {!isRenaming && isHovered && (
          <div className="flex gap-0.5 items-center ml-1 shrink-0" onClick={e => e.stopPropagation()}>
            {item.isDirectory && (
              <>
                <button title="New File" className="p-1 text-slate-500 hover:text-blue-400 hover:bg-slate-700 rounded"
                  onClick={() => { setIsCreatingFile(true); setIsCreatingFolder(false); setNewName(''); if (!isOpen) setIsOpen(true); }}>
                  <FilePlus size={12} />
                </button>
                <button title="New Folder" className="p-1 text-slate-500 hover:text-yellow-400 hover:bg-slate-700 rounded"
                  onClick={() => { setIsCreatingFolder(true); setIsCreatingFile(false); setNewName(''); if (!isOpen) setIsOpen(true); }}>
                  <FolderPlus size={12} />
                </button>
                <button title="Open Terminal" className="p-1 text-slate-500 hover:text-green-400 hover:bg-slate-700 rounded"
                  onClick={() => onOpenTerminal && onOpenTerminal(item.path)}>
                  <TerminalIcon size={12} />
                </button>
              </>
            )}
            <button title="Rename" className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded"
              onClick={() => setIsRenaming(true)}>
              <Edit2 size={12} />
            </button>
            <button title="Delete" className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded"
              onClick={handleDelete}>
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Children (when open) */}
      {isOpen && item.isDirectory && (
        <div>
          {/* Inline creation input inside this folder */}
          {(isCreatingFile || isCreatingFolder) && (
            <div
              style={{ paddingLeft: `${indentPx + 24}px` }}
              className="flex items-center gap-1.5 py-1 pr-2"
              onClick={e => e.stopPropagation()}
            >
              {isCreatingFolder
                ? <Folder size={14} className="text-blue-400 shrink-0" />
                : <FileIcon size={14} className="text-slate-400 shrink-0" />}
              <input
                autoFocus
                placeholder={isCreatingFolder ? 'Folder name...' : 'File name...'}
                className="flex-1 min-w-0 bg-slate-950 border border-blue-500 rounded px-1.5 py-0.5 text-slate-200 outline-none text-sm"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreate(isCreatingFolder);
                  if (e.key === 'Escape') { setIsCreatingFile(false); setIsCreatingFolder(false); }
                }}
                onBlur={() => { if (newName.trim()) handleCreate(isCreatingFolder); else { setIsCreatingFile(false); setIsCreatingFolder(false); } }}
              />
            </div>
          )}

          {children.length === 0 && !isCreatingFile && !isCreatingFolder ? (
            <div style={{ paddingLeft: `${indentPx + 24}px` }} className="py-1 text-xs text-slate-600 italic">
              Empty folder
            </div>
          ) : (
            children.map(child => (
              <FileTreeItem
                key={child.path}
                item={child}
                depth={depth + 1}
                onRefresh={loadChildren}
                onRootRefresh={onRootRefresh}
                onFileChange={onFileChange}
                onMove={onMove}
                onOpenTerminal={onOpenTerminal}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};


export default function FileExplorer({ onFileChange, onOpenTerminal, refreshKey }) {
  const [rootFiles, setRootFiles] = useState([]);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newTargetName, setNewTargetName] = useState('');
  const [isDragOverRoot, setIsDragOverRoot] = useState(false);

  const loadRoot = useCallback(async () => {
    try {
      const { data } = await fileApi.getTree();
      setRootFiles(data.files);
    } catch (e) {
      console.error('[FileExplorer] Failed to load file tree:', e);
    }
  }, []);

  const handleMove = async (sourcePath, targetPath) => {
    try {
      const fileName = sourcePath.split('/').pop() || sourcePath;
      const newPath = targetPath ? joinPath(targetPath, fileName) : fileName;
      await fileApi.rename(sourcePath, newPath);
      loadRoot();
      onFileChange();
      toast.success(`Moved ${fileName}`);
    } catch (err) {
      toast.error('Move failed: ' + (err.response?.data?.error || err.message));
    }
  };

  useEffect(() => { loadRoot(); }, [loadRoot]);

  // Auto-poll every 3 seconds
  useEffect(() => {
    const interval = setInterval(loadRoot, 3000);
    return () => clearInterval(interval);
  }, [loadRoot]);

  // Refresh when parent triggers (e.g. after commit)
  useEffect(() => {
    if (refreshKey > 0) loadRoot();
  }, [refreshKey, loadRoot]);

  const handleRootCreate = async (isDirectory) => {
    if (!newTargetName.trim()) {
      setIsCreatingFile(false);
      setIsCreatingFolder(false);
      return;
    }
    try {
      await fileApi.createFile(newTargetName.trim(), isDirectory);
      toast.success(`Created ${newTargetName}`);
      setNewTargetName('');
      setIsCreatingFile(false);
      setIsCreatingFolder(false);
      loadRoot();
      onFileChange();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Creation failed');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Top Actions */}
      <div className="flex gap-2 mb-3 justify-end px-2 pt-2">
        <button title="New File" onClick={() => { setIsCreatingFile(true); setIsCreatingFolder(false); setNewTargetName(''); }}
          className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded transition-colors">
          <FilePlus size={15} />
        </button>
        <button title="New Folder" onClick={() => { setIsCreatingFolder(true); setIsCreatingFile(false); setNewTargetName(''); }}
          className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded transition-colors">
          <FolderPlus size={15} />
        </button>
        <button title="Refresh" onClick={loadRoot}
          className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      </div>

      {/* Root-level inline creation */}
      {(isCreatingFile || isCreatingFolder) && (
        <div className="flex items-center gap-1.5 mb-2 px-3">
          {isCreatingFolder ? <Folder size={14} className="text-blue-400 shrink-0" /> : <FileIcon size={14} className="text-slate-400 shrink-0" />}
          <input
            autoFocus
            placeholder={isCreatingFolder ? 'Folder name...' : 'File name...'}
            className="flex-1 bg-slate-950 border border-blue-500 rounded px-2 py-1 text-slate-200 outline-none text-sm shadow-[0_0_10px_rgba(59,130,246,0.2)]"
            value={newTargetName}
            onChange={e => setNewTargetName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleRootCreate(isCreatingFolder);
              if (e.key === 'Escape') { setIsCreatingFile(false); setIsCreatingFolder(false); }
            }}
            onBlur={() => { if (newTargetName.trim()) handleRootCreate(isCreatingFolder); else { setIsCreatingFile(false); setIsCreatingFolder(false); } }}
          />
        </div>
      )}

      {/* Tree */}
      <div
        className={twMerge(
          'flex-1 overflow-auto px-1 pb-2 border border-transparent rounded-lg',
          isDragOverRoot && 'bg-blue-900/20 border-blue-500 border-dashed'
        )}
        onDragOver={e => { e.preventDefault(); setIsDragOverRoot(true); }}
        onDragLeave={() => setIsDragOverRoot(false)}
        onDrop={e => {
          e.preventDefault(); setIsDragOverRoot(false);
          const src = e.dataTransfer.getData('sourcePath');
          if (src && src.includes('/')) handleMove(src, '');
        }}
      >
        {rootFiles.length === 0 && !isCreatingFile && !isCreatingFolder ? (
          <div className="text-center text-slate-600 text-sm mt-10 italic pointer-events-none">
            Workspace is empty.<br />Create a file to get started.
          </div>
        ) : (
          rootFiles.map(file => (
            <FileTreeItem
              key={file.path}
              item={file}
              depth={0}
              onRefresh={loadRoot}
              onRootRefresh={loadRoot}
              onFileChange={onFileChange}
              onMove={handleMove}
              onOpenTerminal={onOpenTerminal}
            />
          ))
        )}
      </div>
    </div>
  );
}
