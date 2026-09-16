import { Component as ReactComponent, ReactNode, useEffect, useState } from 'react';
import { Button, Space } from 'antd';
import {
    DoubleLeftOutlined,
    DoubleRightOutlined,
} from '@ant-design/icons';
import { Allotment } from "allotment";
import 'allotment/dist/style.css';
import { Header } from "./components/Header";
import { EditArea } from "./components/EditArea";
import { Setting } from "./components/Setting";
import { MaterialWrapper } from "./components/MaterialWrapper";
import { useComponentsStore } from "./stores/editor-store";
import { Preview } from "./components/Preview";
import type { ProjectRole } from '../projects';
import { usePageDraftPersistence } from './drafts/use-page-draft-persistence';
import {
    useEditorRemoteMaterials,
    type EditorRemoteMaterialState,
} from './remote-materials/useEditorRemoteMaterials';

const LEFT_PANEL_MIN_SIZE = 320;
const LEFT_PANEL_PREFERRED_SIZE = 340;
const RIGHT_PANEL_MIN_SIZE = 300;
const RIGHT_PANEL_PREFERRED_SIZE = 320;

export interface LowcodeEditorProps {
    userId?: number;
    pageId?: number;
    projectId?: number;
    projectRole?: ProjectRole;
    baselineFingerprint?: string;
    serverUpdatedAt?: string;
    serverRevision?: number;
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

class EditorBodyBoundary extends ReactComponent<EditorBodyBoundaryProps, EditorBodyBoundaryState> {
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

export default function LowcodeEditor({
    userId,
    pageId,
    projectId,
    projectRole,
    baselineFingerprint,
    serverUpdatedAt,
    serverRevision,
    onBack,
}: LowcodeEditorProps) {
    const mode = useComponentsStore((state) => state.mode);
    const setMode = useComponentsStore((state) => state.setMode);
    const [leftPanelVisible, setLeftPanelVisible] = useState(true);
    const [rightPanelVisible, setRightPanelVisible] = useState(true);
    const [leftPaneSize, setLeftPaneSize] = useState(LEFT_PANEL_PREFERRED_SIZE);
    const [rightPaneSize, setRightPaneSize] = useState(RIGHT_PANEL_PREFERRED_SIZE);
    const [currentRevision, setCurrentRevision] = useState(serverRevision);
    const remoteMaterials = useEditorRemoteMaterials(projectId);

    useEffect(() => {
        setCurrentRevision(serverRevision);
    }, [pageId, serverRevision]);

    const { markSaved, preserveCurrentDraft } = usePageDraftPersistence({
        userId,
        projectId,
        pageId,
        projectRole,
        baselineFingerprint,
        serverUpdatedAt,
        serverRevision,
    });

    function handlePageSaved(components: Parameters<typeof markSaved>[0], updatedAt: string, revision: number) {
        markSaved(components, updatedAt, revision);
        setCurrentRevision(revision);
    }

    function exitPreview() {
        setMode('edit');
    }

    function handlePaneSizesChange(nextPaneSizes: number[]) {
        if (leftPanelVisible && rightPanelVisible && nextPaneSizes.length === 3) {
            setLeftPaneSize(nextPaneSizes[0]);
            setRightPaneSize(nextPaneSizes[2]);
            return;
        }

        if (leftPanelVisible && !rightPanelVisible && nextPaneSizes.length === 2) {
            setLeftPaneSize(nextPaneSizes[0]);
            return;
        }

        if (!leftPanelVisible && rightPanelVisible && nextPaneSizes.length === 2) {
            setRightPaneSize(nextPaneSizes[1]);
        }
    }

    function renderLeftPanelToggle() {
        return <button
            type="button"
            className={`editor-pane-toggle editor-pane-toggle-left ${leftPanelVisible ? 'is-open' : 'is-closed'}`}
            aria-label={leftPanelVisible ? '隐藏左侧面板' : '显示左侧面板'}
            aria-expanded={leftPanelVisible}
            title={leftPanelVisible ? '隐藏左侧面板' : '显示左侧面板'}
            onClick={() => setLeftPanelVisible((visible) => !visible)}
        >
            {leftPanelVisible ? <DoubleLeftOutlined /> : <DoubleRightOutlined />}
        </button>
    }

    function renderRightPanelToggle() {
        return <button
            type="button"
            className={`editor-pane-toggle editor-pane-toggle-right ${rightPanelVisible ? 'is-open' : 'is-closed'}`}
            aria-label={rightPanelVisible ? '隐藏右侧面板' : '显示右侧面板'}
            aria-expanded={rightPanelVisible}
            title={rightPanelVisible ? '隐藏右侧面板' : '显示右侧面板'}
            onClick={() => setRightPanelVisible((visible) => !visible)}
        >
            {rightPanelVisible ? <DoubleRightOutlined /> : <DoubleLeftOutlined />}
        </button>
    }

    return <div className='editor-workbench relative h-[100vh] flex flex-col bg-[#eef2f7]'>
        <div className='editor-topbar h-[60px] flex items-center'>
            <Header
                pageId={pageId}
                projectRole={projectRole}
                revision={currentRevision}
                onPageSaved={handlePageSaved}
                onPageConflict={preserveCurrentDraft}
                onBack={onBack}
            />
        </div>
        <RemoteMaterialStatusBar state={remoteMaterials} />
        <EditorBodyBoundary mode={mode} onExitPreview={exitPreview} onBack={onBack}>
            {
                mode === 'edit'
                    ? <div className="editor-split-shell min-h-0 flex-1">
                        {!leftPanelVisible && renderLeftPanelToggle()}
                        {!rightPanelVisible && renderRightPanelToggle()}
                        <Allotment className="editor-split-layout" onChange={handlePaneSizesChange}>
                            {leftPanelVisible && (
                                <Allotment.Pane key="left-panel" preferredSize={leftPaneSize} maxSize={420} minSize={LEFT_PANEL_MIN_SIZE}>
                                    <div className="editor-pane-shell editor-pane-shell-left">
                                        <MaterialWrapper pageId={pageId} projectId={projectId} projectRole={projectRole} />
                                        {renderLeftPanelToggle()}
                                    </div>
                                </Allotment.Pane>
                            )}
                            <Allotment.Pane key="canvas-panel">
                                <EditArea
                                    remoteMaterialStatus={remoteMaterials.status}
                                    remoteMaterialError={remoteMaterials.error}
                                />
                            </Allotment.Pane>
                            {rightPanelVisible && (
                                <Allotment.Pane key="right-panel" preferredSize={rightPaneSize} maxSize={520} minSize={RIGHT_PANEL_MIN_SIZE}>
                                    <div className="editor-pane-shell editor-pane-shell-right">
                                        <Setting />
                                        {renderRightPanelToggle()}
                                    </div>
                                </Allotment.Pane>
                            )}
                        </Allotment>
                    </div>
                    : <RemoteMaterialPreview
                        state={remoteMaterials}
                        onExitPreview={exitPreview}
                    />
            }
        </EditorBodyBoundary>
    </div>
}

function RemoteMaterialStatusBar({ state }: { state: EditorRemoteMaterialState }) {
    if (state.status === 'ready' && state.totalCount === 0) return null;

    const tone = state.status === 'error'
        ? 'is-error'
        : state.status === 'ready'
            ? 'is-ready'
            : 'is-loading';
    const message = state.status === 'loading'
        ? '正在校验并加载项目远程物料…'
        : state.status === 'error'
            ? `远程物料加载失败：${state.error || '未知错误'}`
            : `远程物料已就绪：${state.loadedCount}/${state.totalCount}`;

    return <div className={`editor-remote-material-status ${tone}`} role={state.status === 'error' ? 'alert' : 'status'}>
        {message}
    </div>;
}

function RemoteMaterialPreview({
    state,
    onExitPreview,
}: {
    state: EditorRemoteMaterialState;
    onExitPreview: () => void;
}) {
    if (state.status === 'loading') {
        return <div className="editor-remote-material-runtime-state">
            <div className="editor-remote-material-runtime-card">
                <div className="editor-remote-material-runtime-title">正在准备预览</div>
                <div className="editor-remote-material-runtime-detail">远程物料完成校验和注册后再渲染页面。</div>
                <Button className="mt-[16px]" onClick={onExitPreview}>退出预览</Button>
            </div>
        </div>;
    }

    if (state.status === 'error') {
        return <div className="editor-remote-material-runtime-state">
            <div className="editor-remote-material-runtime-card is-error">
                <div className="editor-remote-material-runtime-title">预览所需物料加载失败</div>
                <div className="editor-remote-material-runtime-detail">{state.error}</div>
                <Button className="mt-[16px]" type="primary" onClick={onExitPreview}>返回编辑</Button>
            </div>
        </div>;
    }

    return <Preview registry={state.runtimeRegistry} />;
}
