import React, { useState, useEffect, useCallback } from 'react';
import { Editor } from '@monaco-editor/react';
import { Box, Typography, Button, Snackbar, Alert, Switch, FormControlLabel } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import AutoSaveIcon from '@mui/icons-material/AutoAwesome';

const CodeEditor = ({ file, onChange }) => {
    const [editorContent, setEditorContent] = useState('');
    const [language, setLanguage] = useState('plaintext');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);
    const [autoSave, setAutoSave] = useState(true);
    const [lastSaved, setLastSaved] = useState(null);

    // Auto-save timer
    useEffect(() => {
        let timer;
        if (autoSave && editorContent) {
            timer = setTimeout(() => {
                handleSave();
            }, 3000); // Auto-save after 3 seconds of inactivity
        }
        return () => clearTimeout(timer);
    }, [editorContent, autoSave]);

    // Enhanced language detection
    useEffect(() => {
        if (file?.name) {
            const extension = file.name.split('.').pop().toLowerCase();
            const languageMap = {
                // JavaScript and TypeScript
                'js': 'javascript',
                'jsx': 'javascript',
                'ts': 'typescript',
                'tsx': 'typescript',
                // Web
                'html': 'html',
                'css': 'css',
                'scss': 'scss',
                'less': 'less',
                // Data formats
                'json': 'json',
                'yaml': 'yaml',
                'yml': 'yaml',
                // Documentation
                'md': 'markdown',
                // Python
                'py': 'python',
                // Java
                'java': 'java',
                // C/C++
                'c': 'c',
                'cpp': 'cpp',
                'h': 'cpp',
                'hpp': 'cpp',
                // C#
                'cs': 'csharp',
                // PHP
                'php': 'php',
                // Ruby
                'rb': 'ruby',
                // Go
                'go': 'go',
                // Rust
                'rs': 'rust',
                // Shell scripts
                'sh': 'shell',
                'bash': 'shell',
                // Configuration
                'env': 'plaintext',
                'gitignore': 'plaintext',
                'dockerignore': 'plaintext',
                'conf': 'ini',
                'ini': 'ini',
                // XML
                'xml': 'xml',
                'svg': 'xml',
                // SQL
                'sql': 'sql'
            };
            setLanguage(languageMap[extension] || 'plaintext');
            setEditorContent(file.content || '');
        }
    }, [file]);

    const handleEditorChange = (value) => {
        setEditorContent(value);
        onChange?.(value);
    };

    const handleSave = async () => {
        if (!file?.path) return;

        setIsSaving(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/files/write`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    path: file.path,
                    content: editorContent
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save file');
            }

            setSaveStatus({ type: 'success', message: 'File saved successfully' });
            setLastSaved(new Date());
        } catch (error) {
            console.error('Error saving file:', error);
            setSaveStatus({ type: 'error', message: 'Failed to save file' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAutoSaveToggle = (event) => {
        setAutoSave(event.target.checked);
    };

    // Editor configuration
    const editorOptions = {
        minimap: { enabled: true },
        fontSize: 14,
        wordWrap: 'on',
        automaticLayout: true,
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        readOnly: false,
        cursorStyle: 'line',
        selectOnLineNumbers: true,
        rulers: [],
        folding: true,
        renderLineHighlight: 'all',
        matchBrackets: 'always',
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        formatOnPaste: true,
        formatOnType: true,
        suggestOnTriggerCharacters: true,
        tabSize: 2,
        insertSpaces: true,
        detectIndentation: true,
        renderWhitespace: 'selection',
        colorDecorators: true,
        bracketPairColorization: {
            enabled: true
        }
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{
                p: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper'
            }}>
                <Typography variant="subtitle1">
                    {file?.name || 'No file selected'} {language !== 'plaintext' && `(${language})`}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={autoSave}
                                onChange={handleAutoSaveToggle}
                                color="primary"
                            />
                        }
                        label="Auto-save"
                    />
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                </Box>
            </Box>
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
                <Editor
                    height="100%"
                    language={language}
                    value={editorContent}
                    onChange={handleEditorChange}
                    theme="vs-dark"
                    options={editorOptions}
                    loading={<Typography>Loading editor...</Typography>}
                />
            </Box>
            <Snackbar
                open={!!saveStatus}
                autoHideDuration={3000}
                onClose={() => setSaveStatus(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSaveStatus(null)}
                    severity={saveStatus?.type}
                    sx={{ width: '100%' }}
                >
                    {saveStatus?.message}
                </Alert>
            </Snackbar>
            {lastSaved && (
                <Typography
                    variant="caption"
                    sx={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        color: 'text.secondary'
                    }}
                >
                    Last saved: {lastSaved.toLocaleTimeString()}
                </Typography>
            )}
        </Box>
    );
};

export default CodeEditor; 