import { Segmented } from "antd";
import { useState } from "react";
import { Material } from "../Material";
import { Outline } from "../Outline";
import { Source } from "../Source";

export function MaterialWrapper() {

    const [key, setKey] = useState<string>('物料');

    return <div className="flex h-full flex-col bg-[#f8fafc]">
        <div className="border-b border-[#e5e7eb] bg-white px-[12px] py-[12px]">
            <Segmented value={key} onChange={setKey} block options={['物料', '大纲', '源码']} />
        </div>
        <div className='min-h-0 flex-1 overflow-hidden pt-[14px]'>
            {
                key === '物料' && <Material/>
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
