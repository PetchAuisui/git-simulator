import { useState, useEffect, useCallback } from 'react';
import { fileApi } from '../api';
import { Folder, FolderOpen, File as FileIcon, Plus, Trash2, Edit2, FilePlus, FolderPlus, MoreVertical, X, Check, Terminal as TerminalIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for joining paths
const joinPath = (parent, child) => parent ? `${parent}/${child}` : child;

// Component to render individual items recursively if needed
// For simplicity we use a flat recursive structure
const FileTreeItem = ({ item, parentPath, onRefresh, onFileChange, onMove, onOpenTerminal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(item.name);
  const [isDragOver, setIsDragOver] = useState(false);

  // Load children when a folder is opened
  const loadChildren = async () => {
    if (!item.isDirectory) return;
    try {
      const { data } = await fileApi.getTree(item.path);
      setChildren(data.files);
    } catch (e) {
      toast.error('Failed to load folder contents');
    }
  };

  useEffect(() => {
    if (isOpen && item.isDirectory) {
      loadChildren();
    }
  }, [isOpen, item.path]);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (item.isDirectory) {
        setIsOpen(!isOpen);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete ${item.name}?`)) {
      try {
        await fileApi.delete(item.path);
        onRefresh();
        onFileChange();
        toast.success(`Deleted ${item.name}`);
      } catch (err) {
        toast.error('Delete failed');
      }
    }
  };

  const submitRename = async () => {
    if (renameValue === item.name) {
      setIsRenaming(false);
      return;
    }
    try {
      const newPath = joinPath(parentPath, renameValue);
      await fileApi.rename(item.path, newPath);
      setIsRenaming(false);
      onRefresh();
      onFileChange();
      toast.success(`Renamed to ${renameValue}`);
    } catch (err) {
      toast.error('Rename failed');
    }
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData('sourcePath', item.path);
    e.stopPropagation();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (item.isDirectory) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    e.stopPropagation();
    if (!item.isDirectory) return;
    const sourcePath = e.dataTransfer.getData('sourcePath');
    if (sourcePath && sourcePath !== item.path) {
      onMove(sourcePath, item.path);
    }
  };

  return (
    <div className="select-none h-full">
      <div 
        draggable={!isRenaming}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={twMerge(
          "flex items-center group px-1 py-1.5 hover:bg-slate-800 rounded-md cursor-pointer transition-colors text-sm",
          isOpen && item.isDirectory && "bg-slate-800/50",
          isDragOver && "bg-blue-900/50 border border-blue-500"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleToggle}
      >
        {/* Icon */}
        <span className="mr-2 text-slate-400">
          {item.isDirectory ? (
            isOpen ? <FolderOpen size={16} className="text-blue-400" /> : <Folder size={16} className="text-blue-400" />
          ) : (
            <FileIcon size={16} />
          )}
        </span>

        {/* Name / Rename Input */}
        {isRenaming ? (
          <div className="flex-1 flex gap-1 items-center" onClick={e => e.stopPropagation()}>
            <input 
              autoFocus
              className="flex-1 bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-slate-200 outline-none focus:border-blue-500 text-sm"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitRename()}
            />
            <button onClick={submitRename} className="p-1 hover:text-green-400"><Check size={14}/></button>
            <button onClick={() => setIsRenaming(false)} className="p-1 hover:text-red-400"><X size={14}/></button>
          </div>
        ) : (
          <span className="flex-1 truncate text-slate-300 group-hover:text-slate-100">{item.name}</span>
        )}

        {/* Actions */}
        {!isRenaming && isHovered && (
          <div className="flex gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
            {item.isDirectory && (
              <button title="Open Terminal" className="p-1 text-slate-500 hover:text-green-400 hover:bg-slate-700 rounded" onClick={() => onOpenTerminal && onOpenTerminal(item.path)}>
                <TerminalIcon size={14} />
              </button>
            )}
            <button title="Rename" className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded" onClick={() => setIsRenaming(true)}>
              <Edit2 size={14} />
            </button>
            <button title="Delete" className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded" onClick={handleDelete}>
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {isOpen && item.isDirectory && (
        <div className="pl-4 border-l border-slate-800 ml-1.5 mt-1 pointer-events-auto">
          {children.length === 0 ? (
            <div className="text-xs text-slate-600 py-1 pl-2 italic">Empty folder</div>
          ) : (
            children.map(child => (
              <FileTreeItem 
                key={child.path} 
                item={child} 
                parentPath={item.path} 
                onRefresh={loadChildren} 
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


export default function FileExplorer({ onFileChange, onOpenTerminal }) {
  const [rootFiles, setRootFiles] = useState([]);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newTargetName, setNewTargetName] = useState('');
  const [isDragOverRoot, setIsDragOverRoot] = useState(false);

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

  const loadRoot = useCallback(async () => {
    try {
      const { data } = await fileApi.getTree();
      setRootFiles(data.files);
    } catch (e) {
      // toast.error('Failed to load file tree');
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadRoot();
  }, [loadRoot]);

  const handleCreate = async (isDirectory) => {
    if (!newTargetName.trim()) {
      setIsCreatingFile(false);
      setIsCreatingFolder(false);
      return;
    }
    try {
      await fileApi.createFile(newTargetName, isDirectory);
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
      <div className="flex gap-2 mb-4 justify-end">
        <button 
          title="New File"
          className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
          onClick={() => { setIsCreatingFile(true); setIsCreatingFolder(false); setNewTargetName(''); }}
        >
          <FilePlus size={16} />
        </button>
        <button 
          title="New Folder"
          className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
          onClick={() => { setIsCreatingFolder(true); setIsCreatingFile(false); setNewTargetName(''); }}
        >
          <FolderPlus size={16} />
        </button>
        <button 
          title="Refresh"
          className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
          onClick={loadRoot}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        </button>
      </div>

      {/* Root level creation input */}
      {(isCreatingFile || isCreatingFolder) && (
        <div className="flex items-center gap-2 mb-2 px-1">
          {isCreatingFolder ? <Folder size={16} className="text-blue-400"/> : <FileIcon size={16} className="text-slate-400"/>}
          <input 
            autoFocus
            placeholder={isCreatingFolder ? "Folder name..." : "File name..."}
            className="flex-1 bg-slate-950 border border-blue-500 rounded px-2 py-1 text-slate-200 outline-none text-sm shadow-[0_0_10px_rgba(59,130,246,0.2)]"
            value={newTargetName}
            onChange={(e) => setNewTargetName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate(isCreatingFolder);
              if (e.key === 'Escape') { setIsCreatingFile(false); setIsCreatingFolder(false); }
            }}
            onBlur={() => handleCreate(isCreatingFolder)}
          />
        </div>
      )}

      {/* Tree */}
      <div 
        className={twMerge("flex-1 p-2 border border-transparent rounded-lg", isDragOverRoot && "bg-blue-900/20 border-blue-500 border-dashed")}
        onDragOver={e => {
            e.preventDefault();
            setIsDragOverRoot(true);
        }}
        onDragLeave={() => setIsDragOverRoot(false)}
        onDrop={e => {
            e.preventDefault();
            setIsDragOverRoot(false);
            const sourcePath = e.dataTransfer.getData('sourcePath');
            // Move to root only if it has a parent directory
            if (sourcePath && sourcePath.includes('/')) {
                handleMove(sourcePath, '');
            }
        }}
      >
        {rootFiles.length === 0 && !isCreatingFile && !isCreatingFolder ? (
           <div className="text-center text-slate-600 text-sm mt-10 italic pointer-events-none">
             Workspace is empty.<br/>Create a file to get started.
           </div>
        ) : (
          rootFiles.map(file => (
            <FileTreeItem 
              key={file.path} 
              item={file} 
              parentPath="" 
              onRefresh={loadRoot} 
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
