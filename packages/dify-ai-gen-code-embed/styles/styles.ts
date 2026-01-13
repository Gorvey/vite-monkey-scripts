GM_addStyle(`
.dify-ai-embed-trigger {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 10000;
  padding: 10px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.dify-ai-embed-trigger:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.dify-ai-embed-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 500px;
  max-width: 90vw;
  max-height: 80vh;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  z-index: 10001;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.dify-ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.dify-ai-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.dify-ai-close {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.dify-ai-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.dify-ai-content {
  padding: 20px;
}

.dify-ai-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}

.dify-ai-input:focus {
  border-color: #667eea;
}

.dify-ai-actions {
  display: flex;
  gap: 10px;
  margin: 16px 0;
}

.dify-ai-generate,
.dify-ai-clear {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.dify-ai-generate {
  background: #667eea;
  color: white;
}

.dify-ai-generate:hover {
  background: #5a6fd8;
}

.dify-ai-clear {
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
}

.dify-ai-clear:hover {
  background: #e9ecef;
}

.dify-ai-output {
  margin-top: 16px;
}

.dify-ai-output-header {
  font-weight: 600;
  margin-bottom: 8px;
  color: #495057;
}

.dify-ai-result {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 12px;
  font-size: 13px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 300px;
  overflow-y: auto;
  margin: 0;
  color: #212529;
}

.dify-ai-result:empty {
  display: none;
}

/* dify AI 代码生成按钮样式 */
#dify-ai-gen-code-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  padding: 12px 20px;
  background-color: #155EEF;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(21, 94, 239, 0.3);
  transition: all 0.3s ease;
}

#dify-ai-gen-code-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(21, 94, 239, 0.4);
}

/* 修改iframe容器样式的示例 */
iframe[src*="udify.app"] {
  /* 可以修改iframe本身的样式 */
  border-radius: 12px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12) !important;
  border: 2px solid #e1e5e9 !important;
}

/* 如果iframe有父容器，可以修改容器 */
.dify-iframe-container {
  /* 容器背景 */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 4px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

/* 修改页面整体布局来适配iframe */
body:has(iframe[src*="udify.app"]) {
  /* 当存在dify iframe时调整页面布局 */
  padding-right: 420px; /* 为iframe让出空间 */
}

/* 使用CSS transform缩放iframe */
iframe[src*="udify.app"] {
  transform: scale(0.8);
  transform-origin: top left;
}
`)
