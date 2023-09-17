"use client";
import { Card, message, Empty, Button, Upload, UploadProps, List, Typography, Modal, Input, Space, Radio, Form } from "antd";
import { use, useContext, useEffect, useRef, useState } from "react";
import { SupabaseContext } from "../../layout";
import { data } from "autoprefixer";
import { FileImageOutlined, FilePdfTwoTone, FileTwoTone, FolderTwoTone, PlayCircleOutlined, PlusOutlined, UploadOutlined, VideoCameraTwoTone } from "@ant-design/icons";
import { useRouter } from 'next/navigation';
import path from "path";
import Breadcrumbs from "../components/Breadcrumb";
import ReactPlayer from 'react-player'


export default function MyStore({ params: { folderid }}) {
    const [sortBy, setSortBy] = useState('name');
    const path = folderid.join('/');
    const supabase = useContext(SupabaseContext);
    const [loading, setLoading] = useState(false); // string, number, boolean
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [folderName, setFolderName] = useState('');

    const [messageApi, context] = message.useMessage();

    async function getAllFiles(sortBy = 'name') {
        setLoading(true);
        const { data, error } = await supabase.storage.from('mystore').list(`${path}`, {
            limit: 100,
            offset: 0,
            sortBy: { column: sortBy, order: 'asc' },
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

    useEffect(() => {
        getAllFiles(sortBy);
    }, [sortBy]);

    const uploadProps: UploadProps = {
        async beforeUpload(file) {
            messageApi.open({
                key: 'hello',
                type: 'loading',
                content: 'Uploading'
            });
            setUploading(true);
            const { error } = await supabase.storage.from('mystore').upload(`/${path}${folderName ? `/${folderName}` : ''}/${file.name}`, file);
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
                title={folderid[folderid.length - 1]}
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
                <div className="flex justify-between items-center">
                    <Breadcrumbs path={path} />
                    <Form.Item label="Sort By:">
                        <Radio.Group
                            value={sortBy}
                            buttonStyle="solid"
                            optionType="button"
                            options={[
                                {label: 'Name', value: 'name'},
                                {label: 'Date', value: 'updated_at'}
                            ]}
                            onChange={(e) => setSortBy(e.target.value)}
                        />
                    </Form.Item>
                </div>
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
                        {files.map(file => <FileItem path={path} file={file} />)}
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
    file: File,
    path: string;
}

function FileItem({ file, path }: FileItemProps) {

    const [fileData, setFileData] = useState<Blob | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const supabase = useContext(SupabaseContext);
    const [showFilePopup, setShowFilePopup] = useState(false);
    
    const urlRef = useRef('');

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
            const { data, error } = await supabase.storage.from('mystore').download(`/${path}/${file.name}`);
            setFileData(data);
            setPreviewLoading(false);
        }
        getFileData();
    }, []);

    useEffect(() => {
        if (fileData) {
            urlRef.current = window.URL.createObjectURL(fileData);
        }
    }, [fileData]);


    const renderCover = () => {
        console.log({ fileData });
        const url = urlRef.current;
        if (file) {
            if (file.metadata) {
                const { metadata: { mimetype }} = file;
                if (mimetype === 'image/gif' || mimetype === 'image/jpeg' || mimetype === 'image/png') {
                    return url ? <img src={url} className="h-[150px]" /> : <FileImageOutlined className="h-[150px] p-[10px] text-[100px]" />
                } else if (mimetype === 'application/pdf') {
                    return <FilePdfTwoTone twoToneColor="rgb(230,0,0)" className="h-[150px] p-[10px] text-[100px]" />
                } else if (mimetype === 'video/mp4') {
                    return <ReactPlayer loop muted className="!w-[200px] max-h-[200px] bg-[#000] p-[10px] text-[100px]" playing url={url} />
                } else {
                    <FileTwoTone />
                }
            } else {
                return <FolderTwoTone twoToneColor="rgb(150,150,0)" className="h-[150px] p-[10px] text-[100px]" />
            }
        }
    }

    const router = useRouter();

    function handleClickCard() {
       if (file && file.metadata) {
            const { metadata: { mimetype }} = file;

            if (mimetype === 'video/mp4') {
                setShowFilePopup(true);
            }
       }
    }

    return (
        <Card
            loading={previewLoading}
            className="w-[200px] m-[20px] cursor-pointer"
            onClick={handleClickCard}
            cover={renderCover()}
            actions={[
                file.metadata ? <Button onClick={handleDownload}>Download</Button> : <Button onClick={() => router.push(`/mystore/${path}/${file.name}`)}>Open Folder</Button>
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
            <Modal open={showFilePopup} onCancel={() => setShowFilePopup(false)} title={file.name}>
                <ReactPlayer playIcon={<PlayCircleOutlined />} className="!w-[100%]" url={urlRef.current} />
            </Modal>
        </Card>
    )
}

/**
 * /root/v-images
 * /images
 * /images/v-images
 * 
 * 
 */