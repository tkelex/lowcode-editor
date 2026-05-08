import { Input } from "antd";
import { useEffect, useState } from "react";
import type { ConfirmAction, LowcodeAction } from "../../../events/types";
import { NestedActionList } from "./NestedActionList";

export interface ConfirmActionProps {
    value?: ConfirmAction['args']
    onChange?: (config: ConfirmAction) => void
}

export function ConfirmActionForm(props: ConfirmActionProps) {
    const { value, onChange } = props;
    const [title, setTitle] = useState(value?.title || '确认执行该操作？');
    const [content, setContent] = useState(value?.content || '');
    const [actions, setActions] = useState<LowcodeAction[]>(value?.actions || []);
    const [cancelActions, setCancelActions] = useState<LowcodeAction[]>(value?.cancelActions || []);

    useEffect(() => {
        setTitle(value?.title || '确认执行该操作？');
        setContent(value?.content || '');
        setActions(value?.actions || []);
        setCancelActions(value?.cancelActions || []);
    }, [value]);

    function emit(
        nextTitle = title,
        nextContent = content,
        nextActions = actions,
        nextCancelActions = cancelActions,
    ) {
        onChange?.({
            actionType: 'confirm',
            args: {
                title: nextTitle,
                content: nextContent,
                actions: nextActions,
                cancelActions: nextCancelActions,
            },
        });
    }

    return <div className="mt-[24px] space-y-[16px]">
        <div>
            <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">确认标题</div>
            <Input value={title} onChange={(event) => {
                setTitle(event.target.value);
                emit(event.target.value, content, actions, cancelActions);
            }} />
        </div>
        <div>
            <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">确认说明</div>
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} value={content} onChange={(event) => {
                setContent(event.target.value);
                emit(title, event.target.value, actions, cancelActions);
            }} />
        </div>
        <NestedActionList
            title="确认后执行"
            description="用户点击确认后，按顺序执行这里的动作。"
            actions={actions}
            emptyText="确认后暂不执行动作"
            onChange={(nextActions) => {
                setActions(nextActions);
                emit(title, content, nextActions, cancelActions);
            }}
        />
        <NestedActionList
            title="取消后执行"
            description="用户点击取消或关闭弹窗后，按顺序执行这里的动作。"
            actions={cancelActions}
            emptyText="取消后暂不执行动作"
            onChange={(nextCancelActions) => {
                setCancelActions(nextCancelActions);
                emit(title, content, actions, nextCancelActions);
            }}
        />
    </div>
}
