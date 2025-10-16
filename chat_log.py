import flask
import requests
import datetime
import os
import json
from werkzeug.datastructures import Headers

# 初始化 Flask 应用
app = flask.Flask(__name__)

# DeepSeek API 的基础 URL
DEEPSEEK_API_BASE_URL = "https://api.deepseek.com"

# 确保 logs 文件夹存在
if not os.path.exists("logs"):
    os.makedirs("logs")
    print("Created 'logs' directory.")

def fix_request_body(body):
    """
    检查并修复请求体中的不规范内容。
    目前主要用于修复 QwenCode 生成的错误 tool 定义。
    """
    if not isinstance(body, dict):
        return body

    tools = body.get("tools")
    if not isinstance(tools, list):
        return body

    # 遍历所有工具定义
    for tool in tools:
        if isinstance(tool, dict) and "function" in tool and isinstance(tool["function"], dict):
            func_def = tool["function"]
            # 找出所有不合规的键 (除了 'name', 'description', 'parameters')
            invalid_keys = [key for key in func_def if key not in ["name", "description", "parameters"]]
            if invalid_keys:
                print(f"Found and removing invalid keys in tool '{func_def.get('name')}': {invalid_keys}")
                # 移除这些不合规的键
                for key in invalid_keys:
                    del func_def[key]
    return body


@app.route("/<path:path>", methods=["POST"])
def proxy(path):
    """
    代理所有到 /v1/... 的 POST 请求
    """
    # 1. 准备转发请求
    deepseek_url = f"{DEEPSEEK_API_BASE_URL}/{path}"
    request_headers = {key: value for key, value in flask.request.headers if key.lower() != 'host'}
    request_data = flask.request.get_json()
    if not request_data:
        return flask.jsonify({"error": "Request body must be JSON"}), 400

    # 准备日志记录的请求部分 (记录修复前的内容)
    log_request_data = {
        "timestamp_start": datetime.datetime.now().isoformat(),
        "request": {
            "method": flask.request.method,
            "url": deepseek_url,
            "headers": dict(request_headers),
            "body": request_data.copy() # 复制一份用于日志
        }
    }

    # ★★★ 新增：修复请求体 ★★★
    try:
        fixed_request_data = fix_request_body(request_data)
    except Exception as e:
        print(f"Error fixing request body: {e}")
        fixed_request_data = request_data # 如果修复失败，则使用原始数据

    is_streaming = fixed_request_data.get("stream", False)

    try:
        # 2. 发送请求到 DeepSeek API (使用修复后的数据)
        response = requests.post(
            deepseek_url,
            headers=request_headers,
            json=fixed_request_data, # 使用修复后的数据
            stream=is_streaming,
            timeout=300
        )
        response.raise_for_status()

    except requests.exceptions.RequestException as e:
        error_message = f"Error forwarding request to DeepSeek API: {e}"
        print(error_message)
        log_data = {
            **log_request_data,
            "response": {"error": error_message},
            "timestamp_end": datetime.datetime.now().isoformat()
        }
        save_log(log_data)
        return flask.jsonify({"error": error_message}), 502

    # 3. 处理响应并返回给客户端
    excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
    response_headers = Headers()
    for key, value in response.headers.items():
        if key.lower() not in excluded_headers:
            response_headers.add(key, value)

    if is_streaming:
        def generate_and_log():
            response_chunks = []
            try:
                for chunk in response.iter_content(chunk_size=8192):
                    response_chunks.append(chunk)
                    yield chunk
            finally:
                response_body_str = b"".join(response_chunks).decode('utf-8', errors='ignore')
                log_response_data = {
                    "status_code": response.status_code,
                    "headers": dict(response.headers),
                    "body": response_body_str
                }
                log_data = {
                    **log_request_data,
                    "response": log_response_data,
                    "timestamp_end": datetime.datetime.now().isoformat()
                }
                save_log(log_data)
        return flask.Response(flask.stream_with_context(generate_and_log()), headers=response_headers)
    else:
        response_data = response.json()
        log_response_data = {
            "status_code": response.status_code,
            "headers": dict(response.headers),
            "body": response_data
        }
        log_data = {
            **log_request_data,
            "response": log_response_data,
            "timestamp_end": datetime.datetime.now().isoformat()
        }
        save_log(log_data)
        return flask.Response(json.dumps(response_data, ensure_ascii=False), status=response.status_code, headers=response_headers, mimetype='application/json')


def save_log(log_data):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S-%f")
    log_filename = os.path.join("logs", f"{timestamp}.json")
    try:
        with open(log_filename, "w", encoding="utf-8") as f:
            json.dump(log_data, f, indent=2, ensure_ascii=False)
        print(f"Log saved to {log_filename}")
    except Exception as e:
        print(f"Error saving log file {log_filename}: {e}")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, threaded=True)