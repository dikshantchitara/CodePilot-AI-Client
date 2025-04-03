import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Typography, Paper, CircularProgress, Alert, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import StopIcon from '@mui/icons-material/Stop';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

const AIPrompt = ({ onPrompt, response }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [displayedResponse, setDisplayedResponse] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isStopping, setIsStopping] = useState(false);
    const animationFrameRef = useRef(null);
    const startTimeRef = useRef(0);
    const responseRef = useRef('');

    // Handle typing animation
    useEffect(() => {
        if (response && !isTyping && !isStopping) {
            setIsTyping(true);
            responseRef.current = response;
            setDisplayedResponse('');
            startTimeRef.current = performance.now();

            const animate = (currentTime) => {
                const elapsed = currentTime - startTimeRef.current;
                const charsPerSecond = 100; // Adjust this value to control typing speed
                const charsToShow = Math.floor((elapsed / 1000) * charsPerSecond);

                if (charsToShow < responseRef.current.length) {
                    setDisplayedResponse(responseRef.current.slice(0, charsToShow));
                    animationFrameRef.current = requestAnimationFrame(animate);
                } else {
                    setDisplayedResponse(responseRef.current);
                    setIsTyping(false);
                }
            };

            animationFrameRef.current = requestAnimationFrame(animate);

            return () => {
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
            };
        }
    }, [response, isStopping]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!prompt.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);
        setRetryCount(0);
        setDisplayedResponse('');
        setIsStopping(false);

        try {
            await onPrompt(prompt);
            setPrompt('');
        } catch (error) {
            const errorMessage = error.message || 'Failed to process prompt. Please try again.';
            setError(errorMessage);

            if (errorMessage.includes('Rate limit exceeded')) {
                const waitTime = parseInt(errorMessage.match(/\d+/)[0]);
                setError(`Rate limit reached. Please wait ${waitTime} seconds before trying again.`);
            }

            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStop = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            setIsStopping(true);
            setIsTyping(false);
            setDisplayedResponse(responseRef.current);
        }
    };

    const handleCopyCode = (code) => {
        navigator.clipboard.writeText(code);
    };

    const renderMarkdown = (text) => {
        return (
            <ReactMarkdown
                components={{
                    code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        if (!inline && match) {
                            const code = String(children).replace(/\n$/, '');
                            return (
                                <Box sx={{ position: 'relative' }}>
                                    <IconButton
                                        onClick={() => handleCopyCode(code)}
                                        sx={{
                                            position: 'absolute',
                                            right: 8,
                                            top: 8,
                                            zIndex: 1,
                                            bgcolor: 'background.paper',
                                            '&:hover': {
                                                bgcolor: 'action.hover'
                                            }
                                        }}
                                    >
                                        <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                    <SyntaxHighlighter
                                        style={vscDarkPlus}
                                        language={match[1]}
                                        PreTag="div"
                                        {...props}
                                    >
                                        {code}
                                    </SyntaxHighlighter>
                                </Box>
                            );
                        }
                        return (
                            <code className={className} {...props}>
                                {children}
                            </code>
                        );
                    },
                    p: ({ children }) => <Typography paragraph>{children}</Typography>,
                    h1: ({ children }) => <Typography variant="h4" gutterBottom>{children}</Typography>,
                    h2: ({ children }) => <Typography variant="h5" gutterBottom>{children}</Typography>,
                    h3: ({ children }) => <Typography variant="h6" gutterBottom>{children}</Typography>,
                    ul: ({ children }) => <Box component="ul" sx={{ pl: 2 }}>{children}</Box>,
                    ol: ({ children }) => <Box component="ol" sx={{ pl: 2 }}>{children}</Box>,
                    li: ({ children }) => <Box component="li" sx={{ mb: 1 }}>{children}</Box>,
                    blockquote: ({ children }) => (
                        <Box
                            component="blockquote"
                            sx={{
                                borderLeft: '4px solid #ccc',
                                pl: 2,
                                my: 2,
                                fontStyle: 'italic',
                                color: 'text.secondary'
                            }}
                        >
                            {children}
                        </Box>
                    ),
                    pre: ({ children }) => (
                        <Box
                            component="pre"
                            sx={{
                                bgcolor: 'background.paper',
                                p: 2,
                                borderRadius: 1,
                                overflow: 'auto',
                                my: 2
                            }}
                        >
                            {children}
                        </Box>
                    )
                }}
            >
                {text}
            </ReactMarkdown>
        );
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Paper sx={{ p: 2, flex: 1, overflow: 'auto', mb: 2 }}>
                {displayedResponse && (
                    <Box sx={{ '& > *': { mb: 2 } }}>
                        {renderMarkdown(displayedResponse)}
                    </Box>
                )}
                {error && (
                    <Alert
                        severity={error.includes('Rate limit') ? 'warning' : 'error'}
                        sx={{ mt: 2 }}
                    >
                        {error}
                    </Alert>
                )}
                {retryCount > 0 && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Retrying request ({retryCount}/5)
                    </Alert>
                )}
            </Paper>
            <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', gap: 1, p: 2 }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Ask about your code..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={isLoading || isTyping}
                    />
                    {isTyping ? (
                        <IconButton
                            onClick={handleStop}
                            color="error"
                            disabled={isLoading}
                        >
                            <StopIcon />
                        </IconButton>
                    ) : (
                        <IconButton
                            type="submit"
                            color="primary"
                            disabled={isLoading || !prompt.trim() || isTyping}
                        >
                            {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
                        </IconButton>
                    )}
                </Box>
            </form>
        </Box>
    );
};

export default AIPrompt; 