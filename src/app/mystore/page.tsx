"use client";
import { Card, message, Empty, Button, Upload, UploadProps, List, Typography, Modal, Input } from "antd";
import { useContext, useEffect, useState } from "react";
import { SupabaseContext } from "../layout";
import { data } from "autoprefixer";
import { FilePdfTwoTone, FileTwoTone, FolderTwoTone, PlusOutlined, UploadOutlined } from "@ant-design/icons";


export default function MyStore() {
    const supabase = useContext(SupabaseContext);
    const [loading, setLoading] = useState(false); // string, number, boolean
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [folderName, setFolderName] = useState('');

    const [messageApi, context] = message.useMessage();

    async function getAllFiles() {
        setLoading(true);
        const { data, error } = await supabase.storage.from('mystore').list('', {
            limit: 100,
            offset: 0,
            sortBy: { column: 'name', order: 'asc' },
        });
        if (error) {
            message.error('Error fetching files');
        } else {
            // @ts-ignore
            setFiles(data.filter(file => file.name !== '.emptyFolderPlaceholder'));
        }
        setLoading(false);
    }

    useEffect(() => {
        getAllFiles();
    }, []);

    const uploadProps: UploadProps = {
        async beforeUpload(file) {
            messageApi.open({
                key: 'hello',
                type: 'loading',
                content: 'Uploading'
            });
            setUploading(true);
            const { error } = await supabase.storage.from('mystore').upload(`${folderName}/${file.name}`, file);
            setFolderName('');
            setModalOpen(false);
            if (error) {
                message.error('Error uploading the file');
            }
            setUploading(false);
            messageApi.open({
                key: 'hello',
                type: 'success',
                content: 'Uploaded',
                duration: 2
            });
            getAllFiles();
        },
        showUploadList: false
    }

    return (
        <div>
            {context}
            <Card
                loading={loading}
                title='My Store'
                className="max-w-[800px] mx-auto my-[30px]"
                extra={
                    <>
                        <Button className="mr-[8px]" onClick={() => setModalOpen(true)} icon={<PlusOutlined />}>New Folder</Button>
                        <Upload {...uploadProps}>
                            <Button loading={uploading} icon={<UploadOutlined />}>Upload File</Button>
                        </Upload>
                    </>
                }
            >
                {
                    files.length === 0 ? (
                        <Empty
                            description="No files in your store"
                        >
                            <Upload {...uploadProps}>
                                <Button icon={<UploadOutlined />}>Upload File</Button>
                            </Upload>
                        </Empty>
                    ) : <div className="flex flex-wrap">
                        {files.map(file => <FileItem file={file} />)}
                    </div>
                }
            </Card>
            <Modal
                title="Add Folder"
                footer={[
                    <Button className="mr-[8px]" onClick={() => setModalOpen(false)}>Cancel</Button>,
                    <Upload {...uploadProps}>
                        <Button loading={uploading} type='primary' icon={<UploadOutlined />}>Upload First File</Button>
                    </Upload>
                ]}
            
                onCancel={() => setModalOpen(false)} open={modalOpen}>
                <Input value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="Folder Name" />
            </Modal>
        </div>
    );
}

type FileItemProps = {
    file: File
}

function FileItem({ file }: FileItemProps) {

    const [fileData, setFileData] = useState<Blob | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const supabase = useContext(SupabaseContext);

    const handleDownload = async (file: File) => {
        const link = document.createElement('a');
        link.style.display = 'none';
        const url = window.URL.createObjectURL(fileData);
        link.href = url;
        link.download = url;
        link.click();
    }

    useEffect(() => {
        async function getFileData() {
            setPreviewLoading(true);
            const { data, error } = await supabase.storage.from('mystore').download(`/${file.name}`);
            setFileData(data);
            setPreviewLoading(false);
        }
        getFileData();
    }, []);

    const renderCover = () => {
        const url = fileData ? window.URL.createObjectURL(fileData) : '';
        if (file) {
            if (file.metadata) {
                const { metadata: { mimetype }} = file;
                if (mimetype === 'image/gif' || mimetype === 'image/jpeg' || mimetype === 'image/png') {
                    return <img src={url} className="h-[150px]" />
                } else if (mimetype === 'application/pdf') {
                    return <FilePdfTwoTone twoToneColor="rgb(230,0,0)" className="h-[150px] p-[10px] text-[100px]" />
                } else {
                    <FileTwoTone />
                }
            } else {
                return <FolderTwoTone twoToneColor="rgb(150,150,0)" className="h-[150px] p-[10px] text-[100px]" />
            }
        }
    }

    return (
        <Card
            loading={previewLoading}
            className="w-[200px] m-[20px]"
            cover={renderCover()}
            actions={[
                file.metadata ? <Button onClick={handleDownload}>Download</Button> : <Button>Open Folder</Button>
            ]}
        >
            <Card.Meta className="text-[18px]" title={`${file.name}`} />
            {file.metadata && (
                <>
                    <Typography.Text className="block text-[10px] font-semibold mt-[8px]">Last updated at</Typography.Text>
                    <Typography.Text className="block text-[12px] mt-[-5px]">{(new Date(file.updated_at).toDateString())}</Typography.Text>
                    <Typography.Text className="block text-[10px] font-semibold mt-[8px]">File Size</Typography.Text>
                    <Typography.Text className="block text-[12px] mt-[-5px]">{`${(file.metadata.size/1024/1024).toFixed(2)} MB`}</Typography.Text>
                </>
            )}
        </Card>
    )
}
