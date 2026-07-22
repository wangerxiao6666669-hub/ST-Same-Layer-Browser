import { extension_settings, getContext } from "../../../extensions.js";

// 扩展唯一标记名称（需与文件夹名匹配）
const MODULE_NAME = "XINNET-Interactive-Browser";

// 1. 动态加载 HTML 结构
async function loadTemplate() {
    try {
        const response = await fetch(`/scripts/extensions/${MODULE_NAME}/template.html`);
        if (response.ok) {
            const html = await response.text();
            $('body').append(html);
        } else {
            console.error(`[${MODULE_NAME}] 无法加载 template.html`);
        }
    } catch (e) {
        console.error(`[${MODULE_NAME}] 加载模板失败:`, e);
    }
}

// 2. 在 SillyTavern 顶部栏注入“打开浏览器”按钮
function injectTopBarButton() {
    const btnHtml = `
        <div id="xinnet-nav-btn" class="drawer-icon fa-solid fa-mobile-screen-button interaction" title="打开 XINNET 浏览器"></div>
    `;
    // 插入到顶部右侧快捷工具栏中
    $('#extensions_button').before(btnHtml);
    $('#xinnet-nav-btn').on('click', () => {
        $('#xinnet-browser-overlay').removeClass('xinnet-hidden');
    });
}

// 3. 执行搜索的核心逻辑
async function performSilentSearch() {
    const inputEl = document.getElementById('browser-input');
    const query = inputEl ? inputEl.value.trim() : '';
    if (!query) return;

    const homeSection = document.getElementById('home-section');
    const resultsArea = document.getElementById('results-area');

    // UI 动画过渡
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
            // 测试备用数据
            aiResponse = `
            <xinnet_results>
            [Result|震惊！${query}的隐藏真相|揭秘关于${query}不为人知的秘密，专家表示这可能会改变一切...|深网吃瓜社区 - 10分钟前]
            [Result|关于${query}的深度解析|本文将从多个角度为您全面剖析${query}的历史渊源与未来发展。|知识维基 - 2小时前]
            </xinnet_results>`;
        }

        // 解析 <xinnet_results> 标签内的内容
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

            if (htmlOutput === '') {
                throw new Error("未解析到符合规范的结果");
            }
            resultsArea.innerHTML = htmlOutput;

        } else {
            resultsArea.innerHTML = `<div class="loading-indicator" style="color:#E63946;">数据解析失败，模型未遵循世界书协议输出。</div>`;
        }

    } catch (error) {
        resultsArea.innerHTML = `<div class="loading-indicator" style="color:#E63946;">链路中断或响应异常。</div>`;
        console.error(error);
    }
}

// 4. 事件初始化绑定
function bindEvents() {
    // 关闭按钮事件
    $(document).on('click', '#xinnet-close-btn', () => {
        $('#xinnet-browser-overlay').addClass('xinnet-hidden');
    });

    // 搜索按钮事件
    $(document).on('click', '#browser-search-btn', () => {
        performSilentSearch();
    });

    // 输入框回车绑定
    $(document).on('keypress', '#browser-input', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            performSilentSearch();
        }
    });
}

// 酒馆脚本启动入口
jQuery(async () => {
    await loadTemplate();
    injectTopBarButton();
    bindEvents();
});
