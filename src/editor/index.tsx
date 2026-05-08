import { Component, ReactNode } from 'react';
import { Button, Space } from 'antd';
import { Allotment } from "allotment";
import 'allotment/dist/style.css';
import { Header } from "./components/Header";
import { EditArea } from "./components/EditArea";
import { Setting } from "./components/Setting";
import { MaterialWrapper } from "./components/MaterialWrapper";
import { useComponetsStore } from "./stores/components";
import { Preview } from "./runtime/Preview";
import type { ProjectRole } from '../shared/api/types';

export interface LowcodeEditorProps {
    pageId?: number;
    projectId?: number;
    projectRole?: ProjectRole;
    onBack?: () => void;
}

interface EditorBodyBoundaryProps {
    mode: 'edit' | 'preview';
    onExitPreview: () => void;
    onBack?: () => void;
    children: ReactNode;
}

interface EditorBodyBoundaryState {
    error?: Error;
}

class EditorBodyBoundary extends Component<EditorBodyBoundaryProps, EditorBodyBoundaryState> {
    state: EditorBodyBoundaryState = {};

    static getDerivedStateFromError(error: Error) {
        return { error };
    }

    componentDidUpdate(prevProps: EditorBodyBoundaryProps) {
        if (prevProps.mode !== this.props.mode && this.state.error) {
            this.setState({ error: undefined });
        }
    }

    render() {
        if (this.state.error) {
            return <div className="flex min-h-0 flex-1 items-center justify-center bg-[#eef2f7] px-[24px]">
                <div className="max-w-[520px] rounded-[8px] border border-red-200 bg-white p-[24px] shadow-sm">
                    <div className="text-[16px] font-semibold text-[#991b1b]">页面渲染失败</div>
                    <div className="mt-[8px] text-[13px] leading-[22px] text-[#64748b]">
                        当前页面里有组件或事件代码执行异常，编辑器主体已停止渲染。你可以先退出预览或返回项目，避免卡在错误页面。
                    </div>
                    <div className="mt-[10px] rounded-[6px] bg-[#fef2f2] px-[10px] py-[8px] text-[12px] text-[#991b1b]">
                        {this.state.error.message}
                    </div>
                    <Space className="mt-[16px]">
                        {this.props.mode === 'preview' && <Button type="primary" onClick={this.props.onExitPreview}>退出预览</Button>}
                        {this.props.onBack && <Button onClick={this.props.onBack}>返回项目</Button>}
                    </Space>
                </div>
            </div>;
        }

        return this.props.children;
    }
}

export default function ReactPlayground({ pageId, projectId, projectRole, onBack }: LowcodeEditorProps) {
    const mode = useComponetsStore((state) => state.mode);
    const setMode = useComponetsStore((state) => state.setMode);

    function exitPreview() {
        setMode('edit');
    }

    return <div className='relative h-[100vh] flex flex-col bg-[#eef2f7]'>
        <div className='h-[60px] flex items-center border-b border-[#e5e7eb] bg-white shadow-sm'>
            <Header pageId={pageId} projectRole={projectRole} onBack={onBack} />
        </div>
        <EditorBodyBoundary mode={mode} onExitPreview={exitPreview} onBack={onBack}>
            {
                mode === 'edit'
                    ? <div className="min-h-0 flex-1">
                        <Allotment>
                            <Allotment.Pane preferredSize={280} maxSize={420} minSize={240}>
                                <MaterialWrapper projectId={projectId} projectRole={projectRole} />
                            </Allotment.Pane>
                            <Allotment.Pane>
                                <EditArea />
                            </Allotment.Pane>
                            <Allotment.Pane preferredSize={320} maxSize={520} minSize={300}>
                                <Setting />
                            </Allotment.Pane>
                        </Allotment>
                    </div>
                    : <Preview/>
            }
        </EditorBodyBoundary>
    </div>
}
