import { Button, Empty, Table as AntdTable } from 'antd';
import React, { useEffect, useMemo, useRef } from 'react';
import { useDrag } from 'react-dnd';
import { useMaterialDrop } from '../../hooks/useMaterialDrop';
import { CommonComponentProps } from '../../interface';

function Table({ id, name, children, styles, dataText, pagination = false, pageSize = 5, emptyText = '暂无数据' }: CommonComponentProps) {

    const {canDrop, canDropCurrent, isOverCurrent, drop } = useMaterialDrop(['TableColumn'], id);
    const divRef = useRef<HTMLDivElement>(null);

    const [, drag] = useDrag({
        type: name,
        item: {
            type: name,
            dragType: 'move',
            id,
        }
    });

    useEffect(() => {
        drop(divRef);
        drag(divRef);
    }, [drop, drag]);

    const columns = useMemo(() => {
        return React.Children.map(children, (item: any) => {
            const type = item.props?.type;
            if (type === 'action') {
                return {
                    title: <div className='m-[-16px] p-[16px]' data-component-id={item.props?.id}>{item.props?.title || '操作'}</div>,
                    dataIndex: item.props?.dataIndex || 'action',
                    key: item.props?.id,
                    width: item.props?.width,
                    render: () => <Button size="small" type="link">{item.props?.actionText || '查看'}</Button>,
                }
            }

            return {
                title: <div className='m-[-16px] p-[16px]' data-component-id={item.props?.id}>{item.props?.title}</div>,
                dataIndex: item.props?.dataIndex,
                key: item.props?.id,
                width: item.props?.width,
            }
        }) || [];
    }, [children]);

    const dataSource = useMemo(() => {
        return parseDataSource(dataText);
    }, [dataText]);

    return (
        <div
            className={`editor-component editor-panel editor-drop-zone w-full overflow-hidden ${canDrop ? 'can-drop' : ''} ${canDropCurrent ? 'is-drop-target' : ''} ${isOverCurrent && !canDropCurrent ? 'is-drop-disabled' : ''}`}
            ref={divRef}
            data-component-id={id}
            style={styles}
        >
            <div className="editor-panel-header">
                <span>表格</span>
                <span className="rounded-[4px] bg-[#f8fafc] px-[6px] py-[2px] text-[11px] font-medium text-[#475569]">Table</span>
            </div>
            <div className="editor-panel-body p-0">
                {columns.length === 0 ? <div className="editor-empty m-[14px]">拖入表格列</div> : (
                    <AntdTable
                        columns={columns}
                        dataSource={dataSource}
                        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} /> }}
                        pagination={pagination ? { pageSize: Number(pageSize) || 5 } : false}
                        rowKey={(record) => String(record.id || record.key)}
                    />
                )}
            </div>
        </div>
    );
}

function parseDataSource(dataText?: string) {
    if (!dataText) return [];

    try {
        const data = JSON.parse(dataText);
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

export default Table;
