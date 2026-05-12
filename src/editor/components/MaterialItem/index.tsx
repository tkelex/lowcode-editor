import { useDrag } from "react-dnd";
import { StarFilled, StarOutlined } from '@ant-design/icons';
import { Tooltip } from "antd";

export interface MaterialItemProps {
    name: string
    desc: string
    icon?: string
    favorite?: boolean
    onToggleFavorite?: (name: string) => void
}

export function MaterialItem(props: MaterialItemProps) {

    const {
        name,
        desc,
        icon,
        favorite,
        onToggleFavorite,
    } = props;

    const [{ isDragging }, drag] = useDrag({
        type: name,
        item: {
            type: name
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    return <div
        ref={drag}
        className={`
            relative
            flex
            min-h-[68px]
            cursor-move
            flex-col
            items-center
            justify-center
            rounded-[8px]
            border
            border-[#e2e8f0]
            bg-white
            px-[8px]
            py-[10px]
            text-center
            shadow-[0_1px_2px_rgba(15,23,42,0.04)]
            transition
            hover:border-[#93c5fd]
            hover:bg-[#f8fbff]
            hover:shadow-[0_8px_18px_rgba(37,99,235,0.10)]
            ${isDragging ? 'opacity-50' : ''}
        `}
    >
        {onToggleFavorite && (
            <Tooltip title={favorite ? '取消收藏' : '收藏物料'}>
                <button
                    type="button"
                    className="absolute right-[6px] top-[6px] inline-flex h-[22px] w-[22px] items-center justify-center rounded-[5px] border-0 bg-transparent text-[13px] text-[#f59e0b] transition hover:bg-[#fffbeb]"
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                        event.stopPropagation();
                        onToggleFavorite(name);
                    }}
                >
                    {favorite ? <StarFilled /> : <StarOutlined />}
                </button>
            </Tooltip>
        )}
        <div className="mb-[4px] text-[20px] leading-[20px] text-[#2563eb]">{icon || '□'}</div>
        <div className="text-[13px] font-medium text-[#1f2937]">{desc}</div>
        <div className="mt-[2px] max-w-full truncate text-[11px] text-[#9ca3af]">{name}</div>
    </div>
}
