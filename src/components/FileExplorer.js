import React, { useState, useEffect } from 'react';
import {
    Box,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    IconButton,
    Collapse,
    Typography,
    Menu,
    MenuItem,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Tooltip
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

// Helper function to get basename in frontend
const getBasename = (filePath) => {
    return filePath.split('/').pop();
};

const FileExplorer = ({ onFileSelect }) => {
    const [files, setFiles] = useState([]);
    const [currentPath, setCurrentPath] = useState('');
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const [selectedFile, setSelectedFile] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [contextMenuFile, setContextMenuFile] = useState(null);
    const [newItemName, setNewItemName] = useState('');
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newItemType, setNewItemType] = useState('file');
    const [loadingFolders, setLoadingFolders] = useState(new Set());

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async (path = currentPath) => {
        try {
            console.log('Fetching files for path:', path); // Debug log
            const response = await fetch(`${process.env.REACT_APP_API_URL}/files/list?path=${encodeURIComponent(path)}`);
            if (!response.ok) {
                throw new Error('Failed to fetch files');
            }
            const data = await response.json();
            console.log('Received data:', data); // Debug log

            if (path === '') {
                setFiles(data);
            } else {
                setFiles(prevFiles => {
                    const newFiles = [...prevFiles];
                    const updateFileTree = (files, targetPath) => {
                        for (let i = 0; i < files.length; i++) {
                            if (files[i].path === targetPath) {
                                files[i].children = data;
                                return true;
                            }
                            if (files[i].children) {
                                if (updateFileTree(files[i].children, targetPath)) {
                                    return true;
                                }
                            }
                        }
                        return false;
                    };
                    updateFileTree(newFiles, path);
                    return newFiles;
                });
            }
        } catch (error) {
            console.error('Error fetching files:', error);
        } finally {
            setLoadingFolders(prev => {
                const newSet = new Set(prev);
                newSet.delete(path);
                return newSet;
            });
        }
    };

    const handleFileClick = async (file) => {
        if (file.type === 'directory') {
            const newExpandedFolders = new Set(expandedFolders);
            if (newExpandedFolders.has(file.path)) {
                newExpandedFolders.delete(file.path);
                setExpandedFolders(newExpandedFolders);
            } else {
                newExpandedFolders.add(file.path);
                setExpandedFolders(newExpandedFolders);

                if (!file.children && !loadingFolders.has(file.path)) {
                    setLoadingFolders(prev => new Set(prev).add(file.path));
                    await fetchFiles(file.path);
                }
            }
        } else {
            try {
                console.log('Reading file:', file.path); // Debug log
                const fullPath = 'workspace/' + file.path;
                const response = await fetch(`${process.env.REACT_APP_API_URL}/files/read?path=${encodeURIComponent(fullPath)}`);
                if (!response.ok) {
                    throw new Error('Failed to read file');
                }
                const data = await response.json();
                console.log('File content received:', data.content.length, 'characters'); // Debug log

                // Update selected file and pass content to editor
                const fileWithContent = {
                    ...file,
                    content: data.content,
                    name: getBasename(file.path)
                };
                setSelectedFile(fileWithContent);
                onFileSelect(fileWithContent);
            } catch (error) {
                console.error('Error reading file:', error);
            }
        }
    };

    const handleContextMenu = (event, file) => {
        event.preventDefault();
        setContextMenuFile(file);
        setContextMenu({
            x: event.clientX,
            y: event.clientY
        });
    };

    const handleCreateNew = async () => {
        if (!newItemName) return;

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/files/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    path: currentPath,
                    name: newItemName,
                    type: newItemType
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create new item');
            }

            setIsCreatingNew(false);
            setNewItemName('');
            await fetchFiles(currentPath);
        } catch (error) {
            console.error('Error creating new item:', error);
        }
    };

    const handleDelete = async () => {
        if (!contextMenuFile) return;

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/files/delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    path: contextMenuFile.path
                })
            });

            if (!response.ok) {
                throw new Error('Failed to delete item');
            }

            setContextMenu(null);
            await fetchFiles(currentPath);
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    const renderFileItem = (file, level = 0) => {
        const isExpanded = expandedFolders.has(file.path);
        const hasChildren = file.children && file.children.length > 0;
        const isSelected = selectedFile && selectedFile.path === file.path;
        const isLoading = loadingFolders.has(file.path);

        return (
            <div key={file.path}>
                <ListItem
                    button
                    onClick={() => handleFileClick(file)}
                    onContextMenu={(e) => handleContextMenu(e, file)}
                    sx={{
                        pl: level * 2 + 1,
                        '&:hover': {
                            bgcolor: 'action.hover',
                        },
                        bgcolor: isSelected ? 'action.selected' : 'transparent',
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                        {file.type === 'directory' ? (
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleFileClick(file);
                                }}
                            >
                                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                        ) : null}
                    </ListItemIcon>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                        {file.type === 'directory' ? (
                            isExpanded ? <FolderOpenIcon /> : <FolderIcon />
                        ) : (
                            <InsertDriveFileIcon />
                        )}
                    </ListItemIcon>
                    <ListItemText
                        primary={file.name}
                        primaryTypographyProps={{
                            sx: { fontSize: '0.9rem' }
                        }}
                    />
                    {isLoading && (
                        <Typography variant="caption" color="text.secondary">
                            Loading...
                        </Typography>
                    )}
                </ListItem>
                {isExpanded && file.children && (
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            {file.children.map(child => renderFileItem(child, level + 1))}
                        </List>
                    </Collapse>
                )}
            </div>
        );
    };

    return (
        <Box sx={{ width: '100%', bgcolor: 'background.paper', height: '100%', overflow: 'auto' }}>
            <Typography variant="subtitle2" sx={{ p: 1, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
                File Explorer
            </Typography>
            <List>
                {files.map(file => renderFileItem(file))}
            </List>
            <Menu
                open={contextMenu !== null}
                onClose={() => setContextMenu(null)}
                anchorReference="anchorPosition"
                anchorPosition={
                    contextMenu !== null
                        ? { top: contextMenu.y, left: contextMenu.x }
                        : undefined
                }
            >
                <MenuItem onClick={handleDelete}>
                    <DeleteIcon sx={{ mr: 1 }} /> Delete
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default FileExplorer; 