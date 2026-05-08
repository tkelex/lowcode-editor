import { Button, Empty, Table as AntdTable } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import { CommonComponentProps } from '../../interface';

const Table = ({
  url,
  dataSourceId,
  dataText,
  children,
  pagination = false,
  pageSize = 10,
  emptyText = '暂无数据',
  rowKey = 'id',
  styles,
  onChange,
  runtimeDataSources,
}: CommonComponentProps) => {

  const runtimeDataSource = dataSourceId ? runtimeDataSources?.[dataSourceId] : undefined;
  const [data, setData] = useState<Array<Record<string, any>>>(() => parseDataSource(dataText));
  const [loading, setLoading] = useState(false);

  const getData = async () => {
    if (!url) {
      setData(parseDataSource(dataText));
      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.get(url);
      const nextData = Array.isArray(data) ? data : data?.list || data?.data || [];
      setData(Array.isArray(nextData) ? nextData : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (runtimeDataSource) {
      setData(normalizeTableData(runtimeDataSource.data));
      return;
    }

    void getData();
  }, [url, dataText, runtimeDataSource?.data]);

  const columns = useMemo(() => {
    return React.Children.map(children, (item: any) => {
        if (item?.props?.type === 'date') {
            return {
                title: item.props?.title,
                dataIndex: item.props?.dataIndex,
                width: item.props?.width,
                render: (value: any) => value ? dayjs(value).format(item.props?.format || 'YYYY-MM-DD') : null,
            }
        }

        if (item?.props?.type === 'action') {
            return {
                title: item.props?.title || '操作',
                dataIndex: item.props?.dataIndex || 'action',
                width: item.props?.width,
                render: (_value: any, record: Record<string, any>) => {
                  const actionUrl = formatActionUrl(item.props?.actionUrl, record);
                  return actionUrl
                    ? <Button size="small" type="link" href={actionUrl} target={item.props?.target}>{item.props?.actionText || '查看'}</Button>
                    : <Button size="small" type="link">{item.props?.actionText || '查看'}</Button>;
                },
            }
        }

        return {
            title: item.props?.title,
            dataIndex: item.props?.dataIndex,
            width: item.props?.width,
        }
    }) || [];
  }, [children]);

  return (
    <div style={styles}>
      <AntdTable
        columns={columns}
        dataSource={data}
        pagination={pagination ? { pageSize: Number(pageSize) || 10 } : false}
        rowKey={(record) => String(record[rowKey] || record.id || record.key)}
        loading={loading || runtimeDataSource?.loading}
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} /> }}
        onChange={onChange}
      />
    </div>
  );
}

function normalizeTableData(data: unknown) {
    if (Array.isArray(data)) return data as Array<Record<string, any>>;
    if (data && typeof data === 'object') {
        const record = data as Record<string, any>;
        const list = record.list || record.data || record.items;
        return Array.isArray(list) ? list : [];
    }

    return [];
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

function formatActionUrl(url: string | undefined, record: Record<string, any>) {
  if (!url) return '';

  return url.replace(/\{\{\s*record\.([\w.]+)\s*\}\}/g, (_, path) => {
    return String(path.split('.').reduce((result: any, key: string) => result?.[key], record) ?? '');
  });
}

export default Table;
