/**
 * 通用文件下载工具函数
 * @param {string | Blob} content 下载文件内容（文本内容或 Blob 对象）
 * @param {string} fileName 下载后的文件名（包含后缀，如：处理记录_20260106.txt）
 * @param {string} fileType 文件 MIME 类型（默认：text/plain，可选：text/csv、application/json 等）
 * @returns {Promise<boolean>} 下载结果（成功 resolve true，失败 reject 错误信息）
 */
export function downloadFile(content, fileName, fileType = 'text/plain') {
  return new Promise((resolve, reject) => {
    try {
      // 1. 处理内容，统一转为 Blob 对象（兼容文本内容和直接传入 Blob 的场景）
      let blob;
      if (content instanceof Blob) {
        blob = content;
      } else {
        // 文本内容默认使用 UTF-8 编码，解决中文乱码问题
        blob = new Blob([content], { type: `${fileType};charset=utf-8;` });
      }

      // 2. 生成临时下载 URL
      const downloadUrl = window.URL.createObjectURL(blob);

      // 3. 创建临时 <a> 标签触发下载
      const aLink = document.createElement('a');
      aLink.href = downloadUrl;
      // 设置下载文件名（兼容浏览器中文文件名解析）
      aLink.download = encodeURIComponent(fileName).replace(/%20/g, ' ');
      aLink.style.display = 'none';

      // 4. 挂载到 DOM 并触发点击
      document.body.appendChild(aLink);
      aLink.click();

      // 5. 清理资源（避免内存泄漏）
      document.body.removeChild(aLink);
      window.URL.revokeObjectURL(downloadUrl);

      // 6. 下载成功回调
      resolve(true);
    } catch (error) {
      // 7. 下载失败回调
      reject(new Error(`文件下载失败：${error.message}`));
    }
  });
}

// 可选：导出默认对象，支持多种导入方式
export default {
  downloadFile
};