import styleClasses from './docSum.module.scss';
import { Button, Collapse, Stack, Slider, Text, Textarea, Title } from '@mantine/core';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { FileUpload } from './FileUpload';
import { useEffect, useState } from 'react';
import Markdown from '../Shared/Markdown/Markdown';
// import { fetchEventSource } from '@microsoft/fetch-event-source';
import { notifications } from '@mantine/notifications';
import { BACKEND_SERVICE_URL } from '../../config';
import { FileWithPath } from '@mantine/dropzone';
// import { fetchEventSource } from '@microsoft/fetch-event-source'

const DocSum = () => {
    const [isFile, setIsFile] = useState<boolean>(false);
    const [files, setFiles] = useState<FileWithPath[]>([]);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [value, setValue] = useState<string>('');
    const [fileContent, setFileContent] = useState<string>('');
    const [dataResponse, setResponse] = useState<string>('');
    const [tokenLimit, setTokenLimit] = useState<number>(100);
    const [temperature, setTemperature] = useState<number>(0.1);
    // const [systemPrompt, setSystemPrompt] = useState<string>('');
    const [showInferenceParams, setShowInferenceParams] = useState<boolean>(false);
    // const [headers, setHeaders] = useState<Record<string, string>>({});

    // useEffect(() => {
    //     console.log ("response", dataResponse);
    // }
    // , [dataResponse]);

    // Determine file type based on MIME type
    const getFileType = (file: FileWithPath): 'text' | 'audio' | 'video' => {
        const mimeType = file.type;
        console.log('File MIME Type:', mimeType);
        if (
            mimeType === 'text/plain' || 
            mimeType === 'application/pdf' ||
            mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
            return 'text';
        } else if (mimeType.startsWith('audio/')) {
            return 'audio';
        } else if (mimeType.startsWith('video/')) {
            return 'video';
        }
        return 'text'; // Default to text if unknown
    };

    useEffect(() => {
        if (isFile) {
            setValue('');
        }
    }, [isFile]);

    useEffect(() => {
        if (files.length) {
            const file = files[0];
            const fileType = getFileType(file);

            if (fileType === 'text') {
                // Read text-based files
                const reader = new FileReader();
                reader.onload = async () => {
                    const text = reader.result?.toString();
                    setFileContent(text || '');
                };
                reader.readAsText(file);
            } else {
                // For audio/video, set fileContent to empty or handle differently
                setFileContent(''); // Backend will handle the file directly
            }
        } else {
            setFileContent('');
        }
    }, [files]);

    const handleSubmit = async () => {
        setResponse('');
        if (!isFile && !value) {
            notifications.show({
                color: 'red',
                id: 'input',
                message: 'Please Upload Content or Paste Text',
            });
            return;
        }

        setIsGenerating(true);
        const formData = new FormData();
        let body = {};

        if (isFile && files.length) {
            const file = files[0];
            const fileType = getFileType(file);

            formData.append('files', file);
            formData.append('type', fileType);
            formData.append('max_tokens', tokenLimit.toString());
            // formData.append('language', 'en');

            if (fileType === 'text' && fileContent && file.type !== 'application/pdf') {
                formData.append('messages', fileContent);
            }else {
                formData.append('messages', ''); // No text content for audio/video
            }

        } else {
            formData.append('messages', value);
            formData.append('type', 'text');
            // formData.append('max_tokens', '32');
            // formData.append('language', 'en');

            body = {
                messages: value,
                type: 'text',
                max_tokens: tokenLimit.toString(),
                temperature: temperature.toString(),  
            }
        }

        try {
            const response = await fetch(BACKEND_SERVICE_URL, {
                method: 'POST',
                body: Object.keys(body).length === 0? formData: JSON.stringify(body),
                headers: Object.keys(body).length === 0? {
                    // Content-Type is automatically set by FormData
                    }:{
                    'Content-Type': 'application/json',
                    }
                }
                );

            if (!response.ok) {
                const e = await response.json();
                console.error('Error:', e);
                throw new Error(e.error.message);
            }

            if (!response.body) {
                throw new Error('Response body is null');
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;

            while (!done) {
                const { value, done: streamDone } = await reader.read();
                done = streamDone;
                if (value) {
                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n\n');
                    for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const msgData = line.slice(6); // Remove 'data: '
                        if (msgData === '[DONE]') {
                            setIsGenerating(false);
                            break;
                        }
                        try {
                            // console.log("msgData", msgData);
                            const res = JSON.parse(msgData);
                            const logs = res.ops;
                            // console.log("logs", logs);
                            logs.forEach((log: { op: string; value: string; path: string }) => {
                                if (log.op === "add") {
                                    if (
                                        log.value !== "</s>" &&
                                        log.path.endsWith("/streamed_output/-") &&
                                        log.path.length > "/streamed_output/-".length
                                    ) {
                                        setResponse(prev => prev + log.value);
                                    }
                                }
                            });
                        } catch (e) {
                            // console.warn("Skipping malformed msgData:", msgData);
                            // console.error("Parsing error:", e);
                            // Just continue to next line, don't throw
                            continue;
                        }
                    }
                }

                }
            }
        } catch (error) {
            console.error('API Error:', error);
            notifications.show({
                color: 'red',
                id: 'api-error',
                message: 'Failed to process request',
            });
            setIsGenerating(false);
        }
    };

    

    return (
        <div className={styleClasses.docSumWrapper}>
            <div className={styleClasses.docSumContent}>
                <div className={styleClasses.docSumContentMessages}>
                    <div className={styleClasses.docSumTitle}>
                        <Title order={3}>Doc Summary</Title>
                    </div>
                    <div>
                        <Text size="lg">Please upload file or paste content for summarization.</Text>
                    </div>
                    <div className={styleClasses.docSumContentButtonGroup}>
                        <Button.Group styles={{ group: { alignSelf: 'center' } }}>
                            <Button variant={!isFile ? 'filled' : 'default'} onClick={() => setIsFile(false)}>
                                Paste Text
                            </Button>
                            <Button variant={isFile ? 'filled' : 'default'} onClick={() => setIsFile(true)}>
                                Upload File
                            </Button>
                        </Button.Group>
                    </div>
                    <div className={styleClasses.docSumInput}>
                        {isFile ? (
                            <div className={styleClasses.docSumFileUpload}>
                                <FileUpload onDropAny={(files) => setFiles(files)} />
                            </div>
                        ) : (
                            <div className={styleClasses.docSumPasteText}>
                                <Textarea
                                    autosize
                                    autoFocus
                                    placeholder="Paste the text information you need to summarize"
                                    minRows={10}
                                    value={value}
                                    onChange={(event) => setValue(event.currentTarget.value)}
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <Button
                            variant="light"
                            size="xs"
                            radius="xl"
                            onClick={() => setShowInferenceParams(!showInferenceParams)}
                            rightSection={showInferenceParams ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                            mb="xs"
                        >
                            {showInferenceParams ? "Hide Inference Settings" : "Show Inference Settings"}
                        </Button>
                        <Collapse in={showInferenceParams} mb="md">
                            <Stack style={{ marginLeft: '10px' }}>
                                <Title size="sm">Inference Settings</Title>
                                <Text size="sm">Token Limit: {tokenLimit}</Text>
                                <Slider value={tokenLimit} onChange={setTokenLimit} min={10} max={500} step={1} />
                                <Text size="sm">Temperature: {temperature.toFixed(2)}</Text>
                                <Slider value={temperature} onChange={setTemperature} min={0.10} max={1.00} step={0.01} />
                                {/* <Textarea
                                label="System Prompt"
                                placeholder="Set system prompt"
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                                size="sm"
                                mb="sm"
                                /> */}
                            </Stack>
                        </Collapse>
                    </div>

                    <div>
                        <Button loading={isGenerating} loaderProps={{ type: 'dots' }} onClick={handleSubmit}>
                            Generate Summary
                        </Button>
                    </div>
                    {dataResponse && (
                        <div className={styleClasses.docSumResult}>
                            <Markdown content={dataResponse} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocSum;