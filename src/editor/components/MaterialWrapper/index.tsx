import { Segmented } from "antd";
import { useState } from "react";
import { Material } from "../Material";
import { Outline } from "../Outline";
import { Source } from "../Source";
import type { ProjectRole } from "../../../shared/api/types";

interface MaterialWrapperProps {
    projectId?: number;
    projectRole?: ProjectRole;
}

export function MaterialWrapper({ projectId, projectRole }: MaterialWrapperProps) {

    const [key, setKey] = useState<string>('物料');

    return <div className="editor-left-panel flex h-full flex-col">
        <div className="editor-left-tabs px-[12px] py-[12px]">
            <Segmented value={key} onChange={setKey} block options={['物料', '大纲', '源码']} />
        </div>
        <div className='editor-left-body min-h-0 flex-1 overflow-hidden pt-[14px]'>
            {
                key === '物料' && <Material projectId={projectId} projectRole={projectRole} />
            }
            {
                key === '大纲' && <div className="h-full overflow-auto px-[12px] pb-[16px]"><Outline/></div>
            }
            {
                key === '源码' && <div className="h-full px-[12px] pb-[16px]"><Source/></div>
            }
        </div>
    </div>
}
