import { Group, Text, rem } from '@mantine/core';
import { IconUpload, IconCloudUpload, IconX, IconFile } from '@tabler/icons-react';
import { Dropzone, DropzoneProps, FileWithPath } from '@mantine/dropzone';
import '@mantine/dropzone/styles.css';
import { useState } from 'react';

export function FileUpload(props: Partial<DropzoneProps>) {
    const [files, setFiles] = useState<FileWithPath[]>([]);
    return (
        <Dropzone
            onDrop={(files) => {
                setFiles(files);
                props.onDropAny?.(files, []); // Pass files and empty fileRejections to parent component
            }}
            onReject={() => {}}
            maxSize={10 * 1024 ** 2} // 5MB limit
            multiple={false}
            accept={{
                'text/plain': ['.txt'],
                'application/pdf': ['.pdf'],
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                'audio/*': ['.mp3', '.wav', '.ogg'],
                'video/*': ['.mp4', '.avi', '.mov'],
            }}
            style={{ height: '220px', width: '100%', borderColor: 'var(--mantine-color-blue-6)' }}
            {...props}
        >
            <Group justify="center" gap="xl" mih={220} style={{ pointerEvents: 'none' }}>
                <Dropzone.Accept>
                    <IconUpload
                        style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-blue-6)' }}
                        stroke={1.5}
                    />
                </Dropzone.Accept>
                <Dropzone.Reject>
                    <IconX
                        style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-red-6)' }}
                        stroke={1.5}
                    />
                </Dropzone.Reject>
                <Dropzone.Idle>
                    {files.length > 0 ? (
                        <IconFile
                            style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-dimmed)' }}
                            stroke={1.5}
                        />
                    ) : (
                        <IconCloudUpload
                            style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-dimmed)' }}
                            stroke={1.5}
                        />
                    )}
                </Dropzone.Idle>
                {files.length > 0 ? (
                    <div>
                        {files.map((file) => (
                            <Text key={file.name} size="md" c="dimmed" inline mt={7}>
                                {file.name}
                            </Text>
                        ))}
                    </div>
                ) : (
                    <div>
                        <Text size="xl" inline>
                            Drag your file here or click to select file
                        </Text>
                        <Text size="md" c="dimmed" inline mt={7}>
                            .txt, .pdf, .docx, .mp3, .wav, .mp4, .avi, etc.
                        </Text>
                    </div>
                )}
            </Group>
        </Dropzone>
    );
}