import { extension_settings, getContext } from "../../../extensions.js";

const MODULE_NAME = "ST-Same-Layer-Browser"; // 务必与你的 GitHub 仓库/文件夹名完全一致！

// 1. 打开与关闭手机UI（直接绑定在全局 window 上，确保随时能调）
window.openXinnetPhone = function() {
    console.log(`[${MODULE_NAME}] 正在尝试打开手机...`);
    const overlay = $('#xinnet-browser-overlay');
    if (overlay.length === 0) {
        console.error(`[${MODULE_NAME}] 未找到手机 DOM 节点 #xinnet-browser-overlay！请检查 template.html 是否成功加载。`);
        alert('手机界面未成功加载，请检查控制台 (F12)');
        return;
    }
    overlay.removeClass('xinnet-hidden').show();
    $('#browser-input').focus();
};

window.closeXinnetPhone = function() {
    $('#xinnet-browser-overlay').addClass('xinnet-hidden').hide();
};

// 2. 动态加载 HTML 结构
async function loadTemplate() {
    try {
        const response = await fetch(`/scripts/extensions/${MODULE_NAME}/template.html`);
        if (response.ok) {
            const html = await response.text();
            $('body').append(html);
            console.log(`[${MODULE_NAME}] template.html 注入成功！`);
        } else {
            console.error(`[${MODULE_NAME}] 无法加载 template.html，状态码:`, response.status);
        }
    } catch (e) {
        console.error(`[${MODULE_NAME}] 加载模板失败:`, e);
    }
}

// 3. 执行搜索的核心逻辑
async function performSilentSearch() {
    const inputEl = document.getElementById('browser-input');
    const query = inputEl ? inputEl.value.trim() : '';
    if (!query) return;

    const homeSection = document.getElementById('home-section');
    const resultsArea = document.getElementById('results-area');

    homeSection.classList.add('minimized');
    resultsArea.style.display = 'block';
    resultsArea.innerHTML = `
        <div class="loading-indicator">
            <div class="spinner"></div>
            正在检索 "${query}" ...
        </div>
    `;

    const command = `/gen 网页搜索：${query}`;

    try {
        let aiResponse = '';
        if (typeof window.triggerSlash === 'function') {
            aiResponse = await window.triggerSlash(command);
        } else {
            aiResponse = `
            <xinnet_results>
            [Result|震惊！${query}的隐藏真相|揭秘关于${query}不为人知的秘密...|深网社区 - 10分钟前]
            [Result|关于${query}的深度解析|本文将从多个角度剖析${query}...|知识维基 - 2小时前]
            </xinnet_results>`;
        }

        const resultBlockMatch = aiResponse.match(/<xinnet_results>([\s\S]*?)<\/xinnet_results>/);

        if (resultBlockMatch && resultBlockMatch[1]) {
            const rawResults = resultBlockMatch[1];
            let htmlOutput = '';

            const regex = /\[Result\|(.*?)\|(.*?)\|(.*?)\]/g;
            let match;

            while ((match = regex.exec(rawResults)) !== null) {
                const title = match[1].trim();
                const snippet = match[2].trim();
                const meta = match[3].trim();

                htmlOutput += `
                <div class="post-item" onclick="alert('即将打开: ${title}')">
                    <div class="post-title">${title}</div>
                    <div class="post-snippet">${snippet}</div>
                    <div class="post-meta">${meta}</div>
                </div>`;
            }

            if (htmlOutput === '') throw new Error("解析失败");
            resultsArea.innerHTML = htmlOutput;

        } else {
            resultsArea.innerHTML = `<div class="loading-indicator" style="color:#E63946;">数据解析失败，模型未按规范输出。</div>`;
        }

    } catch (error) {
        resultsArea.innerHTML = `<div class="loading-indicator" style="color:#E63946;">链路中断或响应异常。</div>`;
        console.error(error);
    }
}

// 4. 事件注册逻辑
function bindEvents() {
    $(document).on('click', '#xinnet-close-btn', function() {
        window.closeXinnetPhone();
    });

    $(document).on('click', '#browser-search-btn', function() {
        performSilentSearch();
    });

    $(document).on('keypress', '#browser-input', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            performSilentSearch();
        }
    });
}

// 5. 延迟注册斜杠命令（解决酒馆组件尚未准备好的问题）
function registerSlashCommand() {
    if (window.SillyTavern && window.SillyTavern.SlashCommandParser) {
        window.SillyTavern.SlashCommandParser.addCommandObject({
            name: 'phone',
            callback: () => {
                window.openXinnetPhone();
                return '';
            },
            helpString: '打开 XINNET 拟真同层手机浏览器',
        });
        console.log(`[${MODULE_NAME}] /phone 指令注册成功！`);
    } else {
        // 如果还没准备好，轮询等待 500ms 重试
        setTimeout(registerSlashCommand, 500);
    }
}

// 启动入口
jQuery(async () => {
    await loadTemplate();
    bindEvents();
    registerSlashCommand();
});
