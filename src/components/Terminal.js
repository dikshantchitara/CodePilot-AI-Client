import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Paper, Typography, IconButton, Alert } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import StopIcon from '@mui/icons-material/Stop';
import ClearIcon from '@mui/icons-material/Clear';

const Terminal = ({ onFileStructureUpdate }) => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [commandStatus, setCommandStatus] = useState(null);
    const wsRef = useRef(null);
    const terminalRef = useRef(null);

    useEffect(() => {
        const ws = new WebSocket(process.env.REACT_APP_WS_URL || 'ws://localhost:5000');

        ws.onopen = () => {
            console.log('WebSocket Connected');
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            switch (data.type) {
                case 'output':
                    setOutput(prev => [...prev, {
                        type: 'output',
                        content: data.content,
                        command: data.command
                    }]);
                    break;

                case 'error':
                    setOutput(prev => [...prev, {
                        type: 'error',
                        content: data.content,
                        command: data.command
                    }]);
                    break;

                case 'commandComplete':
                    setCommandStatus({
                        type: 'success',
                        message: data.message
                    });
                    setIsExecuting(false);
                    if (onFileStructureUpdate) {
                        onFileStructureUpdate();
                    }
                    break;

                case 'close':
                    setCommandStatus({
                        type: data.code === 0 ? 'success' : 'error',
                        message: `Command completed with code ${data.code}`
                    });
                    setIsExecuting(false);
                    if (onFileStructureUpdate) {
                        onFileStructureUpdate();
                    }
                    break;
            }
        };

        ws.onclose = () => {
            console.log('WebSocket Disconnected');
            setIsConnected(false);
        };

        wsRef.current = ws;

        return () => {
            ws.close();
        };
    }, [onFileStructureUpdate]);

    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [output]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || !isConnected || isExecuting) return;

        setIsExecuting(true);
        setCommandStatus(null);
        setOutput(prev => [...prev, { type: 'command', content: input }]);

        try {
            wsRef.current.send(JSON.stringify({ type: 'command', command: input }));
            setInput('');
        } catch (error) {
            console.error('Error sending command:', error);
            setOutput(prev => [...prev, { type: 'error', content: 'Failed to send command' }]);
        }
    };

    const handleStop = () => {
        if (wsRef.current && isExecuting) {
            wsRef.current.send(JSON.stringify({ type: 'stop' }));
            setIsExecuting(false);
            setCommandStatus({
                type: 'warning',
                message: 'Command stopped by user'
            });
        }
    };

    const handleClear = () => {
        setOutput([]);
        setCommandStatus(null);
    };

    return (
        <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1">Terminal</Typography>
                <IconButton onClick={handleClear} size="small">
                    <ClearIcon />
                </IconButton>
            </Box>
            <Box
                ref={terminalRef}
                sx={{
                    flex: 1,
                    overflow: 'auto',
                    p: 2,
                    bgcolor: 'black',
                    color: 'white',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    fontSize: '14px',
                    lineHeight: 1.5
                }}
            >
                {output.map((line, index) => (
                    <Box
                        key={index}
                        sx={{
                            color: line.type === 'error' ? '#ff6b6b' :
                                line.type === 'command' ? '#4ecdc4' : 'white',
                            mb: 1
                        }}
                    >
                        {line.type === 'command' ? '$ ' : ''}{line.content}
                    </Box>
                ))}
                {commandStatus && (
                    <Alert
                        severity={commandStatus.type}
                        sx={{
                            mt: 2,
                            '& .MuiAlert-message': {
                                color: 'white'
                            }
                        }}
                    >
                        {commandStatus.message}
                    </Alert>
                )}
            </Box>
            <form onSubmit={handleSubmit}>
                <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Enter command..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={!isConnected || isExecuting}
                        size="small"
                    />
                    {isExecuting ? (
                        <IconButton
                            onClick={handleStop}
                            color="error"
                            disabled={!isConnected}
                        >
                            <StopIcon />
                        </IconButton>
                    ) : (
                        <IconButton
                            type="submit"
                            color="primary"
                            disabled={!isConnected || !input.trim() || isExecuting}
                        >
                            <SendIcon />
                        </IconButton>
                    )}
                </Box>
            </form>
        </Paper>
    );
};

export default Terminal;