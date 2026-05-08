import { Input, Select, Typography } from "antd";
import { useEffect, useState } from "react";
import type { HttpAction, HttpAuthType } from "../../../events/types";
import { formatJson, parseJsonObject, parseJsonValue } from "./utils";

export interface HttpActionProps {
    value?: HttpAction['args']
    onChange?: (config?: HttpAction) => void
}

const methodOptions = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((method) => ({ label: method, value: method }));
const authOptions: Array<{ label: string; value: HttpAuthType }> = [
    { label: '不携带鉴权', value: 'none' },
    { label: '当前登录用户 Token', value: 'currentUser' },
    { label: '手动 Bearer Token', value: 'bearer' },
];

export function HttpActionForm(props: HttpActionProps) {
    const { value, onChange } = props;
    const [url, setUrl] = useState(value?.url || '');
    const [method, setMethod] = useState<HttpAction['args']['method']>(value?.method || 'GET');
    const [auth, setAuth] = useState<HttpAuthType>(value?.auth || 'none');
    const [bearerToken, setBearerToken] = useState(value?.bearerToken || '');
    const [headersText, setHeadersText] = useState(formatJson(value?.headers));
    const [bodyText, setBodyText] = useState(typeof value?.body === 'string' ? value.body : formatJson(value?.body));
    const [responseKey, setResponseKey] = useState(value?.responseKey || '');
    const [errorKey, setErrorKey] = useState(value?.errorKey || '');
    const [successMsg, setSuccessMsg] = useState(value?.successMsg || '');
    const [errorMsg, setErrorMsg] = useState(value?.errorMsg || '请求失败');
    const [headersError, setHeadersError] = useState('');
    const [bodyError, setBodyError] = useState('');

    useEffect(() => {
        setUrl(value?.url || '');
        setMethod(value?.method || 'GET');
        setAuth(value?.auth || 'none');
        setBearerToken(value?.bearerToken || '');
        setHeadersText(formatJson(value?.headers));
        setBodyText(typeof value?.body === 'string' ? value.body : formatJson(value?.body));
        setResponseKey(value?.responseKey || '');
        setErrorKey(value?.errorKey || '');
        setSuccessMsg(value?.successMsg || '');
        setErrorMsg(value?.errorMsg || '请求失败');
        setHeadersError('');
        setBodyError('');
    }, [value]);

    function emit(next = {
        url,
        method,
        auth,
        bearerToken,
        headersText,
        bodyText,
        responseKey,
        errorKey,
        successMsg,
        errorMsg,
    }) {
        const headers = parseJsonObject(next.headersText, 'Headers JSON');
        const body = parseJsonValue(next.bodyText, 'Body JSON');

        setHeadersError(headers.error || '');
        setBodyError(body.error || '');

        if (headers.error || body.error) {
            onChange?.(undefined);
            return;
        }

        onChange?.({
            actionType: 'http',
            args: {
                url: next.url.trim(),
                method: next.method,
                auth: next.auth,
                bearerToken: next.auth === 'bearer' ? next.bearerToken : undefined,
                headers: headers.value,
                body: body.value,
                responseKey: next.responseKey.trim(),
                errorKey: next.errorKey.trim(),
                successMsg: next.successMsg,
                errorMsg: next.errorMsg,
            },
        });
    }

    return <div className="mt-[24px] space-y-[16px]">
        <div>
            <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">请求地址</div>
            <Input placeholder="例如 /api/user、users 或 https://example.com/api" value={url} onChange={(event) => {
                setUrl(event.target.value);
                emit({ url: event.target.value, method, auth, bearerToken, headersText, bodyText, responseKey, errorKey, successMsg, errorMsg });
            }} />
        </div>
        <div>
            <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">请求方法</div>
            <Select className="w-full" options={methodOptions} value={method} onChange={(nextMethod) => {
                setMethod(nextMethod);
                emit({ url, method: nextMethod, auth, bearerToken, headersText, bodyText, responseKey, errorKey, successMsg, errorMsg });
            }} />
        </div>
        <div>
            <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">鉴权方式</div>
            <Select<HttpAuthType> className="w-full" options={authOptions} value={auth} onChange={(nextAuth) => {
                setAuth(nextAuth);
                emit({ url, method, auth: nextAuth, bearerToken, headersText, bodyText, responseKey, errorKey, successMsg, errorMsg });
            }} />
        </div>
        {auth === 'bearer' && (
            <div>
                <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">Bearer Token</div>
                <Input.Password value={bearerToken} onChange={(event) => {
                    setBearerToken(event.target.value);
                    emit({ url, method, auth, bearerToken: event.target.value, headersText, bodyText, responseKey, errorKey, successMsg, errorMsg });
                }} />
            </div>
        )}
        <div>
            <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">Headers JSON</div>
            <Input.TextArea autoSize={{ minRows: 3, maxRows: 5 }} value={headersText} onChange={(event) => {
                setHeadersText(event.target.value);
                emit({ url, method, auth, bearerToken, headersText: event.target.value, bodyText, responseKey, errorKey, successMsg, errorMsg });
            }} status={headersError ? 'error' : undefined} />
            <Typography.Text type="secondary" className="mt-[6px] block text-[12px]">
                支持模板：{"{{event.value}}"}、{"{{context.component.id}}"}。
            </Typography.Text>
            {headersError && <div className="mt-[6px] text-[12px] text-[#dc2626]">{headersError}</div>}
        </div>
        <div>
            <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">Body JSON</div>
            <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} value={bodyText} onChange={(event) => {
                setBodyText(event.target.value);
                emit({ url, method, auth, bearerToken, headersText, bodyText: event.target.value, responseKey, errorKey, successMsg, errorMsg });
            }} status={bodyError ? 'error' : undefined} />
            <Typography.Text type="secondary" className="mt-[6px] block text-[12px]">
                字符串字段可使用模板，例如 {"{\"name\":\"{{event.value}}\"}"}。
            </Typography.Text>
            {bodyError && <div className="mt-[6px] text-[12px] text-[#dc2626]">{bodyError}</div>}
        </div>
        <div>
            <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">响应写入字段</div>
            <Input placeholder="例如 api.userResult，留空仅写入 event.httpResponse" value={responseKey} onChange={(event) => {
                setResponseKey(event.target.value);
                emit({ url, method, auth, bearerToken, headersText, bodyText, responseKey: event.target.value, errorKey, successMsg, errorMsg });
            }} />
        </div>
        <div>
            <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">错误写入字段</div>
            <Input placeholder="例如 api.userError，留空仅写入 event.httpError" value={errorKey} onChange={(event) => {
                setErrorKey(event.target.value);
                emit({ url, method, auth, bearerToken, headersText, bodyText, responseKey, errorKey: event.target.value, successMsg, errorMsg });
            }} />
        </div>
        <div>
            <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">成功提示</div>
            <Input value={successMsg} placeholder="可选" onChange={(event) => {
                setSuccessMsg(event.target.value);
                emit({ url, method, auth, bearerToken, headersText, bodyText, responseKey, errorKey, successMsg: event.target.value, errorMsg });
            }} />
        </div>
        <div>
            <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">失败提示</div>
            <Input value={errorMsg} onChange={(event) => {
                setErrorMsg(event.target.value);
                emit({ url, method, auth, bearerToken, headersText, bodyText, responseKey, errorKey, successMsg, errorMsg: event.target.value });
            }} />
        </div>
    </div>
}
