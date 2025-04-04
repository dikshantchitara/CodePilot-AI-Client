import React, { useState, useEffect } from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme, IconButton, Tooltip } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import FolderIcon from '@mui/icons-material/Folder';
import ChatIcon from '@mui/icons-material/Chat';
import TerminalIcon from '@mui/icons-material/Terminal';
import CodeEditor from './components/CodeEditor';
import AIPrompt from './components/AIPrompt';
import FileExplorer from './components/FileExplorer';
import Terminal from './components/Terminal';
import './App.css';



//app.js code comment 
const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#1e1e1e',
      paper: '#252526',
    },
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
  },
});

function App() {
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileStructure, setFileStructure] = useState([]);

  const fetchFileStructure = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/files/list`);
      const data = await response.json();
      setFileStructure(data);
    } catch (error) {
      console.error('Error fetching file structure:', error);
    }
  };

  useEffect(() => {
    fetchFileStructure();
  }, []);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  const handleAIPrompt = async (prompt) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/process-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: selectedFile?.content || '',
          prompt: prompt,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process prompt');
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error processing prompt:', error);
      throw error;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {/* Activity Bar */}
        <Box sx={{
          width: '48px',
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 1
        }}>
          <Tooltip title="Explorer" placement="right">
            <IconButton
              onClick={() => setShowFileExplorer(!showFileExplorer)}
              color={showFileExplorer ? 'primary' : 'default'}
              sx={{ mb: 1 }}
            >
              <FolderIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="AI Assistant" placement="right">
            <IconButton
              onClick={() => setShowAIPanel(!showAIPanel)}
              color={showAIPanel ? 'primary' : 'default'}
              sx={{ mb: 1 }}
            >
              <ChatIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Terminal" placement="right">
            <IconButton
              onClick={() => setShowTerminal(!showTerminal)}
              color={showTerminal ? 'primary' : 'default'}
            >
              <TerminalIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* File Explorer */}
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transition: 'width 0.3s',
          width: showFileExplorer ? '250px' : '0px',
          overflow: 'hidden',
          borderRight: '1px solid',
          borderColor: 'divider'
        }}>
          <FileExplorer
            fileStructure={fileStructure}
            onFileSelect={handleFileSelect}
          />
        </Box>

        {/* Main Content */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Code Editor */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <CodeEditor file={selectedFile} />
          </Box>

          {/* Terminal */}
          <Box sx={{
            height: showTerminal ? '300px' : '0px',
            transition: 'height 0.3s',
            overflow: 'hidden',
            borderTop: '1px solid',
            borderColor: 'divider'
          }}>
            <Terminal onFileStructureUpdate={fetchFileStructure} />
          </Box>
        </Box>

        {/* AI Panel */}
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transition: 'width 0.3s',
          width: showAIPanel ? '300px' : '0px',
          overflow: 'hidden',
          borderLeft: '1px solid',
          borderColor: 'divider'
        }}>
          <AIPrompt onPrompt={handleAIPrompt} />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
