import { Profiler } from 'react';
import { Allotment } from "allotment";
import 'allotment/dist/style.css';
import { Header } from "./components/Header";
import { EditArea } from "./components/EditArea";
import { Setting } from "./components/Setting";
import { MaterialWrapper } from "./components/MaterialWrapper";
import { useComponetsStore } from "./stores/components";
import { Preview } from "./components/Preivew";
import { markFirstMountCommit, markReactCommit } from './perf/zustandPerf';

export interface LowcodeEditorProps {
    pageId?: number;
    onBack?: () => void;
}

export default function ReactPlayground({ pageId, onBack }: LowcodeEditorProps) {
    const mode = useComponetsStore((state) => state.mode);

    const handleCommit = (
        _id: string,
        phase: 'mount' | 'update' | 'nested-update',
        actualDuration: number,
        _baseDuration: number,
        _startTime: number,
        commitTime: number,
    ) => {
        if (phase === 'mount') {
            markFirstMountCommit(commitTime);
        }
        markReactCommit(actualDuration, commitTime);
    };

    return <div className='h-[100vh] flex flex-col'>
        <div className='h-[60px] flex items-center border-b-[1px] border-[#000]'>
            <Header pageId={pageId} onBack={onBack} />
        </div>
        <Profiler id='editor-root' onRender={handleCommit}>
            {
                mode === 'edit' 
                    ? <Allotment>
                        <Allotment.Pane preferredSize={240} maxSize={400} minSize={200}>
                            <MaterialWrapper />
                        </Allotment.Pane>
                        <Allotment.Pane>
                            <EditArea />
                        </Allotment.Pane>
                        <Allotment.Pane preferredSize={300} maxSize={500} minSize={300}>
                            <Setting />
                        </Allotment.Pane>
                    </Allotment>
                    : <Preview/>
            }
        </Profiler>
    </div>
}